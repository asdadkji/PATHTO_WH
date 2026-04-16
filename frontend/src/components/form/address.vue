<script setup lang="ts">
import {computed, onMounted, reactive, ref, watch} from "vue";
import type {FormRules} from "element-plus";
import type {updateAddress} from "@/types/store/address.ts";
import {cloneDeep, isEqual} from "lodash-es";
//引入用户仓库
import {useAuthStore} from "@/stores/auth.ts";
const authStore = useAuthStore()
//引入地址仓库
import {useAddressStore} from '@/stores/address.ts'
const addressStore = useAddressStore()
//表单数据类型
interface RuleForm extends updateAddress{
  school: string
}
//表单数据
const ruleForm = reactive<Omit<RuleForm, 'id'>>({
  userId: authStore.userId || 0,
  username: '',
  phone: 0,
  school: '金陵科技学院',
  address: '',
  isDefault:false
})
//表单验证规则
const rules = reactive<FormRules<RuleForm>>({
  username: [
    {required: true, message: '请输入姓名', trigger: 'blur'},
  ],
  phone: [
    {required: true, message: '请输入电话', trigger: 'blur'},
    {pattern: /^1[3456789]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur'}
  ],
  address: [
    {required: true, message: '请输入地址', trigger: 'blur'},
  ],
})
//emit
const emit = defineEmits(['close','submit'])
//关闭表单
const closeAddress = () => {
  emit('close')
}
//判定是否默认地址
const isDefault = ref(false)
//props
const props = withDefaults(defineProps<{
  originalData?: updateAddress | null
  mode: 'create' | 'edit'
}>(),{mode:'create'})
//深拷贝-克隆数据
const originalDataClone = ref<updateAddress | null>(null)
//克隆
const initializeForm = () => {
  if( props.mode === 'edit' && props.originalData) {
    originalDataClone.value = cloneDeep(props.originalData)
    Object.assign(ruleForm,{
      userId:props.originalData.userId,
      username:props.originalData.username,
      phone:props.originalData.phone,
      address:props.originalData.address,
      isDefault:props.originalData.isDefault ?? false
    })
    /*isDefault.value = props.originalData?.isDefault ?? false*/
  } else {
    Object.assign(ruleForm,{
      userId:authStore.userId || 0,
      username:'',
      phone:0,
      address:'',
      isDefault:false
    })
    /*isDefault.value = false*/
    originalDataClone.value = null
  }
}
//监测原始数据，启动克隆
watch(()=> props.originalData,initializeForm,{immediate:true})
//返回二次输入修正后的表单数据
const getChangeFields = () => {
  if (props.mode !== 'edit' || !originalDataClone.value) {
    return {...ruleForm,isDefault:ruleForm.isDefault}
  }
  const changes:Partial<updateAddress> = {}
  const currentFormData = {...ruleForm,isDefault:ruleForm.isDefault}
  Object.keys(currentFormData).forEach(key => {
    const field = key as keyof Omit<updateAddress, 'id'>
    if (!isEqual(currentFormData[field],originalDataClone.value![field])) {
      changes[field] = currentFormData[field] as any
    }
  })
  return changes
}
//判定前后两次是否有修改痕迹
const hasChanges = computed(() => {
  if (props.mode !== 'edit' || !originalDataClone.value) return true
  const changes = getChangeFields()
  return Object.keys(changes).length > 0
})
//触发父组件提交表单
const submit = () => {
  const userId = authStore.userId || 1
  const addressData = {
    userId: userId,
    username: ruleForm.username,
    phone: ruleForm.phone,
    address: ruleForm.address,
    isDefault: ruleForm.isDefault
  }
  const finalData = props.mode === 'edit' ? {id: props.originalData?.id,...getChangeFields(),userId:userId} : addressData
  emit('submit',finalData)
  /*addressStore.addAddress(addressData)*/
  closeAddress()
}
//标题自适应
const title = computed(() => props.mode === 'edit' ? '编辑地址' : '添加地址')
</script>

<template>
  <Teleport to="body">
    <div class="address__overlay">
      <div class="address__container">
        <!--头部-->
        <span>{{title}}</span>
        <!--表单-->
        <el-form style="max-width: 590px;margin-top: 24px" label-width="auto" :size="'large'" :label-position="'right'" :rules="rules" :model="ruleForm">
          <el-form-item label="收货人姓名" prop="name" style="margin-bottom: 24px">
            <el-input v-model="ruleForm.username" placeholder="请输入收货人姓名" />
          </el-form-item>
          <el-form-item label="联系电话" prop="phone" style="margin-bottom: 24px">
            <el-input v-model="ruleForm.phone" placeholder="请输入联系电话" />
          </el-form-item>
          <el-form-item label="所在地区" prop="school" style="margin-bottom: 24px">
            <el-input v-model="ruleForm.school" placeholder="请输入所在地区" :disabled="true"/>
          </el-form-item>
          <el-form-item label="详细地址" prop="address" style="margin-bottom: 24px">
            <el-input v-model="ruleForm.address" placeholder="请输入详细地址" />
          </el-form-item>
          <el-form-item style="margin-bottom: 16px;margin-left: 14px">
            <el-checkbox v-model="ruleForm.isDefault">设为默认收货地址</el-checkbox>
          </el-form-item>
          <el-form-item style="margin-bottom: 24px; padding-left: 388px">
            <el-button style="padding: 8px 16px" @click="closeAddress">取消</el-button>
            <el-button type="danger" style="padding: 8px 16px" @click="submit" :disabled="mode === 'edit' && !hasChanges">保存并使用</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.address__container {
  width: 600px;
  height: 460px;
  padding: 16px;
  background-color: #fff;
  border: 1px solid #ccc;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  span {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 16px;
  }
}
.address__overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
</style>

<!--默认地址有问题，其余无大碍-->
