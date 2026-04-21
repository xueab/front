<template>
  <div class="stats-view">
    <div class="page-header">
      <div>
        <h2 class="page-title">情绪图谱</h2>
        <p class="page-subtitle">回看过去一周，你都经历了什么心情 ✨</p>
      </div>
      <el-radio-group v-model="range" size="small" @change="loadData">
        <el-radio-button :value="7">近 7 天</el-radio-button>
        <el-radio-button :value="14">近 14 天</el-radio-button>
        <el-radio-button :value="30">近 30 天</el-radio-button>
      </el-radio-group>
    </div>

    <div class="summary-grid">
      <div
        v-for="card in summaryCards"
        :key="card.label"
        class="summary-card"
        :style="{ background: card.bg }"
      >
        <div class="summary-icon">{{ card.emoji }}</div>
        <div>
          <div class="summary-value">{{ card.value }}</div>
          <div class="summary-label">{{ card.label }}</div>
        </div>
      </div>
    </div>

    <el-card class="chart-card" shadow="never" v-loading="loading">
      <div class="section-title">
        <el-icon><TrendCharts /></el-icon>
        <span>情绪波动曲线</span>
      </div>
      <div ref="chartRef" class="chart-area"></div>
    </el-card>

    <el-card class="insight-card" shadow="never">
      <div class="section-title">
        <el-icon><Sunny /></el-icon>
        <span>本周小洞察</span>
      </div>
      <ul class="insight-list">
        <li v-for="(tip, idx) in insights" :key="idx">{{ tip }}</li>
      </ul>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import * as echarts from 'echarts';
import { Sunny, TrendCharts } from '@element-plus/icons-vue';

const chartRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;

const loading = ref(false);
const range = ref(7);
const dates = ref<string[]>([]);
const scores = ref<number[]>([]);

const mockScores7 = [5, 6, 4, 7, 8, 6, 7];
const mockScores14 = [4, 5, 6, 4, 5, 7, 6, 5, 6, 4, 7, 8, 6, 7];
const mockScores30 = Array.from({ length: 30 }, (_, i) => {
  const base = 5 + Math.sin(i / 3) * 2;
  return Math.max(1, Math.min(10, Math.round(base + (i % 4 === 0 ? 1 : 0))));
});

function genDates(n: number) {
  const arr: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const pad = (v: number) => v.toString().padStart(2, '0');
    arr.push(`${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }
  return arr;
}

function loadData() {
  loading.value = true;
  setTimeout(() => {
    dates.value = genDates(range.value);
    if (range.value === 7) scores.value = [...mockScores7];
    else if (range.value === 14) scores.value = [...mockScores14];
    else scores.value = [...mockScores30];
    loading.value = false;
    nextTick(renderChart);
  }, 300);
}

const summaryCards = computed(() => {
  const arr = scores.value;
  const avg =
    arr.length === 0
      ? 0
      : Math.round((arr.reduce((s, x) => s + x, 0) / arr.length) * 10) / 10;
  const max = arr.length ? Math.max(...arr) : 0;
  const min = arr.length ? Math.min(...arr) : 0;
  return [
    {
      label: '平均分',
      value: avg,
      emoji: '💫',
      bg: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
    },
    {
      label: '最高分',
      value: max,
      emoji: '🌈',
      bg: 'linear-gradient(135deg, #cffafe, #a5f3fc)',
    },
    {
      label: '最低分',
      value: min,
      emoji: '🌙',
      bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
    },
    {
      label: '记录天数',
      value: arr.length,
      emoji: '📅',
      bg: 'linear-gradient(135deg, #ecfeff, #cffafe)',
    },
  ];
});

const insights = computed(() => {
  const arr = scores.value;
  if (arr.length === 0) return ['暂无数据，先去写几篇日记吧。'];
  const avg = arr.reduce((s, x) => s + x, 0) / arr.length;
  const tips: string[] = [];
  if (avg >= 7) {
    tips.push('最近整体情绪不错，记得把这些好感受留给未来的自己 ✨');
  } else if (avg >= 5) {
    tips.push('情绪平稳，保持节奏。偶尔给自己一点小惊喜也很棒。');
  } else {
    tips.push('最近有点辛苦了，记得多给自己一些照顾与休息 🌿');
  }
  const max = Math.max(...arr);
  const maxIdx = arr.indexOf(max);
  tips.push(`最开心的一天是 ${dates.value[maxIdx]}，那天发生了什么美好的事呢？`);
  const min = Math.min(...arr);
  tips.push(`最低的分数是 ${min}，允许自己有情绪，它们都会慢慢过去。`);
  return tips;
});

function renderChart() {
  if (!chartRef.value) return;
  if (!chart) {
    chart = echarts.init(chartRef.value);
  }
  chart.setOption({
    grid: { left: 40, right: 20, top: 40, bottom: 40 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#bae6fd',
      textStyle: { color: '#334155' },
      formatter: (params: any[]) => {
        const p = params[0];
        return `${p.axisValue}<br/>情绪分数：<strong style="color:#0ea5e9">${p.value}</strong> / 10`;
      },
    },
    xAxis: {
      type: 'category',
      data: dates.value,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b' },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 10,
      splitLine: { lineStyle: { color: '#e0f2fe' } },
      axisLabel: { color: '#64748b' },
    },
    series: [
      {
        name: '情绪分数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 10,
        data: scores.value,
        lineStyle: {
          width: 3,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#60a5fa' },
            { offset: 1, color: '#22d3ee' },
          ]),
        },
        itemStyle: {
          color: '#ffffff',
          borderColor: '#22d3ee',
          borderWidth: 3,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(96,165,250,0.35)' },
            { offset: 1, color: 'rgba(34,211,238,0.02)' },
          ]),
        },
      },
    ],
  });
  chart.resize();
}

function onResize() {
  chart?.resize();
}

onMounted(() => {
  loadData();
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  chart?.dispose();
  chart = null;
});
</script>

<style scoped>
.stats-view {
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.summary-card {
  padding: 18px 20px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 8px 20px rgba(96, 165, 250, 0.12);
}

.summary-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-value {
  font-size: 22px;
  font-weight: 700;
  color: #1e3a8a;
}

.summary-label {
  font-size: 12px;
  color: #475569;
  margin-top: 2px;
}

.chart-card,
.insight-card {
  border: none;
  border-radius: 18px;
  box-shadow: var(--healing-card-shadow);
  background: #ffffff;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1e3a8a;
  margin-bottom: 16px;
}

.chart-area {
  width: 100%;
  height: 340px;
}

.insight-list {
  margin: 0;
  padding-left: 20px;
  color: #334155;
  font-size: 14px;
  line-height: 2;
}

.insight-list li::marker {
  color: #22d3ee;
}
</style>
