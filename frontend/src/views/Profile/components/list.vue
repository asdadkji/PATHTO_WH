<script setup lang="ts">
import {
  Document,
  Menu as IconMenu,
  Location,
  Setting,
} from '@element-plus/icons-vue'
import {computed} from "vue";
//引入路由
import {useRoute} from "vue-router";
const route = useRoute()
//面包屑
const matched = computed(() => route.matched.filter(r => r.meta && r.meta.title))
</script>

<template>
  <el-container>
    <!--个人中心列表-->
    <el-aside width="300px">
      <el-row class="tac" style="width: 300px">
        <el-col :span="12">
          <!--标题-->
          <h5 class="mb-2" style="font-size: 24px; margin-left: 24px">个人中心</h5>
          <!--列表-->
          <el-menu
            :default-active="$route.path"
            class="el-menu--vertical-demo"
            router
          >
            <el-sub-menu index="1">
              <template #title>
                <el-icon><icon-menu /></el-icon>
                <span>我是买家</span>
              </template>
              <el-menu-item-group title="常用入口">
                <el-menu-item index="/cart">我的购物车</el-menu-item>
                <el-menu-item index="/profile/orders">我的订单</el-menu-item>
                <el-menu-item index="/profile/favorite">我的收藏</el-menu-item>
                <el-menu-item index="/profile/address">我的收货地址</el-menu-item>
              </el-menu-item-group>
            </el-sub-menu>
            <el-sub-menu index="2">
              <template #title>
                <el-icon><location /></el-icon>
                <span>账号安全</span>
              </template>
              <el-menu-item-group title="账户管理">
                <el-menu-item index="/profile/account">个人资料</el-menu-item>
                <el-menu-item index="/profile/coupon">我的优惠券</el-menu-item>
              </el-menu-item-group>
            </el-sub-menu>
          </el-menu>
        </el-col>
      </el-row>
    </el-aside>
    <el-main>
      <div class="profile__right">
        <div class="list__breadcrumb">
          <!--面包屑-->
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="(item, idx) in matched" :key="item.path" :to="idx === matched.length - 1 ? '' : item.path">
              {{item.meta.title}}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <!--路由展示-->
        <router-view></router-view>
      </div>
    </el-main>
  </el-container>
</template>

<style scoped lang="scss">
.profile__right {
  display: flex;
  flex-direction: column;
  .list__breadcrumb {
    margin-bottom: 16px;
    padding: 4px;
    border-bottom: 1px solid #eee;
  }
}
</style>
