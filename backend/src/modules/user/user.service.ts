// 用户模块服务：获取当前登录用户资料
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '@/database';
import { Role } from '@/types/enums';
import { HttpError } from '@/utils/response';

// 用户资料返回结构
export interface UserProfile {
  userId: string;
  username: string;
  avatar: string | null;
  totalPoints: number;
  role: Role;
  homeworkTargetMinutes: number;
  gameTargetMinutes: number;
  dailyTaskReminder: boolean;
}

class UserService {
  // 获取当前用户资料
  async getProfile(userId: string): Promise<UserProfile> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT user_id, username, avatar_url, total_points, role,
              homework_target_minutes, game_target_minutes, daily_task_reminder
       FROM users
       WHERE user_id = ?
       LIMIT 1`,
      [userId],
    );
    const u = rows[0];
    if (!u) {
      throw new HttpError(404, '用户不存在');
    }
    return {
      userId: u.user_id,
      username: u.username,
      avatar: u.avatar_url ?? null,
      totalPoints: Number(u.total_points) || 0,
      role: u.role as Role,
      homeworkTargetMinutes:
        u.homework_target_minutes != null ? Number(u.homework_target_minutes) : 0,
      gameTargetMinutes:
        u.game_target_minutes != null ? Number(u.game_target_minutes) : 0,
      dailyTaskReminder: !!u.daily_task_reminder,
    };
  }
}

export const userService = new UserService();
