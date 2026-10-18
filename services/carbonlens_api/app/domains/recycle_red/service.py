from datetime import date
from app.core.errors import number, require


def validate_document(document, registry, category, current=None):
    current = current or date.today()
    recycler = next((r for r in registry if r["recycler_id"] == document["recycler_id"]), None)
    require(recycler and recycler.get("active") and recycler.get("verification_source"),
            "RECYCLER_UNVERIFIED", "This recycler is not in the sourced active registry.", 422)
    require(category in recycler["accepted_categories"], "CATEGORY_UNSUPPORTED", "This recycler does not accept the item category.", 422)
    require(document.get("fingerprint"), "DOCUMENT_UNRESOLVED", "An extracted document fingerprint is required.", 422)
    stamp = date.fromisoformat(document["date"])
    require(0 <= (current - stamp).days <= 90, "DOCUMENT_DATE_INVALID", "Recycler evidence must be recent.", 422)
    number(document["weight_kg"], "weight", .001, 1000)
    return recycler
