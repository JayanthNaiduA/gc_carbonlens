import json

FIELDS = ("summary", "why_score", "recommended_action", "alternative_product_ref",
          "confidence_note", "safety_caveat")


class AIOrchestrator:
    def __init__(self, adapter=None):
        self.adapter = adapter

    def explain(self, scan, alternatives=()):
        fallback = {"summary": "Review the sourced estimate and the separate sustainability score.",
                    "why_score": "The score combines carbon intensity, reuse, packaging, recycling and durability.",
                    "recommended_action": "Compare a replacement in the same product category.",
                    "alternative_product_ref": None,
                    "confidence_note": "This explanation is a deterministic fallback. Estimates retain their stated confidence.",
                    "safety_caveat": "An estimate is not a carbon credit.", "fallback": True}
        if self.adapter is None:
            return fallback
        try:
            context = {"product": scan["product_candidate"], "carbon_result": scan["carbon"],
                       "sustainability_score": scan["sustainability"], "candidate_alternatives": list(alternatives)}
            output = self.adapter.explain(context, timeout=8)
            result = json.loads(output) if isinstance(output, str) else output
            if not isinstance(result, dict) or set(result) != set(FIELDS):
                return fallback
            if any(not isinstance(result[k], str) or not result[k] or len(result[k]) > 2000
                   for k in FIELDS if k not in ("alternative_product_ref", "safety_caveat")):
                return fallback
            if result["safety_caveat"] is not None and not isinstance(result["safety_caveat"], str):
                return fallback
            if result["alternative_product_ref"] not in [None] + [p["product_ref"] for p in alternatives]:
                return fallback
            # Generated prose is advisory. Only canonical carbon/score fields are
            # rendered as numeric truth; never merge output into those contracts.
            return {**result, "fallback": False}
        except Exception:
            return fallback
