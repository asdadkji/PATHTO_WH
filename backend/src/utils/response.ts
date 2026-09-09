// 统一响应与错误工具
import { Response } from 'express';

export interface ApiResponse<T = any> {
  code: number;
  data: T | null;
  message: string;
}

// 业务错误：携带 HTTP 状态码与业务 code
export class HttpError extends Error {
  status: number;
  code: number;
  constructor(status: number, message: string, code?: number) {
    super(message);
    this.status = status;
    this.code = code ?? status;
  }
}

// 成功响应：{ code: 0, data, message: 'success' }
export const success = <T>(res: Response, data: T, message = 'success') => {
  return res.json({ code: 0, data, message });
};

// 失败响应
export const fail = (res: Response, status: number, message: string, code?: number) => {
  return res.status(status).json({ code: code ?? status, data: null, message });
};
