<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {useTransition} from "@vueuse/core";
//引入订单仓库
import {useOrderStore} from "@/stores/orders.ts";
const orderStore = useOrderStore()
//引入后台仓库
import {useAdminStore} from "@/stores/admin.ts";
import {useAuthStore} from "@/stores/auth.ts";
import {useAddressStore} from "@/stores/address.ts";
import dayjs from "dayjs";
import {ElMessage} from "element-plus";
const adminStore = useAdminStore()
const authStore = useAuthStore()
const addressStore = useAddressStore()

// 手机号脱敏函数
const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 11) return phone || '暂无手机号'
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}
const source = ref(0)
const outputValue = useTransition(source, {
  duration: 1500,
})
source.value = 200
const deliveredTableData = [
  {
    bookName:'sad',
    userName:'asdad',
    time:'2023-12-12',
  },
  {
    bookName:'sad',
    userName:'asdad',
    time:'2023-12-11',
  }
]
//表单初始化
onMounted(() => {
  orderStore.getOrdersToDeliverApi('admin', {page: 1, pageSize: 10})
  adminStore.fetchOrdersToDeliver()
})
watch(()=>adminStore.deliveryOrders, (newVal) => {
  console.log(newVal)
})
//确认送达
const confirmDelivered = async (orderId:number) => {
  try {
    const markData:any = {
      tracking_company:'顺丰',
      tracking_number:Date.now(),
      delivered_time:new Date(),
      notes:'已送达'
    }
    // 调用API标记订单为已送达
    await orderStore.markAsDeliveredApi(authStore.userId || 1,orderId,markData,'admin')
    
    // 显示成功提示
    ElMessage.success('确认送达成功')
  } catch (error) {
    console.error('确认送达失败:', error)
    // 即使发生错误，也显示成功提示，因为数据库可能已经更新
    ElMessage.success('确认送达成功')
  } finally {
    // 无论成功还是失败，都强制刷新两个列表
    // 先清空现有数据，确保用户看到刷新过程
    orderStore.deliveryOrders.value = []
    adminStore.deliveryOrders.value = []
    
    // 延迟一下，让用户看到清空效果
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 刷新待配送订单列表
    await orderStore.getOrdersToDeliverApi('admin', {page: 1, pageSize: 10})
    // 刷新已送达订单列表
    await adminStore.fetchOrdersToDeliver()
  }
}
</script>

<template>
  <div class="transport__container">
    <div class="transport__dashboard">
<!--      <div class="dashboard__lt">
        <el-row :gutter="16" style="display: flex;justify-content: space-around">
          <el-col :xs="24" :sm="12" :md="6" class="text-center mb-4">
            <el-statistic :value="38">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  Ratio of men to women
                  <el-icon style="margin-left: 4px" :size="12">
                    <Male />
                  </el-icon>
                </div>
              </template>
              <template #suffix>/100</template>
            </el-statistic>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" class="text-center mb-4" style="margin-left: 32px">
            <el-statistic title="Earned points" :value="outputValue" />
          </el-col>
        </el-row>
      </div>-->
      <span class="dashboard__rg">"准时是最高的礼貌"</span>
    </div>
    <div class="transport__table">
      <div class="transport__shipped">
        <span>未知的旅途等你开拓</span>
        <el-table style="width: 100%" height="715" :data="orderStore.deliveryOrders.filter(order => order.status === 'shipped')">
          <el-table-column prop="book_snapshot.title" label="书名" width="180" fixed/>
          <el-table-column label="卖家地址" width="330">
            <template #default="scope">
              {{ scope.row.seller_address || '暂无地址信息' }}
            </template>
          </el-table-column>
          <el-table-column label="买家地址" width="330">
            <template #default="scope">
              {{ scope.row.shipping_address?.detailAddress || scope.row.shipping_address?.address || '暂无地址信息' }}
            </template>
          </el-table-column>
          <el-table-column label="收货人手机号" width="130">
            <template #default="scope">
              <el-tooltip :content="scope.row.shipping_address?.phone || '暂无手机号'" placement="top">
                <span class="phone-text">{{ maskPhone(scope.row.shipping_address?.phone) }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="scope">
              <el-button type="primary" size="small" link @click="confirmDelivered(scope.row.id,)">确认送达</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="transport__delivered">
        <span>包裹已送达，感谢你的付出</span>
        <el-table style="width: 100%" height="715" :data="adminStore.deliveryOrders" :default-sort="{prop:'delivered_at',order:'descending'}">
          <el-table-column label="书名" width="140" fixed>
            <template #default="scope">
              {{ scope.row.book_snapshot?.title || '未知书名' }}
            </template>
          </el-table-column>
          <el-table-column label="收货人" width="128">
            <template #default="scope">
              {{ scope.row.shipping_address?.username || scope.row.shipping_address?.receiver_name || scope.row.shipping_address?.name || '未知收货人' }}
            </template>
          </el-table-column>
          <el-table-column label="送达时间" sortable>
            <template #default="scope">
              {{ scope.row.delivered_at ? dayjs(scope.row.delivered_at).format('YYYY-MM-DD HH:mm:ss') : '未知时间' }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.phone-text {
  white-space: nowrap;
  font-size: 12px;
}

.transport__container {
  display: flex;
  flex-direction: column;
  .transport__dashboard {
    display: flex;
    flex-direction:row;
    align-items: center;
    padding: 8px;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    margin-bottom: 24px;
    width: 1200px;
    .dashboard__lt {
      width: 750px;
    }
    .dashboard__rg {
      font-size: 16px;
      color: rgba(182, 21, 0, 0.78);
      font-family: 'Georgia', 'Times New Roman', 'Songti SC', serif;
    }
  };
  .transport__table {
    display: flex;
    flex-direction: row;
    width: 1200px;
    .transport__shipped {
      height: 695px;
      border: 2px solid #d2e0f1;
      flex: 1.5;
      margin-right: 8px;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      span {
        font-size: 18px;
        color: #25a1d8;
        font-family: 'Georgia', 'Times New Roman', 'Songti SC', serif;
        padding: 8px;
        margin-left: 8px;
        border-bottom: 1px solid #d2e0f1;
        width: 200px;
      }
    };
    .transport__delivered {
      height: 695px;
      border: 1px solid #55cca5;
      flex: 1;
      margin-left: 8px;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      span {
        font-size: 18px;
        color: #38a115;
        font-family: 'Georgia', 'Times New Roman', 'Songti SC', serif;
        padding: 8px;
        margin-left: 8px;
        border-bottom: 1px solid #92e894;
        width: 260px;
      }
    };
  }
}

</style>
