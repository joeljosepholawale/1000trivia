# 🇩🇪 German Questions Generation Guide

## Overview
Per the specification, ALL questions must be in **German language** with a target of **5,000+ questions** before launch.

## Current Status
- ✅ Question generator configured for German
- ✅ Seeding script accepts language parameter
- ⚠️ Need to generate German questions (currently only 30 English sample questions)

---

## How to Generate German Questions

### Option 1: Using AI Generator (Recommended)

**Prerequisites:**
```bash
# Set your Google Cloud API key
export GOOGLE_CLOUD_API_KEY="your-api-key-here"
```

**Generate questions:**
```bash
# From project root
node generate_questions.js
```

This will:
- Generate 30 German trivia questions
- Output JSON to console
- Save to a file if you redirect output

**To generate multiple batches:**
```bash
# Generate and save to file
node generate_questions.js > german_questions_batch1.json

# Generate more batches
node generate_questions.js > german_questions_batch2.json
node generate_questions.js > german_questions_batch3.json
# ... repeat until you have 5000+
```

### Option 2: Industry-Specific Questions

```bash
node industry_specific_questions.js > german_industry_questions.json
```

---

## How to Seed German Questions

### Seed from JSON file:

```bash
cd packages/backend

# Seed German questions from file
npm run ts-node src/scripts/seedQuestions.ts ../../german_questions_batch1.json de general

# Seed more batches
npm run ts-node src/scripts/seedQuestions.ts ../../german_questions_batch2.json de science
npm run ts-node src/scripts/seedQuestions.ts ../../german_questions_batch3.json de history
```

**Arguments:**
1. File path (JSON file with questions)
2. Language code (`de` for German)
3. Category (e.g., `general`, `science`, `history`, `sports`)

---

## Question Format

German questions must follow this JSON structure:

```json
[
  {
    "Question": "Was ist die Hauptstadt von Frankreich?",
    "Answer": "Paris",
    "Options": ["London", "Paris", "Berlin"]
  },
  {
    "Question": "Wer malte die Mona Lisa?",
    "Answer": "Leonardo da Vinci",
    "Options": ["Michelangelo", "Leonardo da Vinci", "Raphael"]
  }
]
```

**Requirements:**
- `Question`: The question text in German
- `Answer`: The correct answer (must be one of the Options)
- `Options`: Array of exactly 3 options (includes the correct answer)

---

## Recommended Categories

To reach 5,000+ questions, generate in these categories:

| Category | Target Questions | Command |
|----------|------------------|---------|
| General Knowledge | 1500 | `... general` |
| Science & Technology | 1000 | `... science` |
| History & Culture | 1000 | `... history` |
| Sports & Entertainment | 500 | `... sports` |
| Geography | 500 | `... geography` |
| Current Events | 500 | `... current_events` |

---

## Verification Checklist

After seeding, verify in Supabase:

1. Go to Supabase → Table Editor → `questions`
2. Filter by `language = 'de'`
3. Check count: Should have 5,000+ rows
4. Verify `is_active = true`
5. Check variety: Multiple categories represented

---

## Quality Checks

Before seeding, ensure questions:
- ✅ Are in proper German (not machine-translated)
- ✅ Have exactly 3 options
- ✅ Include the correct answer in options
- ✅ Are culturally appropriate
- ✅ Match difficulty: Easy (60%), Medium (30%), Hard (10%)
- ✅ No duplicates

---

## Tips for Large-Scale Generation

### Generate in batches:
```bash
# Script to generate 100 batches (3000 questions)
for i in {1..100}; do
  echo "Generating batch $i..."
  node generate_questions.js > german_batch_$i.json
  sleep 2  # Rate limiting
done
```

### Seed all batches:
```bash
# Seed all generated batches
for file in german_batch_*.json; do
  echo "Seeding $file..."
  npm run ts-node src/scripts/seedQuestions.ts ../../$file de general
done
```

---

## Current Progress Tracking

Create a tracking file to monitor progress:

```bash
# Check current German question count in database
supabase sql --project-ref YOUR_PROJECT \
  "SELECT COUNT(*) FROM questions WHERE language = 'de'"
```

**Target:** 5,000+ questions minimum
**Recommended:** 10,000+ questions for better variety

---

## Next Steps

1. **Immediate (Today):**
   - [ ] Generate first batch of 30 German questions
   - [ ] Test seeding process
   - [ ] Verify questions appear in database

2. **Short-term (This Week):**
   - [ ] Generate 1,000 German questions across categories
   - [ ] Seed and verify in database
   - [ ] Test game play with German questions

3. **Before Launch:**
   - [ ] Reach 5,000+ German questions
   - [ ] Quality review of random sample
   - [ ] Balance difficulty levels
   - [ ] Remove any duplicates

---

## Troubleshooting

**Q: Generator produces English questions**
- Check `generate_questions.js` line 29: Should say "GERMAN language"
- Check prompt at line 400: Should say "in GERMAN language"

**Q: Seeding fails**
- Verify JSON format is correct
- Check that answers are in the options array
- Ensure exactly 3 options per question

**Q: Questions not appearing in game**
- Check `is_active = true` in database
- Verify `language = 'de'` matches backend query
- Ensure period is active for the game mode

---

## Support

If you need help:
1. Check logs: `packages/backend/logs/`
2. Review seeding output for errors
3. Verify database connection
4. Check Supabase dashboard for question count

---

**Last Updated:** 2024
**Status:** Ready for German question generation
