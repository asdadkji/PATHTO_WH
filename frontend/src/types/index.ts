// ============================================================
// 全局类型定义：儿童任务积分兑换系统
// 统一接口数据结构，便于在 views / apis / stores 间共享
// ============================================================

/** 用户角色：儿童 / 管理员(家长) */
export type UserRole = 'child' | 'admin'

/** 用户状态（仅作参考，模块1暂不直接使用） */
export type UserStatus = 'active' | 'inactive' | 'suspended'

/**
 * 登录后返回的精简用户信息（同时用于 store 缓存）
 * 与接口 POST /api/auth/login 的 userInfo 对齐
 */
export interface UserInfo {
  userId: string
  username: string
  avatar: string
  totalPoints: number
  role: UserRole
}

/** 登录入参 */
export interface LoginParams {
  username: string
  password: string
}

/** 登录响应 data */
export interface LoginResp {
  token: string
  userInfo: UserInfo
}

/** 注册入参 */
export interface RegisterParams {
  username: string
  password: string
}

/** 注册响应 data */
export interface RegisterResp {
  userId: string
  username: string
}

/**
 * 用户资料（GET /api/user/profile）
 * 比登录返回的 UserInfo 多出目标分钟数与每日提醒开关
 */
export interface UserProfile {
  userId: string
  username: string
  avatar: string
  totalPoints: number
  role: UserRole
  /** 每日作业目标（分钟） */
  homeworkTargetMinutes: number
  /** 每日游戏目标（分钟） */
  gameTargetMinutes: number
  /** 每日任务提醒开关 */
  dailyTaskReminder: boolean
}

/** 仪表盘今日概览（GET /api/dashboard/overview） */
export interface DashboardOverview {
  totalPoints: number
  todayTasks: number
  completed: number
  homeworkMinutes: number
  gameMinutes: number
}

/** 仪表盘本周趋势（GET /api/dashboard/weekly） */
export interface DashboardWeekly {
  /** x 轴标签（日期） */
  labels: string[]
  /** 每日积分 */
  data: number[]
}

/** 仪表盘月度报告（GET /api/dashboard/monthly） */
export interface DashboardMonthly {
  totalTasks: number
  completionRate: number
  totalPoints: number
  homeWorkMinutes: number
}

// ============================================================
// 任务模块类型（模块2：任务打卡 / 周统计 / 创建 / 完成 / 删除）
// ============================================================

/** 任务状态：待完成 / 已完成 / 已取消 / 已过期 */
export type TaskStatus = 'pending' | 'completed' | 'cancelled' | 'expired'

/** 任务（GET /api/task/today 列表项 / 单条） */
export interface Task {
  taskId: string
  title: string
  points: number
  status: TaskStatus
  /** 任务说明（可选） */
  description?: string
  /** 任务所属日期（可选，yyyy-mm-dd） */
  date?: string
  /** 完成时间（可选） */
  completedAt?: string
}

/** 周统计每日数据项 */
export interface TaskDailyStat {
  date: string
  completed: number
  points: number
}

/** 任务周统计（GET /api/task/stats/weekly） */
export interface TaskWeeklyStats {
  totalCompleted: number
  totalPoints: number
  dailyData: TaskDailyStat[]
}

/** 创建任务入参（POST /api/task body） */
export interface CreateTaskPayload {
  title: string
  points: number
  description?: string
}

/** 创建任务响应 data */
export interface CreateTaskResult {
  taskId: string
  title: string
  points: number
  status: TaskStatus
}

/** 完成任务响应 data（PUT /api/task/:id/complete） */
export interface CompleteTaskResult {
  taskId: string
  status: TaskStatus
  pointsEarned: number
}

/** 删除任务响应 data */
export interface DeleteTaskResult {
  success: boolean
}

// ============================================================
// 时间模块类型（模块3：计时 start/stop、手动录入 manual、
// 今日达标状态 target-status、今日时长汇总 summary/today）
// ============================================================

/** 活动类型：作业 / 游戏 / 阅读 / 运动 / 其他 */
export type ActivityType = 'homework' | 'game' | 'reading' | 'exercise' | 'other'

/** 进行中的计时会话（POST /api/timer/start 返回） */
export interface TimerSession {
  sessionId: string
  activityType: ActivityType
  /** 开始时间（ISO 字符串或时间戳，前端按 new Date 解析） */
  startedAt: string
}

/** 停止计时响应 data（PUT /api/timer/stop） */
export interface TimerStopResult {
  sessionId: string
  /** 本次累计时长（分钟） */
  durationMinutes: number
}

/** 手动录入时长响应 data（POST /api/timer/manual） */
export interface TimeRecord {
  recordId: string
  /** 本次录入时长（分钟） */
  durationMinutes: number
}

/** 手动录入入参 */
export interface ManualRecordPayload {
  activityType: ActivityType
  durationMinutes: number
}

/** 今日达标状态（GET /api/time/target-status） */
export interface TargetStatus {
  /** 作业是否达标 */
  homeworkReached: boolean
  /** 游戏是否达标 */
  gameReached: boolean
}

