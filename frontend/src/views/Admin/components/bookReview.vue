<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox, ElTableColumn, ElTable, ElButton, ElTag, ElPagination, ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElDatePicker, ElLoading, ElImage } from 'element-plus';
import dayjs from 'dayjs';

// 引入路由
import { useRouter } from 'vue-router';
const router = useRouter();

// 引入auth仓库
import { useAuthStore } from '@/stores/auth.ts';
const authStore = useAuthStore();

// 引入图书审查API
import { getPendingBooks, reviewBook } from '@/apis/services/bookReview.ts';

// 图书列表数据
const books = ref([]);
const loading = ref(false);
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 审核对话框
const reviewDialog = ref(false);
const currentBook = ref(null);
const reviewForm = ref({
  status: '',
  result: ''
});

// 图片预览
const previewDialog = ref(false);
const previewImageUrl = ref('');

// 预览图片
const previewImage = (imageUrl) => {
  previewImageUrl.value = imageUrl;
  previewDialog.value = true;
};

// 解析图片字段（兼容字符串和数组格式）
const parseImages = (images) => {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  if (typeof images === 'string') {
    try {
      return JSON.parse(images);
    } catch {
      return [];
    }
  }
  return [];
};

// 加载待审核图书列表
const loadPendingBooks = async () => {
  loading.value = true;
  try {
    const res = await getPendingBooks({
      page: pagination.value.currentPage,
      pageSize: pagination.value.pageSize
    });
    books.value = res.books;
    pagination.value.total = res.total;
  } catch (error) {
    console.error('获取待审核图书失败:', error);
    ElMessage.error('获取待审核图书失败');
  } finally {
    loading.value = false;
  }
};

// 打开审核对话框
const openReviewDialog = (book) => {
  currentBook.value = book;
  reviewForm.value = {
    status: '',
    result: ''
  };
  reviewDialog.value = true;
};

// 提交审核
const submitReview = async () => {
  if (!reviewForm.value.status) {
    ElMessage.error('请选择审核结果');
    return;
  }
  
  if (reviewForm.value.status === 'rejected' && !reviewForm.value.result) {
    ElMessage.error('请填写打回原因');
    return;
  }
  
  loading.value = true;
  try {
    await reviewBook({
      bookId: currentBook.value.id,
      status: reviewForm.value.status,
      result: reviewForm.value.result,
      adminId: authStore.userId || 1
    });
    if (reviewForm.value.status === 'approved') {
      ElMessageBox.alert('该图书已上架', '审核通过', {
        confirmButtonText: '确定',
      });
    } else {
      ElMessage.success('审核成功');
    }
    reviewDialog.value = false;
    loadPendingBooks();
  } catch (error) {
    console.error('审核失败:', error);
    ElMessage.error('审核失败');
  } finally {
    loading.value = false;
  }
};

// 格式化日期
const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-';
};

// 分页变化
const handleSizeChange = (size) => {
  pagination.value.pageSize = size;
  loadPendingBooks();
};

const handleCurrentChange = (current) => {
  pagination.value.currentPage = current;
  loadPendingBooks();
};

// 组件挂载时加载数据
onMounted(() => {
  loadPendingBooks();
});
</script>

<template>
  <div class="book-review">
    <div class="book-review__header">
      <h2>图书审查</h2>
      <p>审核待审核的图书，确保内容符合平台规范</p>
    </div>
    
    <div class="book-review__content">
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
        <el-table-column prop="created_at" label="提交时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="openReviewDialog(scope.row)"
              class="review-button"
            >
              审核
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="book-review__pagination">
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
    
    <!-- 审核对话框 -->
    <el-dialog
      v-model="reviewDialog"
      title="图书审核"
      width="700px"
    >
      <el-form :model="reviewForm" label-width="80px">
        <el-form-item label="图书信息">
          <div v-if="currentBook" class="book-info">
            <p><strong>书名:</strong> {{ currentBook.title }}</p>
            <p><strong>作者:</strong> {{ currentBook.author }}</p>
            <p><strong>售价:</strong> ¥{{ currentBook.price }}</p>
          </div>
        </el-form-item>
        <el-form-item label="图书图片">
          <div v-if="currentBook" class="book-images-container">
            <!-- 展示封面图 -->
            <div 
              v-if="currentBook.cover_image && typeof currentBook.cover_image === 'string'" 
              class="book-image-item"
              @click="previewImage(currentBook.cover_image)"
            >
              <img :src="currentBook.cover_image" alt="封面图" class="book-image" />
              <span class="image-label">封面</span>
            </div>
            <!-- 展示详情图片 -->
            <div 
              v-for="(image, index) in parseImages(currentBook.images)" 
              :key="index"
              class="book-image-item"
              @click="previewImage(image)"
            >
              <img :src="image" :alt="`图片 ${index + 1}`" class="book-image" />
              <span class="image-label">图{{ index + 1 }}</span>
            </div>
            <!-- 无图片情况 -->
            <div v-if="!currentBook.cover_image && !currentBook.images" class="no-images">
              暂无图片
            </div>
          </div>
        </el-form-item>
        <el-form-item label="审核结果" required>
          <el-select v-model="reviewForm.status" placeholder="请选择审核结果">
            <el-option label="通过" value="approved" />
            <el-option label="打回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核原因" v-if="reviewForm.status === 'rejected'" required>
          <el-input
            v-model="reviewForm.result"
            type="textarea"
            rows="4"
            placeholder="请填写审核原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reviewDialog = false">取消</el-button>
          <el-button type="primary" @click="submitReview">确认</el-button>
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

.book-review {
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

// 审核按钮样式
.review-button {
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
  
  .el-textarea {
    width: 100%;
    max-width: 600px;
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

// 图片展示样式
.book-images-container {
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
  position: relative;
  
  &:hover {
    border-color: $primary-color;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  }
  
  .image-label {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.6);
    color: #fff;
    font-size: 12px;
    padding: 4px 8px;
    text-align: center;
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
  .book-review {
    padding: 12px;
    
    &__header {
      margin-bottom: 20px;
      padding-bottom: 16px;
      
      h2 {
        font-size: 24px;
      }
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