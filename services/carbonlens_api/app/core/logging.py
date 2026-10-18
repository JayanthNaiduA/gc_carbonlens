"""Allowlist-only structured logs: no request bodies, identities or evidence."""
import json
import logging


def access(request_id, route, status, latency_ms):
    # Dynamic identifiers are removed from route, preventing precise evidence
    # paths or opaque tokens being accidentally captured in URL logs.
    parts = route.split("/")
    known = {"v1", "health", "version", "me", "consents", "scans", "carbon", "estimate",
             "ai", "explain", "green-events", "rewards", "evaluate", "wallet", "dashboard",
             "reports", "monthly", "products", "green-move", "grow-green", "projects",
             "checkins", "confirmations", "recycle-red", "claims", "reward-events"}
    safe_route = "/".join(p if p in known or not p else ":id" for p in parts)
    logging.getLogger("carbonlens.access").info(json.dumps({"request_id": request_id,
        "route": safe_route, "status_code": status, "latency_ms": round(latency_ms, 2)}))
