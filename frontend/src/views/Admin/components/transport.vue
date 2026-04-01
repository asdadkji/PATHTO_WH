<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {useTransition} from "@vueuse/core";
//引入订单仓库
import {useOrderStore} from "@/stores/orders.ts";
const orderStore = useOrderStore()
//引入后台仓库
import {useAdminStore} from "@/stores/admin.ts";
import dayjs from "dayjs";
const adminStore = useAdminStore()
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
const confirmDelivered = (orderId:number) => {
  const markData:any = {
    tracking_company:'顺丰',
    tracking_number:123456,
    delivered_time:new Date(),
    notes:'已送达'
  }
  orderStore.markAsDeliveredApi(8,orderId,markData,'admin')
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
        <el-table style="width: 100%" height="715" :data="orderStore.deliveryOrders">
          <el-table-column prop="book_snapshot.title" label="书名" width="180" fixed/>
          <el-table-column prop="addresses" label="运输地址" width="330">
            <template #default="scope">
              {{ scope.row.shipping_address.address }}————>{{scope.row.receiver_address}}
            </template>
          </el-table-column>
          <el-table-column prop="receiver_phone" label="收货人手机号" width="120" />
          <el-table-column label="操作" width="80">
            <template #default="scope">
              <el-button type="primary" size="small" link @click="confirmDelivered(scope.row.id,)">确认送达</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="transport__delivered">
        <span>包裹已送达，感谢你的付出</span>
        <el-table style="width: 100%" height="715" :data="adminStore.deliveryOrders" :default-sort="{prop:'time',order:'descending'}">
          <el-table-column prop="book_snapshot.title" label="书名" width="140" fixed/>
          <el-table-column prop="receiver_name" label="收货人" width="128"/>
          <el-table-column label="送达时间" sortable>
            <template #default="scope">
              {{ dayjs(scope.row.shipped_at).format('YYYY-MM-DD') }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
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
