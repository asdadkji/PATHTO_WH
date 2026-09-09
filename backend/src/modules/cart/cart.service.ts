// 购物车模块服务：查看购物车、加入、更新数量、移除
import { randomUUID } from 'crypto';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '@/database';
import { HttpError } from '@/utils/response';

// 购物车条目
export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

// 查看购物车返回
export interface CartResult {
  items: CartItem[];
}

// 加入购物车返回
export interface AddToCartResult {
  success: true;
  cartItemId: string;
}

// 更新数量返回
export interface UpdateCartResult {
  success: true;
  quantity: number;
}

class CartService {
  // 获取或创建用户购物车，返回 cart_id（并发安全：插入失败则回退查询）
  private async getOrCreateCartId(userId: string): Promise<string> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT cart_id FROM carts WHERE user_id = ? LIMIT 1`,
      [userId],
    );
    if (rows.length > 0) {
      return rows[0].cart_id;
    }
    // 不存在则创建
    const cartId = randomUUID();
    try {
      await pool.query(
        `INSERT INTO carts (cart_id, user_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`,
        [cartId, userId],
      );
      return cartId;
    } catch {
      // 并发创建冲突（user_id 唯一约束）：重新查询已创建的 cart
      const [r] = await pool.query<RowDataPacket[]>(
        `SELECT cart_id FROM carts WHERE user_id = ? LIMIT 1`,
        [userId],
      );
      return r[0].cart_id;
    }
  }

  // GET /api/cart：当前用户购物车（无则自动创建空购物车）
  async getCart(userId: string): Promise<CartResult> {
    const cartId = await this.getOrCreateCartId(userId);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ci.cart_item_id, ci.product_id, p.name, p.price_points, ci.quantity
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.cart_id = ?
       ORDER BY ci.added_at ASC`,
      [cartId],
    );
    return {
      items: rows.map((r) => ({
        cartItemId: r.cart_item_id,
        productId: r.product_id,
        name: r.name,
        price: Number(r.price_points) || 0,
        quantity: Number(r.quantity) || 0,
      })),
    };
  }

  // POST /api/cart/add：加入购物车
  // 查商品(400已下架) → 校验库存(加入后总数量) → 取/建购物车 → 已有则累加、无则插入
  async addToCart(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<AddToCartResult> {
    // 1. 查商品：不存在或 is_active=false → 400「商品已下架」
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT product_id, price_points, stock, is_active
       FROM products
       WHERE product_id = ?
       LIMIT 1`,
      [productId],
    );
    const product = rows[0];
    if (!product || !product.is_active) {
      throw new HttpError(400, '商品已下架', 400);
    }
    // 2. 取/建购物车
    const cartId = await this.getOrCreateCartId(userId);
    // 3. 查购物车中该商品现有数量（无则为 0），用于库存校验与累加
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT cart_item_id, quantity
       FROM cart_items
       WHERE cart_id = ? AND product_id = ?
       LIMIT 1`,
      [cartId, productId],
    );
    const currentQty = existing.length > 0 ? Number(existing[0].quantity) : 0;
    const resultQty = currentQty + quantity;
    // 4. 校验库存：stock≠-1(无限) 且 加入后总数量>stock → 400「库存不足」
    const stock = Number(product.stock) || 0;
    if (stock !== -1 && resultQty > stock) {
      throw new HttpError(400, '库存不足', 400);
    }
    // 5. 已有该商品：累加数量，返回已有 cartItemId
    if (existing.length > 0) {
      await pool.query(
        `UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE cart_item_id = ?`,
        [resultQty, existing[0].cart_item_id],
      );
      return { success: true, cartItemId: existing[0].cart_item_id };
    }
    // 6. 无则插入新条目
    const cartItemId = randomUUID();
    await pool.query(
      `INSERT INTO cart_items
         (cart_item_id, cart_id, product_id, quantity, added_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [cartItemId, cartId, productId, quantity],
    );
    return { success: true, cartItemId };
  }

  // PUT /api/cart/update：更新购物车项数量
  // 校验 quantity>0 → 校验归属(404) → UPDATE
  async updateCartItem(
    userId: string,
    cartItemId: string,
    quantity: number,
  ): Promise<UpdateCartResult> {
    // 1. 校验 quantity>0（DTO 已校验，此处兜底防御）
    if (!quantity || quantity <= 0) {
      throw new HttpError(400, '数量必须>0', 400);
    }
    // 2. 查 cart_item 并校验归属当前用户（JOIN carts 防越权）
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ci.cart_item_id
       FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.cart_id
       WHERE ci.cart_item_id = ? AND c.user_id = ?
       LIMIT 1`,
      [cartItemId, userId],
    );
    if (rows.length === 0) {
      throw new HttpError(404, '商品不在购物车中', 404);
    }
    // 3. 更新数量
    await pool.query(
      `UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE cart_item_id = ?`,
      [quantity, cartItemId],
    );
    return { success: true, quantity };
  }

  // DELETE /api/cart/remove：移除购物车项
  // 校验归属(404) → DELETE
  async removeCartItem(
    userId: string,
    cartItemId: string,
  ): Promise<{ success: true }> {
    // 1. 查 cart_item 并校验归属当前用户（JOIN carts 防越权）
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ci.cart_item_id
       FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.cart_id
       WHERE ci.cart_item_id = ? AND c.user_id = ?
       LIMIT 1`,
      [cartItemId, userId],
    );
    if (rows.length === 0) {
      throw new HttpError(404, '商品不在购物车中', 404);
    }
    // 2. 删除
    await pool.query(`DELETE FROM cart_items WHERE cart_item_id = ?`, [cartItemId]);
    return { success: true };
  }
}

export const cartService = new CartService();
