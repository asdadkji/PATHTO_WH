import 'reflect-metadata';
// Jest 测试环境初始化：jest 默认会设 NODE_ENV=test，但本项目的 config/index.ts
// 依据 NODE_ENV 加载 .env.${NODE_ENV}。这里强制设为 development 以加载 .env.development，
// 并显式预加载环境变量作为双保险（确保 DB 连接配置在所有模块 import 前就绪）。
process.env.NODE_ENV = 'development';
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.development') });
