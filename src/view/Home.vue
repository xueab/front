<template>
  <div class="home-view">
    <section class="welcome">
      <h1 class="welcome-title">
        欢迎回来，<span class="highlight">{{ displayName }}</span>
      </h1>
      <p class="welcome-desc">
        愿你今天也能与自己温柔相处。选择一个想体验的功能，开启今天的心灵时刻吧。
      </p>
    </section>

    <section class="feature-grid">
      <el-card
        v-for="item in features"
        :key="item.title"
        class="feature-card"
        shadow="never"
        @click="router.push(item.to)"
      >
        <div class="feature-icon" :style="{ background: item.bg }">
          {{ item.emoji }}
        </div>
        <h3 class="feature-title">{{ item.title }}</h3>
        <p class="feature-desc">{{ item.desc }}</p>
      </el-card>
    </section>

    <section class="quote-card">
      <div class="quote-mark">&ldquo;</div>
      <p class="quote-text">
        允许自己有情绪，就像允许天空有云朵。它们来了又走，而你始终是你。
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const displayName = computed(() => userStore.nickname || '朋友');

const features = [
  {
    emoji: '📔',
    title: '情绪日记',
    desc: '记录每天的心情轨迹，让情绪被看见、被整理。',
    bg: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
    to: '/diary',
  },
  {
    emoji: '💬',
    title: 'AI 倾听者',
    desc: '随时找一个安静的树洞，听你把心事说完。',
    bg: 'linear-gradient(135deg, #cffafe, #a5f3fc)',
    to: '/chat',
  },
  {
    emoji: '📈',
    title: '情绪图谱',
    desc: '用图表看见你最近的情绪波动，了解自己。',
    bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
    to: '/stats',
  },
  {
    emoji: '🌿',
    title: '疗愈练习',
    desc: '几分钟的冥想与呼吸练习，为自己按下暂停键。',
    bg: 'linear-gradient(135deg, #ecfeff, #cffafe)',
    to: '/healing',
  },
];
</script>

<style scoped>
.home-view {
  max-width: 1100px;
  margin: 0 auto;
}

.welcome {
  text-align: center;
  padding: 32px 16px 24px;
}

.welcome-title {
  margin: 0 0 12px;
  font-size: 30px;
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
  max-width: 560px;
  margin: 0 auto;
  font-size: 14px;
  line-height: 1.8;
  color: var(--healing-muted);
}

.feature-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 20px;
}

.feature-card {
  border: none;
  border-radius: 16px;
  box-shadow: var(--healing-card-shadow);
  background: #ffffff;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 36px rgba(96, 165, 250, 0.18);
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 14px;
}

.feature-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1e3a8a;
}

.feature-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--healing-muted);
}

.quote-card {
  margin-top: 32px;
  padding: 28px 32px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(186, 230, 253, 0.8);
  border-radius: 18px;
  display: flex;
  align-items: flex-start;
  gap: 18px;
  box-shadow: 0 8px 24px rgba(96, 165, 250, 0.08);
}

.quote-mark {
  font-size: 48px;
  line-height: 1;
  color: #60a5fa;
  font-family: Georgia, serif;
}

.quote-text {
  margin: 0;
  padding-top: 8px;
  font-size: 15px;
  line-height: 1.8;
  color: #334155;
}

@media (max-width: 640px) {
  .welcome-title {
    font-size: 24px;
  }

  .quote-card {
    padding: 20px;
  }
}
</style>
