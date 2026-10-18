import hashlib
from app.core.errors import DomainError, require
from app.domains.carbon.score import score_product


class ScanService:
    def __init__(self, store, references, carbon, evidence=None, vision=None):
        self.store, self.references, self.carbon = store, references, carbon
        self.evidence, self.vision = evidence, vision

    def process(self, uid, draft, scan_id):
        mode = draft.get("mode")
        require(mode in ("PRODUCT", "RECEIPT"), "INVALID_INPUT", "Choose product or receipt scanning.")
        path = draft.get("storage_object", "")
        require(isinstance(path, str) and path.startswith(f"users/{uid}/scans/")
                and ".." not in path and "//" not in path, "EVIDENCE_OWNERSHIP", "Use your private scan evidence.", 403)
        if not self.evidence or not self.vision:
            raise DomainError("DEPENDENCY_UNAVAILABLE", "Private evidence processing is not configured.", 503, True)
        content = self.evidence.read(path)
        digest = hashlib.sha256(content).hexdigest()
        normalized = self.vision.identify(content, mode)
        product_ref = normalized.get("product_ref")
        product = self.references.product(product_ref)
        require(product is not None, "PRODUCT_UNRESOLVED", "The product could not be matched to sourced catalog data.", 422)
        confidence = normalized.get("confidence", 0)
        require(isinstance(confidence, (int, float)) and .5 <= confidence <= 1,
                "PRODUCT_UNRESOLVED", "More evidence is needed to identify this product.", 422)
        result = {"scan_id": scan_id, "uid": uid, "status": "COMPLETED", "mode": mode,
                  "evidence_hash": digest, "storage_ref": path, "product_candidate": product,
                  "identification_confidence": confidence,
                  "carbon": self.carbon.estimate(product["category"]).to_dict(),
                  "sustainability": score_product(product["dimensions"]).to_dict()}
        # Independent-document status must be supplied by the document adapter,
        # never inferred from the client's mode selection.
        result["document_verified"] = normalized.get("document_verified") is True
        result["document_fingerprint"] = normalized.get("document_fingerprint")
        self.store.set(f"scans/{scan_id}", result)
        return result
