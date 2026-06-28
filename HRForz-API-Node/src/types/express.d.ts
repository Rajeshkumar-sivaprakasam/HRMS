import { CurrentUser } from '../core/middleware/auth';

declare global {
  namespace Express {
    interface Request {
      currentUser?: CurrentUser;
      requestId?: string;
    }
  }
}

export {};
