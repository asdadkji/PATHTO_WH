<script setup lang="ts">

</script>

<template>
  <div class="admin__footer">
    <p class="footer__title">校园闲置图书交易平台感谢你的付出</p>
    <div>
      <p>版权所有 © 2023-2024 萨达</p>
      <p>技术支持：萨达</p>
      <p>联系方式：123456789</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin__footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .footer__title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 20px;
  }
  div {
    display: flex;
    align-items: center;
    width: 600px;
    justify-content: space-between;
  }
}
</style>
