<template>
  <div class="knowledge-manage">
    <el-card class="filter-bar" shadow="never">
      <div class="filter-row">
        <el-input
          v-model="query.keyword"
          placeholder="搜索文件名 / 标题"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" round @click="handleSearch">
          <el-icon><Search /></el-icon>
          <span>查询</span>
        </el-button>
        <el-button plain round @click="handleResetQuery">重置</el-button>

        <div class="filter-spacer"></div>

        <el-button type="success" round @click="openCreate">
          <el-icon><Plus /></el-icon>
          <span>新建文档</span>
        </el-button>
        <el-button
          plain
          round
          :loading="reindex.running.value"
          @click="handleReindex"
        >
          <el-icon><MagicStick /></el-icon>
          <span>重建索引</span>
        </el-button>
      </div>
    </el-card>

    <div class="knowledge-grid" v-loading="loading">
      <el-card
        v-for="doc in records"
        :key="doc.id"
        class="doc-card"
        shadow="never"
      >
        <div class="doc-head">
          <el-icon class="doc-icon"><Document /></el-icon>
          <div class="doc-meta">
            <div class="doc-title">{{ doc.title || doc.filename }}</div>
            <div class="doc-id">{{ doc.filename }}</div>
          </div>
        </div>
        <div class="doc-info">
          <span>
            <el-icon><Calendar /></el-icon>
            {{ formatTime(doc.updatedAt) }}
          </span>
          <span>
            <el-icon><Files /></el-icon>
            {{ formatSize(doc.size) }}
          </span>
        </div>
        <div class="doc-actions">
          <el-button text size="small" @click="openView(doc)">
            <el-icon><View /></el-icon>
            <span>查看</span>
          </el-button>
          <el-button text size="small" @click="openEdit(doc)">
            <el-icon><Edit /></el-icon>
            <span>编辑</span>
          </el-button>
          <el-popconfirm
            title="确定删除该文档吗？"
            confirm-button-text="删除"
            cancel-button-text="取消"
            @confirm="handleDelete(doc)"
          >
            <template #reference>
              <el-button text size="small" type="danger">
                <el-icon><Delete /></el-icon>
                <span>删除</span>
              </el-button>
            </template>
          </el-popconfirm>
        </div>
      </el-card>

      <div v-if="!loading && records.length === 0" class="empty-tip">
        还没有任何知识文档，点击右上角「新建文档」开始整理吧
      </div>
    </div>

    <div v-if="total > 0" class="pager">
      <el-pagination
        background
        layout="total, prev, pager, next, sizes"
        :current-page="query.page"
        :page-size="query.size"
        :page-sizes="[10, 20, 50]"
        :total="total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <el-dialog
      v-model="editorVisible"
      :title="editorTitle"
      width="720px"
      destroy-on-close
      class="doc-dialog"
    >
      <el-form
        ref="editorFormRef"
        :model="editorForm"
        :rules="editorRules"
        label-position="top"
        size="default"
      >
        <el-form-item
          v-if="editorMode === 'create'"
          label="文档 ID"
          prop="id"
        >
          <el-input
            v-model="editorForm.id"
            placeholder="如：anxiety-coping，仅支持字母、数字、_、-"
            maxlength="100"
            clearable
          />
          <div class="form-hint">将作为文件名（自动追加 .md 后缀）</div>
        </el-form-item>

        <el-form-item v-else label="文档 ID">
          <el-input :model-value="editorForm.id" disabled />
        </el-form-item>

        <el-form-item label="正文（Markdown）" prop="content">
          <el-input
            v-model="editorForm.content"
            type="textarea"
            :rows="16"
            placeholder="# 标题\n\n正文..."
            resize="vertical"
            maxlength="100000"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ editorMode === 'create' ? '创建' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="viewVisible"
      :title="viewDoc?.title || viewDoc?.filename || '文档详情'"
      width="720px"
      destroy-on-close
      class="doc-dialog"
    >
      <div v-loading="viewLoading">
        <div v-if="viewDoc" class="view-meta">
          <span>{{ viewDoc.filename }}</span>
          <span>·</span>
          <span>{{ formatSize(viewDoc.size) }}</span>
          <span>·</span>
          <span>{{ formatTime(viewDoc.updatedAt) }}</span>
        </div>
        <pre class="view-content">{{ viewDoc?.content || '暂无内容' }}</pre>
      </div>
      <template #footer>
        <el-button @click="viewVisible = false">关闭</el-button>
        <el-button type="primary" @click="enterEditFromView">
          <el-icon><Edit /></el-icon>
          <span>编辑</span>
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  ElMessage,
  type FormInstance,
  type FormRules,
} from 'element-plus';
import {
  Search,
  Plus,
  MagicStick,
  Document,
  Calendar,
  Files,
  View,
  Edit,
  Delete,
} from '@element-plus/icons-vue';
import {
  pageKnowledge,
  getKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
} from '@/api/admin';
import { useReindex } from '@/composables/useReindex';
import type { KnowledgeDocVO, AdminPageQuery } from '@/types/api';

const reindex = useReindex();

const loading = ref(false);
const saving = ref(false);
const records = ref<KnowledgeDocVO[]>([]);
const total = ref(0);

const query = reactive<Required<Pick<AdminPageQuery, 'page' | 'size'>> & AdminPageQuery>({
  page: 1,
  size: 12,
  keyword: '',
});

