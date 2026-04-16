<script setup lang="ts">
import {onMounted, reactive} from "vue";
//引入后台仓库
import {useAdminStore} from "@/stores/admin.ts";
import dayjs from "dayjs";
import {ElMessageBox} from "element-plus";
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/el-overlay.css'   // 遮罩层样式
import 'element-plus/theme-chalk/el-button.css'
const adminStore = useAdminStore()
//表格数据
const tableData = [
  {
    role:'一级管理员',
    username: '张三',
    lastLoginTime:'2022-01-01',
    status:'正常',
    phone:'1234567890',
  },
  {
    role:'二级管理员',
    username: '张三',
    lastLoginTime:'2022-01-01',
    status:'正常',
    phone:'1234567890',
  },
  {
    role:'运输员',
    username: '张三',
    lastLoginTime:'2022-01-01',
    status:'正常',
    phone:'1234567890',
  },
  {
    role:'一级管理员',
    username: '张三',
    lastLoginTime:'2022-01-01',
    status:'正常',
    phone:'1234567890',
  },
  {
    role:'二级管理员',
    username: '张三',
    lastLoginTime:'2022-01-01',
    status:'正常',
    phone:'1234567890',
  },
  {
    role:'运输员',
    username: '张三',
    lastLoginTime:'2022-01-01',
    status:'正常',
    phone:'1234567890',
  }
]
//表单数据
const formInline = reactive({
  username:'',
  phone:'',
  region:'',
})

//列表初始化
onMounted(()=>{
  adminStore.fetchAdminList()
})

//取消权限
const cancelAdmin = async (userId:number) => {
  await ElMessageBox.confirm('注意！你正在移除该管理员的权限，其将会被移出管理员列表','移除管理员权限')
  console.log(userId)
  await adminStore.cancelAdmin(8,userId)
}
//赋予权限
const giveAdmin = async () => {
  await ElMessageBox.confirm('注意！你正在赋予该用户管理员权限，其将会被加入管理员并履行相应职责','赋予管理员权限')
  const data = {
    username:formInline.username,
    phone:formInline.phone,
  }
  await adminStore.addAdmin(8, data)
}
</script>

<template>
  <div class="userMgt__container">
    <div class="userMgt__add">
      <el-form :inline="true" :model="formInline" class="demo-form-inline">
        <el-form-item label="用户名">
          <el-input v-model="formInline.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="formInline.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-select v-model="formInline.region" placeholder="请选择权限" style="width: 160px" clearable>
          <el-option label="一级管理员" value="一级管理员" style="padding-left: 25%"/>
          <el-option label="二级管理员" value="二级管理员" style="padding-left: 25%"/>
          <el-option label="运输员" value="运输员" style="padding-left: 25%"/>
        </el-select>
        <el-form-item style="margin-left: 16px">
          <el-button type="primary" style="width: 160px" @click="giveAdmin">赋予权限</el-button>
        </el-form-item>
      </el-form>
      <span style="margin-left: 8px;color: #b6001d;font-family: 'Georgia', 'Times New Roman', 'Songti SC', serif;">"伟大的权力意味着伟大的责任"</span>
    </div>
    
    <div class="userMgt__table">
      <el-table :data="adminStore.adminList" style="width: 100%" height="715">
        <el-table-column prop="role" label="权限等级" width="180" fixed>
          <template #default="scope">
            <el-tag style="padding: 0 4px">
              {{ scope.row.role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="180" />
        <el-table-column prop="last_login_at" label="上次登录时间" width="180">
          <template #default="scope">
            <span>{{ dayjs(scope.row.last_login_at).format('YYYY-MM-DD') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="phone" label="手机号" width="180" />
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="cancelAdmin(scope.row.id)">解除权限</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.userMgt__container {
  display: flex;
  flex-direction: column;
  .userMgt__add {
    margin-bottom: 24px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 8px;
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 1250px;
  }
  .userMgt__table {
    width: 100%;
  }
}
.demo-form-inline .el-input {
  --el-input-width: 220px;
}

.demo-form-inline .el-select {
  --el-select-width: 220px;
}
</style>
