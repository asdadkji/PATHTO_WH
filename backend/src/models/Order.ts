//订单模型
import {pool} from "@/database";
import {ResultSetHeader, RowDataPacket} from "mysql2";
//ts
export enum OrderStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    PAID = 'paid',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded'
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    FAILED = 'failed',
    REFUNDED = 'refunded'
}

export enum PaymentMethod {
    CASH = 'cash',
    WECHAT = 'wechat',
    ALIPAY = 'alipay',
    BANK_TRANSFER = 'bank_transfer'
}

export enum TransactionMethod {
    FACE_TO_FACE = 'face_to_face',
    EXPRESS = 'express',
    CAMPUS_DELIVERY = 'campus_delivery'
}

export enum CancelType {
    BUYER = 'buyer',
    SELLER = 'seller',
    SYSTEM = 'system'
}

// 订单实体接口（完全对应数据库表）
export interface IOrder {
    id?: number
    order_number: string
    book_id: number
    book_snapshot: Record<string, any>
    buyer_id: number
    seller_id: number
    unit_price: number
    quantity: number
    total_price: number
    delivery_fee?: number
    final_price: number
    status: OrderStatus
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    payment_id?: string
    paid_at?: Date
    transaction_method: TransactionMethod
    meeting_location?: string
    meeting_time?: Date
    shipping_address?: Record<string, any>
    tracking_company?: string
    tracking_number?: string
    shipped_at?: Date
    delivered_at?: Date
    buyer_note?: string
    seller_note?: string
    cancel_reason?: string
    cancel_type?: CancelType
    created_at?: Date
    updated_at?: Date
    completed_at?: Date
    cancelled_at?: Date
}

// API请求/响应类型
export interface CreateOrderRequest {
    book_id: number
    book_snapshot: Record<string, any>
    seller_id: number
    quantity: number
    unit_price: number
    delivery_fee?: number
    transaction_method: TransactionMethod
    meeting_location?: string
    meeting_time?: string
    buyer_note?: string
    payment_method?: PaymentMethod
    shipping_address?: Record<string, any>
}

export interface UpdateOrderStatusRequest {
    status: OrderStatus
    reason?: string
    data?: Record<string, any>
}

export interface CountRow extends RowDataPacket {
    total:number
}

export interface OrderRow extends RowDataPacket,IOrder {}

export interface DeliveryOrderRequest {
    tracking_company?: string
    tracking_number?: string
    delivered_time?: string
    notes?: string
}

export interface BatchDeliveryRequest {
    order_ids: number[]
    tracking_company?: string
    delivered_time?: string
    notes?: string
}

export interface DeliveryFilters {
    tracking_company?: string
    start_date?: string
    end_date?: string
    buyer_name?: string
    buyer_phone?: string
    keyword?: string
}

export interface DeliveryStatistics {
    shipped_count: number
    delivered_today: number
    pending_delivery: number
    avg_delivery_days: number
}

export interface DeliveryOrderDetail {
    order: IOrder
    delivery_info: {
        status: string
        tracking_company?: string
        tracking_number?: string
        shipped_at?: Date
        delivered_at?: Date
        estimated_delivery: Date | null
    }
}

