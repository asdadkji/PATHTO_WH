<script setup lang="ts">
import {onMounted, ref} from 'vue'
const value = ref(4.4)
//引入评论仓库
import { useReviewStore } from '@/stores/review'
import dayjs from "dayjs";
const reviewStore = useReviewStore()
onMounted(() => {
  reviewStore.getReviews(1)
})

</script>

<template>
  <div class="product-comment">
    <div class="comment__rate">
      <div class="rate__top">
        <span>店铺好评率</span>
        <el-rate
          v-model="reviewStore.averageRating"
          disabled show-score
          text-color="#ff9900"
          score-template="{value} points"
        />
      </div>
      <div class="rate__button">
        <el-tag type="info" v-for="tag in reviewStore.ALL_TAGS" style="margin-right: 16px">{{ tag.name }}({{reviewStore.tagCounts[tag.value]}})</el-tag>
      </div>
    </div>
    <div class="comment__list">
      <div class="list__item" v-for="(item,id) in reviewStore.reviews" :key="id">
        <img src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" alt="">
        <div class="list__item__user">
          <span>匿名用户</span>
          <span>{{item?.book_snapshot?.title}}</span>
          <p>{{item?.comment}}</p>
          <div style="margin: 14px 0">
            <el-tag type="info" style="font-size: 12px;margin-right: 8px;" v-for="(tag,id) in item.tags" :key="id">{{tag}}</el-tag>
          </div>
          <p style="margin-top: -8px">{{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}}</p>
        </div>
      </div>
    </div>
  </div>

</template>

<style scoped>
.product-comment {
  display: flex;
  flex-direction: column;
  padding: 16px 24px;
  .comment__rate {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    .rate__top {
      display: flex;
      flex-direction: row;
      align-items: center;
      span {
        margin-right: 8px;
        font-size: 18px;
        font-weight: bold;
      }
      margin-bottom: 8px;
    }
    .rate__button {

    }
  }
  .comment__list {
    display: flex;
    flex-direction: column;
    margin-top: 32px;
    .list__item {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      img {
        width: 30px;
        height: 30px;
        border-radius: 50%
      }
      .list__item__user {
        display: flex;
        flex-direction: column;
        margin-left: 16px;
        margin-bottom: 16px;
        span {
          &:first-child {
            font-size: 16px;
            font-weight: bold;
          }
          &:nth-child(2) {
            font-size: 14px;
            color: #999;
            margin-bottom: 4px;
          }
        }
      }
    }
  }
}
</style>
