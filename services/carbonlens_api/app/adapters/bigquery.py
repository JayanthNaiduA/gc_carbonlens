import json
import re
from app.core.errors import require
from app.domains.carbon.repository import ReferenceRepository


def load_references(transport, project, dataset):
    require(re.fullmatch(r"[a-z][a-z0-9-]{4,62}", project) and re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", dataset),
            "INVALID_CONFIGURATION", "Invalid reference dataset configuration.", 503)
    def query(table):
        result = transport.request(f"https://bigquery.googleapis.com/bigquery/v2/projects/{project}/queries", {
            "query": f"SELECT TO_JSON_STRING(t) AS record FROM `{project}.{dataset}.{table}` t LIMIT 10000",
            "useLegacySql": False, "timeoutMs": 8000})
        require(result.get("jobComplete") is True and not result.get("pageToken"),
                "REFERENCE_QUERY_INCOMPLETE", "Reference data could not be loaded completely.", 503)
        return [json.loads(row["f"][0]["v"]) for row in result.get("rows", [])]
    products = []
    for record in query("product_sustainability"):
        dimensions = record.get("dimensions") or {k: record.get(k + "_score") for k in
            ("carbon_intensity", "reusability", "packaging", "recyclability", "durability")}
        # Missing dimensions remain missing, causing an explicit calculation error.
        products.append({**record, "dimensions": {k: v for k, v in dimensions.items() if v is not None}})
    # Effective reward policy is an operational Firestore snapshot, not a
    # reconstructed policy from historical analytical rows.
    return ReferenceRepository(products, query("emission_factors"), (), query("verified_recyclers"))
