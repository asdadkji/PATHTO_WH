// 管理后台路由（挂载在 /admin 下，requiresAuth + requireAdmin）
import type { RouteRecordRaw } from 'vue-router'

const adminRoutes: RouteRecordRaw[] = [
  {
    path: 'dashboard',
    name: 'AdminDashboard',
    component: () => import('@/views/admin/dashboard.vue'),
    meta: { title: '管理概览' },
  },
  {
    path: 'users',
    name: 'AdminUsers',
    component: () => import('@/views/common/placeholder.vue'),
    meta: { title: '用户管理' },
  },
  {
    path: 'task-templates',
    name: 'AdminTaskTemplates',
    component: () => import('@/views/admin/taskTemplates.vue'),
    meta: { title: '任务模板管理' },
  },
  {
    path: 'products',
    name: 'AdminProducts',
    component: () => import('@/views/admin/products.vue'),
    meta: { title: '商品管理' },
  },
  {
    path: 'redemption',
    name: 'AdminRedemption',
    component: () => import('@/views/admin/redemption.vue'),
    meta: { title: '兑换审核' },
  },
]

export default adminRoutes
