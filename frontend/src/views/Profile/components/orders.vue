<script setup lang="ts">
import {computed, onMounted, reactive, ref, watch} from 'vue'
import type {TabsPaneContext} from "element-plus";
//引入子组件
import reviews from '@/components/form/review.vue'
//引入订单仓库
import { useOrderStore } from '@/stores/orders.ts'
const orderStore = useOrderStore()
//引入用户仓库
import {useAuthStore} from "@/stores/auth.ts";
import {useRouter} from "vue-router";
const router = useRouter()
const authStore = useAuthStore()
type TabName = 'all' | 'pending' | 'confirmed' | 'paid' | 'shipped' | 'delivered' | 'completed'
//tab配置
const tabs = ref([
  {label:'全部',name:'all'},
  {label:'交易中订单',name:'pending'},
  {label:'待确认',name:'confirmed'},
  {label:'待付款',name:'paid'},
  {label:'待发货',name:'shipped'},
  {label:'待收货',name:'delivered'},
  {label:'待评价',name:'completed'},
])
const activeName = ref<TabName>("all")
const tabLoaded = ref({
  all: false,
  pending: false,
  confirmed: false,
  paid: false,
  shipped: false,
  delivered: false,
  completed: false
})
//筛选条件
const filterForm = reactive({
  keyword: '',
  sortBy: 'created_at',
  sortOrder: 'desc',
  startDate: '',
  endDate: ''
})
//排序选项
const sortOptions = [
  { label: '创建时间', value: 'created_at' },
  { label: '价格', value: 'final_price' }
]
//排序方向选项
const sortOrderOptions = [
  { label: '从新到旧', value: 'desc' },
  { label: '从旧到新', value: 'asc' }
]
//处理筛选
const handleFilter = async () => {
  // 重置tabLoaded，强制重新加载数据
  Object.keys(tabLoaded.value).forEach(key => {
    tabLoaded.value[key as keyof typeof tabLoaded.value] = false
  })
  
  // 准备筛选参数
  const filterParams = {
    keyword: filterForm.keyword,
    sortBy: filterForm.sortBy,
    sortOrder: filterForm.sortOrder,
    startDate: filterForm.startDate,
    endDate: filterForm.endDate
  }
  
  // 重新加载当前tab的数据
  if (activeName.value === 'pending') {
    // pending 对应交易中，需要加载多个状态的订单
    const statuses = ['confirmed', 'paid', 'shipped', 'delivered','pending']
    for (const status of statuses) {
      await orderStore.getUserOrdersList(
        authStore.userId ?? 1,
        'buyer',
        1,
        10,
        status,
        filterParams
      )
    }
  } else {
    await orderStore.getUserOrdersList(
      authStore.userId ?? 1,
      'buyer',
      1,
      10,
      activeName.value,
      filterParams
    )
  }
  
  tabLoaded.value[activeName.value] = true
}

