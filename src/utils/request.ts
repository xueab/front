import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { ElMessage } from 'element-plus';
import type { ApiResponse } from '@/types/api';

const TOKEN_KEY = 'token';

export const API_BASE_URL = 'http://localhost:8080';

/**
 * 把后端返回的相对静态资源地址（如 /uploads/avatar/xxx.png）
 * 补齐成可访问的完整 URL。
 * - 已经是 http(s) 或 data: 开头的直接返回
 * - 为空或 null 返回空字符串
 */
export function resolveAssetUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) {
    return url;
  }
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${path}`;
}

const request: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data;

    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code === 200) {
        return res as any;
      }

      if (res.code === 401) {
        localStorage.removeItem(TOKEN_KEY);
        ElMessage.error(res.msg || '登录已过期，请重新登录');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(new Error(res.msg || 'Unauthorized'));
      }

      ElMessage.error(res.msg || '请求失败');
      return Promise.reject(new Error(res.msg || 'Error'));
    }

    return response.data as any;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      ElMessage.error('登录已过期，请重新登录');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else {
      const msg =
        error.response?.data?.msg ||
        error.message ||
        '网络异常，请稍后重试';
      ElMessage.error(msg);
    }
    return Promise.reject(error);
  },
);

export default request;

export type RequestConfig = AxiosRequestConfig;
