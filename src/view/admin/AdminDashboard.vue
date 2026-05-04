<template>
  <div class="dashboard-view">
    <section class="welcome">
      <h1 class="welcome-title">
        你好，<span class="highlight">{{ displayName }}</span>
      </h1>
      <p class="welcome-desc">
        这里是心语空间的「后台小屋」，今天也辛苦你来照看大家了 ☁️
      </p>
    </section>

    <section class="stat-grid" v-loading="overviewLoading">
      <div
        v-for="card in overviewCards"
        :key="card.label"
        class="stat-card"
        :style="{ background: card.bg }"
      >
        <div class="stat-icon">{{ card.emoji }}</div>
        <div class="stat-meta">
          <div class="stat-label">{{ card.label }}</div>
          <div class="stat-value">{{ card.value }}</div>
        </div>
      </div>
    </section>

    <section class="board">
      <el-card class="panel" shadow="never">
        <div class="panel-head">
          <div class="panel-title">
            <el-icon><Warning /></el-icon>
            <span>需要关注的伙伴</span>
          </div>
          <el-button text type="primary" @click="router.push('/admin/risk-users')">
            查看全部
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>

        <div v-loading="riskLoading">
          <div v-if="!riskLoading && riskUsers.length === 0" class="empty">
            最近 14 天暂无风险信号，大家都还好 🌿
          </div>
          <div
            v-for="item in riskUsers"
            :key="item.userId"
            class="risk-row"
          >
            <el-avatar
              :size="40"
              :src="resolveAssetUrl(item.avatar) || defaultAvatar"
              :icon="UserFilled"
              class="risk-avatar"
            />
            <div class="risk-meta">
              <div class="risk-line">
                <span class="risk-nick">{{ item.nickname || item.email }}</span>
                <el-tag
                  size="small"
                  :type="levelTag(item.level)"
                  effect="light"
                  round
                >
                  {{ levelLabel(item.level) }}
                </el-tag>
              </div>
              <div class="risk-reason">{{ item.reason }}</div>
            </div>
            <div class="risk-score">
              <span class="score-value">{{ item.averageScore.toFixed(1) }}</span>
              <span class="score-label">平均分</span>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="panel" shadow="never">
        <div class="panel-head">
          <div class="panel-title">
            <el-icon><MagicStick /></el-icon>
            <span>常用操作</span>
          </div>
        </div>
        <div class="quick-grid">
          <div
            v-for="q in quickActions"
            :key="q.label"
            class="quick-card"
            :style="{ background: q.bg }"
            @click="q.action"
          >
            <div class="quick-emoji">{{ q.emoji }}</div>
            <div class="quick-label">{{ q.label }}</div>
            <div class="quick-desc">{{ q.desc }}</div>
          </div>
        </div>
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Warning,
  ArrowRight,
  UserFilled,
  MagicStick,
} from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { resolveAssetUrl } from '@/utils/request';
import { getUserOverview, listRiskUsers } from '@/api/admin';
import { useReindex } from '@/composables/useReindex';
import type { UserOverviewVO, RiskUserVO } from '@/types/api';

const reindex = useReindex();

const router = useRouter();
const userStore = useUserStore();

const overviewLoading = ref(false);
const overview = ref<UserOverviewVO | null>(null);

const riskLoading = ref(false);
const riskUsers = ref<RiskUserVO[]>([]);

const defaultAvatar =
  'https://api.dicebear.com/7.x/thumbs/svg?seed=admin&backgroundColor=bae6fd,a5f3fc,dbeafe';

const displayName = computed(() => userStore.nickname || '管理员');

const overviewCards = computed(() => [
  {
    label: '注册用户',
    value: overview.value?.total ?? '--',
    emoji: '👥',
    bg: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
  },
  {
    label: '已启用',
    value: overview.value?.enabled ?? '--',
    emoji: '🌿',
    bg: 'linear-gradient(135deg, #cffafe, #a5f3fc)',
  },
  {
    label: '已停用',
    value: overview.value?.disabled ?? '--',
    emoji: '🌙',
    bg: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
  },
  {
    label: '管理员',
    value: overview.value?.admins ?? '--',
    emoji: '🛡️',
    bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
  },
]);

