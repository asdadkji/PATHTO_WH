// 计时模块服务：开始计时、停止计时（事务写记录）、手动记录
import { randomUUID } from 'crypto';
import { RowDataPacket, PoolConnection } from 'mysql2/promise';
import { pool } from '@/database';
import { HttpError } from '@/utils/response';
import { ActivityType, TimeSource, TimerStatus } from '@/types/enums';

// 开始计时返回
export interface StartTimerResult {
  sessionId: string;
  activityType: string;
  startedAt: Date;
}

// 停止计时返回
export interface StopTimerResult {
  sessionId: string;
  durationMinutes: number;
}

// 手动记录返回
export interface ManualRecordResult {
  recordId: string;
  durationMinutes: number;
}

class TimerService {
  // 根据活动类型获取目标分钟数（homework/game 取 users 表对应字段，其他活动类型无目标返回 0）
  // 可传入事务连接以保证与外层一致
  private async getTargetMinutes(
    userId: string,
    activityType: string,
    conn?: PoolConnection,
  ): Promise<number> {
    const exec = conn ?? pool;
    let column = '';
    if (activityType === ActivityType.Homework) {
      column = 'homework_target_minutes';
    } else if (activityType === ActivityType.Game) {
      column = 'game_target_minutes';
    } else {
      return 0;
    }
    const [rows] = await exec.query<RowDataPacket[]>(
      `SELECT ${column} AS target FROM users WHERE user_id = ? LIMIT 1`,
      [userId],
    );
    return Number(rows[0]?.target) || 0;
  }

