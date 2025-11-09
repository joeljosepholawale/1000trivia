"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessAdRewardSchema = exports.ClaimDailyCreditsSchema = exports.SubmitAnswerSchema = exports.CreateSessionSchema = exports.OTPSchema = exports.PasswordSchema = exports.EmailSchema = void 0;
const zod_1 = require("zod");
// Validation Schemas using Zod
exports.EmailSchema = zod_1.z.string().email();
exports.PasswordSchema = zod_1.z.string().min(8);
exports.OTPSchema = zod_1.z.string().length(6);
exports.CreateSessionSchema = zod_1.z.object({
    periodId: zod_1.z.string().uuid(),
    deviceInfo: zod_1.z.string().optional(),
});
exports.SubmitAnswerSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid(),
    questionId: zod_1.z.string().uuid(),
    selectedAnswer: zod_1.z.string().optional(),
    responseTime: zod_1.z.number().positive(),
    isSkipped: zod_1.z.boolean().default(false),
});
exports.ClaimDailyCreditsSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
});
exports.ProcessAdRewardSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    adUnitId: zod_1.z.string(),
    rewardValue: zod_1.z.number().positive(),
});
//# sourceMappingURL=types.js.map