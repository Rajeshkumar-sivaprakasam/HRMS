#!/usr/bin/env python3
"""Generate RS256 key pair for JWT signing.

Usage: python scripts/generate_rsa_keys.py
Outputs private.pem and public.pem in the project root.
"""
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


def main() -> None:
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    root = Path(__file__).parent.parent
    (root / "private.pem").write_bytes(private_pem)
    (root / "public.pem").write_bytes(public_pem)
    print("Generated private.pem and public.pem")
    print("Add to .env:")
    print(f"  JWT_PRIVATE_KEY={private_pem.decode().strip()!r}")
    print(f"  JWT_PUBLIC_KEY={public_pem.decode().strip()!r}")


if __name__ == "__main__":
    main()
