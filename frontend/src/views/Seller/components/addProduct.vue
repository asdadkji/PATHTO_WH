<script setup lang="ts">
import { reactive, ref } from 'vue'
import dayjs from "dayjs";
import type {FormInstance, FormRules, UploadUserFile} from 'element-plus'
//ts
interface RuleForm {
  title: string
  category: { value: string, label: string }[]
  recommend: string
  author: string
  publisher: string
  publishDate: string
  originalPrice: string
  condition: { value: string, label: string }[]
  description: string
  price: number
  img: UploadUserFile[]
}
//表单规则验证
const rules = reactive<FormRules>({
  title: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
  ],
  category: [
    { required: true, message: '请输入商品类别', trigger: 'blur' },
  ],
  author: [
    { required: true, message: '请输入作者', trigger: 'blur' }
  ],
  publisher: [
    { required: true, message: '请输入出版社', trigger: 'blur' }
  ],
  publishDate: [
    { required: true, message: '请输入出版日期', trigger: 'blur' }
  ],
  condition: [
    { required: true, message: '请选择商品品相', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入商品价格', trigger: 'blur' }
  ],
  img: [
    { required: true, message: '请上传商品图片', trigger: 'blur' }
  ]
})
//表单内容
const ruleForm = reactive<RuleForm>({
  title:'',
  category:[
    { value: '1', label: '小说' },
    { value: '2', label: '文学' },
    { value: '3', label: '语言文学' },
    { value: '4', label: '历史' },
    { value: '5', label: '地理' },
    { value: '6', label: '艺术' },
    { value: '7', label: '政治' },
    { value: '8', label: '法律' },
    { value: '9', label: '军事' },
    { value: '10', label: '哲学/心理' },
    { value: '11', label: '宗教' },
    { value: '12', label: '经济' },
    { value: '13', label: '社会科学' },
    { value: '14', label: '综合' },
    { value: '15', label: '童书' },
    { value: '16', label: '生活' },
    { value: '17', label: '体育' },
    { value: '18', label: '工程技术' },
    { value: '19', label: '互联网' },
    { value: '20', label: '自然科学' },
    { value: '21', label: '医药卫生' },
    { value: '22', label: '教材' },
    { value: '23', label: '教辅' },
    { value: '24', label: '考试' },
  ],
  recommend:'',
  author:'',
  publisher:'',
  publishDate:'',
  originalPrice:'',
  condition:[
    {value: 'new',label: '全新'},
    {value: 'like_new',label: '九成'},
    {value: 'very_good', label:'八成'},
    {value: 'good',label: '七成'},
    {value: 'acceptable',label: '六成'},
    {value: 'poor',label: '五成及以下'},
  ],
  description:'',
  price:0,
  img:[
    {
      name: 'food.jpeg',
      url: 'https://fuss10.elemecdn.com/3/63/4e7f3a15429bfda99bce42a18cdd1jpeg.jpeg?imageMogr2/thumbnail/360x360/format/webp/quality/100',
    },
    {
      name: 'food2.jpeg',
      url: 'https://fuss10.elemecdn.com/3/63/4e7f3a15429bfda99bce42a18cdd1jpeg.jpeg?imageMogr2/thumbnail/360x360/format/webp/quality/100',
    },
  ],
})
const selectCategory = ref('')
const selectCondition = ref('')
import {useBookStore} from "@/stores/book.ts";
import {useAuthStore} from "@/stores/auth.ts";
import {getMerchantId} from "@/apis/services/auth.ts";
import { ElMessage, ElMessageBox } from "element-plus";
const bookStore = useBookStore()
const authStore = useAuthStore()
//提交表单
const submitForm = async () => {
  try {
    if (!authStore.userId) {
      ElMessage.error('用户未登录');
      return;
    }

    if (!authStore.isSeller) {
      ElMessage.error('您还不是商家，请先完成商家认证');
      return;
    }

    const merchantId = await getMerchantId(authStore.userId);

    const formData = {
      title:ruleForm.title,
      highlights:ruleForm.recommend,
      author:ruleForm.author,
      publisher:ruleForm.publisher,
      category_id:Number(selectCategory.value),
      publish_year:dayjs(ruleForm.publishDate).format('YYYY'),
      original_price:ruleForm.originalPrice,
      book_condition:selectCondition.value,
      description:ruleForm.description,
      price:ruleForm.price,
      cover_image:ruleForm.img.length > 0 ? ruleForm.img[0].url : '',
      images:ruleForm.img.map(item=>item.url),
      seller_id:authStore.userId,
      merchant_id:merchantId,
    }
    await bookStore.listBook(formData)
    ElMessageBox.alert('上架请求已提交', '提示', {
      confirmButtonText: '确定',
    })
    resetForm()
  } catch (error) {
    ElMessage.error('获取商家信息失败，请先完成商家认证');
  }
}
//撤回表单
const formRef = ref<FormInstance>()
const resetForm = () => {
  formRef.value?.resetFields()
}

