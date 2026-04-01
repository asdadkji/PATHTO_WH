<script setup lang="ts">
import {ref, reactive, watch, onUnmounted, onMounted, computed} from 'vue'
import {ElMessage, ElMessageBox} from "element-plus";
import { useRouter } from 'vue-router'
//引入auth仓库
import {useAuthStore} from '@/stores/auth'
const authStore = useAuthStore()
const router = useRouter()

//刷新保留
const STEP_KEY = 'forget-step'
const active = ref(Number(sessionStorage.getItem(STEP_KEY) || 0))
watch(active, (val) => sessionStorage.setItem(STEP_KEY, String(val)))

// 标记是否处于密码重置流程
let isInResetFlow = false
// 记录进入时的路径
let entryPath = ''

//表单数据
const form = reactive({
  account: '',
  captcha: '',
  smsCode: '',
  password: '',
  confirm: '',
  phone: ''
})

//ts
type FormKey = keyof typeof form
interface FieldItem {
  key: FormKey
  label: string
  type: string
  placeholder?: string
  maxlength?: number
  value?: () => void
}
interface StepItem {
  title: string
  fields: FieldItem[]
  primaryText: string
  prevText: string
  nextAction: () => void
}
//动画标签
const dir = ref<'next' | 'prev'>('next')
//验证码模块
const smsCode = ref('')
const remaining = ref<number>(0)
const isSending = computed(() => remaining.value > 0)
//发送验证码
const sendCode = () => {
  code.value = '123456'
  remaining.value = 60
  startCountdown()
}
//倒计时
const startCountdown = () => {
  const timer = setTimeout(() => {
    remaining.value--
    if (remaining.value <= 0){
      clearTimeout(timer)
      code.value = ''
    }
  },1000)
}
//验证规则
const rules = reactive({
  account: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  captcha: [
    { required: true, message: '请输入图片验证码', trigger: 'blur' },
  ],
})
//步骤详情
const steps: StepItem[] = [
  {
    title: '账户名',
    fields: [
      { key: 'account', label: '用户名', type: 'input', placeholder: '用户名' },
      { key: 'captcha', label: '验证码', type: 'input', placeholder: '请输入验证码' }
    ],
    primaryText: '下一步',
    prevText: '',
    nextAction: async () => {
      try {
        const isExist = await authStore.beforeResetPwdAction(form.account, Number(form.phone))
        if (isExist) next()
        else ElMessage.warning('用户不存在或绑定手机号填写错误，请确认本人是否拥有本平台账户')
        if(form.captcha === code.value) {
          next()
        } else ElMessage.warning('验证码错误，请重新输入')
      }catch (e:any) {
        ElMessage.error(e.message)
      }
    }
  },
  {
    title: '验证身份',
    fields: [
      { key: 'phone', label: '', type: 'display', value: () => `已验证手机${form.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}` },
      { key: 'smsCode', label: '验证码', type: 'sms', placeholder: '请输入手机验证码', maxlength: 6 },
    ],
    primaryText: '下一步',
    prevText: '上一步',
    nextAction: () => {
      if (form.smsCode && form.smsCode === smsCode.value) next();
      else ElMessage.warning('验证码错误')
    }
  },
  {
    title: '设置密码',
    fields: [
      { key: 'password', label: '设置密码', type: 'password', placeholder: '请输入新密码' },
      { key: 'confirm', label: '确认密码', type: 'password', placeholder: '请再次输入新密码' },
    ],
    primaryText: '下一步',
    prevText: '上一步',
    nextAction: async () => {
      if (form.password.length < 6) return ElMessage.warning('密码长度不能小于6位');
      if (form.password !== form.confirm) return ElMessage.warning('两次输入的密码不一致');
      const formData = {
        username: form.account,
        password: form.password,
      }
      console.log(formData)
      await authStore.resetPwdAction(formData)
      sessionStorage.removeItem(STEP_KEY)
      next();
    }
  },
  {
    title: '完成',
    fields: [],
    primaryText: '',
    prevText: '',
    nextAction: () => {}
  }
]
//上下步
const next = () => {
  dir.value = 'next';
  active.value++
}
const prev = () => {
  dir.value = 'prev';
  active.value--
}
//计时自动跳转
let jumpTimer:number | null = null;
watch(active, val => {
  if (val === 3) {
    jumpTimer =setTimeout(() => {
      ElMessage.success('即将跳转登录页')
      setTimeout(() => location.replace('/auth/login'), 500)
    },5000)
  } else {
    clearTimeout(jumpTimer!)
  }
})
//计时器
let timer: number | null = null
//收尾清理
onUnmounted(() => {
  clearInterval(timer!)
  clearTimeout(jumpTimer!)
  sessionStorage.removeItem(STEP_KEY)
  // 移除事件监听
  window.removeEventListener('popstate', handlePopState)
})
//验证图片
const canvas = ref()
const code = ref('')
const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
const draw = () => {
  const el = canvas.value
  if(!el) return
  const ctx = el.getContext('2d')!
  if(!ctx) return;
  ctx.clearRect(0, 0, 120, 40)

  // 背景
  ctx.fillStyle = '#f3f3f3'
  ctx.fillRect(0, 0, 120, 40)

  // 干扰线
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = randomColor(160, 250)
    ctx.beginPath()
    ctx.moveTo(Math.random() * 120, Math.random() * 40)
    ctx.lineTo(Math.random() * 120, Math.random() * 40)
    ctx.stroke()
  }

  // 文字
  ctx.font = 'bold 24px Arial'
  ctx.fillStyle = randomColor(50, 160)
  for (let i = 0; i < code.value.length; i++) {
    ctx.save()
    ctx.translate(i * 20 + 10, 20)
    ctx.rotate((Math.random() - 0.5) * 0.4)
    ctx.fillText(code.value[i], 0, 0)
    ctx.restore()
  }

  // 干扰点
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = randomColor(160, 250)
    ctx.beginPath()
    ctx.arc(Math.random() * 120, Math.random() * 40, 1, 0, 2 * Math.PI)
    ctx.fill()
  }
}
const randomColor = (min:number, max:number) => {
  const r = Math.floor(Math.random() * (max - min) + min)
  const g = Math.floor(Math.random() * (max - min) + min)
  const b = Math.floor(Math.random() * (max - min) + min)
  return `rgb(${r},${g},${b})`
}
const refresh = () => {
  code.value = generateCode()
  draw()
}
onMounted(() => {
  refresh()

  // 记录进入密码重置流程
  isInResetFlow = true
  entryPath = window.location.pathname

  // 添加历史记录状态
  history.pushState({ fromReset: true }, '')

  // 监听浏览器后退事件
  window.addEventListener('popstate', handlePopState)
})

