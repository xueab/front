<template>
  <div class="diary-view">
    <div class="page-header">
      <div>
        <h2 class="page-title">情绪日记</h2>
        <p class="page-subtitle">
          把今天的心事写下来，也写下对自己的善意。
        </p>
      </div>
      <div class="mood-indicator">
        <span class="indicator-dot" />
        <span>今日已记录 {{ todayCount }} 条</span>
      </div>
    </div>

    <div class="diary-layout">
      <div class="diary-list-wrap">
        <div class="list-head">
          <div class="section-title">
            <el-icon><Notebook /></el-icon>
            <span>历史日记</span>
          </div>
          <el-button
            size="small"
            plain
            round
            @click="filterVisible = !filterVisible"
          >
            <el-icon><Filter /></el-icon>
            <span>筛选</span>
          </el-button>
        </div>

        <div v-show="filterVisible" class="filter-panel">
          <div class="filter-row">
            <el-date-picker
              v-model="filterRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              size="small"
            />
          </div>
          <div class="filter-row">
            <span class="filter-label">情绪分值</span>
            <el-input-number
              v-model="filter.minScore"
              :min="1"
              :max="10"
              size="small"
              controls-position="right"
              placeholder="最小"
            />
            <span class="filter-sep">~</span>
            <el-input-number
              v-model="filter.maxScore"
              :min="1"
              :max="10"
              size="small"
              controls-position="right"
              placeholder="最大"
            />
          </div>
          <div class="filter-actions">
            <el-button size="small" @click="handleResetFilter">重置</el-button>
            <el-button size="small" type="primary" @click="handleApplyFilter">
              应用筛选
            </el-button>
          </div>
        </div>

        <el-scrollbar class="diary-list" v-loading="loading">
          <transition-group name="list" tag="div">
            <div
              v-for="item in diaries"
              :key="item.id"
              class="diary-item"
              title="双击查看详情"
              @dblclick="openDetail(item)"
            >
              <div class="diary-item-head">
                <div class="mood-bubble" :style="moodStyle(item.score)">
                  {{ item.score }}
                </div>
                <div class="diary-item-meta">
                  <div class="diary-date">{{ item.date }}</div>
                  <div class="diary-label">{{ moodLabel(item.score) }}</div>
                </div>
                <div class="diary-actions" @dblclick.stop>
                  <el-button
                    size="small"
                    text
                    :loading="analysisLoadingId === item.id"
                    @click="handleAnalysis(item)"
                  >
                    <el-icon><MagicStick /></el-icon>
                    <span>AI 分析</span>
                  </el-button>
                  <el-button size="small" text @click="handleEdit(item)">
                    <el-icon><Edit /></el-icon>
                    <span>编辑</span>
                  </el-button>
                  <el-popconfirm
                    title="确定删除这篇日记吗？"
                    confirm-button-text="删除"
                    cancel-button-text="取消"
                    @confirm="handleDelete(item)"
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
              <p class="diary-content">{{ item.content }}</p>
              <div v-if="item.tags && item.tags.length" class="diary-tags">
                <el-tag
                  v-for="tag in item.tags"
                  :key="tag"
                  size="small"
                  type="info"
                  round
                  effect="plain"
                >
                  {{ tag }}
                </el-tag>
              </div>
              <div v-if="item.aiAnalysis" class="ai-analysis">
                <div class="ai-title">
                  <el-icon><MagicStick /></el-icon>
                  <span>AI 温柔分析</span>
                </div>
                <p>{{ item.aiAnalysis }}</p>
              </div>
            </div>
          </transition-group>
          <div v-if="!loading && diaries.length === 0" class="empty-hint">
            还没有日记，试着写下第一篇吧～
          </div>
        </el-scrollbar>

        <div v-if="total > 0" class="pager">
          <el-pagination
            background
            layout="prev, pager, next"
            :current-page="query.page"
            :page-size="query.size"
            :total="total"
            @current-change="handlePageChange"
          />
        </div>
      </div>

      <el-card class="publish-card" shadow="never">
        <div class="section-title">
          <el-icon><EditPen /></el-icon>
          <span>{{ editing ? '编辑日记' : '写下此刻' }}</span>
        </div>

        <div class="mood-block">
          <div class="mood-header">
            <span>今天的情绪</span>
            <span class="mood-value" :style="{ color: moodColor(form.moodScore) }">
              {{ form.moodScore }} / 10 · {{ moodLabel(form.moodScore) }}
            </span>
          </div>
          <el-slider
            v-model="form.moodScore"
            :min="1"
            :max="10"
            :step="1"
            :marks="marks"
            show-stops
          />
        </div>

        <el-input
          v-model="form.content"
          type="textarea"
          :rows="6"
          maxlength="500"
          show-word-limit
          resize="none"
          placeholder="今天发生了什么？你感受到了什么？写给自己看也好 💌"
        />

        <div class="tags-block">
          <div class="tags-label">情绪标签</div>
          <div class="tags-line">
            <el-tag
              v-for="tag in form.tags"
              :key="tag"
              closable
              size="small"
              round
              @close="removeTag(tag)"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="tagInputVisible"
              ref="tagInputRef"
              v-model="tagInputValue"
              size="small"
              class="tag-input"
              maxlength="10"
              @keyup.enter="confirmTagInput"
              @blur="confirmTagInput"
            />
            <el-button
              v-else
              size="small"
              plain
              round
              @click="showTagInput"
            >
              <el-icon><Plus /></el-icon>
              <span>添加标签</span>
            </el-button>
          </div>
          <div class="tag-suggest">
            <span
              v-for="suggest in tagSuggestions"
              :key="suggest"
              class="suggest-item"
              @click="appendTag(suggest)"
            >
              #{{ suggest }}
            </span>
          </div>
        </div>

        <div class="publish-actions">
          <el-button v-if="editing" plain @click="cancelEdit">取消</el-button>
          <el-button plain @click="resetForm">清空</el-button>
          <el-button type="primary" :loading="publishing" @click="handleSubmit">
            {{ editing ? '保存修改' : '发布日记' }}
          </el-button>
        </div>
      </el-card>
    </div>

    <el-dialog
      v-model="detailDialogVisible"
      :title="detailEditing ? '编辑日记' : '日记详情'"
      width="560px"
      destroy-on-close
      class="diary-detail-dialog"
      @closed="resetDetailState"
    >
      <div v-loading="detailLoading">
        <template v-if="detailItem">
          <div class="detail-head">
            <div class="mood-bubble-lg" :style="moodStyle(detailForm.moodScore)">
              {{ detailForm.moodScore }}
            </div>
            <div class="detail-meta">
              <div class="detail-date">{{ detailItem.date }}</div>
              <div class="detail-label">
                {{ moodLabel(detailForm.moodScore) }}
              </div>
            </div>
          </div>

          <div class="mood-block">
            <div class="mood-header">
              <span>情绪分值</span>
              <span
                class="mood-value"
                :style="{ color: moodColor(detailForm.moodScore) }"
              >
                {{ detailForm.moodScore }} / 10
              </span>
            </div>
            <el-slider
              v-model="detailForm.moodScore"
              :min="1"
              :max="10"
              :step="1"
              :marks="marks"
              show-stops
              :disabled="!detailEditing"
            />
          </div>

          <div class="detail-section">
            <div class="detail-section-title">日记内容</div>
            <el-input
              v-if="detailEditing"
              v-model="detailForm.content"
              type="textarea"
              :rows="6"
              maxlength="500"
              show-word-limit
              resize="none"
              placeholder="重新写下此刻的心情..."
            />
            <p v-else class="detail-content">{{ detailItem.content }}</p>
          </div>

          <div class="detail-section">
            <div class="detail-section-title">情绪标签</div>
            <template v-if="detailEditing">
              <div class="tags-line">
                <el-tag
                  v-for="tag in detailForm.tags"
                  :key="tag"
                  closable
                  size="small"
                  round
                  @close="removeDetailTag(tag)"
                >
                  {{ tag }}
                </el-tag>
                <el-input
                  v-if="detailTagInputVisible"
                  ref="detailTagInputRef"
                  v-model="detailTagInputValue"
                  size="small"
                  class="tag-input"
                  maxlength="10"
                  @keyup.enter="confirmDetailTagInput"
                  @blur="confirmDetailTagInput"
                />
                <el-button
                  v-else
                  size="small"
                  plain
                  round
                  @click="showDetailTagInput"
                >
                  <el-icon><Plus /></el-icon>
                  <span>添加</span>
                </el-button>
              </div>
              <div class="tag-suggest">
                <span
                  v-for="suggest in tagSuggestions"
                  :key="suggest"
                  class="suggest-item"
                  :class="{ disabled: detailForm.tags.includes(suggest) }"
                  @click="appendDetailTag(suggest)"
                >
                  #{{ suggest }}
                </span>
              </div>
            </template>
            <div v-else class="tags-line">
              <template v-if="detailItem.tags && detailItem.tags.length">
                <el-tag
                  v-for="tag in detailItem.tags"
                  :key="tag"
                  size="small"
                  type="info"
                  round
                  effect="plain"
                >
                  {{ tag }}
                </el-tag>
              </template>
              <span v-else class="muted-hint">暂未添加标签</span>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-section-title">
              <span>AI 分析</span>
              <el-button
                v-if="!detailEditing"
                size="small"
                text
                :loading="detailAnalysisLoading"
                @click="handleDetailAnalysis"
              >
                <el-icon><MagicStick /></el-icon>
                <span>{{ detailItem.aiAnalysis ? '重新分析' : '生成分析' }}</span>
              </el-button>
            </div>
            <p v-if="detailItem.aiAnalysis" class="ai-analysis-text">
              {{ detailItem.aiAnalysis }}
            </p>
            <span v-else class="muted-hint">暂无分析，点击右上角按钮生成</span>
          </div>
        </template>
      </div>

      <template #footer>
        <template v-if="detailEditing">
          <el-button @click="cancelDetailEdit">取消</el-button>
          <el-button
            type="primary"
            :loading="detailSaving"
            @click="handleDetailSave"
          >
            保存修改
          </el-button>
        </template>
        <template v-else>
          <el-popconfirm
            title="确定删除这篇日记吗？"
            confirm-button-text="删除"
            cancel-button-text="取消"
            @confirm="handleDetailDelete"
          >
            <template #reference>
              <el-button type="danger" plain>
                <el-icon><Delete /></el-icon>
                <span>删除</span>
              </el-button>
            </template>
          </el-popconfirm>
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="enterDetailEdit">
            <el-icon><Edit /></el-icon>
            <span>编辑</span>
          </el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  EditPen,
  Notebook,
  Delete,
  Edit,
  Plus,
  Filter,
  MagicStick,
} from '@element-plus/icons-vue';
import {
  createDiary,
  pageDiary,
  getDiary,
  updateDiary,
  deleteDiary,
  getTodayCount,
  generateAiAnalysis,
} from '@/api/diary';
import type { DiaryVO, DiaryPageQuery } from '@/types/api';

