<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header-inner">
        <div class="brand" @click="goHome">
          <span class="brand-dot"></span>
          <span class="brand-name">心语空间</span>
        </div>

        <nav class="nav-links">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
          >
            {{ item.label }}
          </router-link>
        </nav>

        <div class="header-right">
          <el-dropdown trigger="click" @command="onCommand">
            <div class="user-avatar">
              <el-avatar
                :size="38"
                :src="resolveAssetUrl(userStore.avatar) || defaultAvatar"
                :icon="UserFilled"
                class="avatar-ring"
              />
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  <span>个人资料</span>
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="userStore.role === 'ADMIN'"
                  command="admin"
                >
                  <el-icon><Setting /></el-icon>
                  <span>进入管理台</span>
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  User,
  UserFilled,
  SwitchButton,
  Setting,
} from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { resolveAssetUrl } from '@/utils/request';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

onMounted(() => {
  if (userStore.token) {
    userStore.fetchProfile().catch(() => {
      // 静默忽略，失败时仍可用本地缓存显示
    });
  }
});

const defaultAvatar =
  'https://api.dicebear.com/7.x/thumbs/svg?seed=heart&backgroundColor=bae6fd,a5f3fc,dbeafe';

const navItems = [
  { path: '/', label: '首页' },
  { path: '/diary', label: '情绪日记' },
  { path: '/chat', label: 'AI 倾听者' },
  { path: '/stats', label: '情绪图谱' },
];

function isActive(path: string) {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
}

function goHome() {
  router.push('/');
}

async function onCommand(cmd: string | number) {
  if (cmd === 'profile') {
    router.push('/profile');
    return;
  }
  if (cmd === 'admin') {
    router.push('/admin');
    return;
  }
  if (cmd === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '退出',
        cancelButtonText: '再想想',
        type: 'info',
      });
    } catch {
      return;
    }
    userStore.logout();
    ElMessage.success('已退出登录');
    router.push('/login');
  }
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdfa 100%);
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: saturate(180%) blur(18px);
  -webkit-backdrop-filter: saturate(180%) blur(18px);
  border-bottom: 1px solid rgba(186, 230, 253, 0.5);
}

.app-header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 14px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: #1e3a8a;
  font-weight: 600;
  flex-shrink: 0;
}

.brand-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #60a5fa, #22d3ee);
  box-shadow: 0 0 12px rgba(96, 165, 250, 0.6);
}

.brand-name {
  font-size: 18px;
  letter-spacing: 1px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: center;
}

.nav-item {
  position: relative;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 14px;
  color: var(--healing-muted);
  transition: all 0.2s ease;
}

.nav-item:hover {
  color: var(--healing-primary-active);
  background: rgba(186, 230, 253, 0.35);
}

.nav-item.active {
  color: #ffffff;
  background: linear-gradient(135deg, #60a5fa, #22d3ee);
  box-shadow: 0 6px 16px rgba(96, 165, 250, 0.35);
}

.header-right {
  flex-shrink: 0;
}

.user-avatar {
  cursor: pointer;
  padding: 2px;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.user-avatar:hover {
  transform: scale(1.05);
}

.avatar-ring {
  border: 2px solid #ffffff;
  box-shadow: 0 4px 14px rgba(96, 165, 250, 0.35);
  background: linear-gradient(135deg, #bae6fd, #a5f3fc);
  color: #ffffff;
}

.app-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 32px 48px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .app-header-inner {
    padding: 12px 16px;
    gap: 12px;
  }

  .nav-links {
    gap: 2px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .nav-links::-webkit-scrollbar {
    display: none;
  }

  .nav-item {
    padding: 6px 10px;
    font-size: 13px;
    white-space: nowrap;
  }

  .app-main {
    padding: 16px;
  }
}
</style>
