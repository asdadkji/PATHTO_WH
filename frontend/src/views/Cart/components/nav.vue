<script setup lang="ts">
import search from '@/components/search/search.vue'
</script>

<template>
  <div style="background: #aedaff">
    <div class="nav__container">
      <span>校园闲置图书交易平台</span>
      <search></search>
    </div>
  </div>
</template>

<style scoped>
.nav__container {
  padding: 16px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 1200px;
  margin: 0 auto;
  span {
    font-family: 'Ma Shan Zheng','ZCOOL XiaoWei', cursive, sans-serif;
    font-size: 20px;
  }
}
</style>
