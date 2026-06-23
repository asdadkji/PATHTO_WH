//图书模型
import {pool} from '@/database'
import { RowDataPacket } from 'mysql2';
import any = jasmine.any;

export interface BookRow extends RowDataPacket {
    id: number;
    title: string;
    author: string;
    price: number;
    cover_image: string;
    status: string;
    is_featured: 0 | 1;
    is_urgent: 0 | 1;
    category_id: number;
    book_type: string;
    view_count: number;
    favorite_count: number;
    inquiry_count: number;
    created_at: string;
}

export const BookModel = {
    //详情页-完整图书信息
    async getById (id:number) {
        const [rows] = await pool.execute<BookRow[]>("SELECT b.*, m.shop_name AS merchantName,m.id AS merchantId FROM books as b LEFT JOIN merchant AS m ON m.id = b.merchant_id WHERE b.id = ? AND b.status = 'available' AND b.review_status = 'approved'", [id]);
        return rows[0] ?? null
    },
    //首页-图书列表-按部分分类展示最新10本
    async getLatestByCategoryIds(categoryIds: number[], limit = 10) {
        const placeholders = categoryIds.map(() => '?').join(',');
        const [rows] = await pool.query<BookRow[]>(
            `SELECT b.id, b.title, b.author, b.price, b.cover_image, b.created_at, b.category_id
         FROM books b 
         WHERE b.category_id IN (${placeholders}) AND b.status = 'available' AND b.review_status = 'approved'
         ORDER BY b.category_id, b.created_at DESC 
         LIMIT ?`,
            [...categoryIds, limit]
        );
        return rows;
    },
    //筛选页-根据筛选条件进行图书筛选
    async filter(opts:{ keyword?:string, categoryId?:number, author?:string, bookCondition?: 'new' | 'like_new' | 'very_good' | 'good' | 'acceptable' | 'poor', sort?: 'created_at' | 'price' | 'publish_year', order?: 'ASC' | 'DESC', page:number, size:number }) {
        const {page,size,sort = 'created_at',order='DESC',keyword,categoryId,author,bookCondition} = opts
        //白名单
        const allowSort = ['created_at','price','publish_year']
        if(!allowSort.includes(sort)) throw new Error('非法排序字段')
        //where条件
        let where = 'WHERE status = ? AND review_status = ?'
        //params参数
        const params:any[] = ['available', 'approved']
        //搜索框筛选
        if(keyword) {
            where += ' AND (title LIKE ? OR author LIKE ? OR publisher LIKE ? OR description LIKE ?)';
            const keywordPattern = `%${keyword}%`;
            params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern)
        }
        if(categoryId) {
            where += ' AND category_id = ?'
            params.push(categoryId)
        }
        if(author?.trim()) {
            where += ' AND author LIKE ?';
            params.push(`%${author.trim()}%`)
        }
        if (bookCondition) {
            where += ' AND book_condition = ?';
            params.push(bookCondition)
        }
        //排序
        const orderBy = `\`${sort}\` ${order === 'ASC' ? 'ASC' : 'DESC'}`
        //分页
        const limit = 'LIMIT ? OFFSET ?';
        //总数
        const [total] = await pool.execute<RowDataPacket[]>(
            `SELECT COUNT(*) as total FROM books ${where}`,params
        );
        //查询数据
        const dataParams = [...params, Math.floor(size), Math.floor((page - 1) * size)];
        const [rows] = await pool.query<BookRow[]>(
            `SELECT * FROM books ${where} ORDER BY ${orderBy} ${limit}`,dataParams
        );
        return {
            rows,total: total[0].total
        }
    },
    //商家上架图书
    async addBook(bookData:any) {
        // 处理cover_image字段，如果是数组则转换为JSON字符串
        const coverImage = Array.isArray(bookData.cover_image) ? JSON.stringify(bookData.cover_image) : bookData.cover_image;
        // 处理images字段，如果是数组则转换为JSON字符串
        const images = Array.isArray(bookData.images) ? JSON.stringify(bookData.images) : bookData.images;
        
        const sql = `INSERT INTO books (
                   title,
                   highlights,
                   author,
                   publisher,
                   category_id,
                   publish_year,
                   original_price,
                   book_condition,
                   description,
                   price,
                   cover_image,
                   images,
                   seller_id,
                   merchant_id,
                   review_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
        const [rows] = await pool.execute(sql,[bookData.title,bookData.highlights,bookData.author,bookData.publisher,bookData.category_id,bookData.publish_year,bookData.original_price,bookData.book_condition,bookData.description,bookData.price,coverImage,images,bookData.seller_id,bookData.merchant_id,'pending']);
        return rows;
    },
    //商家下架图书
    async deleteBook(bookId:number,merchantId:number) {
        const sql = `UPDATE books SET status = 'pending' WHERE id = ? AND merchant_id = ?`;
        const [rows] = await pool.execute(sql,[bookId,merchantId]);
        return rows;
    },
    //获取商家图书列表
    async getMerchantBooks(merchantId:number,page=1,size=20,filter?:{status?:string,author?:string,title?:string,category_id?:number}) {
        const offset = (size * (page - 1));
        let query = `SELECT * FROM books WHERE merchant_id = ?`
        const params:any[] = [merchantId];

        let countQuery = 'SELECT COUNT(*) as total FROM books WHERE merchant_id = ?';
        const countParams:any[] = [merchantId];
        if(filter?.status) {
            query += ` AND status = ?`
            params.push(filter.status);
            countQuery += ` AND status = ?`
            countParams.push(filter.status);
        }
        if(filter?.author) {
            query += ` AND author LIKE ?`
            params.push(`%${filter.author}%`);
            countQuery += ` AND author LIKE ?`
            countParams.push(`%${filter.author}%`);
        }
        if(filter?.title) {
            query += ` AND title LIKE ?`
            params.push(`%${filter.title}%`);
            countQuery += ` AND title LIKE ?`
            countParams.push(`%${filter.title}%`);
        }
        if(filter?.category_id) {
            query += ` AND category_id = ?`
            params.push(filter.category_id);
            countQuery += ` AND category_id = ?`
            countParams.push(filter.category_id);
        }
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(size,offset);

        const [rows] = await pool.query(query,params);
        const [countRows] = await pool.query(countQuery, countParams) as [any,any];
        return {rows,total:countRows[0].total,page,size};
    },
    //获取商家单个图书
    async getBookById(bookId:number,merchantId:number) {
        const [rows] = await pool.execute(`SELECT * FROM books WHERE id = ? AND merchant_id = ?`,[bookId,merchantId]) as [any[],any];
        return rows[0] || null;
    },
    //更新商家图书的线下交易设置
    async updateMerchantOfflineTrade(merchantId: number, enabled: boolean) {
        const transactionMethods = enabled ? JSON.stringify(['face_to_face']) : null;
        const sql = `UPDATE books SET transaction_methods = ? WHERE merchant_id = ? AND status = 'available'`;
        const [rows] = await pool.execute(sql, [transactionMethods, merchantId]);
        return rows;
    },
    // 获取所有图书
    async getAllBooks(opts: {
        page: number,
        pageSize: number,
        keyword?: string,
        categoryId?: number,
        status?: string,
        author?: string
    }) {
        const { page, pageSize, keyword, categoryId, status, author } = opts;
        const offset = (page - 1) * pageSize;
        let query = `SELECT b.*, u.username as seller_username FROM books as b LEFT JOIN users as u ON b.seller_id = u.id`;
        const params: any[] = [];
        let where = '';
        
        if (keyword) {
            where += where ? ' AND ' : ' WHERE ';
            where += 'MATCH(b.title, b.author, b.publisher, b.description) AGAINST(? IN NATURAL LANGUAGE MODE)';
            params.push(keyword);
        }
        
        if (categoryId) {
            where += where ? ' AND ' : ' WHERE ';
            where += 'b.category_id = ?';
            params.push(categoryId);
        }
        
        if (status) {
            where += where ? ' AND ' : ' WHERE ';
            where += 'b.status = ?';
            params.push(status);
        }
        
        if (author) {
            where += where ? ' AND ' : ' WHERE ';
            where += 'b.author LIKE ?';
            params.push(`%${author}%`);
        }
        
        query += where + ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
        // 保存查询参数（不包含分页参数）
        const queryParams = [...params];
        
        // 添加分页参数
        params.push(pageSize, offset);
        
        const [rows] = await pool.query(query, params);
        
        let countQuery = `SELECT COUNT(*) as total FROM books`;
        
        if (where) {
            countQuery += where;
        }
        
        const [total] = await pool.query(countQuery, queryParams) as [any, any];
        
        return {
            books: rows,
            total: total[0].total,
            page,
            pageSize
        };
    },
    // 下架图书
    async removeBook(bookId: number) {
        const sql = `UPDATE books SET status = 'pending' WHERE id = ?`;
        const [rows] = await pool.execute(sql, [bookId]);
        return rows;
    },
    // 上架图书
    async publishBook(bookId: number) {
        const sql = `UPDATE books SET status = 'available' WHERE id = ?`;
        const [rows] = await pool.execute(sql, [bookId]);
        return rows;
    }
}