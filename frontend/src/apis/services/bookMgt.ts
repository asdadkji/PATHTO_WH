// 图书管理相关api
import service from '@/apis/http.ts';

// 获取所有图书
export const getAllBooks = (data: any): Promise<any> => {
  return service.get('/admin/books', { params: data });
};

// 下架图书
export const removeBook = (bookId: number): Promise<any> => {
  return service.patch(`/admin/books/${bookId}/remove`);
};

// 上架图书
export const publishBook = (bookId: number): Promise<any> => {
  return service.patch(`/admin/books/${bookId}/publish`);
};