import unittest
from concurrent.futures import ThreadPoolExecutor
from app.adapters.firestore import MemoryStore
from app.domains.profile import ProfileService
from app.core.errors import DomainError


class Identity:
    def get(self, uid):
        return {"email": "john@example.com", "phone_number": None, "photo_url": None,
                "auth_display_name": "John", "providers": ["google.com"], "email_verified": True}


class ProfileTests(unittest.TestCase):
    def setUp(self):
        self.store = MemoryStore()
        self.service = ProfileService(self.store, Identity())

    def test_first_login_is_incomplete_and_returning_login_is_same_profile(self):
        first = self.service.get("user-a")
        self.assertTrue(first["is_new_profile"])
        self.assertFalse(first["profile_complete"])
        complete = self.service.update("user-a", {"display_name": "John", "region": "IN", "expected_version": 0})
        self.assertTrue(complete["profile_complete"])
        self.assertEqual(first["created_at"], complete["created_at"])
        self.assertFalse(self.service.get("user-a")["is_new_profile"])
        self.assertNotIn("email", self.store.get("users/user-a"))

    def test_concurrent_creation_creates_one_uid_document(self):
        with ThreadPoolExecutor(max_workers=8) as executor:
            results = list(executor.map(lambda _: self.service.get("user-a"), range(16)))
        self.assertEqual(1, sum(r["is_new_profile"] for r in results))
        self.assertEqual(1, len(self.store.list("users", "user-a")))

    def test_privileged_contact_and_completion_fields_are_not_client_writable(self):
        self.service.get("user-a")
        for field in ("uid", "roles", "email", "phone_number", "profile_complete", "created_at"):
            with self.assertRaises(DomainError):
                self.service.update("user-a", {"display_name": "John", "region": "IN", "expected_version": 0, field: "forged"})
        self.assertFalse(self.store.get("users/user-a")["profile_complete"])

    def test_conflicting_update_and_cross_uid_do_not_overwrite(self):
        self.service.get("user-a")
        draft = {"display_name": "John", "region": "IN", "expected_version": 0}
        self.service.update("user-a", draft)
        with self.assertRaises(DomainError) as error:
            self.service.update("user-a", {**draft, "display_name": "Other"})
        self.assertEqual("PROFILE_CONFLICT", error.exception.code)
        with self.assertRaises(DomainError):
            self.service.update("user-b", draft)
        self.assertEqual("John", self.store.get("users/user-a")["display_name"])

    def test_validation_failure_never_completes_enrollment(self):
        self.service.get("user-a")
        for name, region in (("", "IN"), ("J", "IN"), ("John", "india"), ("J\nX", "IN")):
            with self.assertRaises(DomainError):
                self.service.update("user-a", {"display_name": name, "region": region, "expected_version": 0})
        self.assertFalse(self.store.get("users/user-a")["profile_complete"])

    def test_legacy_profile_uses_uid_document_path_and_hides_privileged_fields(self):
        self.store.set("users/user-a", {"display_name": "John", "region": "IN", "roles": ["ADMIN"]})
        result = self.service.get("user-a")
        self.assertEqual("user-a", result["uid"])
        self.assertNotIn("roles", result)
        self.assertFalse(result["profile_complete"])

    def test_identity_outage_cannot_commit_a_failed_save(self):
        self.service.get("user-a")
        class UnavailableIdentity:
            def get(self, uid):
                raise RuntimeError("test-only simulated identity outage")
        self.service.identity = UnavailableIdentity()
        with self.assertRaises(RuntimeError):
            self.service.update("user-a", {"display_name": "John", "region": "IN", "expected_version": 0})
        self.assertFalse(self.store.get("users/user-a")["profile_complete"])
        self.assertEqual(0, self.store.get("users/user-a")["version"])

    def test_retry_after_commit_before_request_guard_finish_does_not_save_twice(self):
        self.service.get("user-a")
        draft = {"display_name": "John", "region": "IN", "expected_version": 0}
        first = self.service.update("user-a", draft, "test-server-operation")
        replay = self.service.update("user-a", draft, "test-server-operation")
        self.assertEqual(first, replay)
        self.assertEqual(1, self.store.get("users/user-a")["version"])
        self.assertNotIn("profile_operation_id", replay)