// 编辑/新建
type EditorMode = 'create' | 'edit';
const editorMode = ref<EditorMode>('create');
const editorVisible = ref(false);
const editorFormRef = ref<FormInstance>();
const editorForm = reactive({
  id: '',
  content: '',
});
const editorTitle = computed(() =>
  editorMode.value === 'create' ? '新建知识文档' : '编辑知识文档',
);

const editorRules: FormRules = {
  id: [
    { required: true, message: '请输入文档 ID', trigger: 'blur' },
    {
      pattern: /^[A-Za-z0-9_-]{1,100}$/,
      message: '仅支持字母、数字、_、-，长度 1-100',
      trigger: 'blur',
    },
  ],
  content: [{ required: true, message: '请输入正文', trigger: 'blur' }],
};

// 查看
const viewVisible = ref(false);
const viewLoading = ref(false);
const viewDoc = ref<KnowledgeDocVO | null>(null);

function formatTime(value?: string) {
  if (!value) return '--';
  return value.replace('T', ' ').slice(0, 16);
}

function formatSize(bytes: number) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await pageKnowledge({
      page: query.page,
      size: query.size,
      keyword: query.keyword?.trim() || undefined,
    });
    records.value = res.data.records || [];
    total.value = res.data.total || 0;
  } catch {
    // 全局拦截器已提示
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.page = 1;
  fetchList();
}

function handleResetQuery() {
  query.keyword = '';
  query.page = 1;
  fetchList();
}

function handlePageChange(p: number) {
  query.page = p;
  fetchList();
}

function handleSizeChange(s: number) {
  query.size = s;
  query.page = 1;
  fetchList();
}

function openCreate() {
  editorMode.value = 'create';
  editorForm.id = '';
  editorForm.content = '';
  editorVisible.value = true;
}

async function openEdit(doc: KnowledgeDocVO) {
  editorMode.value = 'edit';
  editorForm.id = doc.id;
  editorForm.content = '';
  editorVisible.value = true;

  try {
    const res = await getKnowledge(doc.id);
    editorForm.content = res.data.content || '';
  } catch {
    // 全局拦截器已提示
  }
}

async function openView(doc: KnowledgeDocVO) {
  viewDoc.value = { ...doc, content: doc.content };
  viewVisible.value = true;
  viewLoading.value = true;
  try {
    const res = await getKnowledge(doc.id);
    viewDoc.value = res.data;
  } catch {
    // 全局拦截器已提示
  } finally {
    viewLoading.value = false;
  }
}

function enterEditFromView() {
  if (!viewDoc.value) return;
  const target = viewDoc.value;
  viewVisible.value = false;
  setTimeout(() => openEdit(target), 200);
}

async function handleSave() {
  if (!editorFormRef.value) return;
  const valid = await editorFormRef.value.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  try {
    if (editorMode.value === 'create') {
      await createKnowledge({
        id: editorForm.id.trim(),
        content: editorForm.content,
      });
      ElMessage.success('已创建');
    } else {
      await updateKnowledge(editorForm.id, { content: editorForm.content });
      ElMessage.success('已保存');
    }
    editorVisible.value = false;
    fetchList();
  } catch {
    // 全局拦截器已提示
  } finally {
    saving.value = false;
  }
}

async function handleDelete(doc: KnowledgeDocVO) {
  try {
    await deleteKnowledge(doc.id);
    ElMessage.success('已删除');
    if (records.value.length === 1 && query.page > 1) {
      query.page -= 1;
    }
    fetchList();
  } catch {
    // 全局拦截器已提示
  }
}

async function handleReindex() {
  await reindex.runReindex();
}

onMounted(fetchList);
</script>

<style scoped>
.knowledge-manage {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.filter-bar {
  border: none;
  border-radius: 18px;
  box-shadow: var(--healing-card-shadow);
  background: #ffffff;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.search-input {
  width: 280px;
}

.filter-spacer {
  flex: 1;
}

.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  min-height: 200px;
}

.doc-card {
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff, #f0f9ff);
  box-shadow: var(--healing-card-shadow);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.doc-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 30px rgba(96, 165, 250, 0.18);
}

.doc-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.doc-icon {
  font-size: 28px;
  color: #60a5fa;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #e0f2fe, #cffafe);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.doc-meta {
  min-width: 0;
  flex: 1;
}

.doc-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e3a8a;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-id {
  font-size: 12px;
  color: var(--healing-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: var(--healing-muted);
  margin-bottom: 10px;
}

.doc-info span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.doc-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  border-top: 1px dashed #e0f2fe;
  padding-top: 10px;
}

.empty-tip {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--healing-muted);
  padding: 60px 0;
  font-size: 13px;
}

.pager {
  display: flex;
  justify-content: flex-end;
}

.form-hint {
  font-size: 12px;
  color: var(--healing-muted);
  margin-top: 4px;
}

.doc-dialog :deep(.el-textarea__inner) {
  font-family: 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.7;
}

.view-meta {
  font-size: 12px;
  color: var(--healing-muted);
  margin-bottom: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.view-content {
  margin: 0;
  padding: 16px;
  background: #f0f9ff;
  border: 1px solid #e0f2fe;
  border-radius: 12px;
  font-family: 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #334155;
  white-space: pre-wrap;
  max-height: 60vh;
  overflow: auto;
}
</style>
