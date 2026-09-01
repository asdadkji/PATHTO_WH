// 任务模块服务：今日任务、创建、完成（事务发积分）、删除、每周统计
import { randomUUID } from 'crypto';
import { RowDataPacket, PoolConnection } from 'mysql2/promise';
import { pool } from '@/database';
import { HttpError } from '@/utils/response';
import { TaskStatus } from '@/types/enums';

// 今日任务条目
export interface TodayTaskItem {
  taskId: string;
  title: string;
  points: number;
  status: TaskStatus;
}

// 创建任务返回
export interface CreateTaskResult {
  taskId: string;
  title: string;
  points: number;
  status: 'pending';
}

// 完成任务返回
export interface CompleteTaskResult {
  taskId: string;
  status: 'completed';
  pointsEarned: number;
}

// 每日统计条目
export interface DailyStatItem {
  date: string;
  completed: number;
  points: number;
}

// 每周统计返回
export interface WeeklyStatsResult {
  totalCompleted: number;
  totalPoints: number;
  dailyData: DailyStatItem[];
}

class TaskService {
  // GET /api/task/today：查询当前用户今日任务，按创建时间升序
  async getTodayTasks(userId: string): Promise<TodayTaskItem[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT task_id, title, points, status
       FROM tasks
       WHERE user_id = ? AND date = CURDATE()
       ORDER BY created_at ASC`,
      [userId],
    );
    return rows.map((r) => ({
      taskId: r.task_id,
      title: r.title,
      points: Number(r.points) || 0,
      status: r.status as TaskStatus,
    }));
  }

  // POST /api/task：创建今日任务（默认 pending，date=CURDATE()）
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

  // PUT /api/task/:id/complete：完成任务并发放积分（事务）
  // 先按 task_id 查询以区分 404/403/409，再事务更新任务、累加积分、写流水
  async completeTask(taskId: string, userId: string): Promise<CompleteTaskResult> {
    // 仅按 task_id 查询（不带 user_id），以便区分任务不存在(404) 与 无权操作(403)
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT task_id, user_id, status, points, title
       FROM tasks
       WHERE task_id = ?
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

    const points = Number(task.points) || 0;
    const title = task.title;

    // 事务：更新任务状态 → 累加用户积分 → 取新余额 → 写入积分流水
    let conn: PoolConnection | undefined;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();

      // 1. 更新任务为已完成
      await conn.query(
        `UPDATE tasks SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE task_id = ?`,
        [taskId],
      );
      // 2. 累加用户总积分
      await conn.query(
        `UPDATE users SET total_points = total_points + ? WHERE user_id = ?`,
        [points, userId],
      );
      // 3. 查询变动后余额
      const [uRows] = await conn.query<RowDataPacket[]>(
        `SELECT total_points FROM users WHERE user_id = ? LIMIT 1`,
        [userId],
      );
      const balanceAfter = Number(uRows[0]?.total_points) || 0;
      // 4. 写入积分流水（source_type='task_complete'，source_id=task_id）
      await conn.query(
        `INSERT INTO point_logs
           (log_id, user_id, change_amount, balance_after, source_type, source_id, description, created_at)
         VALUES (?, ?, ?, ?, 'task_complete', ?, CONCAT('完成任务: ', ?), NOW())`,
        [randomUUID(), userId, points, balanceAfter, taskId, title],
      );

      await conn.commit();
      return { taskId, status: 'completed', pointsEarned: points };
    } catch (err) {
      // 事务失败：回滚并抛 500
      if (conn) {
        try {
          await conn.rollback();
        } catch {
          /* 忽略回滚过程中的二次错误 */
        }
      }
      throw new HttpError(500, '完成任务失败', 500);
    } finally {
      // 确保连接归还连接池（成功/失败均执行）
      if (conn) conn.release();
    }
  }

  // DELETE /api/task/:id：删除任务（已完成任务不可删除）
  // 逻辑顺序：404 不存在 → 403 无权 → 400 已完成不能删除
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
    // 双条件删除，进一步保证仅删除本人非完成任务
    await pool.query(`DELETE FROM tasks WHERE task_id = ? AND user_id = ?`, [taskId, userId]);
    return { success: true };
  }

  // GET /api/task/stats/weekly：本周 7 天任务统计（仅返回有数据的日期）
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
