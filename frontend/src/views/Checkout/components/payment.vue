<script setup lang="ts">
import {onMounted, reactive, ref, watch, computed} from "vue";
import {ElMessage, type FormInstance, ElLoading} from "element-plus";
//引入购物车仓库
import {useCartStore} from "@/stores/cart.ts";
const cartStore = useCartStore()
//引入订单仓库
import {useOrderStore} from "@/stores/orders.ts";
const orderStore = useOrderStore()
//引入用户仓库
import {useAuthStore} from "@/stores/auth.ts";
const userStore = useAuthStore()
//路由
import {useRoute, useRouter} from "vue-router";
const route = useRoute()
const router = useRouter()

//表单配置
interface RuleForm {
  payway: string
  payPwd: string
}
const ruleForm = reactive<RuleForm>({
  payway: '',
  payPwd: ''
})
const rules = reactive({
  payway: [
    { required: true, message: '请选择支付方式', trigger: 'change' },
  ],
  payPwd: [
    { required: true, message: '请输入支付密码', trigger: 'blur' },
    { min: 6, max: 6, message: '支付密码为6位数字', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '请输入6位数字支付密码', trigger: 'blur' }
  ]
})
const formRef = ref<FormInstance>()

// 判断是从购物车过来的还是从订单列表过来的
const isFromCart = ref(false)
const orderIds = ref<number[]>([])
const loading = ref(false)
const paymentSuccess = ref(false)
const paymentError = ref(false)
const paymentMessage = ref('')

// 支付方式配置
const paymentMethods = [
  { value: 'wechat', label: '微信支付', icon: '💚' },
  { value: 'alipay', label: '支付宝', icon: '💙' },
  { value: 'cash', label: '现金支付', icon: '💵' }
]

// 计算总金额
const totalAmount = computed(() => {
  // 如果是购物车过来的，使用购物车总价
  if (isFromCart.value) {
    const price = cartStore?.finalPrice || 0
    return Number(price).toFixed(2)
  }

  // 如果是订单列表过来的，计算订单总价
  if (orderIds.value.length === 0) return '0.00'

  let total = 0
  for (const id of orderIds.value) {
    // 从订单仓库中查找订单
    let order = orderStore.allOrdersList.find(o => o.id === id)
    if (!order) {
      order = [
        ...orderStore.paidOrdersList,
        ...orderStore.pendingOrdersList,
        ...orderStore.confirmedOrdersList,
        ...orderStore.shippedOrdersList,
        ...orderStore.deliveredOrdersList,
        ...orderStore.completedOrdersList
      ].find(o => o.id === id)
    }

    if (order) {
      const price = Number(order.final_price || order.book_snapshot?.price || 0)
      total += price
    }
  }

  return total.toFixed(2)
})

// 计算订单数量
const orderCount = computed(() => {
  return orderIds.value.length
})

watch(() => route.query, (newQuery) => {
  // 检查是否有 fromCart 参数
  if (newQuery.fromCart === 'true') {
    isFromCart.value = true
  } else {
    isFromCart.value = false
  }

  // 处理订单ID
  if (newQuery.orderIds) {
    orderIds.value = (newQuery.orderIds as string).split(',').map(Number)
  } else {
    orderIds.value = []
  }
}, { immediate: true })

// 付款
const handlePayment = async () => {
  if(!formRef.value) return
  try {
    await formRef.value.validate()

    // 显示加载状态
    loading.value = true
    paymentSuccess.value = false
    paymentError.value = false
    paymentMessage.value = ''

    ElMessage.info('正在处理支付，请稍候...')

    // 模拟支付处理时间
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 支付接口
    for (const id of orderIds.value) {
      await orderStore.processPaymentApi(userStore?.userId ?? 1, id, ruleForm.payway, Date.now())
    }

    // 显示支付成功
    paymentSuccess.value = true
    paymentMessage.value = '支付成功！正在跳转到首页...'
    ElMessage.success('支付成功')

    // 清除购物车
    for (const id of orderIds.value) {
      cartStore.deleteGoods(id)
    }

    // 跳转到首页
    setTimeout(() => {
      router.replace({name: 'home'})
    }, 2000)

  } catch (e: any) {
    console.log('支付失败:', e)
    paymentError.value = true
    paymentMessage.value = e.message || '支付失败，请重试'
    ElMessage.error(paymentMessage.value)
  } finally {
    loading.value = false
  }
}

// 订单验证
onMounted(() => {
  if (!orderIds.value || orderIds.value.length === 0) {
    ElMessage.error('缺少订单信息')
    router.back()
  }
})
</script>

