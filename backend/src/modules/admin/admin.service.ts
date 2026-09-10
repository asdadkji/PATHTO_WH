// 管理员模块服务：兑换订单管理 + 任务模板管理 + 商品管理
import { randomUUID } from 'crypto';
import { RowDataPacket, PoolConnection } from 'mysql2/promise';
import { pool } from '@/database';
import { HttpError } from '@/utils/response';
import { RedemptionStatus, TaskType, ProductCategory } from '@/types/enums';

// 合法的兑换状态枚举值列表（用于 status 过滤校验）
const REDEMPTION_STATUSES = Object.values(RedemptionStatus) as string[];

// 将 Date 按本地时区格式化为 'YYYY-MM-DD'。
// 注意：不能用 toISOString()——它按 UTC 输出，UTC+8 本地午夜/早8点前会回退一天，
// 与 MySQL CURDATE()/DATE 列的本地日期口径不一致，导致图表数据错位一天。
function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 生成近 n 天日期轴（含今天，旧→新），元素为本地 'YYYY-MM-DD'
function lastNDates(n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(formatLocalDate(d));
  }
  return dates;
}

// 管理端兑换记录条目（含 userName）
export interface AdminRedemptionListItem {
  redemptionId: string;
  userName: string;
  productName: string;
  status: string;
  pointsUsed: number;
}

// 管理端任务模板条目
export interface AdminTemplateItem {
  templateId: string;
  title: string;
  description: string | null;
  defaultPoints: number;
  streakBonus7: number;
  streakBonus30: number;
  category: string | null;
  isDailyRepeat: boolean;
  taskType: string;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
}

// 创建模板入参
export interface CreateTemplateInput {
  title: string;
  description?: string;
  defaultPoints: number;
  streakBonus7?: number;
  streakBonus30?: number;
  category?: string;
  isDailyRepeat?: boolean;
  taskType: string;
  icon?: string;
  color?: string;
  createdBy: string;
}

// 更新模板入参（所有字段可选）
export interface UpdateTemplateInput {
  title?: string;
  description?: string;
  defaultPoints?: number;
  streakBonus7?: number;
  streakBonus30?: number;
  category?: string;
  isDailyRepeat?: boolean;
  taskType?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
}

// 管理端商品条目
export interface AdminProductItem {
  productId: string;
  name: string;
  description: string | null;
  pricePoints: number;
  category: string;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  isVirtual: boolean;
  virtualValue: number | null;
  sortOrder: number;
  createdAt: string;
}

// 创建商品入参
export interface CreateProductInput {
  name: string;
  description?: string;
  pricePoints: number;
  category: string;
  stock?: number;
  imageUrl?: string;
  isVirtual?: boolean;
  virtualValue?: number;
  sortOrder?: number;
  createdBy: string;
}

// 更新商品入参（所有字段可选）
export interface UpdateProductInput {
  name?: string;
  description?: string;
  pricePoints?: number;
  category?: string;
  stock?: number;
  imageUrl?: string;
  isActive?: boolean;
  isVirtual?: boolean;
  virtualValue?: number;
  sortOrder?: number;
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

  // ─── 任务模板管理 ────────────────────────────────────────────

  // 将数据库行映射为 AdminTemplateItem
  private static toTemplateItem(r: RowDataPacket): AdminTemplateItem {
    return {
      templateId: r.template_id,
      title: r.title,
      description: r.description ?? null,
      defaultPoints: Number(r.default_points) || 0,
      streakBonus7: Number(r.streak_bonus_7_days) || 0,
      streakBonus30: Number(r.streak_bonus_30_days) || 0,
      category: r.category ?? null,
      isDailyRepeat: !!r.is_daily_repeat,
      taskType: r.task_type,
      icon: r.icon ?? null,
      color: r.color ?? null,
      isActive: !!r.is_active,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    };
  }

  // GET /api/admin/task-template/list：所有模板（可选 query: taskType 过滤）
  async listTemplates(taskType?: string): Promise<AdminTemplateItem[]> {
    const validTypes = Object.values(TaskType) as string[];
    const useFilter = typeof taskType === 'string' && validTypes.includes(taskType);

    const [rows] = await pool.query<RowDataPacket[]>(
      useFilter
        ? `SELECT * FROM task_templates WHERE task_type = ? ORDER BY created_at DESC`
        : `SELECT * FROM task_templates ORDER BY created_at DESC`,
      useFilter ? [taskType] : [],
    );
    return rows.map(AdminService.toTemplateItem);
  }

