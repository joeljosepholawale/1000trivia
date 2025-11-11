import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').transform(v => v.trim()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const gameJoinSchema = z.object({
  gameMode: z.enum(['free', 'challenge', 'tournament', 'super_tournament'], { errorMap: () => ({ message: 'Invalid game mode' }) }),
  entryFee: z.number().min(0, 'Entry fee cannot be negative'),
});

export const answerSubmissionSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  selectedAnswerId: z.string().min(1, 'Please select an answer'),
  timeSpent: z.number().min(0, 'Time spent cannot be negative'),
});

export const topupSchema = z.object({
  amount: z.number().min(500, 'Minimum topup is 500').max(500000, 'Maximum topup is 500000'),
  paymentMethod: z.enum(['card', 'paypal', 'bank_transfer']),
});

export const withdrawalSchema = z.object({
  amount: z.number().min(101, 'Minimum withdrawal is 101'),
  bankAccount: z.string().min(10, 'Bank account must be at least 10 characters').transform(v => v.trim()),
});
