<script setup lang="ts">
// 管理后台框架：左侧菜单 + 顶栏 + 内容区
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, HomeFilled, User } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const menus = [
  { path: '/admin/dashboard', label: '管理概览', icon: HomeFilled },
  { path: '/admin/users', label: '用户管理', icon: User },
]

const activeMenu = computed(() => route.path)

function goHome() {
  router.push('/dashboard')
}
</script>

<template>
  <el-container class="admin-layout">
    <el-aside width="220px" class="admin-aside">
      <div class="aside-logo">管理后台</div>
      <el-menu :default-active="activeMenu" router>
        <el-menu-item v-for="m in menus" :key="m.path" :index="m.path">
          <el-icon><component :is="m.icon" /></el-icon>
          <span>{{ m.label }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="admin-header">
        <el-button text :icon="ArrowLeft" @click="goHome">返回前台</el-button>
      </el-header>
      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
.admin-layout {
  min-height: 100vh;
}
.admin-aside {
  background: #2c3e50;
  color: #fff;
  overflow-x: hidden;

  .aside-logo {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    background: #1f2d3d;
  }
  :deep(.el-menu) {
    background: transparent;
    border-right: none;
  }
  :deep(.el-menu-item) {
    color: #c0ccda;

    &.is-active {
      color: #fff;
      background: $kid-primary;
    }
    &:hover {
      background: #34495e;
    }
  }
}
.admin-header {
  display: flex;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.admin-main {
  background: #f5f7fa;
}
</style>
