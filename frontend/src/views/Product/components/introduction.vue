<script setup lang="ts">
import {computed, ref} from 'vue'
//
const list = ref([
  'https://picsum.photos/600/400?random=1',
  'https://picsum.photos/600/400?random=2',
  'https://picsum.photos/600/400?random=3',
  'https://picsum.photos/600/400?random=4',
  'https://picsum.photos/600/400?random=1',
  'https://picsum.photos/600/400?random=2',
  'https://picsum.photos/600/400?random=3',
  'https://picsum.photos/600/400?random=4'
])
//引入图书仓库
import { useBookStore } from '@/stores/book'
const bookStore = useBookStore()
const conditionText = computed(() => {
  const conditionMap: Record<string, string> = {
    new: '全新',
    like_new: '九五品',
    very_good: '九品',
    good: '八品',
    acceptable: '七品',
    poor: '六品'
  }

  const condition = bookStore.bookData?.book_condition || ''
  return conditionMap[condition] || condition || '未知'
})
</script>

<template>
  <div class="introduction__container">
    <div class="intro__info">
      <p>商品分类： {{bookStore.bookData?.book_type}}</p>
      <p>品相描述： {{conditionText}}</p>
      <p>{{bookStore.bookData?.highlights}}</p><!--实拍图没笔记划线，书角有点弯，书背面有一道划痕如图，所见即所得-->
    </div>
    <div>
      <img v-for="img in list" :key="img" :src="img" style="margin-bottom: 8px">
    </div>
  </div>
</template>

<style scoped lang="scss">
.introduction__container {
  display: flex;
  flex-direction: column;
  padding: 16px 24px;
  .intro__info {
    margin-bottom: 32px;
    p {
      &:first-child {
        font-size: 12px;
        margin-bottom: 32px;
        color: #999;
      }
      &:nth-child(2) {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 8px;
      }
      &:last-child {
        font-size: 12px;
      }
    }
  }
}
</style>
<!--尚未和数据库关联-->
