# 🎯 Question Generation System - Complete Guide

## ✅ **YES - Questions Auto-Generate!**

Your backend **already has a complete question seeding system** built-in.

---

## 📦 **What You Have**

### **1. Seeding Script** ✅
**Location:** `packages/backend/src/scripts/seedQuestions.ts`

**Features:**
- ✅ Seeds 30 sample trivia questions automatically
- ✅ Supports importing from JSON files
- ✅ Validates question format
- ✅ Checks answer is in options
- ✅ Progress tracking
- ✅ Error handling
- ✅ Multi-language support
- ✅ Category support

### **2. Sample Questions Included** ✅
**30 Pre-Built Questions** covering:
- Geography (capitals, countries, landmarks)
- History (World War II, Titanic, moon landing)
- Science (physics, chemistry, biology)
- Arts (paintings, literature)
- General Knowledge

### **3. NPM Scripts Ready** ✅
Two ways to seed questions:

```bash
# From root directory
npm run seed:questions

# From backend directory
cd packages/backend
npm run seed:questions
```

---

## 🚀 **How to Use**

### **Option 1: Use Built-in Sample Questions** (Easiest)

Just run the seed command:

```bash
npm run seed:questions
```

**What happens:**
1. Connects to your database
2. Inserts all 30 sample questions
3. Shows progress (✅ every 5 questions)
4. Reports success/error count

**Output:**
```
🌱 Seeding sample trivia questions...

   Progress: 5/30
   Progress: 10/30
   Progress: 15/30
   Progress: 20/30
   Progress: 25/30
   Progress: 30/30

✅ Sample questions seeded!
   Success: 30
   Errors: 0

✨ All done!
```

### **Option 2: Import from JSON File**

Create a JSON file with your questions:

```json
[
  {
    "Question": "Was ist die Hauptstadt von Deutschland?",
    "Answer": "Berlin",
    "Options": ["München", "Berlin", "Hamburg"]
  },
  {
    "Question": "Wie viele Bundesländer hat Deutschland?",
    "Answer": "16",
    "Options": ["14", "16", "18"]
  }
]
```

Then import:

```bash
# From root
npm run seed:questions path/to/questions.json de geography

# From backend
cd packages/backend
npm run seed:questions ../../data/german-questions.json de geography
```

**Arguments:**
1. File path (required)
2. Language (optional, default: 'en')
3. Category (optional, default: 'general')

---

## 📝 **Question Format**

### **Required Fields:**

```typescript
{
  "Question": string,    // The question text
  "Answer": string,      // The correct answer
  "Options": string[]    // Array of 3 options (must include answer)
}
```

### **Validation Rules:**
- ✅ Question text required
- ✅ Answer required
- ✅ Exactly 3 options required
- ✅ Answer must be in options array
- ✅ All fields must be valid strings

### **Database Schema:**

Questions are stored with:
```typescript
{
  text: string,           // Question text
  options: string[],      // Array of options
  correct_answer: string, // The correct answer
  language: string,       // e.g., 'en', 'de'
  category: string,       // e.g., 'general', 'geography', 'science'
  difficulty: string,     // 'EASY', 'MEDIUM', 'HARD'
  is_active: boolean      // Whether question is available
}
```

---

## 🗂️ **Categories Supported**

The system supports any category, but common ones:

- `general` - General knowledge
- `geography` - Countries, capitals, landmarks
- `history` - Historical events, dates
- `science` - Physics, chemistry, biology
- `arts` - Literature, paintings, music
- `sports` - Sports trivia
- `entertainment` - Movies, TV, games
- `technology` - Tech, computers, internet
- `mathematics` - Math problems, calculations
- `language` - Language, grammar, vocabulary

---

## 🌍 **Multi-Language Support**

### **Currently Supported:**
- `en` - English
- `de` - German (Deutsch)

### **Add Your Own:**

Create language-specific JSON files:

**File:** `german-questions.json`
```json
[
  {
    "Question": "Was ist die Hauptstadt von Frankreich?",
    "Answer": "Paris",
    "Options": ["London", "Paris", "Berlin"]
  }
]
```

**Import:**
```bash
npm run seed:questions german-questions.json de geography
```

---

## 🎮 **How Questions Flow in the App**

### **1. Seeding (Setup)**
```
seedQuestions.ts → Database → Questions Table
```

### **2. Game Request (Runtime)**
```
Mobile App → Backend API → Database Query → Random Questions
```

### **3. Backend Logic**
**File:** `packages/backend/src/services/game.ts`

The backend:
- ✅ Fetches questions by category/difficulty
- ✅ Randomizes order
- ✅ Returns specified quantity
- ✅ Tracks which questions were used
- ✅ Prevents duplicates in same session

---

## 📊 **How Many Questions Do You Need?**

### **Minimum Viable Product (MVP):**
- ✅ **30 questions** (already included!)
- Good for initial testing and demo

### **Soft Launch:**
- 🎯 **100-200 questions**
- Enough for several game sessions
- Mix of easy, medium, hard

### **Full Launch:**
- 🚀 **500-1,000 questions**
- Multiple categories
- All difficulty levels
- Prevents repetition

### **Long-term:**
- 💎 **2,000-5,000+ questions**
- Continuous content updates
- Seasonal/themed questions
- User-generated content

