import re
import uuid
from datetime import datetime, timezone

import boto3
import structlog
from botocore.client import Config
from botocore.exceptions import ClientError

from app.config import settings
from app.core.storage.base import StorageClient

log = structlog.get_logger()

# Categories where only one document is allowed (uploading replaces the existing one)
SINGLE_FILE_CATEGORIES = {
    "offer_letter", "pan_card", "aadhaar_card",
    "bank_passbook", "relieving_letter",
}


class S3StorageClient(StorageClient):
    def __init__(self) -> None:
        kwargs: dict = {
            "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
            "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
            "region_name": settings.AWS_S3_REGION,
            "config": Config(signature_version="s3v4"),
        }
        if settings.AWS_S3_ENDPOINT_URL:
            kwargs["endpoint_url"] = settings.AWS_S3_ENDPOINT_URL

        self._client = boto3.client("s3", **kwargs)
        self._bucket = settings.AWS_S3_BUCKET

    async def upload(self, file_bytes: bytes, key: str, content_type: str) -> str:
        try:
            self._client.put_object(
                Bucket=self._bucket,
                Key=key,
                Body=file_bytes,
                ContentType=content_type,
            )
            return key
        except ClientError as exc:
            log.error("storage_upload_failed", key=key, error=str(exc))
            raise

    async def get_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        try:
            return self._client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket, "Key": key},
                ExpiresIn=expires_in,
            )
        except ClientError as exc:
            log.error("storage_presign_failed", key=key, error=str(exc))
            raise

    async def delete(self, key: str) -> None:
        try:
            self._client.delete_object(Bucket=self._bucket, Key=key)
        except ClientError as exc:
            log.error("storage_delete_failed", key=key, error=str(exc))
            raise

    @staticmethod
    def build_key(folder: str, filename: str) -> str:
        safe_name = f"{uuid.uuid4()}_{filename}"
        return f"{folder}/{safe_name}"

    @staticmethod
    def build_document_key(employee_code: str, category: str, filename: str) -> str:
        """Organized per-employee folder: employees/{code}/documents/{category}/{ts}_{name}"""
        ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        safe = re.sub(r"[^\w.\-]", "_", filename)
        return f"employees/{employee_code}/documents/{category}/{ts}_{safe}"


storage: S3StorageClient = S3StorageClient()
