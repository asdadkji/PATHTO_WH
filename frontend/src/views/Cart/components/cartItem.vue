<script setup lang="ts">
import {computed, onMounted, watch} from 'vue'
import {useRouter} from "vue-router";
const router = useRouter()
//引入购物车仓库
import { useCartStore } from '@/stores/cart'
const cartStore = useCartStore()
//引入优惠券仓库
import {useCouponStore} from "@/stores/coupon.ts";
const couponStore = useCouponStore()
//引入用户仓库
import {useAuthStore} from "@/stores/auth.ts";
const authStore = useAuthStore()
//引入localstorage
import localstorage from "@/utils/localstorage.ts"
//引入ElMessage
import {ElMessage} from 'element-plus'
const initUserCart = () => {
  if (authStore.userId) {
    cartStore.switchUser(String(authStore.userId))
  }
}
//选择的商品
const handleSelectionChange = (val:any[])=>{
  cartStore.selectedItems = val
}
//判定是否选择了商品
const hasSelectedItems = computed(()=> cartStore.selectedItems.length > 0)
//自动推荐
watch(()=>cartStore.selectedItems,async (newVal)=>{
  if(newVal.length > 0) {
    await loadAndRecommendCoupons();
  }
})
//加载商家优惠券并自动推荐
const loadAndRecommendCoupons = async () => {
  const merchantIds = Object.keys(cartStore.itemsGroupByMerchant)
  for(const merchantId of merchantIds) {
    await couponStore.getMerchantCoupons(Number(merchantId))
    const merchantCoupons = couponStore.merchantCoupon.filter(coupon => coupon.merchant_id === Number(merchantId))
    cartStore.recommendBestCoupon(Number(merchantId),merchantCoupons)
  }
}
//优惠券初始化
onMounted(() => {
  initUserCart()
  if(hasSelectedItems.value) {
    loadAndRecommendCoupons()
  }
})
const goToSettle = ()=>{
  // 确保用户数据已初始化
  if (!authStore.userId) {
    ElMessage.error('请先登录')
    router.push('/auth/login')
    return
  }
  
  // 确保cartStore的currentUserId已设置
  if (cartStore.currentUserId !== String(authStore.userId)) {
    cartStore.switchUser(String(authStore.userId))
  }
  
  // 确保选中商品被保存到localStorage
  const userId = String(authStore.userId)
  localstorage.set(`cart:selectedItems:${userId}`, cartStore.selectedItems)
  router.push({
    path: '/orders',
    query: {
      fromCart: 'true'
    }
  })
}
</script>

<template>
  <div class="cart__container">
    <!--购物车页面头部-->
    <div class="cart__nav">
      <h3>购物车：{{cartStore.cartList.length}}种商品</h3>
    </div>
    <div class="cart__list">
      <!--购物车主体-->
      <el-table style="width: 100%" :data="cartStore.cartList" @selection-change="handleSelectionChange">
        <el-table-column width="55" type="selection"/>
        <el-table-column label="商品" width="380">
          <template #default="{row}">
            <div style="display: flex;flex-direction: row; align-items: flex-start">
              <img :src="row.cover_img" alt="" style="width: 100px; height: 100px">
              <span style="margin-left: 16px">{{row.title}}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商家" width="163" property="merchant_name"/>
        <el-table-column label="单价/￥" width="140" property="price">
          <template #default="{row}">
            <p>{{row.price}}</p>
            <span class="coupon__item">{{cartStore.selectCoupons[row.merchantId]?.title}}</span>
          </template>
        </el-table-column>
        <el-table-column label="金额/￥" width="140">
          <template #default="{row}">
            {{row.price}}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130">
          <template #default="{row}">
            <el-button link type="primary" size="small">
              移入收藏
            </el-button>
            <el-button link type="primary" size="small" @click="cartStore.deleteGoods(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <!--结算按钮等-->
      <div class="goToOrder">
        <div v-show="hasSelectedItems" class="order-summary">
          <span style="color: #cfb6b6">已选{{cartStore.selectedItems.length}}件商品</span>
          <div class="price-breakdown">
            <p>商品金额：<span style="color:#d34747;">￥{{cartStore.totalPrice.toFixed(2)}}</span></p>
            <p v-if="cartStore.discountPrice > 0" style="color: #f56c6c;">
              优惠：-￥{{cartStore.discountPrice.toFixed(2)}}
            </p>
          </div>
          <p>实付金额：<span style="color: #FF4B60">￥{{cartStore.finalPrice.toFixed(2)}}</span></p>
        </div>
        <el-button class="cart__btn" type="danger" style="padding: 16px; margin-left: 8px" :disabled="!hasSelectedItems" @click="goToSettle">去结算</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cart__container {
  border-radius: 8px;
  padding: 16px;
  background: #ffffff;
  margin: 0 auto;
  width: 1200px;
  .cart__nav {
    border-bottom: 1px solid #ccc;
    padding-bottom: 16px;
  }
  .cart__list {
    width: 100%;
    margin-top: 16px;
    .cart__list__type {
      width: 100%;
      display: flex;
      align-items: center;
      span {
        text-align: center;
      }
    }
  }
}
.list__done {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  span {
    margin-bottom: 8px;
  }
}
.cart__btn {
  font-size: 16px;
  font-weight: bold;
}
.goToOrder {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  border-top: 1px solid #e39d9d;
  padding-top: 16px;
/*  div {
    display: flex;
    justify-content: space-between;
    width: 240px;
    align-items: center;
  }*/
}
.order-summary {
  display: flex;
  flex-direction: row;
  gap:8px;
  .price-breakdown {
    display: flex;
    flex-direction: column;
  }
}
.coupon__item {
  padding: 4px;
  border: 1px solid #ccc;
  margin-top: 4px;
  color: #FF4B60;
}
</style>
