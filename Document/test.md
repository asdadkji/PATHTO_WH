1. 用户模块
接口	方法	测试点	成功返回 (data)	失败返回 (error)
/auth/login	POST	正确用户名密码	{ token, userInfo }	{ code:1001, message:'密码错误' }
用户不存在	-	{ code:1002, message:'用户不存在' }
参数缺失	-	{ code:400, message:'参数错误' }
/auth/register	POST	注册成功	{ userId, username }	{ code:1003, message:'用户名已存在' }
密码过短	-	{ code:400, message:'密码至少6位' }
/user/profile	GET	token有效	{ userId, username, totalPoints, role }	{ code:401, message:'未授权' }
token过期	-	{ code:401, message:'token已过期' }
2. 任务模块
接口	方法	测试点	成功返回 (data)	失败返回 (error)
/task/today	GET	查询今日任务	[{ taskId, title, points, status }]	{ code:401, message:'未登录' }
/task	POST	创建成功	{ taskId, title, points, status:'pending' }	{ code:400, message:'标题不能为空' }
积分为负数	-	{ code:400, message:'积分必须>0' }
/task/{id}/complete	PUT	打卡成功	{ taskId, status:'completed', pointsEarned:20 }	{ code:409, message:'今日已打卡' }
任务不存在	-	{ code:404, message:'任务不存在' }
无权操作	-	{ code:403, message:'无权操作此任务' }
/task/{id}	DELETE	删除成功	{ success: true }	{ code:400, message:'已完成任务不能删除' }
/task/stats/weekly	GET	查询周统计	{ totalCompleted, totalPoints, dailyData: [...] }	{ code:401, message:'未登录' }
3. 时间模块
接口	方法	测试点	成功返回 (data)	失败返回 (error)
/timer/start	POST	开始计时	{ sessionId, activityType, startedAt }	{ code:409, message:'已有进行中的计时' }
活动类型无效	-	{ code:400, message:'活动类型无效' }
/timer/stop	PUT	结束计时	{ sessionId, durationMinutes: 25 }	{ code:404, message:'会话不存在' }
会话已结束	-	{ code:400, message:'已结束' }
/timer/manual	POST	手动输入	{ recordId, durationMinutes }	{ code:400, message:'时长不能为0' }
/time/target-status	GET	检测达标	{ homeworkReached: true, gameReached: false }	{ code:401, message:'未登录' }
/time/summary/today	GET	今日汇总	{ homeworkMinutes: 60, gameMinutes: 25 }	{ code:401, message:'未登录' }
4. 商品模块
接口	方法	测试点	成功返回 (data)	失败返回 (error)
/product/list	GET	查询所有	[{ productId, name, price, stock, category }]	{ code:401, message:'未登录' }
按分类过滤	[{ ... }]	{ code:400, message:'分类无效' }
/product/{id}	GET	商品详情	{ productId, name, price, description, stock }	{ code:404, message:'商品不存在' }
/cart	GET	查询购物车	{ items: [{ productId, name, price, quantity }] }	{ code:401, message:'未登录' }
/cart/add	POST	加入购物车	{ success: true, cartItemId: 'xxx' }	{ code:400, message:'库存不足' }
商品已下架	-	{ code:400, message:'商品已下架' }
/cart/update	PUT	修改数量	{ success: true, quantity: 3 }	{ code:400, message:'数量必须>0' }
/cart/remove	DELETE	移除商品	{ success: true }	{ code:404, message:'商品不在购物车中' }
5. 兑换模块
接口	方法	测试点	成功返回 (data)	失败返回 (error)
/redemption/submit	POST	兑换成功	{ redemptionId, status:'pending', pointsUsed:200 }	{ code:400, message:'积分不足' }
库存不足	-	{ code:400, message:'库存不足' }
商品下架	-	{ code:400, message:'商品不可兑换' }
/redemption/list	GET	兑换记录	[{ redemptionId, productName, status, pointsUsed }]	{ code:401, message:'未登录' }
按状态过滤	[{ ... }]	-
/redemption/{id}/cancel	PUT	取消成功	{ success: true, refundPoints: 200 }	{ code:400, message:'不可取消' }
订单不存在	-	{ code:404, message:'订单不存在' }
/admin/redemption/list	GET	管理员查询	[{ redemptionId, userName, productName, status }]	{ code:403, message:'无权限' }
/admin/redemption/{id}/approve	PUT	批准通过	{ success: true, status:'approved' }	{ code:400, message:'库存不足' }
/admin/redemption/{id}/reject	PUT	拒绝并填写原因	{ success: true, status:'rejected' }	{ code:403, message:'无权限' }
6. 用户中心模块
接口	方法	测试点	成功返回 (data)	失败返回 (error)
/dashboard/overview	GET	今日概览	{ totalPoints, todayTasks, completed, homeworkMinutes, gameMinutes }	{ code:401, message:'未登录' }
/dashboard/weekly	GET	本周趋势	{ labels: ['周一',...], data: [45,30,60,...] }	{ code:401, message:'未登录' }
/dashboard/monthly	GET	月度报告	{ totalTasks, completionRate, totalPoints, homeWorkMinutes }	{ code:401, message:'未登录' }
/points/logs	GET	积分明细	{ list: [{ change, description, createdAt }], total: 50 }	{ code:401, message:'未登录' }
分页参数	分页数据正常返回	{ code:400, message:'页码必须>0' }
/points/ranking	GET	排行榜	[{ rank, username, totalPoints }]	{ code:401, message:'未登录' }
/notification/list	GET	通知列表	[{ id, title, content, isRead, createdAt }]	{ code:401, message:'未登录' }
/notification/unread-count	GET	未读数量	{ count: 3 }	{ code:401, message:'未登录' }
/notification/{id}/read	PUT	标记已读	{ success: true }	{ code:404, message:'通知不存在' }
/notification/read-all	PUT	全部已读	{ success: true }	{ code:401, message:'未登录' }