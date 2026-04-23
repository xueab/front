import request from '@/utils/request';
import type {
  ApiResponse,
  UserProfileVO,
  UpdateProfileRequest,
  ChangePasswordRequest,
  UploadAvatarResponse,
} from '@/types/api';

export function getProfile() {
  return request.get<ApiResponse<UserProfileVO>, ApiResponse<UserProfileVO>>(
    '/api/user/profile',
  );
}

export function updateProfile(data: UpdateProfileRequest) {
  return request.put<ApiResponse<UserProfileVO>, ApiResponse<UserProfileVO>>(
    '/api/user/profile',
    data,
  );
}

export function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post<
    ApiResponse<UploadAvatarResponse>,
    ApiResponse<UploadAvatarResponse>
  >('/api/user/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function changePassword(data: ChangePasswordRequest) {
  return request.put<ApiResponse<string>, ApiResponse<string>>(
    '/api/user/password',
    data,
  );
}
