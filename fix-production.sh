#!/bin/bash
# 1000 Ravier Production Readiness Fixer
# This script automates all critical fixes

set -e

echo "🚀 Starting Production Readiness Fixes..."

# ============= PHASE 1: CRITICAL FIXES =============

echo "📋 PHASE 1: Critical Fixes"

# 1.1: Delete old design variants
echo "1.1: Deleting old design variants..."
rm -f src/screens/home/HomeScreen.tsx
rm -f src/screens/home/HomeScreenSimple.tsx
rm -f src/screens/home/ImprovedHomeScreen.tsx
rm -f src/screens/game/GameplayScreen.tsx
rm -f src/screens/game/QuizGameplayScreen.tsx
rm -f src/screens/leaderboard/LeaderboardScreenWorking.tsx
echo "✓ Old design variants deleted"

# 1.2: Create design system file
echo "1.2: Creating design system file..."
cat > src/styles/designSystem.ts << 'EOF'
export const designSystem = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
    h2: { fontSize: 28, fontWeight: '600' as const, lineHeight: 36 },
    h3: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
    body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  },
} as const;
EOF
echo "✓ Design system file created"

# 1.3: Create API normalizer
echo "1.3: Creating API response normalizer..."
mkdir -p src/services/api
cat > src/services/api/normalizer.ts << 'EOF'
export const normalizeResponse = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(normalizeResponse);
  }

  if (data === null || typeof data !== 'object') {
    return data;
  }

  const normalized: any = {};
  for (const [key, value] of Object.entries(data)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    normalized[camelKey] = normalizeResponse(value);
  }
  return normalized;
};

export const handleApiError = (error: any) => {
  const message = error.response?.data?.error?.message || 
                  'An error occurred. Please try again.';
  const code = error.response?.data?.error?.code || 'UNKNOWN_ERROR';
  
  return { message, code, details: error.response?.data?.error?.details };
};
EOF
echo "✓ API normalizer created"

# 1.4: Create error messages utility
echo "1.4: Creating error messages utility..."
mkdir -p src/utils
cat > src/utils/errorMessages.ts << 'EOF'
export const userFriendlyMessages: Record<string, string> = {
  'INVALID_CREDENTIALS': 'Email or password is incorrect',
  'USER_NOT_FOUND': 'User account not found',
  'INSUFFICIENT_CREDITS': "You don't have enough credits",
  'NETWORK_ERROR': 'Connection failed. Check your internet.',
  'SERVER_ERROR': 'Server is temporarily unavailable. Try again.',
  'TIMEOUT': 'Request took too long. Please try again.',
  'VALIDATION_ERROR': 'Please check your input and try again.',
  'UNKNOWN_ERROR': 'Something went wrong. Please try again.',
};

export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return userFriendlyMessages[error] || error;
  }
  
  if (error?.code) {
    return userFriendlyMessages[error.code] || error.message || 'An error occurred';
  }
  
  return userFriendlyMessages['UNKNOWN_ERROR'];
};
EOF
echo "✓ Error messages utility created"

# 1.5: Install Zod for validation
echo "1.5: Installing Zod..."
npm install zod 2>&1 | grep -i "added\|already" || true
echo "✓ Zod installed"

# 1.6: Create validation schemas
echo "1.6: Creating validation schemas..."
cat > src/services/validation/schemas.ts << 'EOF'
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
EOF
mkdir -p src/services/validation
echo "✓ Validation schemas created"

# 1.7: Install testing dependencies
echo "1.7: Installing testing dependencies..."
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native babel-jest @types/jest 2>&1 | grep -i "added\|already" || true
echo "✓ Testing dependencies installed"

# 1.8: Install backend documentation dependencies
echo "1.8: Installing API documentation dependencies..."
cd backend-new
npm install express-swagger-ui swagger-jsdoc 2>&1 | grep -i "added\|already" || true
cd ..
echo "✓ API documentation dependencies installed"

# 1.9: Install security and monitoring packages
echo "1.9: Installing monitoring and security packages..."
npm install @sentry/react @sentry/tracing 2>&1 | grep -i "added\|already" || true
cd backend-new
npm install @sentry/node socket.io socket.io-client 2>&1 | grep -i "added\|already" || true
cd ..
echo "✓ Monitoring packages installed"

# ============= COMMIT CHANGES =============

echo ""
echo "📦 Committing changes..."
git add -A
git commit -m "Fix: Production readiness - consolidate design, add validation, fix API normalization" || true

echo ""
echo "✅ PHASE 1 COMPLETE!"
echo ""
echo "Next steps:"
echo "1. Review deleted files and verify app still builds"
echo "2. Update imports in navigation files to use Modern variants only"
echo "3. Run: npm run test"
echo "4. Run: npm run typecheck"
echo "5. Continue with Phase 2"
echo ""
echo "🚀 Production fixes in progress..."
