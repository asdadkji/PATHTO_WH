// ============================================================
// 路由表 + 守卫：白名单放行；未登录跳 /auth/login(带 redirect)；
// requireAdmin 校验失败跳 /403；afterEach 设置文档标题。
// ============================================================
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import authRoutes from './routes/authRoutes'
import appRoutes from './routes/appRoutes'
import adminRoutes from './routes/adminRoutes'
import publicRoutes from './routes/publicRoutes'

const routes: RouteRecordRaw[] = [
  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    redirect: '/auth/login',
    children: authRoutes,
  },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: appRoutes,
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/admin/dashboard',
    meta: { requiresAuth: true, requireAdmin: true },
    children: adminRoutes,
  },
  // publicRoutes 含 403 与 404 兜底，需放在最后
  ...publicRoutes,
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// 前置守卫：权限校验
router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  // 已登录用户访问登录页，自动跳到对应首页
  if (to.path === '/auth/login' && auth.isLogin) {
    return next(auth.getRedirectPath)
  }

  // 白名单 / 公开页面：直接放行
  if (to.meta.public) {
    return next()
  }

  // 需要登录但未登录：跳登录并带 redirect
  if (to.meta.requiresAuth && !auth.isLogin) {
    return next({ path: '/auth/login', query: { redirect: to.fullPath } })
  }

  // 需要管理员权限但非管理员：跳 403
  if (to.meta.requireAdmin && !auth.isAdmin) {
    return next({ path: '/403' })
  }

  next()
})

// 后置钩子：设置文档标题
router.afterEach((to) => {
  document.title = to.meta.title || '儿童任务积分兑换系统'
})

export default router
