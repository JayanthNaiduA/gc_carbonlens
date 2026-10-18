from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class CarbonResult:
    estimated_kg_co2e: float
    avoided_kg_co2e: float | None
    method: str
    lifecycle_boundary: str
    factor_id: str
    factor_set_version: str
    confidence_grade: str
    source_name: str
    source_url: str
    calculation_trace: list

    def to_dict(self):
        return asdict(self)


@dataclass(frozen=True)
class SustainabilityScore:
    score: int
    dimensions: dict
    score_policy_version: str = "score-v1"
    missing_data_rule: str = "reject_incomplete_dimensions"

    def to_dict(self):
        return asdict(self)
