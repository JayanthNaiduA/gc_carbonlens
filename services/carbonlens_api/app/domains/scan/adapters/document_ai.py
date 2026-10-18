import base64
import hashlib
import json
from datetime import date
from app.core.errors import require


class DocumentAdapter:
    def __init__(self, transport, processor, location, references):
        self.transport, self.processor, self.location, self.references = transport, processor, location, references

    def identify(self, content):
        result = self.transport.request(f"https://{self.location}-documentai.googleapis.com/v1/{self.processor}:process", {
            "rawDocument": {"content": base64.b64encode(content).decode(), "mimeType": "image/jpeg"}})
        document = result.get("document", {})
        facts = {e["type"]: e.get("normalizedValue", {}).get("text", e.get("mentionText", "")).strip()
                 for e in document.get("entities", []) if e.get("confidence", 0) >= .7}
        merchant = facts.get("supplier_name") or facts.get("merchant_name")
        stamp = facts.get("receipt_date") or facts.get("invoice_date")
        require(merchant and stamp, "DOCUMENT_UNRESOLVED", "A merchant and purchase date must be extracted from this document.", 422)
        try:
            parsed = date.fromisoformat(stamp)
            require(0 <= (date.today() - parsed).days <= 90, "DOCUMENT_DATE_INVALID", "Purchase evidence must be recent.", 422)
        except ValueError:
            require(False, "DOCUMENT_DATE_INVALID", "Document date requires manual review.", 422)
        text = document.get("text", "").casefold()
        candidates = [p for p in self.references.products if any(str(a).casefold() in text for a in p.get("recognition_aliases", []) if len(str(a)) >= 4)]
        require(len(candidates) == 1, "PRODUCT_UNRESOLVED", "A unique purchased product must be resolved.", 422)
        stable = {"merchant": merchant.casefold(), "date": stamp,
                  "number": facts.get("invoice_id") or facts.get("receipt_id"), "total": facts.get("total_amount")}
        require(stable["number"] or stable["total"], "DOCUMENT_UNRESOLVED", "Purchase document identifiers require review.", 422)
        return {"product_ref": candidates[0]["product_ref"], "confidence": .75, "document_verified": True,
                "document_fingerprint": hashlib.sha256(json.dumps(stable, sort_keys=True).encode()).hexdigest()}
