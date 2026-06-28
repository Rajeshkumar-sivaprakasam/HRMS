import rateLimit from 'express-rate-limit';
import { config } from '../../config';

const AUTH_PATHS = new Set(['/v1/auth/login', '/v1/auth/forgot-password']);

export const rateLimitMiddleware = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: (req) => {
    if (AUTH_PATHS.has(req.path)) {
      return config.AUTH_RATE_LIMIT_PER_MINUTE;
    }
    return config.RATE_LIMIT_PER_MINUTE;
  },
  message: {
    message: 'Too many requests. Please slow down.',
    response: null,
    code: 'RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
