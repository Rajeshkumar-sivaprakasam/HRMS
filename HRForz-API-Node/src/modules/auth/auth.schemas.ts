import { z } from 'zod';
import { Role } from '../../shared/enums';

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RefreshRequestSchema = z.object({
  refreshToken: z.string(),
});

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordRequestSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

export const ActivateAccountRequestSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export type ActivateAccountRequest = z.infer<typeof ActivateAccountRequestSchema>;

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  role: Role;
  employeeId: string;
  workLocationId?: string | null;
  workLocationName?: string | null;
}
