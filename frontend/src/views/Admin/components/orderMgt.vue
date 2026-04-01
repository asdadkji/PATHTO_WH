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
//引入auth仓库
import {useAuthStore} from '@/stores/auth.ts'
const authStore = useAuthStore()
//引入admin仓库
import {useAdminStore} from '@/stores/admin.ts'
const adminStore = useAdminStore()
//引入用户仓库
import { useUserStore } from '@/stores/user.ts'
const userStore = useUserStore()
//引入用户API
import { getUserInfo } from '@/apis/services/user.ts'
//用户信息缓存
const userInfoCache = ref<Record<number, any>>({})
//获取用户信息
const fetchUserInfo = async (userId: number) => {
  if (userInfoCache.value[userId]) {
    return userInfoCache.value[userId]
  }
  try {
    const userInfo = await getUserInfo(userId)
    userInfoCache.value[userId] = userInfo
    return userInfo
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return { username: `用户${userId}` }
  }
}
//批量获取用户信息
const fetchUsersInfo = async (userIds: number[]) => {
  const promises = userIds.map(id => fetchUserInfo(id))
  await Promise.all(promises)
}
//tab配置
const tabs = ref([
  {label:'全部',name:'all'},
  {label:'待确认',name:'pending'},
  {label:'待付款',name:'confirmed'},
  {label:'待发货',name:'paid'},
  {label:'待收货',name:'delivered'},
  {label:'待评价',name:'completed'},
  {label:'已取消',name:'cancelled'}
])
const activeName = ref("all")
const handleClick = (tab: TabsPaneContext) => {
  orderStore.getUserOrdersList(0, 'admin', 1, 10, tab.paneName as string)
}
//订单列表初始化
onMounted(() => {
  orderStore.getUserOrdersList(0, 'admin', 1, 10, 'all')
})
//具体订单类容
const orderData = computed(()=>({
  all:orderStore?.orders,
  pending:orderStore?.pendingOrdersList,
  confirmed:orderStore?.confirmedOrdersList,
  paid:orderStore?.paidOrdersList,
  shipped:orderStore?.shippedOrdersList,
  delivered:orderStore?.deliveredOrdersList,
  completed:orderStore?.completedOrdersList,
  cancelled:orderStore?.cancelledOrdersList,
}))
//订单、tab映射
const getTabData = (tabName:string) => {
  return (orderData as any).value[tabName] || []
}
//取消订单
const handleCancelOrder = async (orderId:number) => {
  try {
    await orderStore.cancelOrderApi(authStore.userId || 0, Number(orderId), 'admin')
    alert('订单已取消')
    // 重新获取订单列表
    orderStore.getUserOrdersList(0, 'admin', 1, 10, activeName.value)
  } catch (e:any) {
    alert(e.message || '取消订单失败')
  }
}
//查看订单详情
const orderDetail = ref<any>(null)
const showDetail = ref(false)
const handleViewDetail = (order:any) => {
  orderDetail.value = order
  showDetail.value = true
}
watch(()=>orderStore.orders,(newVal)=>{
  console.log(newVal)
  // 当订单数据更新时，获取相关用户信息
  if (newVal && newVal.length > 0) {
    const userIds = new Set<number>()
    newVal.forEach(order => {
      userIds.add(order.buyer_id)
      userIds.add(order.seller_id)
    })
    fetchUsersInfo(Array.from(userIds))
  }
})
</script>

