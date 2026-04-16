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
//引入用户仓库
import { useAuthStore } from '@/stores/auth.ts'
const authStore = useAuthStore()
//引入ElMessage
import {ElMessage} from 'element-plus'
//引入本地存储工具
import storage from "@/utils/localstorage.ts";
//引入路由
import { useRouter } from 'vue-router';
const router = useRouter();
//引入地址仓库
import { useAddressStore } from '@/stores/address.ts';
const addressStore = useAddressStore();
//引入API服务
import service from '@/apis/http.ts';
//tab配置
const tabs = ref([
  {label:'全部',name:'all'},
  {label:'待付款',name:'confirmed'},
  {label:'待发货',name:'paid'},
  {label:'待收货',name:'delivered'},
  {label:'待评价',name:'completed'},
])
const activeName = ref("all")
const handleClick = (tab: TabsPaneContext) => {
  orderStore.getUserOrdersList(authStore.userId || 1,'seller',1,10,tab.paneName as string)
}
//订单列表初始化
onMounted(async () => {
  // 确保authStore已初始化
  if (!authStore.userId) {
    // 等待authStore初始化
    await new Promise(resolve => {
      const unsubscribe = watch(() => authStore.userId, (newUserId) => {
        if (newUserId) {
          unsubscribe()
          resolve(undefined)
        }
      })
    })
  }
  // 获取全部订单
  orderStore.getUserOrdersList(authStore.userId || 1,'seller',1,10,'all')
  // 预加载其他状态的订单
  orderStore.getUserOrdersList(authStore.userId || 1,'seller',1,10,'confirmed')
  orderStore.getUserOrdersList(authStore.userId || 1,'seller',1,10,'paid')
  orderStore.getUserOrdersList(authStore.userId || 1,'seller',1,10,'shipped')
  orderStore.getUserOrdersList(authStore.userId || 1,'seller',1,10,'delivered')
  orderStore.getUserOrdersList(authStore.userId || 1,'seller',1,10,'completed')
})
//具体订单类容
const orderData = computed(()=>({
  all:orderStore?.allOrdersList,
  confirmed:orderStore?.confirmedOrdersList, // 待付款
  paid:orderStore?.paidOrdersList, // 待发货
  delivered:orderStore?.deliveredOrdersList, // 待收货
  completed:orderStore?.completedOrdersList, // 待评价
}))
//订单、tab映射
const getTabData = (tabName:string) => {
  return (orderData as any).value[tabName] || []
}
const handleShip = async (orderId:number) => {
  try {
    // 获取卖家地址信息
    const userId = authStore.userId || 1;
    const sellerAddresses = addressStore.getAddressList(userId);
    
    if (sellerAddresses.length === 0) {
      // 弹出提示弹窗
      ElMessage.warning('您尚未设置发货地址，无法进行发货操作');
      // 跳转到用户中心的地址管理界面
      router.push('/profile/address');
      return;
    }
    
    // 如果已设置地址，正常执行发货操作
    const result = await orderStore.shipSellerOrderApi(authStore.userId || 1, Number(orderId), '顺丰', Date.now());
    if (result) {
      ElMessage.success('发货成功');
      // 刷新所有相关订单列表
      orderStore.getUserOrdersList(authStore.userId || 1, 'seller', 1, 10, 'all');
      orderStore.getUserOrdersList(authStore.userId || 1, 'seller', 1, 10, 'paid'); // 刷新待发货列表
      orderStore.getUserOrdersList(authStore.userId || 1, 'seller', 1, 10, 'shipped'); // 刷新已发货列表
      orderStore.getUserOrdersList(authStore.userId || 1, 'seller', 1, 10, 'delivered'); // 刷新待收货列表
    } else {
      ElMessage.error('发货失败，请重试');
    }
  } catch (error) {
    console.error('发货失败:', error);
    ElMessage.error('发货失败，请重试');
  }
}

// 线下交易相关
// 从本地存储读取初始值
const offlineTradeEnabled = ref(storage.get('offline_trade_enabled') || false)
const locationInput = ref(storage.get('offline_trade_location') || '')
const locationUpdateCount = ref(storage.get('offline_trade_location_update_count') || 0)
const maxLocationUpdates = 3

// 引入获取商家ID的API
import { getMerchantId } from '@/apis/services/auth.ts'