export const OrderModel = {
    //创建订单
    async createOrder(orderData:Omit<IOrder, 'id'>):Promise<IOrder> {
        const cleaned = Object.entries(orderData).reduce<Record<string, any>>((acc, [k, v]) => {
            acc[k] = v === undefined ? null : v;
            return acc;
        }, {});

        /* 2. 用清洗后的对象生成列、占位符、值 */
        const columns   = Object.keys(cleaned).join(',');
        const placeholders = Object.keys(cleaned).map(() => '?').join(',');
        const values    = Object.values(cleaned);

        const sql = `INSERT INTO orders (${columns}) VALUES (${placeholders})`;
        const [result] = await pool.execute<ResultSetHeader>(sql, values);

        return { id: result.insertId, ...orderData };
    },
    //根据订单id查询订单
    async findOrderById(id:number):Promise<IOrder | null> {
        const sql = 'SELECT * FROM orders WHERE id = ?';
        const [rows] = await pool.query<OrderRow[]>(sql, [id]);
        return rows[0]
    },
    //根据订单号查询订单
    async findOrderByNumber(orderNumber: string):Promise<IOrder | null> {
        const sql = 'SELECT * FROM orders WHERE order_number = ?';
        const [rows] = await pool.query<RowDataPacket[]>(sql, [orderNumber]);
        return (rows[0] as IOrder | undefined) || null;
    },
    //更新订单
    async updateOrder(id:number,updateData:Partial<IOrder>):Promise<boolean> {
        const keys = Object.keys(updateData)
        if(keys.length === 0) return false
        const setClause = keys.map(key => `${key} = ?`).join(',')
        const values = [...Object.values(updateData),id]
        const sql = `UPDATE orders SET ${setClause} WHERE id = ?`;
        const result = await pool.execute(sql, values);
        return (result as any).affectedRows > 0;
    },
    //获取用户订单列表
    async getUserOrders(userId:number,userType:'buyer' | 'seller' | 'admin', options:{
        page?:number
        pageSize?:number
        status?:OrderStatus | 'all'
        startDate?:Date
        endDate?:Date
        keyword?:string
        sortBy?:string
        sortOrder?:string
    } = {}):Promise<{order:IOrder[];page:number;page_size:number;total:number}>{  
        const {page = 1, pageSize = 10, status, startDate, endDate, keyword, sortBy = 'created_at', sortOrder = 'desc'} = options
        const offset = (page - 1) * pageSize
        let whereClause = ''
        const params:any[] = []
        
        if(userType !== 'admin') {
            const field = userType === 'buyer' ? 'buyer_id' : 'seller_id'
            whereClause = `WHERE ${field} = ?`
            params.push(userId)
        }
        
        if(status && status !== 'all'){
            whereClause += (whereClause ? ' AND' : ' WHERE') + ' status = ?'
            params.push(status)
        }
        if(startDate){
            whereClause += (whereClause ? ' AND' : ' WHERE') + ' create_time >= ?'
            params.push(startDate)
        }
        if(endDate){
            whereClause += (whereClause ? ' AND' : ' WHERE') + ' create_time <= ?'
            params.push(endDate)
        }
        if(keyword){
            whereClause += (whereClause ? ' AND' : ' WHERE') + ' (order_number LIKE ? OR book_snapshot LIKE ?)'
            params.push(`%${keyword}%`, `%${keyword}%`)
        }
        const countSql = `SELECT COUNT(*) as total FROM orders ${whereClause}`
        const [countRows] = await pool.query<CountRow[]>(countSql, params)
        const total = countRows[0]?.total || 0
        
        // 构建排序语句
        const validSortFields = ['created_at', 'final_price']
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
        const sortDirection = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc'
        const orderByClause = `ORDER BY ${sortField} ${sortDirection}`
        
        const dataSql = `SELECT * FROM orders ${whereClause} ${orderByClause} LIMIT ? OFFSET ?`
        const dataParams = [...params, pageSize, offset]
        const [orderRows] = await pool.query<OrderRow[]>(dataSql, dataParams)
        return {order:orderRows, page, page_size: pageSize, total}
    },
    //批量更新订单状态
    async updateOrderStatus(orderIds:number[], status:OrderStatus, data:Partial<IOrder>={}):Promise<boolean>{
        if (orderIds.length === 0) return false;

        /* 1.  undefined → null  */
        const cleaned = Object.entries(data).reduce<Record<string, any>>((acc, [k, v]) => {
            acc[k] = v === undefined ? null : v;
            return acc;
        }, {});

        /* 2.  用清洗后的对象生成 SQL */
        const dataKeys   = Object.keys(cleaned);
        const setClause  = ['status = ?', 'updated_at = NOW()', ...dataKeys.map(k => `\`${k}\` = ?`)].join(', ');
        const inClause   = orderIds.map(_ => '?').join(',');
        const sql        = `UPDATE orders SET ${setClause} WHERE id IN (${inClause})`;
        const values     = [status, ...Object.values(cleaned), ...orderIds];

        const [result] = await pool.execute<ResultSetHeader>(sql, values);
        return result.affectedRows > 0;
    },
    //查找需要配送的订单
    async findOrdersForDelivery(filter:{
        tracking_company?:string
        start_date?:Date
        end_date?:Date
        buyer_name?:string
        buyer_phone?:string
    }={},options:{
        page?:number
        pageSize?:number
    }={}):Promise<{orders:IOrder[];total:number}>{
        const {tracking_company,start_date,end_date,buyer_name,buyer_phone} = filter;
        const {page=1,pageSize=20} = options;
        const offset = (page - 1) * pageSize;
        let whereClause = "WHERE status = 'shipped'";
        const params:any[] = [];
        if(tracking_company){
            whereClause += " AND tracking_company = ?";
            params.push(`%${tracking_company}%`);
        }
        if(start_date){
            whereClause += " AND shipped_at >= ?";
            params.push(start_date);
        }
        if(end_date){
            whereClause += " AND shipped_at <= ?";
            params.push(end_date);
        }
        if (buyer_name || buyer_phone) {
            whereClause += ' AND ('
            const conditions = []

            if (buyer_name) {
                conditions.push("JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.receiver_name')) LIKE ?")
                params.push(`%${buyer_name}%`)
            }

            if (buyer_phone) {
                conditions.push("JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.phone')) LIKE ?")
                params.push(`%${buyer_phone}%`)
            }

            whereClause += conditions.join(' OR ') + ')'
        }
        const countSql = `SELECT COUNT(*) as total FROM orders ${whereClause}`;
        const [countResult] = await pool.query<CountRow[]>(countSql, params);
        const total = countResult[0]?.total || 0;
        const orderSql = `
            SELECT
                *,
                JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.receiver_name')) as receiver_name,
                JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.phone')) as receiver_phone,
                JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.address')) as receiver_address
            FROM orders ${whereClause}
            ORDER BY shipped_at ASC
            LIMIT ? OFFSET ?`;
        const orderParams = [...params, pageSize, offset]
        const [rows] = await pool.query<OrderRow[]>(orderSql, orderParams)
        const orders:IOrder[] = rows
        return { orders, total }
    },
    //更新订单为已送达状态
    async updateOrderToDelivered(orderId: number,updateData:{
        delivered_at: Date
        tracking_company?:string
        tracking_number?:string
        notes?:string
    }):Promise<boolean>{
        const sql = `UPDATE orders SET 
                  status = 'delivered',
                  delivered_at = ?,
                  updated_at = NOW(), 
                  tracking_company = COALESCE(?,tracking_company),
                  tracking_number = COALESCE(?,tracking_number)
              WHERE id = ? AND status = 'shipped'`
        const params = [updateData.delivered_at,updateData.tracking_company,updateData.tracking_number,orderId]
        const [result] = await pool.query<ResultSetHeader>(sql,params)
        return result.affectedRows > 0
    },
    //搜索订单
    async searchDeliveryOrders(keyword:string,options:{page?:number,pageSize?:number}):Promise<{orders:IOrder[],total:number}>{
        const {page = 1,pageSize = 10} = options
        const offset = (page - 1) * pageSize
        const sql = `
    SELECT 
      *,
      JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.receiver_name')) as receiver_name,
      JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.phone')) as receiver_phone
    FROM orders 
    WHERE status = 'shipped'
      AND (
        order_number LIKE ? 
        OR tracking_number LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.receiver_name')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.phone')) LIKE ?
      )
    ORDER BY shipped_at ASC
    LIMIT ? OFFSET ?
  `;
        const searchPattern = `%${keyword}%`
        // 查询总数
        const countSql = `
    SELECT COUNT(*) as total 
    FROM orders 
    WHERE status = 'shipped'
      AND (
        order_number LIKE ? 
        OR tracking_number LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.receiver_name')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.phone')) LIKE ?
      )
  `

        const [countResult] = await pool.query<CountRow[]>(countSql, [
            searchPattern, searchPattern, searchPattern, searchPattern
        ])
        const total = countResult[0]?.total || 0

        // 查询数据
        const [rows] = await pool.query<OrderRow[]>(sql, [
            searchPattern, searchPattern, searchPattern, searchPattern,
            pageSize, offset
        ])
        const orders:IOrder[] = rows

        return { orders, total }
    }
}