export interface ExceptionDetails {
  [key: string]: unknown;
}

export class HRMSException extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: ExceptionDetails;

  constructor(
    message: string,
    code: string,
    statusCode: number = 400,
    details: ExceptionDetails = {}
  ) {
    super(message);
    this.name = 'HRMSException';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── 400 ────────────────────────────────────────────────────────────────────
export class ValidationError extends HRMSException {
  constructor(message: string, details: ExceptionDetails = {}) {
    super(message, 'VALIDATION_ERROR', 422, details);
    this.name = 'ValidationError';
  }
}

export class BusinessRuleViolation extends HRMSException {
  constructor(message: string, code: string = 'BUSINESS_RULE_VIOLATION') {
    super(message, code, 400);
    this.name = 'BusinessRuleViolation';
  }
}

// ── 401 / 403 ───────────────────────────────────────────────────────────────
export class Unauthorized extends HRMSException {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'Unauthorized';
  }
}

export class Forbidden extends HRMSException {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'Forbidden';
  }
}

export class TokenExpired extends HRMSException {
  constructor() {
    super('Token has expired', 'TOKEN_EXPIRED', 401);
    this.name = 'TokenExpired';
  }
}

export class TokenInvalid extends HRMSException {
  constructor(message: string = 'Token is invalid') {
    super(message, 'TOKEN_INVALID', 401);
    this.name = 'TokenInvalid';
  }
}

// ── 404 ────────────────────────────────────────────────────────────────────
export class NotFound extends HRMSException {
  constructor(resource: string, identifier?: string) {
    const msg = identifier ? `${resource} '${identifier}' not found` : `${resource} not found`;
    super(msg, 'NOT_FOUND', 404);
    this.name = 'NotFound';
  }
}

// ── 409 ────────────────────────────────────────────────────────────────────
export class Conflict extends HRMSException {
  constructor(message: string, code: string = 'CONFLICT') {
    super(message, code, 409);
    this.name = 'Conflict';
  }
}

export class DuplicateError extends Conflict {
  constructor(resource: string, field: string, value: string) {
    super(`${resource} with ${field} '${value}' already exists`, 'DUPLICATE_ERROR');
    this.name = 'DuplicateError';
  }
}

// ── 423 ────────────────────────────────────────────────────────────────────
export class ResourceLocked extends HRMSException {
  constructor(message: string) {
    super(message, 'LOCKED', 423);
    this.name = 'ResourceLocked';
  }
}

// ── Domain-specific ────────────────────────────────────────────────────────
export class InsufficientLeaveBalance extends BusinessRuleViolation {
  constructor(leaveType: string, available: number, requested: number) {
    super(
      `Insufficient ${leaveType} balance. Available: ${available}, Requested: ${requested}`,
      'INSUFFICIENT_LEAVE_BALANCE'
    );
    this.name = 'InsufficientLeaveBalance';
  }
}

export class AttendanceAlreadyClockedIn extends BusinessRuleViolation {
  constructor() {
    super('Employee is already clocked in', 'ALREADY_CLOCKED_IN');
    this.name = 'AttendanceAlreadyClockedIn';
  }
}

export class AttendanceNotClockedIn extends BusinessRuleViolation {
  constructor() {
    super('Employee has not clocked in yet', 'NOT_CLOCKED_IN');
    this.name = 'AttendanceNotClockedIn';
  }
}

export class PayrollAlreadyLocked extends ResourceLocked {
  constructor(month: number, year: number) {
    super(`Payroll for ${month}/${year} is locked and cannot be modified`);
    this.name = 'PayrollAlreadyLocked';
  }
}

export class PermissionLimitExceeded extends BusinessRuleViolation {
  constructor(limitType: string) {
    super(`Permission ${limitType} limit exceeded`, 'PERMISSION_LIMIT_EXCEEDED');
    this.name = 'PermissionLimitExceeded';
  }
}
