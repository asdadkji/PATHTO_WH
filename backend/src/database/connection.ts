//数据库连接池管理
import mysql from 'mysql2/promise';
import {ENV} from '@/config'
export const pool = mysql.createPool({
    host: ENV.DB_HOST,
    port: Number(ENV.DB_PORT),
    user: ENV.DB_USER,
    password: ENV.DB_PASSWORD,
    database: ENV.DB_NAME,
})