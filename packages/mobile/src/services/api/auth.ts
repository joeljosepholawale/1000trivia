import {apiClient} from './client';
import type {ApiResponse} from '@1000ravier/shared';

export interface LoginResponse {
  sessionId: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    email_verified: boolean;
    username?: string;
    display_name?: string;
    profile_picture_url?: string;
    language?: string;
    timezone?: string;
    created_at: string;
    updated_at?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export const authAPI = {
  register: async (email: string, password: string, username?: string): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post('/auth/register', { email, password, username });
  },

  login: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post('/auth/login', { email, password });
  },

  sendOTP: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post('/auth/email/start', { email });
  },

  verifyOTP: async (
    email: string,
    otp: string
  ): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post('/auth/email/verify', {
      email,
      otp,
    });
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> => {
    return apiClient.post('/auth/refresh', { refreshToken });
  },

  logout: async (): Promise<ApiResponse<void>> => {
    return apiClient.post('/auth/logout');
  },

  getProfile: async (): Promise<ApiResponse<AuthResponse['user']>> => {
    return apiClient.get('/auth/me');
  },
};