// 处理图片上传成功
const handleImageSuccess = (response: any, uploadFile: any) => {
  // 使用服务器返回的真实URL
  console.log('图片上传成功:', response);
  console.log('上传的文件:', uploadFile);
  if (response && response.data && response.data.url) {
    uploadFile.url = response.data.url;
    console.log('设置的图片URL:', uploadFile.url);
  } else {
    console.error('响应格式不正确:', response);
  }
}

// 处理图片上传失败
const handleImageError = (error: any) => {
  ElMessage.error('图片上传失败，请重试')
  console.error('图片上传失败:', error)
}
</script>

<template>
  <div class="addPro__container">
    <el-form :model="ruleForm" :rules='rules' label-width="auto" :label-position="'right'" style="max-width: 800px" ref="formRef">
      <el-form-item label="书名" prop="title" style="margin-bottom: 24px">
        <el-input v-model="ruleForm.title"></el-input>
      </el-form-item>
      <el-form-item label="分类" prop="category" style="margin-bottom: 24px">
        <el-select v-model="selectCategory" placeholder="请选择图书对应的分类">
          <el-option v-for="(item,id) in ruleForm.category" :label="item.label" :value="item.value" :key="id"/>
        </el-select>
      </el-form-item>
      <el-form-item label="推荐语" prop="recommend" style="margin-bottom: 24px">
        <el-input v-model="ruleForm.recommend"></el-input>
      </el-form-item>
      <el-form-item label="作者" prop="author" style="margin-bottom: 24px">
        <el-input v-model="ruleForm.author"></el-input>
      </el-form-item>
      <el-form-item label="出版社" prop="publisher" style="margin-bottom: 24px">
        <el-input v-model="ruleForm.publisher"></el-input>
      </el-form-item>
      <el-form-item label="出版时间" prop="publishDate" style="margin-bottom: 24px">
        <el-date-picker
          type="date"
          placeholder="请选择出版时间"
          format="YYYY/MM/DD"
          value-format="YYYY-MM-DD"
          v-model="ruleForm.publishDate"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="原价" prop="originalPrice" style="margin-bottom: 24px">
        <el-input v-model="ruleForm.originalPrice"></el-input>
      </el-form-item>
      <el-form-item label="品相" prop="condition" style="margin-bottom: 24px">
        <el-select v-model="selectCondition" placeholder="请选择品相">
          <el-option v-for="(item,id) in ruleForm.condition" :label="item.label" :value="item.value" :key="id"/>
        </el-select>
      </el-form-item>
      <el-form-item label="品相描述" prop="description" style="margin-bottom: 24px">
        <el-input v-model="ruleForm.description"></el-input>
      </el-form-item>
      <el-form-item label="售价" prop="price" style="margin-bottom: 24px">
        <el-input v-model="ruleForm.price"></el-input>
      </el-form-item>
      <el-form-item label="书籍图片" prop="img" style="margin-bottom: 24px">
        <el-upload
          v-model:file-list="ruleForm.img"
          action="http://localhost:3000/api/upload/image"
          list-type="picture-card"
          class="upload-demo"
          :on-success="handleImageSuccess"
          :on-error="handleImageError"
        >
          <el-button>上传图书相关图片</el-button>
          <template #tip>
            <div class="el-upload__tip">
              只能上传jpg/png文件，且不超过500kb,最多10张照片
            </div>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>
  </div>
  <div class="add__btn">
    <el-button style="width: 100px" type="primary" @click="submitForm">提交</el-button>
    <el-button style="width: 100px" type="danger" @click="resetForm">取消</el-button>
  </div>
</template>

<style scoped lang="scss">
.addPro__container {
  border: 1px solid #e3e3e3;
  border-top: 2px solid #98ccf3;
  padding: 8px 24px;
  width: 900px;
}
.add__btn {
  display: flex;
  justify-content:center;
  align-items: center;
  margin-top: 16px;
}
.demo-date-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}

.demo-date-picker .block {
  padding: 1.5rem 0;
  text-align: center;
  border-right: solid 1px var(--el-border-color);
  flex: 1;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.demo-date-picker .block:last-child {
  border-right: none;
}

.demo-date-picker .demonstration {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-bottom: 1rem;
  width: 100%;
}

@media screen and (max-width: 1200px) {
  .demo-date-picker .block {
    flex: 0 0 50%;
    border-bottom: solid 1px var(--el-border-color);
  }

  .demo-date-picker .block:nth-child(2n) {
    border-right: none;
  }

  .demo-date-picker .block:nth-last-child(-n + 2):nth-child(2n + 1),
  .demo-date-picker .block:last-child {
    border-bottom: none;
  }
}

@media screen and (max-width: 768px) {
  .demo-date-picker .block {
    flex: 0 0 100%;
    padding: 1rem 0;
    min-width: auto;
    border-right: none;
    border-bottom: solid 1px var(--el-border-color);
  }

  .demo-date-picker .block:last-child {
    border-bottom: none;
  }
}
</style>