const loading = ref(false);
const publishing = ref(false);
const diaries = ref<DiaryVO[]>([]);
const total = ref(0);
const todayCount = ref(0);
const analysisLoadingId = ref<number | null>(null);

const editing = ref(false);
const editingId = ref<number | null>(null);

const form = reactive({
  moodScore: 6,
  content: '',
  tags: [] as string[],
});

// 分页 / 筛选条件
const query = reactive<Required<Pick<DiaryPageQuery, 'page' | 'size'>> & DiaryPageQuery>({
  page: 1,
  size: 10,
});

const filterVisible = ref(false);
const filterRange = ref<[string, string] | null>(null);
const filter = reactive<{
  minScore: number | undefined;
  maxScore: number | undefined;
}>({
  minScore: undefined,
  maxScore: undefined,
});

const marks = {
  1: '😭',
  3: '😔',
  5: '😐',
  7: '🙂',
  10: '😍',
};

const tagSuggestions = ['工作', '学习', '家人', '朋友', '睡眠', '运动', '独处'];

const tagInputVisible = ref(false);
const tagInputValue = ref('');
const tagInputRef = ref<HTMLInputElement | null>(null);

// ======= 详情弹窗相关状态 =======
const detailDialogVisible = ref(false);
const detailLoading = ref(false);
const detailSaving = ref(false);
const detailEditing = ref(false);
const detailAnalysisLoading = ref(false);
const detailItem = ref<DiaryVO | null>(null);

