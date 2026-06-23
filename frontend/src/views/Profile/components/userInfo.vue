<script setup lang="ts">
import {ref, reactive, onMounted, watch} from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { UploadProps } from 'element-plus'
import type { FormItemRule } from 'element-plus'
//ts
import type {User} from '@/types/api/user.ts'
//上传图片
const imageUrl = ref('')
const handleAvatarSuccess: UploadProps['onSuccess'] = async (response, uploadFile) => {
  // 显示本地预览
  imageUrl.value = URL.createObjectURL(uploadFile.raw!)
  // 同时更新到表单数据
  formData.value.avatar_url = imageUrl.value
}
const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png' && rawFile.type !== 'image/gif') {
    ElMessage.error('头像图片格式必须是 JPG、PNG 或 GIF！')
    return false
  } else if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error('头像图片大小不能超过 2MB！')
    return false
  }
  return true
}
//判定是否展示昵称修改
const isShowName = ref(true)
//表单规则验证
const rules = reactive({
  username: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 1, max: 10, message: '长度在 1 到 10 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  qq: [
    { required: true, message: '请输入QQ号', trigger: 'blur' },
    {
      pattern: /^[1-9]\d{4,9}$/,          // 首位非 0，且总共 5-10 位数字
      message: '请输入 5-10 位数字，首位不能为 0',
      trigger: 'blur'
    },
    {
      validator: (rule:FormItemRule, value:string, callback:(error?:Error)=>void) => {
        if (!/^\d+$/.test(value)) {
          callback(new Error('QQ号只能为数字'))
        } else if (!/^[1-9]\d*$/.test(value)) {
          callback(new Error('首位不能为0'))
        } else {
          callback() // 通过
        }
      },
      trigger: 'blur'
    }
  ],
  signature: [
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  bio: [
    { min: 1, max: 200, message: '长度在 1 到 200 个字符', trigger: 'blur' }
  ]
})
//引入用户仓库
import { useUserStore } from '@/stores/user.ts'
const userStore = useUserStore()
//引入auth仓库
import { useAuthStore } from '@/stores/auth.ts'
const authStore = useAuthStore()
//用户信息本地化
const formData = ref<Partial<User>>({})
//初始化用户信息
onMounted(async ()=>{
  if (userStore.hasUserInfo()) {
    formData.value = {...userStore.userInfo}
  }
  const userId = authStore.userId ?? 1
  await userStore.getUserInfoById(userId)
  formData.value = {...userStore.userInfo}
})
//修改次数限制
const hasNumber = ref(Number(localStorage.getItem('hasNumber')) || 2)
//提交表单
const handleSubmit = async () => {
  try {
    const userId = authStore.userId ?? 1
    await userStore.submitFormData(userId, formData.value)
    await userStore.getUserInfoById(userId)
    if(isShowName) hasNumber.value--;
  } catch (e) {
    console.log('提交失败',e)
  }
}
//持久化
watch(hasNumber, (newVal) => {
  localStorage.setItem('hasNumber',hasNumber.value.toString())
},{immediate: true})
//重置表单
const handleReset = () => {
  formData.value = {...userStore.userInfo}
}
</script>

<template>
  <el-form
    :model="formData"
    label-width="auto"
    style="max-width: 600px; border: 1px solid #ccc; padding: 20px; border-radius: 8px"
    :rules="rules"
  >
    <el-form-item label="昵称：" style="display: flex;flex-direction: row; justify-content: center" prop="name">
      <div class="info__username" v-if="isShowName">
        <span>{{ formData.username }}</span>
        <span @click="isShowName = !isShowName" class="info__btn-change">修改</span>
        <p>1年内可修改2次，剩余 {{hasNumber}} 次</p>
      </div>
      <div v-else-if="!isShowName">
        <el-input v-model="formData.username" style="width: 200px; margin-right: 16px"/>
        <el-button style="padding: 4px" @click="()=>{handleSubmit(); isShowName=!isShowName}" :disabled="!hasNumber">保存</el-button>
        <el-button @click="isShowName = !isShowName" style="padding: 4px">取消</el-button>
      </div>
    </el-form-item>
    <!-- <el-form-item label="我的头像：">
      <el-upload
        class="avatar-uploader"
        action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
        :show-file-list="false"
        :on-success="handleAvatarSuccess"
        :before-upload="beforeAvatarUpload"
      >
        <img v-if="imageUrl" :src="imageUrl" class="avatar" />
        <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
      </el-upload>
    </el-form-item> -->
    <el-form-item label="性别：" style="margin-bottom: 16px" prop="sex">
      <el-radio-group v-model="formData.gender">
        <el-radio label="男" style="margin-right: 4px" value="male">男</el-radio>
        <el-radio label="女" style="margin-right: 4px" value="female">女</el-radio>
        <el-radio label="保密">保密</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="手机号：" style="margin-bottom: 16px" prop="phone">
      <el-input v-model="formData.phone" placeholder="请输入手机号" show-password />
    </el-form-item>
    <el-form-item label="QQ号码：" style="margin-bottom: 16px" prop="qq">
      <el-input v-model="formData.qq" placeholder="请输入QQ号" show-password />
    </el-form-item>
    <el-form-item label="学院：" style="margin-bottom: 16px" prop="address">
      <el-input v-model="formData.college"/>
    </el-form-item>
    <el-form-item label="个性签名：" style="margin-bottom: 16px;" prop="signature">
      <el-input type="text" v-model="formData.signature"/>
    </el-form-item>
    <el-form-item label="自我介绍：" style="margin-bottom: 16px" prop="selfintro">
      <el-input type="textarea" v-model="formData.bio"/>
    </el-form-item>
    <el-form-item>
      <el-button type="success" style="padding: 4px 16px" @click="handleSubmit">保存</el-button>
      <el-button type="primary" style="padding: 4px 16px" @click="handleReset">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">
.avatar-uploader .avatar {
  width: 128px;
  height: 128px;
  display: block;
}
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 128px;
  height: 128px;
  text-align: center;
}
.info__username {
  display: flex;
  flex-direction: row;
  align-items: center;
  span {
    margin-right: 8px;
    font-size: 12px;
  }
  p {
    color: #b0b3b6;
    font-size: 12px;
    margin-right: 8px;
  }
}
.info__btn-change {
  color: #409eff;
  &:hover {
    color: #FF4B60;
    cursor: pointer;
  }
}
</style>
<!--验证规则不完整，补足;表单容器为建立，后续仓库等补上-->
