import { Request, Response, NextFunction } from 'express';
import { decodeAccessToken } from '../security/jwt';
import { Unauthorized, Forbidden } from '../exceptions/base';
import { Role } from '../../shared/enums';

export interface CurrentUser {
  userId: string;
  employeeId: string;
  role: Role;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: CurrentUser;
      requestId?: string;
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Unauthorized();
    }

    const token = authHeader.substring(7);
    const payload = await decodeAccessToken(token);

    req.currentUser = {
      userId: payload.sub,
      employeeId: payload.employee_id,
      role: payload.role as Role,
      email: payload.email,
    };

    next();
  } catch (err) {
    next(err);
  }
}

export function requireRoles(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.currentUser) {
      return next(new Unauthorized());
    }

    if (!roles.includes(req.currentUser.role)) {
      return next(new Forbidden(`Requires one of: ${roles.join(', ')}`));
    }

    next();
  };
}

export const hrOnly = requireRoles(Role.HR_ADMIN, Role.SUPER_ADMIN);
export const financeOnly = requireRoles(Role.FINANCE_ADMIN, Role.SUPER_ADMIN);
export const hrOrFinance = requireRoles(Role.HR_ADMIN, Role.FINANCE_ADMIN, Role.SUPER_ADMIN);
export const managerOrHR = requireRoles(Role.MANAGER, Role.HR_ADMIN, Role.SUPER_ADMIN);
