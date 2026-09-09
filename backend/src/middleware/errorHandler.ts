// 集中式错误处理与 404
import { Request, Response, NextFunction } from 'express';
import { HttpError } from '@/utils/response';

export const notFound = (_req: Request, res: Response) => {
  res.status(404).json({ code: 404, data: null, message: '资源不存在' });
};

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ code: err.code, data: null, message: err.message });
  }
  console.error('未捕获错误:', err);
  return res.status(500).json({ code: 500, data: null, message: err.message || '服务器内部错误' });
};
