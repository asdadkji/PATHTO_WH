<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElTableColumn, ElTable, ElButton, ElTag, ElPagination, ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElDatePicker, ElLoading, ElImage } from 'element-plus';
import dayjs from 'dayjs';

// 引入路由
import { useRouter } from 'vue-router';
const router = useRouter();

// 引入auth仓库
import { useAuthStore } from '@/stores/auth.ts';
const authStore = useAuthStore();

// 引入图书管理API
import { getAllBooks, removeBook, publishBook } from '@/apis/services/bookMgt.ts';

// 图书列表数据
const books = ref([]);
const loading = ref(false);
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 筛选条件
const filterForm = ref({
  keyword: '',
  categoryId: '',
  status: '',
  author: ''
});

// 详情对话框
const detailDialog = ref(false);
const currentBook = ref(null);

// 图片预览
const previewDialog = ref(false);
const previewImageUrl = ref('');

// 预览图片
const previewImage = (imageUrl) => {
  previewImageUrl.value = imageUrl;
  previewDialog.value = true;
};

// 加载所有图书
const loadAllBooks = async () => {
  loading.value = true;
  try {
    const res = await getAllBooks({
      page: pagination.value.currentPage,
      pageSize: pagination.value.pageSize,
      keyword: filterForm.value.keyword,
      categoryId: filterForm.value.categoryId ? parseInt(filterForm.value.categoryId) : undefined,
      status: filterForm.value.status,
      author: filterForm.value.author
    });
    books.value = res.books;
    pagination.value.total = res.total;
  } catch (error) {
    console.error('获取图书列表失败:', error);
    ElMessage.error('获取图书列表失败');
  } finally {
    loading.value = false;
  }
};

// 打开详情对话框
const openDetailDialog = (book) => {
  currentBook.value = book;
  detailDialog.value = true;
};

// 下架图书
const removeBookAction = async (book) => {
  try {
    await removeBook(book.id);
    ElMessage.success('图书下架成功');
    loadAllBooks();
  } catch (error) {
    console.error('图书下架失败:', error);
    ElMessage.error('图书下架失败');
  }
};

// 上架图书
const publishBookAction = async (book) => {
  try {
    await publishBook(book.id);
    ElMessage.success('图书上架成功');
    loadAllBooks();
  } catch (error) {
    console.error('图书上架失败:', error);
    ElMessage.error('图书上架失败');
  }
};

// 格式化日期
const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-';
};

// 品相中文转换
const formatBookCondition = (condition) => {
  const conditionMap = {
    'like_new': '全新',
    'very_good': '非常好',
    'good': '良好',
    'fair': '一般',
    'poor': '较差'
  };
  return conditionMap[condition] || condition;
};

// 分页变化
const handleSizeChange = (size) => {
  pagination.value.pageSize = size;
  loadAllBooks();
};

const handleCurrentChange = (current) => {
  pagination.value.currentPage = current;
  loadAllBooks();
};

// 筛选变化
const handleFilterChange = () => {
  pagination.value.currentPage = 1;
  loadAllBooks();
};

// 重置筛选
const resetFilter = () => {
  filterForm.value = {
    keyword: '',
    categoryId: '',
    status: '',
    author: ''
  };
  pagination.value.currentPage = 1;
  loadAllBooks();
};

// 组件挂载时加载数据
onMounted(() => {
  loadAllBooks();
});
</script>

