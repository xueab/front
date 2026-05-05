<template>
  <div class="report-manage-view">
    <div class="page-header">
      <div>
        <h2 class="page-title">对话报告</h2>
        <p class="page-subtitle">AI 根据你的对话生成的情绪分析报告，帮助你更好地了解自己。</p>
      </div>
    </div>

    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索报告标题或内容…"
        clearable
        prefix-icon="Search"
        @clear="handleSearch"
        @keydown.enter="handleSearch"
      />
      <el-button type="primary" round @click="handleSearch">
        <el-icon><Search /></el-icon>
        <span>搜索</span>
      </el-button>
    </div>

    <div v-loading="loading" class="report-list">
      <div
        v-for="report in reports"
        :key="report.id"
        class="report-card"
        @click="viewReport(report.id)"
      >
        <div class="report-card-head">
          <div class="report-title-row">
            <el-icon class="report-icon"><Document /></el-icon>
            <span class="report-title">{{ report.title }}</span>
          </div>
          <span class="report-time">{{ report.updatedAt }}</span>
        </div>
        <div class="report-session">
          <el-icon><ChatDotRound /></el-icon>
          <span>{{ report.sessionTitle }}</span>
        </div>
        <div class="report-preview">
          {{ stripMarkdown(report.content) }}
        </div>
        <div class="report-card-actions" @click.stop>
          <el-button size="small" text @click="viewReport(report.id)">
            <el-icon><View /></el-icon>
            <span>查看</span>
          </el-button>
          <el-popconfirm
            title="确定删除该报告吗？"
            confirm-button-text="删除"
            cancel-button-text="取消"
            @confirm="handleDelete(report.id)"
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

      <div v-if="!loading && reports.length === 0" class="empty-hint">
        还没有分析报告，去对话页面生成第一份吧～
      </div>
    </div>

    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        background
        @current-change="fetchReports"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search, Document, ChatDotRound, View, Delete } from '@element-plus/icons-vue';
import { getReportList, deleteReport } from '@/api/chatReport';
import type { ChatReportVO } from '@/types/api';

const router = useRouter();

const loading = ref(false);
const reports = ref<ChatReportVO[]>([]);
const keyword = ref('');
const currentPage = ref(1);
const pageSize = 10;
const total = ref(0);

function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/#{1,6}\s?/g, '')
    .replace(/[*_~`>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n+/g, ' ')
    .slice(0, 120);
}

async function fetchReports() {
  loading.value = true;
  try {
    const res = await getReportList({
      page: currentPage.value,
      size: pageSize,
      keyword: keyword.value || undefined,
    });
    reports.value = res.data.records || [];
    total.value = res.data.total || 0;
  } catch {
    // interceptor handles error
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  currentPage.value = 1;
  fetchReports();
}

function viewReport(id: number) {
  router.push(`/reports/${id}`);
}

async function handleDelete(id: number) {
  try {
    await deleteReport(id);
    ElMessage.success('报告已删除');
    await fetchReports();
  } catch {
    // interceptor handles error
  }
}

onMounted(fetchReports);
</script>

<style scoped>
.report-manage-view {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 20px;
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

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-bar .el-input {
  max-width: 360px;
}

.report-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.report-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: var(--healing-card-shadow);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-left: 4px solid #60a5fa;
}

.report-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(96, 165, 250, 0.14);
}

.report-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.report-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.report-icon {
  color: #60a5fa;
  font-size: 18px;
  flex-shrink: 0;
}

.report-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e3a8a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.report-time {
  font-size: 12px;
  color: var(--healing-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.report-session {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--healing-muted);
  margin-bottom: 8px;
}

.report-preview {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 10px;
}

.report-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.empty-hint {
  text-align: center;
  color: var(--healing-muted);
  padding: 60px 0;
  font-size: 14px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 600px) {
  .search-bar .el-input {
    max-width: none;
    flex: 1;
  }
}
</style>
