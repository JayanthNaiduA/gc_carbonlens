from app.core.errors import number, require
from app.domains.carbon.score import half_up


def evaluate(event, policy, daily_used=0, monthly_used=0):
    require(policy.get("version"), "POLICY_UNAVAILABLE", "A versioned reward policy is required.", 503)
    rule = policy.get("segments", {}).get(event["action_type"])
    require(rule is not None, "POLICY_UNAVAILABLE", "No policy is configured for this action.", 503)
    level = event["verification"]["level"]
    reasons = list(event["verification"]["reason_codes"])
    eligible = level in ("V2", "V3") and not event.get("fraud_flags")
    if not eligible:
        return {"event_id": event["event_id"], "eligible": False, "state": "REJECTED",
                "points": 0, "policy_version": policy["version"], "factors": {},
                "caps_applied": [], "reason_codes": reasons or ["EVIDENCE_INSUFFICIENT"]}
    impact = min(1., number(event["impact"]["value"], "impact") / number(rule["impact_scale"], "impact_scale", .000001))
    persistence = 1.
    state = "VESTED"
    if event["action_type"] == "GROW_GREEN":
        checkpoint = event["checkpoint"]
        persistence = rule["persistence"][checkpoint]
        state = "VESTED" if checkpoint == "DAY_365" else "PROVISIONAL"
    factors = {"base": number(rule["base_action_points"], "base"), "impact": impact,
               "verification": number(rule["verification_factors"][level], "verification", 0, 1),
               "confidence": number(event["confidence"], "confidence", 0, 1),
               "persistence": number(persistence, "persistence", 0, 1), "anti_abuse": 1.}
    raw = half_up(factors["base"] * impact * factors["verification"] * factors["confidence"] * persistence)
    limits = {"per_event": rule["caps"]["per_event"],
              "daily": max(0, policy["caps"]["daily"] - daily_used),
              "monthly": max(0, policy["caps"]["monthly"] - monthly_used)}
    for name, value in limits.items():
        number(value, name)
    points = min(raw, *limits.values())
    return {"event_id": event["event_id"], "eligible": True, "state": state,
            "points": points, "policy_version": policy["version"], "factors": factors,
            "caps_applied": [k for k, v in limits.items() if v < raw], "reason_codes": reasons}
