import base64
from app.core.errors import require


class VisionAdapter:
    def __init__(self, transport, references, documents=None):
        self.transport, self.references, self.documents = transport, references, documents

    def identify(self, content, mode):
        if mode == "RECEIPT":
            require(self.documents is not None, "DEPENDENCY_UNAVAILABLE", "Document processing is not configured.", 503)
            return self.documents.identify(content)
        result = self.transport.request("https://vision.googleapis.com/v1/images:annotate", {"requests": [{
            "image": {"content": base64.b64encode(content).decode()},
            "features": [{"type": "TEXT_DETECTION"}, {"type": "LABEL_DETECTION", "maxResults": 10}]}]})
        response = result["responses"][0]
        require(not response.get("error"), "IMAGE_PROCESSING_FAILED", "The image could not be processed.", 503)
        text = response.get("fullTextAnnotation", {}).get("text", "").casefold()
        matches = [p for p in self.references.products if any(str(alias).casefold() in text
                   for alias in p.get("recognition_aliases", []) if len(str(alias)) >= 4)]
        require(len(matches) == 1, "PRODUCT_UNRESOLVED", "An unambiguous catalog match is required.", 422)
        # Conservative documented resolver confidence for exact curated OCR alias.
        return {"product_ref": matches[0]["product_ref"], "confidence": .75, "document_verified": False}