const detailForm = reactive({
  moodScore: 6,
  content: '',
  tags: [] as string[],
});

const detailTagInputVisible = ref(false);
const detailTagInputValue = ref('');
const detailTagInputRef = ref<HTMLInputElement | null>(null);

function moodLabel(score: number) {
  if (score <= 2) return '低落';
  if (score <= 4) return '有些疲惫';
  if (score <= 6) return '平静';
  if (score <= 8) return '愉快';
  return '非常开心';
}

function moodColor(score: number) {
  if (score <= 3) return '#6366f1';
  if (score <= 5) return '#60a5fa';
  if (score <= 7) return '#22d3ee';
  return '#f59e0b';
}

function moodStyle(score: number) {
  return {
    background: `linear-gradient(135deg, ${moodColor(score)}, #a5f3fc)`,
  };
}

function resetForm() {
  form.moodScore = 6;
  form.content = '';
  form.tags = [];
}

function cancelEdit() {
  editing.value = false;
  editingId.value = null;
  resetForm();
}

function showTagInput() {
  tagInputVisible.value = true;
  nextTick(() => {
    (tagInputRef.value as any)?.focus?.();
  });
}

function confirmTagInput() {
  const value = tagInputValue.value.trim();
  if (value) appendTag(value);
  tagInputVisible.value = false;
  tagInputValue.value = '';
}

