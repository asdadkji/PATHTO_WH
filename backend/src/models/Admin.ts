//管理员模型
import {pool} from '@/database'
import { RowDataPacket, ResultSetHeader } from 'mysql2';
export interface GenderCountRow extends RowDataPacket {
    gender: 'male' | 'female' | 'unknown';
    count: number;
}
export interface RoleCountRow extends RowDataPacket {
    role: 'student' | 'teacher' | 'admin';
    count: number;
}
export interface DailyActiveRow extends RowDataPacket {
    date: string;
    active_count: number;
}
export interface VerificationStatsRow extends RowDataPacket {
    email_verified: number;
    phone_verified: number;
    real_name_verified: number;
}
// 数据库原始行
interface OrderRow extends RowDataPacket {
    weekday: string;
    deal_cnt: string;
    gmv: string;
}
// 用户活跃
interface ActiveRow extends RowDataPacket {
    weekday: string;
    active_cnt: string;
}
// 返回给前端的对象
export type ChartRaw = {
    title: string;
    data: number[];
    categories: string[];
    total: number;
    max: number;
    today: number;
};
export type DashboardResp = {
    dailyDealCount: ChartRaw;
    dailyGMV: ChartRaw;
    dailyActive: ChartRaw;
};
interface UserAuth extends RowDataPacket { role: string; }

