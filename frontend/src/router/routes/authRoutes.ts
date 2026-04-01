// 登录/注册路由
export default [
  {
    path: 'login',
    name: 'login',
    component: () => import('@/views/Auth/login.vue'),
    meta: {
      title: '登录',
    }
  },
  {
    path: 'adminLogin',
    name: 'adminLogin',
    component: () => import('@/views/Auth/adminLogin.vue'),
    meta: {
      title: '管理员登录',
    }
  },
  {
    path: 'register',
    name: 'register',
    component: () => import('@/views/Auth/register.vue'),
    meta: {
      title: '注册',
    }
  },
  {
    path: 'forget',
    name: 'forget',
    component: () => import('@/views/Auth/forget.vue'),
    meta: {
      title: '忘记密码',
    }
  },
  {
    path: 'sellerAuth',
    name: 'sellerAuth',
    component: () => import('@/views/Auth/seller.vue'),
    meta: {
      title: '卖家认证',
    }
  }
]
