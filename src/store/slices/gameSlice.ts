import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {gameAPI} from '@/services/api/game';
import {getErrorMessage} from '@/types/errors';
import type {GameMode, Period, Question, GameSession, GameSessionStatus} from '@1000ravier/shared';

interface GameState {
  // Available game modes and periods
  gameModes: GameMode[];
  activePeriods: Period[];
  
  // Current game session
  currentSession: GameSession | null;
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  timeRemaining: number;
  
  // Game progress
  userAnswers: Record<string, string>; // questionId -> selectedOptionId
  sessionStats: {
    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers: number;
    score: number;
  };
  
  // UI state
  isLoading: boolean;
  error: string | null;
  showResults: boolean;
}

const initialState: GameState = {
  gameModes: [],
  activePeriods: [],
  currentSession: null,
  currentQuestion: null,
  currentQuestionIndex: 0,
  timeRemaining: 0,
  userAnswers: {},
  sessionStats: {
    totalQuestions: 0,
    answeredQuestions: 0,
    correctAnswers: 0,
    score: 0,
  },
  isLoading: false,
  error: null,
  showResults: false,
};

// Async thunks
export const loadGameModes = createAsyncThunk(
  'game/loadGameModes',
  async (_, {rejectWithValue}) => {
    try {
      const response = await gameAPI.getGameModes();
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to load game modes');
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Network error'));
    }
  }
);

export const loadActivePeriods = createAsyncThunk(
  'game/loadActivePeriods',
  async (_, {rejectWithValue}) => {
    try {
      const response = await gameAPI.getActivePeriods();
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to load periods');
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Network error'));
    }
  }
);

export const joinGameMode = createAsyncThunk(
  'game/joinGameMode',
  async ({modeId, paymentIntentId}: {modeId: string; paymentIntentId?: string}, {rejectWithValue}) => {
    try {
      const response = await gameAPI.joinGameMode(modeId, paymentIntentId);
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to join game');
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Network error'));
    }
  }
);

export const getNextQuestion = createAsyncThunk(
  'game/getNextQuestion',
  async (sessionId: string, {rejectWithValue}) => {
    try {
      const response = await gameAPI.getNextQuestion(sessionId);
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to get question');
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Network error'));
    }
  }
);

export const submitAnswer = createAsyncThunk(
  'game/submitAnswer',
  async ({sessionId, questionId, selectedOptionId, timeSpent}: {
    sessionId: string;
    questionId: string;
    selectedOptionId: string;
    timeSpent: number;
  }, {rejectWithValue}) => {
    try {
      const response = await gameAPI.submitAnswer(sessionId, questionId, selectedOptionId, timeSpent);
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to submit answer');
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Network error'));
    }
  }
);

export const pauseSession = createAsyncThunk(
  'game/pauseSession',
  async (sessionId: string, {rejectWithValue}) => {
    try {
      const response = await gameAPI.pauseSession(sessionId);
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to pause session');
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Network error'));
    }
  }
);

export const resumeSession = createAsyncThunk(
  'game/resumeSession',
  async (sessionId: string, {rejectWithValue}) => {
    try {
      const response = await gameAPI.resumeSession(sessionId);
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to resume session');
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Network error'));
    }
  }
);

export const endSession = createAsyncThunk(
  'game/endSession',
  async (sessionId: string, {rejectWithValue}) => {
    try {
      const response = await gameAPI.endSession(sessionId);
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to end session');
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Network error'));
    }
  }
);

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    
    selectAnswer: (state, action: PayloadAction<{questionId: string; selectedOptionId: string}>) => {
      state.userAnswers[action.payload.questionId] = action.payload.selectedOptionId;
    },
    
    nextQuestion: (state) => {
      state.currentQuestionIndex += 1;
      state.currentQuestion = null;
    },
    
    showGameResults: (state) => {
      state.showResults = true;
    },
    
    hideGameResults: (state) => {
      state.showResults = false;
    },
    
    resetGameState: (state) => {
      state.currentSession = null;
      state.currentQuestion = null;
      state.currentQuestionIndex = 0;
      state.timeRemaining = 0;
      state.userAnswers = {};
      state.sessionStats = {
        totalQuestions: 0,
        answeredQuestions: 0,
        correctAnswers: 0,
        score: 0,
      };
      state.showResults = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Load game modes
    builder
      .addCase(loadGameModes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadGameModes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.gameModes = action.payload;
      })
      .addCase(loadGameModes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load active periods
    builder
      .addCase(loadActivePeriods.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadActivePeriods.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activePeriods = action.payload;
      })
      .addCase(loadActivePeriods.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Join game mode
    builder
      .addCase(joinGameMode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(joinGameMode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSession = action.payload.session;
        state.sessionStats.totalQuestions = action.payload.session.totalQuestions;
      })
      .addCase(joinGameMode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get next question
    builder
      .addCase(getNextQuestion.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getNextQuestion.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentQuestion = action.payload.question;
        state.timeRemaining = action.payload.timeRemaining || 30; // Default 30 seconds
      })
      .addCase(getNextQuestion.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Submit answer
    builder
      .addCase(submitAnswer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Update session stats
        state.sessionStats.answeredQuestions += 1;
        if (action.payload.isCorrect) {
          state.sessionStats.correctAnswers += 1;
        }
        state.sessionStats.score = action.payload.currentScore;
        
        // Update session status if completed
        if (action.payload.sessionComplete) {
          if (state.currentSession) {
            state.currentSession.status = 'COMPLETED' as GameSessionStatus;
            state.currentSession.completedAt = new Date().toISOString();
          }
          state.showResults = true;
        }
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Pause session
    builder
      .addCase(pauseSession.fulfilled, (state) => {
        if (state.currentSession) {
          state.currentSession.status = 'PAUSED' as GameSessionStatus;
        }
      });

    // Resume session
    builder
      .addCase(resumeSession.fulfilled, (state) => {
        if (state.currentSession) {
          state.currentSession.status = 'ACTIVE' as GameSessionStatus;
        }
      });

    // End session
    builder
      .addCase(endSession.fulfilled, (state) => {
        if (state.currentSession) {
          state.currentSession.status = 'COMPLETED' as GameSessionStatus;
          state.currentSession.completedAt = new Date().toISOString();
        }
        state.showResults = true;
      });
  },
});

export const {
  clearError,
  updateTimeRemaining,
  selectAnswer,
  nextQuestion,
  showGameResults,
  hideGameResults,
  resetGameState,
} = gameSlice.actions;

export default gameSlice.reducer;
