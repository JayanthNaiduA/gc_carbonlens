from decimal import Decimal, ROUND_HALF_UP
from app.core.errors import number, require
from .models import SustainabilityScore

WEIGHTS = {"carbon_intensity": .40, "reusability": .20, "packaging": .15,
           "recyclability": .15, "durability": .10}


def half_up(value):
    return int(Decimal(str(value)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def score_product(dimensions):
    require(all(k in dimensions for k in WEIGHTS), "SCORE_DATA_INCOMPLETE",
            "Every score dimension requires sourced data.", 422)
    normalized = {k: number(dimensions[k], k, 0, 100) for k in WEIGHTS}
    return SustainabilityScore(half_up(sum(normalized[k] * WEIGHTS[k] for k in WEIGHTS)), normalized)