<template>
  <div class="filter__order">
    <el-tabs v-model="activeName" @tab-click="handleClick">
      <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name">
        <el-table :data="getTabData(tab.name)" style="width: 100%">
          <el-table-column label="订单号" min-width="180">
            <template #default="scope">
              <span>{{ scope.row.order_number}}</span>
            </template>
          </el-table-column>
          <el-table-column label="图书信息" min-width="200">
            <template #default="scope">
              <div style="display: flex; align-items: center">
                <el-image v-if="scope.row.book_snapshot?.cover_image" fit="cover" style="width: 60px;height: 80px; margin-right: 10px" :src="scope.row.book_snapshot.cover_image"/>
                <div style="flex: 1">
                  <div style="font-weight: bold; margin-bottom: 4px">{{ scope.row.book_snapshot?.title }}</div>
                  <div style="font-size: 12px; color: #666">{{ scope.row.book_snapshot?.author }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="订单金额" min-width="120">
            <template #default="scope">
              <div style="display: flex;flex-direction: column">
                <span style="font-size: 12px; color: #666">订单总额</span>
                <span style="color: red; font-weight: bold">￥{{ scope.row.final_price }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="买家" min-width="120">
            <template #default="scope">
              <span>{{ userInfoCache[scope.row.buyer_id]?.username || `用户${scope.row.buyer_id}` }}</span>
            </template>
          </el-table-column>
          <el-table-column label="卖家" min-width="120">
            <template #default="scope">
              <span>{{ userInfoCache[scope.row.seller_id]?.username || `用户${scope.row.seller_id}` }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" min-width="100">
            <template #default="scope">
              <el-tag :type="{
                'pending': 'warning',
                'confirmed': 'info',
                'paid': 'primary',
                'shipped': 'success',
                'delivered': 'success',
                'completed': 'success',
                'cancelled': 'danger'
              }[scope.row.status as string] || 'info'">
                {{ {
                  'pending': '待确认',
                  'confirmed': '待付款',
                  'paid': '待发货',
                  'shipped': '已发货',
                  'delivered': '待收货',
                  'completed': '已完成',
                  'cancelled': '已取消'
                }[scope.row.status as string] || '未知' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" min-width="150">
            <template #default="scope">
              <span>{{ new Date(scope.row.created_at).toLocaleString() }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="150">
            <template #default="scope">
              <el-button
                type="primary"
                @click="handleViewDetail(scope.row)"
                link
              >
                查看详情
              </el-button>
              <el-button
                type="danger"
                @click="handleCancelOrder(scope.row.id)"
                v-show="['pending', 'confirmed', 'paid'].includes(scope.row.status)"
                link
              >
                取消订单
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination layout="prev, pager, next" :total="orderStore.pagination.total" style="margin-top: 16px"></el-pagination>
      </el-tab-pane>
    </el-tabs>

    <!-- 订单详情弹窗 -->
    <el-dialog
      v-model="showDetail"
      title="订单详情"
      width="800px"
    >
      <div v-if="orderDetail" class="order-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">{{ orderDetail.order_number }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="{
              'pending': 'warning',
              'confirmed': 'info',
              'paid': 'primary',
              'shipped': 'success',
              'delivered': 'success',
              'completed': 'success',
              'cancelled': 'danger'
            }[orderDetail.status as string] || 'info'">
              {{ {
                'pending': '待确认',
                'confirmed': '待付款',
                'paid': '待发货',
                'shipped': '已发货',
                'delivered': '待收货',
                'completed': '已完成',
                'cancelled': '已取消'
              }[orderDetail.status as string] || '未知' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="图书信息">
            <div style="display: flex; align-items: center">
              <el-image v-if="orderDetail.book_snapshot?.cover_image" fit="cover" style="width: 100px;height: 120px; margin-right: 20px" :src="orderDetail.book_snapshot.cover_image"/>
              <div>
                <h4 style="margin: 0 0 8px 0">{{ orderDetail.book_snapshot?.title }}</h4>
                <p style="margin: 0 0 4px 0; color: #666">{{ orderDetail.book_snapshot?.author }}</p>
                <p style="margin: 0; color: #999">{{ orderDetail.book_snapshot?.condition }}</p>
              </div>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="订单金额">
            <div>
              <p>商品金额：￥{{ orderDetail.total_price }}</p>
              <p>运费：￥{{ orderDetail.delivery_fee }}</p>
              <p style="font-weight: bold">实付金额：￥{{ orderDetail.final_price }}</p>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="交易方式">{{ orderDetail.transaction_method === 'face_to_face' ? '当面交易' : '快递配送' }}</el-descriptions-item>
          <el-descriptions-item label="买家信息">
            <div>
              <p>买家ID：{{ orderDetail.buyer_id }}</p>
              <p>买家昵称：{{ userInfoCache[orderDetail.buyer_id]?.username || `用户${orderDetail.buyer_id}` }}</p>
              <p v-if="orderDetail.meeting_location">交易地点：{{ orderDetail.meeting_location }}</p>
              <p v-if="orderDetail.meeting_time">交易时间：{{ orderDetail.meeting_time }}</p>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="卖家信息">
            <div>
              <p>卖家ID：{{ orderDetail.seller_id }}</p>
              <p>卖家昵称：{{ userInfoCache[orderDetail.seller_id]?.username || `用户${orderDetail.seller_id}` }}</p>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="物流信息" v-if="orderDetail.transaction_method === 'shipping'">
            <div>
              <p v-if="orderDetail.tracking_company">快递公司：{{ orderDetail.tracking_company }}</p>
              <p v-if="orderDetail.tracking_number">物流单号：{{ orderDetail.tracking_number }}</p>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="订单备注">
            <div>
              <p v-if="orderDetail.buyer_note">买家备注：{{ orderDetail.buyer_note }}</p>
              <p v-if="orderDetail.seller_note">卖家备注：{{ orderDetail.seller_note }}</p>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ new Date(orderDetail.created_at).toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ new Date(orderDetail.updated_at).toLocaleString() }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.filter__order {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.order-detail {
  max-height: 600px;
  overflow-y: auto;
}
</style>
