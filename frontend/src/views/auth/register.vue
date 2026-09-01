<script setup lang="ts">
// 注册页：用户名 + 密码 + 确认密码（密码≥6位），成功后跳登录
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import { register } from '@/apis/auth'

const router = useRouter()

const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({ username: '', password: '', confirm: '' })

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度 3-20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirm: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

async function submit() {
  const f = formRef.value
  if (!f) return
  try {
    await f.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    await register({ username: form.username, password: form.password })
    ElMessage.success('注册成功，快去登录吧！')
    router.replace('/auth/login')
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string }
    const code = e.code
    const friendly =
      code === 1003
        ? '用户名已存在，换一个吧'
        : code === 400
          ? '密码至少 6 位哦'
          : e.message || '注册失败，请稍后重试'
    ElMessage.error(friendly)
  } finally {
    loading.value = false
  }
}

function goLogin() {
  router.push('/auth/login')
}
</script>

<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-position="top"
    size="large"
    @submit.prevent="submit"
  >
    <el-form-item prop="username">
      <el-input
        v-model="form.username"
        placeholder="请输入用户名（3-20 字符）"
        :prefix-icon="User"
        clearable
      />
    </el-form-item>
    <el-form-item prop="password">
      <el-input
        v-model="form.password"
        type="password"
        placeholder="请输入密码（至少 6 位）"
        :prefix-icon="Lock"
        show-password
      />
    </el-form-item>
    <el-form-item prop="confirm">
      <el-input
        v-model="form.confirm"
        type="password"
        placeholder="请再次输入密码"
        :prefix-icon="Lock"
        show-password
        @keyup.enter="submit"
      />
    </el-form-item>
    <el-button type="primary" :loading="loading" class="submit-btn" @click="submit">
      注 册
    </el-button>
    <div class="form-foot">
      已有账号？
      <el-button text type="primary" @click="goLogin">去登录</el-button>
    </div>
  </el-form>
</template>

<style scoped lang="scss">
.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 18px;
  font-weight: 700;
  border-radius: $kid-radius;
  border: none;
  background: linear-gradient(135deg, $kid-primary, $kid-primary-dark);
  box-shadow: 0 6px 16px rgba(255, 112, 67, 0.35);
}
.form-foot {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: $kid-text-light;
}
</style>
