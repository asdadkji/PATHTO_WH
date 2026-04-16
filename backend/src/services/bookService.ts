//图书服务
import {BookModel} from "@/models/Book";

export const BookService = {
    //筛选页
    async filter(opts:{
        keyword?:string,
        categoryId?:number,
        author?:string,
        bookCondition?: 'new' | 'like_new' | 'very_good' | 'good' | 'acceptable' | 'poor',
        sort?: 'created_at' | 'price' | 'publish_year',
        order?: 'ASC' | 'DESC',
        page:number,
        size:number
    }) {
        const books = await BookModel.filter(opts);
        return {books};
    },
    //图书详情页
    async getBookAll(id:number) {
        const booksAll = await BookModel.getById(id);
        return {booksAll};
    },
    //首页推荐模块
    async getBookByCategoryId() {
        const categoryIds = [1, 2, 4, 5, 9, 15];

        // 并行查询所有分类
        const categoryPromises = categoryIds.map(categoryId =>
            BookModel.getLatestByCategoryIds([categoryId], 10)
        );

        const allResults = await Promise.all(categoryPromises);

        // 使用 Record 类型定义 grouped
        const grouped: Record<number, any[]> = {}; // 先用 any[]，后面可以替换为具体类型
        categoryIds.forEach((categoryId, index) => {
            grouped[categoryId] = allResults[index] || [];
        });

        return { grouped };
    },
    //商家上架图书
    async addBook(bookData:any) {
        const book = await BookModel.addBook(bookData);
        if(!book) {
            return {code:1, message:'添加失败'}
        }
        return book;
    },
    //商家下架图书
    async deleteBook(bookId:number,merchantId:number) {
        try {
            if(!bookId || !merchantId) {
                return {code:1, message:'参数错误'}
            }
            const book = await BookModel.getBookById(bookId,merchantId)

            if(!book) {
                return {code:1, message:'图书不存在'}
            }
            // @ts-ignore
            if(book.status === 'expired') {
                return {code:1, message:'图书已下架'}
            }
            const result = await BookModel.deleteBook(bookId,merchantId);
            return result;
        } catch (e) {
            console.log('下架失败',e)
        }
    },
    //商家图书展示
    async showMerchantBooks(merchantId:number,page=1,size=20,filter?:{status?:string,author?:string,title?:string,category_id?:number}) {
        try {
            const book = await BookModel.getMerchantBooks(merchantId,page,size,filter);
            if(!book) {
                return {code:1, message:'图书不存在'}
            }
            return book;
        } catch (e) {
            console.log('获取失败',e)
        }
    },
    //更新商家图书的线下交易设置
    async updateMerchantOfflineTrade(merchantId: number, enabled: boolean) {
        try {
            const result = await BookModel.updateMerchantOfflineTrade(merchantId, enabled);
            return result;
        } catch (e) {
            console.log('更新线下交易设置失败', e);
            throw e;
        }
    }
}