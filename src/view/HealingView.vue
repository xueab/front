<template>
  <div class="healing-view">
    <div class="page-header">
      <div>
        <h2 class="page-title">疗愈练习</h2>
        <p class="page-subtitle">
          为自己按下暂停键，用几分钟重新感受呼吸和心跳 🌿
        </p>
      </div>
      <el-segmented
        v-model="category"
        :options="categories"
        class="category-tabs"
      />
    </div>

    <div class="card-grid">
      <el-card
        v-for="item in filteredList"
        :key="item.id"
        class="healing-card"
        shadow="never"
        @click="openPlayer(item)"
      >
        <div class="cover" :style="{ background: item.cover }">
          <div class="cover-emoji">{{ item.emoji }}</div>
          <div class="cover-tag">{{ categoryLabel(item.category) }}</div>
        </div>
        <div class="card-body">
          <h3 class="card-title">{{ item.title }}</h3>
          <p class="card-desc">{{ item.desc }}</p>
          <div class="card-foot">
            <div class="duration">
              <el-icon><Timer /></el-icon>
              <span>{{ item.duration }}</span>
            </div>
            <el-button type="primary" round size="small">
              <el-icon><VideoPlay /></el-icon>
              <span>开始</span>
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <el-dialog
      v-model="playerVisible"
      :title="current?.title || ''"
      width="520px"
      class="player-dialog"
      destroy-on-close
      @close="stopPlay"
    >
      <div v-if="current" class="player">
        <div class="player-cover" :style="{ background: current.cover }">
          <div class="player-emoji" :class="{ breathing: playing }">
            {{ current.emoji }}
          </div>
        </div>
        <div class="player-title">{{ current.title }}</div>
        <div class="player-desc">{{ current.desc }}</div>

        <div class="progress">
          <span class="time">{{ fmtTime(progress) }}</span>
          <el-slider
            v-model="progress"
            :min="0"
            :max="totalSeconds"
            :show-tooltip="false"
            class="progress-slider"
            @change="onSeek"
          />
          <span class="time">{{ fmtTime(totalSeconds) }}</span>
        </div>

        <div class="controls">
          <el-button circle size="large" @click="rewind">
            <el-icon><DArrowLeft /></el-icon>
          </el-button>
          <el-button
            circle
            size="large"
            type="primary"
            class="play-btn"
            @click="togglePlay"
          >
            <el-icon :size="22">
              <VideoPause v-if="playing" />
              <VideoPlay v-else />
            </el-icon>
          </el-button>
          <el-button circle size="large" @click="forward">
            <el-icon><DArrowRight /></el-icon>
          </el-button>
        </div>

        <div class="breath-tip" v-if="playing">
          跟随节奏，吸气 · 停顿 · 呼气 🌬️
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import {
  Timer,
  VideoPlay,
  VideoPause,
  DArrowLeft,
  DArrowRight,
} from '@element-plus/icons-vue';

interface HealingItem {
  id: number;
  title: string;
  desc: string;
  duration: string;
  seconds: number;
  category: 'breath' | 'meditate' | 'sleep' | 'focus';
  emoji: string;
  cover: string;
}

const categories = [
  { value: 'all', label: '全部' },
  { value: 'breath', label: '呼吸' },
  { value: 'meditate', label: '冥想' },
  { value: 'sleep', label: '助眠' },
  { value: 'focus', label: '专注' },
];
const category = ref('all');

