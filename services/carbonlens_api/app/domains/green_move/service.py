"""Rules consume a trusted activity adapter result, not client assertions."""
from datetime import datetime
from app.core.errors import number, require


def validate_trip(session, baseline, previous_sessions=()):
    distance = number(session["distance_km"], "distance", .01, 100)
    start, end = datetime.fromisoformat(session["start"]), datetime.fromisoformat(session["end"])
    require(start.tzinfo and end.tzinfo and end > start, "ACTIVITY_TIME_INVALID", "Activity timestamps must be ordered and timezone-aware.", 422)
    speed = distance / ((end - start).total_seconds() / 3600)
    require(session["mode"] in ("WALK", "CYCLE"), "MODE_UNSUPPORTED", "Choose walking or cycling.", 422)
    require(speed <= (12 if session["mode"] == "WALK" else 50), "ACTIVITY_IMPLAUSIBLE", "Activity speed is implausible.", 422)
    for prior in previous_sessions:
        require(prior["session_id"] != session["session_id"], "DUPLICATE_SESSION", "This activity was already submitted.", 409)
        require(end <= datetime.fromisoformat(prior["start"]) or start >= datetime.fromisoformat(prior["end"]),
                "OVERLAPPING_ACTIVITY", "This activity overlaps a submitted trip.", 422)
    require(baseline and baseline.get("normal_mode") in ("CAR", "MOTORCYCLE", "TAXI"),
            "BASELINE_REQUIRED", "Register the motorized journey being replaced.", 422)
    require(session.get("baseline_match") is True, "SUBSTITUTION_UNPROVEN", "Activity must match a registered commute.", 422)
    return distance