function appendTag(tag: string) {
  if (!form.tags.includes(tag)) {
    form.tags.push(tag);
  }
}

function removeTag(tag: string) {
  form.tags = form.tags.filter((t) => t !== tag);
}

async function fetchTodayCount() {
  try {
    const res = await getTodayCount();
    todayCount.value = res.data.count;
  } catch {
    // 全局拦截器已提示
  }
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await pageDiary({
      page: query.page,
      size: query.size,
      startDate: filterRange.value?.[0],
      endDate: filterRange.value?.[1],
      minScore: filter.minScore,
      maxScore: filter.maxScore,
    });
    diaries.value = res.data.records || [];
    total.value = res.data.total || 0;
  } catch {
    // 全局拦截器已提示
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number) {
  query.page = page;
  fetchList();
}

function handleApplyFilter() {
  query.page = 1;
  fetchList();
}

function handleResetFilter() {
  filterRange.value = null;
  filter.minScore = undefined;
  filter.maxScore = undefined;
  query.page = 1;
  fetchList();
}

async function handleSubmit() {
  if (!form.content.trim()) {
    ElMessage.warning('写点什么再发布吧～');
    return;
  }
  if (form.content.length > 500) {
    ElMessage.warning('日记内容最多 500 字');
    return;
  }
  if (form.moodScore < 1 || form.moodScore > 10) {
    ElMessage.warning('情绪分值需在 1-10 之间');
    return;
  }

  publishing.value = true;
  try {
    if (editing.value && editingId.value != null) {
      await updateDiary(editingId.value, {
        content: form.content.trim(),
        moodScore: form.moodScore,
        tags: form.tags,
      });
      ElMessage.success('已保存修改');
      cancelEdit();
    } else {
      await createDiary({
        content: form.content.trim(),
        moodScore: form.moodScore,
        tags: form.tags,
      });
      ElMessage.success('已记录，愿你今天也温柔待己 🌿');
      resetForm();
    }
    await Promise.all([fetchList(), fetchTodayCount()]);
  } catch {
    // 全局拦截器已提示
  } finally {
    publishing.value = false;
  }
}

