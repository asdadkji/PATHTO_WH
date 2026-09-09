<script setup lang="ts">
// 管理后台 - 商品管理：列表 + 新建/编辑对话框 + 上架/下架切换
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Edit, Switch } from '@element-plus/icons-vue'
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  toggleAdminProduct,
} from '@/apis/admin'
import type { AdminProductItem, ProductCategory } from '@/types'

const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: 'toy', label: '玩具' },
  { value: 'game_time', label: '游戏时间' },
  { value: 'activity', label: '活动' },
  { value: 'food', label: '食物' },
  { value: 'book', label: '书籍' },
  { value: 'other', label: '其他' },
]

const products = ref<AdminProductItem[]>([])
const loading = ref(false)
const filterCategory = ref<ProductCategory | ''>('')

async function loadProducts() {
  loading.value = true
  try {
    const data = await getAdminProducts(filterCategory.value || undefined)
    products.value = Array.isArray(data) ? data : []
  } catch {
    products.value = []
    ElMessage.error('商品列表加载失败')
  } finally {
    loading.value = false
  }
}

function onFilterChange() {
  loadProducts()
}

function categoryLabel(c: string) {
  return CATEGORY_OPTIONS.find((o) => o.value === c)?.label ?? c
}

function stockText(stock: number) {
  return stock === -1 ? '不限' : String(stock)
}

// ─── 对话框 ──────────────────────────────────────────────────
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const editingId = ref('')

interface ProductForm {
  name: string
  description: string
  pricePoints: number
  category: ProductCategory
  stock: number
  imageUrl: string
  isVirtual: boolean
  virtualValue: number
  sortOrder: number
}

const defaultForm = (): ProductForm => ({
  name: '',
  description: '',
  pricePoints: 10,
  category: 'toy',
  stock: -1,
  imageUrl: '',
  isVirtual: false,
  virtualValue: 0,
  sortOrder: 0,
})

const form = reactive<ProductForm>(defaultForm())

function openCreate() {
  isEdit.value = false
  editingId.value = ''
  Object.assign(form, defaultForm())
  dialogVisible.value = true
}

function openEdit(item: AdminProductItem) {
  isEdit.value = true
  editingId.value = item.productId
  Object.assign(form, {
    name: item.name,
    description: item.description ?? '',
    pricePoints: item.pricePoints,
    category: item.category,
    stock: item.stock,
    imageUrl: item.imageUrl ?? '',
    isVirtual: item.isVirtual,
    virtualValue: item.virtualValue ?? 0,
    sortOrder: item.sortOrder,
  })
  dialogVisible.value = true
}

async function submitForm() {
  if (!form.name.trim()) {
    ElMessage.warning('请填写商品名称')
    return
  }
  if (form.pricePoints < 0) {
    ElMessage.warning('积分价格不能为负数')
    return
  }
  if (form.stock < -1) {
    ElMessage.warning('库存不能小于 -1（-1 表示不限）')
    return
  }
  submitting.value = true
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      pricePoints: form.pricePoints,
      category: form.category,
      stock: form.stock,
      imageUrl: form.imageUrl.trim() || undefined,
      isVirtual: form.isVirtual,
      virtualValue: form.isVirtual ? form.virtualValue : undefined,
      sortOrder: form.sortOrder,
    }
    if (isEdit.value) {
      await updateAdminProduct(editingId.value, payload)
      ElMessage.success('商品已更新')
    } else {
      await createAdminProduct(payload)
      ElMessage.success('商品已创建')
    }
    dialogVisible.value = false
    await loadProducts()
  } catch (e) {
    ElMessage.error((e as { message?: string })?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleToggle(item: AdminProductItem) {
  const action = item.isActive ? '下架' : '上架'
  try {
    await ElMessageBox.confirm(
      `确定${action}商品「${item.name}」吗？`,
      `${action}确认`,
      { confirmButtonText: action, cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  try {
    await toggleAdminProduct(item.productId)
    ElMessage.success(`已${action}`)
    await loadProducts()
  } catch (e) {
    ElMessage.error((e as { message?: string })?.message || '操作失败')
  }
}

onMounted(() => {
  loadProducts()
})
</script>

<template>
  <div class="product-admin-page">
    <div class="page-head">
      <div class="head-text">
        <h2 class="page-title">商品管理</h2>
        <p class="page-sub">管理积分商城中可兑换的商品，控制上架与定价。</p>
      </div>
      <div class="head-actions">
        <el-button :icon="Refresh" round @click="loadProducts">刷新</el-button>
        <el-button type="primary" :icon="Plus" round @click="openCreate">新建商品</el-button>
      </div>
    </div>

    <section class="card filter-card">
      <el-radio-group v-model="filterCategory" @change="onFilterChange">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button
          v-for="opt in CATEGORY_OPTIONS"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
    </section>

    <section v-loading="loading" class="card table-card">
      <div class="card-head">商品列表（{{ products.length }}）</div>

      <el-empty v-if="!loading && !products.length" description="暂无商品" />

      <el-table
        v-if="products.length"
        :data="products"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="商品名称" min-width="140" />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ categoryLabel(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pricePoints" label="积分" width="80" align="center" />
        <el-table-column label="库存" width="80" align="center">
          <template #default="{ row }">{{ stockText(row.stock) }}</template>
        </el-table-column>
        <el-table-column label="虚拟" width="70" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isVirtual" type="info" size="small">虚拟</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="70" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" :icon="Edit" size="small" text @click="openEdit(row)">
              编辑
            </el-button>
            <el-button
              :type="row.isActive ? 'warning' : 'success'"
              :icon="Switch"
              size="small"
              text
              @click="handleToggle(row)"
            >
              {{ row.isActive ? '下架' : '上架' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑商品' : '新建商品'"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px" label-position="left">
        <el-form-item label="商品名称" required>
          <el-input v-model="form.name" placeholder="如：30分钟游戏时间" maxlength="100" />
        </el-form-item>
        <el-form-item label="商品描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
        <el-form-item label="分类" required>
          <el-select v-model="form.category" style="width: 100%">
            <el-option
              v-for="opt in CATEGORY_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="积分价格" required>
          <el-input-number v-model="form.pricePoints" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="form.stock" :min="-1" :max="9999" />
          <span class="form-hint">-1 表示不限</span>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="图片链接">
          <el-input v-model="form.imageUrl" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="虚拟商品">
          <el-switch v-model="form.isVirtual" />
        </el-form-item>
        <el-form-item v-if="form.isVirtual" label="虚拟面值">
          <el-input-number v-model="form.virtualValue" :min="0" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.product-admin-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.page-head {
  @include flex-row-sb;
  gap: 12px;

  .head-text {
    flex: 1;
    min-width: 0;

    .page-title {
      font-size: 22px;
      font-weight: 700;
      color: $kid-text;
    }
    .page-sub {
      margin-top: 4px;
      font-size: 14px;
      color: $kid-text-light;
    }
  }
  .head-actions {
    display: flex;
    gap: 10px;
  }
}
.card {
  background: $kid-card-bg;
  border-radius: $kid-radius;
  padding: 20px;
  box-shadow: $kid-shadow;

  .card-head {
    font-size: 16px;
    font-weight: 700;
    color: $kid-text;
    margin-bottom: 12px;
  }
}
.filter-card {
  padding: 16px 20px;
}
.table-card {
  overflow: hidden;
}
.form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: $kid-text-light;
}
</style>
