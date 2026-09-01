<script setup lang="ts">
// 认证布局：居中卡片 + 活泼渐变背景
import authLogo from '@assets/images/logo/auth-logo.svg'
</script>

<template>
  <div class="auth-layout">
    <div class="auth-bg">
      <span class="blob blob-1"></span>
      <span class="blob blob-2"></span>
      <span class="blob blob-3"></span>
      <span class="blob blob-4"></span>
    </div>
    <main class="auth-main">
      <div class="auth-card">
        <div class="auth-logo">
          <img :src="authLogo" alt="logo" />
          <h1>儿童任务积分乐园</h1>
          <p>完成任务 · 攒积分 · 换奖励</p>
        </div>
        <router-view />
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.auth-layout {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #fff3e0 0%, #e3f2fd 50%, #f3e5f5 100%);
}
.auth-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(45px);
  opacity: 0.55;
}
.blob-1 {
  width: 320px;
  height: 320px;
  background: $kid-primary;
  top: -80px;
  left: -60px;
}
.blob-2 {
  width: 260px;
  height: 260px;
  background: $kid-secondary;
  bottom: -60px;
  right: -40px;
}
.blob-3 {
  width: 180px;
  height: 180px;
  background: $kid-accent;
  top: 40%;
  right: 18%;
}
.blob-4 {
  width: 140px;
  height: 140px;
  background: $kid-purple;
  bottom: 18%;
  left: 12%;
}
.auth-main {
  position: relative;
  z-index: 1;
  @include flex-center;
  min-height: 100vh;
  padding: 24px;
}
.auth-card {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-radius: $kid-radius-lg;
  box-shadow: $kid-shadow;
  padding: 32px 28px;
}
.auth-logo {
  text-align: center;
  margin-bottom: 18px;

  img {
    width: 64px;
    height: 64px;
  }
  h1 {
    font-size: 22px;
    color: $kid-text;
    margin-top: 8px;
  }
  p {
    font-size: 13px;
    color: $kid-text-light;
    margin-top: 4px;
  }
}
</style>