function handleEdit(item: DiaryVO) {
  editing.value = true;
  editingId.value = item.id;
  form.content = item.content;
  form.moodScore = item.score;
  form.tags = [...(item.tags || [])];
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleDelete(item: DiaryVO) {
  try {
    await deleteDiary(item.id);
    ElMessage.success('已删除');
    if (editingId.value === item.id) cancelEdit();
    // 如果删光当前页，退回上一页
    if (diaries.value.length === 1 && query.page > 1) {
      query.page -= 1;
    }
    await Promise.all([fetchList(), fetchTodayCount()]);
  } catch {
    // 全局拦截器已提示
  }
}

async function handleAnalysis(item: DiaryVO) {
  analysisLoadingId.value = item.id;
  try {
    const res = await generateAiAnalysis(item.id);
    const idx = diaries.value.findIndex((d) => d.id === item.id);
    if (idx !== -1) {
      diaries.value[idx] = res.data;
    }
    ElMessage.success('AI 分析已生成');
  } catch {
    // 全局拦截器已提示
  } finally {
    analysisLoadingId.value = null;
  }
}

// ======= 详情弹窗：查看 / 编辑 =======
function syncDetailForm(data: DiaryVO) {
  detailForm.moodScore = data.score;
  detailForm.content = data.content;
  detailForm.tags = [...(data.tags || [])];
}

async function openDetail(item: DiaryVO) {
  detailItem.value = item;
  syncDetailForm(item);
  detailEditing.value = false;
  detailDialogVisible.value = true;

  // 拉取最新详情，以拿到可能被其它地方更新的 aiAnalysis 等字段
  detailLoading.value = true;
  try {
    const res = await getDiary(item.id);
    detailItem.value = res.data;
    syncDetailForm(res.data);
    // 同步列表里该条记录
    const idx = diaries.value.findIndex((d) => d.id === item.id);
    if (idx !== -1) diaries.value[idx] = res.data;
  } catch {
    // 全局拦截器已提示；弹窗仍然显示已缓存数据
  } finally {
    detailLoading.value = false;
  }
}

function enterDetailEdit() {
  if (!detailItem.value) return;
  syncDetailForm(detailItem.value);
  detailEditing.value = true;
}

function cancelDetailEdit() {
  if (detailItem.value) syncDetailForm(detailItem.value);
  detailEditing.value = false;
  detailTagInputVisible.value = false;
  detailTagInputValue.value = '';
}

function resetDetailState() {
  detailItem.value = null;
  detailEditing.value = false;
  detailTagInputVisible.value = false;
  detailTagInputValue.value = '';
}

function showDetailTagInput() {
  detailTagInputVisible.value = true;
  nextTick(() => {
    (detailTagInputRef.value as any)?.focus?.();
  });
}

function confirmDetailTagInput() {
  const value = detailTagInputValue.value.trim();
  if (value && !detailForm.tags.includes(value)) {
    detailForm.tags.push(value);
  }
  detailTagInputVisible.value = false;
  detailTagInputValue.value = '';
}

function removeDetailTag(tag: string) {
  detailForm.tags = detailForm.tags.filter((t) => t !== tag);
}

function appendDetailTag(tag: string) {
  if (!detailForm.tags.includes(tag)) {
    detailForm.tags.push(tag);
  }
}

async function handleDetailSave() {
  if (!detailItem.value) return;
  if (!detailForm.content.trim()) {
    ElMessage.warning('日记内容不能为空');
    return;
  }
  if (detailForm.content.length > 500) {
    ElMessage.warning('日记内容最多 500 字');
    return;
  }
  if (detailForm.moodScore < 1 || detailForm.moodScore > 10) {
    ElMessage.warning('情绪分值需在 1-10 之间');
    return;
  }

  detailSaving.value = true;
  try {
    const res = await updateDiary(detailItem.value.id, {
      content: detailForm.content.trim(),
      moodScore: detailForm.moodScore,
      tags: detailForm.tags,
    });
    detailItem.value = res.data;
    syncDetailForm(res.data);
    const idx = diaries.value.findIndex((d) => d.id === res.data.id);
    if (idx !== -1) diaries.value[idx] = res.data;
    detailEditing.value = false;
    ElMessage.success('已保存修改');
    await fetchTodayCount();
  } catch {
    // 全局拦截器已提示
  } finally {
    detailSaving.value = false;
  }
}

async function handleDetailAnalysis() {
  if (!detailItem.value) return;
  detailAnalysisLoading.value = true;
  try {
    const res = await generateAiAnalysis(detailItem.value.id);
    detailItem.value = res.data;
    const idx = diaries.value.findIndex((d) => d.id === res.data.id);
    if (idx !== -1) diaries.value[idx] = res.data;
    ElMessage.success('AI 分析已生成');
  } catch {
    // 全局拦截器已提示
  } finally {
    detailAnalysisLoading.value = false;
  }
}

async function handleDetailDelete() {
  if (!detailItem.value) return;
  const id = detailItem.value.id;
  try {
    await deleteDiary(id);
    ElMessage.success('已删除');
    if (editingId.value === id) cancelEdit();
    if (diaries.value.length === 1 && query.page > 1) {
      query.page -= 1;
    }
    detailDialogVisible.value = false;
    await Promise.all([fetchList(), fetchTodayCount()]);
  } catch {
    // 全局拦截器已提示
  }
}

onMounted(() => {
  fetchList();
  fetchTodayCount();
});
</script>

<style scoped>
.diary-view {
  max-width: 1100px;
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

.mood-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  color: var(--healing-muted);
  border: 1px solid #e0f2fe;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22d3ee, #60a5fa);
}

.diary-layout {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 20px;
  align-items: start;
}

.diary-list-wrap {
  background: #ffffff;
  border-radius: 18px;
  padding: 18px;
  box-shadow: var(--healing-card-shadow);
  height: calc(100vh - 160px);
  min-height: 480px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1e3a8a;
}

.filter-panel {
  background: #f0f9ff;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid #e0f2fe;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 13px;
  color: #334155;
}

.filter-sep {
  color: var(--healing-muted);
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.diary-list {
  flex: 1 1 auto;
  min-height: 0;
  padding-right: 6px;
  overflow: hidden;
}

.diary-list :deep(.el-scrollbar__wrap) {
  max-height: 100%;
}

.diary-item {
  padding: 14px 16px;
  margin-bottom: 10px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f0f9ff, #ffffff);
  border: 1px solid #e0f2fe;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  user-select: none;
}

.diary-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(96, 165, 250, 0.14);
}

.diary-item-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.diary-item-meta {
  flex: 1;
}

.diary-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.mood-bubble {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 10px rgba(96, 165, 250, 0.3);
}

.diary-date {
  font-size: 13px;
  color: #334155;
  font-weight: 500;
}

.diary-label {
  font-size: 12px;
  color: var(--healing-muted);
}

.diary-content {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: #334155;
  white-space: pre-wrap;
}

.diary-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.ai-analysis {
  margin-top: 10px;
  padding: 10px 12px;
  background: linear-gradient(135deg, #ecfeff, #f5f3ff);
  border-radius: 10px;
  border: 1px dashed #c7d2fe;
}

.ai-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 4px;
}

.ai-analysis p {
  margin: 0;
  font-size: 13px;
  color: #334155;
  line-height: 1.7;
  white-space: pre-wrap;
}

.empty-hint {
  text-align: center;
  color: var(--healing-muted);
  padding: 40px 0;
  font-size: 13px;
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}

.publish-card {
  border: none;
  border-radius: 18px;
  box-shadow: var(--healing-card-shadow);
  background: #ffffff;
  position: sticky;
  top: 90px;
}

.mood-block {
  margin: 4px 0 18px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #f0f9ff, #ecfeff);
  border-radius: 14px;
}

.mood-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
  color: #334155;
}

