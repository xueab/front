import { defineStore } from 'pinia';
import { ref } from 'vue';
import { login as loginApi } from '@/api/auth';
import {
  getProfile as getProfileApi,
  updateProfile as updateProfileApi,
  uploadAvatar as uploadAvatarApi,
  changePassword as changePasswordApi,
} from '@/api/user';
import type {
  LoginRequest,
  LoginResponseData,
  UserProfileVO,
  ChangePasswordRequest,
} from '@/types/api';

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

  function persist() {
    persistUserInfo({
      nickname: nickname.value,
      avatar: avatar.value,
      userId: userId.value ?? 0,
      phone: phone.value,
    });
  }

  function setUserInfo(data: LoginResponseData, phoneValue?: string) {
    token.value = data.token;
    nickname.value = data.nickname;
    avatar.value = data.avatar;
    userId.value = data.userId;
    if (phoneValue !== undefined) {
      phone.value = phoneValue;
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    persist();
  }

  function applyProfile(profile: UserProfileVO) {
    nickname.value = profile.nickname ?? '';
    avatar.value = profile.avatar ?? null;
    userId.value = profile.userId;
    phone.value = profile.phone ?? '';
    persist();
  }

  async function login(payload: LoginRequest): Promise<LoginResponseData> {
    const res = await loginApi(payload);
    setUserInfo(res.data, payload.phone);
    return res.data;
  }

  async function fetchProfile(): Promise<UserProfileVO> {
    const res = await getProfileApi();
    applyProfile(res.data);
    return res.data;
  }

  async function updateProfile(payload: {
    nickname: string;
  }): Promise<UserProfileVO> {
    const res = await updateProfileApi({ nickname: payload.nickname });
    applyProfile(res.data);
    return res.data;
  }

  async function uploadAvatar(file: File): Promise<string> {
    const res = await uploadAvatarApi(file);
    avatar.value = res.data.avatar;
    persist();
    return res.data.avatar;
  }

  async function changePassword(payload: ChangePasswordRequest): Promise<void> {
    await changePasswordApi(payload);
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
    fetchProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
    logout,
  };
});
