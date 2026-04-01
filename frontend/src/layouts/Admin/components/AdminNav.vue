<script setup lang="ts">
import {useAuthStore} from "@/stores/auth.ts";
const authStore = useAuthStore()
</script>

<template>
  <div class="admin__nav">
    <p style="font-size: 20px;font-weight: bold">校园闲置图书交易平台后台管理中心</p>
    <div class="nav__title">
      <p>
        <span style="font-size: 18px;font-family: 'Ma Shan Zheng', 'ZCOOL XiaoWei', cursive, sans-serif">
          <span style="color: #c86b75;font-weight: bolder;font-size: 20px">Hello</span> {{authStore.user?.username ?? '管理员'}}
        </span>
        <span style="font-size: 10px;color: #bfbbbb">祝你有美好的一天</span>
      </p>
      <el-dropdown>
        <img>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin__nav {
  display: flex;
  align-items: center;
  padding: 4px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  .nav__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-left: 60px;
    p {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
    }
  }
}
</style>