export const AdminModel = {
    //验证是否为管理员
    async isAdmin(id: number): Promise<boolean> {
        const sql = 'SELECT * FROM users WHERE id = ? LIMIT 1';
        const [rows] = await pool.query<UserAuth[]>(sql, [id]);
        return rows.length > 0 && (rows[0].role === 'admin' || rows[0].role === 'maxAdmin');
    },
    //获取用户总数
    async getUserCount(): Promise<number> {
        const sql = 'SELECT COUNT(*) as count FROM users WHERE is_banned = 0';
        const [rows] = await pool.query<GenderCountRow[]>(sql);
        return rows[0]?.count || 0;
    },
    //获取性别占比
    async getGenderCount(): Promise<GenderCountRow[]> {
        const sql = 'SELECT gender, COUNT(*) as count FROM users WHERE is_banned = 0 GROUP BY gender';
        const [rows] = await pool.query<GenderCountRow[]>(sql);
        return rows;
    },
    //图表总数据（订单各层级成交量、订单各层级销售额、用户日活）
    async getDashboardData(): Promise<DashboardResp> {
        const orderSql = `
            SELECT
                CASE wd
                    WHEN 2 THEN '周一' WHEN 3 THEN '周二' WHEN 4 THEN '周三'
                    WHEN 5 THEN '周四' WHEN 6 THEN '周五' WHEN 7 THEN '周六' WHEN 1 THEN '周日'
                    END                                           AS weekday,
                deal_cnt,
                gmv
            FROM (
                     SELECT
                         DAYOFWEEK(completed_at)  AS wd,
                         COUNT(*)                 AS deal_cnt,
                         SUM(final_price)         AS gmv
                     FROM orders
                     WHERE status = 'completed'
                       AND YEARWEEK(completed_at, 1) = YEARWEEK(CURDATE(), 1)
                     GROUP BY DAYOFWEEK(completed_at)
                 ) AS sub
            ORDER BY wd;
  `;
        const [orderRows] = await pool.query<OrderRow[]>(orderSql);

        // 2. 用户活跃
        const activeSql = `
            SELECT
                CASE wd
                    WHEN 2 THEN '周一' WHEN 3 THEN '周二' WHEN 4 THEN '周三'
                    WHEN 5 THEN '周四' WHEN 6 THEN '周五' WHEN 7 THEN '周六' WHEN 1 THEN '周日'
                    END                                           AS weekday,
                active_cnt
            FROM (
                     SELECT
                         DAYOFWEEK(last_login_at)  AS wd,
                         COUNT(DISTINCT id)        AS active_cnt
                     FROM users
                     WHERE last_login_at >= DATE(CURDATE() - INTERVAL WEEKDAY(CURDATE()) DAY)
                       AND last_login_at <  DATE(CURDATE() - INTERVAL WEEKDAY(CURDATE()) DAY + INTERVAL 7 DAY)
                     GROUP BY DAYOFWEEK(last_login_at)
                 ) AS sub
            ORDER BY wd;
  `;
        const [activeRows] = await pool.query<ActiveRow[]>(activeSql);

        // 3. 补全 7 天
        const empty = { 周一: 0, 周二: 0, 周三: 0, 周四: 0, 周五: 0, 周六: 0, 周日: 0 };
        const cntMap: Record<string, number> = { ...empty };
        const gmvMap: Record<string, number> = { ...empty };
        const actMap: Record<string, number> = { ...empty };
        for (const r of orderRows) {
            cntMap[r.weekday] = Number(r.deal_cnt);
            gmvMap[r.weekday] = Number(r.gmv);
        }
        for (const r of activeRows) {
            actMap[r.weekday] = Number(r.active_cnt);
        }

        const todayKey = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date().getDay()];

        const pack = (title: string, map: Record<string, number>): ChartRaw => {
            const arr = Object.values(map);
            return {
                title,
                data: arr,
                categories: Object.keys(empty),
                total: arr.reduce((a, b) => a + b, 0),
                max: Math.max(...arr),
                today: map[todayKey],
            };
        };

        return {
            dailyDealCount: pack('每日成交单数', cntMap),
            dailyGMV: pack('每日成交金额', gmvMap),
            dailyActive: pack('每日用户活跃度', actMap),
        };
    },
    //赋予管理权限
    async grantAdminPermission(phone:string,username:string) {
        const sql = "UPDATE users SET role = 'admin' WHERE username = ? AND phone = ?";
        const [rows] = await pool.execute(sql, [username,phone]);
        const result = rows as any;
        return result.message ?? 'ok';
    },
    //判定用户是否存在
    async checkUserExist(phone:string,username:string) {
        const findSql = "SELECT id, username, phone, role FROM users WHERE username = ? AND phone = ?";
        const [users] = await pool.query(findSql, [username, phone]) as [any[], any];
        return users.length > 0;
    },
    //取消管理权限
    async cancelAdminPermission(userId: number) {
        const sql = "UPDATE users SET role = 'student' WHERE id = ? ";
        const [rows] = await pool.query(sql, [userId]);
        return rows
    },
    //获得商家列表
    async getBusinessList(page:number,pageSize:number) {
        const offset = (page - 1) * pageSize;
        const sql = "SELECT * FROM merchant WHERE status != '3' LIMIT ? OFFSET ?";
        const [rows] = await pool.query(sql,[pageSize,offset]);

        const countSql = "SELECT COUNT(*) as total FROM merchant WHERE status != '3'";
        const [countResult] = await pool.query(countSql) as any[][];
        const total = (countResult[0] as any)?.total || 0;
        return {
            data:rows,
            pagination: {
                total,
                pageSize,
                current: page,
            }
        }
    },
    //获取管理员列表
    async getAdminList() {
        const sql = "SELECT * FROM users WHERE role = 'admin' ";
        const [rows] = await pool.query(sql);
        return rows;
    },
    //冻结商家权限
    async freezeBusiness(merchantId: number,reason:string) {
        const sql = "UPDATE merchant SET status = '2', reason = ? WHERE id = ? ";
        await pool.query(sql, [reason,merchantId]);
        const offShelfSql = `
          UPDATE books
            SET status = 'expired', updated_at = NOW()
            WHERE merchant_id = ? AND status = 'available'`;
        await pool.execute(offShelfSql, [merchantId]);
        return 'ok'
    },
    //解冻商家权限
    async unfreezeBusiness(merchantId: number) {
        const sql = "UPDATE merchant SET status = '1' WHERE id = ? ";
        await pool.query(sql, [merchantId]);
        const offShelfSql = `
          UPDATE books
            SET status = 'available', updated_at = NOW()
            WHERE merchant_id = ? AND status = 'expired'`;
        await pool.execute(offShelfSql, [merchantId]);
        return 'ok'
    },
    //获取已送达的商品
    async getDeliveredGoods() {
        const sql = "SELECT * FROM orders WHERE status = 'delivered' ORDER BY created_at DESC";
        const [rows] = await pool.query(sql);
        return rows;
    }
}
