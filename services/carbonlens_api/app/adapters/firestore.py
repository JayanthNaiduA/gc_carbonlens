"""Document-store boundary. MemoryStore is for tests only, never runtime fallback."""
from copy import deepcopy
from threading import RLock
from app.core.errors import DomainError


class MemoryStore:
    def __init__(self):
        self.records = {}
        self.lock = RLock()

    def get(self, path):
        return deepcopy(self.records.get(path))

    def list(self, collection, uid):
        return [deepcopy(v) for k, v in self.records.items()
                if k.startswith(collection + "/") and k.count("/") == 1 and v.get("uid") == uid]

    def set(self, path, value):
        self.records[path] = deepcopy(value)

    def atomic(self, operation):
        with self.lock:
            before = deepcopy(self.records)
            try:
                return operation(self)
            except Exception:
                self.records = before
                raise


class UnavailableStore:
    def __getattr__(self, name):
        def unavailable(*args, **kwargs):
            raise DomainError("DEPENDENCY_UNAVAILABLE", "Operational storage is not configured.", 503, True)
        return unavailable


class FirestoreStore:
    def __init__(self, client, transaction=None):
        self.client, self.transaction = client, transaction

    def get(self, path):
        snapshot = self.client.document(path).get(transaction=self.transaction)
        return snapshot.to_dict() if snapshot.exists else None

    def list(self, collection, uid):
        from google.cloud.firestore_v1.base_query import FieldFilter
        query = self.client.collection(collection).where(filter=FieldFilter("uid", "==", uid))
        return [s.to_dict() for s in query.stream(transaction=self.transaction)]

    def set(self, path, value):
        ref = self.client.document(path)
        if self.transaction is not None:
            self.transaction.set(ref, value)
        else:
            ref.set(value)

    def atomic(self, operation):
        from google.cloud.firestore import transactional
        @transactional
        def run(transaction):
            return operation(FirestoreStore(self.client, transaction))
        return run(self.client.transaction())
