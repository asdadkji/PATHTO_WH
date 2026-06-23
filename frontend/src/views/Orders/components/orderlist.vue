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
import {useRouter, useRoute} from "vue-router";
const router = useRouter()
const route = useRoute()
//api
import {createUserOrder} from "@/apis/services/order.ts";
import {ElMessage} from "element-plus";
import {toValue, onMounted, ref, watch} from "vue";

// 保存创建好的订单ID
const createdOrderIds = ref<string[]>([])
// 标记订单是否已创建
const ordersCreated = ref(false)

// 生成购物车的唯一标识（用于防重复创建）
const getCartIdentifier = () => {
  if (!authStore.userId || cartStore.selectedItems.length === 0) {
    return null
  }
  
  const itemsKey = cartStore.selectedItems
    .map(item => `${item.id}-${item.quantity}`)
    .sort()
    .join('_')
  
  return `cart_${authStore.userId}_${itemsKey}`
}

// 检查是否已经为当前购物车创建过订单
const hasCreatedOrdersForCurrentCart = () => {
  const identifier = getCartIdentifier()
  if (!identifier) {
    return false
  }
  
  const saved = localStorage.getItem('order_created_carts')
  if (!saved) {
    return false
  }
  
  const createdCarts = JSON.parse(saved)
  return createdCarts.includes(identifier)
}

// 标记当前购物车已创建订单
const markCartAsCreated = () => {
  const identifier = getCartIdentifier()
  if (!identifier) {
    return
  }
  
  let createdCarts: string[] = []
  const saved = localStorage.getItem('order_created_carts')
  if (saved) {
    createdCarts = JSON.parse(saved)
  }
  
  if (!createdCarts.includes(identifier)) {
    createdCarts.push(identifier)
    // 只保留最近10个，避免localStorage过大
    if (createdCarts.length > 10) {
      createdCarts = createdCarts.slice(-10)
    }
    localStorage.setItem('order_created_carts', JSON.stringify(createdCarts))
    console.log('markCartAsCreated - 标记购物车:', identifier)
  }
}

// 初始化cartStore用户数据并创建订单
onMounted(async () => {
  console.log('========== orderlist onMounted 开始 ==========')
  console.log('route.query:', route.query)
  console.log('authStore.userId:', authStore.userId)
  console.log('cartStore.currentUserId:', cartStore.currentUserId)
  console.log('cartStore.selectedItems.length:', cartStore.selectedItems.length)
  console.log('cartStore.selectedItems:', cartStore.selectedItems)
  console.log('ordersCreated.value:', ordersCreated.value)
  
  if (authStore.userId && cartStore.currentUserId !== String(authStore.userId)) {
    console.log('orderlist - 切换用户:', authStore.userId)
    cartStore.switchUser(String(authStore.userId))
    console.log('orderlist - 切换后 selectedItems:', cartStore.selectedItems)
  }

  // 首先加载地址！！
  if (authStore.userId) {
    console.log('>>>>>>>>>>>> 加载地址 <<<<<<<<<<<<')
    addressStore.getAddressList(authStore.userId)
    console.log('addressStore.addressList:', addressStore.addressList)
    
    // 直接使用第一个地址作为默认选中
    if (addressStore.addressList.length > 0 && !addressStore.selectedAddressId) {
      addressStore.selectAddress(addressStore.addressList[0].id)
      console.log('>>>>>>>>>>>> 默认选中第一个地址 <<<<<<<<<<<<')
      console.log('addressStore.selectedAddressId:', addressStore.selectedAddressId)
    }
  }

  // 检查是否有商品，如果有，进入页面时就创建订单
  const alreadyCreated = hasCreatedOrdersForCurrentCart()
  console.log('检查是否应该创建订单:', cartStore.selectedItems.length > 0, !ordersCreated.value, !alreadyCreated)
  if (cartStore.selectedItems.length > 0 && !ordersCreated.value && !alreadyCreated) {
    console.log('>>>>>>>>>>>> 准备调用 createOrdersOnEnter() <<<<<<<<<<<<')
    await createOrdersOnEnter()
  } else if (alreadyCreated) {
    console.log('该购物车已创建过订单，跳过重复创建')
    ElMessage.info('订单已存在，请继续完成支付')
    // 尝试从后端获取当前用户的 pending 订单并恢复
    if (authStore.userId) {
      try {
        await orderStore.getUserOrdersList(authStore.userId, 'buyer', 1, 100, '')
        console.log('orderStore.orders:', orderStore.orders)
        const pendingOrder = orderStore.orders.find(o => o.status === 'pending')
        if (pendingOrder) {
          orderStore.currentPendingOrderId = pendingOrder.id
          createdOrderIds.value = [String(pendingOrder.id)]
          ordersCreated.value = true
          console.log('恢复 pending 订单成功:', pendingOrder.id)
        }
      } catch (e) {
        console.error('获取订单列表失败:', e)
      }
    }
  } else {
    console.log('未满足创建订单条件')
  }
  console.log('========== orderlist onMounted 结束 ==========')
})

