<template>
  <div class="admin-shell">
    <aside class="admin-sider" :class="{ collapsed }">
      <div class="brand" @click="goDashboard">
        <span class="brand-dot"></span>
        <span v-if="!collapsed" class="brand-name">心语 · 管理台</span>
      </div>

      <nav class="nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <el-icon class="nav-icon">
            <component :is="item.icon" />
          </el-icon>
          <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sider-footer">
        <el-button
          plain
          circle
          size="small"
          class="collapse-btn"
          @click="collapsed = !collapsed"
        >
          <el-icon>
            <component :is="collapsed ? Expand : Fold" />
          </el-icon>
        </el-button>
      </div>
    </aside>

    <div class="admin-main">
      <header class="admin-header">
        <div class="header-left">
          <h2 class="page-name">{{ currentName }}</h2>
          <p class="page-tip">{{ currentTip }}</p>
        </div>

        <div class="header-right">
          <el-tooltip content="返回用户端" placement="bottom">
            <el-button plain round size="default" @click="backToUser">
              <el-icon><HomeFilled /></el-icon>
              <span>用户端</span>
            </el-button>
          </el-tooltip>

          <el-dropdown trigger="click" @command="onCommand">
            <div class="user-avatar">
              <el-avatar
                :size="38"
                :src="resolveAssetUrl(userStore.avatar) || defaultAvatar"
                :icon="UserFilled"
                class="avatar-ring"
              />
              <div class="user-meta">
                <div class="nick">{{ userStore.nickname || '管理员' }}</div>
                <div class="role">
                  <el-tag size="small" type="primary" effect="light" round>
                    管理员
                  </el-tag>
                </div>
              </div>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  <span>个人资料</span>
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <section class="admin-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </section>
    </div>

    <el-dialog
      v-model="reindex.visible.value"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      width="420px"
      align-center
      class="reindex-dialog"
      append-to-body
    >
      <div class="reindex-content">
        <div class="reindex-spinner">
          <el-icon class="spin-icon"><Loading /></el-icon>
        </div>
        <h3 class="reindex-title">知识索引正在重建</h3>
        <p class="reindex-desc">
          这个过程通常需要几十秒到几分钟，请耐心等待，不要关闭或刷新页面。
        </p>
        <el-progress
          :percentage="100"
          :indeterminate="true"
          :duration="3"
          :show-text="false"
          status="success"
          class="reindex-progress"
        />
        <div class="reindex-elapsed">
          <el-icon><Clock /></el-icon>
          <span>已用时 {{ formatElapsed(reindex.elapsed.value) }}</span>
        </div>
        <div class="reindex-tip">☁️ 完成后会自动通知你</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  User,
  UserFilled,
  SwitchButton,
  HomeFilled,
  DataAnalysis,
  Avatar,
  Reading,
  ChatLineSquare,
  Warning,
  Fold,
  Expand,
  Loading,
  Clock,
} from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { resolveAssetUrl } from '@/utils/request';
import { useReindex } from '@/composables/useReindex';

const reindex = useReindex();

