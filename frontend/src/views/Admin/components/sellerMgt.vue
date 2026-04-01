<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
//引入后台仓库
import {useAdminStore} from "@/stores/admin.ts";
import {type Action, ElMessage, ElMessageBox} from "element-plus";
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/el-overlay.css'   // 遮罩层样式
import 'element-plus/theme-chalk/el-button.css'    // 按钮样式
const adminStore = useAdminStore()
//筛选搜索
const search = ref('')
const filterTableData = computed(() =>
  adminStore.shopList.filter(
    (data) =>
      !search.value ||
      data.shop_name.toLowerCase().includes(search.value.toLowerCase())
  )
)
const tableRowClassName = ({row, rowIndex,}: {
  row: any
  rowIndex: number
}) => {
  if (rowIndex === 1) {
    return 'warning-row'
  } else if (rowIndex === 3) {
    return 'success-row'
  }
  return ''
}
//table初始化
onMounted(() => {
  adminStore.fetchSellers(1,10)
})
//分页
const handleCurrentChange = (val: number) => {
  adminStore.fetchSellers(val,10)
}
//冻结商家权限
const handleFreeze = async (id:number,reason:string) => {
  if(!reason) {
    ElMessage.warning('请输入冻结理由')
    return
  }
  await ElMessageBox.confirm('注意！你正在冻结该商家相关权限，所有该商家的图书都会暂时下架，请确保你有足够的理由这样做，并自愿承担相应后果','冻结商家权限')
  await adminStore.freezeSeller(id,reason)
  console.log('冻结商家权限成功')
}
//解冻商家权限
const handleUnfreeze = async (id:number) => {
  await ElMessageBox.confirm('注意！你正在解冻该商家相关权限，请确保该商家符合解冻权限要求','解冻商家权限', )
  await adminStore.unfreezeSeller(id)
}
</script>

<template>
  <div class="sellerMgt__container">
    <el-table :data="filterTableData" style="width: 100%;" height="715" :row-class-name="tableRowClassName">
      <el-table-column prop="shop_name" label="商家名" width="180" />
      <el-table-column prop="contact_phone" label="手机号" width="180" />
      <el-table-column prop="reason" label="封禁原因" width="380">
        <template #default="scope">
          <el-input placeholder="请写入你封禁该商家的原因" v-model="scope.row.reason" :disabled="scope.row.status === 2"></el-input>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="right">
        <template #header>
          <el-input placeholder="请输入商家名称查询" v-model="search"/>
        </template>
        <template #default="scope">
          <el-button type="danger" style="width: 120px" v-if="scope.row.status === 1" @click="handleFreeze(scope.row.id,scope.row.reason)">封禁</el-button>
          <el-button type="success" style="width: 120px" v-else @click="handleUnfreeze(scope.row.id)">解封</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      background layout="prev, pager, next"
      :total="adminStore.shopList.length"
      :page-size="10" @current-change="handleCurrentChange"
      style="margin-top: 24px"
    />
  </div>
</template>

<style scoped lang="scss">
.sellerMgt__container {
  display: flex;
  flex-direction: column;
}
.el-table .warning-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
}
.el-table .success-row {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
}
</style>
