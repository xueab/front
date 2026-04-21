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
        <div class="section-title">
          <el-icon><Notebook /></el-icon>
          <span>历史日记</span>
        </div>
        <el-scrollbar class="diary-list" v-loading="loading">
          <transition-group name="list" tag="div">
            <div
              v-for="item in diaries"
              :key="item.id"
              class="diary-item"
            >
              <div class="diary-item-head">
                <div class="mood-bubble" :style="moodStyle(item.score)">
                  {{ item.score }}
                </div>
                <div class="diary-item-meta">
                  <div class="diary-date">{{ item.date }}</div>
                  <div class="diary-label">{{ moodLabel(item.score) }}</div>
                </div>
              </div>
              <p class="diary-content">{{ item.content }}</p>
            </div>
          </transition-group>
          <div v-if="!loading && diaries.length === 0" class="empty-hint">
            还没有日记，试着写下第一篇吧～
          </div>
        </el-scrollbar>
      </div>

      <el-card class="publish-card" shadow="never">
        <div class="section-title">
          <el-icon><EditPen /></el-icon>
          <span>写下此刻</span>
        </div>

        <div class="mood-block">
          <div class="mood-header">
            <span>今天的情绪</span>
            <span class="mood-value" :style="{ color: moodColor(form.score) }">
              {{ form.score }} / 10 · {{ moodLabel(form.score) }}
            </span>
          </div>
          <el-slider
            v-model="form.score"
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

        <div class="publish-actions">
          <el-button plain @click="resetForm">清空</el-button>
          <el-button type="primary" :loading="publishing" @click="handlePublish">
            发布日记
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { EditPen, Notebook } from '@element-plus/icons-vue';

interface DiaryItem {
  id: number;
  date: string;
  score: number;
  content: string;
}

const loading = ref(false);
const publishing = ref(false);
const diaries = ref<DiaryItem[]>([]);

const form = reactive({
  score: 6,
  content: '',
});

const marks = {
  1: '😭',
  3: '😔',
  5: '😐',
  7: '🙂',
  10: '😍',
};

const todayStr = new Date().toISOString().slice(0, 10);
const todayCount = computed(
  () => diaries.value.filter((d) => d.date.startsWith(todayStr)).length,
);

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

function fmtDate(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function loadMock() {
  loading.value = true;
  setTimeout(() => {
    diaries.value = [
      {
        id: 1,
        date: '2026-04-17 22:10',
        score: 7,
        content:
          '今天散步的时候看到黄昏，云是粉色的，觉得世界真温柔，自己也没那么糟。',
      },
      {
        id: 2,
        date: '2026-04-16 09:45',
        score: 4,
        content:
          '早上被闹钟叫醒，有点不想起来。提醒自己：慢一点也可以，今天只做一件重要的事。',
      },
      {
        id: 3,
        date: '2026-04-14 20:30',
        score: 9,
        content:
          '和朋友视频了一个小时，一直在笑。原来被理解的感觉可以让一整天发光。',
      },
      {
        id: 4,
        date: '2026-04-13 23:05',
        score: 3,
        content:
          '加班到很晚，觉得累。但抱了抱自己的小熊，告诉它：辛苦了，明天再继续。',
      },
    ];
    loading.value = false;
  }, 400);
}

function resetForm() {
  form.score = 6;
  form.content = '';
}

async function handlePublish() {
  if (!form.content.trim()) {
    ElMessage.warning('写点什么再发布吧～');
    return;
  }
  publishing.value = true;
  await new Promise((resolve) => setTimeout(resolve, 600));
  diaries.value.unshift({
    id: Date.now(),
    date: fmtDate(new Date()),
    score: form.score,
    content: form.content.trim(),
  });
  resetForm();
  publishing.value = false;
  ElMessage.success('已记录，愿你今天也温柔待己 🌿');
}

onMounted(loadMock);
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
  max-height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1e3a8a;
  margin-bottom: 12px;
}

.diary-list {
  flex: 1;
  padding-right: 6px;
}

.diary-item {
  padding: 14px 16px;
  margin-bottom: 10px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f0f9ff, #ffffff);
  border: 1px solid #e0f2fe;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
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

.empty-hint {
  text-align: center;
  color: var(--healing-muted);
  padding: 40px 0;
  font-size: 13px;
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
    max-height: none;
  }
}
</style>
