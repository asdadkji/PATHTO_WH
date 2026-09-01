// 模块5 后端测试：兑换接口（submit/list/cancel + admin list/approve/reject）
import { randomUUID } from 'crypto';
import request from 'supertest';
import { app } from '@/app';
import { pool } from '@/database';
import { Role } from '@/types/enums';

const unique = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const password = 'pass123456';
const childName = unique('child');
const adminName = unique('admin');
let childToken = '';
let childId = '';
let adminToken = '';
let adminId = '';

// 测试商品 ID
let productA = ''; // 上架、价格 50、库存 5（正常兑换）
let productB = ''; // 上架、价格 10000、库存 5（积分不足）
let productC = ''; // 上架、价格 50、库存 1（库存不足，请求 qty=2）
let productD = ''; // 下架（商品不可兑换）
let productE = ''; // 上架、价格 50、库存 1（approve 库存不足场景）

// 各流程产生的兑换订单 ID
let redemptionForCancel = ''; // 供 cancel 成功测试
let redemptionForApprove = ''; // 供 admin approve 成功测试
let redemptionForReject = ''; // 供 admin reject 成功测试
let redemptionForStockIssue = ''; // 供 admin approve 400 库存不足测试

beforeAll(async () => {
  // 注册儿童用户并赋予积分
  const regChild = await request(app)
    .post('/api/auth/register')
    .send({ username: childName, password });
  childId = regChild.body?.data?.userId ?? '';
  const loginChild = await request(app)
    .post('/api/auth/login')
    .send({ username: childName, password });
  childToken = loginChild.body?.data?.token ?? '';
  // 直接给儿童用户充值积分（200，足够 4 次 50 积分兑换）
  await pool.query(`UPDATE users SET total_points = 200 WHERE user_id = ?`, [
    childId,
  ]);

  // 注册管理员用户并提升角色
  const regAdmin = await request(app)
    .post('/api/auth/register')
    .send({ username: adminName, password });
  adminId = regAdmin.body?.data?.userId ?? '';
  await pool.query(`UPDATE users SET role = ? WHERE user_id = ?`, [
    Role.Admin,
    adminId,
  ]);
  const loginAdmin = await request(app)
    .post('/api/auth/login')
    .send({ username: adminName, password });
  adminToken = loginAdmin.body?.data?.token ?? '';

  // 插入测试商品
  const products = [
    { id: randomUUID(), name: '兑换玩具A', price: 50, stock: 5, active: 1, cat: 'toy' },
    { id: randomUUID(), name: '高价商品B', price: 10000, stock: 5, active: 1, cat: 'toy' },
    { id: randomUUID(), name: '低库存C', price: 50, stock: 1, active: 1, cat: 'book' },
    { id: randomUUID(), name: '已下架D', price: 50, stock: 5, active: 0, cat: 'food' },
    { id: randomUUID(), name: '库存异常E', price: 50, stock: 1, active: 1, cat: 'toy' },
  ];
  for (const p of products) {
    await pool.query(
      `INSERT INTO products
         (product_id, name, price_points, stock, category, is_active, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
      [p.id, p.name, p.price, p.stock, p.cat, p.active],
    );
  }
  productA = products[0].id;
  productB = products[1].id;
  productC = products[2].id;
  productD = products[3].id;
  productE = products[4].id;
}, 30000);

afterAll(async () => {
  // 清理顺序：先删 redemptions（解除对 products 的 RESTRICT 约束）→ 删 users（级联 point_logs/carts）→ 删 products
  const productIds = [productA, productB, productC, productD, productE].filter(
    Boolean,
  );
  if (productIds.length) {
    await pool.query(
      `DELETE FROM redemptions WHERE product_id IN (${productIds.map(() => '?').join(',')})`,
      productIds,
    );
  }
  const userIds = [childId, adminId].filter(Boolean);
  if (userIds.length) {
    await pool.query(
      `DELETE FROM users WHERE user_id IN (${userIds.map(() => '?').join(',')})`,
      userIds,
    );
  }
  if (productIds.length) {
    await pool.query(
      `DELETE FROM products WHERE product_id IN (${productIds.map(() => '?').join(',')})`,
      productIds,
    );
  }
});

describe('POST /api/redemption/submit', () => {
  test('未登录 → 401', async () => {
    const res = await request(app)
      .post('/api/redemption/submit')
      .send({ productId: productA, quantity: 1 });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(401);
  });

  test('兑换成功 → 200 {redemptionId, status:pending, pointsUsed}', async () => {
    const res = await request(app)
      .post('/api/redemption/submit')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ productId: productA, quantity: 1 });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.redemptionId).toBeTruthy();
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.pointsUsed).toBe(50);
    redemptionForCancel = res.body.data.redemptionId;
  });

  test('再提交一个供 approve 测试', async () => {
    const res = await request(app)
      .post('/api/redemption/submit')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ productId: productA, quantity: 1 });
    expect(res.status).toBe(200);
    redemptionForApprove = res.body.data.redemptionId;
  });

  test('再提交一个供 reject 测试', async () => {
    const res = await request(app)
      .post('/api/redemption/submit')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ productId: productA, quantity: 1 });
    expect(res.status).toBe(200);
    redemptionForReject = res.body.data.redemptionId;
  });

  test('再提交一个供 approve 库存不足测试（productE）', async () => {
    const res = await request(app)
      .post('/api/redemption/submit')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ productId: productE, quantity: 1 });
    expect(res.status).toBe(200);
    redemptionForStockIssue = res.body.data.redemptionId;
  });

  test('积分不足 → 400 积分不足', async () => {
    const res = await request(app)
      .post('/api/redemption/submit')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ productId: productB, quantity: 1 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(res.body.message).toBe('积分不足');
  });

  test('库存不足 → 400 库存不足', async () => {
    const res = await request(app)
      .post('/api/redemption/submit')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ productId: productC, quantity: 2 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(res.body.message).toBe('库存不足');
  });

  test('商品已下架 → 400 商品不可兑换', async () => {
    const res = await request(app)
      .post('/api/redemption/submit')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ productId: productD, quantity: 1 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(res.body.message).toBe('商品不可兑换');
  });
});

describe('GET /api/redemption/list', () => {
  test('未登录 → 401', async () => {
    const res = await request(app).get('/api/redemption/list');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(401);
  });

  test('登录后返回兑换记录数组', async () => {
    const res = await request(app)
      .get('/api/redemption/list')
      .set('Authorization', `Bearer ${childToken}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(Array.isArray(res.body.data)).toBe(true);
    // 应包含前面提交的订单
    const ids = res.body.data.map((r: any) => r.redemptionId);
    expect(ids).toContain(redemptionForCancel);
    // 校验字段结构
    const item = res.body.data[0];
    expect(item).toHaveProperty('productName');
    expect(item).toHaveProperty('status');
    expect(item).toHaveProperty('pointsUsed');
  });

  test('按状态过滤返回 pending 记录', async () => {
    const res = await request(app)
      .get('/api/redemption/list?status=pending')
      .set('Authorization', `Bearer ${childToken}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(Array.isArray(res.body.data)).toBe(true);
    // 全部应为 pending
    res.body.data.forEach((r: any) => {
      expect(r.status).toBe('pending');
    });
  });
});

describe('GET /api/admin/redemption/list', () => {
  test('非管理员 → 403 无权限', async () => {
    const res = await request(app)
      .get('/api/admin/redemption/list')
      .set('Authorization', `Bearer ${childToken}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe(403);
  });

  test('管理员查询成功 → 200 含 userName', async () => {
    const res = await request(app)
      .get('/api/admin/redemption/list')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(Array.isArray(res.body.data)).toBe(true);
    // 校验字段含 userName
    const item = res.body.data[0];
    expect(item).toHaveProperty('userName');
    expect(item).toHaveProperty('productName');
    expect(item).toHaveProperty('status');
    expect(item).toHaveProperty('pointsUsed');
  });
});

describe('PUT /api/admin/redemption/:id/approve', () => {
  test('非管理员 → 403 无权限', async () => {
    const res = await request(app)
      .put(`/api/admin/redemption/${redemptionForApprove}/approve`)
      .set('Authorization', `Bearer ${childToken}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe(403);
  });

  test('批准成功 → 200 {success:true, status:approved}', async () => {
    const res = await request(app)
      .put(`/api/admin/redemption/${redemptionForApprove}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.success).toBe(true);
    expect(res.body.data.status).toBe('approved');
  });

  test('库存不足 → 400 库存不足', async () => {
    // redemptionForStockIssue 提交后 productE 库存为 0，手动改为负值模拟异常
    await pool.query(`UPDATE products SET stock = -2 WHERE product_id = ?`, [
      productE,
    ]);
    const res = await request(app)
      .put(`/api/admin/redemption/${redemptionForStockIssue}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(res.body.message).toBe('库存不足');
  });

  test('订单不存在 → 404 订单不存在', async () => {
    const res = await request(app)
      .put(`/api/admin/redemption/${randomUUID()}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(404);
    expect(res.body.message).toBe('订单不存在');
  });
});

describe('PUT /api/admin/redemption/:id/reject', () => {
  test('非管理员 → 403 无权限', async () => {
    const res = await request(app)
      .put(`/api/admin/redemption/${redemptionForReject}/reject`)
      .set('Authorization', `Bearer ${childToken}`)
      .send({ rejectReason: '理由' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe(403);
  });

  test('拒绝成功 → 200 {success:true, status:rejected}', async () => {
    const res = await request(app)
      .put(`/api/admin/redemption/${redemptionForReject}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rejectReason: '库存实际不足' });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.success).toBe(true);
    expect(res.body.data.status).toBe('rejected');
  });
});

describe('PUT /api/redemption/:id/cancel', () => {
  test('订单不存在 → 404 订单不存在', async () => {
    const res = await request(app)
      .put(`/api/redemption/${randomUUID()}/cancel`)
      .set('Authorization', `Bearer ${childToken}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(404);
    expect(res.body.message).toBe('订单不存在');
  });

  test('取消成功 → 200 {success:true, refundPoints}', async () => {
    const res = await request(app)
      .put(`/api/redemption/${redemptionForCancel}/cancel`)
      .set('Authorization', `Bearer ${childToken}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.success).toBe(true);
    expect(res.body.data.refundPoints).toBe(50);
  });

  test('已批准订单不可取消 → 400 不可取消', async () => {
    // redemptionForApprove 已被管理员批准
    const res = await request(app)
      .put(`/api/redemption/${redemptionForApprove}/cancel`)
      .set('Authorization', `Bearer ${childToken}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(res.body.message).toBe('不可取消');
  });
});
