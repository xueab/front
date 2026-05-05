<template>
  <div class="knowledge-manage">
    <el-card class="filter-bar" shadow="never">
      <div class="filter-row">
        <el-input
          v-model="query.keyword"
          placeholder="搜索 docKey / 标题"
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

        <el-button type="success" round @click="openUpload">
          <el-icon><Upload /></el-icon>
          <span>上传文档</span>
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
            <div class="doc-title">{{ doc.title || doc.docKey }}</div>
            <div class="doc-id">{{ doc.docKey }}</div>
          </div>
        </div>
        <div class="doc-info">
          <span>
            <el-icon><Calendar /></el-icon>
            {{ formatTime(doc.updatedAt) }}
          </span>
          <span>
            <el-icon><Collection /></el-icon>
            {{ categoryLabel(doc.category) }}
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
        还没有任何知识文档，点击右上角「上传文档」开始整理吧
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

    <!-- 上传文档对话框 -->
    <el-dialog
      v-model="uploadVisible"
      title="上传知识文档"
      width="640px"
      destroy-on-close
      :close-on-click-modal="!uploading"
      :close-on-press-escape="!uploading"
      class="doc-dialog"
    >
      <div v-if="!uploading && uploadResults.length === 0">
        <div
          class="upload-drop-zone"
          :class="{ 'is-dragover': isDragover }"
          @click="triggerFileInput"
          @dragover.prevent="isDragover = true"
          @dragleave.prevent="isDragover = false"
          @drop.prevent="handleDrop"
        >
          <el-icon class="upload-icon"><Upload /></el-icon>
          <div class="upload-text">点击选择或拖拽文件到此处</div>
          <div class="upload-hint">支持 .md、.txt 文件，可批量选择多个文件</div>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept=".md,.txt,.markdown"
          multiple
          class="hidden-input"
          @change="handleFileSelect"
        />

        <div v-if="pendingFiles.length > 0" class="pending-list">
          <div class="pending-header">
            <span class="pending-count">已选择 {{ pendingFiles.length }} 个文件</span>
            <el-button text size="small" type="danger" @click="clearPending">
              清空列表
            </el-button>
          </div>
          <div class="pending-items">
            <div
              v-for="(pf, idx) in pendingFiles"
              :key="idx"
              class="pending-item"
            >
              <el-icon class="pending-file-icon"><Document /></el-icon>
              <div class="pending-file-info">
                <div class="pending-file-name">{{ pf.file.name }}</div>
                <div class="pending-file-size">{{ formatSize(pf.file.size) }}</div>
              </div>
              <el-tag
                v-if="pf.duplicate"
                size="small"
                type="warning"
                round
              >
                ID 重复
              </el-tag>
              <el-button
                text
                size="small"
                :icon="Close"
                @click="removePending(idx)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 上传进度 -->
      <div v-if="uploading || uploadResults.length > 0" class="upload-progress">
        <div v-if="uploading" class="progress-summary">
          <el-progress
            :percentage="uploadPercent"
            :stroke-width="10"
            striped
            striped-flow
          />
          <div class="progress-text">
            正在上传 {{ uploadDoneCount }} / {{ uploadTotalCount }} ...
          </div>
        </div>

        <div class="result-list">
          <div
            v-for="(r, idx) in uploadResults"
            :key="idx"
            class="result-item"
            :class="{ 'is-error': r.status === 'error' }"
          >
            <el-icon v-if="r.status === 'success'" class="result-icon success">
              <CircleCheck />
            </el-icon>
            <el-icon v-else-if="r.status === 'error'" class="result-icon error">
              <CircleClose />
            </el-icon>
            <el-icon v-else class="result-icon pending">
              <Loading />
            </el-icon>
            <span class="result-name">{{ r.filename }}</span>
            <span v-if="r.status === 'error'" class="result-msg">{{ r.msg }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <template v-if="!uploading && uploadResults.length === 0">
          <el-button @click="uploadVisible = false">取消</el-button>
          <el-button
            type="primary"
            :disabled="pendingFiles.length === 0"
            @click="handleBatchUpload"
          >
            <el-icon><Upload /></el-icon>
            <span>开始上传（{{ pendingFiles.length }}）</span>
          </el-button>
        </template>
        <template v-else-if="!uploading && uploadResults.length > 0">
          <el-button @click="closeUploadAndRefresh">关闭</el-button>
          <el-button type="primary" @click="resetUpload">继续上传</el-button>
        </template>
        <template v-else>
          <el-button disabled>上传中...</el-button>
        </template>
      </template>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editorVisible"
      title="编辑知识文档"
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
        <el-form-item label="文档标识（docKey）">
          <el-input :model-value="editorForm.docKey" disabled />
        </el-form-item>

        <el-form-item label="分类">
          <el-select v-model="editorForm.category" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="cat in categoryOptions"
              :key="cat.value"
              :label="cat.label"
              :value="cat.value"
            />
          </el-select>
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
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看对话框 -->
    <el-dialog
      v-model="viewVisible"
      :title="viewDoc?.title || viewDoc?.docKey || '文档详情'"
      width="720px"
      destroy-on-close
      class="doc-dialog"
    >
      <div v-loading="viewLoading">
        <div v-if="viewDoc" class="view-meta">
          <span>{{ viewDoc.docKey }}</span>
          <span>·</span>
          <span>{{ categoryLabel(viewDoc.category) }}</span>
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
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import {
  Search,
  Upload,
  MagicStick,
  Document,
  Calendar,
  Collection,
  View,
  Edit,
  Delete,
  Close,
  CircleCheck,
  CircleClose,
  Loading,
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

// ============== 分类选项 ==============
const categoryOptions = [
  { value: 'general', label: '未分类' },
  { value: 'foundations', label: '基础理论与方法' },
  { value: 'emotions', label: '情绪与症状自助' },
  { value: 'habits', label: '行为与习惯' },
  { value: 'relationships', label: '关系与沟通' },
  { value: 'work-life', label: '学业/工作/财务压力' },
  { value: 'self-identity', label: '自我与身份' },
  { value: 'trauma-care', label: '创伤、慢病与专业资源' },
];

const categoryMap = Object.fromEntries(categoryOptions.map((c) => [c.value, c.label]));

function categoryLabel(cat?: string) {
  return categoryMap[cat || 'general'] || cat || '未分类';
}

// ============== 上传相关 ==============
interface PendingFile {
  file: File;
  docKey: string;
  duplicate: boolean;
}

interface UploadResult {
  filename: string;
  status: 'pending' | 'success' | 'error';
  msg?: string;
}

const uploadVisible = ref(false);
const uploading = ref(false);
const isDragover = ref(false);
const fileInputRef = ref<HTMLInputElement>();
const pendingFiles = ref<PendingFile[]>([]);
const uploadResults = ref<UploadResult[]>([]);
const uploadDoneCount = ref(0);
const uploadTotalCount = ref(0);
const uploadPercent = ref(0);

const DOC_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/;

function extractDocKey(filename: string): string {
  return filename.replace(/\.(md|txt|markdown)$/i, '');
}

function openUpload() {
  pendingFiles.value = [];
  uploadResults.value = [];
  uploading.value = false;
  uploadVisible.value = true;
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

function addFiles(files: FileList | File[]) {
  const existingKeys = new Set(pendingFiles.value.map((pf) => pf.docKey));
  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['md', 'txt', 'markdown'].includes(ext)) {
      ElMessage.warning(`跳过不支持的文件：${file.name}`);
      continue;
    }
    if (file.size > 100_000) {
      ElMessage.warning(`文件过大（>100KB）：${file.name}`);
      continue;
    }
    const docKey = extractDocKey(file.name);
    if (!DOC_KEY_PATTERN.test(docKey)) {
      ElMessage.warning(`文件名不符合 docKey 规则（须以字母/数字开头）：${file.name}`);
      continue;
    }
    if (existingKeys.has(docKey)) {
      ElMessage.warning(`docKey 重复，已跳过：${file.name}`);
      continue;
    }
    existingKeys.add(docKey);
    pendingFiles.value.push({ file, docKey, duplicate: false });
  }
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    addFiles(input.files);
    input.value = '';
  }
}

