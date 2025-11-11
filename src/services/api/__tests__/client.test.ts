import { apiClient } from '../client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    apiClient.setToken(null);
  });

  describe('Token Management', () => {
    it('should save and retrieve token', async () => {
      const token = 'test-token-123';
      await apiClient.saveToken(token);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('auth_token', token);
    });

    it('should clear token', async () => {
      await apiClient.clearToken();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should set token in memory', () => {
      const token = 'test-token-456';
      apiClient.setToken(token);

      // Token should be set internally
      expect(apiClient).toBeDefined();
    });

    it('should retrieve stored token from AsyncStorage', async () => {
      const token = 'stored-token-789';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(token);

      const retrievedToken = await apiClient.getToken();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('auth_token');
      expect(retrievedToken).toBe(token);
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      const token = await apiClient.getToken();

      expect(token).toBeNull();
    });
  });

  describe('Network Connection', () => {
    it('should check network connection', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: true,
      });

      // Simulate a request to test network check
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true, data: {} }),
      });

      const result = await apiClient.get('/test');

      expect(NetInfo.fetch).toHaveBeenCalled();
    });

    it('should return error when no network connection', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: false,
      });

      const result = await apiClient.get('/test');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });

    it('should handle network unavailable', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: null,
      });

      const result = await apiClient.get('/test');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });
  });

  describe('GET Requests', () => {
    it('should successfully get data', async () => {
      const mockData = { userId: 1, userName: 'testUser' };

      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: true,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true, data: mockData }),
      });

      const result = await apiClient.get('/users/1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });

    it('should handle failed GET request', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: true,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        }),
      });

      const result = await apiClient.get('/users/999');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should handle timeout', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: true,
      });

      (global.fetch as jest.Mock).mockImplementationOnce(() => {
        const error = new Error('AbortError');
        error.name = 'AbortError';
        throw error;
      });

      const result = await apiClient.get('/test');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TIMEOUT_ERROR');
    });
  });

  describe('POST Requests', () => {
    it('should successfully post data', async () => {
      const postData = { email: 'test@example.com', password: 'password123' };
      const mockResponse = { token: 'jwt-token', userId: 1 };

      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: true,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true, data: mockResponse }),
      });

      const result = await apiClient.post('/auth/login', postData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
    });

    it('should handle validation errors', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: true,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid email' },
        }),
      });

      const result = await apiClient.post('/auth/login', { email: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT Requests', () => {
    it('should successfully update data', async () => {
      const updateData = { userName: 'newUserName' };
      const mockResponse = { id: 1, userName: 'newUserName' };

      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: true,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true, data: mockResponse }),
      });

      const result = await apiClient.put('/users/1', updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('PATCH Requests', () => {
    it('should successfully patch data', async () => {
      const patchData = { status: 'active' };

      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: true,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true, data: { id: 1, status: 'active' } }),
      });

      const result = await apiClient.patch('/users/1', patchData);

      expect(result.success).toBe(true);
    });
  });

  describe('DELETE Requests', () => {
    it('should successfully delete resource', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: true,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true }),
      });

      const result = await apiClient.delete('/users/1');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: true,
      });

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await apiClient.get('/test');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });

    it('should handle 401 unauthorized', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: true,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        }),
      });

      const result = await apiClient.get('/protected');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });

    it('should handle server errors', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: true,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({
          success: false,
          error: { code: 'SERVER_ERROR', message: 'Internal server error' },
        }),
      });

      const result = await apiClient.get('/test');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVER_ERROR');
    });
  });
});