  // GET /api/admin/task-template/:id：单个模板详情
  async getTemplate(templateId: string): Promise<AdminTemplateItem> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM task_templates WHERE template_id = ? LIMIT 1`,
      [templateId],
    );
    if (!rows[0]) throw new HttpError(404, '模板不存在', 404);
    return AdminService.toTemplateItem(rows[0]);
  }

  // POST /api/admin/task-template：新建模板
  async createTemplate(input: CreateTemplateInput): Promise<AdminTemplateItem> {
    const templateId = randomUUID();
    await pool.query(
      `INSERT INTO task_templates
         (template_id, title, description, default_points, streak_bonus_7_days, streak_bonus_30_days,
          category, is_daily_repeat, task_type, icon, color, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)`,
      [
        templateId,
        input.title,
        input.description ?? null,
        input.defaultPoints,
        input.streakBonus7 ?? 0,
        input.streakBonus30 ?? 0,
        input.category ?? null,
        input.isDailyRepeat ?? false,
        input.taskType,
        input.icon ?? null,
        input.color ?? null,
        input.createdBy,
      ],
    );
    return this.getTemplate(templateId);
  }

  // PUT /api/admin/task-template/:id：更新模板
  async updateTemplate(templateId: string, input: UpdateTemplateInput): Promise<AdminTemplateItem> {
    // 先确认模板存在
    const existing = await this.getTemplate(templateId);
    if (!existing) throw new HttpError(404, '模板不存在', 404);

    const sets: string[] = [];
    const values: unknown[] = [];

    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      defaultPoints: 'default_points',
      streakBonus7: 'streak_bonus_7_days',
      streakBonus30: 'streak_bonus_30_days',
      category: 'category',
      isDailyRepeat: 'is_daily_repeat',
      taskType: 'task_type',
      icon: 'icon',
      color: 'color',
      isActive: 'is_active',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      const val = (input as Record<string, unknown>)[key];
      if (val !== undefined) {
        sets.push(`\`${col}\` = ?`);
        values.push(val);
      }
    }

    if (sets.length > 0) {
      values.push(templateId);
      await pool.query(
        `UPDATE task_templates SET ${sets.join(', ')} WHERE template_id = ?`,
        values,
      );
    }

    return this.getTemplate(templateId);
  }

  // PUT /api/admin/task-template/:id/toggle：切换模板启用/停用
  async toggleTemplateActive(templateId: string): Promise<AdminTemplateItem> {
    const existing = await this.getTemplate(templateId);
    if (!existing) throw new HttpError(404, '模板不存在', 404);

    await pool.query(
      `UPDATE task_templates SET is_active = NOT is_active WHERE template_id = ?`,
      [templateId],
    );
    return this.getTemplate(templateId);
  }

  // ─── 商品管理 ──────────────────────────────────────────────

  private static toProductItem(r: RowDataPacket): AdminProductItem {
    return {
      productId: r.product_id,
      name: r.name,
      description: r.description ?? null,
      pricePoints: Number(r.price_points) || 0,
      category: r.category,
      stock: Number(r.stock) || 0,
      imageUrl: r.image_url ?? null,
      isActive: !!r.is_active,
      isVirtual: !!r.is_virtual,
      virtualValue: r.virtual_value != null ? Number(r.virtual_value) : null,
      sortOrder: Number(r.sort_order) || 0,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    };
  }

  // GET /api/admin/product/list：所有商品（含已下架），可选 category 过滤
  async listAllProducts(category?: string): Promise<AdminProductItem[]> {
    const validCategories = Object.values(ProductCategory) as string[];
    const useFilter = typeof category === 'string' && validCategories.includes(category);

    const [rows] = await pool.query<RowDataPacket[]>(
      useFilter
        ? `SELECT * FROM products WHERE category = ? ORDER BY sort_order ASC, created_at DESC`
        : `SELECT * FROM products ORDER BY sort_order ASC, created_at DESC`,
      useFilter ? [category] : [],
    );
    return rows.map(AdminService.toProductItem);
  }

  // GET /api/admin/product/:id：单个商品详情
  async getProduct(productId: string): Promise<AdminProductItem> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM products WHERE product_id = ? LIMIT 1`,
      [productId],
    );
    if (!rows[0]) throw new HttpError(404, '商品不存在', 404);
    return AdminService.toProductItem(rows[0]);
  }

  // POST /api/admin/product：新建商品
  async createProduct(input: CreateProductInput): Promise<AdminProductItem> {
    const productId = randomUUID();
    await pool.query(
      `INSERT INTO products
         (product_id, name, description, price_points, category, stock, image_url,
          is_active, is_virtual, virtual_value, sort_order, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?, ?)`,
      [
        productId,
        input.name,
        input.description ?? null,
        input.pricePoints,
        input.category,
        input.stock ?? 0,
        input.imageUrl ?? null,
        input.isVirtual ?? false,
        input.virtualValue ?? null,
        input.sortOrder ?? 0,
        input.createdBy,
      ],
    );
    return this.getProduct(productId);
  }

  // PUT /api/admin/product/:id：更新商品
  async updateProduct(productId: string, input: UpdateProductInput): Promise<AdminProductItem> {
    const existing = await this.getProduct(productId);
    if (!existing) throw new HttpError(404, '商品不存在', 404);

    const sets: string[] = [];
    const values: unknown[] = [];

    const fieldMap: Record<string, string> = {
      name: 'name',
      description: 'description',
      pricePoints: 'price_points',
      category: 'category',
      stock: 'stock',
      imageUrl: 'image_url',
      isActive: 'is_active',
      isVirtual: 'is_virtual',
      virtualValue: 'virtual_value',
      sortOrder: 'sort_order',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      const val = (input as Record<string, unknown>)[key];
      if (val !== undefined) {
        sets.push(`\`${col}\` = ?`);
        values.push(val);
      }
    }

    if (sets.length > 0) {
      values.push(productId);
      await pool.query(
        `UPDATE products SET ${sets.join(', ')} WHERE product_id = ?`,
        values,
      );
    }

    return this.getProduct(productId);
  }

  // PUT /api/admin/product/:id/toggle：切换商品上架/下架
  async toggleProductActive(productId: string): Promise<AdminProductItem> {
    const existing = await this.getProduct(productId);
    if (!existing) throw new HttpError(404, '商品不存在', 404);

    await pool.query(
      `UPDATE products SET is_active = NOT is_active WHERE product_id = ?`,
      [productId],
    );
    return this.getProduct(productId);
  }
  // ─── 管理后台仪表盘 ──────────────────────────────────────────

  // 获取唯一儿童用户 ID（系统仅一个儿童用户）
  private async getChildUserId(): Promise<string | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT user_id FROM users WHERE role = 'child' LIMIT 1`,
    );
    return rows[0]?.user_id ?? null;
  }

  // KPI 统计卡片（6 项）
  async getDashboardKpi() {
    const childId = await this.getChildUserId();
    if (!childId) {
      return {
        totalPointsEarned: 0,
        currentBalance: 0,
        todayCompletedTasks: 0,
        pendingRedemptions: 0,
        todayCompletionRate: 0,
        monthlyPointFlow: 0,
      };
    }

    const [kpiRows] = await pool.query<RowDataPacket[]>(
      `SELECT
        (SELECT COALESCE(SUM(change_amount), 0) FROM point_logs WHERE user_id = ? AND change_amount > 0) AS total_points_earned,
        (SELECT total_points FROM users WHERE user_id = ?) AS current_balance,
        (SELECT COUNT(*) FROM tasks WHERE user_id = ? AND date = CURDATE() AND status = 'completed') AS today_completed,
        (SELECT COUNT(*) FROM redemptions WHERE status = 'pending') AS pending_redemptions,
        (SELECT
          CASE WHEN COUNT(*) > 0
            THEN ROUND(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1)
            ELSE 0
          END
         FROM tasks WHERE user_id = ? AND date = CURDATE()
        ) AS today_completion_rate,
        (SELECT COALESCE(SUM(ABS(change_amount)), 0) FROM point_logs
         WHERE user_id = ? AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())
        ) AS monthly_flow`,
      [childId, childId, childId, childId, childId],
    );

    const r = kpiRows[0];
    return {
      totalPointsEarned: Number(r.total_points_earned) || 0,
      currentBalance: Number(r.current_balance) || 0,
      todayCompletedTasks: Number(r.today_completed) || 0,
      pendingRedemptions: Number(r.pending_redemptions) || 0,
      todayCompletionRate: Number(r.today_completion_rate) || 0,
      monthlyPointFlow: Number(r.monthly_flow) || 0,
    };
  }

  // 近7天积分与任务趋势（柱状折线混合图）
  async getWeeklyTrend() {
    const childId = await this.getChildUserId();
    // 日期轴统一用本地日期（与 MySQL CURDATE()/DATE 列口径一致）
    const dates = lastNDates(7);
    const labels: string[] = dates.map((s) => s.slice(5)); // MM-DD
    const taskCounts: number[] = [];
    const pointsEarned: number[] = [];

    if (!childId) return { labels, taskCounts, pointsEarned };

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS d, COUNT(*) AS cnt,
              SUM(CASE WHEN status = 'completed' THEN points ELSE 0 END) AS pts
       FROM tasks
       WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE_FORMAT(date, '%Y-%m-%d')`,
      [childId],
    );

    // DATE_FORMAT 直接返回 'YYYY-MM-DD' 字符串，避免 mysql2 把 DATE 解析成本地午夜
    // Date 对象后再 toISOString() 按 UTC 取日期造成的错位一天
    const map = new Map<string, { cnt: number; pts: number }>();
    for (const r of rows) {
      const key = r.d instanceof Date ? formatLocalDate(r.d) : String(r.d).slice(0, 10);
      map.set(key, { cnt: Number(r.cnt) || 0, pts: Number(r.pts) || 0 });
    }

    for (const key of dates) {
      const entry = map.get(key);
      taskCounts.push(entry?.cnt ?? 0);
      pointsEarned.push(entry?.pts ?? 0);
    }

    return { labels, taskCounts, pointsEarned };
  }

  // 近7天时间分配趋势（堆叠面积图）
  async getTimeTrend() {
    const childId = await this.getChildUserId();
    // 日期轴统一用本地日期（与 MySQL CURDATE()/DATE 列口径一致）
    const dates = lastNDates(7);
    const labels: string[] = dates.map((s) => s.slice(5)); // MM-DD
    const types = ['homework', 'game', 'reading', 'exercise', 'other'];
    const series: Record<string, number[]> = {};
    for (const t of types) series[t] = [];

    if (!childId) return { labels, series };

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS d, activity_type, SUM(duration_minutes) AS mins
       FROM time_records
       WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE_FORMAT(date, '%Y-%m-%d'), activity_type`,
      [childId],
    );

    // DATE_FORMAT 直接返回 'YYYY-MM-DD' 字符串，避免时区错位（同 getWeeklyTrend）
    const map = new Map<string, Record<string, number>>();
    for (const r of rows) {
      const key = r.d instanceof Date ? formatLocalDate(r.d) : String(r.d).slice(0, 10);
      if (!map.has(key)) map.set(key, {});
      map.get(key)![r.activity_type] = Number(r.mins) || 0;
    }

    for (const key of dates) {
      const entry = map.get(key) ?? {};
      for (const t of types) {
        series[t].push(entry[t] ?? 0);
      }
    }

    return { labels, series };
  }

  // 任务类型分布（环形图）
  async getTaskTypeDistribution() {
    const childId = await this.getChildUserId();
    if (!childId) return [];

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT tt.task_type, COUNT(*) AS cnt
       FROM tasks t
       LEFT JOIN task_templates tt ON t.template_id = tt.template_id
       WHERE t.user_id = ?
       GROUP BY tt.task_type`,
      [childId],
    );

    return rows.map((r) => ({
      taskType: r.task_type || 'unknown',
      count: Number(r.cnt) || 0,
    }));
  }

  // 活动类型时间占比（玫瑰图，全量）
  async getTimeDistribution() {
    const childId = await this.getChildUserId();
    if (!childId) return [];

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT activity_type, SUM(duration_minutes) AS total_mins
       FROM time_records
       WHERE user_id = ?
       GROUP BY activity_type`,
      [childId],
    );

    return rows.map((r) => ({
      activityType: r.activity_type,
      minutes: Number(r.total_mins) || 0,
    }));
  }

  // 本月 vs 上月时间对比（分组柱状图）
  async getMonthlyTimeComparison() {
    const childId = await this.getChildUserId();
    const types = ['homework', 'game', 'reading', 'exercise', 'other'];
    const thisMonth: Record<string, number> = {};
    const lastMonth: Record<string, number> = {};
    for (const t of types) {
      thisMonth[t] = 0;
      lastMonth[t] = 0;
    }

    if (!childId) return { categories: types, thisMonth, lastMonth };

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT activity_type,
              SUM(CASE WHEN PERIOD_DIFF(DATE_FORMAT(CURDATE(), '%Y%m'), DATE_FORMAT(date, '%Y%m')) = 0
                  THEN duration_minutes ELSE 0 END) AS this_month,
              SUM(CASE WHEN PERIOD_DIFF(DATE_FORMAT(CURDATE(), '%Y%m'), DATE_FORMAT(date, '%Y%m')) = 1
                  THEN duration_minutes ELSE 0 END) AS last_month
       FROM time_records
       WHERE user_id = ?
         AND date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m-01')
       GROUP BY activity_type`,
      [childId],
    );

    for (const r of rows) {
      thisMonth[r.activity_type] = Number(r.this_month) || 0;
      lastMonth[r.activity_type] = Number(r.last_month) || 0;
    }

    return { categories: types, thisMonth, lastMonth };
  }

  // 作业达标率仪表盘（本月）
  // 达标口径：「当日全部作业记录时长之和」>= 作业目标分钟数。
  // 注意不能按单条记录判定——一天可能分多次计时（如 14+10+10+13+7+3+3=60 分钟），
  // 单条均未达标但当日合计已达标，按记录判定会漏算达标天数。
  async getHomeworkRate() {
    const childId = await this.getChildUserId();
    if (!childId) return { rate: 0, targetDays: 0, totalDays: 0 };

    // 1. 取作业目标分钟数
    const [uRows] = await pool.query<RowDataPacket[]>(
      `SELECT homework_target_minutes FROM users WHERE user_id = ? LIMIT 1`,
      [childId],
    );
    const targetMinutes = Number(uRows[0]?.homework_target_minutes) || 0;

    // 2. 按日聚合作业时长，统计「当日合计 >= 目标」的天数；分母为本月已过天数
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS target_days, DAY(CURDATE()) AS total_days
       FROM (
         SELECT date
         FROM time_records
         WHERE user_id = ?
           AND activity_type = 'homework'
           AND YEAR(date) = YEAR(CURDATE())
           AND MONTH(date) = MONTH(CURDATE())
         GROUP BY date
         HAVING SUM(duration_minutes) >= ?
       ) AS reached_days`,
      [childId, targetMinutes],
    );

    const targetDays = Number(rows[0]?.target_days) || 0;
    const totalDays = Number(rows[0]?.total_days) || 0;
    const rate = totalDays > 0 ? Math.round((targetDays / totalDays) * 100) : 0;

    return { rate, targetDays, totalDays };
  }

  // 积分来源构成（环形图）
  // task_complete 流水通过 source_id=task_id 关联 tasks → task_templates，
  // 按任务类型细分为「固定每日/自选/挑战」三类；无模板或任务已删除的归入 taskType=null（前端兜底显示「任务完成」）
  async getPointsSource() {
    const childId = await this.getChildUserId();
    if (!childId) return [];

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT pl.source_type AS source_type,
              tt.task_type AS task_type,
              SUM(ABS(pl.change_amount)) AS total
       FROM point_logs pl
       LEFT JOIN tasks t
         ON pl.source_type = 'task_complete' AND pl.source_id = t.task_id
       LEFT JOIN task_templates tt
         ON t.template_id = tt.template_id
       WHERE pl.user_id = ?
       GROUP BY pl.source_type, tt.task_type`,
      [childId],
    );

    return rows.map((r) => ({
      sourceType: r.source_type,
      taskType: r.task_type ?? null,
      total: Number(r.total) || 0,
    }));
  }

  // 商品类型分布（饼图）
  async getProductCategoryDistribution() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT category, COUNT(*) AS cnt
       FROM products
       GROUP BY category`,
    );

    return rows.map((r) => ({
      category: r.category,
      count: Number(r.cnt) || 0,
    }));
  }
}

export const adminService = new AdminService();
