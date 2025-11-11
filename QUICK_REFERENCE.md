# Quick Reference Guide

## 🚀 Essential Commands

### Development
```bash
npm start              # Start dev server (Expo)
npm run android       # Build for Android
npm run ios           # Build for iOS
npm run web           # Start web version
```

### Testing
```bash
npm test              # Run all tests once
npm run test:watch    # Run tests in watch mode (auto-rerun)
npm run test:coverage # Generate coverage report
npm run test:debug    # Debug mode with inspector
```

### Code Quality
```bash
npm run lint          # Run ESLint
npm run typecheck     # Run TypeScript check
```

---

## 📁 Key Files & Folders

### Configuration
- `jest.config.js` - Jest testing configuration
- `jest.setup.js` - Test environment setup
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `app.json` - Expo configuration

### Documentation
- `EXECUTIVE_SUMMARY.md` - **START HERE** (overview of progress)
- `PRODUCTION_STATUS.md` - Current status and roadmap
- `PHASE_1_COMPLETION_REPORT.md` - Phase 1 details
- `PHASE_2_COMPLETION_REPORT.md` - Phase 2 details
- `COMPREHENSIVE_AUDIT_REPORT.md` - Full audit findings

### Core Services
- `src/services/api/client.ts` - API client with normalizer
- `src/services/api/normalizer.ts` - Response normalization
- `src/services/validation/schemas.ts` - Zod validation schemas
- `src/utils/errorMessages.ts` - Error message utilities
- `src/styles/designSystem.ts` - Design tokens and system

### Test Files
- `src/services/api/__tests__/client.test.ts` - API tests (15 tests)
- `src/services/validation/__tests__/schemas.test.ts` - Validation tests (40+ tests)
- `src/services/api/__tests__/normalizer.test.ts` - Normalizer tests (20 tests)
- `src/utils/__tests__/errorMessages.test.ts` - Error tests (15+ tests)
- `src/__tests__/testUtils.ts` - Test utilities and helpers

---

## 📊 Test Statistics

| Category | Count |
|----------|-------|
| Total Test Cases | 90+ |
| API Client Tests | 15 |
| Validation Tests | 40+ |
| Normalizer Tests | 20 |
| Error Message Tests | 15+ |
| Mocked Modules | 10+ |
| Test Helpers | 15+ |
| Coverage Threshold | 70% |

---

## 🎯 Test Commands Explained

### `npm test`
Runs all tests once and exits. Use this:
- Before committing
- In CI/CD pipeline
- For quick verification

### `npm run test:watch`
Runs tests in watch mode - automatically re-runs tests when files change. Use this:
- During development
- When writing new tests
- For TDD (Test-Driven Development)

### `npm run test:coverage`
Generates coverage report showing:
- Percentage of code covered
- Which lines aren't tested
- Coverage HTML report in `coverage/` folder

Use this:
- To track coverage progress
- Before production release
- To identify untested code

### `npm run test:debug`
Debug mode with Node inspector. Use this:
- When tests fail mysteriously
- To step through test code
- With Chrome DevTools (`chrome://inspect`)

---

## 🔧 Validati Schemas

### Available Schemas (in `src/services/validation/schemas.ts`)
```typescript
loginSchema          // Email + password
registerSchema       // Email, username, password, confirmation
gameJoinSchema       // Game mode + entry fee
answerSubmissionSchema // Question ID + answer + time spent
topupSchema          // Credit amount + payment method
withdrawalSchema     // Withdrawal amount + bank account
```

### Using Validation
```typescript
import { loginSchema } from '@/services/validation/schemas';

const result = loginSchema.safeParse(userData);
if (result.success) {
  // Data is valid
  console.log(result.data);
} else {
  // Data is invalid
  console.log(result.error);
}
```

---

## 🛠️ API Normalizer

**Problem**: Backend returns snake_case, frontend expects camelCase
**Solution**: Automatic response normalization

### How It Works
```typescript
// Backend response:
{ user_id: 1, user_name: "John", created_at: "2025-01-01" }

// Frontend receives:
{ userId: 1, userName: "John", createdAt: "2025-01-01" }
```

**Location**: `src/services/api/normalizer.ts`  
**Automatic**: Applied to all API responses

---

## 📝 Error Messages

**Feature**: User-friendly error messages in German

