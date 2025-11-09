"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.ConfigManager = exports.DEFAULT_CONFIG = void 0;
exports.DEFAULT_CONFIG = {
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
class ConfigManager {
    constructor(overrides = {}) {
        this.config = this.mergeConfig(exports.DEFAULT_CONFIG, overrides);
    }
    mergeConfig(base, overrides) {
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
    getConfig() {
        return this.config;
    }
    updateConfig(updates) {
        this.config = this.mergeConfig(this.config, updates);
    }
    // Helper methods for common config access
    getModeConfig(mode) {
        return this.config.modes[mode];
    }
    getWinnerGatingThreshold(mode) {
        return this.config.winnerGatingThresholds[mode];
    }
    getCreditsBundleConfig() {
        return this.config.credits.bundles;
    }
    getGameSettings() {
        return this.config.game;
    }
}
exports.ConfigManager = ConfigManager;
exports.config = new ConfigManager();
//# sourceMappingURL=config.js.map