  // 获取今日某活动类型已累计时长（分钟），不含当前正在写入的记录
  private async getTodayDurationMinutes(
    userId: string,
    activityType: string,
    conn?: PoolConnection,
  ): Promise<number> {
    const exec = conn ?? pool;
    const [rows] = await exec.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(duration_minutes), 0) AS total
       FROM time_records
       WHERE user_id = ? AND activity_type = ? AND date = CURDATE()`,
      [userId, activityType],
    );
    return Number(rows[0]?.total) || 0;
  }

  // POST /api/timer/start：开始计时
  // 查是否存在进行中的计时（409）→ 插入新会话（running, started_at=NOW()）→ 返回 startedAt
  async startTimer(userId: string, activityType: string): Promise<StartTimerResult> {
    // 1. 查询该用户是否存在进行中的计时
    const [running] = await pool.query<RowDataPacket[]>(
      `SELECT session_id FROM timer_sessions
       WHERE user_id = ? AND status = ?
       LIMIT 1`,
      [userId, TimerStatus.Running],
    );
    if (running.length > 0) {
      throw new HttpError(409, '已有进行中的计时', 409);
    }

    // 2. 插入新会话（status=running, started_at=NOW(), paused_duration_seconds=0）
    const sessionId = randomUUID();
    await pool.query(
      `INSERT INTO timer_sessions
         (session_id, user_id, activity_type, started_at, status, paused_duration_seconds, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), ?, 0, NOW(), NOW())`,
      [sessionId, userId, activityType, TimerStatus.Running],
    );

    // 3. 取回 started_at（保证返回值与 DB 一致，规避时区问题）
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT started_at FROM timer_sessions WHERE session_id = ? LIMIT 1`,
      [sessionId],
    );
    return {
      sessionId,
      activityType,
      startedAt: rows[0]?.started_at,
    };
  }

  // PUT /api/timer/stop：停止计时并写 time_records
  // 查会话(404) → 已完成(400) → 算时长 → 事务：更新会话 + 写记录（含达标判定）
  async stopTimer(userId: string, sessionId: string): Promise<StopTimerResult> {
    // 1. 查询会话（仅按 session_id，便于区分 404；本模块契约未要求 403 故不校验归属）
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT session_id, user_id, activity_type, started_at, status, paused_duration_seconds,
              ROUND((TIMESTAMPDIFF(SECOND, started_at, NOW()) - paused_duration_seconds) / 60) AS duration_minutes
       FROM timer_sessions
       WHERE session_id = ?
       LIMIT 1`,
      [sessionId],
    );
    const session = rows[0];
    if (!session) {
      throw new HttpError(404, '会话不存在', 404);
    }
    if (session.status === TimerStatus.Completed) {
      throw new HttpError(400, '已结束', 400);
    }

    const activityType = session.activity_type as string;
    const durationMinutes = Number(session.duration_minutes) || 0;

    // 2. 事务：更新会话状态 + 写 time_records
    let conn: PoolConnection | undefined;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();

      // 2.1 更新会话为已完成
      await conn.query(
        `UPDATE timer_sessions
         SET status = ?, ended_at = NOW(), updated_at = NOW()
         WHERE session_id = ?`,
        [TimerStatus.Completed, sessionId],
      );

      // 2.2 取目标分钟数（快照）与今日该活动累计时长（不含本条）
      const targetMinutes = await this.getTargetMinutes(userId, activityType, conn);
      const beforeTotal = await this.getTodayDurationMinutes(userId, activityType, conn);
      // 2.3 达标判定：累计时长（含本条）≥ 目标 且 目标 > 0
      const afterTotal = beforeTotal + durationMinutes;
      const isTargetReached = targetMinutes > 0 && afterTotal >= targetMinutes ? 1 : 0;

      // 2.4 写 time_records（source=timer，关联 session_id）
      const recordId = randomUUID();
      await conn.query(
        `INSERT INTO time_records
           (record_id, user_id, activity_type, duration_minutes, date, is_target_reached, target_minutes, source, session_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, NOW(), NOW())`,
        [recordId, userId, activityType, durationMinutes, isTargetReached, targetMinutes, TimeSource.Timer, sessionId],
      );

      await conn.commit();
      return { sessionId, durationMinutes };
    } catch (_err) {
      // 事务失败：回滚并抛 500
      if (conn) {
        try {
          await conn.rollback();
        } catch {
          /* 忽略回滚过程中的二次错误 */
        }
      }
      throw new HttpError(500, '停止计时失败', 500);
    } finally {
      // 确保连接归还连接池（成功/失败均执行）
      if (conn) conn.release();
    }
  }

  // POST /api/timer/manual：手动记录时长
  // 校验时长>0 → 事务：取目标+累计→判定达标→写 time_records（source=manual）
  async manualRecord(
    userId: string,
    activityType: string,
    durationMinutes: number,
  ): Promise<ManualRecordResult> {
    // 1. 校验时长（DTO 已校验，此处兜底防御）
    if (!durationMinutes || durationMinutes <= 0) {
      throw new HttpError(400, '时长不能为0', 400);
    }

    // 2. 事务：取目标+累计 → 判定达标 → 写 time_records
    let conn: PoolConnection | undefined;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();

      const targetMinutes = await this.getTargetMinutes(userId, activityType, conn);
      const beforeTotal = await this.getTodayDurationMinutes(userId, activityType, conn);
      const afterTotal = beforeTotal + durationMinutes;
      const isTargetReached = targetMinutes > 0 && afterTotal >= targetMinutes ? 1 : 0;

      const recordId = randomUUID();
      await conn.query(
        `INSERT INTO time_records
           (record_id, user_id, activity_type, duration_minutes, date, is_target_reached, target_minutes, source, created_at, updated_at)
         VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, NOW(), NOW())`,
        [recordId, userId, activityType, durationMinutes, isTargetReached, targetMinutes, TimeSource.Manual],
      );

      await conn.commit();
      return { recordId, durationMinutes };
    } catch (_err) {
      if (conn) {
        try {
          await conn.rollback();
        } catch {
          /* 忽略回滚过程中的二次错误 */
        }
      }
      throw new HttpError(500, '手动记录失败', 500);
    } finally {
      if (conn) conn.release();
    }
  }
}

export const timerService = new TimerService();
