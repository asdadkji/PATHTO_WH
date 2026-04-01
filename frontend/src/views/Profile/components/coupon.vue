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
//优惠券初始化
onMounted(async () => {
  await couponStore.getUserCoupon({
    userId: 1,
    status: 'unused',
  })
})
</script>

<template>
  <el-tabs type="border-card" v-model="activeName" @tab-change="couponStore.getUserCoupon({userId: 1, status: activeName})">
    <el-tab-pane v-for="item in tabList" :key="item.name" :name="item.name" :label="item.title">
      <el-empty description="description" v-if="false"/>
      <div class="coupon__list">
        <div class="coupon__item" v-for="(item,id) in couponStore.coupon" :key="id">
          <div class="item__left">
            <p>{{item.merchant_name}} <span style="font-size: 12px">{{ item.coupon_type }}</span></p>
            <div>
              <p><span style="font-size: 20px;margin-right: 4px">￥4</span><span style="font-size: 12px">{{ item.coupon_title }}</span></p>
              <p style="color: #000000; font-size: 12px">{{ new Date(item.use_start).toLocaleDateString('zh-CN') }}-{{ new Date(item.use_end).toLocaleDateString('zh-CN') }}</p>
            </div>
          </div>
          <div class="item__right">
            <p style="writing-mode: vertical-rl">去使用</p>
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
