// 图书审查相关API
import service from '@/apis/http.ts';

// 获取待审核图书列表
export const getPendingBooks = (params: {
  page: number;
  pageSize: number;
}): Promise<any> => {
  return service.get('/admin/bookReview/pending', { params });
};

// 审核图书
export const reviewBook = (data: {
  bookId: number;
  status: string;
  result: string;
  adminId: number;
}): Promise<any> => {
  return service.post('/admin/bookReview/review', data);
};

// 获取图书审查历史
export const getReviewHistory = (params: {
  page: number;
  pageSize: number;
  status?: string;
}): Promise<any> => {
  return service.get('/admin/bookReview/history', { params });
};
