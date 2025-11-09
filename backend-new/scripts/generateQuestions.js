const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_CLOUD_API_KEY);

// Categories and their topics
const CATEGORIES = {
  'General Knowledge': ['history', 'geography', 'science', 'culture', 'current events'],
  'Science': ['physics', 'chemistry', 'biology', 'astronomy', 'technology'],
  'History': ['ancient history', 'modern history', 'world wars', 'famous figures', 'civilizations'],
  'Geography': ['countries', 'capitals', 'landmarks', 'continents', 'natural wonders'],
  'Sports': ['football', 'basketball', 'olympics', 'tennis', 'athletics'],
  'Entertainment': ['movies', 'music', 'celebrities', 'TV shows', 'awards'],
  'Literature': ['classic books', 'authors', 'poetry', 'modern literature', 'genres'],
  'Technology': ['computers', 'internet', 'innovations', 'AI', 'gadgets']
};

// Difficulty distribution
const DIFFICULTIES = {
  easy: 0.4,      // 40% easy
  medium: 0.35,   // 35% medium
  hard: 0.25      // 25% hard
};

const SYSTEM_PROMPT = `You are an expert trivia question creator. Generate high-quality, engaging trivia questions in ENGLISH language.

Requirements:
- All questions and answers MUST be in English
- Questions should be clear, unambiguous, and interesting
- Avoid overly obscure or niche topics
- Ensure one answer is definitively correct
- Make wrong answers plausible but clearly incorrect
- Use proper grammar and spelling
- Balance difficulty appropriately
- Cover diverse subtopics within each category

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correctAnswer": "Paris",
      "category": "Geography",
      "difficulty": "easy",
      "explanation": "Paris has been the capital of France since 987 AD."
    }
  ]
}`;

/**
 * Generate questions using Gemini AI
 */
async function generateQuestionsWithAI(count = 30) {
  try {
    console.log(`\n🤖 Generating ${count} trivia questions using Gemini AI...\n`);

    // Calculate difficulty distribution
    const easyCount = Math.floor(count * DIFFICULTIES.easy);
    const mediumCount = Math.floor(count * DIFFICULTIES.medium);
    const hardCount = count - easyCount - mediumCount;

    // Select random categories
    const categoryKeys = Object.keys(CATEGORIES);
    const questionsPerCategory = Math.ceil(count / categoryKeys.length);

    const prompt = `Generate ${count} trivia questions in English with the following distribution:
- ${easyCount} easy questions
- ${mediumCount} medium questions  
- ${hardCount} hard questions

Categories to cover (distribute evenly):
${categoryKeys.map(cat => `- ${cat}: ${CATEGORIES[cat].join(', ')}`).join('\n')}

Generate approximately ${questionsPerCategory} questions per category.

Requirements:
- All content MUST be in English language
- Each question must have exactly 4 answer options
- One answer must be correct
- Include a brief explanation for each answer
- Make questions engaging and educational
- Avoid repetition and ensure variety

Return ONLY the JSON object with the questions array. No additional text.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up the response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse JSON
    const data = JSON.parse(text);
    
    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid response format from AI');
    }

    // Validate and format questions
    const validatedQuestions = data.questions.map((q, index) => {
      if (!q.question || !q.options || !q.correctAnswer || !q.category || !q.difficulty) {
        throw new Error(`Question ${index + 1} is missing required fields`);
      }

      if (q.options.length !== 4) {
        throw new Error(`Question ${index + 1} must have exactly 4 options`);
      }

      if (!q.options.includes(q.correctAnswer)) {
        throw new Error(`Question ${index + 1}: correct answer not found in options`);
      }

      return {
        question: q.question.trim(),
        options: q.options.map(opt => opt.trim()),
        correctAnswer: q.correctAnswer.trim(),
        category: q.category.trim(),
        difficulty: q.difficulty.toLowerCase().trim(),
        explanation: q.explanation?.trim() || '',
        createdBy: 'AI_Generator',
        isActive: true,
        language: 'en'
      };
    });

    console.log(`✅ Successfully generated ${validatedQuestions.length} questions\n`);
    
    // Print summary
    const summary = {
      easy: validatedQuestions.filter(q => q.difficulty === 'easy').length,
      medium: validatedQuestions.filter(q => q.difficulty === 'medium').length,
      hard: validatedQuestions.filter(q => q.difficulty === 'hard').length
    };

    console.log('📊 Question Distribution:');
    console.log(`   Easy: ${summary.easy}`);
    console.log(`   Medium: ${summary.medium}`);
    console.log(`   Hard: ${summary.hard}\n`);

    return validatedQuestions;

  } catch (error) {
    console.error('❌ Error generating questions:', error.message);
    throw error;
  }
}

/**
 * Save questions to JSON file
 */
function saveQuestionsToFile(questions, filename = 'generated_questions.json') {
  const outputDir = path.join(__dirname, 'output');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify({ questions }, null, 2));
  
  console.log(`💾 Questions saved to: ${filepath}\n`);
  return filepath;
}

/**
 * Main execution
 */
async function main() {
  try {
    // Check for API key
    if (!process.env.GOOGLE_CLOUD_API_KEY) {
      console.error('❌ Error: GOOGLE_CLOUD_API_KEY not found in environment variables');
      console.log('\nPlease add your Google AI API key to the .env file:');
      console.log('GOOGLE_CLOUD_API_KEY=your_api_key_here\n');
      console.log('Get your API key from: https://makersuite.google.com/app/apikey\n');
      process.exit(1);
    }

    const questionCount = parseInt(process.argv[2]) || 30;
    
    console.log('╔══════════════════════════════════════════╗');
    console.log('║  English Trivia Question Generator       ║');
    console.log('║  Using Google Gemini AI                  ║');
    console.log('╚══════════════════════════════════════════╝');

    const questions = await generateQuestionsWithAI(questionCount);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `questions_${timestamp}.json`;
    
    const filepath = saveQuestionsToFile(questions, filename);
    
    console.log('✨ Generation complete!\n');
    console.log('📝 Next steps:');
    console.log('   1. Review the generated questions');
    console.log('   2. Run the seed script to add them to the database:');
    console.log(`      npm run seed:questions -- ${filepath}\n`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateQuestionsWithAI, saveQuestionsToFile };
