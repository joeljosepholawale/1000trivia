import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

async function listAvailableModels() {
  console.log('🔍 Checking available Gemini models...\n');

  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found');
    process.exit(1);
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try different model names
    const modelNamesToTry = [
      'gemini-pro',
      'gemini-1.0-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'models/gemini-pro',
      'models/gemini-1.5-pro',
    ];

    console.log('Testing different model names:\n');

    for (const modelName of modelNamesToTry) {
      try {
        console.log(`Testing: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say "test" if you can read this');
        const text = await result.response.text();
        console.log(`✅ ${modelName} - WORKS! Response: ${text.substring(0, 50)}\n`);
        break; // Found a working model
      } catch (error: any) {
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          console.log(`❌ ${modelName} - Not available\n`);
        } else {
          console.log(`⚠️ ${modelName} - Error: ${error.message?.substring(0, 100)}\n`);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

listAvailableModels();
