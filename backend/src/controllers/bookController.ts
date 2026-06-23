//图书CRUD
import { Request, Response } from 'express';
import {BookService} from "@/services/bookService";
//筛选页条件筛选
export const filter = async (req: Request, res: Response) => {
    try {
        const {keyword, categoryId, sort, order, page, size,author,bookCondition} = req.query;
        const data = await BookService.filter({
            keyword: keyword as string,
            categoryId: categoryId ? parseInt(categoryId as string) : undefined,
            sort: sort as 'created_at' | 'price' | 'publish_year',
            order: order as 'ASC' | 'DESC',
            page: parseInt(page as string) || 1,
            size: parseInt(size as string) || 10,
            author: author as string,
            bookCondition: bookCondition as 'new' | 'like_new' | 'very_good' | 'good' | 'acceptable' | 'poor' | undefined
        });
        res.json({code:0, data})
    } catch (error:any) {
        res.json({code:1, message:error.message})
    }
}
//详情页图书信息展示
export const showBooksAll = async (req: Request, res: Response) => {
    try {
        const {id}  = req.params
        const bookId = Number(id)
        if (isNaN(bookId) || bookId <= 0) {
            return res.json({ code: 1, message: '无效的图书ID' });
        }
        const data = await BookService.getBookAll(bookId);
        res.json({code:0, data})
    } catch (error:any) {
        res.json({code:1, message:error.message})
    }
}
//首页分类推荐模块
export const getBooksCategory = async (req: Request, res: Response) => {
    try {
        const data = await BookService.getBookByCategoryId()
        res.json({code:0, data})
    } catch (error:any) {
        res.json({code:1, message:error.message})
    }
}
//商家上架图书
export const addBooks = async (req: Request, res: Response) => {
    try {
        const bookData = req.body
        const data = await BookService.addBook(bookData);
        res.json({code:0, data, message:'添加成功'})
    } catch (e) {
        console.log('上架失败',e)
    }
}
//商家下架图书
export const deleteBooks = async (req: Request, res: Response) => {
    try {
        const bookId = Number(req.params.bookId);
        const merchantId = Number(req.params.merchantId);
        const data = await BookService.deleteBook(bookId,merchantId);
        if (data && data.code === 1) {
            res.json(data);
        } else {
            res.json({code:0, data, message:'下架成功'});
        }
    } catch (e) {
        console.log('下架失败',e);
        res.json({code:1, message:'下架失败'});
    }
}
//商家图书展示
export const getMerchantBooks = async (req: Request, res: Response) => {
    try {
        const merchantId = Number(req.params.merchantId);
        const page = Number(req.query.page) || 1;
        const size = Number(req.query.size) || 10;
        const filter = {
            status:req.query.status as string || undefined,
            author: req.query.author as string || undefined,
            title: req.query.title as string || undefined,
            category_id: req.query.category_id ? parseInt(req.query.category_id as string) : undefined,
        }
        if (isNaN(merchantId)) {
            return res.status(400).json({
                success: false,
                message: '无效的商家ID'
            });
        }
        const data = await BookService.showMerchantBooks(merchantId,page,size,filter);
        res.json({code:0, data, message:'获取成功'})
    } catch (e) {
        console.log('获取失败',e)
    }
}

//更新商家图书的线下交易设置
export const updateMerchantOfflineTrade = async (req: Request, res: Response) => {
    try {
        const { merchantId, enabled } = req.body;
        if (!merchantId) {
            return res.status(400).json({code:1, message: 'merchantId is required'});
        }
        const data = await BookService.updateMerchantOfflineTrade(merchantId, enabled);
        res.json({code:0, data, message:'更新成功'})
    } catch (e) {
        console.log('更新线下交易设置失败',e);
        res.json({code:1, message: '更新失败'});
    }
}
