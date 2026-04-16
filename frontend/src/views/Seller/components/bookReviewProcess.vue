<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElTable, ElTableColumn, ElTag, ElPagination, ElLoading } from 'element-plus';
import dayjs from 'dayjs';

// 引入路由
import { useRouter } from 'vue-router';
const router = useRouter();

// 引入auth仓库
import { useAuthStore } from '@/stores/auth.ts';
const authStore = useAuthStore();

// 引入图书审查API
import { getSellerBookReviewHistory } from '@/apis/services/sellerBookReview.ts';

// 图书审核列表数据
const books = ref([]);
const loading = ref(false);
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 加载卖家图书审查历史
const loadSellerBookReviewHistory = async () => {
  loading.value = true;
  try {
    const res = await getSellerBookReviewHistory({
      sellerId: authStore.userId || 1,
      page: pagination.value.currentPage,
      pageSize: pagination.value.pageSize
    });
    // 响应拦截器已经处理了code===0的情况，直接返回data
    books.value = res.books;
    pagination.value.total = res.total;
  } catch (error) {
    console.error('获取图书审查历史失败:', error);
    ElMessage.error('获取图书审查历史失败');
  } finally {
    loading.value = false;
  }
};

// 格式化日期
const formatDate = (date: any) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-';
};

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size;
  loadSellerBookReviewHistory();
};

const handleCurrentChange = (current: number) => {
  pagination.value.currentPage = current;
  loadSellerBookReviewHistory();
};

// 组件挂载时加载数据
onMounted(() => {
  loadSellerBookReviewHistory();
});
</script>

<template>
  <div class="book-review-process">
    <div class="book-review-process__header">
      <h2>图书审查流程</h2>
      <p>查看您的图书审核状态和历史记录</p>
    </div>
    
    <!-- 审核状态流程图 -->
    <div class="book-review-process__flow">
      <h3>审核流程</h3>
      <div class="flow-diagram">
        <div class="flow-step">
          <div class="flow-step__icon">1</div>
          <div class="flow-step__title">提交图书</div>
          <div class="flow-step__desc">卖家提交图书信息</div>
        </div>
        <div class="flow-arrow"></div>
        <div class="flow-step">
          <div class="flow-step__icon">2</div>
          <div class="flow-step__title">待审核</div>
          <div class="flow-step__desc">系统等待管理员审核</div>
        </div>
        <div class="flow-arrow"></div>
        <div class="flow-step">
          <div class="flow-step__icon">3</div>
          <div class="flow-step__title">审核中</div>
          <div class="flow-step__desc">管理员进行图书审查</div>
        </div>
        <div class="flow-arrow"></div>
        <div class="flow-step">
          <div class="flow-step__icon">4</div>
          <div class="flow-step__title">审核结果</div>
          <div class="flow-step__desc">图书通过审核或被打回</div>
        </div>
        <div class="flow-arrow"></div>
        <div class="flow-step">
          <div class="flow-step__icon">5</div>
          <div class="flow-step__title">上架销售</div>
          <div class="flow-step__desc">审核通过的图书上架销售</div>
        </div>
      </div>
    </div>
    
    <!-- 审核状态说明 -->
    <div class="book-review-process__status">
      <h3>审核状态说明</h3>
      <div class="status-list">
        <div class="status-item">
          <el-tag type="info">待审核</el-tag>
          <span>图书已提交，等待管理员审核</span>
        </div>
        <div class="status-item">
          <el-tag type="success">已通过</el-tag>
          <span>图书审核通过，已上架销售</span>
        </div>
        <div class="status-item">
          <el-tag type="danger">已打回</el-tag>
          <span>图书审核未通过，请根据原因修改后重新提交</span>
        </div>
      </div>
    </div>
    
    <!-- 审核列表 -->
    <div class="book-review-process__list">
      <h3>图书审核列表</h3>
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
        <el-table-column prop="isbn" label="ISBN" width="150" />
        <el-table-column label="审核状态" width="120">
          <template #default="scope">
            <el-tag
              :type="scope.row.review_status === 'pending' ? 'info' : scope.row.review_status === 'approved' ? 'success' : 'danger'"
            >
              {{ scope.row.review_status === 'pending' ? '待审核' : scope.row.review_status === 'approved' ? '已通过' : '已打回' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="review_result" label="审核结果/原因" width="200">
          <template #default="scope">
            {{ scope.row.review_result || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="reviewed_at" label="审核时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.reviewed_at) }}
          </template>
        </el-table-column>
        <el-table-column label="审核管理员" width="150">
          <template #default="scope">
            {{ scope.row.review_admin_id ? `管理员${scope.row.review_admin_id}` : '-' }}
          </template>
        </el-table-column>
      </el-table>
      
      <div class="book-review-process__pagination">
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
  </div>
</template>

<style scoped lang="scss">
.book-review-process {
  padding: 20px;
  
  &__header {
    margin-bottom: 30px;
    
    h2 {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    p {
      color: #666;
    }
  }
  
  &__flow {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    h3 {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    
    .flow-diagram {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      
      .flow-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        min-width: 120px;
        
        &__icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #409eff;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        &__title {
          font-weight: bold;
          margin-bottom: 5px;
          text-align: center;
        }
        
        &__desc {
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      }
      
      .flow-arrow {
        width: 40px;
        height: 2px;
        background: #409eff;
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          right: 0;
          top: -4px;
          width: 0;
          height: 0;
          border-left: 8px solid #409eff;
          border-top: 5px solid transparent;
          border-bottom: 5px solid transparent;
        }
      }
    }
  }
  
  &__status {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    h3 {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    
    .status-list {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      
      .status-item {
        display: flex;
        align-items: center;
        gap: 10px;
      }
    }
  }
  
  &__list {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    h3 {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 20px;
    }
  }
  
  &__pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>