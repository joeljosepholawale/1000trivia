import {apiClient} from './client';
import type {ApiResponse, AppConfig, GameMode, Period} from '@1000ravier/shared';

export interface CreditsConfig {
  dailyClaimAmount: number;
  adRewardAmount: number;
  bundles: Array<{
    id: string;
    credits: number;
    priceNgn: number;
    popular?: boolean;
  }>;
}

export const configAPI = {
  // Get app configuration
  getAppConfig: async (): Promise<ApiResponse<AppConfig>> => {
    return apiClient.get<AppConfig>('/config/app');
  },

  // Get available game modes
  getGameModes: async (): Promise<ApiResponse<GameMode[]>> => {
    return apiClient.get<GameMode[]>('/config/game-modes');
  },

  // Get active periods/competitions
  getActivePeriods: async (): Promise<ApiResponse<Period[]>> => {
    return apiClient.get<Period[]>('/config/periods/active');
  },

  // Get credits configuration
  getCreditsConfig: async (): Promise<ApiResponse<CreditsConfig>> => {
    return apiClient.get<CreditsConfig>('/config/credits');
  },

  // Get app settings/features flags
  getAppSettings: async (): Promise<ApiResponse<{
    featuresEnabled: string[];
    maintenanceMode: boolean;
    forceUpdateVersion?: string;
    announcements?: Array<{
      id: string;
      title: string;
      message: string;
      type: 'info' | 'warning' | 'error';
      dismissible: boolean;
    }>;
  }>> => {
    return apiClient.get('/config/settings');
  },

  // Get supported languages
  getLanguages: async (): Promise<ApiResponse<Array<{
    code: string;
    name: string;
    nativeName: string;
    flag?: string;
  }>>> => {
    return apiClient.get('/config/languages');
  },

  // Get app version info
  getVersionInfo: async (): Promise<ApiResponse<{
    currentVersion: string;
    minimumVersion: string;
    latestVersion: string;
    updateRequired: boolean;
    updateUrl?: string;
    releaseNotes?: string;
  }>> => {
    return apiClient.get('/config/version');
  },

  // Get terms and privacy policy URLs
  getLegalInfo: async (): Promise<ApiResponse<{
    termsOfServiceUrl: string;
    privacyPolicyUrl: string;
    supportEmail: string;
    supportUrl?: string;
  }>> => {
    return apiClient.get('/config/legal');
  },
};