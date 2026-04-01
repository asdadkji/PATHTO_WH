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
//引入ElMessage
import {ElMessage} from 'element-plus'
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
          <el-button style="padding: 16px 40px" @click="buyNow">立刻购买</el-button>
          <el-button style="padding: 16px 40px" @click="addToCart">{{ cartStore.isJoined(bookStore.bookData?.id || 0) ? '已加入购物车' : '加入购物车' }}</el-button>
        </div>
        <div class="product-info__img">
          <img :src="favoriteStore.isFavorited(bookStore.bookData?.id || 0) ? hasLoved : love" alt="">
          <span @click="switchImage">{{ favoriteStore.isFavorited(bookStore.bookData?.id || 0) ? '已收藏' : '收藏' }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.product-info {
  display: flex;
  flex-direction: row;
  justify-content:center;
}
//图书图片展示容器
.gallery {
  display: flex;
  flex-direction: column;
  width: 258px;
  .img--big {
    border: 1px solid #ccc;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    img {
      width:240px;
      height: 260px;
    }
  }
  .img--small {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    li {
      border: 1px solid #ccc;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      margin-bottom: 2px;
      &:hover {
        border: 1px solid #ff6700;
      }
      img {
        width: 37px;
        height: 37px;
      }
    }
  }
}
.book-info {
  margin-left: 40px;
  width: 600px;
  .info__item {
    margin-bottom: 8px;
  }
  .info__basic {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    border: 1px solid #ccc;
    padding: 8px;
    span {
      width: 33%;
      font-size: 13px;
      margin-bottom: 4px;
    }
  }
  .info__price {
    display: flex;
    flex-direction: column;
    padding: 12px 8px;
    background: #e4dfdf;
    margin: 16px 0;
    span {
      margin-right: 16px;
    }
  }
}
//动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.product-info__btn {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.product-info__img {
  display: flex;
  align-items: center;
  img {
    margin-right: 4px;
  }
  span {
    &:hover {
      cursor: pointer;
    }
  }
}
.book__coupon {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 6px;
  background: #e4dfdf;
  width: 600px;
  margin-bottom: 14px;
  &:hover {
    cursor: pointer;
  }
  span {
    margin-right: 8px;
  }
}
.coupon__list {
  display: flex;
  flex-direction: row;
  border: 1px solid #ccc;
  width: 280px;
  height: 70px;
  .coupon__info {
    display: flex;
    flex-direction:row;
    justify-content: space-between;
    align-items: center;
    padding: 4px;
    .info__left {
      display: flex;
      flex-direction: column;
      margin-bottom: 4px;
    }
  }
}
.coupon__list > span {
  background: #fadbdb;
  color: #FF4B60;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
}
</style>
