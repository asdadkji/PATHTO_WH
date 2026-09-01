// 商品模块服务：商品列表（按分类过滤）、商品详情
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '@/database';
import { HttpError } from '@/utils/response';
import { ProductCategory } from '@/types/enums';

// 合法的商品分类枚举值列表（用于 category 校验）
const PRODUCT_CATEGORIES = Object.values(ProductCategory) as string[];

// 商品列表条目
export interface ProductListItem {
  productId: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

// 商品详情返回
export interface ProductDetail {
  productId: string;
  name: string;
  price: number;
  description: string | null;
  stock: number;
}

class ProductService {
  // GET /api/product/list：查询上架商品列表，可按分类过滤
  // 不传 category 返回所有 is_active=true 的商品；传则按分类过滤（必须合法枚举，否则 400）
  async listProducts(category?: string): Promise<ProductListItem[]> {
    if (category !== undefined && category !== '') {
      // 校验 category 是否合法枚举
      if (!PRODUCT_CATEGORIES.includes(category)) {
        throw new HttpError(400, '分类无效', 400);
      }
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT product_id, name, price_points, stock, category
         FROM products
         WHERE is_active = true AND category = ?
         ORDER BY sort_order ASC, created_at DESC`,
        [category],
      );
      return rows.map((r) => ({
        productId: r.product_id,
        name: r.name,
        price: Number(r.price_points) || 0,
        stock: Number(r.stock) || 0,
        category: r.category,
      }));
    }
    // 未传 category：返回所有上架商品
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT product_id, name, price_points, stock, category
       FROM products
       WHERE is_active = true
       ORDER BY sort_order ASC, created_at DESC`,
    );
    return rows.map((r) => ({
      productId: r.product_id,
      name: r.name,
      price: Number(r.price_points) || 0,
      stock: Number(r.stock) || 0,
      category: r.category,
    }));
  }

  // GET /api/product/:id：查询上架商品详情，不存在或已下架返回 404
  async getProductDetail(productId: string): Promise<ProductDetail> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT product_id, name, price_points, description, stock
       FROM products
       WHERE product_id = ? AND is_active = true
       LIMIT 1`,
      [productId],
    );
    const product = rows[0];
    if (!product) {
      throw new HttpError(404, '商品不存在', 404);
    }
    return {
      productId: product.product_id,
      name: product.name,
      price: Number(product.price_points) || 0,
      description: product.description,
      stock: Number(product.stock) || 0,
    };
  }
}

export const productService = new ProductService();