<template>
  <div class="book-mgt">
    <div class="book-mgt__header">
      <h2>图书管理</h2>
      <p>管理平台所有图书，包括下架操作</p>
    </div>
    
    <div class="book-mgt__filter">
      <el-form :model="filterForm" label-width="80px" inline>
        <el-form-item label="关键词">
          <el-input v-model="filterForm.keyword" placeholder="书名、作者" @keyup.enter="handleFilterChange" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="filterForm.categoryId" placeholder="请选择分类" @change="handleFilterChange">
            <el-option label="小说" value="1" />
            <el-option label="文学" value="2" />
            <el-option label="语言文学" value="3" />
            <el-option label="历史" value="4" />
            <el-option label="地理" value="5" />
            <el-option label="艺术" value="6" />
            <el-option label="政治" value="7" />
            <el-option label="法律" value="8" />
            <el-option label="军事" value="9" />
            <el-option label="哲学/心理" value="10" />
            <el-option label="宗教" value="11" />
            <el-option label="经济" value="12" />
            <el-option label="社会科学" value="13" />
            <el-option label="综合" value="14" />
            <el-option label="童书" value="15" />
            <el-option label="生活" value="16" />
            <el-option label="体育" value="17" />
            <el-option label="工程技术" value="18" />
            <el-option label="互联网" value="19" />
            <el-option label="自然科学" value="20" />
            <el-option label="医药卫生" value="21" />
            <el-option label="教材" value="22" />
            <el-option label="教辅" value="23" />
            <el-option label="考试" value="24" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" @change="handleFilterChange">
            <el-option label="在售" value="available" />
            <el-option label="下架" value="pending" />
          </el-select>
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="filterForm.author" placeholder="作者名称" @keyup.enter="handleFilterChange" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilterChange">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="book-mgt__content">
      <el-table
        v-loading="loading"
        :data="books"
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="图书ID" width="80" />
        <el-table-column label="封面" width="100">
          <template #default="scope">
            <img :src="scope.row.cover_image" style="width: 80px; height: 100px; object-fit: cover" />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="书名" width="200" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="price" label="售价" width="100">
          <template #default="scope">
            ¥{{ scope.row.price }}
          </template>
        </el-table-column>
        <el-table-column prop="seller_username" label="卖家用户名" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'available' ? 'success' : 'info'">
              {{ scope.row.status === 'available' ? '在售' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="openDetailDialog(scope.row)"
              class="detail-button"
            >
              详情
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="removeBookAction(scope.row)"
              class="remove-button"
              :disabled="scope.row.status !== 'available'"
            >
              下架
            </el-button>
            <el-button 
              type="success" 
              size="small" 
              @click="publishBookAction(scope.row)"
              class="publish-button"
              :disabled="scope.row.status === 'available'"
            >
              上架
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="book-mgt__pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    
    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialog"
      title="图书详情"
      width="700px"
    >
      <el-form :model="currentBook" label-width="80px">
        <el-form-item label="图书信息">
          <div v-if="currentBook" class="book-info">
            <p><strong>书名:</strong> {{ currentBook.title }}</p>
            <p><strong>作者:</strong> {{ currentBook.author }}</p>
            <p><strong>出版社:</strong> {{ currentBook.publisher }}</p>
            <p><strong>售价:</strong> ¥{{ currentBook.price }}</p>
            <p><strong>定价:</strong> ¥{{ currentBook.original_price }}</p>
            <p><strong>品相:</strong> {{ formatBookCondition(currentBook.book_condition) }}</p>
            <p><strong>出版年份:</strong> {{ currentBook.publish_year }}</p>
            <p><strong>卖家:</strong> {{ currentBook.seller_username }}</p>
            <p><strong>状态:</strong> {{ currentBook.status === 'available' ? '在售' : '下架' }}</p>
          </div>
        </el-form-item>
        <el-form-item label="图书图片">
          <div v-if="currentBook && currentBook.cover_image" class="book-images">
            <!-- 处理数组情况 -->
            <div 
              v-if="Array.isArray(currentBook.cover_image) && currentBook.cover_image.length > 0" 
              class="book-images"
            >
              <div 
                v-for="(image, index) in currentBook.cover_image" 
                :key="index"
                class="book-image-item"
                @click="previewImage(image)"
              >
                <img :src="image" :alt="`图书图片 ${index + 1}`" class="book-image" />
              </div>
            </div>
            <!-- 处理字符串情况 -->
            <div 
              v-else-if="typeof currentBook.cover_image === 'string' && currentBook.cover_image.trim()" 
              class="book-images"
            >
              <div 
                class="book-image-item"
                @click="previewImage(currentBook.cover_image)"
              >
                <img :src="currentBook.cover_image" alt="图书封面" class="book-image" />
              </div>
            </div>
            <!-- 无图片情况 -->
            <div v-else class="no-images">
              暂无图片
            </div>
          </div>
          <div v-else class="no-images">
            暂无图片
          </div>
        </el-form-item>
        <el-form-item label="图书描述">
          <div v-if="currentBook && currentBook.description" class="book-description">
            {{ currentBook.description }}
          </div>
          <div v-else class="no-description">
            暂无描述
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="previewDialog"
      title="图片预览"
      width="800px"
    >
      <div class="preview-image-container">
        <el-image
          :src="previewImageUrl"
          fit="contain"
          class="preview-image"
        />
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
// 全局变量
$primary-color: #409eff;
$success-color: #67c23a;
$warning-color: #e6a23c;
$danger-color: #f56c6c;
$info-color: #909399;
$border-radius: 8px;
$box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
$transition: all 0.3s ease;

.book-mgt {
  padding: 20px;
  
  &__header {
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e4e7ed;
    
    h2 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #303133;
    }
    
    p {
      color: #606266;
      font-size: 14px;
    }
  }
  
  &__filter {
    margin-bottom: 24px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: $border-radius;
  }
  
  &__content {
    background: #fff;
    border-radius: $border-radius;
    padding: 24px;
    box-shadow: $box-shadow;
  }
  
  &__pagination {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
  }
}

// 详情按钮样式
.detail-button {
  margin-right: 8px;
  transition: $transition;
  border-radius: 4px;
  font-weight: 500;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
}

// 下架按钮样式
.remove-button {
  transition: $transition;
  border-radius: 4px;
  font-weight: 500;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
}

// 上架按钮样式
.publish-button {
  transition: $transition;
  border-radius: 4px;
  font-weight: 500;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
}

// 对话框样式
:deep(.el-dialog) {
  border-radius: $border-radius;
  
  .el-dialog__header {
    padding: 20px 24px;
    border-bottom: 1px solid #e4e7ed;
    
    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }
  
  .el-dialog__body {
    padding: 24px;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid #e4e7ed;
    background-color: #f5f7fa;
    border-radius: 0 0 $border-radius $border-radius;
  }
}

.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  
  .el-button {
    padding: 8px 16px;
    font-weight: 500;
    border-radius: 4px;
    transition: $transition;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
  }
}