### Error Categories
```typescript
UNAUTHORIZED      // Authentication failed
FORBIDDEN         // Access denied
NOT_FOUND        // Resource not found
VALIDATION_ERROR // Input validation failed
NETWORK_ERROR    // Network connection issue
SERVER_ERROR     // Backend error
TIMEOUT_ERROR    // Request timeout
```

**Location**: `src/utils/errorMessages.ts`

---

## 🎨 Design System

**Purpose**: Centralized design tokens for consistency

### Includes
- Spacing scale (4px base unit)
- Border radius (sm, md, lg, xl, full)
- Shadows (sm, md, lg, xl)
- Typography (font sizes, weights)
- Colors
- Animation durations

**Location**: `src/styles/designSystem.ts`

---

## 📈 Progress Tracker

### Phases Completed
✅ **Phase 1** (1 day): Critical Fixes  
✅ **Phase 2** (0.5 day): Testing Setup  
⏳ **Phase 3** (3-4 days): Security Hardening  
⏳ **Phase 4** (4-5 days): Optimization  
⏳ **Phase 5** (3-4 days): Final Deployment  

### Current Status
- **47%** complete overall
- **100%** complete for Phases 1-2
- **8-10 days** remaining to production

---

## 🚨 Common Issues & Solutions

### Tests Fail with Module Not Found
```bash
# Clear Jest cache
npm test -- --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Coverage Below Threshold
```bash
# View coverage report
npm run test:coverage

# Open coverage/index.html in browser to see detailed report
```

### TypeScript Errors (Pre-existing)
- Not blocking, documented in audit
- Will be addressed in future phases

### Network Tests Fail
- Ensure mock is set up correctly
- Check `jest.setup.js` for NetInfo mock

---

## 🔗 Important URLs

- **Backend API**: https://one000trivia.onrender.com/api
- **Database**: Supabase (configured)
- **GitHub**: https://github.com/joeljosepholawale/1000trivia (backend only)

---

## 📚 Documentation Files

Start with these in order:

1. **EXECUTIVE_SUMMARY.md** - Overview & status
2. **PRODUCTION_STATUS.md** - Detailed roadmap
3. **PHASE_1_COMPLETION_REPORT.md** - What was fixed
4. **PHASE_2_COMPLETION_REPORT.md** - Testing details
5. **COMPREHENSIVE_AUDIT_REPORT.md** - Full audit findings

---

## 💡 Tips & Best Practices

### Writing New Tests
```typescript
import { 
  mockFetchSuccess, 
  mockNetworkConnection,
  createMockUser 
} from '@/__tests__/testUtils';

describe('MyFeature', () => {
  it('should do something', async () => {
    mockNetworkConnection(true);
    mockFetchSuccess({ data: createMockUser() });
    
    // Test code here
  });
});
```

### Using Validation
```typescript
import { loginSchema } from '@/services/validation/schemas';

const validatedData = loginSchema.parse(formData);
// or
const result = loginSchema.safeParse(formData);
```

### Handling Errors
```typescript
import { getErrorMessage } from '@/utils/errorMessages';

try {
  // API call
} catch (error) {
  const message = getErrorMessage(error, 'Default message');
  Alert.alert('Error', message);
}
```

---

## 🎓 Learning Resources

### Jest Documentation
- Official: https://jestjs.io/
- React Native: https://jestjs.io/docs/tutorial-react-native

### Zod Validation
- Official: https://zod.dev/
- Examples in: `src/services/validation/schemas.ts`

### React Native
- Official: https://reactnative.dev/
- Expo: https://docs.expo.dev/

---

## ✅ Pre-Commit Checklist

Before committing code:
```bash
npm run lint       # Fix any linting issues
npm run typecheck  # Fix TypeScript errors
npm test           # Ensure tests pass
```

---

## 📞 Support

For questions about:
- **Phase 1**: See `PHASE_1_COMPLETION_REPORT.md`
- **Phase 2**: See `PHASE_2_COMPLETION_REPORT.md`
- **Testing**: See `PHASE_2_COMPLETION_REPORT.md` (How to Run Tests section)
- **Overall Status**: See `EXECUTIVE_SUMMARY.md`

---

**Last Updated**: 2025-01-01  
**Status**: 47% Production Ready ✅  
**Next Phase**: Phase 3 - Security Hardening
