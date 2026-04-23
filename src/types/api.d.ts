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