// 进入页面时创建订单
const createOrdersOnEnter = async () => {
  console.log('========== createOrdersOnEnter 开始 ==========')
  console.log('createOrdersOnEnter - selectedItems:', cartStore.selectedItems)
  console.log('createOrdersOnEnter - selectedItems.length:', cartStore.selectedItems.length)
  console.log('createOrdersOnEnter - addressStore.selectedAddressId:', addressStore.selectedAddressId)
  console.log('createOrdersOnEnter - addressStore.addressList:', addressStore.addressList)
  
  if (cartStore.selectedItems.length === 0) {
    console.log('createOrdersOnEnter - 没有选中商品，直接返回')
    return
  }
  
  // 如果没有选中地址，使用第一个地址
  if (!addressStore.selectedAddressId) {
    if (addressStore.addressList.length > 0) {
      console.log('createOrdersOnEnter - 没有选中地址，使用第一个地址')
      addressStore.selectAddress(addressStore.addressList[0].id)
    } else {
      console.log('createOrdersOnEnter - 没有可用地址，等待用户选择')
      return
    }
  }
  
  // 获取选中的地址信息
  const selectedAddress = addressStore.getAddressById(Number(addressStore.selectedAddressId))
  if (!selectedAddress) {
    console.log('createOrdersOnEnter - 选中的地址不存在')
    return
  }
  
  console.log('createOrdersOnEnter - 使用地址:', selectedAddress)
  
  console.log('createOrdersOnEnter - 准备构建 paramsList')
  const paramsList = toValue(cartStore.selectedItems).map(item => ({
    book_id: Number(item.id),
    book_snapshot: item as Record<string, any>,
    seller_id: Number(item.seller_id),
    quantity: Number(item.quantity),
    unit_price: Number(item.price),
    delivery_fee: 4,
    payment_method: 'alipay',
    shipping_address: addressStore.getFormattedAddress(Number(addressStore.selectedAddressId)),
  }))
  console.log('createOrdersOnEnter - paramsList:', paramsList)

  try {
    console.log('>>>>>>>>>>>> 调用 orderStore.batchCreateUserOrder() <<<<<<<<<<<<')
    const createdOrders = await orderStore.batchCreateUserOrder(
      authStore?.userId ?? 1,
      paramsList,
      { transaction_method: 'express' }
    )
    console.log('createOrdersOnEnter - batchCreateUserOrder 返回:', createdOrders)
    if (createdOrders.length > 0) {
      createdOrderIds.value = createdOrders.map(o => String(o.id))
      ordersCreated.value = true
      orderStore.currentPendingOrderId = createdOrders[0].id
      markCartAsCreated()
      console.log('createOrdersOnEnter - 订单创建成功:', createdOrderIds.value)
      console.log('createOrdersOnEnter - 设置 currentPendingOrderId:', createdOrders[0].id)
    }
  } catch (e: any) {
    console.error('createOrdersOnEnter - 创建订单失败:', e)
    ElMessage.error(e.message || '创建订单失败')
  }
  console.log('========== createOrdersOnEnter 结束 ==========')
}

//提交订单 - 跳转到支付页面
const handleSubmitOrder = async () => {
  console.log('handleSubmitOrder - createdOrderIds:', createdOrderIds.value)
  
  // 如果订单还没创建，先创建
  if (createdOrderIds.value.length === 0) {
    await createOrdersOnEnter()
  }
  
  if (createdOrderIds.value.length === 0) {
    ElMessage.error('订单创建失败，请重试')
    return
  }
  
  // 检查是否有选中的地址
  if (!addressStore.selectedAddressId) {
    ElMessage.warning('请选择收货地址')
    return
  }
  
  // 跳转到支付页面
  await router.push({
    name: 'checkout',
    query: {
      orderIds: createdOrderIds.value.join(','),
      fromCart: route.query.fromCart === 'true' ? 'true' : undefined
    },
  })
}

// 监听购物车商品变化，当商品变化时允许再次创建订单
watch(() => cartStore.selectedItems.length, () => {
  // 这里可以添加更精细的逻辑，比如当商品数量或种类变化时清除标记
  // 为了简单起见，这里暂不自动清除，让用户手动触发
  console.log('购物车商品数量变化')
})
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
