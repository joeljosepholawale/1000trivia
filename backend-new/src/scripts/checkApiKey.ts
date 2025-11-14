import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function checkApiKey() {
  console.log('🔍 Checking Gemini API Key Status...\n');

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found');
    process.exit(1);
  }

  console.log('✅ API Key found');
  console.log(`🔑 Key: ${apiKey.substring(0, 15)}...\n`);

  // Try to list available models
  console.log('📋 Attempting to list available models...\n');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      
      if (response.status === 403) {
        console.log('\n💡 Your API key appears to be invalid or not activated.');
        console.log('\nSteps to fix:');
        console.log('1. Go to: https://aistudio.google.com/app/apikey');
        console.log('2. Delete your current API key');
        console.log('3. Create a NEW API key');
        console.log('4. Make sure you see "Generative Language API" is enabled');
        console.log('5. Copy the new key to your .env file\n');
      }
      
      process.exit(1);
    }

    const data: any = await response.json();
    
    console.log('✅ API Connection Successful!\n');
    console.log('📋 Available Models:\n');
    
    if (data.models && data.models.length > 0) {
      data.models.forEach((model: any) => {
        console.log(`   • ${model.name}`);
        if (model.displayName) console.log(`     Display Name: ${model.displayName}`);
        if (model.description) console.log(`     ${model.description.substring(0, 80)}...`);
        console.log('');
      });
      
      console.log(`\n🎉 Total: ${data.models.length} models available\n`);
      
      // Find the best model to use
      const flashModel = data.models.find((m: any) => m.name.includes('gemini-1.5-flash'));
      const proModel = data.models.find((m: any) => m.name.includes('gemini-1.5-pro'));
      const geminiPro = data.models.find((m: any) => m.name.includes('gemini-pro'));
      
      console.log('💡 Recommended models for your app:');
      if (flashModel) {
        const modelName = flashModel.name.split('/')[1];
        console.log(`   1. ${modelName} (fastest, cheapest)`);
      }
      if (proModel) {
        const modelName = proModel.name.split('/')[1];
        console.log(`   2. ${modelName} (more capable)`);
      }
      if (geminiPro) {
        const modelName = geminiPro.name.split('/')[1];
        console.log(`   3. ${modelName} (fallback)`);
      }
      
    } else {
      console.log('⚠️ No models found. Your API key may not have access to Gemini models.');
    }

  } catch (error) {
    console.error('❌ Error checking API:', error);
    console.log('\n💡 Make sure:');
    console.log('1. You have internet connection');
    console.log('2. Your API key is from: https://aistudio.google.com/app/apikey');
    console.log('3. The Generative Language API is enabled\n');
  }
}

checkApiKey();
