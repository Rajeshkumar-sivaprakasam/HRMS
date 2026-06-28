from abc import ABC, abstractmethod


class StorageClient(ABC):
    @abstractmethod
    async def upload(
        self,
        file_bytes: bytes,
        key: str,
        content_type: str,
    ) -> str:
        """Upload file and return the storage key."""
        ...

    @abstractmethod
    async def get_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        """Return a pre-signed URL valid for expires_in seconds."""
        ...

    @abstractmethod
    async def delete(self, key: str) -> None:
        """Delete a file from storage."""
        ...
