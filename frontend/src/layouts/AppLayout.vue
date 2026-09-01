<script setup lang="ts">
// 应用主框架：顶部导航 + 积分/头像下拉；移动端底部 Tab
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  ArrowDown,
  Checked,
  Clock,
  DocumentChecked,
  Goods,
  HomeFilled,
  Setting,
  ShoppingCart,
  StarFilled,
  SwitchButton,
  Tickets,
  User,
  UserFilled,
} from '@element-plus/icons-vue'

const router = useRouter()
const auth = useAuthStore()

// 基础导航项（模块2「我的任务」已对接真实页面；模块5「兑换记录」已对接真实页面）
const baseNav = [
  { path: '/dashboard', label: '首页', icon: HomeFilled },
  { path: '/task', label: '我的任务', icon: Checked },
  { path: '/time', label: '时间管理', icon: Clock },
  { path: '/shop', label: '商城', icon: Goods },
  { path: '/cart', label: '购物车', icon: ShoppingCart },
  { path: '/exchange', label: '兑换', icon: Tickets },
  { path: '/profile', label: '我的', icon: User },
]

// 管理员额外可见"兑换审核"入口，插在"兑换"与"我的"之间
const navItems = computed(() => {
  const items = [...baseNav]
  if (auth.isAdmin) {
    items.splice(items.length - 1, 0, {
      path: '/admin/redemption',
      label: '兑换审核',
      icon: DocumentChecked,
    })
  }
  return items
})

const points = computed(() => auth.userInfo?.totalPoints ?? 0)
const avatar = computed(() => auth.userInfo?.avatar || '')
const username = computed(() => auth.userInfo?.username || '小朋友')

function handleCommand(cmd: string) {
  if (cmd === 'profile') {
    router.push('/profile')
  } else if (cmd === 'admin') {
    router.push('/admin/dashboard')
  } else if (cmd === 'logout') {
    auth.logout()
    ElMessage.success('已退出登录')
    router.replace('/auth/login')
  }
}
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-emoji">🎯</span>
          <span class="logo-text">积分乐园</span>
        </div>
      </div>

      <nav class="header-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="header-right">
        <div class="points-badge">
          <el-icon><StarFilled /></el-icon>
          <span>{{ points }}</span>
        </div>
        <el-dropdown trigger="click" @command="handleCommand">
          <div class="avatar-wrap">
            <el-avatar :size="36" :src="avatar">
              <el-icon><UserFilled /></el-icon>
            </el-avatar>
            <span class="username">{{ username }}</span>
            <el-icon class="caret"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile" :icon="User">
                我的资料
              </el-dropdown-item>
              <el-dropdown-item v-if="auth.isAdmin" command="admin" :icon="Setting">
                管理后台
              </el-dropdown-item>
              <el-dropdown-item command="logout" :icon="SwitchButton" divided>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <main class="app-main">
      <router-view />
    </main>

    <nav class="bottom-nav">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="bottom-item"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<style scoped lang="scss">
.app-layout {
  min-height: 100vh;
  background: $kid-bg;
}
.app-header {
  @include flex-row-sb;
  height: 64px;
  padding: 0 24px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-left .logo {
  display: flex;
  align-items: center;
  gap: 8px;

  .logo-emoji {
    font-size: 24px;
  }
  .logo-text {
    font-size: 20px;
    font-weight: 700;
    color: $kid-primary;
  }
}
.header-nav {
  display: flex;
  gap: 8px;

  .nav-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: $kid-radius-sm;
    color: $kid-text;
    font-size: 15px;
    font-weight: 500;
    transition: all 0.2s;

    &:hover {
      background: $kid-primary-light;
      color: $kid-primary-dark;
    }
    &.router-link-active {
      background: $kid-primary;
      color: #fff;
    }
  }
}
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.points-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, $kid-accent, #ffa000);
  color: #fff;
  font-weight: 700;
  font-size: 16px;
}
.avatar-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 999px;
  transition: background 0.2s;

  &:hover {
    background: #f5f5f5;
  }
  .username {
    font-size: 14px;
    color: $kid-text;
  }
  .caret {
    color: #999;
  }
}
.app-main {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}
.bottom-nav {
  display: none;
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 12px;
  }
  .header-nav {
    display: none;
  }
  .header-right .username {
    display: none;
  }
  .app-main {
    padding: 12px 12px 84px;
  }
  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 64px;
    background: #fff;
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
    z-index: 100;

    .bottom-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      color: #999;
      font-size: 12px;

      .el-icon {
        font-size: 22px;
      }
      &.router-link-active {
        color: $kid-primary;
      }
    }
  }
}
</style>
