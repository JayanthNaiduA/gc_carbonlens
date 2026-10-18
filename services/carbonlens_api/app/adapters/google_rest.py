"""Google REST transport using attached Cloud Run identity, never key files."""
import json
import time
from urllib.request import Request, urlopen
from urllib.request import build_opener, HTTPRedirectHandler
from urllib.parse import urlparse
from urllib.error import HTTPError, URLError
from app.core.errors import DomainError, require


class GoogleRest:
    def __init__(self):
        self.token = None
        self.expires = 0

    def access_token(self):
        if time.time() < self.expires:
            return self.token
        try:
            request = Request("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
                              headers={"Metadata-Flavor": "Google"})
            with urlopen(request, timeout=3) as response:
                result = json.load(response)
            self.token = result["access_token"]
            self.expires = time.time() + result["expires_in"] - 60
            return self.token
        except Exception:
            raise DomainError("DEPENDENCY_UNAVAILABLE", "Attached Google service identity is unavailable.", 503, True)

    def request(self, url, body=None, timeout=8, binary=False):
        parsed = urlparse(url)
        require(parsed.scheme == "https" and parsed.hostname and parsed.hostname.endswith(".googleapis.com")
                and not parsed.username and not parsed.password and parsed.port in (None, 443),
                "INVALID_CONFIGURATION", "Unsupported Google service address.", 503)
        request = Request(url, data=None if body is None else json.dumps(body).encode(),
                          headers={"Authorization": "Bearer " + self.access_token(), "Content-Type": "application/json"})
        try:
            class NoRedirect(HTTPRedirectHandler):
                def redirect_request(self, req, fp, code, msg, headers, newurl):
                    return None
            with build_opener(NoRedirect()).open(request, timeout=timeout) as response:
                return response.read() if binary else json.load(response)
        except (HTTPError, URLError, TimeoutError):
            raise DomainError("DEPENDENCY_UNAVAILABLE", "A Google service could not finish this request.", 503, True)
