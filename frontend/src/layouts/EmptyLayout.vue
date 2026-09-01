<script setup lang="ts">
// 空布局：仅包裹 router-view，供无框架页面使用
</script>

<template>
  <div class="empty-layout">
    <router-view />
  </div>
</template>

<style scoped lang="scss">
.empty-layout {
  min-height: 100vh;
}
</style>
