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
//引入auth仓库
import {useAuthStore} from "@/stores/auth.ts";
const authStore = useAuthStore()
</script>

<template>
  <el-container>
    <!--个人中心列表-->
    <el-aside width="300px">
      <el-row class="tac" style="width: 300px">
        <el-col :span="12">
          <!--列表-->
          <el-menu
            :default-active="$route.path"
            class="el-menu--vertical-demo"
            router
            active-text-color="#ffd04b"
            background-color="#545c64"
            text-color="#fff"
            style="height: 830px;width: 200px"
          >
            <el-sub-menu index="1">
              <template #title>
                <el-icon><icon-menu /></el-icon>
                <span>平台数据中心</span>
              </template>
              <el-menu-item-group title="数据面板">
                <el-menu-item index="/admin/dashboard">平台日常数据</el-menu-item>
              </el-menu-item-group>
            </el-sub-menu>
            <el-sub-menu index="2">
              <template #title>
                <el-icon><location /></el-icon>
                <span>用户管理</span>
              </template>
              <el-menu-item-group title="平台用户管理">
                <el-menu-item index="/admin/users">管理层详情</el-menu-item>
                <el-menu-item index="/admin/sellers">商家详情</el-menu-item>
                <el-menu-item index="/admin/buyers">买家详情</el-menu-item>
              </el-menu-item-group>
            </el-sub-menu>
            <el-sub-menu index="3">
              <template #title>
                <el-icon><document /></el-icon>
                <span>图书管理</span>
              </template>
              <el-menu-item-group title="管理">
                <el-menu-item index="/admin/bookMgt">图书管理</el-menu-item>
                <el-menu-item index="/admin/bookReview">图书审核</el-menu-item>
              </el-menu-item-group>
            </el-sub-menu>
            <el-sub-menu index="5">
              <template #title>
                <el-icon><icon-menu /></el-icon>
                <span>运输管理</span>
              </template>
              <el-menu-item-group title="图书运输">
                <el-menu-item index="/admin/transport">运输表</el-menu-item>
              </el-menu-item-group>
            </el-sub-menu>
            <el-sub-menu index="6">
              <template #title>
                <el-icon><document /></el-icon>
                <span>订单管理</span>
              </template>
              <el-menu-item-group title="订单操作">
                <el-menu-item index="/admin/ordersA">订单管理</el-menu-item>
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
  overflow: hidden;
  .list__breadcrumb {
    margin-bottom: 16px;
    padding: 4px;
    border-bottom: 1px solid #eee;
  }
}
</style>
