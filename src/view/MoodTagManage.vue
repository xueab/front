<template>
  <div class="tag-manage-view">
    <div class="page-header">
      <div>
        <h2 class="page-title">情绪标签管理</h2>
        <p class="page-subtitle">自定义你的情绪标签，让每篇日记都有专属色彩。</p>
      </div>
      <el-button type="primary" round @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        <span>新建标签</span>
      </el-button>
    </div>

    <div v-loading="loading" class="tag-grid">
      <div
        v-for="tag in tags"
        :key="tag.id"
        class="tag-card"
        :style="cardBorderStyle(tag.color)"
      >
        <div class="tag-card-head">
          <span class="tag-badge" :style="badgeStyle(tag.color)">
            {{ tag.name }}
          </span>
          <span class="tag-time">{{ tag.createdAt }}</span>
        </div>
        <div class="tag-card-actions">
          <el-button size="small" text @click="openEditDialog(tag)">
            <el-icon><Edit /></el-icon>
            <span>编辑</span>
          </el-button>
          <el-popconfirm
            title="确定删除该标签吗？"
            confirm-button-text="删除"
            cancel-button-text="取消"
            @confirm="handleDelete(tag)"
          >
            <template #reference>
              <el-button size="small" text type="danger">
                <el-icon><Delete /></el-icon>
                <span>删除</span>
              </el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>

      <div v-if="!loading && tags.length === 0" class="empty-hint">
        还没有标签，快来创建第一个吧～
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新建标签' : '编辑标签'"
      width="420px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-position="top"
      >
        <el-form-item label="标签名称" prop="name">
          <el-input
            v-model="form.name"
            maxlength="50"
            show-word-limit
            placeholder="例如：开心、焦虑、平静…"
          />
        </el-form-item>
        <el-form-item label="标签颜色" prop="color">
          <div class="color-picker-area">
            <div class="preset-colors">
              <span
                v-for="c in PRESET_COLORS"
                :key="c"
                class="preset-dot"
                :class="{ active: form.color === c }"
                :style="{ background: c }"
                @click="form.color = c"
              />
            </div>
            <el-color-picker v-model="form.color" size="small" />
          </div>
        </el-form-item>
        <el-form-item label="预览">
          <span class="tag-badge preview" :style="badgeStyle(form.color)">
            {{ form.name || '标签预览' }}
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ dialogMode === 'create' ? '创建' : '保存' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import {
  listMoodTags,
  createMoodTag,
  updateMoodTag,
  deleteMoodTag,
} from '@/api/moodTag';
import type { MoodTagVO } from '@/types/api';

const PRESET_COLORS = [
  '#67C23A',
  '#409EFF',
  '#E6A23C',
  '#F56C6C',
  '#909399',
  '#9B59B6',
  '#1ABC9C',
  '#F39C12',
];

const loading = ref(false);
const tags = ref<MoodTagVO[]>([]);

const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const editingId = ref<number | null>(null);
const submitting = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  name: '',
  color: '#409EFF',
});

const formRules: FormRules = {
  name: [
    { required: true, message: '标签名称不能为空', trigger: 'blur' },
    { max: 50, message: '标签名称最长 50 个字符', trigger: 'blur' },
  ],
};

function badgeStyle(color: string) {
  return {
    background: `${color}18`,
    color,
    border: `1px solid ${color}40`,
  };
}

function cardBorderStyle(color: string) {
  return { borderLeft: `4px solid ${color}` };
}

async function fetchTags() {
  loading.value = true;
  try {
    const res = await listMoodTags();
    tags.value = res.data;
  } catch {
    // interceptor handles error
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  dialogMode.value = 'create';
  editingId.value = null;
  form.name = '';
  form.color = '#409EFF';
  dialogVisible.value = true;
}

function openEditDialog(tag: MoodTagVO) {
  dialogMode.value = 'edit';
  editingId.value = tag.id;
  form.name = tag.name;
  form.color = tag.color;
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    if (dialogMode.value === 'create') {
      await createMoodTag({ name: form.name.trim(), color: form.color });
      ElMessage.success('标签创建成功');
    } else if (editingId.value != null) {
      await updateMoodTag(editingId.value, {
        name: form.name.trim(),
        color: form.color,
      });
      ElMessage.success('标签已更新');
    }
    dialogVisible.value = false;
    await fetchTags();
  } catch {
    // interceptor handles error
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(tag: MoodTagVO) {
  try {
    await deleteMoodTag(tag.id);
    ElMessage.success('标签已删除');
    await fetchTags();
  } catch {
    // interceptor handles error
  }
}

onMounted(fetchTags);
</script>

<style scoped>
.tag-manage-view {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 600;
  color: #1e3a8a;
}

.page-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--healing-muted);
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.tag-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: var(--healing-card-shadow);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tag-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(96, 165, 250, 0.14);
}

.tag-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.tag-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.tag-badge.preview {
  font-size: 15px;
  padding: 6px 18px;
}

.tag-time {
  font-size: 12px;
  color: var(--healing-muted);
  white-space: nowrap;
}

.tag-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.color-picker-area {
  display: flex;
  align-items: center;
  gap: 14px;
}

.preset-colors {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.preset-dot:hover {
  transform: scale(1.15);
}

.preset-dot.active {
  border-color: #1e3a8a;
  transform: scale(1.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.empty-hint {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--healing-muted);
  padding: 60px 0;
  font-size: 14px;
}

@media (max-width: 600px) {
  .tag-grid {
    grid-template-columns: 1fr;
  }
}
</style>
