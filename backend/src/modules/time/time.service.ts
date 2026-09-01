// 时间统计模块服务：目标达标状态、今日时长汇总
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '@/database';
import { ActivityType } from '@/types/enums';

// 目标达标状态返回
export interface TargetStatusResult {
  homeworkReached: boolean;
  gameReached: boolean;
}

// 今日时长汇总返回
export interface TodaySummaryResult {
  homeworkMinutes: number;
  gameMinutes: number;
}

class TimeService {
  // GET /api/time/target-status：今日作业/游戏是否达标
  // 查 users 表目标分钟数 + 查今日 time_records 按 activity_type 聚合，对比返回
  async getTargetStatus(userId: string): Promise<TargetStatusResult> {
    // 1. 查询用户的目标分钟数
    const [userRows] = await pool.query<RowDataPacket[]>(
      `SELECT homework_target_minutes, game_target_minutes
       FROM users
       WHERE user_id = ? LIMIT 1`,
      [userId],
    );
    if (userRows.length === 0) {
      // 用户不存在（理论上 authRequired 已拦截），直接返回未达标
      return { homeworkReached: false, gameReached: false };
    }
    const homeworkTarget = Number(userRows[0].homework_target_minutes) || 0;
    const gameTarget = Number(userRows[0].game_target_minutes) || 0;

    // 2. 查询今日作业/游戏累计时长（用 CASE WHEN 在单条 SQL 内聚合，规避时区用 CURDATE()）
    const [sumRows] = await pool.query<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(CASE WHEN activity_type = ? THEN duration_minutes ELSE 0 END), 0) AS homework_done,
         COALESCE(SUM(CASE WHEN activity_type = ? THEN duration_minutes ELSE 0 END), 0) AS game_done
       FROM time_records
       WHERE user_id = ? AND date = CURDATE()`,
      [ActivityType.Homework, ActivityType.Game, userId],
    );
    const homeworkDone = Number(sumRows[0]?.homework_done) || 0;
    const gameDone = Number(sumRows[0]?.game_done) || 0;

    // 3. 达标判定：累计时长 ≥ 目标 且 目标 > 0
    return {
      homeworkReached: homeworkTarget > 0 && homeworkDone >= homeworkTarget,
      gameReached: gameTarget > 0 && gameDone >= gameTarget,
    };
  }

  // GET /api/time/summary/today：今日作业/游戏累计时长（分钟）
  async getTodaySummary(userId: string): Promise<TodaySummaryResult> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(CASE WHEN activity_type = ? THEN duration_minutes ELSE 0 END), 0) AS homework_minutes,
         COALESCE(SUM(CASE WHEN activity_type = ? THEN duration_minutes ELSE 0 END), 0) AS game_minutes
       FROM time_records
       WHERE user_id = ? AND date = CURDATE()`,
      [ActivityType.Homework, ActivityType.Game, userId],
    );
    const r = rows[0] || {};
    return {
      homeworkMinutes: Number(r.homework_minutes) || 0,
      gameMinutes: Number(r.game_minutes) || 0,
    };
  }
}

export const timeService = new TimeService();
