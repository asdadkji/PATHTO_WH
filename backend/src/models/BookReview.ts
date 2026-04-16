// 图书审查模型
import { pool } from '@/database';
import { RowDataPacket } from 'mysql2';

export const BookReviewModel = {
  // 获取待审核图书列表
  async getPendingBooks(page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM books WHERE review_status = 'pending' ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );
    
    const [total] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM books WHERE review_status = 'pending'`
    );
    
    return {
      books: rows,
      total: total[0].total,
      page,
      pageSize
    };
  },

  // 审核图书
  async reviewBook(bookId: number, status: string, result: string, adminId: number) {
    const [rows] = await pool.execute(
      `UPDATE books SET review_status = ?, review_result = ?, review_admin_id = ?, reviewed_at = NOW() WHERE id = ?`,
      [status, result, adminId, bookId]
    );
    
    return rows;
  },

  // 获取图书审查历史
  async getReviewHistory(page: number, pageSize: number, status?: string) {
    const offset = (page - 1) * pageSize;
    let query = `SELECT * FROM books WHERE review_status IN ('approved', 'rejected')`;
    const params: any[] = [];
    
    if (status) {
      query += ` AND review_status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY reviewed_at DESC LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);
    
    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    
    let countQuery = `SELECT COUNT(*) as total FROM books WHERE review_status IN ('approved', 'rejected')`;
    const countParams: any[] = [];
    
    if (status) {
      countQuery += ` AND review_status = ?`;
      countParams.push(status);
    }
    
    const [total] = await pool.query<RowDataPacket[]>(countQuery, countParams);
    
    return {
      books: rows,
      total: total[0].total,
      page,
      pageSize
    };
  }
};
