import { randomUUID } from 'crypto';
import { RowDataPacket, PoolConnection } from 'mysql2/promise';
import { pool } from '@/database';
import { HttpError } from '@/utils/response';
import { TaskStatus, TaskType } from '@/types/enums';

export interface TodayTaskItem {
  taskId: string;
  templateId: string | null;
  taskType: TaskType;
  title: string;
  description: string | null;
  points: number;
  status: TaskStatus;
  streakCount: number;
  streakBonus7: number;
  streakBonus30: number;
  icon: string | null;
  color: string | null;
  completedAt: string | null;
}

export interface CreateTaskResult {
  taskId: string;
  title: string;
  points: number;
  status: 'pending';
}

export interface CompleteTaskResult {
  taskId: string;
  status: 'completed';
  pointsEarned: number;
  streakCount: number;
  bonusEarned: number;
}

export interface DailyStatItem {
  date: string;
  completed: number;
  points: number;
}

export interface WeeklyStatsResult {
  totalCompleted: number;
  totalPoints: number;
  dailyData: DailyStatItem[];
}

export interface TaskTemplateItem {
  templateId: string;
  title: string;
  description: string | null;
  defaultPoints: number;
  category: string | null;
  taskType: TaskType;
  icon: string | null;
  color: string | null;
  streakBonus7: number;
  streakBonus30: number;
}

class TaskService {
  /**
   * 为当天自动创建固定任务（如果尚未存在）。
   * 从前一天同模板任务继承 streak_count（仅当昨天已完成时）。
   */
  private async ensureDailyFixedTasks(userId: string, conn?: PoolConnection): Promise<void> {
    const executor = conn ?? pool;

    const [templates] = await executor.query<RowDataPacket[]>(
      `SELECT template_id, default_points, title, description, icon, color,
              streak_bonus_7_days, streak_bonus_30_days
       FROM task_templates
       WHERE task_type = 'fixed_daily' AND is_active = TRUE`,
    );

    if (templates.length === 0) return;

    for (const tpl of templates) {
      const [existing] = await executor.query<RowDataPacket[]>(
        `SELECT task_id FROM tasks
         WHERE user_id = ? AND template_id = ? AND date = CURDATE()
         LIMIT 1`,
        [userId, tpl.template_id],
      );
      if (existing.length > 0) continue;

      // 查前一天同模板任务，若已完成则继承 streak_count
      const [prevRows] = await executor.query<RowDataPacket[]>(
        `SELECT streak_count, status FROM tasks
         WHERE user_id = ? AND template_id = ? AND date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
         LIMIT 1`,
        [userId, tpl.template_id],
      );

      const inheritedStreak =
        prevRows.length > 0 && prevRows[0].status === 'completed'
          ? Number(prevRows[0].streak_count) || 0
          : 0;

      await executor.query(
        `INSERT INTO tasks
           (task_id, user_id, template_id, title, description, points, status, date, streak_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', CURDATE(), ?, NOW(), NOW())`,
        [
          randomUUID(),
          userId,
          tpl.template_id,
          tpl.title,
          tpl.description ?? null,
          Number(tpl.default_points) || 10,
          inheritedStreak,
        ],
      );
    }
  }

  async getTodayTasks(userId: string): Promise<TodayTaskItem[]> {
    // 先确保今日固定任务已创建
    await this.ensureDailyFixedTasks(userId);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT t.task_id, t.template_id, t.title, t.description, t.points, t.status,
              t.streak_count, t.completed_at,
              COALESCE(tt.task_type, 'self_selected') AS task_type,
              COALESCE(tt.streak_bonus_7_days, 0) AS streak_bonus_7,
              COALESCE(tt.streak_bonus_30_days, 0) AS streak_bonus_30,
              tt.icon, tt.color
       FROM tasks t
       LEFT JOIN task_templates tt ON t.template_id = tt.template_id
       WHERE t.user_id = ? AND t.date = CURDATE()
       ORDER BY
         CASE COALESCE(tt.task_type, 'self_selected')
           WHEN 'fixed_daily' THEN 1
           WHEN 'self_selected' THEN 2
           WHEN 'challenge' THEN 3
         END,
         t.created_at ASC`,
      [userId],
    );

    return rows.map((r) => ({
      taskId: r.task_id,
      templateId: r.template_id,
      taskType: r.task_type as TaskType,
      title: r.title,
      description: r.description,
      points: Number(r.points) || 0,
      status: r.status as TaskStatus,
      streakCount: Number(r.streak_count) || 0,
      streakBonus7: Number(r.streak_bonus_7) || 0,
      streakBonus30: Number(r.streak_bonus_30) || 0,
      icon: r.icon,
      color: r.color,
      completedAt: r.completed_at,
    }));
  }

  async createTask(
    userId: string,
    title: string,
    points: number,
    description?: string,
  ): Promise<CreateTaskResult> {
    const taskId = randomUUID();
    await pool.query(
      `INSERT INTO tasks
         (task_id, user_id, template_id, title, description, points, status, date, created_at, updated_at)
       VALUES (?, ?, NULL, ?, ?, ?, 'pending', CURDATE(), NOW(), NOW())`,
      [taskId, userId, title, description ?? null, points],
    );
    return { taskId, title, points, status: 'pending' };
  }

  /** 自选任务：从模板创建今日任务 */
  async selectSelfSelectedTask(userId: string, templateId: string): Promise<CreateTaskResult> {
    const [tplRows] = await pool.query<RowDataPacket[]>(
      `SELECT template_id, title, description, default_points, task_type
       FROM task_templates
       WHERE template_id = ? AND is_active = TRUE
       LIMIT 1`,
      [templateId],
    );
    if (tplRows.length === 0) {
      throw new HttpError(404, '任务模板不存在', 404);
    }
    const tpl = tplRows[0];
    if (tpl.task_type !== 'self_selected') {
      throw new HttpError(400, '该模板不是自选任务类型', 400);
    }

    // 检查今日是否已选过同一模板
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT task_id FROM tasks
       WHERE user_id = ? AND template_id = ? AND date = CURDATE()
       LIMIT 1`,
      [userId, templateId],
    );
    if (existing.length > 0) {
      throw new HttpError(409, '今日已选择过该任务', 409);
    }

