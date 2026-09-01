// 管理后台路由（挂载在 /admin 下，requiresAuth + requireAdmin）
import type { RouteRecordRaw } from 'vue-router'

const adminRoutes: RouteRecordRaw[] = [
  {
    path: 'dashboard',
    name: 'AdminDashboard',
    component: () => import('@/views/common/placeholder.vue'),
    meta: { title: '管理概览' },
  },
  {
    path: 'users',
    name: 'AdminUsers',
    component: () => import('@/views/common/placeholder.vue'),
    meta: { title: '用户管理' },
  },
]

export default adminRoutes
