//JWT认证配置
export const AUTH = {
    JWT_SECRET: process.env.JWT_SECRET || 'secret',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '1d',
    BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS) || 10
} as const;