// 模块1 后端测试：用户资料接口（GET /api/user/profile）
import request from 'supertest';
import { app } from '@/app';
import { pool } from '@/database';

const unique = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const testUsername = unique('profile');
const testPassword = 'pass123456';
let testUserId = '';
let token = '';

beforeAll(async () => {
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ username: testUsername, password: testPassword });
  testUserId = reg.body?.data?.userId ?? '';

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: testUsername, password: testPassword });
  token = loginRes.body?.data?.token ?? '';
});

afterAll(async () => {
  if (testUserId) {
    await pool.query('DELETE FROM users WHERE user_id = ?', [testUserId]);
  }
});

describe('GET /api/user/profile', () => {
  test('token有效 → 200 code:0 用户资料', async () => {
    const res = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.userId).toBe(testUserId);
    expect(res.body.data.username).toBe(testUsername);
    expect(res.body.data).toHaveProperty('avatar');
    expect(res.body.data).toHaveProperty('totalPoints');
    expect(res.body.data).toHaveProperty('role');
    expect(res.body.data).toHaveProperty('homeworkTargetMinutes');
    expect(res.body.data).toHaveProperty('gameTargetMinutes');
    expect(res.body.data).toHaveProperty('dailyTaskReminder');
  });

  test('无token → 401 code:401 未授权', async () => {
    const res = await request(app).get('/api/user/profile');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(401);
    expect(res.body.message).toBe('未授权');
  });

  test('无效token → 401 code:401 token已过期', async () => {
    const res = await request(app)
      .get('/api/user/profile')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(401);
    expect(res.body.message).toBe('token已过期');
  });
});
