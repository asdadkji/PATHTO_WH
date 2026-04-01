<script setup lang="ts">
import {reactive} from 'vue'
import {useRoute, useRouter} from "vue-router";
const route = useRoute()
const router = useRouter()
//引入auth仓库
import {useAuthStore} from '@/stores/auth'
const authStore = useAuthStore()
//引入路由
/*import router from "@/router";*/
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
    { required: true, message: '请输入学号', trigger: 'blur' },
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
      // 没有重定向地址，根据角色跳转到对应首页
      if (authStore.isAdmin || authStore.isMaxAdmin || authStore.isTransport) {
        await router.push('/admin')
      } else if (authStore.isMerchant) {
        await router.push('/home')
      } else {
        await router.push('/home')
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
    <span>用户登录</span>
    <!--表单-->
    <el-form
      style="max-width: 400px"
      :model="ruleForm"
      :rules="rules"
      label-width="auto"
      :size="'large'"
    >
      <el-form-item label="用户名" prop="name" :label-position="'top'" style="margin-bottom: 16px">
        <el-input v-model="ruleForm.username"/>
      </el-form-item>
      <el-form-item label="密码" prop="password" :label-position="'top'" style="margin-bottom: 24px">
        <el-input v-model="ruleForm.password"/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm" class="auth-login__btn" style="margin-bottom: 32px">登录</el-button>
      </el-form-item>
    </el-form>
    <!--注册/重置-->
    <div class="register-reset">
      <p>没有账号？<router-link to="/auth/register">注册</router-link></p>
      <p>忘记密码？<router-link to="/auth/forget">重置密码</router-link></p>
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
    font-weight: 600;
    font-size: 24px;
    margin-bottom: 16px;
    //标题装饰
    &::before {
      content: "|";
      color: #FF4B60;
      margin-right: 8px;
    }
  }
  //按钮
  .auth-login__btn {
    padding: 4px 8px;
    width: 100%;
  }
}
//注册/重置跳转
.register-reset {
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  margin-top: 8px;
  p {
    color: #737373;
    &:hover {
      color: #454545;
      cursor: pointer;
    }
  }
}
</style>
<!--登录回调、验证、pinia关联尚未解决，整体布局已到位-->
