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
  <div class="filter__container">
    <div class="filter__middle">
      <leftfilter @update:level="setCondition" @update:author="setAuthor"></leftfilter>
      <filterbook :condition="bookCondition" :author="bookAuthor"></filterbook>
    </div>
  </div>
</template>

<style scoped lang="scss">
.filter__container {
  padding: 20px 0;
  background-color: #f8f9fa;
}

.filter__middle {
  display: flex;
  width: 1200px;
  margin: 0 auto;
  gap: 20px;
  @media (max-width: 1280px) {
    width: 90%;
  }
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
}
</style>
