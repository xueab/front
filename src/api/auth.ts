import request from '@/utils/request';
import type {
  ApiResponse,
  SendCodeRequest,
  RegisterRequest,
  LoginRequest,
  LoginResponseData,
  ResetPasswordRequest,
} from '@/types/api';

export function sendCode(data: SendCodeRequest) {
  return request.post<ApiResponse<string>, ApiResponse<string>>(
    '/api/auth/code',
    data,
  );
}

export function register(data: RegisterRequest) {
  return request.post<ApiResponse<string>, ApiResponse<string>>(
    '/api/auth/register',
    data,
  );
}

export function login(data: LoginRequest) {
  return request.post<
    ApiResponse<LoginResponseData>,
    ApiResponse<LoginResponseData>
  >('/api/auth/login', data);
}

export function resetPassword(data: ResetPasswordRequest) {
  return request.post<ApiResponse<string>, ApiResponse<string>>(
    '/api/auth/reset-password',
    data,
  );
}