// 监听值变化，保存到本地存储
watch(offlineTradeEnabled, async (newValue) => {
  storage.set('offline_trade_enabled', newValue)
  // 调用API更新数据库
  try {
    // 先获取商家ID
    const merchantId = await getMerchantId(authStore.userId!)
    await service.patch('/filter/offline-trade', {
      merchantId: merchantId,
      enabled: newValue
    })
    ElMessage.success(newValue ? '线下交易已开启' : '线下交易已关闭')
  } catch (error) {
    console.error('更新线下交易设置失败:', error)
    ElMessage.error('更新线下交易设置失败')
  }
})

watch(locationInput, (newValue) => {
  storage.set('offline_trade_location', newValue)
})

watch(locationUpdateCount, (newValue) => {
  storage.set('offline_trade_location_update_count', newValue)
})

// 检查订单是否为线下交易
const isOfflineTradeOrder = (order: any) => {
  return order.transaction_method && order.transaction_method === 'face_to_face'
}

// 确认线下交易完成
const confirmOfflineTrade = (orderId: number) => {
  // 这里应该调用API更新订单状态
  ElMessage.success('线下交易已标记为完成')
  // 刷新订单列表
  orderStore.getUserOrdersList(authStore.userId || 1,'seller',1,10,activeName.value)
}

// 确认线下交易收货
const confirmOfflineReceipt = async (orderId: number) => {
  try {
    // 调用API更新订单状态为completed
    const result = await orderStore.updateOrderStatus(authStore.userId || 1, orderId, 'seller', 'completed');
    if (result) {
      ElMessage.success('确认收货成功');
      // 刷新订单列表
      orderStore.getUserOrdersList(authStore.userId || 1, 'seller', 1, 10, 'all');
      orderStore.getUserOrdersList(authStore.userId || 1, 'seller', 1, 10, 'delivered');
      orderStore.getUserOrdersList(authStore.userId || 1, 'seller', 1, 10, 'completed');
    } else {
      ElMessage.error('确认收货失败，请重试');
    }
  } catch (error) {
    console.error('确认收货失败:', error);
    ElMessage.error('确认收货失败，请重试');
  }
}

// 处理交易地点修改
const handleLocationChange = () => {
  if (locationUpdateCount.value >= maxLocationUpdates) {
    ElMessage.warning('交易地点每年最多修改3次')
    return
  }
  // 这里应该调用API保存交易地点
  locationUpdateCount.value++
  ElMessage.success('交易地点已更新')
}

watch(()=>orderStore.orders,(newVal)=>{
  console.log(newVal)
})
</script>

<template>
  <div class="filter__order">
    <!-- 线下交易设置 -->
    <div class="offline-trade-settings">
      <h3>线下交易设置</h3>
      <div class="setting-item">
        <span>支持线下交易：</span>
        <el-switch v-model="offlineTradeEnabled" />
      </div>
      <div class="setting-item" v-if="offlineTradeEnabled">
        <span>交易地点：</span>
        <el-input v-model="locationInput" placeholder="请输入交易地点" style="width: 300px" />
        <el-button type="primary" @click="handleLocationChange" style="margin-left: 10px">保存</el-button>
        <span class="location-update-hint">交易地点每年可修改3次（已修改{{ locationUpdateCount }}次）</span>
      </div>
    </div>
    
    <el-tabs v-model="activeName" @tab-click="handleClick">
      <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name">
        <el-table :data="getTabData(tab.name)" style="width: 100%">

          <el-table-column label="图书名称">
            <template #default="scope">
              <div>
                <span style="font-weight: bold">{{ scope.row.book_snapshot?.title }}</span>
                <el-tag v-if="isOfflineTradeOrder(scope.row)" type="danger" size="small" effect="dark" style="margin-left: 10px; font-weight: bold;">线下交易</el-tag>
              </div>
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
                v-show="!isOfflineTradeOrder(scope.row) && scope.row.status === 'paid' && scope.row.payment_status === 'paid'"
                link
              >
                确认发货
              </el-button>
              <el-button
                type="success"
                @click="confirmOfflineTrade(scope.row.id)"
                v-show="isOfflineTradeOrder(scope.row) && scope.row.status === 'confirmed'"
                link
              >
                确认线下交易
              </el-button>
              <el-button
                type="success"
                @click="confirmOfflineReceipt(scope.row.id)"
                v-show="isOfflineTradeOrder(scope.row) && scope.row.status !== 'completed'"
                link
              >
                确认买家收货
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

.offline-trade-settings {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 20px;
  h3 {
    margin-top: 0;
    margin-bottom: 16px;
    color: #333;
  }
  .setting-item {
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    span {
      margin-right: 10px;
      min-width: 80px;
    }
  }
  .location-update-hint {
    margin-left: 10px;
    font-size: 12px;
    color: #666;
  }
}
</style>
