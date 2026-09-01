// 模块4 后端测试：商城接口（product list/detail + cart get/add/update/remove）
import { randomUUID } from 'crypto';
import request from 'supertest';
import { app } from '@/app';
import { pool } from '@/database';

const unique = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const password = 'pass123456';
const username = unique('shop');
let token = '';
let userId = '';

// 测试商品 ID
let productIdNormal = ''; // 上架、库存 5
let productIdNoStock = ''; // 上架、库存 0
let productIdInactive = ''; // 下架
let productIdUnlimited = ''; // 上架、库存 -1（无限）
// 加入购物车后保存的 cartItemId
let cartItemId = '';

beforeAll(async () => {
  // 注册并登录用户
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ username, password });
  userId = reg.body?.data?.userId ?? '';
  const login = await request(app)
    .post('/api/auth/login')
    .send({ username, password });
  token = login.body?.data?.token ?? '';

  // 插入测试商品（直接 SQL，避免依赖商品管理接口）
  const products = [
    {
      id: randomUUID(),
      name: '测试玩具',
      price: 50,
      stock: 5,
      category: 'toy',
      active: 1,
      desc: '一个测试玩具',
    },
    {
      id: randomUUID(),
      name: '测试游戏时间',
      price: 30,
      stock: 0,
      category: 'game_time',
      active: 1,
      desc: '游戏时间券',
    },
    {
      id: randomUUID(),
      name: '已下架商品',
      price: 100,
      stock: 10,
      category: 'food',
      active: 0,
      desc: '不应可见',
    },
    {
      id: randomUUID(),
      name: '无限库存商品',
      price: 20,
      stock: -1,
      category: 'book',
      active: 1,
      desc: '库存充足',
    },
  ];
  for (const p of products) {
    await pool.query(
      `INSERT INTO products
         (product_id, name, description, price_points, category, stock, is_active, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
      [p.id, p.name, p.desc, p.price, p.category, p.stock, p.active],
    );
  }
  productIdNormal = products[0].id;
  productIdNoStock = products[1].id;
  productIdInactive = products[2].id;
  productIdUnlimited = products[3].id;
});

afterAll(async () => {
  // 清理顺序：先删 cart_items（避免 products 删除时受 RESTRICT 约束干扰）
  if (userId) {
    await pool.query(
      `DELETE FROM cart_items WHERE cart_id IN (SELECT cart_id FROM carts WHERE user_id = ?)`,
      [userId],
    );
  }
  // 删测试商品
  const productIds = [
    productIdNormal,
    productIdNoStock,
    productIdInactive,
    productIdUnlimited,
  ].filter(Boolean);
  if (productIds.length) {
    await pool.query(
      `DELETE FROM products WHERE product_id IN (${productIds.map(() => '?').join(',')})`,
      productIds,
    );
  }
  // 删用户（级联清理 carts）
  if (userId) {
    await pool.query(`DELETE FROM users WHERE user_id = ?`, [userId]);
  }
});

describe('GET /api/product/list', () => {
  test('未登录 → 401', async () => {
    const res = await request(app).get('/api/product/list');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(401);
  });

  test('登录后返回上架商品数组', async () => {
    const res = await request(app)
      .get('/api/product/list')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(Array.isArray(res.body.data)).toBe(true);
    // 测试商品应在上架列表中（已下架的不应出现）
    const ids = res.body.data.map((p: any) => p.productId);
    expect(ids).toContain(productIdNormal);
    expect(ids).toContain(productIdUnlimited);
    expect(ids).not.toContain(productIdInactive);
    // 校验字段结构
    const item = res.body.data.find((p: any) => p.productId === productIdNormal);
    expect(item).toBeTruthy();
    expect(item).toHaveProperty('name');
    expect(item).toHaveProperty('price');
    expect(item).toHaveProperty('stock');
    expect(item).toHaveProperty('category');
  });

  test('按分类过滤 → 返回对应分类商品', async () => {
    const res = await request(app)
      .get('/api/product/list?category=toy')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(Array.isArray(res.body.data)).toBe(true);
    const ids = res.body.data.map((p: any) => p.productId);
    expect(ids).toContain(productIdNormal);
    // 其他分类商品不应出现
    expect(ids).not.toContain(productIdUnlimited);
  });

  test('分类无效 → 400 分类无效', async () => {
    const res = await request(app)
      .get('/api/product/list?category=invalid')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(res.body.message).toBe('分类无效');
  });
});

describe('GET /api/product/:id', () => {
  test('商品详情 → 200 {productId, name, price, description, stock}', async () => {
    const res = await request(app)
      .get(`/api/product/${productIdNormal}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.productId).toBe(productIdNormal);
    expect(res.body.data.name).toBe('测试玩具');
    expect(res.body.data.price).toBe(50);
    expect(res.body.data.description).toBe('一个测试玩具');
    expect(res.body.data.stock).toBe(5);
  });

  test('商品不存在 → 404 商品不存在', async () => {
    const res = await request(app)
      .get(`/api/product/${randomUUID()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(404);
    expect(res.body.message).toBe('商品不存在');
  });

  test('已下架商品 → 404 商品不存在', async () => {
    const res = await request(app)
      .get(`/api/product/${productIdInactive}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(404);
    expect(res.body.message).toBe('商品不存在');
  });
});

describe('GET /api/cart', () => {
  test('未登录 → 401', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(401);
  });

  test('登录后返回购物车 {items}', async () => {
    const res = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveProperty('items');
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });
});

describe('POST /api/cart/add', () => {
  test('加入购物车成功 → 200 {success:true, cartItemId}', async () => {
    const res = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: productIdNormal, quantity: 2 });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.success).toBe(true);
    expect(res.body.data.cartItemId).toBeTruthy();
    cartItemId = res.body.data.cartItemId;
  });

  test('库存不足 → 400 库存不足', async () => {
    // productIdNormal 库存 5，已加 2，再加 5 → 总 7 > 5
    const res = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: productIdNormal, quantity: 5 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(res.body.message).toBe('库存不足');
  });

  test('商品已下架 → 400 商品已下架', async () => {
    const res = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: productIdInactive, quantity: 1 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(res.body.message).toBe('商品已下架');
  });
});

describe('PUT /api/cart/update', () => {
  test('修改数量成功 → 200 {success:true, quantity}', async () => {
    const res = await request(app)
      .put('/api/cart/update')
      .set('Authorization', `Bearer ${token}`)
      .send({ cartItemId, quantity: 3 });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.success).toBe(true);
    expect(res.body.data.quantity).toBe(3);
  });

  test('数量必须>0 → 400 数量必须>0', async () => {
    const res = await request(app)
      .put('/api/cart/update')
      .set('Authorization', `Bearer ${token}`)
      .send({ cartItemId, quantity: 0 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(res.body.message).toBe('数量必须>0');
  });
});

describe('DELETE /api/cart/remove', () => {
  test('移除商品成功 → 200 {success:true}', async () => {
    const res = await request(app)
      .delete(`/api/cart/remove?cartItemId=${cartItemId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.success).toBe(true);
  });

  test('商品不在购物车中 → 404 商品不在购物车中', async () => {
    const res = await request(app)
      .delete(`/api/cart/remove?cartItemId=${randomUUID()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(404);
    expect(res.body.message).toBe('商品不在购物车中');
  });
});
