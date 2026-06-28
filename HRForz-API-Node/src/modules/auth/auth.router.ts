import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import {
  LoginRequestSchema,
  RefreshRequestSchema,
  ChangePasswordRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
  ActivateAccountRequestSchema,
} from './auth.schemas';
import { ApiResponseBuilder } from '../../shared/schemas/response';
import { authMiddleware } from '../../core/middleware/auth';

const router = Router();
const authService = new AuthService();

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = LoginRequestSchema.parse(req.body);
    const { tokenResponse, refreshToken } = await authService.login(payload);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
      path: '/v1/auth/refresh',
    });

    res.json(ApiResponseBuilder.ok(tokenResponse, 'Login successful'));
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = RefreshRequestSchema.parse(req.body);
    const tokenResponse = await authService.refresh(payload);
    res.json(ApiResponseBuilder.ok(tokenResponse, 'Token refreshed'));
  } catch (err) {
    next(err);
  }
});

router.post('/logout', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.logout(req.currentUser!);
    res.clearCookie('refresh_token', { path: '/v1/auth/refresh' });
    res.json(ApiResponseBuilder.ok(null, 'Logged out successfully'));
  } catch (err) {
    next(err);
  }
});

router.post('/change-password', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = ChangePasswordRequestSchema.parse(req.body);
    await authService.changePassword(req.currentUser!, payload);
    res.json(ApiResponseBuilder.ok(null, 'Password changed successfully'));
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = ForgotPasswordRequestSchema.parse(req.body);
    await authService.forgotPassword(payload);
    res.json(ApiResponseBuilder.ok(null, 'If the email exists, a reset link has been sent'));
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = ResetPasswordRequestSchema.parse(req.body);
    await authService.resetPassword(payload);
    res.json(ApiResponseBuilder.ok(null, 'Password reset successfully'));
  } catch (err) {
    next(err);
  }
});

router.post('/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = ActivateAccountRequestSchema.parse(req.body);
    await authService.activateAccount(payload);
    res.json(ApiResponseBuilder.ok(null, 'Account activated successfully'));
  } catch (err) {
    next(err);
  }
});

export const authRouter = router;
