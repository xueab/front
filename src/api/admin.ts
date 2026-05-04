import request from '@/utils/request';
import type {
  ApiResponse,
  AdminPageResult,
  KnowledgeDocVO,
  KnowledgeCreateRequest,
  KnowledgeUpdateRequest,
  KnowledgeReindexResult,
  AdminUserVO,
  AdminUserPageQuery,
  AdminUpdateUserRequest,
  AdminResetPasswordRequest,
  UserOverviewVO,
  RoleVO,
  MotivationalQuoteVO,
  QuotePageQuery,
  QuoteCreateRequest,
  QuoteUpdateRequest,
  RiskUserVO,
  RiskUserQuery,
  AdminPageQuery,
} from '@/types/api';

// ============== 知识文档管理 ==============
export function pageKnowledge(params: AdminPageQuery = {}) {
  return request.get<
    ApiResponse<AdminPageResult<KnowledgeDocVO>>,
    ApiResponse<AdminPageResult<KnowledgeDocVO>>
  >('/api/admin/knowledge', { params });
}

export function getKnowledge(id: string) {
  return request.get<
    ApiResponse<KnowledgeDocVO>,
    ApiResponse<KnowledgeDocVO>
  >(`/api/admin/knowledge/${encodeURIComponent(id)}`);
}

export function createKnowledge(data: KnowledgeCreateRequest) {
  return request.post<
    ApiResponse<KnowledgeDocVO>,
    ApiResponse<KnowledgeDocVO>
  >('/api/admin/knowledge', data);
}

export function updateKnowledge(id: string, data: KnowledgeUpdateRequest) {
  return request.put<
    ApiResponse<KnowledgeDocVO>,
    ApiResponse<KnowledgeDocVO>
  >(`/api/admin/knowledge/${encodeURIComponent(id)}`, data);
}

export function deleteKnowledge(id: string) {
  return request.delete<ApiResponse<string>, ApiResponse<string>>(
    `/api/admin/knowledge/${encodeURIComponent(id)}`,
  );
}

export function reindexKnowledge() {
  return request.post<
    ApiResponse<KnowledgeReindexResult>,
    ApiResponse<KnowledgeReindexResult>
  >('/api/admin/knowledge/reindex');
}

// ============== 用户管理 ==============
export function pageUsers(params: AdminUserPageQuery = {}) {
  return request.get<
    ApiResponse<AdminPageResult<AdminUserVO>>,
    ApiResponse<AdminPageResult<AdminUserVO>>
  >('/api/admin/users', { params });
}

export function getUserOverview() {
  return request.get<
    ApiResponse<UserOverviewVO>,
    ApiResponse<UserOverviewVO>
  >('/api/admin/users/overview');
}

export function getUser(userId: number) {
  return request.get<ApiResponse<AdminUserVO>, ApiResponse<AdminUserVO>>(
    `/api/admin/users/${userId}`,
  );
}

export function updateUser(userId: number, data: AdminUpdateUserRequest) {
  return request.put<ApiResponse<AdminUserVO>, ApiResponse<AdminUserVO>>(
    `/api/admin/users/${userId}`,
    data,
  );
}

export function updateUserStatus(userId: number, status: string) {
  return request.put<ApiResponse<AdminUserVO>, ApiResponse<AdminUserVO>>(
    `/api/admin/users/${userId}/status`,
    null,
    { params: { status } },
  );
}

export function resetUserPassword(userId: number, data: AdminResetPasswordRequest) {
  return request.put<ApiResponse<string>, ApiResponse<string>>(
    `/api/admin/users/${userId}/password`,
    data,
  );
}

export function deleteUser(userId: number) {
  return request.delete<ApiResponse<string>, ApiResponse<string>>(
    `/api/admin/users/${userId}`,
  );
}

export function listRoles() {
  return request.get<ApiResponse<RoleVO[]>, ApiResponse<RoleVO[]>>(
    '/api/admin/roles',
  );
}

// ============== 励志短句管理 ==============
export function pageQuotes(params: QuotePageQuery = {}) {
  return request.get<
    ApiResponse<AdminPageResult<MotivationalQuoteVO>>,
    ApiResponse<AdminPageResult<MotivationalQuoteVO>>
  >('/api/admin/quotes', { params });
}

export function getQuote(id: number) {
  return request.get<
    ApiResponse<MotivationalQuoteVO>,
    ApiResponse<MotivationalQuoteVO>
  >(`/api/admin/quotes/${id}`);
}

export function createQuote(data: QuoteCreateRequest) {
  return request.post<
    ApiResponse<MotivationalQuoteVO>,
    ApiResponse<MotivationalQuoteVO>
  >('/api/admin/quotes', data);
}

export function updateQuote(id: number, data: QuoteUpdateRequest) {
  return request.put<
    ApiResponse<MotivationalQuoteVO>,
    ApiResponse<MotivationalQuoteVO>
  >(`/api/admin/quotes/${id}`, data);
}

export function deleteQuote(id: number) {
  return request.delete<ApiResponse<string>, ApiResponse<string>>(
    `/api/admin/quotes/${id}`,
  );
}

// ============== 高风险用户 ==============
export function listRiskUsers(params: RiskUserQuery = {}) {
  return request.get<ApiResponse<RiskUserVO[]>, ApiResponse<RiskUserVO[]>>(
    '/api/admin/risk-users',
    { params },
  );
}
