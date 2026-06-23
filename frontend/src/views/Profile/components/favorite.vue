<script setup lang="ts">
import {ref, onMounted} from 'vue'
//引入购物车仓库
import {useCartStore} from "@/stores/cart.ts";
const cartStore = useCartStore()
//引入收藏仓库
import {useFavoriteStore} from "@/stores/favorite.ts";
const favoriteStore = useFavoriteStore()
//引入认证仓库
import {useAuthStore} from "@/stores/auth.ts";
const authStore = useAuthStore()
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

//初始化
onMounted(() => {
  // 切换到当前用户，加载购物车数据
  if (authStore.userId) {
    cartStore.switchUser(String(authStore.userId))
  }
})

//品相映射
const conditionMap: Record<string, string> = {
  new: '全新',
  like_new: '九五品',
  very_good: '九品',
  good: '八品',
  acceptable: '七品',
  poor: '六品'
}

//获取品相中文
const getConditionText = (condition: string) => {
  return conditionMap[condition] || condition
}
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
        <el-table-column label="品相" width="100">
          <template #default="scope">
            {{ getConditionText(scope.row.book_condition) }}
          </template>
        </el-table-column>
        <el-table-column prop="price" label="售价（元）" width="100" />
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
