// 线下交易超时处理定时任务
import { OrderModel, OrderStatus, TransactionMethod, CancelType } from '@/models/Order';
import { pool } from '@/database';

/**
 * 处理线下交易超时订单
 * 当线下交易订单超过7天未完成时，自动取消订单
 */
export const handleOfflineTradeTimeout = async (): Promise<void> => {
  try {
    console.log('开始处理线下交易超时订单...');

    // 查找超过7天未完成的线下交易订单
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const sql = `
      SELECT id FROM orders 
      WHERE transaction_method = ? 
      AND status != ? 
      AND created_at < ?
    `;

    const [rows] = await pool.query<any[]>(sql, [
      TransactionMethod.FACE_TO_FACE,
      OrderStatus.COMPLETED,
      sevenDaysAgo
    ]);

    const orderIds = rows.map(row => row.id);

    if (orderIds.length > 0) {
      console.log(`找到 ${orderIds.length} 个超过7天未完成的线下交易订单`);

      // 批量更新这些订单为已取消状态
      const result = await OrderModel.updateOrderStatus(
        orderIds,
        OrderStatus.CANCELLED,
        {
          cancel_reason: '线下交易超时自动取消',
          cancel_type: CancelType.SYSTEM
        }
      );

      if (result) {
        console.log(`成功取消 ${orderIds.length} 个线下交易超时订单`);
      } else {
        console.error('取消线下交易超时订单失败');
      }
    } else {
      console.log('没有找到需要处理的线下交易超时订单');
    }

  } catch (error) {
    console.error('处理线下交易超时订单时发生错误:', error);
  }
};

// 测试函数
if (require.main === module) {
  handleOfflineTradeTimeout();
}
