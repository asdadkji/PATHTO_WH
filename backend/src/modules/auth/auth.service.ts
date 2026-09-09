// 认证模块服务：登录、注册业务逻辑
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '@/database';
import { AUTH } from '@/config';
import { Role } from '@/types/enums';
import { HttpError } from '@/utils/response';
import { JwtPayload } from '@/middleware/auth';
import { comparePassword, hashPassword } from '@/utils/password';

// 登录成功返回结构
export interface LoginResult {
  token: string;
  userInfo: {
    userId: string;
    username: string;
    avatar: string | null;
    totalPoints: number;
    role: Role;
  };
}

// 注册成功返回结构
export interface RegisterResult {
  userId: string;
  username: string;
}

class AuthService {
  // 登录：校验用户存在且为激活状态、密码匹配，签发 JWT 并更新最后登录时间
  async login(username: string, password: string): Promise<LoginResult> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT user_id, username, password_hash, avatar_url, total_points, role
       FROM users
       WHERE username = ? AND status = 'active'
       LIMIT 1`,
      [username],
    );
    const user = rows[0];
    if (!user) {
      throw new HttpError(401, '用户不存在', 1002);
    }

    const ok = await comparePassword(password, user.password_hash);
    if (!ok) {
      throw new HttpError(401, '密码错误', 1001);
    }

    const payload: JwtPayload = {
      userId: user.user_id,
      role: user.role as Role,
    };
    // AUTH.JWT_EXPIRE 为 string，jwt 类型要求 StringValue，这里做断言
    const token = jwt.sign(payload, AUTH.JWT_SECRET, {
      expiresIn: AUTH.JWT_EXPIRE as any,
    });

    // 更新最后登录时间（不阻塞登录返回，失败由全局错误处理兜底）
    await pool.query(
      `UPDATE users SET last_login_at = NOW() WHERE user_id = ?`,
      [user.user_id],
    );

    return {
      token,
      userInfo: {
        userId: user.user_id,
        username: user.username,
        avatar: user.avatar_url ?? null,
        totalPoints: Number(user.total_points) || 0,
        role: user.role as Role,
      },
    };
  }

  // 注册：用户名不可重复，生成 UUID 入库，默认 child 角色
  async register(username: string, password: string): Promise<RegisterResult> {
    const [exists] = await pool.query<RowDataPacket[]>(
      `SELECT user_id FROM users WHERE username = ? LIMIT 1`,
      [username],
    );
    if (exists.length > 0) {
      throw new HttpError(409, '用户名已存在', 1003);
    }

    const passwordHash = await hashPassword(password);
    const userId = randomUUID();

    await pool.query(
      `INSERT INTO users
         (user_id, username, password_hash, role, total_points, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, 'active', NOW(), NOW())`,
      [userId, username, passwordHash, Role.Child],
    );

    return { userId, username };
  }
}

export const authService = new AuthService();
