from datetime import datetime, timezone
from app.core.errors import number, require

CHECKPOINTS = {"DAY_0": 0, "DAY_30": 30, "DAY_90": 90, "DAY_180": 180, "DAY_365": 365}


def validate_checkin(project, evidence, history=(), current=None, proximity_threshold_m=100):
    current = current or datetime.now(timezone.utc)
    checkpoint = evidence.get("checkpoint")
    require(checkpoint in CHECKPOINTS, "CHECKPOINT_INVALID", "Unsupported persistence checkpoint.")
    captured = datetime.fromisoformat(evidence["captured_at"])
    planted = datetime.fromisoformat(project["created_at"])
    require(captured.tzinfo and planted.tzinfo and 0 <= (current - captured).total_seconds() <= 86400,
            "STALE_EVIDENCE", "Check-in evidence must be captured within the last day.", 422)
    require((captured - planted).days >= CHECKPOINTS[checkpoint], "CHECKPOINT_EARLY", "This checkpoint is not due yet.", 422)
    number(evidence["distance_to_plot_m"], "distance to plot", 0, proximity_threshold_m)
    require(evidence.get("media_hash"), "EVIDENCE_REQUIRED", "A fresh photo fingerprint is required.", 422)
    for prior in history:
        require(evidence["media_hash"] != prior["media_hash"], "DUPLICATE_EVIDENCE", "Reused planting photos are not accepted.", 409)
        require(checkpoint != prior["checkpoint"] and captured > datetime.fromisoformat(prior["captured_at"]),
                "CHECKPOINT_ALREADY_SUBMITTED", "Checkpoints must progress with fresh evidence.", 409)
    return "VESTED" if checkpoint == "DAY_365" else "PROVISIONAL"


def validate_confirmation(owner_uid, visitor_uid):
    require(owner_uid != visitor_uid, "SELF_CONFIRMATION", "Owners cannot independently confirm their own plots.", 422)
