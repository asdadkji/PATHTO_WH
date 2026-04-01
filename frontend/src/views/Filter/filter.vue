<script setup lang="ts">
import top from '@/views/Filter/components/top.vue'
import filterbook from '@/views/Filter/components/filterbook.vue'
import leftfilter from '@/views/Filter/components/leftfilter.vue'
import {ref} from "vue";
//emit/props传递中转站
const bookCondition = ref<string | undefined>()
const bookAuthor = ref<string | undefined>()
const setCondition = (level: string) => {
  bookCondition.value = level
}
const setAuthor = (author: string) => {
  bookAuthor.value = author
}
</script>

<template>
  <top></top>
  <div class="filter__middle">
    <leftfilter @update:level="setCondition" @update:author="setAuthor"></leftfilter>
    <filterbook :condition="bookCondition" :author="bookAuthor"></filterbook>
  </div>
</template>

<style scoped lang="scss">
.filter__middle {
  display: flex;
  width: 1000px;
  margin: 0 auto;
}
</style>
