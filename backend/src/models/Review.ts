//评价模型
import {pool} from "@/database";
import {OkPacket, RowDataPacket} from "mysql2";

export interface Review {
    id: number;
    order_id: number;
    reviewer_id: number;
    reviewed_user_id: number;
    role: 'buyer' | 'seller';
    rating: number;
    comment?: string;
    tags?: string[];
    reply_content?: string;
    replied_at?: Date;
    is_anonymous: boolean;
    is_visible: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface ReviewInput {
    order_id: number;
    reviewer_id: number;
    reviewed_user_id: number;
    role: 'buyer' | 'seller';
    rating: number;
    comment?: string;
    tags?: string[];
    is_anonymous?: boolean;
}

export interface ReviewFilter {
    reviewed_user_id?: number;
    reviewer_id?: number;
    role?: 'buyer' | 'seller';
    rating?: number;
    min_rating?: number;
    max_rating?: number;
    start_date?: Date;
    end_date?: Date;
    has_reply?: boolean;
    page?: number;
    limit?: number;
    sort_by?: 'created_at' | 'rating';
    sort_order?: 'ASC' | 'DESC';
}

export interface PaginatedReviews {
    data: Review[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        total_pages: number;
    };
}

export interface UserStats {
    total_reviews: number;
    avg_rating: number;
    rating_distribution: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
}

export interface ApiResponse<T = any> {
    code: number;
    message: string;
    data?: T;
    error?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}

export const reviewModel = {
    //发布评论
    async createReview(reviewData: ReviewInput): Promise<Review> {
        try {
            //验证是否已评论过
            const [existing] = await pool.execute<RowDataPacket[]>(
                'SELECT id FROM reviews WHERE order_id = ? AND reviewer_id = ?',
                [reviewData.order_id, reviewData.reviewer_id]
            );
            if (existing.length > 0) {
                throw new Error('您已经评价过此订单');
            }
            //插入评论
            const [result] = await pool.execute<OkPacket>(
                `INSERT INTO reviews (
        order_id, reviewer_id, reviewed_user_id, 
        role, rating, comment, tags, is_anonymous
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    reviewData.order_id,
                    reviewData.reviewer_id,
                    reviewData.reviewed_user_id,
                    reviewData.role,
                    reviewData.rating,
                    reviewData.comment || null,
                    reviewData.tags ? JSON.stringify(reviewData.tags) : null,
                    reviewData.is_anonymous || false
                ]
            );
            const [rows] = await pool.execute<RowDataPacket[]>(
                'SELECT * FROM reviews WHERE id = ?',
                [result.insertId]
            );

            return rows[0] as Review;
        } catch (e:any) {
            console.log('评论失败', e);
            throw new Error(e.message);
        }
    },
    //展示评论
    async showReview(reviewedId: number,page:number,pageSize:number): Promise<PaginatedReviews> {
        try {
            const offset = (page - 1) * pageSize;
            let query = `
            FROM reviews r
            LEFT JOIN orders o ON r.order_id = o.id
            WHERE r.is_visible = 1 
            AND r.reviewed_user_id = ?
        `;
            // 获取总数
            const [countRows] = await pool.execute<RowDataPacket[]>(
                `SELECT COUNT(*) as total ${query}`,
                [reviewedId]
            );
            const total = countRows[0].total;
            const totalPages = Math.ceil(total / pageSize);
            // 获取数据
            const [dataRows] = await pool.query<RowDataPacket[]>(`SELECT r.*,o.order_number,o.book_snapshot ${query}  LIMIT ? OFFSET ?`, [reviewedId, pageSize, offset]);
            return {
                data: dataRows as Review[],
                pagination: {
                    page,
                    pageSize,
                    total,
                    total_pages: totalPages
                }
            };
        } catch (e:any) {
            console.log('展示评论失败',e);
            throw e;
        }
    },
    //隐藏评论
    async hideReview(reviewId: number,isVisible: boolean) {
        const [result] = await pool.execute<OkPacket>('UPDATE reviews SET is_visible = ? WHERE id = ?',[isVisible,reviewId]);
        return result.affectedRows > 0;
    }
}