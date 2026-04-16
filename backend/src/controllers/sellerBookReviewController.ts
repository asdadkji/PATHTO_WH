// 卖家图书审查控制器
import { Request, Response } from 'express';
import { SellerBookReviewService } from '@/services/sellerBookReviewService';

// 获取卖家图书审查历史
export const getSellerBookReviewHistory = async (req: Request, res: Response) => {
  try {
    const { sellerId, page, pageSize } = req.query;
    const data = await SellerBookReviewService.getSellerBookReviewHistory({
      sellerId: parseInt(sellerId as string),
      page: parseInt(page as string) || 1,
      pageSize: parseInt(pageSize as string) || 10
    });
    res.json({ code: 0, data });
  } catch (error: any) {
    console.error('获取卖家图书审查历史失败:', error);
    res.json({ code: 1, message: error.message });
  }
};
