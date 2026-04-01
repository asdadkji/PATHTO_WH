<script setup lang="ts">
import orderaddress from '@/views/Orders/components/orderaddress.vue';
import orderlist from '@/views/Orders/components/orderlist.vue';
import top from '@/views/Orders/components/top.vue';
</script>

<template>
  <div class="order__container">
    <top></top>
    <div style="width: 1200px; margin: 0 auto">
      <orderaddress style="margin-top: 32px"></orderaddress>
      <orderlist style="margin-top: 32px;"></orderlist>
    </div>
    <p style="height: 400px"></p>
  </div>
</template>

<style scoped lang="scss">
.order__container {
  background: #ededed;
}
</style>
