<script setup lang="ts">
// 404 页面不存在
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="error-page">
    <el-result
      icon="info"
      title="404"
      sub-title="哎呀，页面走丢了～"
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
