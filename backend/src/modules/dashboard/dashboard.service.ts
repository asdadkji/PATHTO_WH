// 仪表盘模块服务：今日总览、每周统计、每月统计
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '@/database';

// 今日总览
export interface OverviewResult {
  totalPoints: number;
  todayTasks: number;
  completed: number;
  homeworkMinutes: number;
  gameMinutes: number;
}

// 每周统计（折线图）
export interface WeeklyResult {
  labels: string[];
  data: number[];
}

// 每月统计
export interface MonthlyResult {
  totalTasks: number;
  completionRate: number;
  totalPoints: number;
  homeWorkMinutes: number;
}

// MySQL day_of_week：1=周日..7=周六。按「周一..周日」顺序排列输出
const DAY_ORDER = [2, 3, 4, 5, 6, 7, 1] as const;
const DAY_LABELS: Record<number, string> = {
  2: '周一',
  3: '周二',
  4: '周三',
  5: '周四',
  6: '周五',
  7: '周六',
  1: '周日',
};

class DashboardService {
  // GET /api/dashboard/overview
  async getOverview(userId: string): Promise<OverviewResult> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT total_points, today_tasks, today_completed, today_homework_minutes, today_game_minutes
       FROM v_user_today_overview
       WHERE user_id = ?
       LIMIT 1`,
      [userId],
    );
    const r = rows[0];
    if (r) {
      return {
        totalPoints: Number(r.total_points) || 0,
        todayTasks: Number(r.today_tasks) || 0,
        completed: Number(r.today_completed) || 0,
        homeworkMinutes: Number(r.today_homework_minutes) || 0,
        gameMinutes: Number(r.today_game_minutes) || 0,
      };
    }
    // 回退：视图无数据（非 child 或新用户），仅取用户总积分，其余置 0
    const [userRows] = await pool.query<RowDataPacket[]>(
      `SELECT total_points FROM users WHERE user_id = ? LIMIT 1`,
      [userId],
    );
    const u = userRows[0];
    return {
      totalPoints: Number(u?.total_points) || 0,
      todayTasks: 0,
      completed: 0,
      homeworkMinutes: 0,
      gameMinutes: 0,
    };
  }

  // GET /api/dashboard/weekly
  async getWeekly(userId: string): Promise<WeeklyResult> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT day_of_week, daily_points
       FROM v_user_weekly_stats
       WHERE user_id = ?
       ORDER BY stat_date ASC`,
      [userId],
    );
    // 按 day_of_week 索引每日积分，缺失日补 0
    const pointsByDay = new Map<number, number>();
    for (const row of rows) {
      pointsByDay.set(Number(row.day_of_week), Number(row.daily_points) || 0);
    }
    const labels = DAY_ORDER.map((d) => DAY_LABELS[d]);
    const data = DAY_ORDER.map((d) => pointsByDay.get(d) ?? 0);
    return { labels, data };
  }

  // GET /api/dashboard/monthly
  async getMonthly(userId: string): Promise<MonthlyResult> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT monthly_tasks, monthly_completion_rate, monthly_points_earned, monthly_homework_minutes
       FROM v_user_monthly_stats
       WHERE user_id = ? AND month = DATE_FORMAT(CURDATE(), '%Y-%m')
       LIMIT 1`,
      [userId],
    );
    const r = rows[0];
    if (!r) {
      return { totalTasks: 0, completionRate: 0, totalPoints: 0, homeWorkMinutes: 0 };
    }
    return {
      totalTasks: Number(r.monthly_tasks) || 0,
      completionRate: Number(r.monthly_completion_rate) || 0,
      totalPoints: Number(r.monthly_points_earned) || 0,
      homeWorkMinutes: Number(r.monthly_homework_minutes) || 0,
    };
  }
}

export const dashboardService = new DashboardService();
