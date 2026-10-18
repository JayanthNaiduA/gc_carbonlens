from datetime import datetime, timezone
from app.core.errors import require
from .policy import evaluate


def now():
    return datetime.now(timezone.utc).isoformat()


class RewardLedger:
    def __init__(self, store, policy, clock=now):
        self.store, self.policy, self.clock = store, policy, clock

    def post_once(self, uid, event_id):
        def operation(tx):
            event = tx.get(f"green_events/{event_id}")
            require(event is not None and event["uid"] == uid, "NOT_FOUND", "Event not found.", 404)
            existing = tx.get(f"reward_ledger/{event_id}")
            if existing:
                return existing["decision"]
            # Reads precede every write, including wallet and cap projection reads.
            wallet = tx.get(f"reward_wallets/{uid}") or {"uid": uid, "available_points": 0, "provisional_points": 0, "lifetime_earned": 0}
            entries = tx.list("reward_ledger", uid)
            stamp = self.clock()
            daily = sum(max(0, e["points_delta"]) for e in entries if e["created_at"][:10] == stamp[:10])
            monthly = sum(max(0, e["points_delta"]) for e in entries if e["created_at"][:7] == stamp[:7])
            decision = evaluate(event, self.policy, daily, monthly)
            entry = {"entry_id": event_id, "event_id": event_id, "uid": uid,
                     "points_delta": decision["points"], "entry_type": decision["state"],
                     "policy_version": decision["policy_version"], "created_at": stamp,
                     "reason_codes": decision["reason_codes"], "decision": decision}
            bucket = "provisional_points" if decision["state"] == "PROVISIONAL" else "available_points"
            wallet[bucket] += decision["points"]
            wallet["lifetime_earned"] += decision["points"]
            wallet["updated_at"] = stamp
            event["reward_state"] = decision["state"]
            event["policy_version"] = decision["policy_version"]
            tx.set(f"reward_ledger/{event_id}", entry)
            tx.set(f"reward_wallets/{uid}", wallet)
            tx.set(f"green_events/{event_id}", event)
            return decision
        return self.store.atomic(operation)

    def reverse_once(self, uid, event_id):
        """Internal service/admin operation; intentionally absent from public routes."""
        def operation(tx):
            original = tx.get(f"reward_ledger/{event_id}")
            require(original and original["uid"] == uid, "NOT_FOUND", "Ledger entry not found.", 404)
            reversal_id = event_id + "_reversal"
            existing = tx.get(f"reward_ledger/{reversal_id}")
            if existing:
                return existing
            wallet = tx.get(f"reward_wallets/{uid}")
            event = tx.get(f"green_events/{event_id}")
            entry = {"entry_id": reversal_id, "event_id": event_id, "uid": uid,
                     "points_delta": -original["points_delta"], "entry_type": "REVERSAL",
                     "policy_version": original["policy_version"], "created_at": self.clock(),
                     "reason_codes": ["REWARD_REVOKED"]}
            bucket = "provisional_points" if original["entry_type"] == "PROVISIONAL" else "available_points"
            wallet[bucket] -= original["points_delta"]
            event["reward_state"] = "REVOKED"
            tx.set(f"reward_ledger/{reversal_id}", entry)
            tx.set(f"reward_wallets/{uid}", wallet)
            tx.set(f"green_events/{event_id}", event)
            return entry
        return self.store.atomic(operation)
