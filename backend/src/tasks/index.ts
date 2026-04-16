// 定时任务管理器
import { schedule } from 'node-cron';
import { handleOfflineTradeTimeout } from './offlineTradeTimeout';

/**
 * 启动所有定时任务
 */
export const startTasks = (): void => {
  console.log('启动定时任务...');

  // 每天凌晨1点执行线下交易超时处理
  // 表达式: 0 1 * * * （分钟 小时 日 月 星期）
  const offlineTradeTimeoutTask = schedule('0 1 * * *', async () => {
    await handleOfflineTradeTimeout();
  });

  console.log('定时任务已启动:');
  console.log('- 线下交易超时处理: 每天凌晨1点');

  // 测试任务（可选）
  // 每5分钟执行一次，用于测试
  // const testTask = schedule('*/5 * * * *', async () => {
  //   console.log('执行测试任务...');
  //   await handleOfflineTradeTimeout();
  // });
};

// 停止所有定时任务
export const stopTasks = (): void => {
  console.log('停止定时任务...');
  // 这里可以添加停止任务的逻辑
};
