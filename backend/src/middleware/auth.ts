// JWT 鉴权中间件：authRequired 校验登录，roleRequired 校验角色
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AUTH } from '@/config';
import { HttpError } from '@/utils/response';
import { Role } from '@/types/enums';

export interface JwtPayload {
  userId: string;
  role: Role;
}

// 扩展 Express Request，挂载已认证用户
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authRequired = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new HttpError(401, '未授权'));
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, AUTH.JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    return next(new HttpError(401, 'token已过期'));
  }
};

export const roleRequired = (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, '未授权'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, '无权限'));
    next();
  };
