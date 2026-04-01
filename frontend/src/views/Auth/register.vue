<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { type FormItemRule} from "element-plus";
//引入auth仓库
import {useAuthStore} from "@/stores/auth.ts";
const authStore = useAuthStore();
//引入路由
import router from "@/router";
//ts
interface FieldItem {
  key: string
  label: string
  type: string
  rules?: any[]
  placeholder?: string
  maxlength?: number
  sms?: boolean
}
type FormShape = Record<string, string | boolean>
type RuleItem = any
type RulesMap = Record<string, RuleItem[] | undefined>
//自定义验证
const validatePass2:FormItemRule['validator'] = (_, value, callback) => {
  if (value === '') callback(new Error('请再次输入密码'))
  else if (value !== form.password) callback(new Error('两次输入密码不一致!'))
  else callback()
}
//表单内容
const fields:FieldItem[] = reactive([
  {
    key: 'username',
    label: '用户名',
    type: 'input',
    placeholder: '请输入你想要的昵称',
    maxlength: 20,
    rules: [
      { required: true, message: '请输入你的昵称', trigger: 'blur' },
      { min: 3, max: 10, message: '长度在 3 到 10 个字符', trigger: 'blur' },
    ]
  },
  {
    key: 'mobile',
    label: '手机号码',
    type: 'input',
    placeholder: '请输入您常用的手机号码',
    maxlength: 11,
    rules: [
      { required: true, message: '请输入手机号码', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
    ]
  },
  {
    key: 'password',
    label: '设置密码',
    type: 'password',
    placeholder: '请输入密码',
    rules: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
    ]
  },
  {
    key: 'confirmPwd',
    label: '确认密码',
    type: 'password',
    placeholder: '请再次输入密码',
    rules: [
      { required: true, validator:validatePass2 ,trigger: 'blur' }
    ]
  },
  {
    key: 'smsCode',
    label: '短信验证码',
    type: 'input',
    placeholder: '请输入短信验证码',
    maxlength: 6,
    sms: true,
    rules: [
      { required: true, message: '请输入短信验证码', trigger: 'blur' },
      { pattern: /^\d{6}$/, message: '请输入正确的短信验证码', trigger: 'blur' }
    ]
  }
])
//表单值
const form = reactive<FormShape>(fields.reduce<Record<string, string | boolean>>((obj, f) => {
  obj[f.key] = f.type === 'checkbox' ? false : ''
  return obj
}, {}))
//表单验证规则
const rules = computed<RulesMap>(() => fields.reduce<RulesMap>((obj, f) => {
    obj[f.key] = f.rules
    return obj
  }, {}))
//提交表单
const submit = async () => {
  if (!form.smsCode || !validate(form.smsCode as string)) {
    alert('请先获取短信验证码或验证码错误')
    return
  }
  const formData = {
    username: form.username,
    password: form.password,
    phone: Number(form.mobile)
  }
  try {
    await authStore.registerAction(formData)
    alert('注册成功')
    await router.push('/auth/login')
  } catch (e:any) {
    alert(e.message || '注册失败')
  }
}
//验证码模块
const code = ref('')
const remaining = ref<number>(0)
const isSending = computed(() => remaining.value > 0)
//发送验证码
const sendCode = () => {
  code.value = '123456'
  remaining.value = 60
  startCountdown()
}
//校验验证码
const validate = (input:string) => {
  return input === code.value
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
</script>

<template>
  <div class="register__container">
    <!--标题-->
    <div class="register__top">
      <span>新用户注册</span>
      <p><span>已有账号？</span><router-link to="/auth/login">请登录</router-link></p>
    </div>
    <!--表单-->
    <el-form
      class="register__form"
      :model="form"
      :rules="rules"
      label-width="auto"
      size="large"
    >
      <el-form-item
        v-for="f in fields"
        :key="f.key"
        :label="f.label"
        :prop="f.key"
        :show-message="true"
      >
        <!--输入框-->
        <el-input
          v-if="f.type === 'input' || f.type === 'password'"
          v-model="form[f.key]"
          :type="f.type"
          :placeholder="f.placeholder"
          :maxlength="f.maxlength"
          :show-password="f.type === 'password'"
          clearable
        >
          <!--短信验证码插槽-->
          <template #append v-if="f.sms">
            <el-button
              style="width: 100px"
              :disabled="remaining > 0"
              @click="sendCode"
            >
              {{ isSending ?`${remaining}s`:'获取验证码' }}
            </el-button>
          </template>
        </el-input>
      </el-form-item>
      <!--提交按钮-->
      <el-form-item>
        <el-button type="primary" style="width: 100%" @click="submit">
          立即注册
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
//注册容器
.register__container {
  display: flex;
  flex-direction: column;
  background: whitesmoke;
  padding: 24px;
  margin: 40px auto;
  width: 450px;
  border-radius: 8px;
  //注册标题
  .register__top {
    @include flex-row-sb;
    margin-bottom: 16px;
  }
}
//快捷登录入口
.register__top > span {
  font-weight: 600;
  font-size: 24px;
  margin-bottom: 16px;
  &::before {
    content: "|";
    color: #bc7c3e;
    margin-right: 8px;
  }
}
//快捷登录
.register__top p {
  display: flex;
  flex-direction: row;
  span {
    margin-right: 4px;
  }
}
//错误提示
.el-form-item {
  margin-bottom: 24px;
}
</style>
<!--短信模块尚未载入，验证逻辑需要加强，且目前报错不体现-->