.mood-value {
  font-weight: 600;
}

.tags-block {
  margin-top: 14px;
}

.tags-label {
  font-size: 13px;
  color: #334155;
  margin-bottom: 6px;
}

.tags-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag-input {
  width: 120px;
}

.tag-suggest {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.suggest-item {
  font-size: 12px;
  color: #60a5fa;
  cursor: pointer;
  transition: color 0.2s ease;
}

.suggest-item:hover {
  color: #2563eb;
}

.suggest-item.disabled {
  color: #cbd5e1;
  cursor: not-allowed;
  pointer-events: none;
}

.publish-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

@media (max-width: 820px) {
  .diary-layout {
    grid-template-columns: 1fr;
  }

  .publish-card {
    position: static;
  }

  .diary-list-wrap {
    height: auto;
    max-height: none;
    min-height: 400px;
  }
}

/* ============ 详情弹窗 ============ */
.diary-detail-dialog :deep(.el-dialog__body) {
  padding-top: 10px;
}

.detail-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 14px;
  margin-bottom: 8px;
  border-bottom: 1px dashed #e0f2fe;
}

.mood-bubble-lg {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 18px;
  box-shadow: 0 6px 14px rgba(96, 165, 250, 0.3);
}

.detail-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-date {
  font-size: 15px;
  font-weight: 600;
  color: #1e3a8a;
}

.detail-label {
  font-size: 12px;
  color: var(--healing-muted);
}

.detail-section {
  margin-top: 14px;
}

.detail-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.detail-content {
  margin: 0;
  padding: 12px 14px;
  background: linear-gradient(135deg, #f0f9ff, #ffffff);
  border: 1px solid #e0f2fe;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.8;
  color: #334155;
  white-space: pre-wrap;
}

.ai-analysis-text {
  margin: 0;
  padding: 12px 14px;
  background: linear-gradient(135deg, #ecfeff, #f5f3ff);
  border-radius: 12px;
  border: 1px dashed #c7d2fe;
  font-size: 13px;
  color: #334155;
  line-height: 1.7;
  white-space: pre-wrap;
}

.muted-hint {
  font-size: 12px;
  color: var(--healing-muted);
}
</style>
