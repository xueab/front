import request from '@/utils/request';
import type {
  ApiResponse,
  MoodRange,
  MoodTrendVO,
  MoodSummaryVO,
  MoodInsightVO,
} from '@/types/api';

const BASE = '/api/mood';

/**
 * 情绪趋势
 * GET /api/mood/trend?range=7|14|30
 */
export function getMoodTrend(range: MoodRange) {
  return request.get<ApiResponse<MoodTrendVO>, ApiResponse<MoodTrendVO>>(
    `${BASE}/trend`,
    { params: { range } },
  );
}

/**
 * 情绪摘要：平均 / 最高 / 最低 / 记录天数
 * GET /api/mood/summary?range=7|14|30
 */
export function getMoodSummary(range: MoodRange) {
  return request.get<ApiResponse<MoodSummaryVO>, ApiResponse<MoodSummaryVO>>(
    `${BASE}/summary`,
    { params: { range } },
  );
}

/**
 * 情绪小洞察
 * GET /api/mood/insights?range=7|14|30
 */
export function getMoodInsights(range: MoodRange) {
  return request.get<ApiResponse<MoodInsightVO>, ApiResponse<MoodInsightVO>>(
    `${BASE}/insights`,
    { params: { range } },
  );
}
