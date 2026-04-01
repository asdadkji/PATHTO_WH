//用户优惠券模型
import {pool} from '@/database'
import { RowDataPacket } from 'mysql2';
import type{CouponType,CouponStatus} from '@/types/apis/Coupon'
interface DBCoupon extends RowDataPacket {
    id: number
    user_id: number
    batch_id: number
    status:CouponStatus
    order_id:number | null
    received_at: Date
    used_at: Date | null
    expired_at: Date
}
interface DBCouponWithBatch extends DBCoupon {
    title: string
    type: CouponType
    full_amount: number
    discount: number
    use_start: Date
    use_end: Date
    merchant_id: bigint
    merchant_name: string
    shop_logo?: string
    is_expired: boolean
    is_available: boolean
}
interface DBCouponBatch extends RowDataPacket {
    id: number
    title: string
    type: CouponType
    full_amount: number
    discount: number
    use_start: Date
    use_end: Date
    merchant_id: bigint
    status:string
    received_start: Date
    received_end: Date
    total_cnt: number
    per_limit: number
}
export const CouponModel = {
    //根据ID、status查找展示用户所有优惠券
    async findCouponByUserId(userId: number, status:string): Promise<DBCouponWithBatch[]> {
        const sql = `
        SELECT 
        uc.*,
        cb.title as coupon_title, 
        cb.type as coupon_type, 
        cb.full_amount, 
        cb.discount, 
        cb.use_start, 
        cb.use_end, 
        cb.merchant_id, 
        m.shop_name as merchant_name, 
        m.shop_logo 
        FROM user_coupon uc 
            LEFT JOIN coupon_batch cb ON uc.batch_id = cb.id 
            LEFT JOIN merchant m ON cb.merchant_id = m.id 
        WHERE uc.user_id = ? AND uc.status = ? 
        ORDER BY uc.expired_at ASC `
        const [rows] = await pool.execute(sql, [userId, status])
        return rows as DBCouponWithBatch[]
    },
    //获取用户优惠券总数-分页
    async findCouponCountByUserId(userId: number,status:string): Promise<number> {
        const [rows] = await pool.query(`SELECT COUNT(*) as total FROM user_coupon WHERE user_id = ? AND status = ?`,[userId, status])
        const result = rows as {total:number}[];
        return result[0].total;
    },
    //获取商家发放的优惠券
    async findMerchantCoupon(merchantId: number,userId = null):Promise<DBCouponBatch[]> {
        let query = `
        SELECT
            id,
            title,
            type,
            full_amount,
            discount,
            use_start,
            use_end,
            merchant_id,
            status,
            receive_start,
            receive_end,
            total_cnt,
            per_limit
        FROM coupon_batch
        WHERE merchant_id = ?
        `;
        const [rows] = await pool.execute(query, [merchantId])
        return rows as DBCouponBatch[]
    },
    //用户领取优惠券
    async receiveCoupon(userId: number, batchId: number) {
        //根据前端优惠券对应数据库的id来查找其完整信息
        const [batchRows] = await pool.query(
            'SELECT * FROM coupon_batch WHERE id = ? FOR UPDATE',
            [batchId]
        ) as [any[],any];
        if (batchRows.length === 0) {
            throw new Error('优惠券不存在');
        }
        const batch = batchRows[0];
        //验证优惠券状态
        const now = new Date();
        //优惠券是否下架
        if (batch.status !== 1) {
            throw new Error('优惠券已下架');
        }
        //优惠券领取时间是否过期
        if (now < batch.receive_start || now > batch.receive_end) {
            throw new Error('不在领取时间内');
        }
        //优惠券是否已领完
        if (batch.total_cnt !== -1 && batch.total_cnt <= 0) {
            throw new Error('优惠券已领完');
        }
        //优惠券领取是否已达上限
        const [countRows] = await pool.query(
            'SELECT COUNT(*) as count FROM user_coupon WHERE user_id = ? AND batch_id = ?',
            [userId, batchId]
        ) as [any[],any];
        if (batch.per_limit > 0 && countRows[0].count >= batch.per_limit) {
            throw new Error('已达到领取上限');
        }
        //更新商家优惠券数量
        if (batch.total_cnt !== -1) {
            await pool.execute(
                'UPDATE coupon_batch SET total_cnt = total_cnt - 1 WHERE id = ?',
                [batchId]
            );
        }
        //更新用户优惠券数量
        const [result] = await pool.execute(
            `INSERT INTO user_coupon (user_id, batch_id, expired_at, status) 
         VALUES (?, ?, ?, 'unused')`,
            [userId, batchId, batch.use_end]
        );
        return result
    },
    //商家添加优惠券
    async addCoupon(data:any):Promise<any>{
        const sql = `INSERT INTO coupon_batch 
    (merchant_id, 
     title, 
     type, 
     full_amount, 
     discount, 
     total_cnt, 
     per_limit, 
     receive_start, 
     receive_end, 
     use_start, 
     use_end) VALUES (?,?,?,?,?,?,?,?,?,?,?)`
        const [result] = await pool.execute(sql, [data.merchant_id, data.title, data.type, data.full_amount, data.discount, data.total_cnt, data.per_limit, data.receive_start, data.receive_end, data.use_start, data.use_end]);
        return result;
    },
    //商家查看优惠券
    async getBatch(merchantId:number,filter?:{title?:string,status?:number}):Promise<any>{
        let sql = `SELECT * FROM coupon_batch WHERE merchant_id = ?`;
        const params:any[] = [merchantId]
        if(filter?.title){
            sql += ` AND title LIKE ?`;
            params.push(`%${filter.title}%`)
        }
        if(filter?.status !== undefined && filter?.status !== null){
            sql += ` AND status = ?`;
            params.push(filter.status)
        }
        sql += ` ORDER BY created_at DESC`
        const [result] = await pool.execute(sql, params);
        return result;
    },
    //商家停用优惠券
    async stopBatch(id:number,batchId:number):Promise<any>{
        const sql = `UPDATE coupon_batch SET status = 2 WHERE id = ? AND merchant_id = ?`;
        const [result] = await pool.query(sql, [id,batchId]);
        return result;
    },
    //商家启动优惠券
    async startBatch(id:number,batchId:number):Promise<any>{
        const sql = `UPDATE coupon_batch SET status = 1 WHERE id = ? AND merchant_id = ?`;
        const [result] = await pool.execute(sql, [id,batchId]);
        return result;
    }
}