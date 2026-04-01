<script setup lang="ts">
import {onMounted} from "vue";
//引入图书仓库
import {useBookStore} from "@/stores/book.ts"
const bookStore = useBookStore()
//引入路由
import router from "@/router";
//推荐图书初始化
onMounted(() => {
  bookStore.getRecommendBook()
})
//推荐图书模块映射
const categoryMap: Record<string, string> = {
  '1': '小说',
  '2': '文学',
  '4': '历史',
  '5': '地理',
  '9': '军事',
  '15': '童书'
}
const categoryname = (categoryId: string | number) => {
  return categoryMap[String(categoryId)] || '其他'
}
//图书详情页跳转
const goToBookDetail = (bookId:number) => {
  router.push(`/product/${bookId}`)
}
//筛选页跳转
const goToFilter = (categoryId: number) => {
  router.push({
    path: '/filter',
    query: {
      categoryId:categoryId
  }})
}
</script>

<template>
  <div class="book">
    <div class="book__container" v-for="(books, categoryId) in bookStore.homeBookRecommend" :key="categoryId">
      <div class="book__title">
        <span>{{ categoryname(categoryId) }}</span>
        <p class="more" @click="goToFilter(Number(categoryId))">更多图书</p>
      </div>
      <div class="book__items">
        <div class="book__item" v-for="book in books" :key="book.id" @click="goToBookDetail(book.id)">
          <img :src="book.cover_image">
          <p>{{book.title}}</p>
          <span>{{book.author}}</span>
          <span>￥ {{book.price}}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.book {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.book__container {
  display: flex;
  flex-direction: column;
  .book__title {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items:flex-end;
    margin-bottom: 8px;
    span {
      font-size: 28px;
      font-weight: 600;
      margin-right: 8px;
    };
    .more {
      font-size: 14px;
      padding: 4px 0;
      &:hover {
        color: #ff6700;
        cursor: pointer;
      }
    }
  }
  .book__items {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    border-top: 1px solid #d3d3d3;
    padding: 24px 0;
    .book__item {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      margin-bottom: 16px;
      &:hover {
        cursor: pointer;
      }
      img {
        border: 1px solid #e0e0e0;
        width: 130px;
        height: 150px;
        margin-bottom: 4px;
      }
      p {
        @include text-ellipsis;
        width: 120px;
        margin-bottom: 8px;
        font-size: 14px;
      }
      span {
        font-size: 12px;
        margin-bottom: 4px;
        color: #c1bfbf;
        &:first-child:hover {
          cursor: pointer;
          color: #ff6700;
        }
        &:last-child {
          color: #ff6700;
          font-size: medium;
        }
      }
    }
  }
}
</style>
