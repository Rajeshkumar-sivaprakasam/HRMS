from enum import StrEnum


class OnboardingStatus(StrEnum):
    DRAFT = "draft"
    ACTIVATED = "activated"
    CANCELLED = "cancelled"


class DocumentCategory(StrEnum):
    OFFER_LETTER = "offer_letter"
    PAN_CARD = "pan_card"
    AADHAAR_CARD = "aadhaar_card"
    BANK_PASSBOOK = "bank_passbook"
    RELIEVING_LETTER = "relieving_letter"
    EDUCATION_CERTIFICATE = "education_certificate"
    OTHER = "other"


class DocumentStatus(StrEnum):
    PENDING = "pending"
    UPLOADED = "uploaded"
    VERIFIED = "verified"
    REJECTED = "rejected"


# Categories where only one document is allowed per onboarding session
SINGLE_FILE_CATEGORIES = {
    DocumentCategory.OFFER_LETTER,
    DocumentCategory.PAN_CARD,
    DocumentCategory.AADHAAR_CARD,
    DocumentCategory.BANK_PASSBOOK,
    DocumentCategory.RELIEVING_LETTER,
}

# Required document categories that must be uploaded before activation
REQUIRED_CATEGORIES = {
    DocumentCategory.OFFER_LETTER,
    DocumentCategory.PAN_CARD,
    DocumentCategory.AADHAAR_CARD,
}
