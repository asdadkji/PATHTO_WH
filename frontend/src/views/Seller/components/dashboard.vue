<script setup lang="ts">
const table = [
  {
    date: '昨天',
    orderNumber: 30,
    hasOrderNumber: 15,
    orderMoney: 3000,
    hasOrderMoney: 1500,
    userNumber:20
  },
  {
    date: '最近7天',
    orderNumber: 50,
    hasOrderNumber: 25,
    orderMoney: 5000,
    hasOrderMoney: 2500,
    userNumber:30
  },
  {
    date: '最近30天',
    orderNumber: 100,
    hasOrderNumber: 50,
    orderMoney: 10000,
    hasOrderMoney: 5000,
    userNumber:50
  }
]
</script>

<template>
  <div class="dashboard__container">
    <!--店铺信息-->
    <div class="seller__info">
      <div class="info__left">
        <img>
        <div>
          <p style="margin-bottom: 16px">撒大苏打</p>
          <p>实名认证：啦啦啦</p>
          <p>店铺名称：撒大苏打的书摊</p>
        </div>
      </div>
      <div class="info__right">
        <p>好评率：0%</p>
        <p>经营天数：2天</p>
      </div>
    </div>
    <!--订单信息-->
    <div class="info__item">
      <p>订单交易</p>
      <div>
        <span>店铺订单：</span>
        <span>待确认(0)</span>
        <span>待确认(0)</span>
        <span>待确认(0)</span>
        <span>待确认(0)</span>
        <span>待确认(0)</span>
        <span>待确认(0)</span>
      </div>
    </div>
    <!--资金信息-->
    <div class="info__item">
      <p>资金信息</p>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="6" class="text-center mb-4">
          <el-statistic title="卖家总收入(元)" :value="100"/>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" class="text-center mb-4">
          <el-statistic title="可提现金额(元)" :value="100"/>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" class="text-center mb-4">
          <el-statistic title="今日盈利金额(元)" :value="100"/>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" class="text-center mb-4">
          <el-statistic title="冻结资金" :value="100"/>
        </el-col>
      </el-row>
    </div>
    <!--订单统计-->
    <div class="info__item">
      <p>订单数据统计</p>
      <el-table border style="width: 100%" :data="table">
        <el-table-column prop="date" label="日期"/>
        <el-table-column prop="orderNumber" label="订单笔数"/>
        <el-table-column prop="hasOrderNumber" label="订单付款数"/>
        <el-table-column prop="orderMoney" label="订单总金额(元)"/>
        <el-table-column prop="hasOrderMoney" label="订单付款金额(元)"/>
        <el-table-column prop="userNumber" label="订单用户数"/>
      </el-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard__container {
  display: flex;
  flex-direction: column;
  .seller__info {
    border: 1px solid #d5d2d2;
    pdding: 8px 4px;
    display: flex;
    flex-direction: row;
    align-items: center;
    .info__left {
      display: flex;
      flex-direction: row;
      align-items: center;
      img {
        width: 80px;
        height: 80px;
      }
      div {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
      }
    }
    .info__right {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
      padding: 8px;
      border-left: 1px solid #d5d2d2;
    }
  }
  .info__item {
    display: flex;
    flex-direction: column;
    margin: 8px 0;
    p {
      padding: 8px;
      background: #8bbaea;
      font-weight: bold;
      font-size: 16px;
    }
    div {
      padding: 8px;
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      span {
        font-size: 12px;
        margin-right: 8px;
      }
    }
  }
}
</style>
