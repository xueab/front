import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { ElMessage } from 'element-plus';

const TOKEN_KEY = 'token';
const USER_INFO_KEY = 'userInfo';

function readStoredRole(): string | null {
  const raw = localStorage.getItem(USER_INFO_KEY);
  if (!raw) return null;
  try {
    const info = JSON.parse(raw) as { role?: string | null };
    return info.role ?? null;
  } catch {
    return null;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/components/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/view/Home.vue'),
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/view/Profile.vue'),
      },
      {
        path: 'diary',
        name: 'Diary',
        component: () => import('@/view/DiaryView.vue'),
      },
      {
        path: 'chat',
        name: 'Chat',
        component: () => import('@/view/ChatView.vue'),
      },
      {
        path: 'stats',
        name: 'MoodStats',
        component: () => import('@/view/MoodStats.vue'),
      },
    ],
  },
  {
    path: '/admin',
    component: () => import('@/components/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/view/admin/AdminDashboard.vue'),
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/view/admin/UserManage.vue'),
      },
      {
        path: 'risk-users',
        name: 'AdminRiskUsers',
        component: () => import('@/view/admin/RiskUsers.vue'),
      },
      {
        path: 'knowledge',
        name: 'AdminKnowledge',
        component: () => import('@/view/admin/KnowledgeManage.vue'),
      },
      {
        path: 'quotes',
        name: 'AdminQuotes',
        component: () => import('@/view/admin/QuoteManage.vue'),
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/view/Login.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/view/Register.vue'),
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/view/ResetPassword.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (to.matched.some((r) => r.meta.requiresAuth) && !token) {
    return { path: '/login' };
  }
  if (to.matched.some((r) => r.meta.requiresAdmin)) {
    const role = readStoredRole();
    if (role !== 'ADMIN') {
      ElMessage.warning('该页面仅管理员可访问');
      return { path: '/' };
    }
  }
  if ((to.path === '/login' || to.path === '/register') && token) {
    return { path: '/' };
  }
  return true;
});

export default router;
