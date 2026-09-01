// 管理员模块服务：兑换订单管理（列表、批准、拒绝含事务退还）
import { randomUUID } from 'crypto';
import { RowDataPacket, PoolConnection } from 'mysql2/promise';
import { pool } from '@/database';
import { HttpError } from '@/utils/response';
import { RedemptionStatus } from '@/types/enums';

// 合法的兑换状态枚举值列表（用于 status 过滤校验）
const REDEMPTION_STATUSES = Object.values(RedemptionStatus) as string[];

// 管理端兑换记录条目（含 userName）
export interface AdminRedemptionListItem {
  redemptionId: string;
  userName: string;
  productName: string;
  status: string;
  pointsUsed: number;
}

class AdminService {
  // GET /api/admin/redemption/list：所有用户的兑换记录，可按 status 过滤
  // status 不传返回全部；传非法枚举则忽略过滤返回全部（不抛 400）
  async listRedemptions(status?: string): Promise<AdminRedemptionListItem[]> {
    // 仅当传入合法枚举值时才启用 status 过滤
    const useFilter =
      typeof status === 'string' && status !== '' && REDEMPTION_STATUSES.includes(status);

    if (useFilter) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT r.redemption_id, u.username AS user_name, p.name AS product_name, r.status, r.total_points_used
         FROM redemptions r
         JOIN users u ON r.user_id = u.user_id
         JOIN products p ON r.product_id = p.product_id
         WHERE r.status = ?
         ORDER BY r.created_at DESC`,
        [status],
      );
      return rows.map((r) => ({
        redemptionId: r.redemption_id,
        userName: r.user_name,
        productName: r.product_name,
        status: r.status,
        pointsUsed: Number(r.total_points_used) || 0,
      }));
    }

    // 未传或非法 status：返回所有用户的兑换记录
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.redemption_id, u.username AS user_name, p.name AS product_name, r.status, r.total_points_used
       FROM redemptions r
       JOIN users u ON r.user_id = u.user_id
       JOIN products p ON r.product_id = p.product_id
       ORDER BY r.created_at DESC`,
    );
    return rows.map((r) => ({
      redemptionId: r.redemption_id,
      userName: r.user_name,
      productName: r.product_name,
      status: r.status,
      pointsUsed: Number(r.total_points_used) || 0,
    }));
  }

  // PUT /api/admin/redemption/:id/approve：批准兑换订单
  // 仅 pending 可批准；批准时再次校验库存（防并发超扣等导致负库存）→ UPDATE status='approved'
  // 积分已在 submit 时扣除，approve 无需再扣积分/库存
  async approveRedemption(
    redemptionId: string,
    adminId: string,
  ): Promise<{ success: true; status: 'approved' }> {
    // 1. 查订单：不存在 → 404；非 pending → 400
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT redemption_id, product_id, status
       FROM redemptions
       WHERE redemption_id = ?
       LIMIT 1`,
      [redemptionId],
    );
    const redemption = rows[0];
    if (!redemption) {
      throw new HttpError(404, '订单不存在', 404);
    }
    if (redemption.status !== RedemptionStatus.Pending) {
      throw new HttpError(400, '订单状态不允许此操作', 400);
    }

    // 2. 再次校验库存：submit 已扣库存，若当前库存为负（并发超扣或被异常修改）→ 400「库存不足」
    const [pRows] = await pool.query<RowDataPacket[]>(
      `SELECT stock FROM products WHERE product_id = ? LIMIT 1`,
      [redemption.product_id],
    );
    const curStock = Number(pRows[0]?.stock) || 0;
    if (curStock !== -1 && curStock < 0) {
      throw new HttpError(400, '库存不足', 400);
    }

    // 3. 更新订单为已批准（写入处理人、处理时间）
    await pool.query(
      `UPDATE redemptions
       SET status = ?, processed_by = ?, processed_at = NOW(), updated_at = NOW()
       WHERE redemption_id = ?`,
      [RedemptionStatus.Approved, adminId, redemptionId],
    );

    return { success: true, status: 'approved' };
  }

  // PUT /api/admin/redemption/:id/reject：拒绝兑换订单（事务退还积分+库存）
  // 仅 pending 可拒绝；拒绝时退还积分（同 cancel 逻辑）并加回库存
  async rejectRedemption(
    redemptionId: string,
    adminId: string,
    rejectReason: string,
  ): Promise<{ success: true; status: 'rejected' }> {
    // 1. 查订单：不存在 → 404；非 pending → 400
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT redemption_id, user_id, product_id, quantity, total_points_used, status
       FROM redemptions
       WHERE redemption_id = ?
       LIMIT 1`,
      [redemptionId],
    );
    const redemption = rows[0];
    if (!redemption) {
      throw new HttpError(404, '订单不存在', 404);
    }
    if (redemption.status !== RedemptionStatus.Pending) {
      throw new HttpError(400, '订单状态不允许此操作', 400);
    }

    const userId = redemption.user_id;
    const productId = redemption.product_id;
    const quantity = Number(redemption.quantity) || 0;
    const pointsUsed = Number(redemption.total_points_used) || 0;

    // 2. 事务：UPDATE status='rejected' → 退还积分 → 取新余额 → 写流水 → 加回库存
    let conn: PoolConnection | undefined;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();

      // 2.1 更新订单为已拒绝（含拒绝原因、处理人、处理时间）
      await conn.query(
        `UPDATE redemptions
         SET status = ?, reject_reason = ?, processed_by = ?, processed_at = NOW(), updated_at = NOW()
         WHERE redemption_id = ?`,
        [RedemptionStatus.Rejected, rejectReason, adminId, redemptionId],
      );

      // 2.2 退还积分（加回 total_points_used）
      await conn.query(
        `UPDATE users SET total_points = total_points + ? WHERE user_id = ?`,
        [pointsUsed, userId],
      );

      // 2.3 查询退还后余额（保证 balance_after 为实际余额）
      const [bRows] = await conn.query<RowDataPacket[]>(
        `SELECT total_points FROM users WHERE user_id = ? LIMIT 1`,
        [userId],
      );
      const balanceAfter = Number(bRows[0]?.total_points) || 0;

      // 2.4 写入积分流水（退还，change_amount 为正）
      await conn.query(
        `INSERT INTO point_logs
           (log_id, user_id, change_amount, balance_after, source_type, source_id, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [randomUUID(), userId, pointsUsed, balanceAfter, 'redemption', redemptionId, '兑换拒绝退还'],
      );

      // 2.5 加回库存（无限库存 stock=-1 跳过）：事务内查当前 stock 判定
      const [pRows] = await conn.query<RowDataPacket[]>(
        `SELECT stock FROM products WHERE product_id = ? LIMIT 1`,
        [productId],
      );
      const curStock = Number(pRows[0]?.stock) || 0;
      if (curStock !== -1) {
        await conn.query(
          `UPDATE products SET stock = stock + ? WHERE product_id = ?`,
          [quantity, productId],
        );
      }

      await conn.commit();
      return { success: true, status: 'rejected' };
    } catch (_err) {
      // 事务失败：回滚并抛 500
      if (conn) {
        try {
          await conn.rollback();
        } catch {
          /* 忽略回滚过程中的二次错误 */
        }
      }
      throw new HttpError(500, '拒绝兑换失败', 500);
    } finally {
      if (conn) conn.release();
    }
  }
}

export const adminService = new AdminService();
