import { defineStore } from 'pinia';
import { ref } from 'vue';
import { login as loginApi } from '@/api/auth';
import type { LoginRequest, LoginResponseData } from '@/types/api';

const TOKEN_KEY = 'token';
const USER_INFO_KEY = 'userInfo';

interface StoredUserInfo {
  nickname: string;
  avatar: string | null;
  userId: number;
  phone: string;
}

function readStoredUserInfo(): StoredUserInfo | null {
  const raw = localStorage.getItem(USER_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUserInfo;
  } catch {
    return null;
  }
}

function persistUserInfo(info: StoredUserInfo) {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(info));
}

export const useUserStore = defineStore('user', () => {
  const stored = readStoredUserInfo();

  const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '');
  const nickname = ref<string>(stored?.nickname || '');
  const avatar = ref<string | null>(stored?.avatar ?? null);
  const userId = ref<number | null>(stored?.userId ?? null);
  const phone = ref<string>(stored?.phone || '');

  function setUserInfo(data: LoginResponseData, phoneValue?: string) {
    token.value = data.token;
    nickname.value = data.nickname;
    avatar.value = data.avatar;
    userId.value = data.userId;
    if (phoneValue !== undefined) {
      phone.value = phoneValue;
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    persistUserInfo({
      nickname: data.nickname,
      avatar: data.avatar,
      userId: data.userId,
      phone: phone.value,
    });
  }

  async function login(payload: LoginRequest): Promise<LoginResponseData> {
    const res = await loginApi(payload);
    setUserInfo(res.data, payload.phone);
    return res.data;
  }

  function updateProfile(payload: {
    nickname?: string;
    avatar?: string | null;
  }) {
    if (payload.nickname !== undefined) {
      nickname.value = payload.nickname;
    }
    if (payload.avatar !== undefined) {
      avatar.value = payload.avatar;
    }
    persistUserInfo({
      nickname: nickname.value,
      avatar: avatar.value,
      userId: userId.value ?? 0,
      phone: phone.value,
    });
  }

  function logout() {
    token.value = '';
    nickname.value = '';
    avatar.value = null;
    userId.value = null;
    phone.value = '';

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
  }

  return {
    token,
    nickname,
    avatar,
    userId,
    phone,
    setUserInfo,
    login,
    updateProfile,
    logout,
  };
});