const list: HealingItem[] = [
  {
    id: 1,
    title: '3 分钟呼吸法',
    desc: '用 4-7-8 呼吸节奏，让心跳慢下来。',
    duration: '3 分钟',
    seconds: 180,
    category: 'breath',
    emoji: '🫧',
    cover: 'linear-gradient(135deg, #bae6fd, #a5f3fc)',
  },
  {
    id: 2,
    title: '冥想入门',
    desc: '第一次冥想也不紧张，跟随温柔的引导语。',
    duration: '8 分钟',
    seconds: 480,
    category: 'meditate',
    emoji: '🧘',
    cover: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
  },
  {
    id: 3,
    title: '雨声助眠',
    desc: '夜里睡不着？听一场温柔的细雨。',
    duration: '30 分钟',
    seconds: 1800,
    category: 'sleep',
    emoji: '🌧️',
    cover: 'linear-gradient(135deg, #cffafe, #e0f2fe)',
  },
  {
    id: 4,
    title: '晨间唤醒',
    desc: '用 5 分钟温柔地开始一天。',
    duration: '5 分钟',
    seconds: 300,
    category: 'meditate',
    emoji: '🌞',
    cover: 'linear-gradient(135deg, #fde68a, #fcd34d)',
  },
  {
    id: 5,
    title: '专注白噪音',
    desc: '舒缓的背景音，帮你进入心流。',
    duration: '25 分钟',
    seconds: 1500,
    category: 'focus',
    emoji: '🎧',
    cover: 'linear-gradient(135deg, #ecfeff, #cffafe)',
  },
  {
    id: 6,
    title: '身体扫描放松',
    desc: '从头到脚，把紧绷的地方慢慢松开。',
    duration: '12 分钟',
    seconds: 720,
    category: 'meditate',
    emoji: '🌿',
    cover: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
  },
  {
    id: 7,
    title: '睡前一杯热牛奶',
    desc: '柔软的钢琴曲，带你走进夜晚。',
    duration: '15 分钟',
    seconds: 900,
    category: 'sleep',
    emoji: '🌙',
    cover: 'linear-gradient(135deg, #e9d5ff, #ddd6fe)',
  },
  {
    id: 8,
    title: '海浪的声音',
    desc: '来到海边，让情绪随潮水起落。',
    duration: '20 分钟',
    seconds: 1200,
    category: 'breath',
    emoji: '🌊',
    cover: 'linear-gradient(135deg, #a5f3fc, #60a5fa)',
  },
];

function categoryLabel(cat: string) {
  return categories.find((c) => c.value === cat)?.label || '疗愈';
}

const filteredList = computed(() =>
  category.value === 'all'
    ? list
    : list.filter((x) => x.category === category.value),
);

const playerVisible = ref(false);
const current = ref<HealingItem | null>(null);
const playing = ref(false);
const progress = ref(0);
const totalSeconds = ref(0);
let timer: number | null = null;

function openPlayer(item: HealingItem) {
  current.value = item;
  totalSeconds.value = item.seconds;
  progress.value = 0;
  playing.value = false;
  playerVisible.value = true;
}

function togglePlay() {
  playing.value = !playing.value;
  if (playing.value) {
    timer = window.setInterval(() => {
      if (progress.value >= totalSeconds.value) {
        stopPlay();
        return;
      }
      progress.value += 1;
    }, 1000);
  } else {
    clearTimer();
  }
}

function clearTimer() {
  if (timer) {
    window.clearInterval(timer);
    timer = null;
  }
}

function stopPlay() {
  playing.value = false;
  clearTimer();
}

function onSeek() {
  // when user drags slider, nothing else to do; timer continues from new value
}

function rewind() {
  progress.value = Math.max(0, progress.value - 15);
}

function forward() {
  progress.value = Math.min(totalSeconds.value, progress.value + 15);
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

onBeforeUnmount(stopPlay);
</script>

<style scoped>
.healing-view {
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

.category-tabs :deep(.el-segmented) {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 4px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.healing-card {
  border: none;
  border-radius: 18px;
  box-shadow: var(--healing-card-shadow);
  background: #ffffff;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.healing-card :deep(.el-card__body) {
  padding: 0;
}

.healing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px rgba(96, 165, 250, 0.22);
}

.cover {
  position: relative;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-emoji {
  font-size: 56px;
  filter: drop-shadow(0 4px 12px rgba(255, 255, 255, 0.6));
}

.cover-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 3px 10px;
  font-size: 12px;
  color: #1e3a8a;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  backdrop-filter: blur(6px);
}

.card-body {
  padding: 16px 18px 18px;
}

.card-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1e3a8a;
}

.card-desc {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--healing-muted);
  min-height: 44px;
}

.card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.duration {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--healing-muted);
}

.player-dialog :deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
}

.player {
  text-align: center;
  padding: 4px 8px 12px;
}

.player-cover {
  height: 180px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.player-emoji {
  font-size: 80px;
  transition: transform 4s ease-in-out;
}

.player-emoji.breathing {
  animation: breath 6s ease-in-out infinite;
}

@keyframes breath {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.player-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e3a8a;
}

.player-desc {
  margin: 6px 0 18px;
  font-size: 13px;
  color: var(--healing-muted);
}

.progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.progress-slider {
  flex: 1;
}

.time {
  font-size: 12px;
  color: var(--healing-muted);
  min-width: 40px;
  text-align: center;
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18px;
}

.play-btn {
  width: 56px;
  height: 56px;
  box-shadow: 0 10px 24px rgba(96, 165, 250, 0.45);
}

.breath-tip {
  margin-top: 16px;
  font-size: 13px;
  color: #0369a1;
}
</style>
