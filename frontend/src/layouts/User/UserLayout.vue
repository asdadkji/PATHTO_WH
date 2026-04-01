<script setup lang="ts">
import UserNav from '@/layouts/User/components/UserNav.vue'
import UserFooter from "@/layouts/User/components/UserFooter.vue";
</script>

<template>
  <UserNav></UserNav>
  <router-view></router-view>
  <UserFooter></UserFooter>
</template>

<style scoped>

</style>