// 处理浏览器后退
const handlePopState = (event: PopStateEvent) => {
  // 防止默认后退行为
  event.preventDefault()

  // 如果在密码重置流程中
  if (isInResetFlow) {
    // 显示确认对话框（可选）
    ElMessageBox.confirm(
      '确定要退出密码重置吗？所有未保存的进度将会丢失。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
      .then(() => {
        // 用户确认退出
        isInResetFlow = false
        sessionStorage.removeItem(STEP_KEY)
        router.push('/') // 跳转到首页
      })
      .catch(() => {
        // 用户取消，重新添加历史记录
        history.pushState({ fromReset: true }, '')
      })
  }
}
</script>

<template>
  <div class="forget__container">
    <!--标题-->
    <span>找回密码</span>
    <!--步骤条-->
    <el-steps style="max-width: 500px; margin-bottom: 16px" :active="active" finish-status="success" align-center>
      <el-step title="填写信息" />
      <el-step title="验证身份" />
      <el-step title="设置密码" />
      <el-step title="完成" />
    </el-steps>
    <!--具体步骤-->
    <div class="step-wrapper">
      <Transition :name="dir" mode="out-in">
        <div :key="active" class="step-box">
          <!--填写账号-->
          <div v-if="active === 0">
            <el-form
              :model="form"
              label-width="auto"
              :size="'large'"
              :rules="rules"
            >
              <el-form-item label="账户名" prop="account" :label-position="'top'" style="margin-bottom: 16px">
                <el-input v-model="form.account" placeholder="用户名" clearable/>
              </el-form-item>
              <el-form-item label="已绑定的手机号" prop="phone" :label-position="'top'" style="margin-bottom: 16px">
                <el-input v-model="form.phone" placeholder="手机号" clearable/>
              </el-form-item>
              <el-form-item label="验证码" prop="code" style="margin-bottom: 16px" :label-position="'top'">
                <el-input v-model="form.captcha" placeholder="请输入右图验证码" clearable style="width: 350px"/>
                <canvas ref="canvas" width="90px" height="40px"></canvas>
                <el-button type="info" style="width: 60px;" @click="refresh">换一张</el-button>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" class="forget__btn" @click="steps[0]?.nextAction()">下一步</el-button>
              </el-form-item>
            </el-form>
          </div>
          <!--验证身份、设置密码-->
          <div v-if="active === 1 || active === 2">
            <el-form label-width="auto" :size="'large'" :rules="rules" :model="form">
              <el-form-item
                v-for="f in steps[active]?.fields"
                :key="f.key"
                :label="f.type === 'display' ? '手机号' : f.label"
                :prop="f.key"
                :label-position="'left'"
              >
                <!--验证身份-->
                <div v-if="f.type === 'display'" class="display-text">{{ f.value?.() }}</div>
                <div v-else-if="f.type === 'sms'" style="display: flex;flex-direction: row; justify-content: space-between; width: 100%">
                  <el-input v-model="form[f.key]" :placeholder="f.placeholder" :maxlength="f.maxlength"/>
                  <el-button
                    style="margin-left: 16px"
                    :disabled="remaining > 0"
                    @click="sendCode"
                  >
                    {{ isSending ?`${remaining}s`:'获取验证码' }}
                  </el-button>
                </div>
                <!--密码重置-->
                <el-input
                  v-else v-model="form[f.key]"
                  :type="f.type"
                  :placeholder="f.placeholder"
                  clearable
                  :show-password="f.type === 'password'"
                  style="margin-bottom: 16px"
                >
                </el-input>
              </el-form-item>
              <!--上下步按钮-->
              <el-form-item>
                <el-button v-if="steps[active]?.prevText" @click="prev" class="forget__btn">{{ steps[active]?.prevText }}</el-button>
                <el-button @click="steps[active]?.nextAction" class="forget__btn">{{ steps[active]?.primaryText }}</el-button>
              </el-form-item>
            </el-form>
          </div>
          <!--完成-->
          <div v-if="active === 3">
            <el-result icon="success" title="重置成功" subTitle="4 秒后自动跳转至登录页面">
              <template #extra>
                <el-button @click="$router.replace('/')" class="home-login">去首页</el-button>
                <el-button type="primary" @click="$router.push('/auth/login')" class="home-login">立即跳转</el-button>
              </template>
            </el-result>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>


<style scoped lang="scss">
//找回密码容器
.forget__container {
  width: 550px;
  margin: 40px auto;
  display: flex;
  flex-direction: column;
  background: whitesmoke;
  padding: 24px;
  border-radius: 8px;
  //标题
  span {
    font-weight: 600;
    font-size: 24px;
    margin-bottom: 16px;
    &::before {
      content: '|';
      color: #409eff;
      margin-right: 8px;
    }
  }
}
//动画
.step-wrapper {
  position: relative;
  overflow: hidden;
}
form.step-box {
  position: absolute;
  width: 100%;
  transition: transform .35s ease-out, opacity .35s;
}
.next-enter-form {
  transform: translateX(100%);
  opacity: 0;
}
.next-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
.prev-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}
.prev-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
//按钮
.forget__btn {
  padding: 4px 16px;
  width: 100%;
  margin-top: 16px;
}
//登录/主页回调
.home-login {
  padding: 8px 16px;
}
</style>
