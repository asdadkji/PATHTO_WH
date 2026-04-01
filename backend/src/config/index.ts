//统一导出
import dotenv from 'dotenv';
import path from 'path';
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
export * from './app';
export * from './database';
export * from './auth';