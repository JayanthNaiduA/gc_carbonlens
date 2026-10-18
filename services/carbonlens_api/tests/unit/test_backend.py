"""Offline fixtures are intentionally unrelated to production reference datasets."""
import io
import json
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timezone
from app.adapters.firestore import MemoryStore
from app.core.errors import DomainError
from app.domains.carbon.engine import CarbonEngine
from app.domains.carbon.repository import ReferenceRepository
from app.domains.carbon.score import score_product
from app.domains.rewards.ledger import RewardLedger
from app.domains.rewards.policy import evaluate
from app.domains.trust.service import verify
from app.domains.ai.orchestrator import AIOrchestrator
from app.domains.green_move.service import validate_trip
from app.domains.grow_green.service import validate_checkin, validate_confirmation
from app.domains.recycle_red.service import validate_document
from app.domains.platform import Platform
from app.main import Application


def factor(category="test", unit="item", value=.2):
    return {"category": category, "activity_unit": unit, "kg_co2e_per_unit": value,
            "factor_id": "test-factor", "factor_set_version": "test-v1", "region": "GLOBAL",
            "effective_from": "2020-01-01", "effective_to": "", "source_name": "TEST ONLY",
            "source_url": "https://example.com/test-only", "lifecycle_boundary": "test-boundary", "confidence_grade": "C"}


def policy():
    return {"version": "test-v1", "caps": {"daily": 100, "monthly": 200}, "segments": {
        action: {"base_action_points": 100, "impact_scale": 50, "verification_factors": {"V2": .75, "V3": 1},
                 "caps": {"per_event": 90}, "persistence": {"DAY_0": .1, "DAY_30": .15, "DAY_90": .2, "DAY_180": .25, "DAY_365": .3}}
        for action in ("GO_GREEN_PRODUCT", "GREEN_MOVE", "GROW_GREEN", "RECYCLE_RED")}}


def event(event_id="test-event", action="GO_GREEN_PRODUCT"):
    return {"event_id": event_id, "uid": "test-user", "action_type": action,
            "verification": {"level": "V3", "reason_codes": ["TEST_EVIDENCE"]}, "confidence": 1,
            "fraud_flags": [], "impact": {"value": 50}, "checkpoint": "DAY_0", "reward_state": "PENDING"}


class CarbonTests(unittest.TestCase):
    def test_deterministic_trace_and_unit_conversion(self):
        engine = CarbonEngine([factor(unit="kg", value=2)])
        result = engine.estimate("test", 500, "g")
        self.assertEqual(1, result.estimated_kg_co2e)
        self.assertEqual("test-v1", result.factor_set_version)
        self.assertEqual(result, engine.estimate("test", 500, "g"))

    def test_missing_expired_or_incompatible_never_fabricates(self):
        for factors, unit in (([], "item"), ([{**factor(), "effective_to": "2021-01-01"}], "item"), ([factor()], "km")):
            with self.assertRaises(DomainError):
                CarbonEngine(factors).estimate("test", 1, unit)

    def test_nonfinite_negative_or_boolean_rejected(self):
        for quantity in (float("nan"), float("inf"), -1, True):
            with self.assertRaises(DomainError):
                CarbonEngine([factor()]).estimate("test", quantity)

    def test_transport_has_no_avoidance_without_counterfactual(self):
        engine = CarbonEngine([factor("car", "km", .2), factor("walk", "km", 0), factor("worse", "km", .5)])
        self.assertIsNone(engine.transport("car", "walk", 2).avoided_kg_co2e)
        self.assertEqual(.4, engine.transport("car", "walk", 2, True).avoided_kg_co2e)
        self.assertEqual(0, engine.transport("car", "worse", 2, True).avoided_kg_co2e)

    def test_score_bounds_weights_and_missing_data_rule(self):
        dims = {"carbon_intensity": 100, "reusability": 0, "packaging": 0, "recyclability": 0, "durability": 0}
        self.assertEqual(40, score_product(dims).score)
        self.assertEqual(100, score_product(dict.fromkeys(dims, 100)).score)
        with self.assertRaises(DomainError):
            score_product({"carbon_intensity": 100})
        with self.assertRaises(DomainError):
            score_product({**dims, "reusability": 101})


