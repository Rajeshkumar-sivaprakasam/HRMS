export enum OnboardingStatus {
  DRAFT = 'draft',
  ACTIVATED = 'activated',
  CANCELLED = 'cancelled',
}

export enum DocumentCategory {
  OFFER_LETTER = 'offer_letter',
  PAN_CARD = 'pan_card',
  AADHAAR_CARD = 'aadhaar_card',
  BANK_PASSBOOK = 'bank_passbook',
  RELIEVING_LETTER = 'relieving_letter',
  EDUCATION_CERTIFICATE = 'education_certificate',
  OTHER = 'other',
}

export enum DocumentStatus {
  PENDING = 'pending',
  UPLOADED = 'uploaded',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

// Categories where only one document is allowed per onboarding session
export const SINGLE_FILE_CATEGORIES = new Set([
  DocumentCategory.OFFER_LETTER,
  DocumentCategory.PAN_CARD,
  DocumentCategory.AADHAAR_CARD,
  DocumentCategory.BANK_PASSBOOK,
  DocumentCategory.RELIEVING_LETTER,
]);

// Required document categories that must be uploaded before activation
export const REQUIRED_CATEGORIES = new Set([
  DocumentCategory.OFFER_LETTER,
  DocumentCategory.PAN_CARD,
  DocumentCategory.AADHAAR_CARD,
]);
