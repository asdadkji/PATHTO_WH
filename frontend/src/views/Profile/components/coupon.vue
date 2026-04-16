<script setup lang="ts">
import {onMounted, ref} from 'vue'
//分页配置
const currentPage = ref(1)
const pageSize = ref(15)
const handleSizeChange = (val: number) => {
  console.log(`${val} items per page`)
}
const handleCurrentChange = (val: number) => {
  console.log(`current page: ${val}`)
}
const value = ref(true)
//引入优惠券仓库
import {useCouponStore} from '@/stores/coupon'
const couponStore = useCouponStore()
//引入用户仓库
import {useAuthStore} from '@/stores/auth'
const authStore = useAuthStore()
//引入路由
import {useRouter} from 'vue-router'
const router = useRouter()
//优惠券分类列表配置
const tabList = ref([
  {
    title:'可用优惠券',
    name:'unused'
  },
  {
    title:'已使用优惠券',
    name:'used'
  },
  {
    title:'已过期优惠券',
    name:'expired'
  }
])
const activeName = ref('unused')
//处理标签页切换
const handleTabChange = async (tabName: string) => {
  const userId = authStore.userId || 1
  await couponStore.getUserCoupon({
    userId: userId,
    status: tabName,
  })
}

//跳转到购物车
const goToCart = () => {
  router.push('/cart')
}

//优惠券初始化
onMounted(async () => {
  const userId = authStore.userId || 1
  await couponStore.getUserCoupon({
    userId: userId,
    status: 'unused',
  })
})
</script>

<template>
  <el-tabs type="border-card" v-model="activeName" @tab-change="handleTabChange">
    <el-tab-pane v-for="item in tabList" :key="item.name" :name="item.name" :label="item.title">
      <el-empty description="description" v-if="false"/>
      <div class="coupon__list">
        <div class="coupon__item" v-for="(item,id) in couponStore.coupon" :key="id">
          <div class="item__left">
            <p>{{item.merchant_name}} <span style="font-size: 12px">{{ item.coupon_type }}</span></p>
            <div>
              <p><span style="font-size: 20px;margin-right: 4px">￥{{item.discount}}</span><span style="font-size: 12px">{{ item.coupon_title }}</span></p>
              <p style="color: #000000; font-size: 12px">{{ new Date(item.use_start).toLocaleDateString('zh-CN') }}-{{ new Date(item.use_end).toLocaleDateString('zh-CN') }}</p>
            </div>
          </div>
          <div class="item__right" @click="activeName === 'unused' && goToCart()" :style="{ cursor: activeName === 'unused' ? 'pointer' : 'not-allowed', opacity: activeName === 'unused' ? '1' : '0.7' }">
            <p style="writing-mode: vertical-rl">
              {{ activeName === 'unused' ? '去使用' : activeName === 'used' ? '已使用' : '已过期' }}
            </p>
          </div>
        </div>
      </div>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="50"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-left: 8px"
        :hide-on-single-page="value"
      />
    </el-tab-pane>
  </el-tabs>
</template>

<style scoped lang="scss">
.coupon__list {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  margin-bottom: 24px;
}
.coupon__item {
  display: flex;
  width: 30%;
  height: 160px;
  background: #fadbdb;
  padding: 0 0 0 4px;
  margin: 0 8px;
  .item__left {
    flex: 10;
    div {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
  }
  .item__right {
    flex: 1;
    background: #FF4B60;
    padding: 4px;
    &:hover {
      cursor: pointer;
    }
    p {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: white;
    }
  }
}
.item__left > p {
  padding: 4px 0;
  border-bottom: 1px dotted #2c0f0f;
  font-size: 14px;
  margin-bottom: 8px;
  margin-right: 4px;
}
</style>
