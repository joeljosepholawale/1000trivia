# Authentication System - Complete Setup ✅

## What Was Fixed

### 1. **Backend Configuration** ✅
- ✅ Added `JWT_SECRET` environment variable
- ✅ Added `JWT_ACCESS_EXPIRES_IN` (15 minutes)
- ✅ Updated `JWT_REFRESH_EXPIRES_IN` (7 days)
- ✅ Added SMTP configuration for email OTP
- ✅ Supabase database already configured

**Location**: `packages/backend/.env`

### 2. **Mobile Auth API** ✅
- ✅ Updated API endpoints to match backend routes
- ✅ Changed OTP endpoint from `/auth/send-otp` to `/auth/email/start`
- ✅ Changed verify endpoint from `/auth/verify-otp` to `/auth/email/verify`
- ✅ Removed `sessionId` requirement (not needed)
- ✅ Updated response interfaces to match backend

**Location**: `packages/mobile/src/services/api/auth.ts`

### 3. **Redux Auth Slice** ✅
- ✅ Fixed token field names (`token` → `accessToken`)
- ✅ Added automatic token persistence to AsyncStorage
- ✅ Added `checkStoredAuth()` for auto-login on app start
- ✅ Updated `verifyOTP` to remove sessionId parameter
- ✅ Fixed `refreshToken` to accept and store refresh tokens
- ✅ Added token cleanup on logout

**Location**: `packages/mobile/src/store/slices/authSlice.ts`

### 4. **API Client** ✅
- ✅ Already configured with automatic token handling
- ✅ Stores tokens in AsyncStorage
- ✅ Automatically includes Bearer token in requests
- ✅ Handles 401 responses (clears tokens)

**Location**: `packages/mobile/src/services/api/client.ts`

## Authentication Flows

### Flow 1: Email/Password Registration
```
User enters email + password
  ↓
POST /auth/register
  ↓
Backend creates user in Supabase
  ↓
Returns { user, accessToken, refreshToken }
  ↓
Tokens saved to AsyncStorage
  ↓
User logged in ✅
```

### Flow 2: Email/Password Login
```
User enters email + password
  ↓
POST /auth/login
  ↓
Backend verifies with Supabase Auth
  ↓
Returns { user, accessToken, refreshToken }
  ↓
Tokens saved to AsyncStorage
  ↓
User logged in ✅
```

### Flow 3: OTP Login (Alternative)
```
User enters email
  ↓
POST /auth/email/start
  ↓
Backend generates 6-digit OTP
  ↓
OTP printed to console (dev mode)
  ↓
User enters OTP
  ↓
POST /auth/email/verify
  ↓
Returns { user, accessToken, refreshToken }
  ↓
Tokens saved to AsyncStorage
  ↓
User logged in ✅
```

### Flow 4: Auto-Login on App Start
```
App starts
  ↓
checkStoredAuth() dispatched
  ↓
Reads auth_token from AsyncStorage
  ↓
GET /auth/me with token
  ↓
Returns user data
  ↓
User automatically logged in ✅
```

### Flow 5: Token Refresh
```
Access token expires (after 15 min)
  ↓
API returns 401
  ↓
App calls POST /auth/refresh
  ↓
Sends refresh token
  ↓
Returns new accessToken
  ↓
Token saved to AsyncStorage
  ↓
Original request retried ✅
```

## Backend Services

### AuthService Methods
- `registerWithPassword(email, password, username?)` - Create new user
- `loginWithPassword(email, password)` - Authenticate user
- `sendEmailOTP(email)` - Generate and send OTP
- `verifyEmailOTP(email, otp)` - Verify OTP and login
- `refreshAccessToken(refreshToken)` - Get new access token
- `getUserFromToken(token)` - Get user from JWT
- `authenticate` - Middleware to protect routes
- `logout(refreshToken)` - Invalidate session

### Database Methods (via Supabase)
- `db.createUser(userData)` - Create user record
- `db.getUserById(id)` - Get user by ID
- `db.getUserByEmail(email)` - Get user by email
- `db.updateUser(id, updates)` - Update user data
- `db.getWallet(userId)` - Get user wallet info

## Mobile Redux Actions

### Available Thunks
```typescript
import { 
  register,           // Register with email/password
  loginWithEmail,     // Login with email/password
  verifyOTP,          // Verify OTP code
  checkStoredAuth,    // Check for saved session
  refreshToken,       // Refresh access token
  logout              // Logout and clear tokens
} from '@/store/slices/authSlice';
```

### Available Reducers
```typescript
import { 
  clearError,               // Clear error message
  clearPendingVerification, // Clear OTP pending state
  updateUser                // Update user data
} from '@/store/slices/authSlice';
```

## State Structure

```typescript
interface AuthState {
  user: User | null;              // Current user object
  token: string | null;           // Access token (JWT)
  isAuthenticated: boolean;       // Login status
  isLoading: boolean;             // Request in progress
  error: string | null;           // Error message
  pendingVerification: {          // OTP verification state
    email: string;
    sessionId: string;
  } | null;
}
```

## Environment Variables

### Backend (.env)
```env
# Supabase
SUPABASE_URL=https://qdmkhabgphnhobqfpwjw.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_...
SUPABASE_JWT_SECRET=...

# JWT
JWT_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# SMTP (for OTP emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Provider
EMAIL_PROVIDER=console  # Change to 'sendgrid' for production
```

### Mobile (config/index.ts)
```typescript
api: {
  baseUrl: 'http://192.168.1.197:3000/api',  // Update with your IP
  timeout: 10000,
}
```

## Testing Checklist

- [ ] Backend is running (`npm run dev` in packages/backend)
- [ ] Mobile app is running (`npm start` in packages/mobile)
- [ ] API URL is updated with correct local IP
- [ ] Can register new user
- [ ] Can login with existing user
- [ ] Can request OTP
- [ ] Can verify OTP
- [ ] Tokens are persisted
- [ ] Auto-login works after app restart
- [ ] Logout clears tokens
- [ ] Protected routes require authentication

## Quick Start

1. **Start Backend**:
```bash
cd packages/backend
npm run dev
```

2. **Update Mobile API URL**:
Edit `packages/mobile/src/config/index.ts`:
```typescript
baseUrl: 'http://<YOUR_IP>:3000/api'
```

3. **Start Mobile App**:
```bash
cd packages/mobile
npm start
```

4. **Test Registration**:
- Open app
- Go to Register screen
- Enter email and password
- Submit → Should login automatically

5. **Test Login**:
- Logout
- Go to Login screen
- Enter credentials
- Submit → Should login

6. **Test Auto-Login**:
- Login successfully
- Close app completely
- Reopen → Should auto-login

## Next Steps

### Recommended Enhancements:
1. **Social Login** (Google, Facebook, Apple)
2. **Biometric Auth** (Face ID, Touch ID)
3. **Password Reset** flow
4. **Email Verification** requirement
5. **2FA** (Two-Factor Authentication)
6. **Session Management** (multiple devices)

### Production Readiness:
1. Move OTP storage to **Redis**
2. Enable **SendGrid** for emails
3. Add **rate limiting** on auth endpoints
4. Implement **refresh token rotation**
5. Add **device fingerprinting**
6. Enable **audit logging**
7. Setup **monitoring & alerts**

## Support

For issues or questions:
1. Check backend logs for errors
2. Check mobile console for network errors
3. Verify environment variables are correct
4. Ensure database migrations are run
5. Check Supabase dashboard for user data

---

**Status**: ✅ **READY FOR TESTING**

All authentication flows are now connected to your Supabase database with no mocks!
