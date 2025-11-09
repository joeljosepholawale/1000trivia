# Question Generation Scripts

Generate high-quality English trivia questions using Google's Gemini AI.

## Quick Start

### 1. Setup (One-time)

```powershell
# Install dependencies
npm install

# Get Google AI API key from: https://makersuite.google.com/app/apikey
# Add to backend-new/.env:
GOOGLE_CLOUD_API_KEY=your_api_key_here
```

### 2. Generate Questions

**Single batch (30 questions):**
```powershell
npm run generate:questions
```

**Multiple batches (1000 questions):**
```powershell
npm run generate:batch 1000 30
```

### 3. Seed to Database

```powershell
npm run seed:questions -- scripts/output/all_questions_*.json
```

## Files

- **generateQuestions.js** - Core generation logic with Gemini AI
- **batchGenerateQuestions.js** - Batch processing with rate limiting
- **output/** - Generated JSON files (created automatically)

## Features

✅ **English language** questions  
✅ **8 categories**: General Knowledge, Science, History, Geography, Sports, Entertainment, Literature, Technology  
✅ **3 difficulties**: Easy (40%), Medium (35%), Hard (25%)  
✅ **Automatic validation** of format and answers  
✅ **Rate limiting** to respect API quotas  
✅ **Batch processing** for large datasets  

## Examples

```powershell
# Generate 50 questions
npm run generate:questions 50

# Generate 5000 questions in batches of 30
npm run generate:batch 5000 30

# Generate 100 questions for testing
npm run generate:questions 100
```

## Output Format

```json
{
  "questions": [
    {
      "question": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correctAnswer": "Paris",
      "category": "Geography",
      "difficulty": "easy",
      "explanation": "Paris has been the capital since 987 AD.",
      "createdBy": "AI_Generator",
      "isActive": true,
      "language": "en"
    }
  ]
}
```

## Rate Limits

- **Gemini Free Tier**: 60 requests/minute
- **Daily Quota**: 1,500 requests/day
- **Batch Script**: Waits 65 seconds between batches

## Need Help?

See the comprehensive guide: [QUESTION_GENERATION_GUIDE.md](../../QUESTION_GENERATION_GUIDE.md)

---

**Language**: All questions are generated in **English** 🇺🇸
