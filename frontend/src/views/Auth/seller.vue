<script setup lang="ts">
import {reactive, ref} from "vue";
import {ElMessage, type FormInstance, type FormRules} from 'element-plus'
interface RuleForm {
  userId:number | null
  userName:string
}
const ruleForm = reactive<RuleForm>({
  userId: null,
  userName: ''
})
const rules = reactive<FormRules>({
  userId: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { min: 1, max: 18, message: 'Length should be 18', trigger: 'blur' }
  ],
  userName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
  ],
  agreement: [
    {
      validator: (rule, value, callback) => {
        if (!checked.value) {
          callback(new Error('请阅读并同意相关协议'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
})
const formRef = ref<FormInstance>()
import {useAuthStore} from "@/stores/auth.ts"
import router from "@/router";
const authStore = useAuthStore()
//提交
const handleSubmit = async () => {
  if(!formRef.value) return
  try {
    await formRef.value.validate()
    if(!checked.value) {
      ElMessage({
        message: '请阅读并同意相关协议',
        type: 'error',
      })
      return
    }
    await authStore.applyForMerchantAction(44, ruleForm.userName)/*authStore.user.id*/
    ElMessage({ message: '认证成功', type: 'success' })
    await router.push({name: 'home'})
  } catch (e) {
    ElMessage.error('请完善信息')
  }
}
const checked = ref(false)
</script>

<template>
  <div class="seller__container">
    <span>卖家认证</span>
    <el-form style="max-width: 400px" label-width="auto" :size="'large'" :model="ruleForm" :rules="rules" label-position="top"b ref="formRef">
      <el-form-item label="身份证号" style="margin-bottom: 24px" prop="userId">
        <el-input v-model="ruleForm.userId" placeholder="请输入您的身份证号"></el-input>
      </el-form-item>
      <el-form-item label="姓名" style="margin-bottom: 24px" prop="userName">
        <el-input v-model="ruleForm.userName" placeholder="请输入您的真实姓名"></el-input>
      </el-form-item>
      <el-form-item style="margin-bottom: 24px;">
        <el-button type="primary" style="width: 100px;margin: 0 auto;" :disabled="!checked" @click="handleSubmit">提交</el-button>
      </el-form-item>
      <el-form-item prop="agreement">
        <el-checkbox v-model="checked" label="请确保您已阅读过卖家手册相关内容，并自愿接受平台和买家对您的监督" class="wrap-checkbox"></el-checkbox>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.seller__container {
  display: flex;
  flex-direction: column;
  background: whitesmoke;
  padding: 24px;
  margin: 40px auto;
  width: 450px;
  border-radius: 8px;
  span {
    font-weight: 600;
    font-size: 24px;
    margin-bottom: 16px;
    &::before {
      content: "|";
      color: #a873d8;
      margin-right: 8px;
    }
  }
}
.wrap-checkbox {
  white-space: normal;
  word-wrap: break-word;
  word-break: break-all;
  color: #989191;
}
</style>
