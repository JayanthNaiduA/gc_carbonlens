"""Explicit Cloud Run composition. Importing tests never initializes Google SDKs."""
import os
from app.adapters.firestore import FirestoreStore
from app.adapters.google_rest import GoogleRest
from app.adapters.storage import PrivateStorage
from app.adapters.bigquery import load_references
from app.domains.scan.adapters.vision import VisionAdapter
from app.domains.scan.adapters.document_ai import DocumentAdapter
from app.domains.ai.adapters.gemini import GeminiAdapter
from app.domains.platform import Platform
from app.domains.carbon.repository import ReferenceRepository


def cloud_platform():
    import firebase_admin
    from firebase_admin import firestore
    project = os.environ["FIREBASE_PROJECT_ID"]
    firebase_admin.initialize_app(options={"projectId": project})
    transport = GoogleRest()
    store = FirestoreStore(firestore.client())
    # Enrollment can be deployed before scientific reference tables exist.
    profile_only = os.environ.get("CARBONLENS_PROFILE_ONLY") == "1"
    references = ReferenceRepository() if profile_only else load_references(transport, project, os.environ.get("BIGQUERY_DATASET_REFERENCE", "carbonlens_reference"))
    policy_version = os.environ.get("REWARD_POLICY_VERSION", "demo-v1")
    references.policies = [store.get(f"reward_policies/{policy_version}") or {}]
    for index, product in enumerate(references.products):
        # Product names and recognition aliases belong to curated operational
        # metadata; authoritative score dimensions remain in BigQuery.
        metadata = store.get(f"products/{product['product_ref']}") or {}
        references.products[index] = {**metadata, **product}
    processor = os.environ.get("DOCUMENT_AI_PROCESSOR", "")
    documents = DocumentAdapter(transport, processor, os.environ.get("DOCUMENT_AI_LOCATION", "us"), references) if processor else None
    return Platform(store, references, policy_version,
                    PrivateStorage(transport, os.environ["SCAN_BUCKET"]) if os.environ.get("SCAN_BUCKET") else None,
                    VisionAdapter(transport, references, documents),
                    GeminiAdapter(transport, project, os.environ["VERTEX_AI_LOCATION"], os.environ["GEMINI_MODEL"]) if os.environ.get("GEMINI_MODEL") and os.environ.get("VERTEX_AI_LOCATION") else None)
