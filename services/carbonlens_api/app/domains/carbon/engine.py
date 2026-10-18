"""Deterministic, versioned factor calculation. No model-generated numbers."""
from datetime import date
from app.core.errors import DomainError, number, require
from .models import CarbonResult


class CarbonEngine:
    def __init__(self, factors, today=date.today):
        self.factors, self.today = factors, today

    def estimate(self, category, quantity=1, unit="item", region="GLOBAL", version=None):
        number(quantity, "quantity", 0.000001)
        today = self.today().isoformat()
        matches = [f for f in self.factors if f["category"] == category
                   and f["region"] in (region, "GLOBAL")
                   and (not version or f["factor_set_version"] == version)
                   and f["effective_from"] <= today
                   and (not f.get("effective_to") or today <= f["effective_to"])]
        if not matches:
            raise DomainError("FACTOR_NOT_FOUND", "No active sourced factor is available.", 422)
        matches.sort(key=lambda f: (f["region"] == region, f["effective_from"], f["factor_set_version"]), reverse=True)
        f = matches[0]
        require(all(f.get(k) for k in ("factor_id", "factor_set_version", "source_name", "source_url", "lifecycle_boundary", "confidence_grade")),
                "FACTOR_PROVENANCE_MISSING", "The factor has incomplete provenance.", 422)
        conversions = {("g", "kg"): .001, ("kg", "g"): 1000,
                       ("m", "km"): .001, ("km", "m"): 1000}
        normalized = quantity
        if unit != f["activity_unit"]:
            scale = conversions.get((unit, f["activity_unit"]))
            require(scale is not None, "UNIT_CONVERSION_ERROR", "Quantity unit does not match the factor.", 422)
            normalized *= scale
        factor = number(float(f["kg_co2e_per_unit"]), "factor")
        return CarbonResult(round(normalized * factor, 6), None, "category_average",
                            f["lifecycle_boundary"], f["factor_id"], f["factor_set_version"],
                            f["confidence_grade"], f["source_name"], f["source_url"],
                            [{"quantity": normalized, "unit": f["activity_unit"], "kg_co2e_per_unit": factor}])

    def transport(self, baseline_mode, actual_mode, distance_km, substitution_proven=False):
        baseline = self.estimate(baseline_mode, distance_km, "km")
        actual = self.estimate(actual_mode, distance_km, "km")
        return CarbonResult(actual.estimated_kg_co2e,
                            round(max(0, baseline.estimated_kg_co2e - actual.estimated_kg_co2e), 6) if substitution_proven else None,
                            "transport_substitution" if substitution_proven else "activity_only",
                            actual.lifecycle_boundary, actual.factor_id, actual.factor_set_version,
                            actual.confidence_grade, actual.source_name, actual.source_url,
                            [{"baseline": baseline.to_dict()}, {"actual": actual.to_dict()}])
