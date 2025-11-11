/**
 * Test Utilities and Mock Helpers
 * Centralized utilities for writing tests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

/**
 * Reset all mocks to default state
 */
export const resetAllMocks = () => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  (AsyncStorage.getItem as jest.Mock).mockClear();
  (AsyncStorage.setItem as jest.Mock).mockClear();
  (AsyncStorage.removeItem as jest.Mock).mockClear();
  (NetInfo.fetch as jest.Mock).mockClear();
};

/**
 * Mock successful fetch response
 */
export const mockFetchSuccess = (data: any, status = 200) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    status,
    headers: new Map([['content-type', 'application/json']]),
    json: async () => data,
    text: async () => JSON.stringify(data),
  });
};

/**
 * Mock failed fetch response
 */
export const mockFetchError = (error: any, status = 400) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status,
    headers: new Map([['content-type', 'application/json']]),
    json: async () => error,
    text: async () => JSON.stringify(error),
  });
};

/**
 * Mock network connection state
 */
export const mockNetworkConnection = (isConnected: boolean) => {
  (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
    isConnected,
  });
};

/**
 * Mock AsyncStorage getItem
 */
export const mockAsyncStorageGetItem = (key: string, value: any) => {
  (AsyncStorage.getItem as jest.Mock).mockImplementationOnce((itemKey) => {
    if (itemKey === key) {
      return Promise.resolve(value);
    }
    return Promise.resolve(null);
  });
};

/**
 * Mock token in AsyncStorage
 */
export const mockStoredToken = (token: string) => {
  mockAsyncStorageGetItem('auth_token', token);
};

/**
 * Create mock API response
 */
export const createMockApiResponse = (data: any, success = true) => ({
  success,
  data,
  error: success ? null : { code: 'ERROR', message: 'Error' },
});

/**
 * Create mock user data
 */
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  createdAt: '2025-01-01',
  ...overrides,
});

/**
 * Create mock game data
 */
export const createMockGame = (overrides = {}) => ({
  id: 'game-123',
  modeType: 'free',
  displayName: 'Free Mode',
  entryFee: 0,
  isActive: true,
  ...overrides,
});

/**
 * Create mock wallet data
 */
export const createMockWallet = (overrides = {}) => ({
  balance: 1000,
  totalEarned: 5000,
  totalSpent: 4000,
  dailyClaimStreak: 5,
  ...overrides,
});

/**
 * Create mock validation error
 */
export const createMockValidationError = (field: string, message: string) => ({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message,
    field,
  },
});

/**
 * Wait for async operations
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Create mock form data
 */
export const createMockLoginForm = (overrides = {}) => ({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  ...overrides,
});

export const createMockRegisterForm = (overrides = {}) => ({
  email: 'newuser@example.com',
  username: 'newusername',
  password: 'SecurePassword123!',
  confirmPassword: 'SecurePassword123!',
  ...overrides,
});

/**
 * Assert API was called with correct parameters
 */
export const expectApiCall = (method: string, endpoint: string) => {
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining(endpoint),
    expect.objectContaining({ method })
  );
};

/**
 * Create timeout promise for testing
 */
export const createTimeoutPromise = (ms: number) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
