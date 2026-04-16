// 卖家图书审查相关API
import service from '@/apis/http.ts';

// 获取卖家图书审查历史
export const getSellerBookReviewHistory = (params: {
  sellerId: number;
  page: number;
  pageSize: number;
}): Promise<any> => {
  return service.get('/seller/bookReview/history', { params });
};
