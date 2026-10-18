"""One composition root for the documented shared-domain vertical slice."""
import hashlib
import json
from datetime import datetime, timezone
from uuid import uuid4
from app.core.errors import DomainError, number, require
from app.domains.carbon.engine import CarbonEngine
from app.domains.carbon.score import score_product
from app.domains.scan.service import ScanService
from app.domains.trust.service import verify
from app.domains.rewards.ledger import RewardLedger, now
from app.domains.ai.orchestrator import AIOrchestrator
from app.http.middleware import consent
from app.domains.profile import ProfileService


class Platform:
    def __init__(self, store, references, policy_version="demo-v1", evidence=None, vision=None, ai=None, profile_identity=None):
        self.store, self.references = store, references
        self.carbon = CarbonEngine(references.factors)
        self.scan = ScanService(store, references, self.carbon, evidence, vision)
        self.ledger = RewardLedger(store, references.policy(policy_version))
        self.ai = AIOrchestrator(ai)
        self.profiles = ProfileService(store, profile_identity)

    def owned(self, collection, resource_id, uid):
        require(isinstance(resource_id, str) and "/" not in resource_id and resource_id,
                "INVALID_INPUT", "Invalid resource identifier.")
        value = self.store.get(f"{collection}/{resource_id}")
        require(value and value.get("uid") == uid, "NOT_FOUND", "Record not found.", 404)
        return value

    def idempotent(self, uid, key, path, draft, operation):
        fingerprint = hashlib.sha256(json.dumps([path, draft], sort_keys=True, separators=(",", ":")).encode()).hexdigest()
        guard_id = hashlib.sha256((uid + ":" + key).encode()).hexdigest()
        guard_path = f"request_guards/{guard_id}"
        claim_token = str(uuid4())
        def claim(tx):
            existing = tx.get(guard_path)
            if existing:
                require(existing["fingerprint"] == fingerprint, "IDEMPOTENCY_CONFLICT", "The operation identifier was already used for different input.", 409)
                if existing["state"] == "DONE":
                    return existing["result"]
                age = (datetime.now(timezone.utc) - datetime.fromisoformat(existing["updated_at"])).total_seconds()
                require(existing["state"] == "FAILED" or age > 60, "REQUEST_IN_PROGRESS", "This operation is processing. Retry shortly with the same identifier.", 409)
            tx.set(guard_path, {"uid": uid, "fingerprint": fingerprint, "state": "PENDING", "claim_token": claim_token, "updated_at": now()})
            return None
        prior_result = self.store.atomic(claim)
        if prior_result is not None:
            return prior_result
        try:
            result = operation(guard_id)
        except Exception:
            def failed(tx):
                record = tx.get(guard_path)
                if record and record.get("claim_token") == claim_token:
                    tx.set(guard_path, {**record, "state": "FAILED", "updated_at": now()})
            self.store.atomic(failed)
            raise
        def finish(tx):
            prior = tx.get(guard_path)
            require(prior and prior.get("claim_token") == claim_token, "IDEMPOTENCY_CONFLICT", "Operation conflict.", 409)
            tx.set(guard_path, {**prior, "state": "DONE", "result": result, "updated_at": now()})
            return result
        return self.store.atomic(finish)

    def product_event(self, uid, draft, event_id):
        subject = draft.get("subject", {})
        require(isinstance(subject, dict) and isinstance(draft.get("evidence_refs"), list)
                and all(isinstance(ref, str) for ref in draft["evidence_refs"]), "INVALID_INPUT", "Provide a product subject and scan evidence references.")
        baseline = self.references.product(subject.get("baseline_ref"))
        actual = self.references.product(subject.get("actual_ref"))
        require(baseline and actual and baseline["category"] == actual["category"],
                "CATEGORY_MISMATCH", "Choose comparable products from the same category.", 422)
        scans = [self.owned("scans", ref.removeprefix("scans/"), uid) for ref in draft.get("evidence_refs", [])]
        require(scans, "EVIDENCE_REQUIRED", "Product and purchase evidence are required.", 422)
        has_product = any(s["mode"] == "PRODUCT" and s["product_candidate"]["product_ref"] == actual["product_ref"] for s in scans)
        has_receipt = any(s["mode"] == "RECEIPT" and s.get("document_verified") and s["product_candidate"]["product_ref"] == actual["product_ref"] for s in scans)
        has_baseline = any(s["mode"] == "PRODUCT" and s["product_candidate"]["product_ref"] == baseline["product_ref"] for s in scans)
        delta = max(0, score_product(actual["dimensions"]).score - score_product(baseline["dimensions"]).score)
        require(delta > 0, "NO_IMPROVEMENT", "This replacement does not improve the sourced score.", 422)
        checks = {"product_match": has_product, "purchase_document": has_receipt, "baseline_match": has_baseline}
        verification = verify(checks)
        if not has_baseline:
            verification = {**verification, "level": "V1", "score": .4,
                            "reason_codes": ["SELF_DECLARED_BASELINE", "MORE_EVIDENCE_REQUIRED"]}
        fingerprint = hashlib.sha256("|".join(sorted(s["evidence_hash"] for s in scans)).encode()).hexdigest()
        event = {"event_id": event_id, "uid": uid, "action_type": "GO_GREEN_PRODUCT",
                 "occurred_at": now(), "created_at": now(), "source": "verified_scan",
                 "evidence_refs": draft["evidence_refs"], "evidence_fingerprint": fingerprint,
                 "impact": {"type": "sustainability_improvement", "value": delta, "unit": "score_delta", "method": "score-v1"},
                 "verification": verification, "confidence": verification["score"], "fraud_flags": [],
                 "reward_state": "PENDING", "policy_version": None}
        # Reserve every evidence hash globally in the same transaction as event.
        # A subset/superset or reordering cannot reuse a receipt to earn again.
        guards = [f"evidence_guards/{s['evidence_hash']}" for s in scans]
        guards += [f"evidence_guards/{s['document_fingerprint']}" for s in scans if s.get("document_fingerprint")]
        def create(tx):
            prior = tx.get(f"green_events/{event_id}")
            reservations = [tx.get(g) for g in guards]
            if prior:
                return prior
            require(not any(reservations), "DUPLICATE_EVIDENCE", "This evidence has already been submitted.", 409)
            for guard in guards:
                tx.set(guard, {"event_id": event_id})
            tx.set(f"green_events/{event_id}", event)
            return event
        return self.store.atomic(create)

    def dashboard(self, uid, period):
        require(period in ("today", "week", "month"), "INVALID_INPUT", "Choose today, week or month.")
        wallet = self.store.get(f"reward_wallets/{uid}") or {"available_points": 0, "provisional_points": 0, "lifetime_earned": 0}
        entries = self.store.list("reward_ledger", uid)
        days = {"today": 1, "week": 7, "month": 30}[period]
        current = datetime.now(timezone.utc)
        recent = [e for e in entries if 0 <= (current - datetime.fromisoformat(e["created_at"])).total_seconds() < days * 86400]
        return {"period": period, "green_score": None, "walking_km": None,
                "greener_purchases": sum(e["entry_type"] == "VESTED" and e["points_delta"] > 0
                    and (self.store.get(f"green_events/{e['event_id']}") or {}).get("action_type") == "GO_GREEN_PRODUCT" for e in recent),
                "avoided_kg_co2e": None, "points_earned": sum(e["points_delta"] for e in recent),
                "wallet": wallet, "insight": "Scan a product to understand your next greener choice."}

    def handle(self, method, path, uid, draft, query, resource_id):
        if method == "GET" and path == "/v1/me":
            return self.profiles.get(uid)
        if method == "PUT" and path == "/v1/me":
            return self.profiles.update(uid, draft, resource_id)
        if method == "PUT" and path == "/v1/consents":
            scopes = ("camera", "location", "health_connect", "microphone", "personalization")
            require(draft.get("policy_version") == "prototype-consent-v1" and all(isinstance(draft.get(s, False), bool) for s in scopes),
                    "INVALID_INPUT", "A supported consent version and boolean preferences are required.")
            record = {"uid": uid, "policy_version": draft["policy_version"], "updated_at": now(), **{s: draft.get(s, False) for s in scopes}}
            self.store.set(f"consents/{uid}", record)
            return record
        if method == "GET" and path == "/v1/consents":
            return self.store.get(f"consents/{uid}") or {}
        if method == "GET" and path == "/v1/dashboard":
            return self.dashboard(uid, query.get("period", ["today"])[0])
        if method == "GET" and path == "/v1/wallet":
            wallet = self.store.get(f"reward_wallets/{uid}") or {"available_points": 0, "provisional_points": 0, "lifetime_earned": 0}
            return {**wallet, "entries": sorted(self.store.list("reward_ledger", uid), key=lambda e: e["created_at"], reverse=True)}
        if method == "GET" and path == "/v1/products":
            products = []
            for product in self.references.products:
                item = dict(product)
                try:
                    item["score"] = score_product(item["dimensions"]).score
                    item["footprint"] = self.carbon.estimate(item["category"]).estimated_kg_co2e
                except DomainError:
                    pass
                products.append(item)
            return {"products": products}
        if method == "POST" and path == "/v1/scans":
            consent(self.store, uid, "camera")
            return self.scan.process(uid, draft, resource_id)
        if method == "GET" and path.startswith("/v1/scans/"):
            return self.owned("scans", path.split("/")[-1], uid)
        if method == "POST" and path == "/v1/carbon/estimate":
            return self.carbon.estimate(draft.get("category"), draft.get("quantity", 1), draft.get("unit", "item"), draft.get("region", "GLOBAL"), draft.get("factor_version")).to_dict()
        if method == "POST" and path == "/v1/ai/explain":
            consent(self.store, uid, "personalization")
            scan = self.owned("scans", draft.get("scan_id"), uid)
            alternatives = [p for p in self.references.products if p["category"] == scan["product_candidate"]["category"]]
            return self.ai.explain(scan, alternatives)
        if method == "POST" and path == "/v1/green-events":
            require(draft.get("action_type") == "GO_GREEN_PRODUCT", "EVIDENCE_ADAPTER_REQUIRED", "Use the corresponding evidence intake for this action.", 422)
            return self.product_event(uid, draft, resource_id)
        if method == "POST" and path == "/v1/rewards/evaluate":
            return self.ledger.post_once(uid, draft.get("event_id"))
        if method == "GET" and path.startswith("/v1/reward-events/"):
            return self.owned("green_events", path.split("/")[-1], uid)
        if method == "GET" and path == "/v1/reports/monthly":
            events = self.store.list("green_events", uid)
            return {"month": datetime.now(timezone.utc).strftime("%Y-%m"), "avoided_kg_co2e": None,
                    "weekly_avoided": [], "categories": [], "event_count": len(events)}
        if method == "GET" and path == "/v1/grow-green/projects":
            return {"projects": self.store.list("grow_green_projects", uid)}
        if method == "POST" and path == "/v1/grow-green/projects":
            consent(self.store, uid, "location")
            count = number(draft.get("claimed_count"), "tree count", 1, 10000)
            require(int(count) == count, "INVALID_INPUT", "Tree count must be a whole number.")
            location = draft.get("location", {})
            number(location.get("lat"), "latitude", -90, 90)
            number(location.get("lng"), "longitude", -180, 180)
            require(draft.get("privacy_mode", "PRIVATE") in ("PRIVATE", "COARSE_PUBLIC"), "INVALID_INPUT", "Choose a supported privacy mode.")
            project = {"project_id": resource_id, "uid": uid, "claimed_count": count,
                       "location": location, "privacy_mode": draft.get("privacy_mode", "PRIVATE"),
                       "species": str(draft.get("species", "Unknown"))[:120], "state": "PENDING", "created_at": now()}
            self.store.set(f"grow_green_projects/{resource_id}", project)
            return project
        if method == "POST" and path == "/v1/green-move":
            consent(self.store, uid, "health_connect")
            consent(self.store, uid, "location")
            raise DomainError("EVIDENCE_ADAPTER_REQUIRED", "Trusted activity ingestion and a registered commute baseline are required.", 503)
        if method == "POST" and path == "/v1/recycle-red/claims":
            consent(self.store, uid, "camera")
            raise DomainError("EVIDENCE_ADAPTER_REQUIRED", "A configured document processor and sourced recycler registry are required.", 503)
        if method == "POST" and path.startswith("/v1/grow-green/"):
            consent(self.store, uid, "location")
            raise DomainError("EVIDENCE_ADAPTER_REQUIRED", "Trusted fresh photo and proximity processing must be configured for check-ins.", 503)
        raise DomainError("NOT_FOUND", "Endpoint not found.", 404)
