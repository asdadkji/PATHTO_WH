<script setup lang="ts">
import {ref, reactive, onMounted} from "vue";
//引入图书仓库
import {useBookStore} from "@/stores/book.ts";
const bookStore = useBookStore()
//筛选条件
const formInline = reactive({
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
  author:'',
  status:[
    { value: 'available', label: '上架' },
    { value: 'sold', label: '已售出' },
    { value: 'pending', label: '下架' }
  ]
})
//选中的分类
const selectCategory = ref('')
//选中的状态
const selectStatus = ref('')
//商家图书初始化
onMounted(()=>{
  bookStore.getMerchantBookList(1)
})
//分页配置
const currentPage = ref(1)
//筛选
const handleFilter = () => {
  const filterData = {
    title:formInline.title,
    author:formInline.author,
    category_id:Number(selectCategory.value+1),
    status:selectStatus.value || undefined
  }
  console.log(filterData)
  currentPage.value=1
  bookStore.getMerchantBookList(1,currentPage.value,20,filterData)
}
//分类名称映射
const getCategoryLabel = (categoryId:number) => {
  const category = formInline.category.find(item => item.value === categoryId.toString())
  return category ? category.label : '未知分类'
}
//下架
const handleDelete = async (bookId:number,merchantId:number) => {
  try {
    const res = await bookStore.deleteBookById(merchantId,bookId)
    if (res && res.code === 1) {
      alert(res.message)
    } else {
      alert('下架成功')
    }
  } catch (e) {
    console.error('下架失败', e)
    alert('下架失败')
  }
}
</script>

<template>
  <div class="disProduct__container">
    <!--筛选-->
    <div class="disProduct__category">
      <el-form :inline="true" style="margin-bottom: 16px;display: flex;flex-wrap: wrap;" :model="formInline" label-width="auto">
        <el-form-item label="商品名称">
          <el-input placeholder="请输入商品名称" v-model="formInline.title"></el-input>
        </el-form-item>
        <el-form-item label="商品分类" style="width: 200px">
          <el-select v-model="selectCategory" placeholder="商品分类">
            <el-option v-for="(item,id) in formInline.category" :key="item.value" :label="item.label" :value="id"/>
          </el-select>
        </el-form-item>
        <el-form-item label="作者" style="width: 160px">
          <el-input placeholder="请输入作者" v-model="formInline.author"></el-input>
        </el-form-item>
        <el-form-item label="状态" style="width: 200px;">
          <el-select v-model="selectStatus" placeholder="请选择商品状态">
            <el-option v-for="(item,id) in formInline.status" :key="item.value" :label="item.label" :value="item.value"/>
          </el-select>
        </el-form-item>
      </el-form>
      <el-button type="primary" style="width: 100px;margin-bottom: 24px;margin-right: 32px" @click="handleFilter">查询</el-button>
    </div>
    <!--表单-->
    <el-table border style="width: 100%;margin-bottom: 16px" :data="bookStore.merchantBook">
      <el-table-column prop="title" label="商品名称"></el-table-column>
      <el-table-column prop="author" label="作者"></el-table-column>
      <el-table-column prop="category_id" label="分类">
        <template #default="{row}">
          <el-tag>{{getCategoryLabel(row.category_id)}}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="price" label="价格/元"></el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="{row}">
          <el-tag v-if="row.status === 'available'" type="success">上架</el-tag>
          <el-tag v-if="row.status === 'pending'" type="danger">下架</el-tag>
          <el-tag v-if="row.status === 'sold'" type="primary">已售出</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{row}">
          <el-button v-if="row.status === 'available'" type="danger" link @click="handleDelete(row.id,1)">下架</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!--分页-->
    <el-pagination
      background
      layout="prev, pager, next"
      :total="bookStore.total"
      :page-size="20"
      v-model:current-page="currentPage"
      @current-change="bookStore.getMerchantBookList(1,currentPage,20)"
    />
  </div>
</template>

<style scoped lang="scss">
.disProduct__container {
  background: #f1f1f1;
  border: 1px solid #ccc;
  border-radius: 4px;
  border-top: 2px solid #ff8e8e;
  padding: 8px;
  display: flex;
  flex-direction: column;
  .disProduct__category {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
}
</style>
