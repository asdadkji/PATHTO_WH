<script setup lang="ts">
import AuthNav from "@/layouts/Auth/components/AuthNav.vue";
import AuthFooter from "@/layouts/Auth/components/AuthFooter.vue";
</script>

<template>
  <AuthNav></AuthNav>
  <router-view :key="$route.fullPath"></router-view>
  <AuthFooter></AuthFooter>
</template>

<style scoped>

</style>
