"""Dependency-free WSGI API; Google SDK boundaries are lazy and fail closed."""
import json
import os
import re
import time
from pathlib import Path
from urllib.parse import parse_qs
from uuid import uuid4
from app.adapters.firestore import UnavailableStore
from app.core.errors import DomainError, require
from app.domains.carbon.repository import ReferenceRepository
from app.domains.platform import Platform
from app.http.middleware import IdentityVerifier, mutation_key
from app.core.logging import access


class Application:
    def __init__(self, platform=None, verifier=None, allowed_origins=()):
        root = Path(__file__).resolve().parents[3] / "data"
        self.platform = platform or Platform(UnavailableStore(), ReferenceRepository.load(root))
        self.verifier = verifier or IdentityVerifier()
        self.allowed_origins = set(allowed_origins)

    def __call__(self, environ, start_response):
        started = time.monotonic()
        request_id = environ.get("HTTP_X_REQUEST_ID", "")
        if not re.fullmatch(r"[A-Za-z0-9_-]{1,128}", request_id):
            request_id = str(uuid4())
        headers = {k[5:].lower().replace("_", "-"): v for k, v in environ.items() if k.startswith("HTTP_")}
        method, path = environ.get("REQUEST_METHOD", "GET"), environ.get("PATH_INFO", "/")
        cors = []
        if headers.get("origin") in self.allowed_origins:
            cors = [("Access-Control-Allow-Origin", headers["origin"]), ("Vary", "Origin")]
        status, output = 200, {}
        try:
            if method == "OPTIONS":
                require(bool(cors), "ORIGIN_FORBIDDEN", "Origin is not allowed.", 403)
                cors += [("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS"),
                         ("Access-Control-Allow-Headers", "Authorization, X-Firebase-AppCheck, X-Request-Id, Idempotency-Key, Content-Type")]
            elif method == "GET" and path in ("/health", "/version"):
                output = {"status": "ok", "version": "0.2.0", "git_sha": os.environ.get("BUILD_GIT_SHA", "unconfigured"),
                          "reward_policy_version": os.environ.get("REWARD_POLICY_VERSION", "demo-v1")}
            else:
                uid = self.verifier.verify(headers)
                draft = {}
                if method in ("POST", "PUT"):
                    require(environ.get("CONTENT_TYPE", "").split(";")[0] == "application/json", "CONTENT_TYPE_REQUIRED", "Send JSON input.", 415)
                    try:
                        length = int(environ.get("CONTENT_LENGTH", "0"))
                    except ValueError:
                        raise DomainError("INVALID_INPUT", "Invalid content length.")
                    require(0 < length <= 65536, "PAYLOAD_TOO_LARGE", "Request must contain at most 64 KiB of JSON.", 413)
                    try:
                        draft = json.loads(environ["wsgi.input"].read(length), parse_constant=lambda _: (_ for _ in ()).throw(ValueError()))
                    except (ValueError, UnicodeError):
                        raise DomainError("INVALID_JSON", "Send a valid JSON object.")
                    require(isinstance(draft, dict), "INVALID_INPUT", "Send a JSON object.")
                    key = mutation_key(headers)
                    query = parse_qs(environ.get("QUERY_STRING", ""))
                    output = self.platform.idempotent(uid, key, path, draft,
                        lambda resource_id: self.platform.handle(method, path, uid, draft, query, resource_id))
                    status = 201 if method == "POST" and path in ("/v1/scans", "/v1/green-events", "/v1/grow-green/projects") else 200
                else:
                    output = self.platform.handle(method, path, uid, draft, parse_qs(environ.get("QUERY_STRING", "")), None)
        except DomainError as error:
            status, output = error.status, error.envelope(request_id)
        except Exception:
            status, output = 500, DomainError("INTERNAL_ERROR", "The request could not finish.", 500, True).envelope(request_id)
        payload = json.dumps(output, allow_nan=False, separators=(",", ":")).encode()
        access(request_id, path, status, (time.monotonic() - started) * 1000)
        reasons = {200: "OK", 201: "Created", 400: "Bad Request", 401: "Unauthorized", 403: "Forbidden",
                   404: "Not Found", 409: "Conflict", 413: "Payload Too Large", 415: "Unsupported Media Type",
                   422: "Unprocessable Entity", 500: "Internal Server Error", 503: "Service Unavailable"}
        start_response(f"{status} {reasons.get(status, 'Error')}", [("Content-Type", "application/json"),
                       ("Content-Length", str(len(payload))), ("X-Request-Id", request_id), ("Cache-Control", "no-store"), *cors])
        return [payload]


def create_application():
    if os.environ.get("CARBONLENS_CLOUD_RUNTIME") == "1":
        from app.core.runtime import cloud_platform
        return Application(cloud_platform(), allowed_origins=os.environ.get("ALLOWED_ORIGINS", "").split(","))
    return Application()


application = create_application()

if __name__ == "__main__":
    from wsgiref.simple_server import make_server
    # Starting this command requires the repository's service-start approval.
    with make_server("127.0.0.1", int(os.environ.get("PORT", "8081")), application) as server:
        server.serve_forever()
