<script setup lang="ts">
import AdminNav from "@/layouts/Admin/components/AdminNav.vue";
import AdminFooter from "@/layouts/Admin/components/AdminFooter.vue";
import list from '@/views/Admin/components/list.vue'
</script>

<template>
  <AdminNav></AdminNav>
  <list style="margin: 16px"></list>
  <AdminFooter style="margin-top: 400px"></AdminFooter>
</template>

<style scoped>

</style>
