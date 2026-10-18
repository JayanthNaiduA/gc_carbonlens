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
    project = os.environ.get("FIREBASE_PROJECT_ID") or os.environ.get("GCP_PROJECT_ID") or "crucial-handbook-czbz0"
    if not firebase_admin._apps:
        firebase_admin.initialize_app(options={"projectId": project})
    transport = GoogleRest()
    db_id = os.environ.get("FIRESTORE_DATABASE_ID")
    try:
        client = firestore.client(database=db_id) if db_id else firestore.client()
    except Exception:
        client = firestore.client()
    store = FirestoreStore(client)
    # Enrollment can be deployed before scientific reference tables exist.
    profile_only = os.environ.get("CARBONLENS_PROFILE_ONLY", "1") == "1"
    references = ReferenceRepository() if profile_only else load_references(transport, project, os.environ.get("BIGQUERY_DATASET_REFERENCE", "carbonlens_reference"))
    policy_version = os.environ.get("REWARD_POLICY_VERSION", "demo-v1")
    try:
        references.policies = [store.get(f"reward_policies/{policy_version}") or {}]
    except Exception:
        references.policies = []
    for index, product in enumerate(references.products):
        # Product names and recognition aliases belong to curated operational
        # metadata; authoritative score dimensions remain in BigQuery.
        try:
            metadata = store.get(f"products/{product['product_ref']}") or {}
        except Exception:
            metadata = {}
        references.products[index] = {**metadata, **product}
    processor = os.environ.get("DOCUMENT_AI_PROCESSOR", "")
    documents = DocumentAdapter(transport, processor, os.environ.get("DOCUMENT_AI_LOCATION", "us"), references) if processor else None
    scan_bucket = os.environ.get("SCAN_BUCKET")
    vertex_loc = os.environ.get("VERTEX_AI_LOCATION")
    gemini_model = os.environ.get("GEMINI_MODEL")
    return Platform(store, references, policy_version,
                    PrivateStorage(transport, scan_bucket) if scan_bucket else None,
                    VisionAdapter(transport, references, documents),
                    GeminiAdapter(transport, project, vertex_loc, gemini_model) if gemini_model and vertex_loc else None)
