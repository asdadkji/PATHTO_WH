//应用基础配置
export const APP = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: Number(process.env.PORT) || 3000,
} as const;