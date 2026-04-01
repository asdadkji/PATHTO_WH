<script setup lang="ts">
import {reactive} from 'vue'
import {useRoute, useRouter} from "vue-router";
const route = useRoute()
const router = useRouter()
//引入auth仓库
import {useAuthStore} from '@/stores/auth'
const authStore = useAuthStore()
//表单类型
interface RuleForm {
  username: string
  password: string
}
//表单
const ruleForm:RuleForm = reactive({
  username: '',
  password: ''
})
//验证规则
const rules = reactive({
  username: [
    { required: true, message: '请输入管理员账号', trigger: 'blur' },
    { min: 3, max: 10, message: 'Length should be 3 to 10', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: 'Length should be beyond 6', trigger: 'blur' }
  ]
})
//登录
const submitForm = async () => {
  try {
    console.log(ruleForm)
    await authStore.loginAction(ruleForm)
    alert('登录成功')
    // 获取重定向地址
    const redirect = route.query.redirect as string
    if (redirect) {
      // 如果有重定向地址，直接跳转
      await router.push(redirect)
    } else {
      // 没有重定向地址，管理员直接跳转到后台
      if (authStore.isAdmin || authStore.isMaxAdmin || authStore.isTransport) {
        await router.push('/admin')
      } else {
        alert('您没有管理员权限')
      }
    }
  } catch (e:any) {
    alert(e.message || '登录失败')
  }
}
</script>

<template>
  <div class="login__container">
    <!--标题-->
    <span>管理员登录</span>
    <!--表单-->
    <el-form
      style="max-width: 400px"
      :model="ruleForm"
      :rules="rules"
      label-width="auto"
      :size="'large'"
    >
      <el-form-item label="管理员账号" prop="name" :label-position="'top'" style="margin-bottom: 16px">
        <el-input v-model="ruleForm.username"/>
      </el-form-item>
      <el-form-item label="密码" prop="password" :label-position="'top'" style="margin-bottom: 24px">
        <el-input v-model="ruleForm.password" type="password" show-password/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm" class="auth-login__btn" style="margin-bottom: 32px;width: 100%">登录</el-button>
      </el-form-item>
    </el-form>
    <!--返回用户登录-->
    <div class="back-to-user">
      <p><router-link to="/auth/login">返回用户登录</router-link></p>
    </div>
  </div>
</template>

<style scoped lang="scss">
//登录容器
.login__container {
  display: flex;
  flex-direction: column;
  background: whitesmoke;
  padding: 24px;
  margin: 40px auto;
  width: 450px;
  border-radius: 8px;
  //登录标题
  span {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 24px;
    text-align: center;
    color: #333;
  }
  //返回用户登录
  .back-to-user {
    text-align: center;
    p {
      color: #666;
      a {
        color: #409eff;
        text-decoration: none;
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}
</style>
