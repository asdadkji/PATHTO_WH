<script setup lang="ts">
import {onMounted, ref, computed} from "vue";
import {useAdminStore} from "@/stores/admin.ts";
import {ElMessage, ElMessageBox} from "element-plus";
import dayjs from "dayjs";
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/el-overlay.css'   // 遮罩层样式
import 'element-plus/theme-chalk/el-button.css'    // 按钮样式
import BuyerDetail from './buyerDetail.vue';
const adminStore = useAdminStore()

//买家列表相关
const selectedBuyerId = ref<number | null>(null)
const buyerDetailVisible = ref(false)
const total = ref(0)

//列表初始化
onMounted(()=>{
  adminStore.fetchBuyers(1, 10)
})

//获取买家列表
const handleBuyerCurrentChange = (val: number) => {
  adminStore.fetchBuyers(val, 10)
}

//打开买家详情
const openBuyerDetail = (buyerId: number) => {
  selectedBuyerId.value = buyerId
  buyerDetailVisible.value = true
}

//关闭买家详情
const closeBuyerDetail = () => {
  buyerDetailVisible.value = false
  selectedBuyerId.value = null
}
</script>

<template>
  <div class="buyerMgt__container">
    <div class="buyerMgt__table">
      <el-table :data="adminStore.buyerList" style="width: 100%" height="715">
        <el-table-column prop="username" label="用户名" width="180" />
        <el-table-column label="手机号" width="180">
          <template #default="scope">
            <el-tooltip :content="scope.row.phone || '无'" placement="top">
              <span v-if="scope.row.phone">
                {{ scope.row.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') }}
              </span>
              <span v-else>无</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="scope">
            <span>{{ dayjs(scope.row.created_at).format('YYYY-MM-DD HH:mm:ss') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="last_login_at" label="上次登录时间" width="180">
          <template #default="scope">
            <span>{{ dayjs(scope.row.last_login_at).format('YYYY-MM-DD HH:mm:ss') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="账号状态" width="180">
          <template #default="scope">
            <el-tag :type="!scope.row.is_banned ? 'success' : 'danger'">
              {{ !scope.row.is_banned ? '正常' : '封禁' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="openBuyerDetail(scope.row.id)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        background layout="prev, pager, next"
        :total="adminStore.total"
        :page-size="10" @current-change="handleBuyerCurrentChange"
        style="margin-top: 24px"
      />
    </div>
    
    <!-- 买家详情弹窗 -->
    <BuyerDetail
      v-if="selectedBuyerId"
      :buyer-id="selectedBuyerId"
      :visible="buyerDetailVisible"
      @close="closeBuyerDetail"
    />
  </div>
</template>

<style scoped lang="scss">
.buyerMgt__container {
  display: flex;
  flex-direction: column;
  .buyerMgt__table {
    width: 100%;
  }
}
</style>