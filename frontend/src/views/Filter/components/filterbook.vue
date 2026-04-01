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
    <div style="padding: 4px;display: flex;flex-direction: row;background: #e1cccc;justify-content: space-between;align-items: center">
      <ul class="filter__top">
        <li @click="isNew=!isNew;isPrice=!isPrice" :class="{active:isNew}">上架时间</li>
        <li @click="isPrice=!isPrice;isNew=!isNew" :class="{active:isPrice}">价格</li>
      </ul>
      <el-icon @click="isOrder=!isOrder" v-show="isOrder" style="cursor:pointer;"><CaretTop /></el-icon>
      <el-icon @click="isOrder=!isOrder" v-show="!isOrder" style="cursor:pointer;"><CaretBottom /></el-icon>
    </div>
    <!--筛选后内容-->
    <div class="filter__book">
      <div class="filter__book_item" v-for="item in processedBooks" :key="item.id">
        <img class="item_left" src="@assets/images/logo/auth-logo.svg">
        <div class="item_middle">
          <p style="margin-bottom: 8px; font-size: 22px;cursor: pointer" @click="goToBookDetail(item.id)">{{ item.title }}</p>
          <p>{{ item.author }}</p>
          <p>{{ item.publisher }}</p>
        </div>
        <div class="item_right">
          <div class="item_right_top">
            <span>{{ item.conditionDisplay }}</span>
            <span>￥ {{ item.price }}</span>
          </div>
          <p style="display: flex;justify-content: flex-end">上书时间 {{ new Date(item.created_at).toLocaleDateString('zh-CN', {year:'numeric',month:'long',day:'numeric'}) }}</p>
          <div class="filter__btn">
            <el-button plain style="padding: 4px 8px;">立刻购买</el-button>
            <el-button plain style="padding: 4px 8px;">加入购物车</el-button>
          </div>
        </div>
      </div>
      <!--分页-->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        layout="prev, pager, next, jumper"
        background
        :total="bookStore.totalF"
        style="margin-top: 16px;"
        :size="'large'"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.filterbook {
  width: 950px;
  .filter__top {
    padding: 4px;
    display: flex;
    flex-direction: row;
    background: #e1cccc;
    li {
      margin-right: 16px;
      padding: 4px;
      &:hover {
        background: #e4dfdf;
        cursor: pointer;
      }
    }
  }
  .filter__book {
    padding: 8px 16px;
    .filter__book_item {
      border-bottom: 1px solid #e4dfdf;
      padding: 16px 0;
      display: flex;
      flex-direction: row;
      .item_left {
        width: 160px;
        height: 160px;
        margin-right: 16px;
        border: 1px solid #e4dfdf;
      }
      .item_middle {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        flex:4;
        p {
          margin-bottom: 8px;
          font-size: 14px;
        }
      }
      .item_right {
        flex:1.5;
        .item_right_top {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .filter__btn {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          margin-top: 60px;
        }
      }
    }
  }
}
.filter__top li.active{
  color: #FF4B60;
}

</style>
