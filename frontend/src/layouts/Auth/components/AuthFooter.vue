<script setup lang="ts">

</script>

<template>
  <footer class="auth-footer">
    <div class="auth-footer__container">
      <a href="/about">本站简介</a>
      <span>|</span>
      <a href="/help">帮助中心</a>
      <span>|</span>
      <a href="/contact">联系我们</a>
      <span>|</span>
      <a href="/jobs">招聘英才</a>
    </div>
  </footer>
</template>

<style scoped lang="scss">
//登录页脚容器
.auth-footer {
  width: 100%;
}
//登录页脚
.auth-footer__container {
  @include flex-center;
  width: 400px;
  margin: 0 auto;
  justify-content: space-between;
}
</style>
