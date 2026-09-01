<script setup lang="ts">
// 我的资料：只读展示 + 可编辑表单（作业/游戏目标、每日提醒）
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getProfile } from '@/apis/user'
import type { UserProfile, UserRole } from '@/types'

const auth = useAuthStore()
const loading = ref(false)
const error = ref(false)

// 默认值兜底：接口失败时仍可渲染（来自 store 缓存 + 默认目标）
const profile = reactive<UserProfile>({
  userId: auth.userInfo?.userId ?? '',
  username: auth.userInfo?.username ?? '',
  avatar: auth.userInfo?.avatar ?? '',
  totalPoints: auth.userInfo?.totalPoints ?? 0,
  role: (auth.userInfo?.role ?? 'child') as UserRole,
  homeworkTargetMinutes: 60,
  gameTargetMinutes: 30,
  dailyTaskReminder: false,
})

const initial = computed(() => profile.username.charAt(0).toUpperCase())

async function load() {
  loading.value = true
  error.value = false
  try {
    const data = await getProfile()
    Object.assign(profile, data)
  } catch {
    // 接口未就绪时不阻断渲染，展示本地缓存与默认值
    error.value = true
  } finally {
    loading.value = false
  }
}

function save() {
  // 后端编辑接口暂未定义，先给出友好提示
  ElMessage.success('资料编辑功能开发中，敬请期待～')
}

onMounted(load)
</script>

<template>
  <div v-loading="loading" class="profile-page">
    <h2 class="page-title">我的资料</h2>

    <section class="card">
      <div class="card-head">
        <span>基本信息</span>
      </div>
      <div class="user-head">
        <el-avatar :size="72" :src="profile.avatar">
          {{ initial }}
        </el-avatar>
        <div class="user-meta">
          <div class="username">{{ profile.username || '小朋友' }}</div>
          <el-tag
            :type="profile.role === 'admin' ? 'danger' : 'success'"
            effect="light"
          >
            {{ profile.role === 'admin' ? '管理员 / 家长' : '儿童' }}
          </el-tag>
          <div class="points-line">
            <el-icon><StarFilled /></el-icon>
            <span>总积分 <b>{{ profile.totalPoints }}</b></span>
          </div>
        </div>
      </div>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="用户 ID">
          {{ profile.userId || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="用户名">
          {{ profile.username || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          {{ profile.role === 'admin' ? '管理员 / 家长' : '儿童' }}
        </el-descriptions-item>
      </el-descriptions>
    </section>

    <section class="card">
      <div class="card-head">
        <span>目标设置</span>
        <span class="hint">调整每日目标，养成好习惯</span>
      </div>
      <el-form label-width="160px" label-position="left">
        <el-form-item label="作业目标（分钟）">
          <el-input-number
            v-model="profile.homeworkTargetMinutes"
            :min="0"
            :max="300"
            :step="10"
          />
        </el-form-item>
        <el-form-item label="游戏目标（分钟）">
          <el-input-number
            v-model="profile.gameTargetMinutes"
            :min="0"
            :max="180"
            :step="5"
          />
        </el-form-item>
        <el-form-item label="每日任务提醒">
          <el-switch v-model="profile.dailyTaskReminder" />
        </el-form-item>
      </el-form>
      <div class="form-actions">
        <el-button type="primary" @click="save">保存修改</el-button>
      </div>
    </section>

    <el-alert
      v-if="error"
      class="load-tip"
      type="warning"
      :closable="false"
      show-icon
      title="未能加载完整资料"
      description="后端接口可能未就绪，当前展示本地缓存与默认值。"
    />
  </div>
</template>

<style scoped lang="scss">
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.page-title {
  font-size: 22px;
  font-weight: 700;
  color: $kid-text;
}
.card {
  background: $kid-card-bg;
  border-radius: $kid-radius;
  padding: 20px;
  box-shadow: $kid-shadow;

  .card-head {
    @include flex-row-sb;
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 700;
    color: $kid-text;

    .hint {
      font-size: 12px;
      font-weight: 400;
      color: $kid-text-light;
    }
  }
}
.user-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;

  .user-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .username {
      font-size: 20px;
      font-weight: 700;
      color: $kid-text;
    }
    .points-line {
      display: flex;
      align-items: center;
      gap: 6px;
      color: $kid-primary-dark;
      font-size: 14px;

      b {
        font-size: 16px;
      }
    }
  }
}
.form-actions {
  margin-top: 8px;
}
.load-tip {
  margin-top: 4px;
}
</style>
