<script setup lang="ts">
// 登录页：用户名 + 密码，校验通过后调用接口；成功 setAuth 并跳转
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import { login } from '@/apis/auth'
import { useAuthStore } from '@/stores/auth'
import type { LoginParams } from '@/types'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive<LoginParams>({ username: '', password: '' })

const rules: FormRules<LoginParams> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function submit() {
  const f = formRef.value
  if (!f) return
  try {
    await f.validate()
  } catch {
    return // 校验未通过
  }
  loading.value = true
  try {
    const data = await login({ ...form })
    auth.setAuth({ token: data.token, userInfo: data.userInfo })
    ElMessage.success('登录成功，欢迎回来！')
    const redirect = route.query.redirect
    const target =
      typeof redirect === 'string' && redirect.startsWith('/')
        ? redirect
        : auth.getRedirectPath
    router.replace(target)
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string }
    const code = e.code
    const msg = e.message || '登录失败，请稍后重试'
    const friendly =
      code === 1001
        ? '密码错误，再试一次吧'
        : code === 1002
          ? '用户不存在哦'
          : code === 400
            ? '请填写完整的用户名和密码'
            : msg
    ElMessage.error(friendly)
  } finally {
    loading.value = false
  }
}

function goRegister() {
  router.push('/auth/register')
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
        placeholder="请输入用户名"
        :prefix-icon="User"
        clearable
      />
    </el-form-item>
    <el-form-item prop="password">
      <el-input
        v-model="form.password"
        type="password"
        placeholder="请输入密码"
        :prefix-icon="Lock"
        show-password
        @keyup.enter="submit"
      />
    </el-form-item>
    <el-button type="primary" :loading="loading" class="submit-btn" @click="submit">
      登 录
    </el-button>
    <div class="form-foot">
      还没有账号？
      <el-button text type="primary" @click="goRegister">立即注册</el-button>
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
