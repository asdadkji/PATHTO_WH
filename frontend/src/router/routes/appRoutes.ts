// 应用前台路由（挂载在 / 下，requiresAuth）
import type { RouteRecordRaw } from 'vue-router'

const appRoutes: RouteRecordRaw[] = [
  {
    path: 'dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/index.vue'),
    meta: { title: '首页' },
  },
  {
    path: 'task',
    name: 'Task',
    component: () => import('@/views/task/index.vue'),
    meta: { title: '我的任务' },
  },
  {
    path: 'time',
    name: 'Time',
    component: () => import('@/views/time/index.vue'),
    meta: { title: '时间管理' },
  },
  {
    path: 'shop',
    name: 'Shop',
    component: () => import('@/views/shop/index.vue'),
    meta: { title: '积分商城', requiresAuth: true },
  },
  {
    path: 'cart',
    name: 'Cart',
    component: () => import('@/views/cart/index.vue'),
    meta: { title: '购物车', requiresAuth: true },
  },
  {
    path: 'exchange',
    name: 'Exchange',
    component: () => import('@/views/exchange/index.vue'),
    meta: { title: '兑换记录', requiresAuth: true },
  },
  {
    path: 'admin/redemption',
    name: 'AdminRedemption',
    component: () => import('@/views/admin/redemption.vue'),
    meta: { title: '兑换审核', requiresAuth: true, requireAdmin: true },
  },
  {
    path: 'profile',
    name: 'Profile',
    component: () => import('@/views/user/profile.vue'),
    meta: { title: '我的' },
  },
]

export default appRoutes
