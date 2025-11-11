# Quick Fix Guide - Execute These Steps

This is your complete action checklist to fix everything from start to finish. Execute these steps in order.

## ✅ Step 1: Delete Old Design Variants (5 minutes)

```powershell
cd C:\Projects\1000ravier-mobileapp
Remove-Item src/screens/home/HomeScreen.tsx -Force -ErrorAction Ignore
Remove-Item src/screens/home/HomeScreenSimple.tsx -Force -ErrorAction Ignore
Remove-Item src/screens/home/ImprovedHomeScreen.tsx -Force -ErrorAction Ignore
Remove-Item src/screens/game/GameplayScreen.tsx -Force -ErrorAction Ignore
Remove-Item src/screens/game/QuizGameplayScreen.tsx -Force -ErrorAction Ignore
Remove-Item src/screens/leaderboard/LeaderboardScreenWorking.tsx -Force -ErrorAction Ignore
git add -A
git commit -m "Remove: Old design variants - consolidate to modern design"
```

## ✅ Step 2: Create API Normalizer (already done - check designSystem.ts exists)

Files created:
- `src/styles/designSystem.ts` ✓

## ✅ Step 3: Create Remaining Utility Files

Create `src/services/api/normalizer.ts`:
```typescript
export const normalizeResponse = (data: any): any => {
  if (Array.isArray(data)) return data.map(normalizeResponse);
  if (data === null || typeof data !== 'object') return data;
  const normalized: any = {};
  for (const [key, value] of Object.entries(data)) {
    const camelKey = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
    normalized[camelKey] = normalizeResponse(value);
  }
  return normalized;
};

export const handleApiError = (error: any) => {
  const message = error.response?.data?.error?.message || 'An error occurred. Please try again.';
  const code = error.response?.data?.error?.code || 'UNKNOWN_ERROR';
  return { message, code, details: error.response?.data?.error?.details };
};
```

Create `src/utils/errorMessages.ts`:
```typescript
export const userFriendlyMessages: Record<string, string> = {
  'INVALID_CREDENTIALS': 'Email or password is incorrect',
  'USER_NOT_FOUND': 'User account not found',
  'INSUFFICIENT_CREDITS': 'You don\'t have enough credits',
  'NETWORK_ERROR': 'Connection failed. Check your internet.',
  'SERVER_ERROR': 'Server is temporarily unavailable. Try again.',
  'TIMEOUT': 'Request took too long. Please try again.',
  'VALIDATION_ERROR': 'Please check your input and try again.',
  'UNKNOWN_ERROR': 'Something went wrong. Please try again.',
};

export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return userFriendlyMessages[error] || error;
  if (error?.code) return userFriendlyMessages[error.code] || error.message || 'An error occurred';
  return userFriendlyMessages['UNKNOWN_ERROR'];
};
```

## ✅ Step 4: Install Dependencies

```powershell
npm install zod
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native babel-jest @types/jest
cd backend-new
npm install express-swagger-ui swagger-jsdoc @sentry/node socket.io
cd ..
npm install @sentry/react @sentry/tracing socket.io-client
```

## ✅ Step 5: Create Validation Schemas

Create `src/services/validation/schemas.ts`:
```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be 8+ characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be 8+ characters'),
  name: z.string().min(2, 'Name required'),
});

export const gameJoinSchema = z.object({
  modeId: z.string().min(1, 'Game mode required'),
});

export const answerSubmitSchema = z.object({
  sessionId: z.string().min(1, 'Session required'),
  questionId: z.string().min(1, 'Question required'),
  selectedOptionId: z.string().min(1, 'Select an answer'),
  timeSpent: z.number().min(0),
});
```

## ✅ Step 6: Update API Client

Add to `src/services/api/client.ts` after creating the axios instance:

```typescript
import { normalizeResponse } from './normalizer';

apiClient.interceptors.response.use(
  (response) => {
    if (response.data?.data) {
      response.data.data = normalizeResponse(response.data.data);
    }
    return response;
  },
  (error) => Promise.reject(error)
);
```

## ✅ Step 7: Commit Progress

```powershell
git add -A
git commit -m "Add: Design system, validation schemas, error utilities, API normalizer"
```

## ✅ Step 8: Remove Console Logs

Search all files for `console.` and remove/comment them:

```powershell
# Find all console logs
grep -r "console\." src --include="*.ts" --include="*.tsx" | grep -v "production"

# Or manually search in your IDE for console. and remove
```

## ✅ Step 9: Run Tests & Checks

```powershell
npm run typecheck
npm run lint
npm run build
```

## ✅ Step 10: Commit Clean Code

```powershell
git add -A
git commit -m "Clean: Remove console logs, fix TypeScript issues"
git push origin main
```

## What Happens Next

1. **Backend**: Already has core features
2. **Frontend**: Now has design system, validation, error handling
3. **Testing**: Can now add Jest tests
4. **Deployment**: Ready for staging

---

## Total Time: ~2-3 hours to complete all steps

After completion, your app will be:
- ✅ Consolidat design system
- ✅ API field names normalized (snake_case → camelCase)
- ✅ Input validation working
- ✅ User-friendly error messages
- ✅ Console clean
- ✅ Ready for testing phase

**Then follow IMPLEMENTATION_EXECUTION_GUIDE.md for Phases 2-5**
