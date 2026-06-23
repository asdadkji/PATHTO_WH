// 图书管理控制器
import { Request, Response } from 'express';
import { BookService } from "../services/bookService";

// 获取所有图书
export const getAllBooks = async (req: Request, res: Response) => {
  try {
    const { page, pageSize, keyword, categoryId, status, author } = req.query;
    const data = await BookService.getAllBooks({
      page: parseInt(page as string) || 1,
      pageSize: parseInt(pageSize as string) || 10,
      keyword: keyword as string,
      categoryId: categoryId && categoryId !== '' ? parseInt(categoryId as string) : undefined,
      status: status as string,
      author: author as string
    });
    res.json({ code: 0, data });
  } catch (error: any) {
    res.json({ code: 1, message: error.message });
  }
};

// 下架图书
export const removeBook = async (req: Request, res: Response) => {
  try {
    const bookId = Number(req.params.bookId);
    if (isNaN(bookId)) {
      return res.status(400).json({ code: 1, message: '无效的图书ID' });
    }
    const data = await BookService.removeBook(bookId);
    res.json({ code: 0, data, message: '图书下架成功' });
  } catch (error: any) {
    res.json({ code: 1, message: error.message });
  }
};

// 上架图书
export const publishBook = async (req: Request, res: Response) => {
  try {
    const bookId = Number(req.params.bookId);
    if (isNaN(bookId)) {
      return res.status(400).json({ code: 1, message: '无效的图书ID' });
    }
    const data = await BookService.publishBook(bookId);
    res.json({ code: 0, data, message: '图书上架成功' });
  } catch (error: any) {
    res.json({ code: 1, message: error.message });
  }
};