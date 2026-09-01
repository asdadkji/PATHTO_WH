// 认证模块路由（白名单，挂载在 /auth 下）
import type { RouteRecordRaw } from 'vue-router'

const authRoutes: RouteRecordRaw[] = [
  {
    path: 'login',
    name: 'Login',
    component: () => import('@/views/auth/login.vue'),
    meta: { public: true, title: '登录' },
  },
  {
    path: 'register',
    name: 'Register',
    component: () => import('@/views/auth/register.vue'),
    meta: { public: true, title: '注册' },
  },
]

export default authRoutes
