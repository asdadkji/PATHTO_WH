// 模块1 后端测试：仪表盘接口（GET /api/dashboard/overview|weekly|monthly）
import request from 'supertest';
import { app } from '@/app';
import { pool } from '@/database';

const unique = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const testUsername = unique('dash');
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

describe('GET /api/dashboard', () => {
  test('overview token有效 → 200 code:0 今日总览', async () => {
    const res = await request(app)
      .get('/api/dashboard/overview')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveProperty('totalPoints');
    expect(res.body.data).toHaveProperty('todayTasks');
    expect(res.body.data).toHaveProperty('completed');
    expect(res.body.data).toHaveProperty('homeworkMinutes');
    expect(res.body.data).toHaveProperty('gameMinutes');
  });

  test('weekly token有效 → 200 code:0 本周趋势 7 天数据', async () => {
    const res = await request(app)
      .get('/api/dashboard/weekly')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(Array.isArray(res.body.data.labels)).toBe(true);
    expect(res.body.data.labels.length).toBe(7);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data.data.length).toBe(7);
    // 新注册用户本周无任务，每日积分应为 0
    expect(res.body.data.data.every((v: number) => v === 0)).toBe(true);
  });

  test('monthly token有效 → 200 code:0 月度报告', async () => {
    const res = await request(app)
      .get('/api/dashboard/monthly')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveProperty('totalTasks');
    expect(res.body.data).toHaveProperty('completionRate');
    expect(res.body.data).toHaveProperty('totalPoints');
    expect(res.body.data).toHaveProperty('homeWorkMinutes');
  });

  test('overview 无token → 401 code:401', async () => {
    const res = await request(app).get('/api/dashboard/overview');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(401);
  });
});
