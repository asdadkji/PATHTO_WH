<script setup lang="ts">
import {computed, ref, watch} from 'vue'
//引入路由
import {useRoute} from "vue-router";
const route = useRoute()
//分页配置
const currentPage = ref(1)
const pageSize = ref(20)
//筛选配置
const isNew = ref(true)
const isPrice = ref(false)
const isOrder = ref(true)
const order = computed(() => {
  return isOrder.value ? 'DESC' : 'ASC'
})
const sort = computed(() => {
  return isPrice.value ? 'price' : 'created_at'
})
//筛选条件
const props = defineProps<{
  condition?:string,
  author?:string,
}>()
//引入图书仓库
import {useBookStore} from "@/stores/book.ts";
import router from "@/router";
const bookStore = useBookStore()
//最终筛选条件
const filterData = computed(() => ({
  keyword: route.query.searchData,
  categoryId:route.query.categoryId,
  author:props.author ?? '',
  order:order.value,
  page:currentPage.value,
  size:pageSize.value,
  bookCondition:props.condition ?? 'new',
  sort:sort.value
}))
//展示筛选结果
watch(filterData, async (newVal) => {
  await bookStore.getFilterData(newVal)
  if(props.author) await bookStore.getFilterData(props.author)
},{deep:true,immediate:true})

//映射补丁
const conditionMap = {
  new: '全新',
  like_new: '九五品',
  very_good: '九品',
  good: '八品',
  acceptable: '七品',
  poor: '六品'
}
const getConditionChinese = (level: string) => {
  return conditionMap[level as keyof typeof conditionMap] || level
}
const processedBooks = computed(() => {
  return bookStore.bookFilter.map(book => ({
    ...book,
    conditionDisplay: getConditionChinese(book.book_condition)
  }))
})
//路由跳转
const goToBookDetail = (bookId:number) => {
  router.push(`/product/${bookId}`)
}
</script>

<template>
  <!--筛选容器-->
  <div class="filterbook">
    <!--筛选条件-->
    <div class="filter__header">
      <ul class="filter__sort">
        <li @click="isNew=!isNew;isPrice=!isPrice" :class="{active:isNew}">上架时间</li>
        <li @click="isPrice=!isPrice;isNew=!isNew" :class="{active:isPrice}">价格</li>
      </ul>
      <div class="filter__order">
        <el-icon @click="isOrder=!isOrder" v-show="isOrder" class="filter__icon"><CaretTop /></el-icon>
        <el-icon @click="isOrder=!isOrder" v-show="!isOrder" class="filter__icon"><CaretBottom /></el-icon>
      </div>
    </div>
    <!--筛选后内容-->
    <div class="filter__book">
      <div class="filter__book_item" v-for="item in processedBooks" :key="item.id">
        <div class="book__image">
          <img :src="`https://picsum.photos/600/400?random=${item.id}`" :alt="item.title">
        </div>
        <div class="book__info">
          <h3 class="book__title" @click="goToBookDetail(item.id)">{{ item.title }}</h3>
          <p class="book__author">{{ item.author }}</p>
          <p class="book__publisher">{{ item.publisher }}</p>
        </div>
        <div class="book__actions">
          <div class="book__price">
            <span class="book__condition">{{ item.conditionDisplay }}</span>
            <span class="book__value">￥{{ item.price }}</span>
          </div>
          <p class="book__time">上书时间 {{ new Date(item.created_at).toLocaleDateString('zh-CN', {year:'numeric',month:'long',day:'numeric'}) }}</p>
        </div>
      </div>
      <!--分页-->
      <div class="filter__pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          layout="prev, pager, next, jumper"
          background
          :total="bookStore.totalF"
          :size="'large'"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.filterbook {
  flex: 1;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
  &:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
  .filter__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
  }
  .filter__sort {
    display: flex;
    flex-direction: row;
    list-style: none;
    padding: 0;
    margin: 0;
    li {
      margin-right: 24px;
      padding: 8px 12px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 14px;
      &:hover {
        background-color: #e9ecef;
      }
      &.active {
        background-color: #ff4b60;
        color: #ffffff;
      }
    }
  }
  .filter__order {
    display: flex;
    align-items: center;
  }
  .filter__icon {
    cursor: pointer;
    font-size: 18px;
    color: #666666;
    transition: color 0.3s ease;
    &:hover {
      color: #ff4b60;
    }
  }
  .filter__book {
    padding: 24px;
  }
  .filter__book_item {
    display: flex;
    flex-direction: row;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 16px;
    transition: all 0.3s ease;
    border: 1px solid #e9ecef;
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }
  }
  .book__image {
    width: 120px;
    height: 160px;
    margin-right: 20px;
    flex-shrink: 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  .book__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
  .book__title {
    font-size: 18px;
    font-weight: 600;
    color: #333333;
    margin: 0 0 12px 0;
    cursor: pointer;
    transition: color 0.3s ease;
    &:hover {
      color: #ff4b60;
    }
  }
  .book__author {
    font-size: 14px;
    color: #666666;
    margin: 0 0 8px 0;
  }
  .book__publisher {
    font-size: 14px;
    color: #999999;
    margin: 0;
  }
  .book__actions {
    width: 200px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-between;
  }
  .book__price {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-bottom: 8px;
  }
  .book__condition {
    font-size: 12px;
    color: #666666;
    margin-bottom: 4px;
  }
  .book__value {
    font-size: 20px;
    font-weight: 600;
    color: #ff4b60;
  }
  .book__time {
    font-size: 12px;
    color: #999999;
    margin: 8px 0;
  }
  .book__buttons {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }
  .book__btn {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.3s ease;
    &.buy {
      background-color: #ff4b60;
      border-color: #ff4b60;
      &:hover {
        background-color: #ff3048;
        border-color: #ff3048;
      }
    }
    &.cart {
      &:hover {
        border-color: #ff4b60;
        color: #ff4b60;
      }
    }
  }
  .filter__pagination {
    margin-top: 32px;
    display: flex;
    justify-content: center;
  }
}
</style>
