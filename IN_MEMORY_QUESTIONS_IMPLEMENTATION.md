# In-Memory AI Question Implementation

## Summary

AI-generated questions are now stored in memory only. Questions are NOT saved to the database - only user answers and scores are persisted.

## Key Changes

### 1. GeminiQuestionService (`backend-new/src/services/geminiQuestions.ts`)

**New Features:**
- `sessionQuestions` Map: Stores questions in memory (sessionId → SessionQuestion[])
- Each question gets a unique `sessionQuestionId` like `{sessionId}_q{index}`
- Questions randomized per session and stored with `randomized_options`

**New Methods:**
- `getSessionQuestions(sessionId, limit, offset)`: Retrieve questions from memory
- `getQuestionById(sessionId, sessionQuestionId)`: Get specific question for answer validation
- `clearSessionQuestions(sessionId)`: Clear memory when session completes

**Modified Method:**
- `generateQuestionsForSession()`: Now generates questions and stores them ONLY in memory
  - No database inserts to `questions` table
  - No database inserts to `session_questions` table
  - Returns `SessionQuestion[]` with in-memory IDs

### 2. GameService (`backend-new/src/services/game.ts`)

**Modified: `joinGameMode()`**
- When `USE_AI_QUESTIONS=true`, generates questions in memory only
- No fallback to database questions if AI generation fails
- Session is deleted if question generation fails

**Modified: `getNextQuestions()`**
- If `USE_AI_QUESTIONS=true`, fetches from `geminiQuestionService.getSessionQuestions()`
- If `USE_AI_QUESTIONS=false`, fetches from database (old method)
- Returns questions with `sessionQuestionId` as the primary identifier

**Modified: `submitAnswer()`**
- If `USE_AI_QUESTIONS=true`, validates answer against in-memory questions
- If `USE_AI_QUESTIONS=false`, validates against database (old method)
- Only saves answer result and score to database - NOT the question text

**Modified: Session Completion**
- Calls `geminiQuestionService.clearSessionQuestions()` when session completes
- Frees up memory for completed sessions

### 3. Database Service (`backend-new/src/services/database.ts`)

**No changes required** - The existing methods already only save:
- Answers to `answers` table
- Scores to `game_sessions` table
- Leaderboard entries to `leaderboard_entries` table

Questions are never saved when using AI generation.

## Flow Diagram

```
User Joins Game
    ↓
Create Session (DB: game_sessions)
    ↓
Generate AI Questions → Store in Memory ONLY
    ↓
User Requests Questions
    ↓
Fetch from Memory → Return to Frontend
    ↓
User Submits Answer
    ↓
Validate against Memory → Save Answer & Score to DB
    ↓
Session Completes
    ↓
Clear Questions from Memory
```

## Database Tables Used

### Written To (for AI sessions):
- `game_sessions` - Session metadata and scores
- `answers` - User's submitted answers with correctness and timing
- `leaderboard_entries` - Final scores and rankings
- `wallet_transactions` - Entry fees and rewards
- `analytics_events` - Game events

### NOT Written To (for AI sessions):
- `questions` - Questions are NOT saved
- `session_questions` - Session-question links are NOT saved

## Environment Variable

Set `USE_AI_QUESTIONS=true` in `.env` to enable in-memory AI questions.

## Memory Management

- Questions stored in Map: `sessionId → SessionQuestion[]`
- Cleared automatically when session completes
- Each session stores ~100 questions × ~200 bytes ≈ 20KB per session
- Memory scales linearly with active sessions

## Testing

To test the implementation:

```bash
# 1. Ensure environment variable is set
USE_AI_QUESTIONS=true

# 2. Start the backend
cd backend-new
npm run dev

# 3. Join a game
POST /game/start
{
  "periodId": "uuid-here",
  "deviceInfo": "test-device"
}

# 4. Get questions (verify they come from memory)
GET /game/session/{sessionId}/questions

# 5. Submit answer (verify validation works)
POST /game/session/{sessionId}/answer
{
  "questionId": "{sessionId}_q0",
  "selectedAnswer": "answer",
  "responseTime": 5000
}

# 6. Check database
# - Verify 'questions' table is NOT populated with new AI questions
# - Verify 'answers' table contains the submitted answer
# - Verify 'game_sessions' table has updated score
```

## Benefits

✅ **No Database Bloat**: Questions don't accumulate in the database
✅ **Fresh Questions**: Every session gets newly generated questions
✅ **Fast Performance**: In-memory lookups are faster than database queries
✅ **Score Tracking**: All answers and scores are still persisted
✅ **Automatic Cleanup**: Memory freed when session completes

## Important Notes

1. **Server Restart**: Questions in memory are lost on server restart
   - Active sessions will need to rejoin
   - Consider implementing Redis for production persistence

2. **Horizontal Scaling**: With multiple server instances, use Redis or similar
   - Each instance has its own memory
   - Sessions must stick to the same instance OR use shared cache

3. **Database Questions Still Work**: Setting `USE_AI_QUESTIONS=false` uses the old database method

4. **Question IDs**: Frontend receives `sessionQuestionId` format: `{sessionId}_q{index}`
   - Example: `abc123-def456-789_q0`, `abc123-def456-789_q1`, etc.
