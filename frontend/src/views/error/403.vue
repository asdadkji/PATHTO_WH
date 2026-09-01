<script setup lang="ts">
// 403 无权限
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="error-page">
    <el-result
      icon="warning"
      title="403"
      sub-title="抱歉，你没有访问该页面的权限"
    >
      <template #extra>
        <el-button type="primary" @click="router.push('/dashboard')">返回首页</el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped lang="scss">
.error-page {
  @include flex-center;
  min-height: 60vh;
}
</style>
