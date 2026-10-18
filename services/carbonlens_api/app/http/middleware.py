import re
from app.core.errors import DomainError, require


class IdentityVerifier:
    """Configured Firebase Admin SDK required; failure is always closed."""
    def verify(self, headers):
        authorization = headers.get("authorization", "")
        require(authorization.startswith("Bearer ") and len(authorization) > 7,
                "UNAUTHENTICATED", "Sign in to continue.", 401)
        require(headers.get("x-firebase-appcheck"), "APP_CHECK_REQUIRED", "App verification is required.", 403)
        try:
            from firebase_admin import auth, app_check
        except ImportError:
            raise DomainError("DEPENDENCY_UNAVAILABLE", "Identity verification is not configured.", 503, True)
        try:
            user = auth.verify_id_token(authorization[7:], check_revoked=True)
        except Exception:
            raise DomainError("UNAUTHENTICATED", "Your session has expired. Sign in again.", 401)
        try:
            app_check.verify_token(headers["x-firebase-appcheck"])
        except Exception:
            raise DomainError("APP_CHECK_INVALID", "App verification failed.", 403)
        return user["uid"]


def mutation_key(headers):
    key = headers.get("idempotency-key", "")
    require(re.fullmatch(r"[A-Za-z0-9_-]{1,128}", key) is not None,
            "IDEMPOTENCY_KEY_REQUIRED", "A stable operation identifier is required.")
    return key


def consent(store, uid, scope):
    record = store.get(f"consents/{uid}") or {}
    require(record.get(scope) is True, "CONSENT_REQUIRED", f"Enable {scope.replace('_', ' ')} consent for this action.", 403)
