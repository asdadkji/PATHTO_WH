<script setup lang="ts">
import {onMounted, reactive, ref, watch} from 'vue'

import type { FormInstance, FormRules } from 'element-plus'
import dayjs from 'dayjs';
//解决日期层级问题
const popperOptions = {
  modifiers: [{
    name: 'zIndex',
    enabled: true,
    phase: 'write',
    fn: ({ state }: any) => {
      state.elements.popper.style.zIndex = 1001
    }
  }]
}
//ts
interface RuleForm {
  title:string
  date:Date[]
  day:Date[]
  price:number
  discount:number
  number:number
  limit:number
}
//表单内容
const ruleForm = reactive<RuleForm>({
  title: '',
  date: [],
  day:[],
  price: 0,
  discount: 0,
  number: 0,
  limit: 0
})
//表单验证
const rules = reactive<FormRules>({
  title: [
    { required: true, message: '请输入优惠券名称', trigger: 'blur' }
  ],
  date: [
    { required: true, message: '请选择优惠券有效期', trigger: 'blur' }
  ],
  day: [
    { required: true, message: '请选择优惠券领取后有效天数', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入优惠券面值', trigger: 'blur' }
  ],
  discount: [
    { required: true, message: '请输入优惠券折扣', trigger: 'blur' }
  ],
  number: [
    { required: true, message: '请输入优惠券数量', trigger: 'blur' }
  ],
  limit: [
    { required: true, message: '请输入优惠券使用门槛', trigger: 'blur' }
  ]
})
//判定表单展开
const isShowForm = ref(false)
//表单引用
const ruleFormRef = ref<FormInstance>()
//引入优惠券仓库
import { useCouponStore } from '@/stores/coupon'
const couponStore = useCouponStore()
//提交优惠券
const submitForm = async () => {
  if (!ruleFormRef.value) return
  await ruleFormRef.value.validate(async (valid) => {
    if (valid) {
      const data = {
        merchant_id:1,
        title: ruleForm.title,
        type:'amount',
        full_amount: ruleForm.price,
        discount: ruleForm.discount,
        total_cnt: ruleForm.number,
        per_limit: ruleForm.limit,
        receive_start: dayjs(ruleForm.day[0]).format('YYYY-MM-DD HH:mm:ss'),
        receive_end: dayjs(ruleForm.day[1]).format('YYYY-MM-DD HH:mm:ss'),
        use_start: dayjs(ruleForm.date[0]).format('YYYY-MM-DD HH:mm:ss'),
        use_end: dayjs(ruleForm.date[1]).format('YYYY-MM-DD HH:mm:ss')
      }
      try {
        await couponStore.addCoupon(data)
        cancelForm()
      } catch (e) {
        console.error('创建优惠券失败:', e)
      }
    } else {
      console.log('表单验证失败')
    }
  })
}
//撤销优惠券创建
const cancelForm = () => {
  isShowForm.value = false
  ruleForm.title=''
  ruleForm.price=0
  ruleForm.discount=0
  ruleForm.number=0
  ruleForm.limit=0
  ruleForm.day=[]
  ruleForm.date=[]
}
onMounted(() => {
  couponStore.getSellerCoupons(1);
})
//停用优惠券
const stopCoupon = (batchId:number,couponId:number) => {
  const result = confirm('你确定要停用该优惠券吗？')
  if (result) {
    couponStore.stopCoupon(batchId,couponId)
  } else {
    console.log('用户取消删除');
  }
}
//筛选框
const formInline = reactive({
  title:'',
  status:''
})
//条件筛选
const handleFilter = () => {
  const params = {
    title: formInline.title,
    status: Number(formInline.status)
  }
  console.log(params)
  couponStore.getSellerCoupons(1,params)
}
</script>

<template>
  <div class="addCoupon__container">
    <!--优惠券查询-->
    <div class="addCoupon__top">
      <el-form :inline="true" :model="formInline">
        <el-form-item label="优惠券名称" style="margin-right: 16px">
          <el-input v-model="formInline.title"></el-input>
        </el-form-item>
        <el-form-item label="优惠券状态" style="margin-right: 8px;">
          <el-select style="width: 120px" v-model="formInline.status" placeholder="请选择">
            <el-option label="全部" value=""></el-option>
            <el-option label="进行中" value="1"></el-option>
            <el-option label="已结束" value="2"></el-option>
<!--            <el-option label="已结束" value="3"></el-option>
            <el-option label="已作废" value="4"></el-option>-->
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button style="width: 100px;margin-right: 175px" @click="handleFilter">查询</el-button>
        </el-form-item>
        <el-form-item>
          <el-button style="width: 100px" type="primary" @click="isShowForm=true">新建优惠券</el-button>
        </el-form-item>
      </el-form>
    </div>
    <!--优惠券列表-->
    <el-table style="width: 95%" stripe :data="couponStore.sellerCoupon">
      <el-table-column label="优惠券名称" prop="title"/>
      <el-table-column label="状态" prop="status">
        <template #default="{row}">
          <el-tag v-if="row.status==0" type="info">未开始</el-tag>
          <el-tag v-if="row.status==1">进行中</el-tag>
          <el-tag v-if="row.status==2" type="success">已结束</el-tag>
          <el-tag v-if="row.status==3" type="danger">已作废</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="使用时间" prop="date">
        <template #default="{row}">
          {{dayjs(row.start_time).format('YYYY-MM-DD')}} - {{dayjs(row.end_time).format('YYYY-MM-DD')}}
        </template>
      </el-table-column>
      <el-table-column label="发放量" prop="total_cnt"/>
      <el-table-column label="已领取" prop="received_cnt"/>
      <el-table-column label="已使用" prop="used_cnt"/>
      <el-table-column label="剩余数量" prop="unclaimed_cnt"/>
      <el-table-column label="操作时间" prop="updated_at">
        <template #default="{row}">
          {{dayjs(row.updated_at).format('YYYY-MM-DD')}}
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{row}">
          <el-button type="danger" size="small" link @click="stopCoupon(1,row.id)" v-if="row.status==1">终止</el-button>
          <el-button type="primary" size="small" link v-if="row.status==2">已终止</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!--优惠券表单-->
    <Teleport to="body" v-if="isShowForm">
      <div class="coupon__overlay">
        <div class="coupon__form">
          <!--基本信息-->
          <div class="coupon__form__basicInfo">
            <span style="font-size: 18px;font-weight: bold">优惠券信息</span>
            <div class="basicInfo__form">
              <el-form ref="ruleFormRef" :label-position="'right'" style="max-width: 600px;margin-top: 24px" label-width="auto" :model="ruleForm" :rules="rules">
                <el-form-item label="优惠券名称" style="margin-right: 8px; margin-bottom: 24px" prop="title">
                  <el-input style="width: 200px" v-model="ruleForm.title"></el-input>
                </el-form-item>
                <el-form-item label="使用时间" style="margin-bottom: 24px" prop="date">
                  <el-date-picker
                    type="daterange"
                    range-separator="To"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
                    :popper-options="popperOptions"
                    v-model="ruleForm.date"
                  />
                </el-form-item>
                <el-form-item label="活动时间" style="margin-bottom: 24px" prop="day">
                  <el-date-picker
                    type="daterange"
                    range-separator="To"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
                    :popper-options="popperOptions"
                    v-model="ruleForm.day"
                  />
                </el-form-item>
                <el-form-item label="使用门槛" style="margin-bottom: 24px" prop="price">
                  <span style="display:flex;height: 24px;align-items: center">满<el-input style="width: 100px" v-model="ruleForm.price"></el-input>元可用，0元则表示无门槛</span>
                </el-form-item>
                <el-form-item label="优惠金额" style="margin-bottom: 24px;display:flex;height: 24px;align-items: center" prop="discount">
                  <span>减</span><el-input placeholder="请输入整数金额" style="width: 140px" v-model="ruleForm.discount"></el-input><span>元</span>
                </el-form-item>
                <el-form-item label="发放数量" style="margin-bottom: 24px;display:flex;height: 24px;align-items: center" prop="number">
                  <el-input style="width: 80px;" v-model="ruleForm.number"></el-input><span>张</span>
                </el-form-item>
                <el-form-item label="每人限领" style="margin-bottom: 24px" prop="limit">
                  <span style="display:flex;height: 24px;align-items: center"><el-input style="width: 80px;" v-model="ruleForm.limit"></el-input>次</span>
                </el-form-item>
              </el-form>
            </div>
          </div>
          <div class="coupon__btn">
            <el-button type="primary" style="width: 100px;margin-right: 24px" @click="submitForm">确定</el-button>
            <el-button style="width: 100px;" @click="cancelForm">取消</el-button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
//添加优惠券模块
.addCoupon__container {
  display: flex;
  flex-direction: column;
  .addCoupon__top {
    margin-bottom: 24px;
  }
}
//优惠券表单遮罩层
.coupon__overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  //优惠券表单
  .coupon__form {
    display: flex;
    flex-direction: column;
    background: white;
    padding: 16px;
    border-radius: 4px;
    border: 1px solid #ccc;
    //基本信息\优惠信息
    .coupon__form__basicInfo {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      margin-bottom: 16px;
      padding: 4px 16px;
      //表单细节
      .basicInfo__form {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        padding: 0 32px;
        border: 1px solid #ccc;
        margin-top: 4px;
        border-radius: 4px;
      }
    }
  }
}
.coupon__btn {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
<!--状态查询有问题-->
