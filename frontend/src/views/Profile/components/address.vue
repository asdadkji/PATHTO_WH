<script setup lang="ts">
import {onMounted, ref} from "vue";
//导入地址仓库
import {useAddressStore} from '@/stores/address.ts'
const addressStore = useAddressStore()
//引入表单组件
import addresses from '@/components/form/address.vue'
//ts
import type{updateAddress} from "@/types/store/address.ts"
//引入auth仓库
import { useAuthStore } from '@/stores/auth.ts'
const authStore = useAuthStore()
//判定是否展示表单
const isShowAddress = ref(false)
//关闭表单
const handleCloseAddress = () => {
  isShowAddress.value = false
  editingAddress.value = null
}
//展示地址
onMounted(()=>{
  const userId = authStore.userId || 1
  addressStore.getAddressList(userId)
})
//两种模式
const currentMode = ref<'create' | 'edit'>('create')
//修改模式下传递的最终数据
const editingAddress = ref<updateAddress | null>(null)
//以修改模式打开表单
const openEditForm = (address:updateAddress) => {
  currentMode.value = 'edit'
  isShowAddress.value = true
  editingAddress.value = address
}
//以创建模式打开表单
const openAddForm = () => {
  currentMode.value = 'create'
  isShowAddress.value = true
  editingAddress.value = null
}
//提交表单
const handleSubmit = (formData:any) => {
  if (currentMode.value === 'create') {
    addressStore.addAddress(formData)
  } else {
    addressStore.updateAddress(formData.id,formData)
  }
  handleCloseAddress()
}
</script>

<template>
  <div style="display: flex; justify-content: flex-end; margin-bottom: 20px">
    <el-button type="danger" @click="openAddForm">新增收货地址</el-button>
  </div>
  <el-table :data="addressStore?.addressList" style="width: 100%" border>
    <el-table-column label="收货人" property="username"></el-table-column>
    <el-table-column label="手机">
      <template #default="scope">
        {{ scope.row.phone.toString().replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') }}
      </template>
    </el-table-column>
    <el-table-column label="地区">
      <span>某某大学</span>
    </el-table-column>
    <el-table-column label="详细地址" property="address" show-overflow-tooltip></el-table-column>
    <el-table-column label="标识">
      <template #default="scope">
        <el-tag v-if="scope.row.isDefault" type="success" size="small">默认收货地址</el-tag>
        <el-tag v-if="scope.row.isShippingAddress" type="warning" size="small" style="margin-left: 8px">发货地址</el-tag>
      </template>
    </el-table-column>
    <el-table-column label="操作">
      <template #default="{row}">
        <el-button link type="primary" size="small" @click="openEditForm(row)">编辑</el-button>
        <el-button link type="primary" size="small" @click="addressStore.deleteAddress(row.id)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
  <!--创建模式-->
  <addresses v-if="isShowAddress && currentMode === 'create'" @close="handleCloseAddress" @submit="handleSubmit" :mode="currentMode"></addresses>
  <!--编辑模式-->
  <addresses v-if="isShowAddress && currentMode === 'edit'" @close="handleCloseAddress" @submit="handleSubmit" :mode="currentMode" :original-data="editingAddress"></addresses>
</template>

<style scoped>

</style>
