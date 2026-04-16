<script setup lang="ts">
import {ref, onMounted} from "vue";
import {useAdminStore} from "@/stores/admin.ts";
import {ElMessage, ElMessageBox, ElIcon} from "element-plus";
import {Loading} from "@element-plus/icons-vue";
import dayjs from "dayjs";
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/el-overlay.css'   // 遮罩层样式
import 'element-plus/theme-chalk/el-button.css'    // 按钮样式

const adminStore = useAdminStore()
const props = defineProps<{
  buyerId: number
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const reason = ref('')

onMounted(() => {
  if (props.buyerId) {
    adminStore.fetchBuyerDetail(props.buyerId)
  }
})

const handleClose = () => {
  emit('close')
}

const handleDelete = async () => {
  if(!reason.value) {
    ElMessage.warning('请输入注销理由')
    return
  }
  await ElMessageBox.confirm('注意！你正在注销该买家账号，该操作不可恢复，请确保你有足够的理由这样做，并自愿承担相应后果','注销买家账号')
  await adminStore.deleteBuyer(props.buyerId, reason.value)
  handleClose()
}

const handleBan = async () => {
  console.log('开始封禁账号，reason:', reason.value)
  if(!reason.value) {
    ElMessage.warning('请输入封禁理由')
    return
  }
  try {
    console.log('显示确认对话框')
    await ElMessageBox.confirm('注意！你正在封禁该买家账号，该账号将无法登录，请确保你有足够的理由这样做，并自愿承担相应后果','封禁买家账号')
    console.log('用户确认封禁，调用banBuyer方法')
    await adminStore.banBuyer(props.buyerId, reason.value)
    console.log('封禁成功，调用handleClose')
    handleClose()
  } catch (error) {
    console.log('封禁操作被取消或失败:', error)
  }
}

const handleUnban = async () => {
  console.log('开始解封账号')
  try {
    console.log('显示确认对话框')
    await ElMessageBox.confirm('注意！你正在解封该买家账号，请确保该买家符合解封要求','解封买家账号')
    console.log('用户确认解封，调用unbanBuyer方法')
    await adminStore.unbanBuyer(props.buyerId)
    console.log('解封成功，调用handleClose')
    handleClose()
  } catch (error) {
    console.log('解封操作被取消或失败:', error)
  }
}
</script>

<template>
  <el-dialog
    v-model="props.visible"
    title="买家详情"
    width="500px"
    @close="handleClose"
  >
    <div v-if="adminStore.buyerDetail" class="buyer-detail">
      <el-form :model="adminStore.buyerDetail" label-width="120px">
        <el-form-item label="用户名">
          <span>{{ adminStore.buyerDetail.username }}</span>
        </el-form-item>
        <el-form-item label="手机号">
          <span>{{ adminStore.buyerDetail.phone }}</span>
        </el-form-item>
        <el-form-item label="邮箱">
          <span>{{ adminStore.buyerDetail.email }}</span>
        </el-form-item>
        <el-form-item label="注册时间">
          <span>{{ dayjs(adminStore.buyerDetail.created_at).format('YYYY-MM-DD HH:mm:ss') }}</span>
        </el-form-item>
        <el-form-item label="上次登录时间">
          <span>{{ dayjs(adminStore.buyerDetail.last_login_at).format('YYYY-MM-DD HH:mm:ss') }}</span>
        </el-form-item>
        <el-form-item label="账号状态">
          <el-tag :type="!adminStore.buyerDetail.is_banned ? 'success' : 'danger'">
            {{ !adminStore.buyerDetail.is_banned ? '正常' : '封禁' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="处理原因">
          <el-input
            type="textarea"
            v-model="reason"
            placeholder="请输入处理原因"
            rows="3"
          />
        </el-form-item>
      </el-form>
    </div>
    <div v-else class="loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleDelete">注销账号</el-button>
        <el-button type="danger" v-if="!adminStore.buyerDetail?.is_banned" @click="handleBan">封禁账号</el-button>
        <el-button type="success" v-else @click="handleUnban">解封账号</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.buyer-detail {
  margin-bottom: 20px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #909399;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>