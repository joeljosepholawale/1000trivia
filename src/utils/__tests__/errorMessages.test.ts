import { getErrorMessage, ERROR_MESSAGES } from '../errorMessages';

describe('Error Messages Utility', () => {
  describe('ERROR_MESSAGES constant', () => {
    it('should have all common error codes', () => {
      expect(ERROR_MESSAGES).toHaveProperty('UNAUTHORIZED');
      expect(ERROR_MESSAGES).toHaveProperty('FORBIDDEN');
      expect(ERROR_MESSAGES).toHaveProperty('NOT_FOUND');
      expect(ERROR_MESSAGES).toHaveProperty('VALIDATION_ERROR');
      expect(ERROR_MESSAGES).toHaveProperty('NETWORK_ERROR');
      expect(ERROR_MESSAGES).toHaveProperty('SERVER_ERROR');
    });

    it('should have German localized error messages', () => {
      expect(ERROR_MESSAGES.UNAUTHORIZED).toContain('Authentifizierung');
      expect(ERROR_MESSAGES.NETWORK_ERROR).toContain('Internetverbindung');
    });

    it('should return string messages for all codes', () => {
      Object.values(ERROR_MESSAGES).forEach((message) => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getErrorMessage function', () => {
    it('should return default message for unknown error', () => {
      const error = new Error('Unknown error');
      const message = getErrorMessage(error);

      expect(message).toBeDefined();
      expect(typeof message).toBe('string');
    });

    it('should handle string errors', () => {
      const message = getErrorMessage('Some error message');

      expect(message).toBe('Some error message');
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      const message = getErrorMessage(error);

      expect(message).toContain('Test error');
    });

    it('should return fallback message if provided', () => {
      const fallback = 'Custom fallback message';
      const message = getErrorMessage(null, fallback);

      expect(message).toBe(fallback);
    });

    it('should handle null error', () => {
      const fallback = 'Default message';
      const message = getErrorMessage(null, fallback);

      expect(message).toBe(fallback);
    });

    it('should handle undefined error', () => {
      const fallback = 'Fallback for undefined';
      const message = getErrorMessage(undefined, fallback);

      expect(message).toBe(fallback);
    });

    it('should extract message from error object', () => {
      const error = {
        message: 'Specific error message',
        code: 'ERROR_CODE',
      };
      const message = getErrorMessage(error);

      expect(message).toContain('Specific error message');
    });

    it('should handle errors with response data', () => {
      const error = {
        response: {
          data: {
            error: {
              message: 'API error message',
            },
          },
        },
      };
      const message = getErrorMessage(error);

      expect(typeof message).toBe('string');
    });
  });

  describe('Common error scenarios', () => {
    it('should handle network errors', () => {
      const error = new Error('Network error');
      const message = getErrorMessage(error);

      expect(message).toBeDefined();
    });

    it('should handle validation errors', () => {
      const error = new Error('VALIDATION_ERROR');
      const message = getErrorMessage(error);

      expect(message).toBeDefined();
    });

    it('should handle authentication errors', () => {
      const error = new Error('UNAUTHORIZED');
      const message = getErrorMessage(error);

      expect(message).toBeDefined();
    });

    it('should handle server errors', () => {
      const error = new Error('SERVER_ERROR');
      const message = getErrorMessage(error);

      expect(message).toBeDefined();
    });

    it('should handle timeout errors', () => {
      const error = new Error('TIMEOUT_ERROR');
      const message = getErrorMessage(error);

      expect(message).toBeDefined();
    });
  });
});
