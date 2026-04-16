// 卖家图书审查模型
import { pool } from '@/database';
import { RowDataPacket } from 'mysql2';

export const SellerBookReviewModel = {
  // 获取卖家图书审查历史
  async getSellerBookReviewHistory(sellerId: number, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM books WHERE seller_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [sellerId, pageSize, offset]
    );
    
    const [total] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM books WHERE seller_id = ?`,
      [sellerId]
    );
    
    return {
      books: rows,
      total: total[0].total,
      page,
      pageSize
    };
  }
};
