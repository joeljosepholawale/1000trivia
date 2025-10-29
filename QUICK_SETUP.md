# ⚡ Quick Setup Guide - Get Your App Running in 10 Minutes

## 🎯 **Current Issue**

You're getting: `Error: Missing Supabase configuration`

**Why:** The backend needs a database to store questions and user data.

---

## 🚀 **Option 1: Use Supabase (Recommended - Free & Easy)**

### **Step 1: Create Supabase Account** (2 minutes)

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (fastest) or email
4. Create a new project:
   - **Name:** `1000ravier-dev`
   - **Database Password:** (choose a strong password - save it!)
   - **Region:** Choose closest to you
   - Click "Create new project"

⏳ Wait 2-3 minutes for setup...

### **Step 2: Get Your API Keys** (1 minute)

Once project is ready:

1. Go to **Settings** (⚙️ icon in sidebar)
2. Click **API** tab
3. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGc...
service_role key: eyJhbGc... (click "Reveal" to see it)
```

### **Step 3: Configure Backend** (2 minutes)

Open `.env` file in `packages/backend/.env`:

```bash
# Update these three lines:
SUPABASE_URL=https://xxxxx.supabase.co          # Your Project URL
SUPABASE_SERVICE_KEY=eyJhbGc...                 # Your service_role key
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase  # JWT Secret from same page
```

**How to find JWT Secret:**
- Same API page in Supabase
- Scroll down to "JWT Secret"
- Copy the value

### **Step 4: Create Database Tables** (2 minutes)

In Supabase dashboard:

1. Go to **SQL Editor** (📝 icon)
2. Click **New Query**
3. Paste this SQL:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  credits INTEGER DEFAULT 100,
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  language TEXT DEFAULT 'en',
  difficulty TEXT DEFAULT 'MEDIUM',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game sessions table
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  score INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  credits_earned INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_language ON questions(language);
CREATE INDEX idx_questions_active ON questions(is_active);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_game_sessions_user ON game_sessions(user_id);
```

4. Click **Run** (or F5)
5. Should see: "Success. No rows returned"

### **Step 5: Seed Questions** (1 minute)

Now run the seed command:

```powershell
cd C:\Projects\1000ravier-mobileapp\packages\backend
npm run seed:questions
```

Expected output:
```
🌱 Seeding sample trivia questions...
   Progress: 5/30
   Progress: 10/30
   ...
✅ Sample questions seeded!
   Success: 30
   Errors: 0
```

### **Step 6: Start Backend** (1 minute)

```powershell
npm run dev
```

Expected output:
```
🚀 Server running on http://localhost:3000
✅ Database connected
```

---

## 🚀 **Option 2: Use Local PostgreSQL** (If you prefer)

### **Prerequisites:**
- PostgreSQL installed on your machine
- pgAdmin or similar tool

### **Steps:**

1. **Create database:**
```sql
CREATE DATABASE "1000ravier";
```

2. **Update `.env`:**
```bash
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/1000ravier
SUPABASE_URL=http://localhost:5432
SUPABASE_SERVICE_KEY=local-dev-key
SUPABASE_JWT_SECRET=local-dev-secret
```

3. **Run migrations** (create tables using SQL from Option 1)

4. **Seed questions:**
```powershell
npm run seed:questions
```

---

## 🎯 **Option 3: Skip Database for Now** (Development Only)

If you just want to test the mobile app without backend:

### **Use Mock Data:**

The mobile app already has mock data built-in for:
- ✅ Leaderboards
- ✅ Achievements
- ✅ Challenges
- ✅ Referrals
- ✅ Friends (if you had kept it)

### **To Run:**

```powershell
# Just start the mobile app
cd C:\Projects\1000ravier-mobileapp
npm run mobile:start
```

**Note:** You won't have:
- ❌ Real game questions
- ❌ User authentication
- ❌ Data persistence across devices
- ❌ Payment processing

But you can test **all UI screens** and **see how everything looks**!

---

## ✅ **Recommended Path for Launch**

### **For Development/Testing:**
→ **Option 1: Supabase** (Free tier is generous)

### **For Production Launch:**
→ **Option 1: Supabase** (Scale to paid as needed)
OR
→ **Option 2: Self-hosted PostgreSQL** (More control, more work)

---

## 🔍 **Verify Your Setup**

After setup, test these:

### **1. Backend Health Check:**
```powershell
curl http://localhost:3000/health
```
Should return: `{"status": "ok"}`

### **2. Questions Endpoint:**
```powershell
curl http://localhost:3000/api/questions?limit=5
```
Should return JSON with 5 questions

### **3. Mobile App:**
```powershell
npm run mobile:start
```
Should open Expo and run without errors

---

## 🐛 **Troubleshooting**

### **Error: "Missing Supabase configuration"**
- Check `.env` file exists in `packages/backend/`
- Verify all three values are set (URL, SERVICE_KEY, JWT_SECRET)
- Make sure no quotes around values
- Restart terminal after editing `.env`

### **Error: "Connection refused"**
- Supabase project not ready yet (wait 2-3 minutes)
- Wrong URL copied
- Firewall blocking connection

### **Error: "relation does not exist"**
- Tables not created
- Run the SQL script in Supabase SQL Editor

### **Seed command hangs**
- Database not accessible
- Check Supabase project status
- Verify `.env` configuration

---

## 📊 **What You Get After Setup**

✅ **30 sample questions** in database  
✅ **User system** ready  
✅ **Game sessions** tracking  
✅ **API endpoints** working  
✅ **Mobile app** can fetch real data  

---

## ⚡ **Quick Commands Reference**

```powershell
# Setup (one time)
cd C:\Projects\1000ravier-mobileapp
npm install
npm run seed:questions

# Development (daily use)
npm run backend:dev    # Terminal 1
npm run mobile:start   # Terminal 2

# Testing
curl http://localhost:3000/health
curl http://localhost:3000/api/questions
```

---

## 🎊 **Next Steps After Setup**

1. ✅ Backend running with database
2. ✅ Questions seeded
3. ✅ Mobile app connected
4. 🎮 **Play your first game!**
5. 🚀 **Add more questions** (see QUESTION_SYSTEM_GUIDE.md)
6. 🎨 **Customize the app**
7. 📱 **Test on real device**
8. 🌍 **Deploy to production**

---

## 💡 **Pro Tips**

1. **Use Supabase free tier** - Perfect for development and early launch
2. **Seed questions incrementally** - Start with 30, add more as you test
3. **Test mobile app first** - Make sure UI works before worrying about backend
4. **Use mock data** - Built into the app for offline development
5. **Deploy backend to Vercel/Railway** - Free hosting for small apps

---

## 🆘 **Still Stuck?**

Check these files for more info:
- `LAUNCH_READINESS.md` - Complete feature overview
- `QUESTION_SYSTEM_GUIDE.md` - Question management
- `packages/backend/.env.example` - Configuration template

---

**Setup time: 10 minutes** ⏱️  
**Result: Fully working app** ✅  
**Cost: $0** (Supabase free tier) 💰