class RewardTests(unittest.TestCase):
    def setUp(self):
        self.store = MemoryStore()
        self.store.set("green_events/test-event", event())
        self.ledger = RewardLedger(self.store, policy())

    def test_concurrent_replay_credits_once(self):
        with ThreadPoolExecutor(max_workers=8) as workers:
            results = list(workers.map(lambda _: self.ledger.post_once("test-user", "test-event"), range(32)))
        self.assertTrue(all(r == results[0] for r in results))
        self.assertEqual(90, self.store.get("reward_wallets/test-user")["available_points"])
        self.assertEqual(1, len(self.store.list("reward_ledger", "test-user")))

    def test_daily_cap_is_atomic_across_events(self):
        self.store.set("green_events/second", event("second"))
        with ThreadPoolExecutor(max_workers=2) as workers:
            results = list(workers.map(lambda eid: self.ledger.post_once("test-user", eid), ["test-event", "second"]))
        self.assertEqual(100, sum(r["points"] for r in results))

    def test_owner_only_and_missing_policy(self):
        with self.assertRaises(DomainError):
            self.ledger.post_once("other", "test-event")
        with self.assertRaises(DomainError):
            RewardLedger(self.store, {}).post_once("test-user", "test-event")
        self.assertIsNone(self.store.get("reward_wallets/test-user"))

    def test_reversal_is_compensating_and_idempotent(self):
        self.ledger.post_once("test-user", "test-event")
        first = self.ledger.reverse_once("test-user", "test-event")
        self.assertEqual(first, self.ledger.reverse_once("test-user", "test-event"))
        self.assertEqual(90, self.store.get("reward_ledger/test-event")["points_delta"])
        self.assertEqual(0, self.store.get("reward_wallets/test-user")["available_points"])

    def test_grow_provisional_and_v0_no_reward(self):
        decision = evaluate(event(action="GROW_GREEN"), policy())
        self.assertEqual("PROVISIONAL", decision["state"])
        self.assertEqual(10, decision["points"])
        value = event()
        value["verification"]["level"] = "V0"
        self.assertEqual(0, evaluate(value, policy())["points"])

    def test_verification_fraud_and_signal_levels(self):
        self.assertEqual("V0", verify({})["level"])
        self.assertEqual("V1", verify({"photo": True})["level"])
        self.assertEqual("V2", verify({"photo": True, "receipt": True})["level"])
        self.assertEqual("V0", verify({"photo": True, "receipt": True}, ["DUPLICATE"])["level"])


