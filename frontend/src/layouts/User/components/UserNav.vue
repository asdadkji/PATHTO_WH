<script setup lang="ts">
import {computed, ref} from 'vue'
//引入auth仓库
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
//引入路由
import router from "@/router";
import {useRoute} from "vue-router";
const route = useRoute()
//ts
interface NavItem {
  text: string
  to?: string
  dropdown?: 'button' | 'list'
  theme?: 'primary' | 'danger'
  dropOpts?: {
    beforeLogin?: any[]
    afterLogin?: {text: string, to?: string, action?: 'logout'}[]
    list?: {text: string, to: string}[]
    button?: {text: string, to: string; theme?: string}[]
  }
  text2?:string
}
//导航
const navTopList:NavItem[] = [
  {
    text: '登录/注册',
    dropdown: 'button',
    dropOpts: {
      beforeLogin: [
        {text: '登录', to: '/auth/login',theme: 'default'},
        {text: '免费注册', to: '/auth/register',theme: 'default'}
      ],
      afterLogin: [
        {text: '账号管理', to: '/profile'},
        {text: '退出登录', action: 'logout'}
      ]
    },
    text2: '用户上线'
  },
  {text: '购物车', to: '/cart',text2:'购物车'},
  {text: '我的订单', to: '/profile/orders',text2:'我的订单'},
  {
    text: '个人中心',
    to: '/profile',
    dropdown: 'list',
    dropOpts: {
      list: [
        {text:'我的订单', to: '/profile/orders'},
        {text:'我的收藏', to: '/profile/favorite'},
      ]
    },
    text2: '个人中心',
  },
  {text: '卖家中心', to: '/seller',text2:"卖家中心"},
  {
    text: '客服',
    dropdown: 'button',
    dropOpts: {
      button: [
        {text: '帮助中心', to: '/help'},
        {text: '在线客服', to: '/user/help'},
      ]
    },
    text2:'客服'
  },
]
let timer:number | null = null
const openDropdown = ref('')
//鼠标悬浮交互事件
const enter = (item:NavItem) => {
  openDropdown.value = item.text
}
const leave = () => {
  timer = window.setTimeout(() => {openDropdown.value = ''}, 100)
}
//退出登录
const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
// 卖家特殊化
const goToSellerCenter = () => {
  if (!authStore.isLogin) {
    // 未登录，跳转到登录页
    router.push('/auth/login')
    return
  }
  // 判断用户角色（假设 authStore 中有 userRole 字段）
  if (authStore.isSeller) {
    // 卖家直接进入卖家中心
    router.push('/seller')
  } else {
    // 普通用户进入认证页面
    router.push('/auth/sellerAuth')
  }
}
const isHomePage = computed(() => {
  return route.name === 'home' || route.path === '/'
})

</script>

<template>
  <nav class="nav-top">
    <div class="nav-top__container">
      <!--标语-->
      <div class="nav-top__slogan" v-if="isHomePage">
        <span>网罗天下图书 传承中华文明</span>
      </div>
      <div v-else class="nav-top__slogan">
        <router-link to="/" class="back-home-btn">
          <el-icon><ArrowLeft /></el-icon>
          返回首页
        </router-link>
      </div>
      <!--导航-->
      <ul class="nav-top__menu">
        <li
          v-for="item in navTopList"
          :key="item.text"
          class="nav-item-wrap"
          :style="{cursor: item.dropdown ? 'default' : 'pointer'}"
          @mouseenter="enter(item)"
          @mouseleave="leave"
        >
          <!--卖家特殊处理-->
          <template v-if="item.text === '卖家中心'">
            <a
              href="javascript:;"
              class="nav-top__item nav-top--hover"
              @click="goToSellerCenter"
            >
              {{ item.text }}
            </a>
          </template>

          <!--其他菜单项的处理-->
          <template v-else>
            <!--主文字-->
            <router-link
              v-if="item.to"
              :to="item.to"
              class="nav-top__item nav-top--hover"
            >
              {{ item.text }}
            </router-link>
            <span v-if="!item.to" class="nav-top--hover nav-top--dispointer">{{ item.text2 }}</span>
          </template>

          <!--下拉面板（所有菜单项共用）-->
          <div class="nav-top__item__dropdown" v-if="item.dropdown && openDropdown === item.text">
            <!--登录前-竖排-->
            <template v-if="item.dropOpts?.beforeLogin && !authStore.isLogin">
              <el-button
                v-for="btn in item.dropOpts.beforeLogin"
                :key="btn.text"
                :type="btn.theme || 'primary'"
                style="width: 100%; margin-bottom: 16px"
                plain
              >
                <router-link :to="btn.to">{{btn.text}}</router-link>
              </el-button>
            </template>
            <!--登录后-横排-->
            <ul v-else-if="item.dropOpts?.afterLogin && authStore.isLogin" class="dropdown-hlist">
              <li v-for="l in item.dropOpts.afterLogin" :key="l.text">
                <router-link v-if="l.to" :to="l.to">{{ l.text }}</router-link>
                <a v-else-if="l.action === 'logout'" @click="handleLogout" href="javascript:;">{{l.text}}</a>
              </li>
            </ul>
            <!--普通列表-->
            <ul v-else-if="item.dropdown === 'list'" class="dropdown-list">
              <li v-for="l in item.dropOpts?.list" :key="l.text">
                <router-link :to="l.to">{{ l.text }}</router-link>
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped lang="scss">
//nav容器
.nav-top {
  background-color: crimson;
  height: 36px;
  width: 100%;
}
//导航区
.nav-top__container {
  width: 1200px;
  margin: 0 auto;
  @include flex-row-sb;
  //导航区-左侧
  .nav-top__slogan {
    color: #fffbfb;
  }
  //导航区-右侧
  .nav-top__menu {
    @include flex-row-sb;
    //导航快捷选项
    .nav-top__item {
      color: #e4dfdf;
      padding: 8px;
    }
  }
}
//悬浮状态
.nav-top--hover {
  &:hover {
    color: #fff;
    background-color: #FF4B60;
    cursor: pointer;
    text-decoration: underline;
  }
}
//无pointer特殊状态补充
.nav-top--dispointer {
  color: #e4dfdf;
  padding: 8px;
  &:hover {
    cursor: default;
  }
}
// 登录后横排样式
.dropdown-hlist {

}
//悬浮框前置条件
.nav-item-wrap {
  position: relative;
  padding: 8px 0;
  font-size: 14px
}
//悬浮框
.nav-top__item__dropdown {
  position: absolute;
  top: 98%;
  left: 0;
  width: 100px;
  background-color: #fbf7f7;
  border: 1px solid #ccc;
  z-index: 999;
  padding: 16px 8px;
  @include flex-center;
  flex-direction: column;
}
//普通列表
.dropdown-list {
  margin: 0;
  padding: 0;
  li {
    width: 100%;
    padding: 6px 12px;
    &:hover {
      background: #d3d3d3;
      color: #FF4B60;
    }
  }
}

.back-home-btn {
  color: #666;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  transition: color 0.3s;
}

.back-home-btn:hover {
  color: #409EFF;
}

.back-home-btn .el-icon {
  font-size: 16px;
}
</style>
<!--还有登录状态以及登录后样式尚未完成，布局有少许问题-->
