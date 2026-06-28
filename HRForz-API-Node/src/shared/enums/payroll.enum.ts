export enum PaymentMode {
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque',
}

export enum SalaryComponentType {
  EARNING = 'earning',
  DEDUCTION = 'deduction',
}

export enum SalaryCalcType {
  FIXED = 'fixed',
  FORMULA = 'formula',
  STATUTORY = 'statutory',
  MANUAL = 'manual',
}

export enum ComponentCategory {
  STATUTORY = 'statutory',
  CUSTOM = 'custom',
  AUTO = 'auto',
}

export enum SalaryRevisionType {
  INCREMENT = 'increment',
  PROMOTION = 'promotion',
  CORRECTION = 'correction',
  RESTRUCTURE = 'restructure',
  DEMOTION = 'demotion',
}

export enum TaxRegime {
  NEW = 'new',
  OLD = 'old',
}

export enum PayrollRunStatus {
  NOT_RUN = 'not_run',
  INITIATED = 'initiated',
  COMPUTED = 'computed',
  PREVIEW = 'preview',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  LOCKED = 'locked',
  RELEASED = 'released',
}

export enum FnFStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  PAID = 'paid',
}

export enum AdjustmentType {
  EARNING = 'earning',
  DEDUCTION = 'deduction',
}
