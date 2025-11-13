import dotenv from 'dotenv';
import { geminiQuestionService } from '../services/geminiQuestions';

// Load environment variables
dotenv.config();

async function testGeminiQuestions() {
  console.log('🧪 Testing Gemini AI Question Generation\n');

  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    console.log('\nPlease add GEMINI_API_KEY to your .env file');
    console.log('Get your API key from: https://makersuite.google.com/app/apikey');
    process.exit(1);
  }

  try {
    console.log('📝 Generating 10 test questions...\n');

    const questions = await geminiQuestionService.generateQuestions(
      10,  // count
      'general',  // category
      'en'  // language
    );

    console.log(`✅ Successfully generated ${questions.length} questions\n`);

    // Display questions
    questions.forEach((q, index) => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Question ${index + 1} [${q.difficulty.toUpperCase()}]`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`\n📖 ${q.text}`);
      console.log(`\n   Options:`);
      q.options.forEach((opt, i) => {
        const isCorrect = opt === q.correct_answer;
        console.log(`   ${i + 1}. ${opt} ${isCorrect ? '✓ (Correct)' : ''}`);
      });
      console.log(`\n   Category: ${q.category}`);
      console.log(`   Language: ${q.language}`);
    });

    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 Test completed successfully!');
    console.log('\nDifficulty distribution:');
    const easy = questions.filter(q => q.difficulty === 'easy').length;
    const medium = questions.filter(q => q.difficulty === 'medium').length;
    const difficult = questions.filter(q => q.difficulty === 'difficult').length;
    console.log(`   Easy: ${easy}`);
    console.log(`   Medium: ${medium}`);
    console.log(`   Difficult: ${difficult}`);

  } catch (error) {
    console.error('❌ Error testing Gemini questions:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

async function testGenerateAndSave() {
  console.log('\n🧪 Testing Generate and Save to Database\n');

  try {
    console.log('📝 Generating and saving 30 questions...\n');

    const result = await geminiQuestionService.generateAndSaveQuestions(
      30,  // count
      'general',  // category
      'en'  // language
    );

    if (result.success) {
      console.log(`\n✅ Successfully saved ${result.count} questions to database`);
    } else {
      console.error(`\n❌ Failed to save questions: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Error in generate and save test:', error);
    process.exit(1);
  }
}

// Main execution
const command = process.argv[2];

if (command === 'save') {
  testGenerateAndSave();
} else {
  testGeminiQuestions();
}
