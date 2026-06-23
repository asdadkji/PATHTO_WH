// 后台路由
import {useAuthStore} from "@/stores/auth.ts";

export default [
  {
    path: 'dashboard',
    name: 'dashboard',
    component: () => import('@/views/Admin/components/dashboard.vue'),
    meta: {
      title: '仪表盘',
      allowedRoles:['admin','maxAdmin']
    },
    beforeEnter: (to:any, from:any, next:any) => {
      const authStore = useAuthStore();
      if (authStore.isAdmin || authStore.isMaxAdmin) {
        next();
        return;
      } else {
        next('/403');
        return
      }
    }
  },
  {
    path: 'users',
    name: 'users',
    component: () => import('@/views/Admin/components/userMgt.vue'), // 路由懒加载
    meta: {
      requireAdmin: true,
      title: '用户管理',
      allowedRoles:['maxAdmin']
    },
    beforeEnter: (to:any, from:any, next:any) => {
      const authStore = useAuthStore();
      if (authStore.isMaxAdmin) {
        next();
        return;
      } else {
        next('/403');
        return
      }
    }
  },

  {
    path: 'transport',
    name: 'transport',
    component: () => import('@/views/Admin/components/transport.vue'), // 路由懒加载
    meta: {
      requireAdmin: true,
      title: '物流管理'
    },
    allowedRoles:['transporter','admin','maxAdmin'],
    beforeEnter: (to:any, from:any, next:any) => {
      const authStore = useAuthStore();
      if (authStore.isTransport || authStore.isAdmin || authStore.isMaxAdmin) {
        next();
        return;
      } else {
        next('/403');
        return
      }
    }
  },

  {
    path: 'sellers',
    name: 'sellers',
    component: () => import('@/views/Admin/components/sellerMgt.vue'), // 路由懒加载
    meta: {
      requireAdmin: true,
      title: '商家管理',
      allowedRoles:['admin','maxAdmin']
    },
    beforeEnter: (to:any, from:any, next:any) => {
      const authStore = useAuthStore();
      if (authStore.isMaxAdmin || authStore.isAdmin) {
        next();
        return;
      } else {
        next('/403');
        return
      }
    }
  },
  {
    path: 'buyers',
    name: 'buyers',
    component: () => import('@/views/Admin/components/buyerMgt.vue'), // 路由懒加载
    meta: {
      requireAdmin: true,
      title: '买家管理',
      allowedRoles:['admin','maxAdmin']
    },
    beforeEnter: (to:any, from:any, next:any) => {
      const authStore = useAuthStore();
      if (authStore.isMaxAdmin || authStore.isAdmin) {
        next();
        return;
      } else {
        next('/403');
        return
      }
    }
  },
  {
    path: 'ordersA',
    name: 'ordersA',
    component: () => import('@/views/Admin/components/orderMgt.vue'), // 路由懒加载
    meta: {
      requireAdmin: true,
      title: '订单管理',
      allowedRoles:['admin','maxAdmin']
    },
    beforeEnter: (to:any, from:any, next:any) => {
      const authStore = useAuthStore();
      if (authStore.isMaxAdmin || authStore.isAdmin) {
        next();
        return;
      } else {
        next('/403');
        return
      }
    }
  },
  {
    path: 'bookReview',
    name: 'bookReview',
    component: () => import('@/views/Admin/components/bookReview.vue'), // 路由懒加载
    meta: {
      requireAdmin: true,
      title: '图书审核',
      allowedRoles:['admin','maxAdmin']
    },
    beforeEnter: (to:any, from:any, next:any) => {
      const authStore = useAuthStore();
      if (authStore.isMaxAdmin || authStore.isAdmin) {
        next();
        return;
      } else {
        next('/403');
        return
      }
    }
  },
  {
    path: 'bookMgt',
    name: 'bookMgt',
    component: () => import('@/views/Admin/components/bookMgt.vue'), // 路由懒加载
    meta: {
      requireAdmin: true,
      title: '图书管理',
      allowedRoles:['admin','maxAdmin']
    },
    beforeEnter: (to:any, from:any, next:any) => {
      const authStore = useAuthStore();
      if (authStore.isMaxAdmin || authStore.isAdmin) {
        next();
        return;
      } else {
        next('/403');
        return
      }
    }
  }
]
