// 主要功能路由（需要认证）
export default [
  //个人中心
  {
    path: 'profile',
    name: 'profile',
    component: () => import('@/views/Profile/profile.vue'),
    meta: {
      title: '个人中心',
      requiresAuth: true
    },
    children: [
      {
        path: 'orders',
        name: 'profile-orders',
        component: () => import('@/views/Profile/components/orders.vue'),
        meta: {
          title: '我的订单',
          requiresAuth: true
        }
      },
      {
        path: 'address',
        name: 'profile-address',
        component: () => import('@/views/Profile/components/address.vue'),
        meta: {
          title: '收货地址',
          requiresAuth: true
        }
      },
      {
        path: 'account',
        name: 'profile-account',
        component: () => import('@/views/Profile/components/userInfo.vue'),
        meta: {
          title: '账户设置',
          requiresAuth: true
        }
      },
      {
        path: 'favorite',
        name: 'profile-favorite',
        component: () => import('@/views/Profile/components/favorite.vue'),
        meta: {
          title: '我的收藏',
          requiresAuth: true
        }
      },
      {
        path: 'coupon',
        name: 'profile-coupon',
        component: () => import('@/views/Profile/components/coupon.vue'),
        meta: {
          title: '我的优惠券',
          requiresAuth: true
        }
      }
    ]
  },
  //购物车
  {
    path: 'cart',
    name: 'cart',
    component: () => import('@/views/Cart/cart.vue'),
    meta: {
      title: '购物车',
      requiresAuth: true
    }
  },
  //订单
  {
    path: 'orders',
    name: 'orders',
    component: () => import('@/views/Orders/orders.vue'),
    meta: {
      title: '订单管理',
      requiresAuth: true
    }
  },
  //结算
  {
    path: 'checkout',
    name: 'checkout',
    component: () => import('@/views/Checkout/checkout.vue'),
    meta: {
      title: '结算',
      requiresAuth: true
    }
  },
  //帮助
  {
    path: 'help',
    name: 'help',
    component: () => import('@/views/Help/help.vue'),
    meta: {
      requireAdmin: true,
      title: '帮助中心'
    }
  },
  //卖家中心
  {
    path: 'seller',
    name: 'seller',
    component: () => import('@/views/Seller/seller.vue'),
    meta: {
      requireSeller: true,
      title: '卖家中心'
    },
    children: [
      {
        path: 'addPro',
        name: 'addPro',
        component: () => import('@/views/Seller/components/addProduct.vue'),
        meta: {
          requireSeller: true,
          title: '添加商品'
        }
      },
      {
        path: 'addCoupon',
        name: 'addCoupon',
        component: () => import('@/views/Seller/components/addCoupon.vue'),
        meta: {
          requireSeller: true,
          title: '添加优惠券'
        }
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/Seller/components/dashboard.vue'),
        meta: {
          requireSeller: true,
          title: '仪表盘'
        }
      },
      {
        path: 'disProduct',
        name: 'disProduct',
        component: () => import('@/views/Seller/components/deleteProduct.vue'),
        meta: {
          requireSeller: true,
          title: '商品管理'
        }
      },
      {
        path: 'orderManagement',
        name: 'orderManagement',
        component: () => import('@/views/Seller/components/orderManagement.vue'),
        meta: {
          requireSeller: true,
          title: '订单管理'
        }
      },
      {
        path: 'bookReviewProcess',
        name: 'bookReviewProcess',
        component: () => import('@/views/Seller/components/bookReviewProcess.vue'),
        meta: {
          requireSeller: true,
          title: '图书审查流程'
        }
      }
    ]
  }
]
