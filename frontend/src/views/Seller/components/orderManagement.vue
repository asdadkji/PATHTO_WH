<script setup lang="ts">
import {computed, onMounted, reactive, ref, watch} from 'vue'
import type {TabsPaneContext} from "element-plus";
const formInline = reactive({
  orderName: '',
  toreName: '',
  proName: '',
  packageNumber: ''
})
//引入订单仓库
import { useOrderStore } from '@/stores/orders.ts'
const orderStore = useOrderStore()
//tab配置
const tabs = ref([
  {label:'全部',name:'all'},
  {label:'待确认',name:'pending'},
  {label:'待付款',name:'confirmed'},
  {label:'待发货',name:'paid'},
  {label:'待收货',name:'delivered'},
  {label:'待评价',name:'completed'},
])
const activeName = ref("all")
const handleClick = (tab: TabsPaneContext) => {
  orderStore.getUserOrdersList(1,'seller',1,10,tab.paneName as string)
}
//订单列表初始化
onMounted(() => {
  orderStore.getUserOrdersList(1,'seller',1,10,'all')
})
//具体订单类容
const orderData = computed(()=>({
  all:orderStore?.deliveryOrders,
  pending:orderStore?.pendingOrders,
  confirmed:orderStore?.confirmedOrders,
  paid:orderStore?.paidOrders,
  shipped:orderStore?.shippedOrders,
  delivered:orderStore?.deliveredOrders,
  completed:orderStore?.completedOrders,
}))
//订单、tab映射
const getTabData = (tabName:string) => {
  return (orderData as any).value[tabName] || []
}
const handleShip = (orderId:number) => {
  orderStore.shipSellerOrderApi(1,Number(orderId),'顺丰',123456)
}
watch(()=>orderStore.orders,(newVal)=>{
  console.log(newVal)
})
</script>

<template>
  <div class="filter__order">
    <el-tabs v-model="activeName" @tab-click="handleClick">
      <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name">
        <el-table :data="getTabData(tab.name)" style="width: 100%">
          <el-table-column label="图书图片" width="120">
            <template #default="scope">
              <el-image v-if="scope.row.book_snapshot?.cover_image" fit="cover" style="width: 80px;height: 100px"/>
              <span v-else>无图片</span>
            </template>
          </el-table-column>
          <el-table-column label="图书名称">
            <template #default="scope">
              <span style="font-weight: bold">{{ scope.row.book_snapshot?.title }}</span>
            </template>
          </el-table-column>
          <el-table-column label="图书价格">
            <template #default="scope">
              <div style="display: flex;flex-direction: column">
                <span>订单总额</span>
                <span style="color: red">￥{{ scope.row.book_snapshot?.price }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="订单号">
            <template #default="scope">
              <span>{{ scope.row.order_number}}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="scope">
              <el-button
                type="primary"
                @click="handleShip(scope.row.id)"
                v-show="scope.row.status === 'paid' && scope.row.payment_status === 'paid'"
                link
              >
                发货
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination layout="prev, pager, next" :total="orderStore.pagination.total" style="margin-top: 16px"></el-pagination>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.filter__order {
  border-radius: 4px;
  background-color: #fff9f9;
  padding: 16px 8px;
}
</style>
