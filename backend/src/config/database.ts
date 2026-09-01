//数据库连接配置
export const ENV = {
    DB_HOST: process.env.DB_HOST,
    DB_PORT: Number(process.env.DB_PORT),
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME,
    DB_POOL_MIN: process.env.DB_POOL_MIN,
    DB_POOL_MAX: process.env.DB_POOL_MAX,
    DB_PASSWORD: process.env.DB_PASSWORD,
} as const;
