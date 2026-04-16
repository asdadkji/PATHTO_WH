<script setup lang="ts">
import {
  Document,
  Menu as IconMenu,
  Location,
  Setting,
} from '@element-plus/icons-vue'
import {computed} from "vue";
import {useRoute} from "vue-router";
const route = useRoute()
const matched = computed(() => route.matched.filter(r => r.meta && r.meta.title))
</script>

<template>
  <el-container>
    <el-aside width="300px">
      <el-row class="tac" style="width: 300px">
        <el-col :span="12">
          <h5 class="mb-2" style="font-size: 24px; margin-left: 24px">卖家中心</h5>
          <el-menu
            :default-active="$route.path"
            class="el-menu--vertical-demo"
            router
          >
<!--            <el-sub-menu index="1">
              <template #title>
                <el-icon><icon-menu /></el-icon>
                <span>数据面板</span>
              </template>
              <el-menu-item-group title="数据展示">
                <el-menu-item index="/seller/dashboard">数据中心</el-menu-item>
              </el-menu-item-group>
            </el-sub-menu>-->
            <el-sub-menu index="2">
              <template #title>
                <el-icon><icon-menu /></el-icon>
                <span>订单管理</span>
              </template>
              <el-menu-item-group title="常用入口">
                <el-menu-item index="/seller/orderManagement">订单管理</el-menu-item>
<!--                <el-menu-item index="">订单数据统计</el-menu-item>-->
              </el-menu-item-group>
            </el-sub-menu>
            <el-sub-menu index="3">
              <template #title>
                <el-icon><location /></el-icon>
                <span>图书管理</span>
              </template>
              <el-menu-item-group title="图书操作">
                <el-menu-item index="/seller/addPro">添加图书</el-menu-item>
                <el-menu-item index="/seller/disProduct">上架图书管理</el-menu-item>
                <el-menu-item index="/seller/bookReviewProcess">图书审查流程</el-menu-item>
              </el-menu-item-group>
            </el-sub-menu>
            <el-sub-menu index="4">
              <template #title>
                <el-icon><icon-menu /></el-icon>
                <span>店铺促销</span>
              </template>
              <el-menu-item-group title="促销活动">
                <el-menu-item index="/seller/addCoupon">优惠券</el-menu-item>
              </el-menu-item-group>
            </el-sub-menu>
          </el-menu>
        </el-col>
      </el-row>
    </el-aside>
    <el-main>
      <div class="profile__right">
        <div class="list__breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="(item, idx) in matched" :key="item.path" :to="idx === matched.length - 1 ? '' : item.path">
              {{item.meta.title}}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <router-view></router-view>
      </div>
    </el-main>
  </el-container>
</template>

<style scoped lang="scss">
.profile__right {
  display: flex;
  flex-direction: column;
  width: 1000px;
  margin: 0 auto;
  .list__breadcrumb {
    margin-bottom: 16px;
    padding: 4px;
    border-bottom: 1px solid #eee;
  }
}
</style>