function handleDrop(e: DragEvent) {
  isDragover.value = false;
  if (e.dataTransfer?.files) {
    addFiles(e.dataTransfer.files);
  }
}

function removePending(idx: number) {
  pendingFiles.value.splice(idx, 1);
}

function clearPending() {
  pendingFiles.value = [];
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file, 'utf-8');
  });
}

async function handleBatchUpload() {
  if (pendingFiles.value.length === 0) return;

  uploading.value = true;
  uploadDoneCount.value = 0;
  uploadTotalCount.value = pendingFiles.value.length;
  uploadPercent.value = 0;
  uploadResults.value = pendingFiles.value.map((pf) => ({
    filename: pf.file.name,
    status: 'pending' as const,
  }));

  for (let i = 0; i < pendingFiles.value.length; i++) {
    const pf = pendingFiles.value[i];
    try {
      const content = await readFileAsText(pf.file);
      if (!content.trim()) {
        uploadResults.value[i].status = 'error';
        uploadResults.value[i].msg = '文件内容为空';
      } else {
        await createKnowledge({ docKey: pf.docKey, content });
        uploadResults.value[i].status = 'success';
      }
    } catch (err: any) {
      uploadResults.value[i].status = 'error';
      uploadResults.value[i].msg = err?.response?.data?.msg || err?.message || '上传失败';
    }
    uploadDoneCount.value = i + 1;
    uploadPercent.value = Math.round(((i + 1) / uploadTotalCount.value) * 100);
  }

  uploading.value = false;
  const successCount = uploadResults.value.filter((r) => r.status === 'success').length;
  const failCount = uploadResults.value.filter((r) => r.status === 'error').length;
  if (failCount === 0) {
    ElMessage.success(`全部上传成功，共 ${successCount} 个文档`);
  } else {
    ElMessage.warning(`上传完成：${successCount} 成功，${failCount} 失败`);
  }
}

