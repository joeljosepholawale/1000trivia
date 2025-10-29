# Authentication Setup Guide

## Overview
Your authentication system is now fully configured to work with your Supabase database backend. No more mocks!

## Backend Configuration

### Database: Supabase
- **URL**: `https://qdmkhabgphnhobqfpwjw.supabase.co`
- **Service Key**: Configured in backend `.env`
- **JWT Secret**: Configured for token signing

### Auth Endpoints
All endpoints are prefixed with `/api/auth`:

1. **POST /auth/register** - Register with email/password
   - Body: `{ email, password, username? }`
   - Returns: `{ user, accessToken, refreshToken }`

2. **POST /auth/login** - Login with email/password
   - Body: `{ email, password }`
   - Returns: `{ user, accessToken, refreshToken }`

3. **POST /auth/email/start** - Send OTP to email
   - Body: `{ email }`
   - Returns: `{ message }`

4. **POST /auth/email/verify** - Verify OTP
   - Body: `{ email, otp }`
   - Returns: `{ user, accessToken, refreshToken }`

5. **POST /auth/refresh** - Refresh access token
   - Body: `{ refreshToken }`
   - Returns: `{ accessToken }`

6. **POST /auth/logout** - Logout (requires auth)
   - Headers: `Authorization: Bearer <token>`
   - Returns: `{ message }`

7. **GET /auth/me** - Get current user (requires auth)
   - Headers: `Authorization: Bearer <token>`
   - Returns: `{ user, wallet }`

## Mobile App Configuration

### API Base URL
Located in `packages/mobile/src/config/index.ts`:
- Development: `http://192.168.1.197:3000/api`
- Update this to your local machine's IP address

### Redux Store
The auth slice is in `packages/mobile/src/store/slices/authSlice.ts`

#### Available Actions:
```typescript
import { useDispatch } from 'react-redux';
import { 
  register, 
  loginWithEmail, 
  verifyOTP,
  checkStoredAuth,
  logout 
} from '@/store/slices/authSlice';

// Register new user
dispatch(register({ email, password, username }));

// Login with email/password
dispatch(loginWithEmail({ email, password }));

// Verify OTP (for OTP-based login)
dispatch(verifyOTP({ email, otp }));

// Check stored auth on app start
dispatch(checkStoredAuth());

// Logout
dispatch(logout());
```

### Token Persistence
- Access tokens are stored in `AsyncStorage` as `auth_token`
- Refresh tokens are stored as `refresh_token`
- Tokens are automatically loaded on app start via `checkStoredAuth()`
- All authenticated API calls automatically include the token via the `apiClient`

## Usage in Screens

### ModernLoginScreen Example
```typescript
import { useDispatch, useSelector } from 'react-redux';
import { loginWithEmail } from '@/store/slices/authSlice';

const ModernLoginScreen = () => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const handleLogin = async (email: string, password: string) => {
    try {
      await dispatch(loginWithEmail({ email, password })).unwrap();
      // Success - user is now logged in
      // Navigation will happen automatically
    } catch (err) {
      // Handle error
      console.error('Login failed:', err);
    }
  };

  return (
    <ModernLoginScreen
      onLogin={handleLogin}
      onNavigateToRegister={() => navigation.navigate('Register')}
      onForgotPassword={() => navigation.navigate('ForgotPassword')}
    />
  );
};
```

### App Initialization (Add to App.tsx)
```typescript
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkStoredAuth } from '@/store/slices/authSlice';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check for stored authentication on app start
    dispatch(checkStoredAuth());
  }, []);

  return <AppNavigator />;
}
```

## Testing the Authentication Flow

### 1. Start the Backend
```bash
cd packages/backend
npm run dev
```
Backend should start on `http://localhost:3000`

### 2. Start the Mobile App
```bash
cd packages/mobile
npm start
```

### 3. Update API URL
Make sure your `packages/mobile/src/config/index.ts` has the correct IP:
```typescript
baseUrl: 'http://<YOUR_LOCAL_IP>:3000/api'
```

### 4. Test Registration
1. Open the app
2. Navigate to Register screen
3. Enter email and password
4. Submit
5. Check backend logs for user creation
6. User should be logged in automatically

### 5. Test Login
1. Logout if logged in
2. Navigate to Login screen
3. Enter credentials
4. Submit
5. Should be logged in and redirected

### 6. Test OTP Flow (if implemented)
1. Navigate to OTP login
2. Enter email
3. Check backend console for OTP code (since email is set to 'console' mode)
4. Enter OTP
5. Should be logged in

### 7. Test Persistence
1. Login successfully
2. Close the app completely
3. Reopen the app
4. Should automatically login without credentials

## Backend Email Configuration

Currently set to `console` mode for development:
```env
EMAIL_PROVIDER=console
```

To enable actual email sending:
1. Set up SendGrid account
2. Get API key
3. Update `.env`:
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_api_key_here
```

## Security Notes

1. **JWT Tokens**: 
   - Access tokens expire in 15 minutes
   - Refresh tokens expire in 7 days

2. **Password Requirements**:
   - Minimum 8 characters
   - Hashed with bcrypt (12 rounds)

3. **OTP**:
   - Valid for 10 minutes
   - 6-digit numeric code
   - Stored in-memory (use Redis in production)

## Troubleshooting

### "Network Error"
- Check if backend is running
- Verify API URL in config
- Check if device can reach the backend IP

### "Invalid Token"
- Token might be expired
- Clear AsyncStorage: `await AsyncStorage.clear()`
- Try logging in again

### "User Already Exists"
- Email is already registered
- Use login instead or different email

### OTP Not Received
- Check backend console logs (console mode)
- Verify email configuration if using SendGrid
- Check spam folder

## Next Steps

1. ✅ Backend with Supabase is configured
2. ✅ Mobile app authentication is connected
3. ✅ Token persistence is implemented
4. ✅ All auth flows are ready

You can now:
- Test the complete auth flow
- Add social login (Google, Facebook, Apple)
- Implement forgot password flow
- Add biometric authentication (Face ID / Touch ID)
