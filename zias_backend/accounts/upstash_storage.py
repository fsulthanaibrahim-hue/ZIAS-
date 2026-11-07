from django.core.files.storage import Storage
from upstash_blob import Bucket

class UpstashStorage(Storage):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.bucket = Bucket.from_env()

    def _save(self, name, content):
        blob = self.bucket.put(name, content.read())
        return blob.path

    def url(self, name):
        return self.bucket.signed_read_url(name).url

    def exists(self, name):
        return self.bucket.exists(name)