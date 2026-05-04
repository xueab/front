export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

export interface SendCodeRequest {
  email: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  code: string;
  nickname?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  email: string;
  password: string;
  code: string;
}

export interface LoginResponseData {
  token: string;
  nickname: string;
  avatar: string | null;
  userId: number;
  role?: string | null;
}

export interface UserProfileVO {
  userId: number;
  email: string;
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

// ===================== AI 对话 =====================
export interface ChatSessionVO {
  id: number;
  title: string;
  status: number;
  createdAt: string;
}

export interface CreateChatSessionRequest {
  title: string;
}

export interface CreateChatSessionResponse {
  sessionId: number;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessageVO {
  id: number;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface SendChatMessageRequest {
  content: string;
}

// SSE 流式事件 payload
export type ChatStreamEventType = 'delta' | 'done' | 'error';

export interface ChatStreamEvent {
  type: ChatStreamEventType;
  content?: string;
  requestId?: string;
  errorCode?: string;
  message?: string;
  retryable?: boolean;
}

// ===================== 管理员端 - 通用 =====================
// 后端 PageResult 在 admin 接口中以 records/total/page/size 返回
export interface AdminPageResult<T> {
  total: number;
  page: number;
  size: number;
  records: T[];
}

export interface AdminPageQuery {
  keyword?: string;
  page?: number;
  size?: number;
}

// ===================== 管理员端 - 知识文档 =====================
export interface KnowledgeDocVO {
  id: string;
  filename: string;
  title: string;
  size: number;
  updatedAt: string;
  content: string | null;
}

export interface KnowledgeCreateRequest {
  id: string;
  content: string;
}

export interface KnowledgeUpdateRequest {
  content: string;
}

export interface KnowledgeReindexResult {
  chunkCount: number;
}

// ===================== 管理员端 - 用户管理 =====================
export type UserStatus = 'ENABLED' | 'DISABLED';
export type UserRoleCode = 'USER' | 'ADMIN';

export interface AdminUserVO {
  userId: number;
  email: string;
  roleId: number;
  role: UserRoleCode | string;
  roleName: string;
  status: UserStatus | string;
  nickname: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserPageQuery extends AdminPageQuery {
  role?: string;
  status?: string;
}

export interface UserOverviewVO {
  total: number;
  enabled: number;
  disabled: number;
  admins: number;
}

export interface AdminUpdateUserRequest {
  role?: string;
  status?: string;
  nickname?: string;
}

export interface AdminResetPasswordRequest {
  newPassword: string;
}

export interface RoleVO {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

// ===================== 管理员端 - 励志短句 =====================
export type QuoteStatus = 'ENABLED' | 'DISABLED';

export interface MotivationalQuoteVO {
  id: number;
  content: string;
  author: string | null;
  status: QuoteStatus | string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuotePageQuery extends AdminPageQuery {
  status?: string;
}

export interface QuoteCreateRequest {
  content: string;
  author?: string | null;
  status?: string;
  sortOrder?: number;
}

export interface QuoteUpdateRequest {
  content?: string;
  author?: string | null;
  status?: string;
  sortOrder?: number;
}

// ===================== 管理员端 - 高风险用户 =====================
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface RiskUserVO {
  userId: number;
  email: string;
  nickname: string;
  avatar: string | null;
  level: RiskLevel | string;
  averageScore: number;
  minScore: number;
  diaryCount: number;
  lastDiaryAt: string;
  reason: string;
}

export interface RiskUserQuery {
  days?: 7 | 14 | 30;
  level?: string;
  limit?: number;
}