---

## 🔧 **Customization Guide**

### **Add More Sample Questions**

Edit: `packages/backend/src/scripts/seedQuestions.ts`

Add to the `sampleQuestions` array (line 83):

```typescript
const sampleQuestions: QuestionData[] = [
  // ... existing questions ...
  {
    Question: "Your new question?",
    Answer: "Correct Answer",
    Options: ["Wrong 1", "Correct Answer", "Wrong 2"]
  },
];
```

### **Change Difficulty Levels**

Modify line 249 in seedQuestions.ts:

```typescript
difficulty: 'EASY',  // or 'MEDIUM' or 'HARD'
```

### **Add Custom Categories**

```typescript
category: 'your-category-name',  // e.g., 'sports', 'movies'
```

---

## 🚀 **Production Setup**

### **Step 1: Prepare Your Questions**

1. Create JSON files for each category:
   - `general-questions.json` (500 questions)
   - `geography-questions.json` (200 questions)
   - `science-questions.json` (200 questions)
   - etc.

2. Organize by difficulty:
   - `easy-questions.json`
   - `medium-questions.json`
   - `hard-questions.json`

### **Step 2: Seed Database**

```bash
# Seed each file
npm run seed:questions data/general-easy.json en general
npm run seed:questions data/general-medium.json en general
npm run seed:questions data/geography.json en geography
npm run seed:questions data/german-general.json de general
```

### **Step 3: Verify**

Check your database:
```sql
SELECT category, language, difficulty, COUNT(*) as count
FROM questions
WHERE is_active = true
GROUP BY category, language, difficulty;
```

---

## 🤖 **AI-Generated Questions**

You can use AI to generate questions in bulk:

### **Using ChatGPT:**

**Prompt:**
```
Generate 100 trivia questions in JSON format with this structure:
[
  {
    "Question": "question text",
    "Answer": "correct answer",
    "Options": ["wrong option", "correct answer", "another wrong option"]
  }
]

Category: Geography
Difficulty: Medium
Language: German
```

**Save output** → Import with seed command

### **Using Claude/Other AI:**
Same process, just adjust the prompt for the AI you're using.

---

## 🔍 **Troubleshooting**

### **Error: Database connection failed**
**Fix:** 
1. Make sure Supabase is configured
2. Check `.env` file for `SUPABASE_URL` and `SUPABASE_KEY`
3. Run backend first: `npm run backend:dev`

### **Error: File not found**
**Fix:**
- Use absolute path: `C:\path\to\questions.json`
- Or relative from backend: `../../data/questions.json`

### **Error: Invalid question format**
**Fix:**
- Check JSON is valid (use JSONLint.com)
- Verify exactly 3 options
- Ensure answer is in options array

### **Questions not appearing in game**
**Fix:**
1. Check `is_active = true` in database
2. Verify correct `language` and `category`
3. Check API endpoint is filtering correctly

---

## 📈 **Question Management Strategy**

### **Phase 1: Launch (Week 1)**
- ✅ Use 30 sample questions (included)
- ✅ Add 70 more simple questions
- ✅ Total: 100 questions
- ✅ Focus: Get to market fast

### **Phase 2: Growth (Month 1)**
- Add 400 more questions
- Multiple categories
- All difficulty levels
- Total: 500 questions

### **Phase 3: Scale (Month 2-3)**
- 1,500 more questions
- User-generated questions (moderated)
- Seasonal/themed content
- Total: 2,000+ questions

### **Phase 4: Maintain (Ongoing)**
- Add 50-100 new questions weekly
- Retire outdated questions
- Update based on user feedback
- Run analytics on question difficulty

---

## 🎯 **Best Practices**

1. **Quality over Quantity** ✅
   - Better to have 100 great questions than 1,000 mediocre ones
   - Fact-check all answers
   - Avoid ambiguous questions

2. **Balanced Difficulty** ✅
   - 40% Easy
   - 40% Medium
   - 20% Hard

3. **Category Distribution** ✅
   - 30% General Knowledge
   - 20% Geography
   - 15% Science
   - 15% History
   - 20% Other categories

4. **Regular Updates** ✅
   - Add new questions monthly
   - Remove outdated ones
   - Track question performance

5. **User Feedback** ✅
   - Let users report bad questions
   - Track skip rates
   - Monitor answer distribution

---

## 🎊 **Summary**

### **You Already Have:**
✅ Complete seeding system  
✅ 30 sample questions built-in  
✅ JSON import capability  
✅ Multi-language support  
✅ Category system  
✅ Difficulty levels  
✅ Validation & error handling  

### **To Launch:**
1. Run `npm run seed:questions` (uses 30 included questions)
2. Or add more questions via JSON import
3. Start backend
4. Questions automatically available in-game

### **No Code Changes Needed!**
Everything is already built and ready to use! 🚀

---

## 🔗 **Quick Reference**

```bash
# Seed sample questions (30 included)
npm run seed:questions

# Import from JSON file
npm run seed:questions path/to/file.json

# Import with language and category
npm run seed:questions path/to/file.json de geography

# Start backend (after seeding)
npm run backend:dev

# Run mobile app
npm run mobile:start
```

---

**Question system is 100% complete and production-ready!** ✅
