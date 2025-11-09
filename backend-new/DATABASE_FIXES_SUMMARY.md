# Database Errors - Fixes Applied

This document summarizes the database-related errors found in the logs and the fixes applied.

## Date: 2025-11-09

### Errors Identified

1. **Session Status Enum Mismatch**
   - **Error**: `invalid input value for enum session_status: "completed"`
   - **Location**: `GET /api/user/stats`
   - **Root Cause**: Database schema uses uppercase enum values (`COMPLETED`) but code was querying with lowercase (`completed`)

2. **Row-Level Security Policy Violation**
   - **Error**: `new row violates row-level security policy for table "wallet_transactions"`
   - **Location**: `POST /api/bonus/claim-daily`
   - **Root Cause**: Missing INSERT policy for `wallet_transactions` table

3. **UUID Type Error in Leaderboard**
   - **Error**: `invalid input syntax for type uuid: "weekly"`
   - **Location**: `GET /api/leaderboard?period=weekly`
   - **Root Cause**: Frontend sending period type ("weekly") but backend expecting UUID

---

## Fixes Applied

### 1. Session Status Enum Fix

**File**: `backend-new/src/services/userStats.ts`

**Changes**:
- Line 45: Changed `.eq('status', 'completed')` → `.eq('status', 'COMPLETED')`
- Line 137: Changed `.eq('status', 'completed')` → `.eq('status', 'COMPLETED')`

**Result**: Database queries now use correct uppercase enum values matching the schema.

---

### 2. RLS Policy Fix

**File**: `backend-new/database/fix_rls_policies.sql` (NEW FILE)

**Changes**:
```sql
-- Add INSERT policy for wallet_transactions
CREATE POLICY "Users can insert own transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add INSERT policy for ad_rewards 
CREATE POLICY "Users can insert own ad rewards" ON ad_rewards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure UPDATE policy for wallets
CREATE POLICY "Users can update own wallet" ON wallets
    FOR UPDATE USING (auth.uid() = user_id);
```

**Result**: Users can now insert their own wallet transactions, ad rewards, and update wallet balances.

**Action Required**: Run this SQL script in Supabase SQL Editor:
```bash
# In Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of backend-new/database/fix_rls_policies.sql
# 3. Click "Run"
```

---

### 3. Leaderboard Period Type Conversion Fix

**File**: `backend-new/src/routes/leaderboard.ts`

**Changes**:
- Added UUID pattern validation to detect if period is already a UUID
- Added database lookup to convert period types ("weekly", "monthly") to active period IDs
- Falls back to direct UUID if already in UUID format

**Code Added** (lines 174-204):
```typescript
// Convert period type ("weekly", "monthly") to actual period ID
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let periodId = period;

if (!uuidPattern.test(period)) {
  // It's a period type like "weekly" or "monthly", need to look up active period
  const { db } = await import('../services/database');
  const periodType = period.toUpperCase();
  
  const { data: activePeriod, error } = await db.getClient()
    .from('periods')
    .select('id, mode_id, game_modes!inner(period_type)')
    .eq('game_modes.period_type', periodType)
    .eq('status', 'ACTIVE')
    .order('start_date', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !activePeriod) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'PERIOD_NOT_FOUND',
        message: `No active ${period} period found`
      }
    });
  }
  
  periodId = activePeriod.id;
}

const result = await leaderboardService.getLeaderboard(periodId, userId, limit);
```

**Result**: API now accepts both period types ("weekly"/"monthly") and direct period UUIDs.

---

## Testing Checklist

After applying these fixes, test the following endpoints:

- [ ] `GET /api/user/stats` - Should return user statistics without enum errors
- [ ] `POST /api/bonus/claim-daily` - Should successfully claim daily credits
- [ ] `GET /api/leaderboard?period=weekly` - Should return leaderboard for active weekly period
- [ ] `GET /api/leaderboard?period=monthly` - Should return leaderboard for active monthly period
- [ ] `GET /api/wallet/transactions` - Should show transaction history

---

## Additional Notes

### Database Schema Consistency

The database uses uppercase enum values consistently:
- `session_status`: `ACTIVE`, `PAUSED`, `COMPLETED`, `EXPIRED`, `CANCELLED`
- `period_status`: `UPCOMING`, `ACTIVE`, `COMPLETED`, `CANCELLED`
- `transaction_type`: `DAILY_CLAIM`, `AD_REWARD`, `PURCHASE`, `ENTRY_FEE`, etc.

### RLS Policies Required

For proper operation, these tables need RLS policies:
1. **wallet_transactions**: SELECT, INSERT
2. **ad_rewards**: SELECT, INSERT
3. **wallets**: SELECT, UPDATE
4. **payments**: SELECT, INSERT

### Active Periods Required

The leaderboard endpoint requires at least one active period for each period type:
- Create active WEEKLY period
- Create active MONTHLY period

SQL to check active periods:
```sql
SELECT p.*, gm.period_type, gm.name 
FROM periods p
JOIN game_modes gm ON p.mode_id = gm.id
WHERE p.status = 'ACTIVE';
```

---

## Files Modified

1. `backend-new/src/services/userStats.ts` - Fixed enum values
2. `backend-new/src/routes/leaderboard.ts` - Added period type conversion
3. `backend-new/database/fix_rls_policies.sql` - **NEW** RLS policy fixes

---

## Deployment Steps

1. **Apply Database Changes**:
   ```bash
   # Run in Supabase SQL Editor
   backend-new/database/fix_rls_policies.sql
   ```

2. **Restart Backend Server**:
   ```bash
   cd backend-new
   npm run dev
   # or in production
   npm run start
   ```

3. **Verify Fixes**:
   - Check logs for absence of previous errors
   - Test all endpoints listed in Testing Checklist
   - Monitor for new errors

---

## Status

✅ All fixes applied
⚠️ Database migration needs to be run in Supabase
🔄 Backend restart required after database migration

---

## Contact

If issues persist after applying these fixes, check:
1. Supabase connection is active
2. Service role key has proper permissions
3. Active periods exist in database
4. RLS policies are correctly applied
