import request from '@/utils/request';
import type {
  ApiResponse,
  PageResult,
  DiaryVO,
  CreateDiaryRequest,
  UpdateDiaryRequest,
  DiaryPageQuery,
  CreateDiaryResponse,
  TodayCountResponse,
} from '@/types/api';

const BASE = '/api/diary';

/**
 * 新建日记
 * POST /api/diary
 */
export function createDiary(data: CreateDiaryRequest) {
  return request.post<
    ApiResponse<CreateDiaryResponse>,
    ApiResponse<CreateDiaryResponse>
  >(BASE, data);
}

/**
 * 分页查询日记列表
 * GET /api/diary/page
 */
export function pageDiary(params: DiaryPageQuery = {}) {
  return request.get<
    ApiResponse<PageResult<DiaryVO>>,
    ApiResponse<PageResult<DiaryVO>>
  >(`${BASE}/page`, { params });
}

/**
 * 查询日记详情
 * GET /api/diary/{id}
 */
export function getDiary(id: number) {
  return request.get<ApiResponse<DiaryVO>, ApiResponse<DiaryVO>>(
    `${BASE}/${id}`,
  );
}

/**
 * 更新日记
 * PUT /api/diary/{id}
 */
export function updateDiary(id: number, data: UpdateDiaryRequest) {
  return request.put<ApiResponse<DiaryVO>, ApiResponse<DiaryVO>>(
    `${BASE}/${id}`,
    data,
  );
}

/**
 * 删除日记
 * DELETE /api/diary/{id}
 */
export function deleteDiary(id: number) {
  return request.delete<ApiResponse<string>, ApiResponse<string>>(
    `${BASE}/${id}`,
  );
}

/**
 * 今日日记数量
 * GET /api/diary/today-count
 */
export function getTodayCount() {
  return request.get<
    ApiResponse<TodayCountResponse>,
    ApiResponse<TodayCountResponse>
  >(`${BASE}/today-count`);
}

/**
 * 生成 AI 分析并写入到 diary 记录
 * POST /api/diary/{id}/ai-analysis
 */
export function generateAiAnalysis(id: number) {
  return request.post<ApiResponse<DiaryVO>, ApiResponse<DiaryVO>>(
    `${BASE}/${id}/ai-analysis`,
  );
}
