<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'
import {ArrowDown} from "@element-plus/icons-vue";
//路由
import { useRoute,useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
//判定是否收藏
import hasLoved from '@assets/images/other/product-loved.svg'
import love from '@assets/images/other/product-love.svg'
//引入图书仓库
import { useBookStore } from '@/stores/book'
const bookStore = useBookStore()
//引入购物车仓库
import {useCartStore} from '@/stores/cart'
const cartStore = useCartStore()
//引入收藏仓库
import {useFavoriteStore} from '@/stores/favorite'
const favoriteStore = useFavoriteStore()
//引入优惠券仓库
import {useCouponStore} from "@/stores/coupon.ts";
import type {CartItem} from "@/types/store";
const couponStore = useCouponStore()
//引入用户仓库
import {useAuthStore} from "@/stores/auth.ts";
const authStore = useAuthStore()
//引入订单仓库
import {useOrderStore} from "@/stores/orders.ts";
const orderStore = useOrderStore()
// 引入ElMessage, ElDialog
import {ElMessage, ElDialog} from 'element-plus'
//引入本地存储工具
import storage from "@/utils/localstorage.ts";
//图片详情
const list = ref([
  'https://picsum.photos/600/400?random=1',
  'https://picsum.photos/600/400?random=2',
  'https://picsum.photos/600/400?random=3',
  'https://picsum.photos/600/400?random=4',
  'https://picsum.photos/600/400?random=1',
  'https://picsum.photos/600/400?random=2',
  'https://picsum.photos/600/400?random=3',
  'https://picsum.photos/600/400?random=4'
])
const activeIndex = ref(0)

// 线下交易相关
const showOfflineTradeDialog = ref(false)
const showConfirmDialog = ref(false)
// 与商品ID关联的线下交易状态
const getOfflineTradeKey = (bookId: number) => {
  return `offline_trade_selected_${bookId}`
}

// 检查相关订单状态
const checkOrderStatus = async () => {
  const bookId = bookStore.bookData?.id
  if (!bookId || !authStore.userId) return
  
  try {
    // 获取用户的订单列表
    await orderStore.getUserOrdersList(authStore.userId, 'buyer', 1, 10, 'all')
    
    // 查找与当前商品相关的线下交易订单
    const relatedOrders = orderStore.orders.filter(order => 
      order.book_id === bookId && 
      order.transaction_method === 'face_to_face'
    )
    
    // 检查是否有已取消的订单
    const hasCancelledOrder = relatedOrders.some(order => 
      order.status === 'cancelled'
    )
    
    // 如果有已取消的订单，重置线下交易状态
    if (hasCancelledOrder) {
      const key = getOfflineTradeKey(bookId)
      storage.remove(key)
      console.log('已重置线下交易状态，因为订单已取消')
    }
  } catch (error) {
    console.error('检查订单状态失败:', error)
  }
}

const offlineTradeSelected = computed({
  get: () => {
    const bookId = bookStore.bookData?.id
    const value = bookId ? storage.get(getOfflineTradeKey(bookId)) || false : false
    console.log('offlineTradeSelected get:', value)
    console.log('bookId:', bookId)
    console.log('getOfflineTradeKey:', bookId ? getOfflineTradeKey(bookId) : 'no bookId')
    return value
  },
  set: (value) => {
    const bookId = bookStore.bookData?.id
    console.log('offlineTradeSelected set:', value)
    console.log('bookId:', bookId)
    if (bookId) {
      storage.set(getOfflineTradeKey(bookId), value)
      console.log('storage set:', getOfflineTradeKey(bookId), value)
    }
  }
})

// 检查商品是否支持线下交易
const isOfflineTradeSupported = computed(() => {
  // 检查本地存储中的线下交易设置
  const offlineTradeEnabled = storage.get('offline_trade_enabled') || false

  // 同时检查商品数据中的transaction_methods
  let transactionMethods = bookStore.bookData?.transaction_methods || []
  // 处理transaction_methods可能是JSON字符串的情况
  if (typeof transactionMethods === 'string') {
    try {
      transactionMethods = JSON.parse(transactionMethods)
    } catch (e) {
      transactionMethods = []
    }
  }
  const hasOfflineMethod = Array.isArray(transactionMethods) && transactionMethods.some((method: string) =>
    method.includes('face_to_face')
  )

  // 只要满足其中一个条件就显示线下交易标记
  const result = offlineTradeEnabled || hasOfflineMethod
  console.log('isOfflineTradeSupported:', result)
  console.log('offlineTradeEnabled:', offlineTradeEnabled)
  console.log('hasOfflineMethod:', hasOfflineMethod)
  console.log('transactionMethods:', transactionMethods)
  console.log('bookStore.bookData:', bookStore.bookData)
  return result
})

// 处理线下交易点击
const handleOfflineTradeClick = () => {
  console.log('handleOfflineTradeClick called')
  console.log('offlineTradeSelected.value:', offlineTradeSelected.value)
  if (!offlineTradeSelected.value) {
    openOfflineTradeDialog()
  }
}

// 打开线下交易弹窗
const openOfflineTradeDialog = () => {
  console.log('openOfflineTradeDialog called')
  showOfflineTradeDialog.value = true
  console.log('showOfflineTradeDialog.value:', showOfflineTradeDialog.value)
}

// 关闭线下交易弹窗
const closeOfflineTradeDialog = () => {
  showOfflineTradeDialog.value = false
}

// 打开二次确认弹窗
const openConfirmDialog = () => {
  showOfflineTradeDialog.value = false
  showConfirmDialog.value = true
}

// 关闭二次确认弹窗
const closeConfirmDialog = () => {
  showConfirmDialog.value = false
}

// 确认线下交易
const confirmOfflineTrade = async () => {
  // 确保用户数据已初始化
  if (!authStore.userId) {
    ElMessage.error('请先登录')
    router.push('/auth/login')
    return
  }

  // 确保图书数据已加载
  if (!bookStore.bookData) {
    ElMessage.error('图书数据加载失败')
    return
  }

  // 确保cartStore的currentUserId已设置
  if (cartStore.currentUserId !== String(authStore.userId)) {
    cartStore.switchUser(String(authStore.userId))
  }

  try {
    // 准备订单数据
        const orderData = {
          book_id: bookStore.bookData.id,
          book_snapshot: {
            id: bookStore.bookData.id,
            title: bookStore.bookData.title,
            author: bookStore.bookData.author,
            price: bookStore.bookData.price,
            cover_img: 'https://picsum.photos/600/400?random=1',
            book_condition: bookStore.bookData.book_condition
          },
          seller_id: bookStore.bookData.seller_id || bookStore.bookData.merchant_id,
          quantity: 1,
          unit_price: bookStore.bookData.price,
          delivery_fee: 0, // 线下交易不需要运费
          transaction_method: 'face_to_face', // 线下现金交易
          meeting_location: storage.get('offline_trade_location') || bookStore.bookData?.location,
          payment_method: 'cash' // 现金支付
        }

    // 调用后端API创建订单
    const order = await orderStore.createOrder(authStore.userId, orderData)
    
    if (order) {
      // 设置线下交易已选择，禁用线上交易按钮
      offlineTradeSelected.value = true
      // 保存到本地存储，确保刷新后状态不丢失
      const bookId = bookStore.bookData?.id
      if (bookId) {
        storage.set(getOfflineTradeKey(bookId), true)
      }
      // 显示成功提示
      ElMessage.success('线下交易订单已创建，请与卖家联系完成交易')
    } else {
      ElMessage.error('订单创建失败，请重试')
    }
  } catch (error) {
    console.error('创建线下交易订单失败:', error)
    ElMessage.error('订单创建失败，请重试')
  } finally {
    showConfirmDialog.value = false
  }
}
//点击收藏
const switchImage = ()=>{
  if (!bookStore.bookData) return
  const data = {
    id: bookStore.bookData.id,
    title: bookStore.bookData.title,
    author:bookStore.bookData.author,
    price: bookStore.bookData.price,
    quantity: 1,
    cover_img: 'https://picsum.photos/600/400?random=1',
    book_condition:bookStore.bookData.book_condition
  }
  if (favoriteStore.isFavorited(data.id)) {
    favoriteStore.deleteFavorite(data.id)
  } else {
    favoriteStore.addFavoriteList(data)
  }

}
//图书数据\商家优惠券展示初始化
onMounted(async ()=>{
  await bookStore.getBookDetailById(Number(route.params.id))
  await couponStore.getMerchantCoupons(1) /*bookStore.bookData.merchant_id*/
  // 检查订单状态，重置已取消订单的线下交易状态
  await checkOrderStatus()
})
//判定是否加入购物车
const isFavorite = ref(false)
//点击加入购物车
const addToCart = ()=>{
  if (!bookStore.bookData) return
  isFavorite.value = !isFavorite.value
  const data = {
    id: bookStore.bookData.id,
    title: bookStore.bookData.title,
    author:bookStore.bookData.author,
    price: bookStore.bookData.price,
    quantity: 1,
    cover_img: 'https://picsum.photos/600/400?random=1',
    book_condition:bookStore.bookData.book_condition,
    merchant_name:bookStore.bookData.merchantName || '',
    merchantId:bookStore.bookData.merchant_id,
    seller_id: bookStore.bookData.seller_id
  }
  cartStore.addToGoods(data)
  alert('添加成功')
}
//获取优惠券
const handleReceive = (userId:number,batchId:number,id:number) => {
  couponStore.updateAllCoupon(userId,batchId)
}
//直接购买
const buyNow = ()=>{
  // 确保用户数据已初始化
  if (!authStore.userId) {
    ElMessage.error('请先登录')
    router.push('/auth/login')
    return
  }

  // 确保图书数据已加载
  if (!bookStore.bookData) {
    ElMessage.error('图书数据加载失败')
    return
  }

  // 确保cartStore的currentUserId已设置
  if (cartStore.currentUserId !== String(authStore.userId)) {
    cartStore.switchUser(String(authStore.userId))
  }

  const item:any = {
    id: bookStore.bookData.id,
    title: bookStore.bookData.title,
    author:bookStore.bookData.author,
    price: bookStore.bookData.price,
    quantity: 1,
    cover_img: 'https://picsum.photos/600/400?random=1',
    book_condition:bookStore.bookData.book_condition,
    merchantId:bookStore.bookData.merchant_id,
    seller_id: bookStore.bookData.seller_id
  }
  cartStore.setBuyNowItem(item)
  router.push({name:'orders'})
}
const conditionText = computed(() => {
  const conditionMap: Record<string, string> = {
    new: '全新',
    like_new: '九五品',
    very_good: '九品',
    good: '八品',
    acceptable: '七品',
    poor: '六品'
  }

  const condition = bookStore.bookData?.book_condition || ''
  return conditionMap[condition] || condition || '未知'
})
</script>
<template>
  <div class="product-info">
    <!--图片展示-->
    <section class="gallery">
      <!--大图-->
      <div class="img--big">
        <transition name="fade" mode="out-in">
          <img :key="activeIndex" :src="list[activeIndex]">
        </transition>
      </div>
      <!--小图-->
      <ul class="img--small">
        <li v-for="(src, idx) in list" :key="idx" @mouseenter="activeIndex = idx">
          <img :src="src">
        </li>
      </ul>
    </section>
    <!--图书信息-->
    <section class="book-info">
      <!--图书名称-->
      <div class="info__item">
        <h3>{{ bookStore.bookData?.title }}</h3>
        <span style="font-size: 12px; color: #8f1b1b">{{ bookStore.bookData?.description }}</span>
      </div>
      <!--图书基本信息-->
      <div class="info__basic">
        <span>作者：{{ bookStore.bookData?.author }}</span>
        <span>出版时间：{{ bookStore.bookData?.publish_year }}</span>
        <span>版本：{{ bookStore.bookData?.edition }}</span>
        <span>出版社：{{ bookStore.bookData?.publisher }}</span>
        <span>原价：{{bookStore.bookData?.original_price}}元</span>
        <span>类型：{{bookStore.bookData?.book_type}}</span>
      </div>
      <!--图书价格-->
      <div class="info__price">
        <p>
          <span style="font-size: 12px">定价</span><span>￥{{bookStore.bookData?.price}}</span>
        </p>
        <p>
          <span style="font-size: 12px">品相</span><span>{{ conditionText }}</span>
        </p>
        <!-- 线下交易标记 -->
        <p v-if="isOfflineTradeSupported" class="offline-trade-tag" @click="handleOfflineTradeClick" :class="{ 'disabled': offlineTradeSelected }">
          <span :style="{ color: '#ff6700', fontWeight: 'bold', cursor: offlineTradeSelected ? 'not-allowed' : 'pointer' }">
            {{ offlineTradeSelected ? '已选择线下交易' : '本商品支持线下交易' }}
          </span>
        </p>
      </div>
      <el-dropdown :hide-on-click="false" placement="bottom-start">
        <div class="book__coupon">
          <span>优惠</span>
          <span style="padding: 2px;border: 1px solid crimson;color: crimson">满减券</span>
          <span v-for="item in couponStore.merchantCoupon" :key="item.id">{{item.title}}</span>
          <el-icon class="el-icon--right"><arrow-down/></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="(item,id) in couponStore.merchantCoupon" :key="id">
              <div class="coupon__list">
                <span>￥ {{item.discount}}</span>
                <div style="flex: 3.5" class="coupon__info">
                  <div class="info__left">
                    <span>{{item.title}}</span>
                    <span>{{new Date(item.use_start).toLocaleDateString('zh-CN')}}-{{new Date(item.use_end).toLocaleDateString('zh-CN')}}</span>
                    <span>全店商品可用</span>
                  </div>
                  <el-button type="danger" style="padding: 2px 14px;color: white" @click="handleReceive(2,item.id,id)">{{item.isReceived ? '已领取' : '领取'}}</el-button>
                </div>
              </div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <!--购买按钮-->
      <div class="product-info__btn">
        <div>
          <el-button 
            style="padding: 16px 40px" 
            @click="buyNow"
            :disabled="offlineTradeSelected"
            :title="offlineTradeSelected ? '已选择线下交易，无法使用线上交易' : ''"
          >
            {{ offlineTradeSelected ? '已选择线下交易' : '立刻购买' }}
          </el-button>
          <el-button 
            style="padding: 16px 40px" 
            @click="addToCart"
            :disabled="offlineTradeSelected"
            :title="offlineTradeSelected ? '已选择线下交易，无法使用线上交易' : ''"
          >
            {{ offlineTradeSelected ? '已选择线下交易' : (cartStore.isJoined(bookStore.bookData?.id || 0) ? '已加入购物车' : '加入购物车') }}
          </el-button>
        </div>
        <div class="product-info__img">
          <img :src="favoriteStore.isFavorited(bookStore.bookData?.id || 0) ? hasLoved : love" alt="">
          <span @click="switchImage">{{ favoriteStore.isFavorited(bookStore.bookData?.id || 0) ? '已收藏' : '收藏' }}</span>
        </div>
      </div>
    </section>
  </div>

  <!-- 线下交易信息弹窗 -->
  <el-dialog
    v-model="showOfflineTradeDialog"
    title="线下交易信息"
    width="500px"
  >
    <div class="offline-trade-info">
      <div class="info-item">
        <span class="label">交易地点：</span>
        <span>{{ storage.get('offline_trade_location') || bookStore.bookData?.location || '未设置' }}</span>
      </div>
      <div class="info-item">
        <span class="label">卖家联系电话：</span>
        <span>{{ bookStore.bookData?.seller_phone || authStore.user?.phone || '请联系卖家获取' }}</span>
      </div>
      <div class="info-item">
        <span class="label">交易安全提示：</span>
        <span>请选择公共场所进行交易，建议带上朋友陪同，仔细检查商品后再付款。</span>
      </div>
      <div class="info-item warning">
        <span class="label">警告信息：</span>
        <span>线下交易存在一定风险，请谨慎选择，平台不承担线下交易的纠纷责任，且一旦确认则无法从其他渠道再次下单。</span>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button size="large" @click="closeOfflineTradeDialog">取消</el-button>
        <el-button type="primary" size="large" @click="openConfirmDialog">确认</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 二次确认弹窗 -->
  <el-dialog
    v-model="showConfirmDialog"
    title="确认线下交易"
    width="400px"
  >
    <p>您确定要通过线下方式购买此商品吗？</p>
    <p>下单后，请积极与卖家联系完成线下交易。</p>
    <template #footer>
      <span class="dialog-footer">
        <el-button size="large" @click="closeConfirmDialog">取消</el-button>
        <el-button type="primary" size="large" @click="confirmOfflineTrade">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
// 全局变量
$primary-color: #409eff;
$secondary-color: #ff6700;
$background-color: #f8f9fa;
$card-background: #ffffff;
$border-color: #e0e0e0;
$text-color: #333333;
$text-secondary: #666666;
$text-light: #999999;
$border-radius: 8px;
$box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
$transition: all 0.3s ease;

// 主容器
.product-info {
  display: flex;
  flex-direction: row;
  justify-content: center;
  padding: 40px 20px;
  gap: 60px;
  background-color: $background-color;
  min-height: 100vh;
}

// 图书图片展示容器
.gallery {
  display: flex;
  flex-direction: column;
  width: 300px;
  background-color: $card-background;
  border-radius: $border-radius;
  padding: 20px;
  box-shadow: $box-shadow;

  .img--big {
    border: 1px solid $border-color;
    border-radius: $border-radius;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color: #f9f9f9;
    transition: $transition;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    img {
      width: 240px;
      height: 320px;
      object-fit: cover;
      border-radius: 4px;
    }
  }

  .img--small {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;

    li {
      border: 1px solid $border-color;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      transition: $transition;
      cursor: pointer;

      &:hover {
        border-color: $secondary-color;
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(255, 103, 0, 0.2);
      }

      img {
        width: 48px;
        height: 48px;
        object-fit: cover;
      }
    }
  }
}

// 图书信息容器
.book-info {
  flex: 1;
  max-width: 650px;
  background-color: $card-background;
  border-radius: $border-radius;
  padding: 30px;
  box-shadow: $box-shadow;

  // 图书名称
  .info__item {
    margin-bottom: 20px;

    h3 {
      font-size: 24px;
      font-weight: 600;
      color: $text-color;
      margin-bottom: 8px;
      line-height: 1.3;
    }

    span {
      font-size: 14px;
      color: $text-secondary;
      line-height: 1.5;
    }
  }

  // 图书基本信息
  .info__basic {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    padding: 20px;
    margin-bottom: 24px;
    background-color: #f9f9f9;

    span {
      width: 33%;
      font-size: 14px;
      color: $text-secondary;
      margin-bottom: 8px;
      line-height: 1.4;
    }
  }

  // 图书价格
  .info__price {
    display: flex;
    flex-direction: column;
    padding: 20px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: $border-radius;
    margin-bottom: 24px;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);

    p {
      margin-bottom: 12px;
      display: flex;
      align-items: center;

      span:first-child {
        font-size: 14px;
        color: $text-secondary;
        margin-right: 16px;
        min-width: 60px;
      }

      span:last-child {
        font-size: 16px;
        color: $text-color;
        font-weight: 500;
      }
    }

    // 价格显示
    p:nth-child(1) span:last-child {
      font-size: 28px;
      color: $secondary-color;
      font-weight: 700;
    }
  }

  // 优惠券
  .book__coupon {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 16px;
    background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
    border-radius: $border-radius;
    margin-bottom: 24px;
    transition: $transition;
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 103, 0, 0.15);
    }

    span {
      margin-right: 12px;
      font-size: 14px;
      color: $text-color;
    }

    span:nth-child(2) {
      padding: 4px 12px;
      border: 1px solid $secondary-color;
      color: $secondary-color;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }
  }

  // 购买按钮
  .product-info__btn {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid $border-color;

    div:first-child {
      display: flex;
      gap: 16px;
    }
  }

  // 收藏按钮
  .product-info__img {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border: 1px solid $border-color;
    border-radius: 20px;
    transition: $transition;
    cursor: pointer;

    &:hover {
      border-color: $primary-color;
      background-color: rgba(64, 158, 255, 0.05);
    }

    img {
      width: 20px;
      height: 20px;
    }

    span {
      font-size: 14px;
      color: $text-secondary;
      transition: $transition;

      &:hover {
        color: $primary-color;
      }
    }
  }
}

