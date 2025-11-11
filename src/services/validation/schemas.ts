import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const gameJoinSchema = z.object({
  modeId: z.string().min(1, 'Game mode is required'),
});

export const answerSubmitSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  questionId: z.string().min(1, 'Question ID is required'),
  selectedOptionId: z.string().min(1, 'Please select an answer'),
  timeSpent: z.number().min(0, 'Invalid time spent'),
});

export const topupSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['card', 'bank_transfer']),
});

export const withdrawSchema = z.object({
  amount: z.number().min(100, 'Minimum withdrawal is 100'),
  bankAccount: z.object({
    accountNumber: z.string().min(10),
    bankCode: z.string().min(1),
  }),
});
