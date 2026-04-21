import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

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
      {
        path: 'healing',
        name: 'Healing',
        component: () => import('@/view/HealingView.vue'),
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
  const token = localStorage.getItem('token');
  if (to.matched.some((r) => r.meta.requiresAuth) && !token) {
    return { path: '/login' };
  }
  if ((to.path === '/login' || to.path === '/register') && token) {
    return { path: '/' };
  }
  return true;
});

export default router;
