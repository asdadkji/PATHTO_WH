<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import myaddress from '@/components/form/address.vue'
//引入地址仓库
import {useAddressStore} from '@/stores/address.ts'
const addressStore = useAddressStore()
//引入用户仓库
import {useAuthStore} from '@/stores/auth.ts'
const authStore = useAuthStore()
//引入订单仓库
import {useOrderStore} from '@/stores/orders.ts'
const orderStore = useOrderStore()
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

// 监听地址选择变化，更新订单地址
watch(() => addressStore.selectedAddressId, async (newAddressId, oldAddressId) => {
  console.log('========== 地址选择变化 ==========')
  console.log('oldAddressId:', oldAddressId)
  console.log('newAddressId:', newAddressId)
  console.log('orderStore.currentPendingOrderId:', orderStore.currentPendingOrderId)
  
  // 只有在有 pending 订单时才更新
  if (newAddressId && newAddressId !== oldAddressId && orderStore.currentPendingOrderId) {
    const selectedAddress = addressStore.getAddressById(Number(newAddressId))
    if (selectedAddress) {
      console.log('selectedAddress:', selectedAddress)
      const shippingAddress = {
        username: selectedAddress.username,
        phone: selectedAddress.phone,
        detailAddress: selectedAddress.address
      }
      
      console.log('准备更新订单地址:', shippingAddress)
      console.log('订单ID:', orderStore.currentPendingOrderId)
      console.log('用户ID:', authStore.userId)
      
      try {
        const { updateOrderAddress } = await import('@/apis/services/order')
        const res = await updateOrderAddress(authStore.userId!, orderStore.currentPendingOrderId, shippingAddress)
        console.log('更新订单地址成功:', res)
      } catch (e) {
        console.error('更新订单地址失败:', e)
      }
    }
  }
})
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
              <span>某某大学</span>
              <span>{{addr.phone.toString().replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}}</span>
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
