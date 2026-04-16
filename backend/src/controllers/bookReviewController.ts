// 图书审查控制器
import { Request, Response } from 'express';
import { BookReviewService } from '@/services/bookReviewService';

// 获取待审核图书列表
export const getPendingBooks = async (req: Request, res: Response) => {
  try {
    const { page, pageSize } = req.query;
    const data = await BookReviewService.getPendingBooks({
      page: parseInt(page as string) || 1,
      pageSize: parseInt(pageSize as string) || 10
    });
    res.json({ code: 0, data });
  } catch (error: any) {
    console.error('获取待审核图书失败:', error);
    res.json({ code: 1, message: error.message });
  }
};

// 审核图书
export const reviewBook = async (req: Request, res: Response) => {
  try {
    const { bookId, status, result, adminId } = req.body;
    const data = await BookReviewService.reviewBook({
      bookId,
      status,
      result,
      adminId
    });
    res.json({ code: 0, data, message: '审核成功' });
  } catch (error: any) {
    console.error('审核图书失败:', error);
    res.json({ code: 1, message: error.message });
  }
};

// 获取图书审查历史
export const getReviewHistory = async (req: Request, res: Response) => {
  try {
    const { page, pageSize, status } = req.query;
    const data = await BookReviewService.getReviewHistory({
      page: parseInt(page as string) || 1,
      pageSize: parseInt(pageSize as string) || 10,
      status: status as string
    });
    res.json({ code: 0, data });
  } catch (error: any) {
    console.error('获取图书审查历史失败:', error);
    res.json({ code: 1, message: error.message });
  }
};
