// 引入路由文件
import home from '@/views/Home/home.vue'
// 公共路由
export default [
  {
    path: 'home',
    name: 'home',
    component: home,
    meta: {
      title: '首页',
    }
  },
  {
    path: 'product/:id',
    name: 'product',
    component: () => import('@/views/Product/product.vue'),
    meta: {
      title: '商品详情'
    }
  },
  {
    path: 'filter',
    name: 'filter',
    component: () => import('@/views/Filter/filter.vue'),
    meta: {
      title: '筛选'
    }
  }
]
