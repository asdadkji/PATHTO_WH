<script setup lang="ts">

</script>

<template>
  <nav class="auth-nav">
    <div class="auth-nav__container">
      <div class="auth-nav__logo">
        <img src="@assets/images/logo/auth-logo.svg" alt="logo" />
        <span>校园闲置图书交易平台</span>
      </div>
    </div>
  </nav>
</template>

<style scoped lang="scss">
//登录导航容器
.auth-nav {
  background: #e4dfdf;
  width: 100%;
}
//登录导航
.auth-nav__container {
  @include flex-center;
  flex-direction: column;
  //图标部分
  .auth-nav__logo {
    @include flex-center;
    justify-content: flex-start;
    padding: 16px;
    border-bottom: 2px #FF4B60 solid;
    width: 100%;
    //logo图标
    img {
      width: 60px;
      height: 60px;
    }
    //logo文字
    span {
      font-size: 24px;
      font-weight: 600;
      color: #8f1b1b;
    }
  }
}
</style>
