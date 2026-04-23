export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

export interface SendCodeRequest {
  phone: string;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  code: string;
  nickname?: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface ResetPasswordRequest {
  phone: string;
  password: string;
  code: string;
}

export interface LoginResponseData {
  token: string;
  nickname: string;
  avatar: string | null;
  userId: number;
}

export interface UserProfileVO {
  userId: number;
  phone: string;
  nickname: string;
  avatar: string | null;
  createdAt: string | null;
}

export interface UpdateProfileRequest {
  nickname: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UploadAvatarResponse {
  avatar: string;
}

// ===================== 通用分页结构 =====================
// 对应后端 PageResult<T>（基于 MyBatis-Plus 分页）
export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// ===================== 情绪日记 =====================
export interface DiaryVO {
  id: number;
  // yyyy-MM-dd HH:mm
  date: string;
  content: string;
  // 情绪分值 1-10（后端字段名 score，供前端直接使用）
  score: number;
  tags: string[];
  aiAnalysis: string | null;
  createdAt: string;
}

export interface CreateDiaryRequest {
  content: string;
  moodScore: number;
  tags?: string[];
}

export interface UpdateDiaryRequest {
  content: string;
  moodScore: number;
  tags?: string[];
}

export interface DiaryPageQuery {
  page?: number;
  size?: number;
  startDate?: string;
  endDate?: string;
  minScore?: number;
  maxScore?: number;
}

export interface CreateDiaryResponse {
  diaryId: number;
}

export interface TodayCountResponse {
  count: number;
}

// ===================== 情绪统计 =====================
export type MoodRange = 7 | 14 | 30;

// 情绪趋势：dates 保留完整日期标签，scores 中无记录的天为 null
export interface MoodTrendVO {
  dates: string[];
  scores: Array<number | null>;
}

export interface MoodSummaryVO {
  average: number;
  max: number;
  min: number;
  days: number;
}

export interface MoodInsightVO {
  tips: string[];
}
