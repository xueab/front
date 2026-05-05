import request from '@/utils/request';
import type {
  ApiResponse,
  ChatReportVO,
  ReportPageResult,
  ReportPageQuery,
  UpdateReportRequest,
} from '@/types/api';

const BASE = '/api/chat';

export function generateReport(sessionId: number) {
  return request.post<ApiResponse<ChatReportVO>, ApiResponse<ChatReportVO>>(
    `${BASE}/sessions/${sessionId}/report/generate`,
  );
}

export function getReportBySession(sessionId: number) {
  return request.get<ApiResponse<ChatReportVO>, ApiResponse<ChatReportVO>>(
    `${BASE}/sessions/${sessionId}/report`,
  );
}

export function getReportList(params?: ReportPageQuery) {
  return request.get<
    ApiResponse<ReportPageResult>,
    ApiResponse<ReportPageResult>
  >(`${BASE}/reports`, { params });
}

export function getReportDetail(id: number) {
  return request.get<ApiResponse<ChatReportVO>, ApiResponse<ChatReportVO>>(
    `${BASE}/reports/${id}`,
  );
}

export function updateReport(id: number, data: UpdateReportRequest) {
  return request.put<ApiResponse<ChatReportVO>, ApiResponse<ChatReportVO>>(
    `${BASE}/reports/${id}`,
    data,
  );
}

export function deleteReport(id: number) {
  return request.delete<ApiResponse<null>, ApiResponse<null>>(
    `${BASE}/reports/${id}`,
  );
}
