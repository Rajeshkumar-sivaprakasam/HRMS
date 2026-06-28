export enum PermissionType {
  EARLY_OUT = 'early_out',
  LATE_IN = 'late_in',
  MID_DAY_OUT = 'mid_day_out',
}

export enum PermissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ExcessAction {
  HALF_DAY = 'half_day',
  LOP = 'lop',
  BLOCK = 'block',
}