/** 今日时长汇总（GET /api/time/summary/today） */
export interface TodaySummary {
  /** 今日作业累计分钟 */
  homeworkMinutes: number
  /** 今日游戏累计分钟 */
  gameMinutes: number
}

// ============================================================
// 商城模块类型（模块4：商品列表/详情、购物车增改删查）
// 注：price 字段对应数据库 price_points（积分价格），前端统一以"积分"展示；
// 购物车单项含 cartItemId（改/删接口依赖该 id），列表接口约定一并返回。
// ============================================================

/** 商品分类：玩具 / 游戏时间 / 活动 / 食物 / 书籍 / 其他 */
export type ProductCategory = 'toy' | 'game_time' | 'activity' | 'food' | 'book' | 'other'

/** 商品列表项（GET /api/product/list 返回数组元素） */
export interface Product {
  productId: string
  name: string
  /** 积分价格（对应数据库 price_points） */
  price: number
  /** 库存：0 表示暂无库存，-1 表示库存充足（不限） */
  stock: number
  category: ProductCategory
}

/** 商品详情（GET /api/product/:id，比列表多 description） */
export interface ProductDetail {
  productId: string
  name: string
  price: number
  /** 商品描述（可选） */
  description?: string
  /** 库存：0 表示暂无库存，-1 表示库存充足（不限） */
  stock: number
  /** 分类（详情接口可选返回） */
  category?: ProductCategory
}

/** 购物车单项（GET /api/cart 返回 items 数组元素） */
export interface CartItem {
  /** 购物车项 id（改/删接口依赖） */
  cartItemId: string
  productId: string
  name: string
  price: number
  quantity: number
}

/** 购物车数据（GET /api/cart） */
export interface CartData {
  items: CartItem[]
}

/** 加入购物车入参（POST /api/cart/add） */
export interface AddCartPayload {
  productId: string
  quantity: number
}

/** 加入购物车响应 data */
export interface AddCartResult {
  success: boolean
  cartItemId: string
}

/** 更新购物车数量入参（PUT /api/cart/update） */
export interface UpdateCartPayload {
  cartItemId: string
  quantity: number
}

/** 更新购物车数量响应 data */
export interface UpdateCartResult {
  success: boolean
  quantity: number
}

/** 移除购物车项响应 data */
export interface RemoveCartResult {
  success: boolean
}

// ============================================================
// 兑换模块类型（模块5：兑换提交/列表/取消，管理员审核批准/拒绝）
// 注：pointsUsed 对应数据库 total_points_used（本次兑换累计消耗的积分）；
// status 取值 pending 待审核 / approved 已批准 / rejected 已拒绝 /
// completed 已完成 / cancelled 已取消。
// ============================================================

/** 兑换状态：待审核 / 已批准 / 已拒绝 / 已完成 / 已取消 */
export type RedemptionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled'

/**
 * 用户端兑换记录列表项（GET /api/redemption/list 返回数组元素）
 * 不含 userName（用户只能看自己的记录）
 */
export interface RedemptionListItem {
  redemptionId: string
  /** 商品名称 */
  productName: string
  status: RedemptionStatus
  /** 消耗积分（对应数据库 total_points_used） */
  pointsUsed: number
}

/**
 * 管理端兑换列表项（GET /api/admin/redemption/list 返回数组元素）
 * 比用户端多出 userName（申请人用户名），便于管理员审核
 */
export interface AdminRedemptionListItem extends RedemptionListItem {
  userName: string
}

/** 兑换记录（通用结构，兼容用户端与管理端字段） */
export interface Redemption {
  redemptionId: string
  productName: string
  status: RedemptionStatus
  pointsUsed: number
  /** 申请人用户名（管理端返回，用户端可为空） */
  userName?: string
}

/** 兑换提交入参（POST /api/redemption/submit body） */
export interface SubmitRedemptionPayload {
  productId: string
  quantity: number
}

/** 兑换提交响应 data（POST /api/redemption/submit） */
export interface SubmitResult {
  redemptionId: string
  status: RedemptionStatus
  pointsUsed: number
}

/** 取消兑换响应 data（PUT /api/redemption/:id/cancel） */
export interface CancelResult {
  success: boolean
  /** 退还的积分 */
  refundPoints: number
}

/** 管理员批准兑换响应 data（PUT /api/admin/redemption/:id/approve） */
export interface ApproveRedemptionResult {
  success: boolean
  status: RedemptionStatus
}

/** 管理员拒绝兑换入参（PUT /api/admin/redemption/:id/reject body） */
export interface RejectRedemptionPayload {
  rejectReason: string
}

/** 管理员拒绝兑换响应 data（PUT /api/admin/redemption/:id/reject） */
export interface RejectRedemptionResult {
  success: boolean
  status: RedemptionStatus
}

// ============================================================
// vue-router 路由 meta 类型扩充
// ============================================================
declare module 'vue-router' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface RouteMeta {
    /** 浏览器标题 */
    title?: string
    /** 是否需要登录 */
    requiresAuth?: boolean
    /** 是否需要管理员权限 */
    requireAdmin?: boolean
    /** 公开页面（白名单，登录态也可访问） */
    public?: boolean
  }
}
