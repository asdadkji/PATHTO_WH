<script setup lang="ts">
// 管理后台 - 任务模板管理：列表 + 新建/编辑对话框 + 启用/停用切换
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Edit, Switch } from '@element-plus/icons-vue'
import {
  getAdminTemplates,
  createAdminTemplate,
  updateAdminTemplate,
  toggleAdminTemplate,
} from '@/apis/admin'
import type { AdminTemplateItem, TaskType } from '@/types'

const TASK_TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: 'fixed_daily', label: '固定每日' },
  { value: 'self_selected', label: '自选任务' },
  { value: 'challenge', label: '挑战任务' },
]

const templates = ref<AdminTemplateItem[]>([])
const loading = ref(false)
const filterType = ref<TaskType | ''>('')

async function loadTemplates() {
  loading.value = true
  try {
    const data = await getAdminTemplates(filterType.value || undefined)
    templates.value = Array.isArray(data) ? data : []
  } catch {
    templates.value = []
    ElMessage.error('模板列表加载失败')
  } finally {
    loading.value = false
  }
}

function onFilterChange() {
  loadTemplates()
}

// ─── 对话框 ──────────────────────────────────────────────────
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const editingId = ref('')

interface TemplateForm {
  title: string
  description: string
  defaultPoints: number
  streakBonus7: number
  streakBonus30: number
  category: string
  isDailyRepeat: boolean
  taskType: TaskType
  icon: string
  color: string
}

const defaultForm = (): TemplateForm => ({
  title: '',
  description: '',
  defaultPoints: 10,
  streakBonus7: 0,
  streakBonus30: 0,
  category: '',
  isDailyRepeat: false,
  taskType: 'self_selected',
  icon: '',
  color: '',
})

const form = reactive<TemplateForm>(defaultForm())

function openCreate() {
  isEdit.value = false
  editingId.value = ''
  Object.assign(form, defaultForm())
  dialogVisible.value = true
}

function openEdit(item: AdminTemplateItem) {
  isEdit.value = true
  editingId.value = item.templateId
  Object.assign(form, {
    title: item.title,
    description: item.description ?? '',
    defaultPoints: item.defaultPoints,
    streakBonus7: item.streakBonus7,
    streakBonus30: item.streakBonus30,
    category: item.category ?? '',
    isDailyRepeat: item.isDailyRepeat,
    taskType: item.taskType as TaskType,
    icon: item.icon ?? '',
    color: item.color ?? '',
  })
  dialogVisible.value = true
}

async function submitForm() {
  if (!form.title.trim()) {
    ElMessage.warning('请填写任务标题')
    return
  }
  if (form.defaultPoints < 0) {
    ElMessage.warning('默认积分不能为负数')
    return
  }
  submitting.value = true
  try {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      defaultPoints: form.defaultPoints,
      streakBonus7: form.streakBonus7,
      streakBonus30: form.streakBonus30,
      category: form.category.trim() || undefined,
      isDailyRepeat: form.isDailyRepeat,
      taskType: form.taskType,
      icon: form.icon.trim() || undefined,
      color: form.color.trim() || undefined,
    }
    if (isEdit.value) {
      await updateAdminTemplate(editingId.value, payload)
      ElMessage.success('模板已更新')
    } else {
      await createAdminTemplate(payload)
      ElMessage.success('模板已创建')
    }
    dialogVisible.value = false
    await loadTemplates()
  } catch (e) {
    ElMessage.error((e as { message?: string })?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleToggle(item: AdminTemplateItem) {
  const action = item.isActive ? '停用' : '启用'
  try {
    await ElMessageBox.confirm(
      `确定${action}模板「${item.title}」吗？`,
      `${action}确认`,
      { confirmButtonText: action, cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  try {
    await toggleAdminTemplate(item.templateId)
    ElMessage.success(`已${action}`)
    await loadTemplates()
  } catch (e) {
    ElMessage.error((e as { message?: string })?.message || '操作失败')
  }
}

function taskTypeLabel(t: string) {
  return TASK_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t
}

onMounted(() => {
  loadTemplates()
})
</script>

<template>
  <div class="template-admin-page">
    <div class="page-head">
      <div class="head-text">
        <h2 class="page-title">任务模板管理</h2>
        <p class="page-sub">管理固定任务、自选任务和挑战任务的模板配置。</p>
      </div>
      <div class="head-actions">
        <el-button :icon="Refresh" round @click="loadTemplates">刷新</el-button>
        <el-button type="primary" :icon="Plus" round @click="openCreate">新建模板</el-button>
      </div>
    </div>

    <section class="card filter-card">
      <el-radio-group v-model="filterType" @change="onFilterChange">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="fixed_daily">固定每日</el-radio-button>
        <el-radio-button value="self_selected">自选任务</el-radio-button>
        <el-radio-button value="challenge">挑战任务</el-radio-button>
      </el-radio-group>
    </section>

    <section v-loading="loading" class="card table-card">
      <div class="card-head">模板列表（{{ templates.length }}）</div>

      <el-empty v-if="!loading && !templates.length" description="暂无模板" />

      <el-table
        v-if="templates.length"
        :data="templates"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="title" label="标题" min-width="140" />
        <el-table-column prop="taskType" label="类型" width="110">
          <template #default="{ row }">
            <el-tag
              :type="row.taskType === 'fixed_daily' ? 'primary' : row.taskType === 'challenge' ? 'warning' : 'success'"
              size="small"
            >
              {{ taskTypeLabel(row.taskType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="defaultPoints" label="积分" width="80" align="center" />
        <el-table-column prop="category" label="分类" width="90" />
        <el-table-column label="7天奖励" width="90" align="center">
          <template #default="{ row }">{{ row.streakBonus7 || '-' }}</template>
        </el-table-column>
        <el-table-column label="30天奖励" width="90" align="center">
          <template #default="{ row }">{{ row.streakBonus30 || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '启用' : '停用' }}
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
              {{ row.isActive ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑模板' : '新建模板'"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px" label-position="left">
        <el-form-item label="任务标题" required>
          <el-input v-model="form.title" placeholder="如：完成家庭作业" maxlength="100" />
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
        <el-form-item label="任务类型" required>
          <el-select v-model="form.taskType" style="width: 100%">
            <el-option
              v-for="opt in TASK_TYPE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.category" placeholder="如：学习、家务、运动" />
        </el-form-item>
        <el-form-item label="默认积分">
          <el-input-number v-model="form.defaultPoints" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="7天奖励">
          <el-input-number v-model="form.streakBonus7" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="30天奖励">
          <el-input-number v-model="form.streakBonus30" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="Element Plus 图标名，如 EditPen" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-input v-model="form.color" placeholder="如 #409EFF" />
        </el-form-item>
        <el-form-item label="每日重复">
          <el-switch v-model="form.isDailyRepeat" />
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
.template-admin-page {
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
</style>
