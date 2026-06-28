import crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import {
  LoginRequest,
  RefreshRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ActivateAccountRequest,
  TokenResponse,
} from './auth.schemas';
import { hashPassword, verifyPassword } from '../../core/security/password';
import {
  createAccessToken,
  createRefreshToken,
  decodeRefreshToken,
} from '../../core/security/jwt';
import { cacheGet, cacheSet, cacheDelete } from '../../core/cache';
import { CacheKeys } from '../../core/cache/keys';
import {
  Unauthorized,
  BusinessRuleViolation,
  NotFound,
  TokenInvalid,
} from '../../core/exceptions';
import { CurrentUser } from '../../core/middleware/auth';

export class AuthService {
  private repo: AuthRepository;

  constructor() {
    this.repo = new AuthRepository();
  }

  async login(payload: LoginRequest): Promise<{ tokenResponse: TokenResponse; refreshToken: string }> {
    const user = await this.repo.getByEmail(payload.email);
    
    if (!user || !(await verifyPassword(payload.password, user.hashedPassword))) {
      throw new Unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw new BusinessRuleViolation('Account is not activated. Check your email.');
    }

    if (!user.isEmailVerified) {
      throw new BusinessRuleViolation('Email not verified.');
    }

    if (!user.employeeId) {
      throw new BusinessRuleViolation('Employee profile not linked to this user.');
    }

    const accessToken = await createAccessToken(
      user.id,
      user.employeeId,
      user.role,
      user.email
    );

    const refreshToken = await createRefreshToken(user.id);

    await cacheSet(CacheKeys.refreshToken(user.id), refreshToken, 7 * 24 * 3600);

    let workLocationId: string | null = null;
    let workLocationName: string | null = null;

    if (user.employee) {
      workLocationId = user.employee.workLocationId || null;
      workLocationName = user.employee.workLocation?.name || null;
    }

    return {
      tokenResponse: {
        accessToken,
        tokenType: 'bearer',
        role: user.role,
        employeeId: user.employeeId,
        workLocationId,
        workLocationName,
      },
      refreshToken,
    };
  }

  async refresh(payload: RefreshRequest): Promise<TokenResponse> {
    const data = await decodeRefreshToken(payload.refreshToken);
    const userId = data.sub;

    const stored = await cacheGet<string>(CacheKeys.refreshToken(userId));
    if (stored !== payload.refreshToken) {
      throw new TokenInvalid('Refresh token revoked or invalid');
    }

    const user = await this.repo.getById(userId);
    if (!user || !user.isActive) {
      throw new Unauthorized();
    }

    const accessToken = await createAccessToken(
      user.id,
      user.employeeId!,
      user.role,
      user.email
    );

    return {
      accessToken,
      tokenType: 'bearer',
      role: user.role,
      employeeId: user.employeeId!,
    };
  }

  async logout(currentUser: CurrentUser): Promise<void> {
    await cacheDelete(CacheKeys.refreshToken(currentUser.userId));
  }

  async changePassword(
    currentUser: CurrentUser,
    payload: ChangePasswordRequest
  ): Promise<void> {
    const user = await this.repo.getById(currentUser.userId);
    if (!user) {
      throw new NotFound('User');
    }

    if (!(await verifyPassword(payload.currentPassword, user.hashedPassword))) {
      throw new BusinessRuleViolation('Current password is incorrect');
    }

    user.hashedPassword = await hashPassword(payload.newPassword);
    await this.repo.save(user);
    await cacheDelete(CacheKeys.refreshToken(currentUser.userId));
  }

  async forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
    const user = await this.repo.getByEmail(payload.email);
    if (!user) {
      return; // Don't reveal if email exists
    }

    const token = crypto.randomBytes(32).toString('base64url');
    user.passwordResetToken = token;
    await this.repo.save(user);

    // TODO: Send email via task queue
  }

  async resetPassword(payload: ResetPasswordRequest): Promise<void> {
    const user = await this.repo.getByResetToken(payload.token);
    if (!user) {
      throw new TokenInvalid('Invalid or expired reset token');
    }

    user.hashedPassword = await hashPassword(payload.newPassword);
    user.passwordResetToken = null;
    await this.repo.save(user);
  }

  async activateAccount(payload: ActivateAccountRequest): Promise<void> {
    const user = await this.repo.getByActivationToken(payload.token);
    if (!user) {
      throw new TokenInvalid('Invalid or expired activation token');
    }

    user.hashedPassword = await hashPassword(payload.newPassword);
    user.activationToken = null;
    user.isActive = true;
    user.isEmailVerified = true;
    await this.repo.save(user);
  }
}
