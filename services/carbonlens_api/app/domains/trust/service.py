"""Only normalized server-owned signals enter verification, never request flags."""


def verify(checks, fraud_flags=()):
    trusted = [name for name, passed in checks.items() if passed]
    level = "V0" if not trusted else "V1" if len(trusted) == 1 else "V2"
    if "independent_document" in trusted and len(trusted) >= 3:
        level = "V3"
    if fraud_flags:
        level = "V0"
    confidence = {"V0": 0., "V1": .4, "V2": .8, "V3": .95}[level]
    return {"level": level, "score": confidence, "checks": checks,
            "reason_codes": list(fraud_flags) or [name.upper() for name in trusted] or ["EVIDENCE_INSUFFICIENT"]}
