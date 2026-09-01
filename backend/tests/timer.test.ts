// 模块3 后端测试：时间接口（timer start/stop/manual + time target-status/summary）
import request from 'supertest';
import { app } from '@/app';
import { pool } from '@/database';

const unique = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const password = 'pass123456';
const username = unique('timer');
let token = '';
let userId = '';
// start 成功后保存的会话 ID，供 stop 测试复用
let sessionId = '';

beforeAll(async () => {
  // 注册并登录一个用户用于时间模块测试
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ username, password });
  userId = reg.body?.data?.userId ?? '';
  const login = await request(app)
    .post('/api/auth/login')
    .send({ username, password });
  token = login.body?.data?.token ?? '';
});

afterAll(async () => {
  // 级联清理：删除用户会同时清理其 timer_sessions 与 time_records
  if (userId) {
    await pool.query(`DELETE FROM users WHERE user_id = ?`, [userId]);
  }
});

describe('POST /api/timer/start', () => {
  test('开始计时成功 → 200 code:0 {sessionId, activityType, startedAt}', async () => {
    const res = await request(app)
      .post('/api/timer/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ activityType: 'homework' });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.sessionId).toBeTruthy();
    expect(res.body.data.activityType).toBe('homework');
    expect(res.body.data.startedAt).toBeTruthy();
    sessionId = res.body.data.sessionId;
  });

  test('活动类型无效 → 400 活动类型无效', async () => {
    const res = await request(app)
      .post('/api/timer/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ activityType: 'invalid' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(res.body.message).toBe('活动类型无效');
  });

  test('已有进行中的计时 → 409', async () => {
    const res = await request(app)
      .post('/api/timer/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ activityType: 'game' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe(409);
    expect(res.body.message).toBe('已有进行中的计时');
  });
});

describe('PUT /api/timer/stop', () => {
  test('结束计时成功 → 200 code:0 {sessionId, durationMinutes}', async () => {
    const res = await request(app)
      .put('/api/timer/stop')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.sessionId).toBe(sessionId);
    expect(typeof res.body.data.durationMinutes).toBe('number');
    expect(res.body.data.durationMinutes).toBeGreaterThanOrEqual(0);
  });

  test('会话已结束 → 400 已结束', async () => {
    const res = await request(app)
      .put('/api/timer/stop')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(res.body.message).toBe('已结束');
  });

  test('会话不存在 → 404 会话不存在', async () => {
    const res = await request(app)
      .put('/api/timer/stop')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId: 'not-exist-session' });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(404);
    expect(res.body.message).toBe('会话不存在');
  });
});

describe('POST /api/timer/manual', () => {
  test('手动输入成功 → 200 code:0 {recordId, durationMinutes}', async () => {
    const res = await request(app)
      .post('/api/timer/manual')
      .set('Authorization', `Bearer ${token}`)
      .send({ activityType: 'reading', durationMinutes: 30 });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.recordId).toBeTruthy();
    expect(res.body.data.durationMinutes).toBe(30);
  });

  test('时长为 0 → 400 时长不能为0', async () => {
    const res = await request(app)
      .post('/api/timer/manual')
      .set('Authorization', `Bearer ${token}`)
      .send({ activityType: 'reading', durationMinutes: 0 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(res.body.message).toBe('时长不能为0');
  });
});

describe('GET /api/time/target-status', () => {
  test('未登录 → 401', async () => {
    const res = await request(app).get('/api/time/target-status');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(401);
  });

  test('登录后返回达标状态 {homeworkReached, gameReached}', async () => {
    const res = await request(app)
      .get('/api/time/target-status')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(typeof res.body.data.homeworkReached).toBe('boolean');
    expect(typeof res.body.data.gameReached).toBe('boolean');
  });
});

describe('GET /api/time/summary/today', () => {
  test('未登录 → 401', async () => {
    const res = await request(app).get('/api/time/summary/today');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(401);
  });

  test('登录后返回今日汇总 {homeworkMinutes, gameMinutes}', async () => {
    const res = await request(app)
      .get('/api/time/summary/today')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(typeof res.body.data.homeworkMinutes).toBe('number');
    expect(typeof res.body.data.gameMinutes).toBe('number');
  });
});
