// 兑换模块服务：提交兑换（事务扣积分+扣库存）、查询兑换记录、取消兑换（事务退还积分+库存）
import { randomUUID } from 'crypto';
import { RowDataPacket, PoolConnection } from 'mysql2/promise';
import { pool } from '@/database';
import { HttpError } from '@/utils/response';
import { RedemptionStatus } from '@/types/enums';

// 合法的兑换状态枚举值列表（用于 status 过滤校验）
const REDEMPTION_STATUSES = Object.values(RedemptionStatus) as string[];

// 提交兑换返回
export interface SubmitRedemptionResult {
  redemptionId: string;
  status: 'pending';
  pointsUsed: number;
}

// 兑换记录条目（用户端）
export interface RedemptionListItem {
  redemptionId: string;
  productName: string;
  status: string;
  pointsUsed: number;
}

class RedemptionService {
  // POST /api/redemption/submit：提交兑换申请（事务）
  // 校验商品上架+库存+积分 → INSERT redemption → 扣积分+写流水 → 扣库存
  async submitRedemption(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<SubmitRedemptionResult> {
    // 1. 查商品：不存在或未上架 → 400「商品不可兑换」
    const [pRows] = await pool.query<RowDataPacket[]>(
      `SELECT product_id, price_points, stock, is_active
       FROM products
       WHERE product_id = ?
       LIMIT 1`,
      [productId],
    );
    const product = pRows[0];
    if (!product || !product.is_active) {
      throw new HttpError(400, '商品不可兑换', 400);
    }

    const pricePoints = Number(product.price_points) || 0;
    const stock = Number(product.stock) || 0;
    const pointsUsed = pricePoints * quantity;

    // 2. 库存校验：stock≠-1(无限) 且 stock<quantity → 400「库存不足」
    if (stock !== -1 && stock < quantity) {
      throw new HttpError(400, '库存不足', 400);
    }

    // 3. 查用户积分：total_points<pointsUsed → 400「积分不足」
    const [uRows] = await pool.query<RowDataPacket[]>(
      `SELECT total_points FROM users WHERE user_id = ? LIMIT 1`,
      [userId],
    );
    const userTotal = Number(uRows[0]?.total_points) || 0;
    if (userTotal < pointsUsed) {
      throw new HttpError(400, '积分不足', 400);
    }

    // 4. 事务：INSERT redemption → 扣积分 → 取新余额 → 写流水 → 扣库存
    const redemptionId = randomUUID();
    let conn: PoolConnection | undefined;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();

      // 4.1 写入兑换订单（status='pending'）
      await conn.query(
        `INSERT INTO redemptions
           (redemption_id, user_id, product_id, quantity, total_points_used, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [redemptionId, userId, productId, quantity, pointsUsed, RedemptionStatus.Pending],
      );

      // 4.2 扣减用户积分
      await conn.query(
        `UPDATE users SET total_points = total_points - ? WHERE user_id = ?`,
        [pointsUsed, userId],
      );

      // 4.3 查询扣减后余额（保证 balance_after 为实际余额）
      const [bRows] = await conn.query<RowDataPacket[]>(
        `SELECT total_points FROM users WHERE user_id = ? LIMIT 1`,
        [userId],
      );
      const balanceAfter = Number(bRows[0]?.total_points) || 0;

      // 4.4 写入积分流水（change_amount 为负，source_type='redemption'，source_id=兑换ID）
      await conn.query(
        `INSERT INTO point_logs
           (log_id, user_id, change_amount, balance_after, source_type, source_id, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [randomUUID(), userId, -pointsUsed, balanceAfter, 'redemption', redemptionId, '兑换商品'],
      );

      // 4.5 扣减库存（无限库存 stock=-1 跳过）
      if (stock !== -1) {
        await conn.query(
          `UPDATE products SET stock = stock - ? WHERE product_id = ?`,
          [quantity, productId],
        );
      }

      await conn.commit();
      return { redemptionId, status: 'pending', pointsUsed };
    } catch (_err) {
      // 事务失败：回滚并抛 500
      if (conn) {
        try {
          await conn.rollback();
        } catch {
          /* 忽略回滚过程中的二次错误 */
        }
      }
      throw new HttpError(500, '提交兑换失败', 500);
    } finally {
      // 确保连接归还连接池（成功/失败均执行）
      if (conn) conn.release();
    }
  }

  // GET /api/redemption/list：当前用户的兑换记录，可按 status 过滤
  // status 不传返回全部；传非法枚举则忽略过滤返回全部（不抛 400）
  async listRedemptions(
    userId: string,
    status?: string,
  ): Promise<RedemptionListItem[]> {
    // 仅当传入合法枚举值时才启用 status 过滤
    const useFilter =
      typeof status === 'string' && status !== '' && REDEMPTION_STATUSES.includes(status);

    if (useFilter) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT r.redemption_id, p.name AS product_name, r.status, r.total_points_used
         FROM redemptions r
         JOIN products p ON r.product_id = p.product_id
         WHERE r.user_id = ? AND r.status = ?
         ORDER BY r.created_at DESC`,
        [userId, status],
      );
      return rows.map((r) => ({
        redemptionId: r.redemption_id,
        productName: r.product_name,
        status: r.status,
        pointsUsed: Number(r.total_points_used) || 0,
      }));
    }

    // 未传或非法 status：返回当前用户全部兑换记录
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.redemption_id, p.name AS product_name, r.status, r.total_points_used
       FROM redemptions r
       JOIN products p ON r.product_id = p.product_id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [userId],
    );
    return rows.map((r) => ({
      redemptionId: r.redemption_id,
      productName: r.product_name,
      status: r.status,
      pointsUsed: Number(r.total_points_used) || 0,
    }));
  }

  // PUT /api/redemption/:id/cancel：取消兑换订单（事务退还积分+库存）
  // 仅 pending 可取消；订单不存在或不属于当前用户均 404（不暴露订单存在性）
  async cancelRedemption(
    redemptionId: string,
    userId: string,
  ): Promise<{ success: true; refundPoints: number }> {
    // 1. 查订单并校验归属当前用户（不存在或不属于本人均返回 404，防越权探测）
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT redemption_id, user_id, product_id, quantity, total_points_used, status
       FROM redemptions
       WHERE redemption_id = ?
       LIMIT 1`,
      [redemptionId],
    );
    const redemption = rows[0];
    if (!redemption || redemption.user_id !== userId) {
      throw new HttpError(404, '订单不存在', 404);
    }
    // 2. 仅 pending 可取消（已批准/已完成等不可取消 → 400「不可取消」）
    if (redemption.status !== RedemptionStatus.Pending) {
      throw new HttpError(400, '不可取消', 400);
    }

    const pointsUsed = Number(redemption.total_points_used) || 0;
    const quantity = Number(redemption.quantity) || 0;
    const productId = redemption.product_id;

    // 3. 事务：UPDATE status='cancelled' → 退还积分 → 取新余额 → 写流水 → 加回库存
    let conn: PoolConnection | undefined;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();

      // 3.1 更新订单为已取消
      await conn.query(
        `UPDATE redemptions SET status = ?, updated_at = NOW() WHERE redemption_id = ?`,
        [RedemptionStatus.Cancelled, redemptionId],
      );

      // 3.2 退还积分（加回 total_points_used）
      await conn.query(
        `UPDATE users SET total_points = total_points + ? WHERE user_id = ?`,
        [pointsUsed, userId],
      );

      // 3.3 查询退还后余额（保证 balance_after 为实际余额）
      const [bRows] = await conn.query<RowDataPacket[]>(
        `SELECT total_points FROM users WHERE user_id = ? LIMIT 1`,
        [userId],
      );
      const balanceAfter = Number(bRows[0]?.total_points) || 0;

      // 3.4 写入积分流水（退还，change_amount 为正）
      await conn.query(
        `INSERT INTO point_logs
           (log_id, user_id, change_amount, balance_after, source_type, source_id, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [randomUUID(), userId, pointsUsed, balanceAfter, 'redemption', redemptionId, '兑换取消退还'],
      );

      // 3.5 加回库存（无限库存 stock=-1 跳过）：事务内查当前 stock 判定
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
      return { success: true, refundPoints: pointsUsed };
    } catch (_err) {
      // 事务失败：回滚并抛 500
      if (conn) {
        try {
          await conn.rollback();
        } catch {
          /* 忽略回滚过程中的二次错误 */
        }
      }
      throw new HttpError(500, '取消兑换失败', 500);
    } finally {
      if (conn) conn.release();
    }
  }
}

export const redemptionService = new RedemptionService();