// 表单样式
:deep(.el-form) {
  .el-form-item {
    margin-bottom: 20px;
    
    .el-form-item__label {
      font-weight: 500;
      color: #303133;
    }
    
    .el-form-item__content {
      line-height: 1.5;
    }
  }
  
  .el-select,
  .el-input {
    width: 100%;
    max-width: 400px;
  }
}

// 图书信息样式
.book-info {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: $border-radius;
  margin-bottom: 20px;
  
  p {
    margin-bottom: 8px;
    
    strong {
      color: #303133;
      margin-right: 8px;
    }
  }
}

// 图书描述样式
.book-description {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: $border-radius;
  line-height: 1.6;
  white-space: pre-wrap;
}

// 无描述样式
.no-description {
  color: #909399;
  margin-top: 16px;
  padding: 40px 0;
  text-align: center;
  background-color: #f5f7fa;
  border-radius: $border-radius;
  font-size: 14px;
}

// 图片展示样式
.book-images {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: $border-radius;
}

.book-image-item {
  width: 120px;
  height: 120px;
  cursor: pointer;
  transition: $transition;
  border: 2px solid transparent;
  border-radius: $border-radius;
  overflow: hidden;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  &:hover {
    border-color: $primary-color;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  }
}

.book-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-images {
  color: #909399;
  margin-top: 16px;
  padding: 40px 0;
  text-align: center;
  background-color: #f5f7fa;
  border-radius: $border-radius;
  font-size: 14px;
}

// 图片预览样式
.preview-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 500px;
  background-color: #f5f7fa;
  border-radius: $border-radius;
  padding: 20px;
}

.preview-image {
  max-width: 100%;
  max-height: 500px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

// 表格样式
:deep(.el-table) {
  border-radius: $border-radius;
  overflow: hidden;
  
  .el-table__header-wrapper th {
    background-color: #f5f7fa;
    font-weight: 600;
    color: #303133;
  }
  
  .el-table__body-wrapper {
    .el-table__row {
      transition: $transition;
      
      &:hover {
        background-color: #f5f7fa;
      }
    }
  }
}

// 分页样式
:deep(.el-pagination) {
  .el-pagination__sizes {
    margin-right: 16px;
  }
  
  .el-pagination__jump {
    margin-left: 16px;
  }
  
  .el-pagination__button {
    transition: $transition;
    
    &:hover:not(:disabled) {
      color: $primary-color;
    }
  }
  
  .el-pagination__button--active {
    background-color: $primary-color;
    border-color: $primary-color;
  }
}

// 加载样式
:deep(.el-loading-spinner) {
  .el-loading-text {
    font-size: 14px;
    color: #606266;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .book-mgt {
    padding: 12px;
    
    &__header {
      margin-bottom: 20px;
      padding-bottom: 16px;
      
      h2 {
        font-size: 24px;
      }
    }
    
    &__filter {
      padding: 12px;
      margin-bottom: 16px;
    }
    
    &__content {
      padding: 16px;
    }
  }
  
  :deep(.el-dialog) {
    width: 90% !important;
    
    .el-dialog__header {
      padding: 16px 20px;
    }
    
    .el-dialog__body {
      padding: 20px;
    }
    
    .el-dialog__footer {
      padding: 12px 20px;
    }
  }
  
  .book-image-item {
    width: 100px;
    height: 100px;
  }
  
  .preview-image-container {
    min-height: 300px;
    padding: 12px;
  }
  
  .preview-image {
    max-height: 300px;
  }
}
</style>