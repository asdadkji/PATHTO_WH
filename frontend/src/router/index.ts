// 引入router
import { createRouter, createWebHistory } from 'vue-router'
// 引入routes模块
import publicRoutes from "@/router/routes/publicRoutes.ts";
import authRoutes from "@/router/routes/authRoutes.ts";
import mainRoutes from "@/router/routes/mainRoutes.ts";
import adminRoutes from "@/router/routes/adminRoutes.ts";
// 引入路由文件
import AdminLayout from "@/layouts/Admin/AdminLayout.vue";
import AuthLayout from "@/layouts/Auth/AuthLayout.vue";
import UserLayout from "@/layouts/User/UserLayout.vue";
import EmptyLayout from "@/layouts/Empty/EmptyLayout.vue";
import notfound from '@/views/NotFound/notfound.vue'
//引入auth仓库
import { useAuthStore } from '@/stores/auth.ts'


// 路由架构
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // main/public模块
    {
      path: '/',
      component: UserLayout,
      redirect:(to) => {
        console.log('UserLayout redirect - to.path:', to.path)
        // 只在访问根路径时才进行重定向
        if (to.path === '/') {
          const authStore = useAuthStore()
          console.log('UserLayout redirect - redirecting to:', authStore.getRedirectPath())
          return authStore.getRedirectPath() || '/home'
        }
        // 其他情况重定向到首页
        console.log('UserLayout redirect - no redirect')
        return '/home'
      },
      children:[
        {path: '', redirect: '/home'},
        ...publicRoutes,
        ...mainRoutes
      ],
      meta: {
        requiresAuth: true,
      }
    },
    // auth模块
    {
      path: '/auth',
      component: AuthLayout,
      children:[
        ...authRoutes
      ]
    },
    // admin模块
    {
      path: '/admin',
      component: AdminLayout,
      children:[
        ...adminRoutes
      ],
      meta: {
        requireAdmin: true,
        name: '平台管理层'
      }
    },
    // 404模块
    {
      path: '/:pathMatch(.*)*',
      component: EmptyLayout,
      children:[
        {
          path: '',
          name: 'NotFound',
          component: notfound
        }
      ]
    }
  ],

  // 滚动行为
  scrollBehavior(to,from,savedPosition) {
    if(savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return {el:to.hash, behavior: 'smooth'}
    } else {
      return {top:0}
    }
  }
})

//静/动态白名单
const whiteList = ['/auth/login', '/auth/adminLogin', '/auth/register', '/auth/forget', '/home', '/filter']
const dynamicPatterns = [/^\/product\/\d+$/]
//路由前置守卫
router.beforeEach(async (to,from,next) => {
  console.log('router.beforeEach - to.path:', to.path, 'from.path:', from.path)
  //白名单鉴权
  if(whiteList.includes(to.path) || dynamicPatterns.some(pattern => pattern.test(to.path))) {
    console.log('router.beforeEach - 白名单，直接通过')
    next()
    return
  }
  const authStore = useAuthStore()
  console.log('router.beforeEach - authStore.isLogin:', authStore.isLogin)
  
  // 处理登录后的默认跳转逻辑
  if (authStore.isLogin) {
    console.log('router.beforeEach - 用户已登录')

    // 平台管理员权限检查
    if (to.meta.requireAdmin) {
      console.log('router.beforeEach - 需要管理员权限')
      if (authStore.isAdmin || authStore.isMaxAdmin || authStore.isTransport) {
        console.log('router.beforeEach - 管理员权限验证通过')
        next()
      } else {
        console.log('router.beforeEach - 管理员权限验证失败，跳转到403')
        next('/403')
      }
      return
    }

    // 平台商家权限检查
    if (to.meta.requireSeller) {
      console.log('router.beforeEach - 需要商家权限', authStore.isSeller)
      // 等待isSeller计算完成
      const isSellerValue = await authStore.isSeller
      if (isSellerValue) {
        console.log('router.beforeEach - 商家权限验证通过')
        next()
      } else {
        console.log('router.beforeEach - 商家权限验证失败，跳转到认证页面')
        next('/auth/sellerAuth')
      }
      return
    }

    // 普通用户的权限检查
    if (to.meta.requiresAuth) {
      console.log('router.beforeEach - 需要登录权限，已登录，通过')
      // 已登录用户可以访问
      next()
      return
    }

    // 其他情况继续
    console.log('router.beforeEach - 其他情况，继续')
    next()
    return
  }

  // 未登录状态
  console.log('router.beforeEach - 用户未登录')
  // 检查是否需要登录权限
  if (!authStore.isLogin) {
    console.log('router.beforeEach - 跳转到登录页面')
    next({
      path: '/auth/login',
      query: { redirect: to.fullPath }
    })
  } else {
    next()
  }
})
// 路由后置守卫
router.afterEach((to,from) => {
  console.log('router.afterEach - to.path:', to.path)
  document.title = (to.meta.title as string) || '校园闲置图书交易平台'
})

//暴露路由
export default router
