import {
  loginSchema,
  registerSchema,
  gameJoinSchema,
  answerSubmissionSchema,
  topupSchema,
  withdrawalSchema,
} from '../schemas';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'SecurePassword123!',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'SecurePassword123!',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing email', () => {
      const invalidData = {
        password: 'SecurePassword123!',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should trim whitespace from email', () => {
      const data = {
        email: '  user@example.com  ',
        password: 'SecurePassword123!',
      };

      const result = loginSchema.safeParse(data);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'newuser@example.com',
        username: 'newusername',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        email: 'newuser@example.com',
        username: 'newusername',
        password: 'SecurePassword123!',
        confirmPassword: 'DifferentPassword123!',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'newuser@example.com',
        username: 'newusername',
        password: 'Short1!',
        confirmPassword: 'Short1!',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid username', () => {
      const invalidData = {
        email: 'newuser@example.com',
        username: 'user@name', // Invalid characters
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept valid username formats', () => {
      const validData = {
        email: 'newuser@example.com',
        username: 'user_name_123',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject username that is too short', () => {
      const invalidData = {
        email: 'newuser@example.com',
        username: 'ab', // Too short
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('gameJoinSchema', () => {
    it('should validate correct game join data', () => {
      const validData = {
        gameMode: 'free',
        entryFee: 0,
      };

      const result = gameJoinSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate all game modes', () => {
      const modes = ['free', 'challenge', 'tournament', 'super_tournament'];

      modes.forEach((mode) => {
        const data = { gameMode: mode, entryFee: 0 };
        const result = gameJoinSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid game mode', () => {
      const invalidData = {
        gameMode: 'invalid_mode',
        entryFee: 0,
      };

      const result = gameJoinSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative entry fee', () => {
      const invalidData = {
        gameMode: 'free',
        entryFee: -100,
      };

      const result = gameJoinSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('answerSubmissionSchema', () => {
    it('should validate correct answer submission', () => {
      const validData = {
        questionId: 'q123',
        selectedAnswerId: 'a456',
        timeSpent: 5000,
      };

      const result = answerSubmissionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing question ID', () => {
      const invalidData = {
        selectedAnswerId: 'a456',
        timeSpent: 5000,
      };

      const result = answerSubmissionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative time spent', () => {
      const invalidData = {
        questionId: 'q123',
        selectedAnswerId: 'a456',
        timeSpent: -1000,
      };

      const result = answerSubmissionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept zero time spent', () => {
      const validData = {
        questionId: 'q123',
        selectedAnswerId: 'a456',
        timeSpent: 0,
      };

      const result = answerSubmissionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('topupSchema', () => {
    it('should validate correct topup data', () => {
      const validData = {
        amount: 5000,
        paymentMethod: 'card',
      };

      const result = topupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject amount less than minimum', () => {
      const invalidData = {
        amount: 100,
        paymentMethod: 'card',
      };

      const result = topupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject amount more than maximum', () => {
      const invalidData = {
        amount: 1000000,
        paymentMethod: 'card',
      };

      const result = topupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative amount', () => {
      const invalidData = {
        amount: -5000,
        paymentMethod: 'card',
      };

      const result = topupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate all payment methods', () => {
      const methods = ['card', 'paypal', 'bank_transfer'];

      methods.forEach((method) => {
        const data = { amount: 5000, paymentMethod: method };
        const result = topupSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('withdrawalSchema', () => {
    it('should validate correct withdrawal data', () => {
      const validData = {
        amount: 5000,
        bankAccount: 'acc123456789',
      };

      const result = withdrawalSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject amount less than minimum', () => {
      const invalidData = {
        amount: 100,
        bankAccount: 'acc123456789',
      };

      const result = withdrawalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative amount', () => {
      const invalidData = {
        amount: -5000,
        bankAccount: 'acc123456789',
      };

      const result = withdrawalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing bank account', () => {
      const invalidData = {
        amount: 5000,
      };

      const result = withdrawalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should trim whitespace from bank account', () => {
      const data = {
        amount: 5000,
        bankAccount: '  acc123456789  ',
      };

      const result = withdrawalSchema.safeParse(data);
      if (result.success) {
        expect(result.data.bankAccount).toBe('acc123456789');
      }
    });
  });
});
