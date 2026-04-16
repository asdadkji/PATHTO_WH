<script setup lang="ts">
import {onMounted, ref,} from "vue";
import myaddress from '@/components/form/address.vue'
//引入地址仓库
import {useAddressStore} from '@/stores/address.ts'
const addressStore = useAddressStore()
//引入用户仓库
import {useAuthStore} from '@/stores/auth.ts'
const authStore = useAuthStore()
//ts
import type{updateAddress} from "@/types/store/address.ts"
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
  addressStore.initSelectedAddress()
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
  <div class="address__container">
    <span>收货地址</span>
    <!--创建模式-->
    <myaddress v-if="isShowAddress && currentMode === 'create'" @close="handleCloseAddress" @submit="handleSubmit" :mode="currentMode"></myaddress>
    <!--编辑模式-->
    <myaddress v-if="isShowAddress && currentMode === 'edit'" @close="handleCloseAddress" @submit="handleSubmit" :mode="currentMode" :original-data="editingAddress"></myaddress>
    <div class="address-select">
      <el-radio-group
        v-model="addressStore.selectedAddressId"
        style="margin-bottom: 16px; display: flex; flex-direction: column; align-items: flex-start"
      >
        <el-radio
          :value="addr.id"
          :label="addr.id"
          size="large"
          border
          style="margin-bottom: 16px; height: 70px; width: 100%"
          v-for="addr in addressStore.addressList" :key="addr.id"
        >
          <div class="select__item">
            <div class="select__item__info">
              <span>{{addr.username}}</span>
              <span>金陵科技学院</span>
              <span>{{addr.phone}}</span>
              <span>{{addr.address}}</span>
            </div>
            <span @click.prevent="openEditForm(addr)">修改</span>
          </div>
        </el-radio>
      </el-radio-group>
      <div class="select__btn">
        <el-button style="width: 120px; padding: 8px" @click="openAddForm">新增收货地址</el-button>
        <el-button style="width: 120px; padding: 8px"><router-link to="profile/address">管理收货地址</router-link></el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.address__container {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 8px;
  background: #ffffff;
  span {
    font-size: 20px;
    font-weight: 700;
    color: #333333;
    margin-bottom: 24px;
  }
}
.address-select {
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  .select__item {
    margin-left: 16px;
    display: flex;
    justify-content: space-between;
    width: 1000px;
    align-items: center;
    .select__item__info {
      display: flex;
      flex-wrap: wrap;
      span {
        flex: 0 0 49%;
        font-size: 14px;
        color: #333333;
        font-weight: normal;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
      }
    }
    span {
      font-size: 14px;
      color: #346caa;
      font-weight: normal;
      margin-bottom: 0;
    }
  }
  .select__btn {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