    const taskId = randomUUID();
    const points = Number(tpl.default_points) || 10;
    await pool.query(
      `INSERT INTO tasks
         (task_id, user_id, template_id, title, description, points, status, date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', CURDATE(), NOW(), NOW())`,
      [taskId, userId, templateId, tpl.title, tpl.description ?? null, points],
    );
    return { taskId, title: tpl.title, points, status: 'pending' };
  }

  /** 挑战任务：从模板创建一次性任务 */
  async startChallenge(userId: string, templateId: string): Promise<CreateTaskResult> {
    const [tplRows] = await pool.query<RowDataPacket[]>(
      `SELECT template_id, title, description, default_points, task_type
       FROM task_templates
       WHERE template_id = ? AND is_active = TRUE
       LIMIT 1`,
      [templateId],
    );
    if (tplRows.length === 0) {
      throw new HttpError(404, '挑战模板不存在', 404);
    }
    const tpl = tplRows[0];
    if (tpl.task_type !== 'challenge') {
      throw new HttpError(400, '该模板不是挑战任务类型', 400);
    }

    // 检查今日是否已接受同一挑战
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT task_id FROM tasks
       WHERE user_id = ? AND template_id = ? AND date = CURDATE()
       LIMIT 1`,
      [userId, templateId],
    );
    if (existing.length > 0) {
      throw new HttpError(409, '今日已接受过该挑战', 409);
    }

    const taskId = randomUUID();
    const points = Number(tpl.default_points) || 30;
    await pool.query(
      `INSERT INTO tasks
         (task_id, user_id, template_id, title, description, points, status, date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', CURDATE(), NOW(), NOW())`,
      [taskId, userId, templateId, tpl.title, tpl.description ?? null, points],
    );
    return { taskId, title: tpl.title, points, status: 'pending' };
  }

  /** 获取可选模板列表（自选 + 挑战） */
  async getAvailableTemplates(): Promise<TaskTemplateItem[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT template_id, title, description, default_points, category, task_type,
              icon, color, streak_bonus_7_days, streak_bonus_30_days
       FROM task_templates
       WHERE is_active = TRUE AND task_type IN ('self_selected', 'challenge')
       ORDER BY
         CASE task_type WHEN 'self_selected' THEN 1 WHEN 'challenge' THEN 2 END,
         default_points DESC`,
    );
    return rows.map((r) => ({
      templateId: r.template_id,
      title: r.title,
      description: r.description,
      defaultPoints: Number(r.default_points) || 0,
      category: r.category,
      taskType: r.task_type as TaskType,
      icon: r.icon,
      color: r.color,
      streakBonus7: Number(r.streak_bonus_7_days) || 0,
      streakBonus30: Number(r.streak_bonus_30_days) || 0,
    }));
  }

  /** 完成任务：事务内更新状态、累加积分、处理连续打卡奖励 */
  async completeTask(taskId: string, userId: string): Promise<CompleteTaskResult> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT t.task_id, t.user_id, t.status, t.points, t.title, t.template_id, t.streak_count,
              COALESCE(tt.streak_bonus_7_days, 0) AS streak_bonus_7,
              COALESCE(tt.streak_bonus_30_days, 0) AS streak_bonus_30
       FROM tasks t
       LEFT JOIN task_templates tt ON t.template_id = tt.template_id
       WHERE t.task_id = ?
       LIMIT 1`,
      [taskId],
    );
    const task = rows[0];
    if (!task) {
      throw new HttpError(404, '任务不存在', 404);
    }
    if (task.user_id !== userId) {
      throw new HttpError(403, '无权操作此任务', 403);
    }
    if (task.status === 'completed') {
      throw new HttpError(409, '今日已打卡', 409);
    }

    const basePoints = Number(task.points) || 0;
    const title = task.title;
    const currentStreak = Number(task.streak_count) || 0;
    const newStreak = currentStreak + 1;
    const bonus7 = Number(task.streak_bonus_7) || 0;
    const bonus30 = Number(task.streak_bonus_30) || 0;

    // 计算里程碑奖励
    let bonusEarned = 0;
    if (newStreak === 7 && bonus7 > 0) bonusEarned += bonus7;
    if (newStreak === 30 && bonus30 > 0) bonusEarned += bonus30;

    const totalEarned = basePoints + bonusEarned;

    let conn: PoolConnection | undefined;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();

      // 1. 更新任务状态 + streak_count
      await conn.query(
        `UPDATE tasks SET status = 'completed', completed_at = NOW(), streak_count = ?, updated_at = NOW()
         WHERE task_id = ?`,
        [newStreak, taskId],
      );

      // 2. 累加用户总积分（基础 + 奖励）
      await conn.query(
        `UPDATE users SET total_points = total_points + ? WHERE user_id = ?`,
        [totalEarned, userId],
      );

      // 3. 查询变动后余额
      const [uRows] = await conn.query<RowDataPacket[]>(
        `SELECT total_points FROM users WHERE user_id = ? LIMIT 1`,
        [userId],
      );
      const balanceAfter = Number(uRows[0]?.total_points) || 0;

      // 4. 写入基础积分流水
      await conn.query(
        `INSERT INTO point_logs
           (log_id, user_id, change_amount, balance_after, source_type, source_id, description, created_at)
         VALUES (?, ?, ?, ?, 'task_complete', ?, CONCAT('完成任务: ', ?), NOW())`,
        [randomUUID(), userId, basePoints, balanceAfter, taskId, title],
      );

      // 5. 如果有里程碑奖励，写入额外流水
      if (bonusEarned > 0) {
        const balanceAfterBonus = balanceAfter + bonusEarned;
        const milestone = newStreak === 7 ? '7天' : '30天';
        await conn.query(
          `INSERT INTO point_logs
             (log_id, user_id, change_amount, balance_after, source_type, source_id, description, created_at)
           VALUES (?, ?, ?, ?, 'bonus', ?, CONCAT('连续打卡', ?, '奖励: ', ?), NOW())`,
          [randomUUID(), userId, bonusEarned, balanceAfterBonus, taskId, milestone, title],
        );

        // 更新余额为最终值（因为上面写入的是中间余额）
        await conn.query(
          `UPDATE point_logs SET balance_after = ? WHERE user_id = ? AND source_type = 'bonus' AND source_id = ? ORDER BY created_at DESC LIMIT 1`,
          [balanceAfterBonus, userId, taskId],
        );
      }

      await conn.commit();
      return { taskId, status: 'completed', pointsEarned: totalEarned, streakCount: newStreak, bonusEarned };
    } catch (err) {
      if (conn) {
        try { await conn.rollback(); } catch { /* ignore */ }
      }
      throw new HttpError(500, '完成任务失败', 500);
    } finally {
      if (conn) conn.release();
    }
  }

  async deleteTask(taskId: string, userId: string): Promise<{ success: true }> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT task_id, user_id, status FROM tasks WHERE task_id = ? LIMIT 1`,
      [taskId],
    );
    const task = rows[0];
    if (!task) {
      throw new HttpError(404, '任务不存在', 404);
    }
    if (task.user_id !== userId) {
      throw new HttpError(403, '无权操作此任务', 403);
    }
    if (task.status === 'completed') {
      throw new HttpError(400, '已完成任务不能删除', 400);
    }
    await pool.query(`DELETE FROM tasks WHERE task_id = ? AND user_id = ?`, [taskId, userId]);
    return { success: true };
  }

  async getWeeklyStats(userId: string): Promise<WeeklyStatsResult> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
         SUM(CASE WHEN status = 'completed' THEN points ELSE 0 END) AS points
       FROM tasks
       WHERE user_id = ? AND date BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE()
       GROUP BY date`,
      [userId],
    );
    if (rows.length === 0) {
      return { totalCompleted: 0, totalPoints: 0, dailyData: [] };
    }
    let totalCompleted = 0;
    let totalPoints = 0;
    const dailyData: DailyStatItem[] = rows.map((r) => {
      const completed = Number(r.completed) || 0;
      const points = Number(r.points) || 0;
      totalCompleted += completed;
      totalPoints += points;
      return { date: r.date, completed, points };
    });
    return { totalCompleted, totalPoints, dailyData };
  }
}

export const taskService = new TaskService();
