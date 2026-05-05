<template>
  <div class="report-detail-view">
    <div v-loading="loading" class="report-content-wrap">
      <template v-if="!loading && report">
        <div class="report-header">
          <el-button text @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            <span>返回</span>
          </el-button>
          <div class="report-header-actions">
            <el-button
              v-if="!editing"
              size="small"
              round
              @click="startEdit"
            >
              <el-icon><Edit /></el-icon>
              <span>编辑</span>
            </el-button>
            <el-button
              size="small"
              round
              :loading="regenerating"
              @click="handleRegenerate"
            >
              <el-icon v-if="!regenerating"><Refresh /></el-icon>
              <span>重新生成</span>
            </el-button>
            <el-popconfirm
              title="确定删除该报告吗？"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="handleDelete"
            >
              <template #reference>
                <el-button size="small" round type="danger">
                  <el-icon><Delete /></el-icon>
                  <span>删除</span>
                </el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>

        <div class="report-meta">
          <div class="meta-session">
            <el-icon><ChatDotRound /></el-icon>
            <span>来自对话：{{ report.sessionTitle }}</span>
          </div>
          <div class="meta-time">
            <span>创建于 {{ report.createdAt }}</span>
            <span v-if="report.updatedAt !== report.createdAt">
              · 更新于 {{ report.updatedAt }}
            </span>
          </div>
        </div>

        <template v-if="editing">
          <el-form label-position="top" class="edit-form">
            <el-form-item label="报告标题">
              <el-input
                v-model="editForm.title"
                placeholder="请输入报告标题"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="报告内容（支持 Markdown）">
              <el-input
                v-model="editForm.content"
                type="textarea"
                :autosize="{ minRows: 10, maxRows: 30 }"
                placeholder="请输入报告内容"
              />
            </el-form-item>
            <div class="edit-actions">
              <el-button @click="cancelEdit">取消</el-button>
              <el-button
                type="primary"
                :loading="saving"
                @click="handleSave"
              >
                保存
              </el-button>
            </div>
          </el-form>
        </template>

        <template v-else>
          <h1 class="report-title">{{ report.title }}</h1>
          <div class="markdown-body" v-html="renderedContent"></div>
        </template>
      </template>

      <div v-if="!loading && !report" class="empty-hint">
        报告不存在或已被删除
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  ArrowLeft,
  Edit,
  Refresh,
  Delete,
  ChatDotRound,
} from '@element-plus/icons-vue';
import MarkdownIt from 'markdown-it';
import {
  getReportDetail,
  updateReport,
  deleteReport,
  generateReport,
} from '@/api/chatReport';
import type { ChatReportVO } from '@/types/api';

const route = useRoute();
const router = useRouter();

const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

const loading = ref(false);
const report = ref<ChatReportVO | null>(null);
const editing = ref(false);
const saving = ref(false);
const regenerating = ref(false);

const editForm = reactive({ title: '', content: '' });

const renderedContent = computed(() => {
  if (!report.value?.content) return '';
  return md.render(report.value.content);
});

async function fetchReport() {
  const id = Number(route.params.id);
  if (!id) return;
  loading.value = true;
  try {
    const res = await getReportDetail(id);
    report.value = res.data;
  } catch {
    report.value = null;
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.back();
}

function startEdit() {
  if (!report.value) return;
  editForm.title = report.value.title;
  editForm.content = report.value.content;
  editing.value = true;
}

function cancelEdit() {
  editing.value = false;
}

async function handleSave() {
  if (!report.value) return;
  if (!editForm.title.trim()) {
    ElMessage.warning('报告标题不能为空');
    return;
  }
  if (!editForm.content.trim()) {
    ElMessage.warning('报告内容不能为空');
    return;
  }
  saving.value = true;
  try {
    const res = await updateReport(report.value.id, {
      title: editForm.title.trim(),
      content: editForm.content.trim(),
    });
    report.value = res.data;
    editing.value = false;
    ElMessage.success('报告已更新');
  } catch {
    // interceptor handles error
  } finally {
    saving.value = false;
  }
}

async function handleRegenerate() {
  if (!report.value) return;
  regenerating.value = true;
  try {
    const res = await generateReport(report.value.sessionId);
    report.value = res.data;
    ElMessage.success('报告已重新生成');
  } catch {
    // interceptor handles error
  } finally {
    regenerating.value = false;
  }
}

async function handleDelete() {
  if (!report.value) return;
  try {
    await deleteReport(report.value.id);
    ElMessage.success('报告已删除');
    router.replace('/reports');
  } catch {
    // interceptor handles error
  }
}

onMounted(fetchReport);
</script>

<style scoped>
.report-detail-view {
  max-width: 860px;
  margin: 0 auto;
}

.report-content-wrap {
  background: #ffffff;
  border-radius: 18px;
  padding: 28px 32px;
  box-shadow: var(--healing-card-shadow);
  min-height: 400px;
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.report-header-actions {
  display: flex;
  gap: 8px;
}

.report-meta {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0f2fe;
}

.meta-session {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #60a5fa;
  margin-bottom: 6px;
}

.meta-time {
  font-size: 12px;
  color: var(--healing-muted);
}

.report-title {
  font-size: 22px;
  font-weight: 600;
  color: #1e3a8a;
  margin: 0 0 20px;
  line-height: 1.4;
}

.edit-form {
  margin-top: 8px;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.empty-hint {
  text-align: center;
  color: var(--healing-muted);
  padding: 80px 0;
  font-size: 14px;
}

/* Markdown 渲染样式 */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 18px 0 10px;
  font-weight: 600;
  color: #1e3a8a;
  line-height: 1.4;
}

.markdown-body :deep(h1) { font-size: 20px; }
.markdown-body :deep(h2) { font-size: 17px; }
.markdown-body :deep(h3) { font-size: 15px; }

.markdown-body :deep(p) {
  margin: 0 0 10px;
  line-height: 1.8;
  color: #334155;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 8px 0;
  padding-left: 22px;
}

.markdown-body :deep(li) {
  margin: 4px 0;
  line-height: 1.7;
  color: #334155;
}

.markdown-body :deep(strong) {
  font-weight: 600;
  color: #1e3a8a;
}

.markdown-body :deep(blockquote) {
  margin: 10px 0;
  padding: 8px 14px;
  border-left: 3px solid #60a5fa;
  background: rgba(186, 230, 253, 0.2);
  color: #475569;
  border-radius: 4px;
}

.markdown-body :deep(code) {
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(96, 165, 250, 0.12);
  color: #1e3a8a;
  font-size: 13px;
}

.markdown-body :deep(hr) {
  margin: 16px 0;
  border: none;
  border-top: 1px solid #e0f2fe;
}

@media (max-width: 600px) {
  .report-content-wrap {
    padding: 18px 16px;
    border-radius: 14px;
  }

  .report-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
