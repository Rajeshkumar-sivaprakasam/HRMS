import { z } from 'zod';
import {
  Gender,
  EmploymentType,
  WorkLocationType,
  EmployeeStatus,
  AccountType,
} from '../../shared/enums';

export const EmployeeCreateRequestSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  employmentType: z.nativeEnum(EmploymentType).default(EmploymentType.FULL_TIME),
  workLocationType: z.nativeEnum(WorkLocationType).default(WorkLocationType.OFFICE),
  dateOfJoining: z.coerce.date().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  designationId: z.string().uuid().optional().nullable(),
  workLocationId: z.string().uuid().optional().nullable(),
  reportingManagerId: z.string().uuid().optional().nullable(),
  probationEndDate: z.coerce.date().optional().nullable(),
  noticePeriodDays: z.number().int().optional().nullable(),
});

export const EmployeeUpdateRequestSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional().nullable(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  workLocationType: z.nativeEnum(WorkLocationType).optional(),
  departmentId: z.string().uuid().optional().nullable(),
  designationId: z.string().uuid().optional().nullable(),
  workLocationId: z.string().uuid().optional().nullable(),
  reportingManagerId: z.string().uuid().optional().nullable(),
  probationEndDate: z.coerce.date().optional().nullable(),
  noticePeriodDays: z.number().int().optional().nullable(),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactRelation: z.string().optional().nullable(),
});

export const BankDetailsRequestSchema = z.object({
  bankName: z.string(),
  accountNumber: z.string(),
  ifscCode: z.string(),
  accountType: z.nativeEnum(AccountType),
});

export const StatutoryDetailsRequestSchema = z.object({
  panNumber: z.string().optional().nullable(),
  aadharNumber: z.string().optional().nullable(),
  pfUanNumber: z.string().optional().nullable(),
  esicNumber: z.string().optional().nullable(),
});

export const EmployeeStatusUpdateRequestSchema = z.object({
  status: z.nativeEnum(EmployeeStatus),
  dateOfLeaving: z.coerce.date().optional().nullable(),
  reason: z.string().optional().nullable(),
});

export type EmployeeCreateRequest = z.infer<typeof EmployeeCreateRequestSchema>;
export type EmployeeUpdateRequest = z.infer<typeof EmployeeUpdateRequestSchema>;
export type BankDetailsRequest = z.infer<typeof BankDetailsRequestSchema>;
export type StatutoryDetailsRequest = z.infer<typeof StatutoryDetailsRequestSchema>;
export type EmployeeStatusUpdateRequest = z.infer<typeof EmployeeStatusUpdateRequestSchema>;

export interface EmployeeResponse {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  gender: Gender | null;
  dateOfBirth: Date | null;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  workLocationType: WorkLocationType;
  dateOfJoining: Date | null;
  dateOfLeaving: Date | null;
  probationEndDate: Date | null;
  noticePeriodDays: number | null;
  departmentId: string | null;
  designationId: string | null;
  workLocationId: string | null;
  reportingManagerId: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string;
  bankName: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
  accountType: AccountType | null;
  panNumber: string | null;
  aadharNumber: string | null;
  pfUanNumber: string | null;
  esicNumber: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  currentCtc: number | null;
  profilePictureUrl: string | null;
}

export interface EmployeeListItem {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  dateOfJoining: Date | null;
  departmentId: string | null;
  designationId: string | null;
  workLocationId: string | null;
  profilePictureUrl: string | null;
  departmentName: string | null;
  designationName: string | null;
  workLocationName: string | null;
  workLocationCity: string | null;
}