//处理点击tab
const handleClick = async (tab: TabsPaneContext) => {
  const tabName = tab.paneName as TabName

  if (!tabLoaded.value[tabName]) {
    // 准备筛选参数
    const filterParams = {
      keyword: filterForm.keyword,
      sortBy: filterForm.sortBy,
      sortOrder: filterForm.sortOrder,
      startDate: filterForm.startDate,
      endDate: filterForm.endDate
    }
    
    if (tabName === 'pending') {
      // pending 对应交易中，需要加载多个状态的订单
      const statuses = ['confirmed', 'paid', 'shipped', 'delivered','pending']
      for (const status of statuses) {
        await orderStore.getUserOrdersList(
          authStore.userId ?? 1,
          'buyer',
          1,
          10,
          status,
          filterParams
        )
      }
    } else {
      await orderStore.getUserOrdersList(
        authStore.userId ?? 1,
        'buyer',
        1,
        10,
        tabName,
        filterParams
      )
    }
    tabLoaded.value[tabName] = true
  }
}
//订单列表初始化
onMounted(() => {
  // 准备筛选参数
  const filterParams = {
    keyword: filterForm.keyword,
    sortBy: filterForm.sortBy,
    sortOrder: filterForm.sortOrder,
    startDate: filterForm.startDate,
    endDate: filterForm.endDate
  }
  orderStore.getUserOrdersList(authStore.userId ?? 1,'buyer',1,10,'all',filterParams)
  tabLoaded.value.all = true
})
//具体订单内容
const orderData = computed(()=>({
  all:orderStore?.orders,
  pending:orderStore?.pendingOrdersList,
  confirmed:orderStore?.confirmedOrdersList,
  paid:orderStore?.paidOrdersList,
  shipped:orderStore?.shippedOrdersList,
  delivered:orderStore?.deliveredOrdersList,
  completed:orderStore?.completedOrdersList,
}))
//订单、tab映射
const getTabData = (tabName:string) => {
  return (orderData as any).value[tabName] || []
}
//子组件展示判定
const showModel = ref(false)
const currentBookSnapshot = ref<any>({})
const currentOrderId = ref<number>(0)
const currentSellerId = ref<number>(0)
//打开子组件
const goToComment = (row: any) => {
  currentOrderId.value = Number(row.id)
  currentBookSnapshot.value = row.book_snapshot || {}
  currentSellerId.value = Number(row.seller_id)
  showModel.value = true
}
watch(activeName, async (newVal) => {
  if (!tabLoaded.value[newVal] && newVal !== 'all') {
    // 准备筛选参数
    const filterParams = {
      keyword: filterForm.keyword,
      sortBy: filterForm.sortBy,
      sortOrder: filterForm.sortOrder,
      startDate: filterForm.startDate,
      endDate: filterForm.endDate
    }
    await orderStore.getUserOrdersList(
      authStore.userId ?? 1,
      'buyer',
      1,
      10,
      newVal,
      filterParams
    )
    tabLoaded.value[newVal] = true
  }
})
const goToBatchPayment = (row:any) => {
  router.push({
    name: 'checkout',  //跳转结算页面
    query: {
      orderIds: row.id.toString(),  // 转换为字符串，因为支付页面用 split(',') 解析
      fromCart: 'false'
    }
  })
}
</script>

<template>
  <div class="filter__order">
    <!-- 筛选表单 -->
    <el-form :model="filterForm" class="order-filter-form" label-width="80px">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="关键字">
            <el-input v-model="filterForm.keyword" placeholder="请输入订单号或图书名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="排序方式">
            <el-select v-model="filterForm.sortBy" style="width: 100%">
              <el-option v-for="option in sortOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="排序方向">
            <el-select v-model="filterForm.sortOrder" style="width: 100%">
              <el-option v-for="option in sortOrderOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开始日期">
            <el-date-picker v-model="filterForm.startDate" type="date" placeholder="选择开始日期" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束日期">
            <el-date-picker v-model="filterForm.endDate" type="date" placeholder="选择结束日期" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24" style="text-align: right">
          <el-button type="primary" @click="handleFilter">筛选</el-button>
          <el-button @click="() => Object.assign(filterForm, { keyword: '', sortBy: 'created_at', sortOrder: 'desc', startDate: '', endDate: '' })">重置</el-button>
        </el-col>
      </el-row>
    </el-form>
    
    <el-tabs v-model="activeName" @tab-click="handleClick">
      <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name">
        <el-table :data="getTabData(tab.name)" style="width: 100%">
          <el-table-column label="创建时间" min-width="150">
            <template #default="scope">
              <span>{{ new Date(scope.row.created_at).toLocaleString() }}</span>
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
          <el-table-column label="收货人信息">
            <template #default="scope">
              <span>收货人：{{ scope.row.shipping_address?.username ?? '张三' }}</span><br>
              <span>收货地址：{{ scope.row.shipping_address?.detailAddress ?? '金科' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="scope" style="position: relative">
              <el-button type="primary" @click="goToComment(scope.row)" v-if="scope.row.status === 'completed'">前往评论</el-button>
              <el-button type="success" @click="goToBatchPayment(scope.row)" v-if="scope.row.status === 'paid'">前往付款</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination layout="prev, pager, next" :total="orderStore.pagination.total" style="margin-top: 16px"></el-pagination>
      </el-tab-pane>
    </el-tabs>
    <reviews v-model:visible="showModel" :book_snapshot="currentBookSnapshot" :order-id="Number(currentOrderId)" :seller-id="currentSellerId">
      <p>您的评价已成功提交！</p>
      <p>感谢您的反馈。</p>
    </reviews>
  </div>

</template>

<style scoped>
.filter__order {
  border-radius: 4px;
  background-color: #fff9f9;
  padding: 16px 8px;
}

.order-filter-form {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.order-filter-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.order-filter-form :deep(.el-button) {
  margin-left: 8px;
}
</style>
