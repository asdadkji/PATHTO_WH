// 模块1 后端测试：认证接口（POST /api/auth/login、POST /api/auth/register）
import request from 'supertest';
import { app } from '@/app';
import { pool } from '@/database';

// 生成唯一用户名，避免多次运行或并发测试时冲突
const unique = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const testUsername = unique('jestuser');
const testPassword = 'pass123456';
let testUserId = '';
let token = '';
const createdUserIds: string[] = [];

beforeAll(async () => {
  // 准备：注册一个测试用户，供 login / user / dashboard 复用
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ username: testUsername, password: testPassword });
  testUserId = reg.body?.data?.userId ?? '';
  if (testUserId) createdUserIds.push(testUserId);

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: testUsername, password: testPassword });
  token = loginRes.body?.data?.token ?? '';
});

afterAll(async () => {
  // 清理本文件创建的所有用户（users 表 ON DELETE CASCADE 会级联清理关联数据）
  if (createdUserIds.length) {
    await pool.query(
      `DELETE FROM users WHERE user_id IN (${createdUserIds.map(() => '?').join(',')})`,
      createdUserIds,
    );
  }
});

describe('POST /api/auth/register', () => {
  test('注册成功 → 200 code:0 返回 userId+username', async () => {
    const u = unique('newuser');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: u, password: testPassword });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.userId).toBeTruthy();
    expect(res.body.data.username).toBe(u);
    if (res.body.data.userId) createdUserIds.push(res.body.data.userId);
  });

  test('用户名已存在 → 409 code:1003', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: testUsername, password: testPassword });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe(1003);
    expect(res.body.message).toBe('用户名已存在');
  });

  test('密码过短 → 400 密码至少6位', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: unique('short'), password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(res.body.message).toBe('密码至少6位');
  });
});

describe('POST /api/auth/login', () => {
  test('正确用户名密码 → 200 code:0 token+userInfo', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUsername, password: testPassword });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.userInfo.userId).toBe(testUserId);
    expect(res.body.data.userInfo.username).toBe(testUsername);
    expect(res.body.data.userInfo).toHaveProperty('totalPoints');
    expect(res.body.data.userInfo).toHaveProperty('role');
  });

  test('密码错误 → 401 code:1001', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUsername, password: 'wrongPassword123' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(1001);
    expect(res.body.message).toBe('密码错误');
  });

  test('用户不存在 → 401 code:1002', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: unique('nosuch'), password: 'whatever123' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(1002);
    expect(res.body.message).toBe('用户不存在');
  });

  test('参数缺失 → 400 code:400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(res.body.message).toContain('参数错误');
  });
});