// 线下交易标记
.offline-trade-tag {
  margin-top: 16px;
  padding: 12px;
  background-color: rgba(255, 103, 0, 0.1);
  border-radius: $border-radius;
  border-left: 4px solid $secondary-color;
  transition: $transition;
  cursor: pointer;

  &:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 103, 0, 0.15);
    background-color: rgba(255, 103, 0, 0.15);
  }

  &.disabled {
    background-color: rgba(0, 0, 0, 0.05);
    border-left-color: #ccc;
    cursor: not-allowed;

    span {
      color: #999;
    }
  }

  span {
    color: $secondary-color;
    font-weight: 600;
    font-size: 14px;
  }
}

// 线下交易信息弹窗内容
.offline-trade-info {
  .info-item {
    margin-bottom: 20px;
    line-height: 1.6;

    .label {
      font-weight: 600;
      margin-right: 12px;
      color: $text-color;
    }

    span:last-child {
      color: $text-secondary;
    }
  }

  .info-item.warning {
    color: $secondary-color;
    background-color: #fff3e0;
    padding: 16px;
    border-radius: $border-radius;
    border-left: 4px solid $secondary-color;
  }
}

// 弹窗按钮样式
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  width: 100%;
  padding: 20px;
  background-color: #f9f9f9;
  border-top: 1px solid $border-color;
  border-radius: 0 0 $border-radius $border-radius;
}

:deep(.el-button) {
  border-radius: 6px;
  padding: 10px 28px;
  font-size: 14px;
  font-weight: 500;
  transition: $transition;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

:deep(.el-button--primary) {
  background-color: $primary-color;
  border-color: $primary-color;

  &:hover {
    background-color: #66b1ff;
    border-color: #66b1ff;
  }
}

// 动画效果
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 响应式设计
@media (max-width: 1200px) {
  .product-info {
    flex-direction: column;
    align-items: center;
    padding: 20px;
    gap: 30px;
  }

  .gallery {
    width: 100%;
    max-width: 400px;
  }

  .book-info {
    width: 100%;
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .product-info {
    padding: 10px;
  }

  .book-info {
    padding: 20px;
  }

  .info__basic span {
    width: 50%;
  }

  .product-info__btn {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;

    div:first-child {
      flex-direction: column;
    }
  }
}
</style>
