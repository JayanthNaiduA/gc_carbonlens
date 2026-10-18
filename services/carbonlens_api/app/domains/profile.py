"""UID-owned operational profiles. Verified contact data stays in Firebase Auth."""
import re
from datetime import datetime, timezone
from app.core.errors import require


class FirebaseIdentityProfile:
    def get(self, uid):
        from firebase_admin import auth
        user = auth.get_user(uid)
        return {"email": user.email, "phone_number": user.phone_number,
                "photo_url": user.photo_url, "auth_display_name": user.display_name,
                "email_verified": user.email_verified,
                "providers": sorted({p.provider_id for p in user.provider_data})}


class ProfileService:
    def __init__(self, store, identity=None):
        self.store, self.identity = store, identity or FirebaseIdentityProfile()

    @staticmethod
    def _response(uid, record, identity, created=False):
        # The document path establishes ownership even for older records without a uid field.
        contacts = {k: identity.get(k) for k in
                    ("email", "phone_number", "photo_url", "email_verified", "providers")}
        return {**{k: record.get(k) for k in ("display_name", "region", "created_at", "updated_at")},
                "uid": uid, "version": record.get("version", 0),
                "profile_complete": record.get("profile_complete") is True,
                "is_new_profile": created, **contacts}

    def get(self, uid):
        identity = self.identity.get(uid)
        def ensure(tx):
            record = tx.get(f"users/{uid}")
            created = record is None
            if created:
                stamp = datetime.now(timezone.utc).isoformat()
                record = {"uid": uid, "display_name": identity.get("auth_display_name") or "",
                          "region": "", "profile_complete": False, "status": "ACTIVE",
                          "created_at": stamp, "updated_at": stamp, "version": 0}
                tx.set(f"users/{uid}", record)
            require(record.get("status", "ACTIVE") == "ACTIVE", "ACCOUNT_UNAVAILABLE", "This account is not available.", 403)
            return record, created
        record, created = self.store.atomic(ensure)
        return self._response(uid, record, identity, created)

    def update(self, uid, draft, operation_id=None):
        require(set(draft) == {"display_name", "region", "expected_version"}, "INVALID_PROFILE_FIELDS",
                "Only display name and region can be edited. Verified contact details use Firebase verification.")
        name, region = draft["display_name"], draft["region"]
        require(isinstance(name, str) and 2 <= len(name.strip()) <= 80
                and not any(ord(c) < 32 for c in name), "INVALID_PROFILE_NAME", "Enter a name with 2 to 80 characters.")
        require(isinstance(region, str) and re.fullmatch(r"[A-Z]{2}", region),
                "INVALID_PROFILE_REGION", "Choose a two-letter country/region code.")
        version = draft["expected_version"]
        require(isinstance(version, int) and not isinstance(version, bool) and version >= 0,
                "INVALID_PROFILE_VERSION", "Refresh your profile before saving.")
        # Resolve remote identity before committing. A subsequent identity outage must
        # not turn an already committed profile save into a failed/replayed mutation.
        identity = self.identity.get(uid)
        def save(tx):
            record = tx.get(f"users/{uid}")
            require(record is not None, "PROFILE_NOT_FOUND", "Load your profile before saving.", 404)
            require(record.get("status", "ACTIVE") == "ACTIVE", "ACCOUNT_UNAVAILABLE", "This account is not available.", 403)
            if operation_id and record.get("profile_operation_id") == operation_id:
                return record
            require(record.get("version", 0) == version, "PROFILE_CONFLICT", "Your profile changed elsewhere. Reload before saving.", 409)
            updated = {**record, "display_name": name.strip(), "region": region, "profile_complete": True,
                       "updated_at": datetime.now(timezone.utc).isoformat(), "version": version + 1}
            if operation_id:
                updated["profile_operation_id"] = operation_id
            tx.set(f"users/{uid}", updated)
            return updated
        updated = self.store.atomic(save)
        return self._response(uid, updated, identity)
