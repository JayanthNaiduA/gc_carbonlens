from urllib.parse import quote
from app.core.errors import require


class PrivateStorage:
    def __init__(self, transport, bucket):
        self.transport, self.bucket = transport, bucket

    def read(self, path):
        result = self.transport.request(f"https://storage.googleapis.com/storage/v1/b/{quote(self.bucket, safe='')}/o/{quote(path, safe='')}?alt=media", binary=True)
        require(len(result) <= 10 * 1024 * 1024, "PAYLOAD_TOO_LARGE", "Evidence exceeds the supported image size.", 413)
        return result
