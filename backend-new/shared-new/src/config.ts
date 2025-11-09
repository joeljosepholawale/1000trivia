export interface AppConfig {
  // Game Modes Configuration
  modes: {
    free: {
      name: string;
      questions: number;
      entryFee: number;
      entryFeeCurrency: 'USD' | 'CREDITS';
      payout: number;
      payoutCurrency: 'USD';
      minAnswersToQualify: number;
      periodType: 'WEEKLY' | 'MONTHLY';
      maxWinners: number;
    };
    challenge: {
      name: string;
      questions: number;
      entryFee: number;
      entryFeeCurrency: 'USD' | 'CREDITS';
      payout: number;
      payoutCurrency: 'USD';
      minAnswersToQualify: number;
      periodType: 'WEEKLY' | 'MONTHLY';
      maxWinners: number;
    };
    tournament: {
      name: string;
      questions: number;
      entryFee: number;
      entryFeeCurrency: 'USD' | 'CREDITS';
      payout: number;
      payoutCurrency: 'USD';
      minAnswersToQualify: number;
      periodType: 'WEEKLY' | 'MONTHLY';
      maxWinners: number;
    };
    superTournament: {
      name: string;
      questions: number;
      entryFee: number;
      entryFeeCurrency: 'USD' | 'CREDITS';
      payout: number;
      payoutCurrency: 'USD';
      minAnswersToQualify: number;
      periodType: 'WEEKLY' | 'MONTHLY';
      maxWinners: number;
    };
  };

  // Credits Economy
  credits: {
    dailyClaimAmount: number;
    adRewardAmount: number;
    adRewardDailyLimit: number;
    bundles: {
      bundle100: {
        price: number;
        credits: number;
      };
      bundle1000: {
        price: number;
        credits: number;
      };
    };
  };

  // Winner Display Gating Thresholds (in NGN)
  winnerGatingThresholds: {
    free: number;
    challenge: number;
    tournament: number;
    superTournament: number;
  };

  // Game Settings
  game: {
    defaultQuestionTimer: number; // seconds
    questionsPerBatch: number;
    maxOfflineQuestions: number;
    maxResumeTimeMinutes: number;
  };

  // Anti-cheat Settings
  antiCheat: {
    maxSubmissionsPerMinute: number;
    suspiciousScoreThreshold: number;
    maxConcurrentSessions: number;
    deviceTrackingEnabled: boolean;
    ipTrackingEnabled: boolean;
  };

  // Payment Settings
  payments: {
    stripePublishableKey: string;
    enableTestMode: boolean;
    supportedCurrencies: string[];
    minimumPayoutAmount: number;
  };

  // App Settings
  app: {
    supportEmail: string;
    privacyPolicyUrl: string;
    termsOfServiceUrl: string;
    defaultLanguage: string;
    supportedLanguages: string[];
  };
}

export const DEFAULT_CONFIG: AppConfig = {
  modes: {
    free: {
      name: 'Free Weekly',
      questions: 1000,
      entryFee: 0,
      entryFeeCurrency: 'USD',
      payout: 100,
      payoutCurrency: 'USD',
      minAnswersToQualify: 1000,
      periodType: 'WEEKLY',
      maxWinners: 10,
    },
    challenge: {
      name: 'Challenge Monthly',
      questions: 100,
      entryFee: 10,
      entryFeeCurrency: 'USD',
      payout: 1000,
      payoutCurrency: 'USD',
      minAnswersToQualify: 100,
      periodType: 'MONTHLY',
      maxWinners: 10,
    },
    tournament: {
      name: 'Tournament Monthly',
      questions: 1000,
      entryFee: 1000,
      entryFeeCurrency: 'CREDITS',
      payout: 10000,
      payoutCurrency: 'USD',
      minAnswersToQualify: 1000,
      periodType: 'MONTHLY',
      maxWinners: 10,
    },
    superTournament: {
      name: 'Super Tournament Monthly',
      questions: 1000,
      entryFee: 10000,
      entryFeeCurrency: 'CREDITS',
      payout: 100000,
      payoutCurrency: 'USD',
      minAnswersToQualify: 1000,
      periodType: 'MONTHLY',
      maxWinners: 10,
    },
  },

  credits: {
    dailyClaimAmount: 10,
    adRewardAmount: 1,
    adRewardDailyLimit: 20,
    bundles: {
      bundle100: {
        price: 100,
        credits: 1000,
      },
      bundle1000: {
        price: 1000,
        credits: 10000,
      },
    },
  },

  winnerGatingThresholds: {
    free: 1500, // NGN
    challenge: 15000, // NGN
    tournament: 150000, // NGN
    superTournament: 1500000, // NGN
  },

  game: {
    defaultQuestionTimer: 25, // seconds
    questionsPerBatch: 10,
    maxOfflineQuestions: 50,
    maxResumeTimeMinutes: 30,
  },

  antiCheat: {
    maxSubmissionsPerMinute: 10,
    suspiciousScoreThreshold: 0.95,
    maxConcurrentSessions: 1,
    deviceTrackingEnabled: true,
    ipTrackingEnabled: true,
  },

  payments: {
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    enableTestMode: process.env.NODE_ENV !== 'production',
    supportedCurrencies: ['USD', 'NGN'],
    minimumPayoutAmount: 50, // USD
  },

  app: {
    supportEmail: 'support@1000ravier.com',
    privacyPolicyUrl: 'https://1000ravier.com/privacy',
    termsOfServiceUrl: 'https://1000ravier.com/terms',
    defaultLanguage: 'de',
    supportedLanguages: ['de', 'en'],
  },
};

// Configuration validation and override system
export class ConfigManager {
  private config: AppConfig;

  constructor(overrides: Partial<AppConfig> = {}) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, overrides);
  }

  private mergeConfig(base: AppConfig, overrides: Partial<AppConfig>): AppConfig {
    return {
      ...base,
      ...overrides,
      modes: {
        ...base.modes,
        ...overrides.modes,
      },
      credits: {
        ...base.credits,
        ...overrides.credits,
      },
      winnerGatingThresholds: {
        ...base.winnerGatingThresholds,
        ...overrides.winnerGatingThresholds,
      },
      game: {
        ...base.game,
        ...overrides.game,
      },
      antiCheat: {
        ...base.antiCheat,
        ...overrides.antiCheat,
      },
      payments: {
        ...base.payments,
        ...overrides.payments,
      },
      app: {
        ...base.app,
        ...overrides.app,
      },
    };
  }

  getConfig(): AppConfig {
    return this.config;
  }

  updateConfig(updates: Partial<AppConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
  }

  // Helper methods for common config access
  getModeConfig(mode: keyof AppConfig['modes']) {
    return this.config.modes[mode];
  }

  getWinnerGatingThreshold(mode: keyof AppConfig['winnerGatingThresholds']) {
    return this.config.winnerGatingThresholds[mode];
  }

  getCreditsBundleConfig() {
    return this.config.credits.bundles;
  }

  getGameSettings() {
    return this.config.game;
  }
}

export const config = new ConfigManager();