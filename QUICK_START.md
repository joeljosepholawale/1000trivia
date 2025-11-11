# ⚡ Quick Start Guide

Get 1000 Ravier running in 5 minutes!

## 🚀 Fast Track Setup

### 1. Install Dependencies (2 min)
```bash
# From project root
npm install

# Backend
cd packages/backend && npm install

# Mobile
cd ../mobile && npm install

# Go back to root
cd ../..
```

### 2. Setup Supabase Database (2 min)
1. Create free account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to SQL Editor
4. Run `packages/backend/supabase/migrations/20231018000000_initial_schema.sql`

### 3. Configure Environment (1 min)

**Backend `.env`** (`packages/backend/.env`):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
JWT_SECRET=change-this-secret-key
STRIPE_SECRET_KEY=sk_test_optional_for_now
PORT=3000
NODE_ENV=development
```

### 4. Seed Sample Questions (30 sec)
```bash
cd packages/backend
npm run seed:questions
```

### 5. Launch! (30 sec)

**Terminal 1 - Backend:**
```bash
cd packages/backend
npm run dev
```

**Terminal 2 - Mobile:**
```bash
cd packages/mobile
npm start
# Then press 'a' for Android or 'i' for iOS
```

## ✅ Test It Works

1. **Backend**: Open http://localhost:3000/health (should see "healthy")
2. **Mobile**: Sign up in the app
3. **Wallet**: Claim daily credits (get 10 credits)
4. **Ads**: Go to Credit Store → Watch test ad (get 50 credits)
5. **Game**: Play FREE mode (0 credits entry)

## 🎉 You're Done!

**Using Test IDs for:**
- ✅ AdMob (test ads work perfectly)
- ✅ Stripe (mock payments for testing)

**Ready Features:**
- ✅ Authentication & user management
- ✅ Wallet with credits economy
- ✅ Ad rewards (test ads)
- ✅ 4 game modes with entry fees
- ✅ Leaderboards & rankings
- ✅ Payment system (test mode)

## 📚 Next Steps

- **Full Guide**: See `COMPLETE_SETUP_GUIDE.md` for detailed instructions
- **Production**: Replace test keys when ready to launch
- **Questions**: Generate more with AI scripts in root folder

## 🐛 Common Issues

**Can't connect to backend?**
- Android Emulator: Use `http://10.0.2.2:3000/api` instead of localhost
- Edit `packages/mobile/src/config/app.ts`

**Database errors?**
- Verify Supabase credentials in `.env`
- Check tables created in Supabase dashboard

**Port 3000 in use?**
- Change `PORT=3001` in backend `.env`
- Update mobile config to match

---

**Need help?** Check `COMPLETE_SETUP_GUIDE.md` for troubleshooting! 🚀