function resetUpload() {
  pendingFiles.value = [];
  uploadResults.value = [];
  uploading.value = false;
}

function closeUploadAndRefresh() {
  uploadVisible.value = false;
  fetchList();
}

// ============== 编辑 ==============
const editorVisible = ref(false);
const editorFormRef = ref<FormInstance>();
const editorForm = reactive({ id: 0, docKey: '', content: '', category: 'general' });

const editorRules: FormRules = {
  content: [{ required: true, message: '请输入正文', trigger: 'blur' }],
};

// ============== 查看 ==============
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

async function openEdit(doc: KnowledgeDocVO) {
  editorForm.id = doc.id;
  editorForm.docKey = doc.docKey;
  editorForm.category = doc.category || 'general';
  editorForm.content = '';
  editorVisible.value = true;

  try {
    const res = await getKnowledge(doc.id);
    editorForm.content = res.data.content || '';
    editorForm.category = res.data.category || 'general';
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
    await updateKnowledge(editorForm.id, {
      content: editorForm.content,
      category: editorForm.category,
    });
    ElMessage.success('已保存');
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

/* ===== 上传区域 ===== */
.hidden-input {
  display: none;
}

.upload-drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 24px;
  border: 2px dashed #bae6fd;
  border-radius: 16px;
  background: linear-gradient(135deg, #f0f9ff, #f0fdfa);
  cursor: pointer;
  transition: all 0.25s ease;
}

.upload-drop-zone:hover,
.upload-drop-zone.is-dragover {
  border-color: #60a5fa;
  background: linear-gradient(135deg, #e0f2fe, #ecfdf5);
  box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.12);
}

.upload-icon {
  font-size: 42px;
  color: #60a5fa;
}

.upload-text {
  font-size: 15px;
  font-weight: 500;
  color: #1e3a8a;
}

.upload-hint {
  font-size: 12px;
  color: var(--healing-muted);
}

/* ===== 待上传文件列表 ===== */
.pending-list {
  margin-top: 18px;
}

.pending-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.pending-count {
  font-size: 13px;
  font-weight: 600;
  color: #1e3a8a;
}

.pending-items {
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pending-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: background 0.15s;
}

.pending-item:hover {
  background: #f0f9ff;
}

.pending-file-icon {
  font-size: 20px;
  color: #60a5fa;
  flex-shrink: 0;
}

.pending-file-info {
  flex: 1;
  min-width: 0;
}

.pending-file-name {
  font-size: 13px;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pending-file-size {
  font-size: 11px;
  color: var(--healing-muted);
}

/* ===== 上传进度 ===== */
.upload-progress {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-text {
  font-size: 13px;
  color: var(--healing-muted);
  text-align: center;
}

.result-list {
  max-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.result-item.is-error {
  background: #fef2f2;
  border-color: #fecaca;
}

.result-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.result-icon.success {
  color: #22c55e;
}

.result-icon.error {
  color: #ef4444;
}

.result-icon.pending {
  color: #60a5fa;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.result-name {
  font-size: 13px;
  color: #334155;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-msg {
  font-size: 12px;
  color: #ef4444;
  flex-shrink: 0;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== 编辑/查看对话框 ===== */
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
