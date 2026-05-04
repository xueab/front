<template>
  <div class="risk-view">
    <el-card class="filter-bar" shadow="never">
      <div class="filter-row">
        <span class="filter-label">统计窗口</span>
        <el-radio-group v-model="filter.days" size="default" @change="fetchList">
          <el-radio-button :value="7">近 7 天</el-radio-button>
          <el-radio-button :value="14">近 14 天</el-radio-button>
          <el-radio-button :value="30">近 30 天</el-radio-button>
        </el-radio-group>

        <span class="filter-label">风险等级</span>
        <el-select
          v-model="filter.level"
          placeholder="全部等级"
          clearable
          class="filter-select"
          @change="fetchList"
        >
          <el-option label="高风险" value="HIGH" />
          <el-option label="中等风险" value="MEDIUM" />
          <el-option label="轻度关注" value="LOW" />
        </el-select>

        <span class="filter-label">最大数量</span>
        <el-input-number
          v-model="filter.limit"
          :min="10"
          :max="100"
          :step="10"
          controls-position="right"
          @change="fetchList"
        />

        <div class="filter-spacer"></div>

        <el-button plain round :loading="loading" @click="fetchList">
          <el-icon><Refresh /></el-icon>
          <span>刷新</span>
        </el-button>
      </div>
    </el-card>

    <el-card class="list-card" shadow="never" v-loading="loading">
      <div v-if="!loading && records.length === 0" class="empty-tip">
        当前条件下没有命中的高风险用户，大家都还好 🌿
      </div>

      <div
        v-for="item in records"
        :key="item.userId"
        class="risk-item"
      >
        <el-avatar
          :size="50"
          :src="resolveAssetUrl(item.avatar) || defaultAvatar"
          :icon="UserFilled"
          class="risk-avatar"
        />
        <div class="risk-meta">
          <div class="risk-line">
            <span class="risk-nick">{{ item.nickname || item.email }}</span>
            <el-tag
              :type="levelTag(item.level)"
              size="small"
              effect="light"
              round
            >
              {{ levelLabel(item.level) }}
            </el-tag>
            <span class="risk-email">{{ item.email }}</span>
          </div>
          <div class="risk-reason">{{ item.reason }}</div>
          <div class="risk-extra">
            <span>
              <el-icon><Clock /></el-icon>
              最近一次：{{ formatTime(item.lastDiaryAt) }}
            </span>
            <span>
              <el-icon><Notebook /></el-icon>
              共 {{ item.diaryCount }} 篇日记
            </span>
          </div>
        </div>
        <div class="risk-stats">
          <div class="stat-block">
            <div class="stat-num" :style="{ color: scoreColor(item.minScore) }">
              {{ item.minScore }}
            </div>
            <div class="stat-label">最低分</div>
          </div>
          <div class="stat-block">
            <div class="stat-num" :style="{ color: scoreColor(item.averageScore) }">
              {{ item.averageScore.toFixed(1) }}
            </div>
            <div class="stat-label">平均分</div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { UserFilled, Refresh, Clock, Notebook } from '@element-plus/icons-vue';
import { listRiskUsers } from '@/api/admin';
import { resolveAssetUrl } from '@/utils/request';
import type { RiskUserVO } from '@/types/api';

const defaultAvatar =
  'https://api.dicebear.com/7.x/thumbs/svg?seed=user&backgroundColor=bae6fd,a5f3fc,dbeafe';

const loading = ref(false);
const records = ref<RiskUserVO[]>([]);

const filter = reactive<{
  days: 7 | 14 | 30;
  level: string;
  limit: number;
}>({
  days: 14,
  level: '',
  limit: 50,
});

function levelTag(level: string) {
  if (level === 'HIGH') return 'danger';
  if (level === 'MEDIUM') return 'warning';
  return 'info';
}

function levelLabel(level: string) {
  if (level === 'HIGH') return '高风险';
  if (level === 'MEDIUM') return '中等风险';
  if (level === 'LOW') return '轻度关注';
  return level;
}

function scoreColor(score: number) {
  if (score <= 2) return '#ef4444';
  if (score <= 4) return '#f59e0b';
  if (score <= 6) return '#60a5fa';
  return '#22c55e';
}

function formatTime(value: string) {
  if (!value) return '--';
  return value.replace('T', ' ').slice(0, 16);
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await listRiskUsers({
      days: filter.days,
      level: filter.level || undefined,
      limit: filter.limit,
    });
    records.value = res.data || [];
  } catch {
    // 全局拦截器已提示
  } finally {
    loading.value = false;
  }
}

onMounted(fetchList);
</script>

<style scoped>
.risk-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.filter-bar,
.list-card {
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

.filter-label {
  font-size: 13px;
  color: #334155;
}

.filter-select {
  width: 160px;
}

.filter-spacer {
  flex: 1;
}

.empty-tip {
  text-align: center;
  color: var(--healing-muted);
  padding: 60px 0;
  font-size: 13px;
}

.risk-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f0f9ff, #ffffff);
  border: 1px solid #e0f2fe;
  margin-bottom: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.risk-item:last-child {
  margin-bottom: 0;
}

.risk-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(96, 165, 250, 0.16);
}

.risk-avatar {
  border: 3px solid #ffffff;
  box-shadow: 0 6px 16px rgba(96, 165, 250, 0.25);
  background: linear-gradient(135deg, #bae6fd, #a5f3fc);
  color: #fff;
  flex-shrink: 0;
}

.risk-meta {
  flex: 1;
  min-width: 0;
}

.risk-line {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.risk-nick {
  font-size: 16px;
  font-weight: 600;
  color: #1e3a8a;
}

.risk-email {
  font-size: 12px;
  color: var(--healing-muted);
}

.risk-reason {
  font-size: 13px;
  color: #334155;
  line-height: 1.7;
  margin-bottom: 6px;
}

.risk-extra {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 12px;
  color: var(--healing-muted);
}

.risk-extra span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.risk-stats {
  display: flex;
  gap: 18px;
  flex-shrink: 0;
}

.stat-block {
  text-align: center;
  min-width: 56px;
}

.stat-num {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: var(--healing-muted);
  margin-top: 2px;
}

@media (max-width: 720px) {
  .risk-item {
    flex-wrap: wrap;
  }
  .risk-stats {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
