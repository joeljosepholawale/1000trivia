import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

async function testGeminiAPI() {
  console.log('🧪 Testing Gemini AI API Connection\n');

  // Check for API key
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables\n');
    console.log('📋 Setup Instructions:');
    console.log('1. Get your API key from: https://makersuite.google.com/app/apikey');
    console.log('2. Create/edit backend-new/.env file');
    console.log('3. Add this line: GEMINI_API_KEY=your-key-here\n');
    process.exit(1);
  }

  console.log('✅ API Key found');
  console.log('🔑 Key starts with:', process.env.GEMINI_API_KEY.substring(0, 10) + '...\n');

  try {
    console.log('🤖 Initializing Gemini AI...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use Gemini 2.5 Flash - fastest and most cost-effective
    const modelName = 'gemini-2.5-flash';
    console.log(`Using model: ${modelName}\n`);
    const model = genAI.getGenerativeModel({ model: modelName });

    console.log('📝 Generating 5 test trivia questions...\n');

    const prompt = `Generate exactly 5 high-quality trivia questions in English.

IMPORTANT:
- Return ONLY a valid JSON array
- No markdown code blocks
- Exactly 5 questions
- Mix of Easy, Medium, and Difficult
- Exactly 3 options per question (including the correct answer)

Example format:
[
  {
    "Question": "Your question here?",
    "Answer": "Correct answer",
    "Options": ["Option 1", "Correct answer", "Option 3"],
    "Difficulty": "Medium"
  }
]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('📦 Raw AI Response:');
    console.log('─'.repeat(60));
    console.log(text.substring(0, 500) + (text.length > 500 ? '...' : ''));
    console.log('─'.repeat(60));
    console.log('');

    // Parse response
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/^```json\s*/i, '');
    cleanedText = cleanedText.replace(/^```\s*/i, '');
    cleanedText = cleanedText.replace(/```\s*$/i, '');
    cleanedText = cleanedText.trim();

    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('❌ No JSON array found in response');
      process.exit(1);
    }

    const questions = JSON.parse(jsonMatch[0]);

    console.log(`✅ Successfully parsed ${questions.length} questions\n`);

    // Display questions
    questions.forEach((q: any, index: number) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Question ${index + 1} [${q.Difficulty?.toUpperCase() || 'UNKNOWN'}]`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`\n📖 ${q.Question}`);
      console.log(`\n   Options:`);
      if (Array.isArray(q.Options)) {
        q.Options.forEach((opt: string, i: number) => {
          const isCorrect = opt === q.Answer;
          console.log(`   ${i + 1}. ${opt} ${isCorrect ? '✓ (Correct)' : ''}`);
        });
      } else {
        console.log('   ⚠️ Options not in array format');
      }
      console.log('');
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 Test completed successfully!');
    console.log('\nDifficulty distribution:');
    const easy = questions.filter((q: any) => q.Difficulty === 'Easy').length;
    const medium = questions.filter((q: any) => q.Difficulty === 'Medium').length;
    const difficult = questions.filter((q: any) => q.Difficulty === 'Difficult').length;
    console.log(`   Easy: ${easy}`);
    console.log(`   Medium: ${medium}`);
    console.log(`   Difficult: ${difficult}`);
    console.log('\n✅ Gemini AI is working correctly!\n');

  } catch (error) {
    console.error('\n❌ Error testing Gemini AI:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      
      if (error.message.includes('API_KEY_INVALID')) {
        console.log('\n💡 Your API key appears to be invalid.');
        console.log('Please get a new key from: https://makersuite.google.com/app/apikey');
      } else if (error.message.includes('QUOTA_EXCEEDED')) {
        console.log('\n💡 You have exceeded your API quota.');
        console.log('Free tier: 15 requests/minute, 1,500/day');
        console.log('Wait a few minutes and try again.');
      }
    }
    process.exit(1);
  }
}

testGeminiAPI();
