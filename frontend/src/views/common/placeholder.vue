<script setup lang="ts">
// 通用占位页：后续模块对接真实页面时替换
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const title = route.meta.title || '页面'
</script>

<template>
  <div class="placeholder-page">
    <el-result icon="info" :title="title" sub-title="该模块正在建设中，敬请期待～">
      <template #extra>
        <el-button type="primary" @click="router.push('/dashboard')">返回首页</el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped lang="scss">
.placeholder-page {
  background: $kid-card-bg;
  border-radius: $kid-radius;
  padding: 24px;
  box-shadow: $kid-shadow;
}
</style>
