// 卖家图书审查服务
import { SellerBookReviewModel } from '@/models/SellerBookReview';

export const SellerBookReviewService = {
  // 获取卖家图书审查历史
  async getSellerBookReviewHistory(opts: {
    sellerId: number;
    page: number;
    pageSize: number;
  }) {
    const { sellerId, page, pageSize } = opts;
    const books = await SellerBookReviewModel.getSellerBookReviewHistory(sellerId, page, pageSize);
    return books;
  }
};