<template>
  <div class="payment-container">
    <!-- 顶部标题 -->
    <div class="payment-header">
      <h2>订单支付</h2>
      <p class="payment-subtitle">请选择支付方式并完成支付</p>
    </div>

    <!-- 支付卡片 -->
    <div class="payment-card">
      <!-- 订单信息 -->
      <div class="order-info">
        <div class="order-item">
          <span class="label">订单数量：</span>
          <span class="value">{{ orderCount }} 个订单</span>
        </div>
        <div class="order-item">
          <span class="label">支付金额：</span>
          <span class="amount">￥{{ totalAmount }}</span>
        </div>
      </div>

      <!-- 支付方式选择 -->
      <el-form :rules="rules" ref="formRef" :model="ruleForm" label-width="80px">
        <el-form-item label="支付方式" prop="payway">
          <div class="payment-methods">
            <div
              v-for="method in paymentMethods"
              :key="method.value"
              class="payment-method-item"
              :class="{ active: ruleForm.payway === method.value }"
              @click="ruleForm.payway = method.value"
            >
              <div class="method-icon">{{ method.icon }}</div>
              <div class="method-info">
                <div class="method-name">{{ method.label }}</div>
                <div class="method-desc">安全支付</div>
              </div>
              <el-radio v-model="ruleForm.payway" :label="method.value" style="margin-left: auto" />
            </div>
          </div>
        </el-form-item>

        <!-- 支付密码 -->
        <el-form-item label="支付密码" prop="payPwd" style="margin-top: 24px;margin-bottom: 24px">
          <el-input
            type="password"
            placeholder="请输入6位数字支付密码"
            show-password
            v-model="ruleForm.payPwd"
            maxlength="6"
          ></el-input>
        </el-form-item>

        <!-- 支付状态 -->
        <div v-if="paymentSuccess" class="payment-status success">
          <el-icon class="status-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></el-icon>
          <span>{{ paymentMessage }}</span>
        </div>

        <div v-if="paymentError" class="payment-status error">
          <el-icon class="status-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></el-icon>
          <span>{{ paymentMessage }}</span>
        </div>

        <!-- 支付按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            style="width: 100%"
            @click="handlePayment"
            :loading="loading"
            :disabled="loading"
          >
            {{ loading ? '支付处理中...' : '立即支付' }}
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 安全提示 -->
      <div class="security-tip">
        <el-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.72V12H5V6.3l7-3.11v8.8z"/></svg></el-icon>
        <span>支付过程受加密保护，请放心使用</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.payment-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;

  .payment-header {
    text-align: center;
    margin-bottom: 30px;

    h2 {
      font-size: 28px;
      font-weight: 600;
      color: #333;
      margin-bottom: 10px;
    }

    .payment-subtitle {
      font-size: 16px;
      color: #666;
    }
  }

  .payment-card {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    padding: 30px;
    width: 100%;
    max-width: 500px;

    .order-info {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #f0f0f0;

      .order-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;

        .label {
          font-size: 14px;
          color: #666;
        }

        .value {
          font-size: 14px;
          color: #333;
        }

        .amount {
          font-size: 20px;
          font-weight: 600;
          color: #d33f3f;
        }
      }
    }

    .payment-methods {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .payment-method-item {
        display: flex;
        align-items: center;
        padding: 15px;
        border: 2px solid #f0f0f0;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: #409eff;
          box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
        }

        &.active {
          border-color: #409eff;
          background-color: #ecf5ff;
        }

        .method-icon {
          font-size: 24px;
          margin-right: 15px;
        }

        .method-info {
          flex: 1;

          .method-name {
            font-size: 16px;
            font-weight: 500;
            color: #333;
            margin-bottom: 4px;
          }

          .method-desc {
            font-size: 12px;
            color: #999;
          }
        }
      }
    }

    .payment-status {
      text-align: center;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;

      &.success {
        background-color: #f0f9eb;
        color: #67c23a;
      }

      &.error {
        background-color: #fef0f0;
        color: #f56c6c;
      }

      .status-icon {
        font-size: 24px;
        margin-right: 10px;
        vertical-align: middle;
      }
    }

    .security-tip {
      margin-top: 20px;
      text-align: center;
      font-size: 12px;
      color: #999;

      el-icon {
        margin-right: 5px;
        font-size: 14px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .payment-container {
    padding: 20px 15px;
  }

  .payment-card {
    padding: 20px;
  }

  .payment-header h2 {
    font-size: 24px;
  }
}
</style>
