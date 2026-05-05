import request from '@/utils/request';
import type { ApiResponse, MoodTagVO } from '@/types/api';

const BASE = '/api/mood-tags';

export function listMoodTags() {
  return request.get<ApiResponse<MoodTagVO[]>, ApiResponse<MoodTagVO[]>>(BASE);
}

export function createMoodTag(data: { name: string; color?: string }) {
  return request.post<ApiResponse<MoodTagVO>, ApiResponse<MoodTagVO>>(
    BASE,
    data,
  );
}

export function updateMoodTag(
  id: number,
  data: { name: string; color?: string },
) {
  return request.put<ApiResponse<MoodTagVO>, ApiResponse<MoodTagVO>>(
    `${BASE}/${id}`,
    data,
  );
}

export function deleteMoodTag(id: number) {
  return request.delete<ApiResponse<string>, ApiResponse<string>>(
    `${BASE}/${id}`,
  );
}
