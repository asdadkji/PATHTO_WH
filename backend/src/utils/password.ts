// 密码哈希工具（使用 bcryptjs 纯 JS 实现，避免原生编译依赖）
import bcrypt from 'bcryptjs';
import { AUTH } from '@/config';

export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, AUTH.BCRYPT_ROUNDS);

export const comparePassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);
