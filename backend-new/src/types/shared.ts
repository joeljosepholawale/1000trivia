// Minimal shared types for backend
// This replaces the @1000ravier/shared package temporarily

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message: string;
    details?: any;
  };
}

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  username?: string;
  display_name?: string;
  profile_picture_url?: string;
  language?: string;
  timezone?: string;
  created_at: string;
  updated_at?: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer: string;
  category?: string;
  difficulty?: string;
}

export interface Game {
  id: string;
  user_id: string;
  mode: string;
  status: 'active' | 'completed' | 'abandoned';
  score: number;
  started_at: string;
  completed_at?: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  updated_at: string;
}
