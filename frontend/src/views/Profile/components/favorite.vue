<script setup lang="ts">
import {ref} from 'vue'
//引入购物车仓库
import {useCartStore} from "@/stores/cart.ts";
const cartStore = useCartStore()
//引入收藏仓库
import {useFavoriteStore} from "@/stores/favorite.ts";
const favoriteStore = useFavoriteStore()
//分页配置
const currentPage = ref(1)
const pageSize = ref(15)
const handleSizeChange = (val: number) => {
  console.log(`${val} items per page`)
}
const handleCurrentChange = (val: number) => {
  console.log(`current page: ${val}`)
}
const value = ref(true)
</script>

<template>
  <el-tabs style="margin-bottom: 32px">
    <el-tab-pane label="我收藏的商品">
      <el-table :data="favoriteStore.favoriteList" style="width: 100%" border>
        <!--收藏商品信息-->
        <el-table-column prop="cover_img" label="图书样式" width="150">
          <template #default="scope">
            <img :src="scope.row.cover_img" alt="" style="width: 80px; height: 80px">
          </template>
        </el-table-column>
        <el-table-column prop="title" label="图书名称" width="250"/>
        <el-table-column prop="book_condition" label="品相" width="100"/>
        <el-table-column prop="price" label="售价（元）" width="100" />
        <el-table-column prop="shop" label="店铺名称" width="180" />
        <!--收藏操作-->
        <el-table-column fixed="right" label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="cartStore.addToGoods(row)">{{ cartStore.isJoined(row.id) ? '已加入购物车' : '加入购物车' }}</el-button>
            <el-button link type="primary" size="small" @click="favoriteStore.deleteFavorite(row.id)">取消收藏</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-tab-pane>
  </el-tabs>
  <el-pagination
    v-model:current-page="currentPage"
    v-model:page-size="pageSize"
    :background="true"
    layout="total, sizes, prev, pager, next, jumper"
    :total="50"
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
    style="margin-left: 8px"
    :hide-on-single-page="value"
  />
</template>

<style scoped>

</style>
