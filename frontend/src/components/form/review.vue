<script setup lang="ts">
import {reactive, ref} from 'vue'
import type {FormInstance, FormRules} from "element-plus";
//引入评论仓库
import {useReviewStore} from '@/stores/review'
const reviewStore = useReviewStore()
//引入图书仓库
import {useBookStore} from '@/stores/book'
const bookStore = useBookStore()
//引入订单仓库
import {useOrderStore} from '@/stores/orders'
import dayjs from "dayjs";
const orderStore = useOrderStore()
//引入认证仓库
import {useAuthStore} from '@/stores/auth'
const authStore = useAuthStore()
const tags = ref([
  {checked:false, name:'物流很快',value:'delivery_fast'},
  {checked:false, name:'包装完好',value:'good_condition'},
  {checked:false, name:'服务态度好',value: 'good_service'},
  {checked:false, name:'书籍完好',value: 'good_complete'},
  {checked:false, name:'书籍内容完整',value: 'good_book'},
  {checked:false, name:'线下沟通及时',value: 'good_communication'},
])
//表单配置
interface RuleForm {
  comment: string;
  rate:4
  selectedTags:string[]
}
const ruleForm = reactive<RuleForm>({
  comment: '',
  rate:4,
  selectedTags:[]
})
const rule = reactive<FormRules>({
  comment: [
    { required: true, message: '请输入评论内容', trigger: 'blur' },
  ],
  rate: [
    { required: true, message: '请选择评分', trigger: 'blur' },
  ],
  selectedTags: [
    { required: true, message: '请选择标签', trigger: 'blur' },
  ],
})
const ruleFormRef = ref<FormInstance>()
//标签选择
const handleTagChange = (tagVal:string,checked:boolean) => {
  const tag = tags.value.find(t => t.value === tagVal)
  if (tag) {
    tag.checked = checked
  }
  if (checked) {
    if (!ruleForm.selectedTags.includes(tagVal)) {
      ruleForm.selectedTags.push(tagVal)
    }
  } else {
    const index = ruleForm.selectedTags.indexOf(tagVal)
    if (index > -1) {
      ruleForm.selectedTags.splice(index, 1)
    }
  }

}
//重置标签选择
const resetTags = () => {
  tags.value.forEach(tag => {
    tag.checked = false
  })
  ruleForm.selectedTags = []
}
//提交评论
const submitForm = async () => {
  try {
    await ruleFormRef.value?.validate()
    const formData = {
      order_id:props.orderId,
      reviewer_id:authStore.userId || 1,
      reviewed_user_id:props.sellerId,
      role:'buyer',
      rating:Number(ruleForm.rate),
      comment:ruleForm.comment,
      tags:ruleForm.selectedTags,
      is_anonymous:true,
      is_visible:true,
      created_at:dayjs().format('YYYY-MM-DD HH:mm:ss'),
      book_snapshot: {...props.book_snapshot}
    }
    console.log('提交评论数据:', formData)
    const result = await reviewStore.addUserReview(formData)
    console.log('评论提交结果:', result)
    if (result) {
      emit('confirm')
      emit('update:visible', false)
      resetTags()
      ruleForm.comment = ''
      ruleForm.rate = 4
    }
  } catch (error: any) {
    console.error('评论提交失败:', error)
  }
}
//父组件操作
interface Props {
  visible: boolean
  book_snapshot: any
  closable?: boolean
  orderId:number
  sellerId:number
}
const props = withDefaults(defineProps<Props>(), {
  closable: true
})
//关闭弹窗
const emit = defineEmits<{
  'update:visible': [value: boolean]
  close: []
  confirm: []
}>()
const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" v-if="visible">
      <div class="review__container">
        <el-form label-width="auto" label-position="top" :rules="rule" ref="ruleFormRef" :model="ruleForm">
          <el-form-item label="评分" prop="rate" style="margin-bottom: 24px">
            <el-rate v-model="ruleForm.rate" :texts="['有待提升','较差','良好','优秀','值得肯定']" show-text/>
          </el-form-item>
          <el-form-item label="购书体验" prop="selectedTags" style="margin-bottom: 24px">
            <el-check-tag
              v-for="tag in tags"
              :key="tag.name"
              :checked="tag.checked"
              type="primary"
              @change="(checked:boolean)=>handleTagChange(tag.value,checked)"
              style="margin-right: 16px;padding: 4px"
            >
              {{tag.name}}
            </el-check-tag>
          </el-form-item>
          <el-form-item label="评论" prop="comment" style="margin-bottom: 24px">
            <el-input type="textarea" v-model="ruleForm.comment" :rows="4"/>
          </el-form-item>
          <el-form-item style="margin-bottom: 24px;display: flex;flex-direction: row;justify-content: flex-end;align-items: center">
            <el-button type="primary" @click="submitForm" style="width: 120px;">提交评论</el-button>
            <el-button @click="handleClose" style="width: 80px;">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5); /* 黑色 50% 透明 */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.review__container {
  width: 600px;
  height: 400px;
  background-color: #fff;
  border-radius: 12px;
  border: 1px solid #eee;
  padding: 12px 24px;
  overflow: hidden;
}
</style>
