import re

import bcrypt

PASSWORD_PATTERN = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:',.<>?/`~])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{}|;:',.<>?/`~]{8,}$"
)


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def validate_password_strength(password: str) -> bool:
    return bool(PASSWORD_PATTERN.match(password))
