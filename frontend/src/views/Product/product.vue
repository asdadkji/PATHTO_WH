<script setup lang="ts">
import basicInfor from '@/views/Product/components/basicInfor.vue'
import comment from '@/views/Product/components/comment.vue'
import pronav from '@/views/Product/components/nav.vue'
import introduction from '@/views/Product/components/introduction.vue'
</script>

<template>
  <div class="product__container">
    <pronav></pronav>
    <div style="width: 1200px; margin: 24px auto">
      <basicInfor style="margin-bottom: 24px"></basicInfor>
      <el-tabs type="border-card" style="width: 900px;margin: 0 auto">
        <el-tab-pane label="商品详情"><introduction></introduction></el-tab-pane>
        <el-tab-pane label="书摊评价"><comment></comment></el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped lang="scss">
.product__container {
  display: flex;
  flex-direction: column;
}
</style>