const quickActions = [
  {
    emoji: '✨',
    label: '重建知识索引',
    desc: '同步最新 RAG 文档',
    bg: 'linear-gradient(135deg, #ecfeff, #cffafe)',
    action: handleReindex,
  },
  {
    emoji: '📚',
    label: '编辑知识库',
    desc: '维护对话使用的资料',
    bg: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
    action: () => router.push('/admin/knowledge'),
  },
  {
    emoji: '💬',
    label: '管理励志短句',
    desc: '为首页注入温柔能量',
    bg: 'linear-gradient(135deg, #fef9c3, #fde68a)',
    action: () => router.push('/admin/quotes'),
  },
  {
    emoji: '👤',
    label: '用户管理',
    desc: '调整角色 / 状态',
    bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
    action: () => router.push('/admin/users'),
  },
];

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

async function fetchOverview() {
  overviewLoading.value = true;
  try {
    const res = await getUserOverview();
    overview.value = res.data;
  } catch {
    // 全局拦截器已提示
  } finally {
    overviewLoading.value = false;
  }
}

async function fetchRisk() {
  riskLoading.value = true;
  try {
    const res = await listRiskUsers({ days: 14, limit: 5 });
    riskUsers.value = res.data || [];
  } catch {
    // 全局拦截器已提示
  } finally {
    riskLoading.value = false;
  }
}

async function handleReindex() {
  await reindex.runReindex();
}

onMounted(() => {
  fetchOverview();
  fetchRisk();
});
</script>

<style scoped>
.dashboard-view {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome {
  padding: 4px 4px 12px;
}

.welcome-title {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 600;
  color: #0f172a;
}

.welcome-title .highlight {
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.welcome-desc {
  margin: 0;
  font-size: 13px;
  color: var(--healing-muted);
}

.stat-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: var(--healing-card-shadow);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(96, 165, 250, 0.18);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: rgba(255, 255, 255, 0.6);
}

.stat-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 13px;
  color: var(--healing-muted);
}

.stat-value {
  font-size: 26px;
  font-weight: 600;
  color: #1e3a8a;
}

.board {
  margin-top: 24px;
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 20px;
  align-items: start;
}

.panel {
  border: none;
  border-radius: 18px;
  box-shadow: var(--healing-card-shadow);
  background: #ffffff;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1e3a8a;
}

.empty {
  padding: 40px 0;
  text-align: center;
  color: var(--healing-muted);
  font-size: 13px;
}

.risk-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px dashed #e0f2fe;
}

.risk-row:last-child {
  border-bottom: none;
}

.risk-avatar {
  border: 2px solid #ffffff;
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.18);
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
  margin-bottom: 4px;
}

.risk-nick {
  font-size: 14px;
  color: #1e3a8a;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.risk-reason {
  font-size: 12px;
  color: var(--healing-muted);
  line-height: 1.6;
}

.risk-score {
  text-align: right;
  flex-shrink: 0;
}

.score-value {
  font-size: 18px;
  font-weight: 600;
  color: #f59e0b;
  display: block;
  line-height: 1;
}

.score-label {
  font-size: 12px;
  color: var(--healing-muted);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.quick-card {
  padding: 16px;
  border-radius: 14px;
  background: #f0f9ff;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid rgba(186, 230, 253, 0.7);
}

.quick-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(96, 165, 250, 0.18);
}

.quick-emoji {
  font-size: 22px;
  margin-bottom: 6px;
}

.quick-label {
  font-size: 14px;
  font-weight: 600;
  color: #1e3a8a;
  margin-bottom: 4px;
}

.quick-desc {
  font-size: 12px;
  color: var(--healing-muted);
  line-height: 1.6;
}

@media (max-width: 900px) {
  .board {
    grid-template-columns: 1fr;
  }
}
</style>