function formatElapsed(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s} 秒`;
  return `${m} 分 ${s.toString().padStart(2, '0')} 秒`;
}

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const collapsed = ref(false);

onMounted(() => {
  if (userStore.token) {
    userStore.fetchProfile().catch(() => {
      // 静默忽略
    });
  }
});

const defaultAvatar =
  'https://api.dicebear.com/7.x/thumbs/svg?seed=admin&backgroundColor=bae6fd,a5f3fc,dbeafe';

const navItems = [
  { path: '/admin', label: '控制台', icon: DataAnalysis, tip: '系统总览，洞察用户与心情温度' },
  { path: '/admin/users', label: '用户管理', icon: Avatar, tip: '管理账号、角色与状态' },
  { path: '/admin/risk-users', label: '高风险用户', icon: Warning, tip: '关注那些状态不太好的小伙伴' },
  { path: '/admin/knowledge', label: '知识文档', icon: Reading, tip: '维护 RAG 知识库内容' },
  { path: '/admin/quotes', label: '励志短句', icon: ChatLineSquare, tip: '管理首页温柔的小句子' },
];

function isActive(path: string) {
  if (path === '/admin') return route.path === '/admin' || route.path === '/admin/';
  return route.path.startsWith(path);
}

const currentNav = computed(() =>
  navItems.find((item) => isActive(item.path)) ?? navItems[0],
);

const currentName = computed(() => currentNav.value.label);
const currentTip = computed(() => currentNav.value.tip);

function goDashboard() {
  router.push('/admin');
}

function backToUser() {
  router.push('/');
}

async function onCommand(cmd: string | number) {
  if (cmd === 'profile') {
    router.push('/profile');
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
.admin-shell {
  min-height: 100vh;
  width: 100%;
  display: flex;
  background: linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdfa 100%);
}

.admin-sider {
  width: 220px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: saturate(180%) blur(18px);
  -webkit-backdrop-filter: saturate(180%) blur(18px);
  border-right: 1px solid rgba(186, 230, 253, 0.5);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  transition: width 0.25s ease;
  z-index: 10;
}

.admin-sider.collapsed {
  width: 72px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 22px 20px 18px;
  cursor: pointer;
  color: #1e3a8a;
  font-weight: 600;
  border-bottom: 1px solid rgba(186, 230, 253, 0.4);
}

.brand-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #60a5fa, #22d3ee);
  box-shadow: 0 0 12px rgba(96, 165, 250, 0.6);
  flex-shrink: 0;
}

.brand-name {
  font-size: 16px;
  letter-spacing: 1px;
  white-space: nowrap;
}

.nav {
  flex: 1;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  color: var(--healing-muted);
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
}

.nav-item:hover {
  color: var(--healing-primary-active);
  background: rgba(186, 230, 253, 0.45);
}

.nav-item.active {
  color: #ffffff;
  background: linear-gradient(135deg, #60a5fa, #22d3ee);
  box-shadow: 0 8px 18px rgba(96, 165, 250, 0.35);
}

.nav-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
}

.sider-footer {
  padding: 12px;
  display: flex;
  justify-content: center;
  border-top: 1px solid rgba(186, 230, 253, 0.4);
}

.collapse-btn {
  width: 36px;
  height: 36px;
}

.admin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.admin-header {
  position: sticky;
  top: 0;
  z-index: 9;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: saturate(180%) blur(18px);
  -webkit-backdrop-filter: saturate(180%) blur(18px);
  border-bottom: 1px solid rgba(186, 230, 253, 0.5);
  padding: 14px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.header-left {
  min-width: 0;
}

.page-name {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
  color: #1e3a8a;
}

.page-tip {
  margin: 0;
  font-size: 12px;
  color: var(--healing-muted);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.user-avatar {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 10px 4px 4px;
  border-radius: 24px;
  transition: background 0.2s ease;
}

.user-avatar:hover {
  background: rgba(186, 230, 253, 0.4);
}

.avatar-ring {
  border: 2px solid #ffffff;
  box-shadow: 0 4px 14px rgba(96, 165, 250, 0.3);
  background: linear-gradient(135deg, #bae6fd, #a5f3fc);
  color: #ffffff;
  flex-shrink: 0;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1;
}

.nick {
  font-size: 13px;
  font-weight: 500;
  color: #1e3a8a;
}

.role {
  display: flex;
}

.admin-content {
  flex: 1;
  padding: 24px 28px 36px;
  min-width: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .admin-sider {
    width: 72px;
  }
  .admin-sider .brand-name,
  .admin-sider .nav-label {
    display: none;
  }
  .user-meta {
    display: none;
  }
  .admin-content {
    padding: 16px;
  }
}

/* ============ 重建知识索引弹窗 ============ */
.reindex-dialog :deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(160deg, #ffffff 0%, #f0f9ff 100%);
}

.reindex-dialog :deep(.el-dialog__header) {
  display: none;
}

.reindex-dialog :deep(.el-dialog__body) {
  padding: 32px 28px 28px;
}

.reindex-content {
  text-align: center;
}

.reindex-spinner {
  width: 72px;
  height: 72px;
  margin: 0 auto 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #bae6fd, #a5f3fc);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px rgba(96, 165, 250, 0.35);
}

.spin-icon {
  font-size: 36px;
  color: #ffffff;
  animation: spin 1.2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.reindex-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1e3a8a;
}

.reindex-desc {
  margin: 0 0 18px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--healing-muted);
}

.reindex-progress {
  margin-bottom: 14px;
}

.reindex-elapsed {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(186, 230, 253, 0.45);
  font-size: 12px;
  color: #0369a1;
  margin-bottom: 8px;
}

.reindex-tip {
  font-size: 12px;
  color: var(--healing-muted);
}
</style>
