// 图书审查服务
import { BookReviewModel } from '@/models/BookReview';

export const BookReviewService = {
  // 获取待审核图书列表
  async getPendingBooks(opts: {
    page: number;
    pageSize: number;
  }) {
    const { page, pageSize } = opts;
    const books = await BookReviewModel.getPendingBooks(page, pageSize);
    return books;
  },

  // 审核图书
  async reviewBook(data: {
    bookId: number;
    status: string;
    result: string;
    adminId: number;
  }) {
    const { bookId, status, result, adminId } = data;
    const book = await BookReviewModel.reviewBook(bookId, status, result, adminId);
    return book;
  },

  // 获取图书审查历史
  async getReviewHistory(opts: {
    page: number;
    pageSize: number;
    status?: string;
  }) {
    const { page, pageSize, status } = opts;
    const books = await BookReviewModel.getReviewHistory(page, pageSize, status);
    return books;
  }
};
