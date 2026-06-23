//用户模型
import {pool} from '@/database'
import { RowDataPacket, ResultSetHeader } from 'mysql2';
//数据库返回数据类型
interface DBUser extends RowDataPacket {
    id:number
    username:string
    phone:string
    student_id:string
    avatar_url:string
    college:string
    bio:string
    gender:string
    signature:string
    is_active:boolean
    is_banned:boolean
    ban_reason?:string
    total_transactions:number
    rating:number
}


export const UserModel = {
    //根据ID查找用户，并展示个人信息
    async findById(id:number):Promise<DBUser|null> {
        const [rows] = await pool.query<DBUser[]>('SELECT * FROM users WHERE id = ?', [id])
        return rows[0] || null;
    },
    //修改/保存
    async update(id:number, updateData:{
        username?:string
        phone?:string
        qq?:string
        student_id?:string
        avatar_url?:string
        college?:string
        bio?:string
        gender?:string
        signature?:string
    }):Promise<boolean> {
        const fields = Object.keys(updateData);
        if (fields.length === 0) {
            return false;
        }
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => (updateData as any)[field]);
        values.push(id);
        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE users SET ${setClause} WHERE id = ?`, values
        )

        return result.affectedRows > 0;
    },

    //判定用户名是否重复
    async isUsernameExists(username:string, excludeId?:number):Promise<boolean> {
        let query = `SELECT COUNT(*) as count FROM users WHERE username = ?`;
        const params:any[] = [username];
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        const [rows] = await pool.query<ResultSetHeader[]>(query, params);
        return (rows[0] as any).count > 0;
    }
}