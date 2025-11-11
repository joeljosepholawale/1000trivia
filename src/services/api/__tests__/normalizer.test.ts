import { normalizeResponse } from '../normalizer';

describe('normalizeResponse', () => {
  it('should convert snake_case keys to camelCase', () => {
    const input = {
      user_id: 1,
      user_name: 'John',
      created_at: '2025-01-01',
    };

    const result = normalizeResponse(input);

    expect(result).toEqual({
      userId: 1,
      userName: 'John',
      createdAt: '2025-01-01',
    });
  });

  it('should handle nested objects', () => {
    const input = {
      user_id: 1,
      user_profile: {
        profile_picture_url: 'https://example.com/pic.jpg',
        first_name: 'John',
        last_name: 'Doe',
      },
    };

    const result = normalizeResponse(input);

    expect(result).toEqual({
      userId: 1,
      userProfile: {
        profilePictureUrl: 'https://example.com/pic.jpg',
        firstName: 'John',
        lastName: 'Doe',
      },
    });
  });

  it('should handle arrays of objects', () => {
    const input = {
      users: [
        { user_id: 1, user_name: 'John' },
        { user_id: 2, user_name: 'Jane' },
      ],
    };

    const result = normalizeResponse(input);

    expect(result).toEqual({
      users: [
        { userId: 1, userName: 'John' },
        { userId: 2, userName: 'Jane' },
      ],
    });
  });

  it('should handle deeply nested structures', () => {
    const input = {
      user_data: {
        profile: {
          settings: {
            notification_enabled: true,
            two_factor_auth: false,
          },
        },
      },
    };

    const result = normalizeResponse(input);

    expect(result).toEqual({
      userData: {
        profile: {
          settings: {
            notificationEnabled: true,
            twoFactorAuth: false,
          },
        },
      },
    });
  });

  it('should handle arrays at root level', () => {
    const input = [
      { user_id: 1, user_name: 'John' },
      { user_id: 2, user_name: 'Jane' },
    ];

    const result = normalizeResponse(input);

    expect(result).toEqual([
      { userId: 1, userName: 'John' },
      { userId: 2, userName: 'Jane' },
    ]);
  });

  it('should handle mixed arrays and objects', () => {
    const input = {
      users: [
        {
          user_id: 1,
          user_data: {
            created_at: '2025-01-01',
            updated_at: '2025-01-02',
          },
        },
      ],
    };

    const result = normalizeResponse(input);

    expect(result).toEqual({
      users: [
        {
          userId: 1,
          userData: {
            createdAt: '2025-01-01',
            updatedAt: '2025-01-02',
          },
        },
      ],
    });
  });

  it('should preserve primitive values', () => {
    const input = {
      user_id: 1,
      is_active: true,
      balance: 100.50,
      notes: 'Some notes',
    };

    const result = normalizeResponse(input);

    expect(result.userId).toBe(1);
    expect(result.isActive).toBe(true);
    expect(result.balance).toBe(100.50);
    expect(result.notes).toBe('Some notes');
  });

  it('should handle null values', () => {
    const input = {
      user_id: 1,
      avatar_url: null,
      phone_number: null,
    };

    const result = normalizeResponse(input);

    expect(result).toEqual({
      userId: 1,
      avatarUrl: null,
      phoneNumber: null,
    });
  });

  it('should handle undefined values', () => {
    const input = {
      user_id: 1,
      avatar_url: undefined,
      phone_number: undefined,
    };

    const result = normalizeResponse(input);

    expect(result).toEqual({
      userId: 1,
      avatarUrl: undefined,
      phoneNumber: undefined,
    });
  });

  it('should handle empty objects', () => {
    const input = {};

    const result = normalizeResponse(input);

    expect(result).toEqual({});
  });

  it('should handle empty arrays', () => {
    const input = {
      users: [],
    };

    const result = normalizeResponse(input);

    expect(result).toEqual({
      users: [],
    });
  });

  it('should not normalize non-snake_case keys', () => {
    const input = {
      userId: 1,
      userName: 'John',
    };

    const result = normalizeResponse(input);

    expect(result).toEqual({
      userId: 1,
      userName: 'John',
    });
  });

  it('should handle keys with consecutive underscores', () => {
    const input = {
      user__id: 1,
      api__key: 'secret',
    };

    const result = normalizeResponse(input);

    expect(result).toEqual({
      user_Id: 1,
      api_Key: 'secret',
    });
  });

  it('should handle number and boolean values', () => {
    const input = {
      total_count: 42,
      is_verified: true,
      error_code: 0,
    };

    const result = normalizeResponse(input);

    expect(result).toEqual({
      totalCount: 42,
      isVerified: true,
      errorCode: 0,
    });
  });

  it('should handle complex real-world API response', () => {
    const input = {
      success: true,
      data: {
        user_id: 123,
        user_email: 'user@example.com',
        user_profile: {
          first_name: 'John',
          last_name: 'Doe',
          profile_picture_url: 'https://example.com/pic.jpg',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
        game_stats: {
          total_games_played: 50,
          total_games_won: 30,
          average_score: 85.5,
          win_percentage: 60,
        },
        recent_transactions: [
          {
            transaction_id: 'txn_123',
            transaction_type: 'credit',
            transaction_amount: 100,
            created_at: '2025-01-02',
          },
          {
            transaction_id: 'txn_124',
            transaction_type: 'debit',
            transaction_amount: 50,
            created_at: '2025-01-01',
          },
        ],
      },
    };

    const result = normalizeResponse(input);

    expect(result).toEqual({
      success: true,
      data: {
        userId: 123,
        userEmail: 'user@example.com',
        userProfile: {
          firstName: 'John',
          lastName: 'Doe',
          profilePictureUrl: 'https://example.com/pic.jpg',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
        gameStats: {
          totalGamesPlayed: 50,
          totalGamesWon: 30,
          averageScore: 85.5,
          winPercentage: 60,
        },
        recentTransactions: [
          {
            transactionId: 'txn_123',
            transactionType: 'credit',
            transactionAmount: 100,
            createdAt: '2025-01-02',
          },
          {
            transactionId: 'txn_124',
            transactionType: 'debit',
            transactionAmount: 50,
            createdAt: '2025-01-01',
          },
        ],
      },
    });
  });

  it('should handle scalar values', () => {
    expect(normalizeResponse('string')).toBe('string');
    expect(normalizeResponse(123)).toBe(123);
    expect(normalizeResponse(true)).toBe(true);
    expect(normalizeResponse(null)).toBe(null);
  });
});
