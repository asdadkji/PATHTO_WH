//登录模型
import {pool} from '@/database'
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface UserRow extends RowDataPacket {
    id: number;
    username: string;
    password_hash: string;
}
export const AuthModel = {
    async create(u:{ username:string; password_hash:string, phone:number }){
        const [ok] = await pool.execute<ResultSetHeader>(
            'INSERT INTO users (username, password_hash, phone) VALUES (?, ?, ?)',[u.username, u.password_hash, u.phone]
        );
        return ok.insertId;
    },
    async updatePwd(id:number, password_hash:string){
        await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, id]);
    },
    async findByUsername(username: string){
        const [user] = await pool.execute<UserRow[]>('SELECT * FROM users WHERE username = ?', [username]);
        return user[0];
    },
    //商家登录认证
    async createMerchant(userId:number,realUserName:string){
        const [res] = await pool.query('UPDATE users SET real_name = ? WHERE id = ?', [realUserName, userId]);
        const [res2] = await pool.query('INSERT INTO merchant (user_id) VALUES (?)', [userId]);
        return (res2 as any).insertId;
    },
    //判定是否为商家
    async existByUserId(userId:number){
        const [rows] = await pool.query('SELECT id FROM merchant WHERE user_id = ?', [userId]);
        return (rows as any[]).length > 0
    },
    //重置密码前置验证
    async checkAccount(username:string,phone:number){
        const [res] = await pool.query('SELECT id FROM users WHERE username = ? AND phone = ?', [username, phone]);
        return (res as any[]).length > 0
    }
}