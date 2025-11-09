import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {config} from '@/config';
import type {ApiResponse} from '@1000ravier/shared';

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private token: string | null = null;
  private refreshingToken: Promise<string | null> | null = null;

  constructor() {
    this.baseURL = config.api.baseUrl;
    this.timeout = config.api.timeout;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  async getToken(): Promise<string | null> {
    if (this.token) {
      return this.token;
    }
    
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      this.token = storedToken;
      return storedToken;
    } catch {
      return null;
    }
  }

  async saveToken(token: string): Promise<void> {
    this.token = token;
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  }

  async clearToken(): Promise<void> {
    this.token = null;
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    // If already refreshing, wait for that promise
    if (this.refreshingToken) {
      return this.refreshingToken;
    }

    this.refreshingToken = (async () => {
      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (!refreshToken) {
          return null;
        }

        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          // Refresh token is invalid, clear everything
          await this.clearToken();
          await AsyncStorage.removeItem('refresh_token');
          return null;
        }

        const data = await response.json();
        if (data.success && data.data?.accessToken) {
          const newToken = data.data.accessToken;
          await this.saveToken(newToken);
          return newToken;
        }

        return null;
      } catch (error) {
        console.error('Failed to refresh token:', error);
        return null;
      } finally {
        this.refreshingToken = null;
      }
    })();

    return this.refreshingToken;
  }

  private async checkNetworkConnection(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Check network connection
    const isConnected = await this.checkNetworkConnection();
    if (!isConnected) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'No internet connection available'
        }
      };
    }

    try {
      const token = await this.getToken();
      const url = `${this.baseURL}${endpoint}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const requestOptions: RequestInit = {
        method,
        headers,
        signal: controller.signal,
        ...options,
      };

      if (data && method !== 'GET') {
        requestOptions.body = JSON.stringify(data);
      }

      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      let responseData: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        // Handle 401 specifically for token refresh
        if (response.status === 401 && endpoint !== '/auth/refresh') {
          // Try to refresh the token
          const newToken = await this.refreshAccessToken();
          
          if (newToken) {
            // Retry the request with the new token
            headers.Authorization = `Bearer ${newToken}`;
            const retryResponse = await fetch(url, {
              ...requestOptions,
              headers,
            });
            
            const retryContentType = retryResponse.headers.get('content-type');
            let retryData: any;
            
            if (retryContentType?.includes('application/json')) {
              retryData = await retryResponse.json();
            } else {
              retryData = await retryResponse.text();
            }
            
            if (retryResponse.ok) {
              return retryData;
            }
            
            // If retry also fails, return the error
            return {
              success: false,
              error: {
                code: retryData?.error?.code || `HTTP_${retryResponse.status}`,
                message: retryData?.error?.message || `Request failed with status ${retryResponse.status}`
              }
            };
          }
          
          // Refresh failed, user needs to log in again
          await this.clearToken();
          return {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required'
            }
          };
        }

        return {
          success: false,
          error: {
            code: responseData?.error?.code || `HTTP_${response.status}`,
            message: responseData?.error?.message || `Request failed with status ${response.status}`
          }
        };
      }

      return responseData;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT_ERROR',
            message: 'Request timed out'
          }
        };
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network request failed'
        }
      };
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, options);
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }
}

export const apiClient = new ApiClient();