class PillarTests(unittest.TestCase):
    def test_move_rejects_exercise_speed_and_replay(self):
        session = {"session_id": "s", "start": "2026-10-14T10:00:00+00:00", "end": "2026-10-14T11:00:00+00:00", "distance_km": 4, "mode": "WALK", "baseline_match": True}
        self.assertEqual(4, validate_trip(session, {"normal_mode": "CAR"}))
        for change, baseline, history in (({}, None, []), ({"distance_km": 90}, {"normal_mode": "CAR"}, []), ({}, {"normal_mode": "CAR"}, [session])):
            with self.assertRaises(DomainError):
                validate_trip({**session, **change}, baseline, history)

    def test_grow_freshness_due_proximity_and_self_confirmation(self):
        project = {"created_at": "2026-09-01T00:00:00+00:00"}
        evidence = {"checkpoint": "DAY_30", "captured_at": "2026-10-14T10:00:00+00:00", "distance_to_plot_m": 20, "media_hash": "fresh"}
        current = datetime(2026, 10, 14, 11, tzinfo=timezone.utc)
        self.assertEqual("PROVISIONAL", validate_checkin(project, evidence, current=current))
        for changes in ({"checkpoint": "DAY_365"}, {"distance_to_plot_m": 500}, {"captured_at": "2026-10-10T10:00:00+00:00"}):
            with self.assertRaises(DomainError):
                validate_checkin(project, {**evidence, **changes}, current=current)
        with self.assertRaises(DomainError):
            validate_confirmation("owner", "owner")

    def test_recycler_requires_sourced_active_registry(self):
        document = {"recycler_id": "r", "fingerprint": "f", "date": "2026-10-14", "weight_kg": 1}
        with self.assertRaises(DomainError):
            validate_document(document, [], "laptop", date(2026, 10, 14))
        registry = [{"recycler_id": "r", "active": True, "verification_source": "TEST ONLY", "accepted_categories": ["laptop"]}]
        self.assertEqual("r", validate_document(document, registry, "laptop", date(2026, 10, 14))["recycler_id"])


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.store = MemoryStore()
        refs = ReferenceRepository(factors=[factor()], policies=[policy()])
        class TestProfileIdentity:
            def get(self, uid):
                return {"email": None, "phone_number": None, "photo_url": None, "auth_display_name": "John", "providers": ["google.com"], "email_verified": True}
        self.platform = Platform(self.store, refs, "test-v1", profile_identity=TestProfileIdentity())
        class TestIdentity:
            def verify(self, headers):
                if headers.get("authorization") != "Bearer TEST_ONLY" or headers.get("x-firebase-appcheck") != "TEST_ONLY":
                    raise DomainError("UNAUTHENTICATED", "Test credentials missing", 401)
                return "test-user"
        self.application = Application(self.platform, TestIdentity())

    def request(self, path, method="GET", body=None, key="test-key", authenticated=True):
        payload = json.dumps(body).encode() if body is not None else b""
        environ = {"PATH_INFO": path, "REQUEST_METHOD": method, "CONTENT_TYPE": "application/json", "CONTENT_LENGTH": str(len(payload)), "wsgi.input": io.BytesIO(payload), "HTTP_IDEMPOTENCY_KEY": key}
        if authenticated:
            environ.update(HTTP_AUTHORIZATION="Bearer TEST_ONLY", HTTP_X_FIREBASE_APPCHECK="TEST_ONLY")
        status = []
        output = self.application(environ, lambda value, headers: status.append(value))
        return int(status[0][:3]), json.loads(b"".join(output))

    def test_health_public_protected_fail_closed(self):
        self.assertEqual(200, self.request("/health", authenticated=False)[0])
        self.assertEqual(401, self.request("/v1/me", authenticated=False)[0])
        self.assertEqual("test-user", self.request("/v1/me")[1]["uid"])

    def test_profile_api_replay_and_allowlist_preserve_owner(self):
        self.request("/v1/me")
        draft = {"display_name": "John", "region": "IN", "expected_version": 0}
        first = self.request("/v1/me", "PUT", draft, key="profile-save")
        self.assertEqual(200, first[0])
        self.assertTrue(first[1]["profile_complete"])
        self.assertEqual(first, self.request("/v1/me", "PUT", draft, key="profile-save"))
        self.assertEqual(1, self.store.get("users/test-user")["version"])
        forged = self.request("/v1/me", "PUT", {**draft, "uid": "other-user"}, key="forged-owner")
        self.assertEqual(400, forged[0])
        self.assertIsNone(self.store.get("users/other-user"))

    def test_consent_identity_validation_replay_and_conflict(self):
        body = {"uid": "attacker", "policy_version": "prototype-consent-v1", "camera": True}
        first = self.request("/v1/consents", "PUT", body)
        self.assertEqual("test-user", first[1]["uid"])
        self.assertEqual(first, self.request("/v1/consents", "PUT", body))
        self.assertEqual(409, self.request("/v1/consents", "PUT", {**body, "camera": False})[0])
        self.assertEqual(400, self.request("/v1/consents", "PUT", {**body, "camera": "yes"}, key="different")[0])

    def test_no_factor_no_fake_success_and_no_client_points(self):
        self.assertEqual(422, self.request("/v1/carbon/estimate", "POST", {"category": "missing"})[0])
        self.assertEqual(422, self.request("/v1/green-events", "POST", {"action_type": "GREEN_MOVE", "points": 5000}, key="another")[0])

    def test_scan_requires_consent_before_dependency(self):
        status, error = self.request("/v1/scans", "POST", {"mode": "PRODUCT", "storage_object": "users/test-user/scans/photo.jpg"})
        self.assertEqual(403, status)
        self.assertEqual("CONSENT_REQUIRED", error["error"]["code"])

    def test_self_declared_baseline_does_not_issue_normal_rewards(self):
        dims = dict.fromkeys(("carbon_intensity", "reusability", "packaging", "recyclability", "durability"), 90)
        self.platform.references.products = [{"product_ref": "baseline", "category": "test", "dimensions": dict.fromkeys(dims, 10)}, {"product_ref": "replacement", "category": "test", "dimensions": dims}]
        for scan_id, mode in (("product", "PRODUCT"), ("receipt", "RECEIPT")):
            self.store.set(f"scans/{scan_id}", {"uid": "test-user", "mode": mode, "product_candidate": {"product_ref": "replacement"}, "document_verified": mode == "RECEIPT", "evidence_hash": scan_id})
        result = self.platform.product_event("test-user", {"subject": {"baseline_ref": "baseline", "actual_ref": "replacement"}, "evidence_refs": ["scans/product", "scans/receipt"]}, "event-without-baseline")
        self.assertEqual("V1", result["verification"]["level"])
        self.assertEqual(0, self.platform.ledger.post_once("test-user", result["event_id"])["points"])

    def test_full_injected_scan_event_reward_wallet_path(self):
        dims = dict.fromkeys(("carbon_intensity", "reusability", "packaging", "recyclability", "durability"), 90)
        self.platform.references.products = [{"product_ref": "baseline", "category": "test", "dimensions": dict.fromkeys(dims, 10)}, {"product_ref": "replacement", "category": "test", "dimensions": dims}]
        self.store.set("consents/test-user", {"camera": True})
        class Evidence:
            def read(self, path):
                return path.encode()
        class Vision:
            def identify(self, content, mode):
                return {"product_ref": "baseline" if b"baseline.jpg" in content else "replacement", "confidence": .8, "document_verified": mode == "RECEIPT", "document_fingerprint": "normalized-purchase" if mode == "RECEIPT" else None}
        self.platform.scan.evidence, self.platform.scan.vision = Evidence(), Vision()
        product = self.request("/v1/scans", "POST", {"mode": "PRODUCT", "storage_object": "users/test-user/scans/a.jpg"}, key="product")[1]
        baseline = self.request("/v1/scans", "POST", {"mode": "PRODUCT", "storage_object": "users/test-user/scans/baseline.jpg"}, key="baseline")[1]
        receipt = self.request("/v1/scans", "POST", {"mode": "RECEIPT", "storage_object": "users/test-user/scans/b.jpg"}, key="receipt")[1]
        draft = {"action_type": "GO_GREEN_PRODUCT", "subject": {"baseline_ref": "baseline", "actual_ref": "replacement"}, "evidence_refs": ["scans/" + baseline["scan_id"], "scans/" + product["scan_id"], "scans/" + receipt["scan_id"]], "confidence": 1, "points": 9999}
        status, result = self.request("/v1/green-events", "POST", draft, key="event")
        self.assertEqual(201, status)
        decision = self.request("/v1/rewards/evaluate", "POST", {"event_id": result["event_id"]}, key="reward")[1]
        self.assertEqual(60, decision["points"])
        self.assertEqual(60, self.request("/v1/wallet")[1]["available_points"])
        self.assertEqual(409, self.request("/v1/green-events", "POST", draft, key="duplicate")[0])


class AiTests(unittest.TestCase):
    def test_unavailable_invalid_or_extra_authority_fields_fall_back(self):
        scan = {"product_candidate": {}, "carbon": {}, "sustainability": {}}
        self.assertTrue(AIOrchestrator().explain(scan)["fallback"])
        class Broken:
            def explain(self, context, timeout):
                return '{"points":9999}'
        self.assertTrue(AIOrchestrator(Broken()).explain(scan)["fallback"])


if __name__ == "__main__":
    unittest.main()
