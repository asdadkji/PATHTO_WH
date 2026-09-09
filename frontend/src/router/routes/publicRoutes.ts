// 公开路由（错误页等，无布局包裹；含 404 兜底，需放在路由表最后）
import type { RouteRecordRaw } from 'vue-router'

const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { public: true, title: '无权限' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { public: true, title: '页面不存在' },
  },
]

export default publicRoutes
