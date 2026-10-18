import csv
import json
from pathlib import Path


class ReferenceRepository:
    """Curated local references; empty datasets stay empty. No fixture fallback."""
    def __init__(self, products=(), factors=(), policies=(), recyclers=()):
        self.products, self.factors = list(products), list(factors)
        self.policies, self.recyclers = list(policies), list(recyclers)

    @classmethod
    def load(cls, root):
        root = Path(root)
        def read(folder, filename):
            path = root / folder / filename
            return json.loads(path.read_text(encoding="utf-8-sig")) if path.exists() else []
        factor_path = root / "emission_factors" / "emission_factors.csv"
        factors = []
        if factor_path.exists():
            with factor_path.open(encoding="utf-8-sig", newline="") as file:
                factors = list(csv.DictReader(file))
        return cls(read("product_catalog", "product_catalog.json"), factors,
                   read("reward_policies", "reward_policies.json"),
                   read("verified_recyclers", "verified_recyclers.json"))

    def product(self, product_ref):
        return next((p for p in self.products if p["product_ref"] == product_ref), None)

    def policy(self, version):
        return next((p for p in self.policies if p["version"] == version), {})
