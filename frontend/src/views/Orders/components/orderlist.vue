<script setup lang="ts">
//引入购物车仓库
import {useCartStore} from "@/stores/cart.ts";
const cartStore = useCartStore()
//引入地址仓库
import {useAddressStore} from "@/stores/address.ts";
const addressStore = useAddressStore()
//引入订单仓库
import {useOrderStore} from "@/stores/orders.ts";
const orderStore = useOrderStore()
//引入用户仓库看
import {useAuthStore} from "@/stores/auth.ts";
const authStore = useAuthStore()
//路由
import {useRouter} from "vue-router";
const router = useRouter()
//api
import {createUserOrder} from "@/apis/services/order.ts";
import {ElMessage} from "element-plus";
import {toValue, onMounted} from "vue";

// 初始化cartStore用户数据
onMounted(() => {
  console.log('orderlist onMounted - authStore.userId:', authStore.userId)
  console.log('orderlist onMounted - cartStore.currentUserId:', cartStore.currentUserId)
  console.log('orderlist onMounted - cartStore.selectedItems:', cartStore.selectedItems)
  
  if (authStore.userId && cartStore.currentUserId !== String(authStore.userId)) {
    console.log('orderlist - 切换用户:', authStore.userId)
    cartStore.switchUser(String(authStore.userId))
    console.log('orderlist - 切换后 selectedItems:', cartStore.selectedItems)
  }
})

//提交订单
const handleSubmitOrder = async () => {
  console.log('handleSubmitOrder - selectedItems:', cartStore.selectedItems)
  if (cartStore.selectedItems.length === 0) {
    ElMessage.warning('请选择商品')
    return
  }
  
  // 检查是否有选中的地址
  if (!addressStore.selectedAddressId) {
    ElMessage.warning('请选择收货地址')
    return
  }
  
  // 获取选中的地址信息
  const selectedAddress = addressStore.getAddressById(Number(addressStore.selectedAddressId))
  if (!selectedAddress) {
    ElMessage.error('选中的地址不存在')
    return
  }
  
  // 确保地址已保存到addressStore中
  if (!addressStore.addressList.some(addr => addr.id === selectedAddress.id)) {
    try {
      await addressStore.addAddress({
        userId: authStore?.userId ?? 1,
        username: selectedAddress.username,
        phone: selectedAddress.phone,
        address: selectedAddress.address,
        isDefault: selectedAddress.isDefault
      })
    } catch (e) {
      console.error('保存地址失败:', e)
    }
  }
  
  const paramsList = toValue(cartStore.selectedItems).map(item => ({
    book_id: Number(item.id),
    book_snapshot: item as Record<string, any>,
    seller_id: Number(item.merchantId),
    quantity: Number(item.quantity),
    unit_price: Number(item.price),
    delivery_fee: 4,
    payment_method: 'alipay',
    shipping_address: addressStore.getFormattedAddress(Number(addressStore.selectedAddressId)),
  }))

  try {
    const createdOrders = await orderStore.batchCreateUserOrder(
      authStore?.userId ?? 1,
      paramsList,
      { transaction_method: 'express' }
    )
    if (!createdOrders.length) throw new Error('未生成任何订单')

    const orderIds = createdOrders.map(o => o.id).join(',')

    await router.push({
      name: 'checkout',
      query: {
        orderIds,
        fromCart: 'true'
      },
    })
  } catch (e: any) {
    ElMessage.error(e.message || '下单失败')
  }
}
</script>

<template>
  <div class="product__container">
    <span>商品清单</span>
    
    <!--空状态提示-->
    <div v-if="cartStore.selectedItems.length === 0" class="empty-state">
      <p>暂无商品</p>
      <p>请先去购物车或商品详情页选择商品</p>
      <el-button type="primary" @click="router.push('/cart')">去购物车</el-button>
    </div>
    
    <!--清单列表-按商家分类-->
    <div v-else v-for="(items,key) in cartStore.itemsGroupByMerchant" :key="key" class="product__list">
      <!--具体商品-->
      <div style="display: flex;flex-direction: column">
        <p class="list__title"></p>
        <div v-for="(item,index) in items" :key="index" class="list__item">
          <img src="@assets/images/logo/auth-logo.svg">
          <div style="display: flex; flex-direction: column; justify-content: space-between; flex: 4; padding-left: 24px">
            <span>{{item.title}}</span>
            <span>付款后48小时内发货</span>
          </div>
          <span style="flex: 1;">{{
              {
                new: '全新',
                like_new: '九五品',
                very_good: '九品',
                good: '八品',
                acceptable: '七品',
                poor: '六品'
              }[item.book_condition] || item.book_condition
            }}</span>
          <span style="flex: 1">￥{{item.price}}</span>
          <span style="flex: 2">{{item.quantity}}</span>
          <span style="flex: 1">￥{{item.price}}</span>
        </div>
        <div class="list__price">
          <span v-show="cartStore.discountPrice>0">优惠：-￥{{cartStore.selectCoupons[items[0]!.merchantId]?.discount}}</span>
          <span style="margin-bottom: 16px">运费: ￥4</span>
          <span>合计￥{{Math.floor(cartStore.merchantTotalPrice[key]!*10)/10+4}}</span>
        </div>
      </div>
    </div>
    <div v-if="cartStore.selectedItems.length > 0" class="orders__btn">
      <span>共计{{cartStore.selectedItems.length}}件商品，应付总金额为￥{{Math.floor((cartStore.finalPrice+4)*10)/10}}</span>
      <el-button type="danger" style="width: 120px;height: 60px" @click="handleSubmitOrder">确认并提交订单</el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.product__container {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 8px;
  background: #ffffff;
  .product__list {
    margin: 16px;
    display: flex;
    flex-direction: column;
    border-radius: 4px;
    border: 1px solid #b5b5b5;
    .list__title {
      background: #d0e2ff;
      display: flex;
      justify-content: flex-start;
      padding: 8px 16px;
      border-bottom: 1px solid #e6e4e4;
      span {
        margin-right: 56px;
        margin-left: 16px;
      }
    }
    .list__item {
      padding: 8px 32px;
      display: flex;
      flex-direction: row;
      border-bottom: 1px solid #979797;
      img {
        width: 80px;
        height: 80px;
        border: 1px solid #a8a8a8;
      }
      span {
        display: flex;
        align-items: center;
      }
    }
    .list__price {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      padding-top: 4px;
      padding-right: 90px;
    }
  }
}
.product__container > span {
  font-size: 20px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 24px;
}
.orders__btn {
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  border: 1px solid #f31d1d;
  border-radius: 8px;
  width: 300px;
  margin-top: 24px;
  margin-left: 852px;
  span {
    margin-bottom: 24px;
  }
}
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #f9f9f9;
  border-radius: 8px;
  p {
    margin: 8px 0;
    color: #666;
    font-size: 16px;
  }
  .el-button {
    margin-top: 20px;
  }
}
</style>
