// 模块2 后端测试：任务接口（today/create/complete/delete/stats-weekly）
import { randomUUID } from 'crypto';
import request from 'supertest';
import { app } from '@/app';
import { pool } from '@/database';

const unique = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const password = 'pass123456';
const userA = unique('taska');
const userB = unique('taskb');
let tokenA = '';
let tokenB = '';
let userIdA = '';
let userIdB = '';
// beforeAll 中由 userA 创建的任务，供后续 complete/403/delete 测试复用
let taskIdA = '';
// 测试中创建的可删除任务
let taskIdDeletable = '';

beforeAll(async () => {
  // 注册并登录两个用户，用于验证 403 无权操作
  const regA = await request(app)
    .post('/api/auth/register')
    .send({ username: userA, password });
  userIdA = regA.body?.data?.userId ?? '';
  const loginA = await request(app)
    .post('/api/auth/login')
    .send({ username: userA, password });
  tokenA = loginA.body?.data?.token ?? '';

  const regB = await request(app)
    .post('/api/auth/register')
    .send({ username: userB, password });
  userIdB = regB.body?.data?.userId ?? '';
  const loginB = await request(app)
    .post('/api/auth/login')
    .send({ username: userB, password });
  tokenB = loginB.body?.data?.token ?? '';

  // userA 预创建一个任务（pending），供 complete/403/delete 测试
  const created = await request(app)
    .post('/api/task')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ title: '预习任务', points: 20, description: '数学' });
  taskIdA = created.body?.data?.taskId ?? '';
}, 30000);

afterAll(async () => {
  // 级联清理：删除用户会同时清理其 tasks 与 point_logs
  const ids = [userIdA, userIdB].filter(Boolean);
  if (ids.length) {
    await pool.query(
      `DELETE FROM users WHERE user_id IN (${ids.map(() => '?').join(',')})`,
      ids,
    );
  }
});

describe('GET /api/task/today', () => {
  test('未登录 → 401', async () => {
    const res = await request(app).get('/api/task/today');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(401);
  });

  test('登录后返回今日任务数组', async () => {
    const res = await request(app)
      .get('/api/task/today')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(Array.isArray(res.body.data)).toBe(true);
    // beforeAll 预创建的 taskIdA 应在列表中
    const ids = res.body.data.map((t: any) => t.taskId);
    expect(ids).toContain(taskIdA);
  });
});

describe('POST /api/task', () => {
  test('创建成功 → 200 code:0 status=pending', async () => {
    const res = await request(app)
      .post('/api/task')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '背单词', points: 10, description: '英语' });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.taskId).toBeTruthy();
    expect(res.body.data.title).toBe('背单词');
    expect(res.body.data.points).toBe(10);
    expect(res.body.data.status).toBe('pending');
  });

  test('标题为空 → 400 标题不能为空', async () => {
    const res = await request(app)
      .post('/api/task')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '', points: 10 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(res.body.message).toBe('标题不能为空');
  });

  test('积分为 0 → 400 积分必须>0', async () => {
    const res = await request(app)
      .post('/api/task')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '无效任务', points: 0 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(res.body.message).toBe('积分必须>0');
  });

  test('积分为负数 → 400 积分必须>0', async () => {
    const res = await request(app)
      .post('/api/task')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '负积分任务', points: -5 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(res.body.message).toBe('积分必须>0');
  });
});

describe('PUT /api/task/:id/complete', () => {
  test('打卡成功 → 200 code:0 completed+pointsEarned', async () => {
    const res = await request(app)
      .put(`/api/task/${taskIdA}/complete`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.taskId).toBe(taskIdA);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.pointsEarned).toBe(20);
  });

  test('今日已打卡 → 409', async () => {
    const res = await request(app)
      .put(`/api/task/${taskIdA}/complete`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe(409);
    expect(res.body.message).toBe('今日已打卡');
  });

  test('任务不存在 → 404', async () => {
    const res = await request(app)
      .put(`/api/task/${randomUUID()}/complete`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(404);
    expect(res.body.message).toBe('任务不存在');
  });

  test('无权操作他人任务 → 403', async () => {
    // userB 尝试完成 userA 的任务（即使已 completed，也应先判 403）
    const res = await request(app)
      .put(`/api/task/${taskIdA}/complete`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe(403);
    expect(res.body.message).toBe('无权操作此任务');
  });
});

describe('DELETE /api/task/:id', () => {
  test('已完成任务不能删除 → 400', async () => {
    // taskIdA 已在上方 complete 测试中完成
    const res = await request(app)
      .delete(`/api/task/${taskIdA}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(res.body.message).toBe('已完成任务不能删除');
  });

  test('删除 pending 任务成功 → { success: true }', async () => {
    // 先创建一个新的 pending 任务
    const created = await request(app)
      .post('/api/task')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '待删除任务', points: 5 });
    taskIdDeletable = created.body?.data?.taskId ?? '';
    expect(taskIdDeletable).toBeTruthy();

    const res = await request(app)
      .delete(`/api/task/${taskIdDeletable}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.success).toBe(true);
  });

  test('任务不存在 → 404', async () => {
    const res = await request(app)
      .delete(`/api/task/${randomUUID()}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(404);
    expect(res.body.message).toBe('任务不存在');
  });
});

describe('GET /api/task/stats/weekly', () => {
  test('未登录 → 401', async () => {
    const res = await request(app).get('/api/task/stats/weekly');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(401);
  });

  test('登录后返回周统计结构', async () => {
    const res = await request(app)
      .get('/api/task/stats/weekly')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveProperty('totalCompleted');
    expect(res.body.data).toHaveProperty('totalPoints');
    expect(Array.isArray(res.body.data.dailyData)).toBe(true);
    // userA 已完成 taskIdA（20 积分），本周统计应至少 1 完成且积分>=20
    expect(res.body.data.totalCompleted).toBeGreaterThanOrEqual(1);
    expect(res.body.data.totalPoints).toBeGreaterThanOrEqual(20);
  });
});
