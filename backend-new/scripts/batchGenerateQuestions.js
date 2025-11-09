const { generateQuestionsWithAI, saveQuestionsToFile } = require('./generateQuestions');

/**
 * Generate multiple batches of questions with rate limiting
 */
async function batchGenerate(totalQuestions = 1000, batchSize = 30) {
  try {
    const totalBatches = Math.ceil(totalQuestions / batchSize);
    const allQuestions = [];
    
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  Batch English Question Generation           ║');
    console.log('╚══════════════════════════════════════════════╝\n');
    console.log(`📊 Configuration:`);
    console.log(`   Total Questions: ${totalQuestions}`);
    console.log(`   Batch Size: ${batchSize}`);
    console.log(`   Number of Batches: ${totalBatches}`);
    console.log(`   Rate Limit: 1 request per minute (Gemini API)\n`);
    
    for (let i = 0; i < totalBatches; i++) {
      const batchNumber = i + 1;
      const questionsInBatch = Math.min(batchSize, totalQuestions - (i * batchSize));
      
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📦 Batch ${batchNumber}/${totalBatches} (${questionsInBatch} questions)`);
      console.log('='.repeat(50));
      
      try {
        const questions = await generateQuestionsWithAI(questionsInBatch);
        allQuestions.push(...questions);
        
        // Save individual batch
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        saveQuestionsToFile(questions, `batch_${batchNumber}_${timestamp}.json`);
        
        console.log(`✅ Batch ${batchNumber} completed. Total so far: ${allQuestions.length}`);
        
        // Rate limiting: wait 65 seconds between batches (Gemini free tier: 60 requests per minute)
        if (i < totalBatches - 1) {
          console.log('\n⏳ Waiting 65 seconds before next batch (API rate limit)...');
          await new Promise(resolve => setTimeout(resolve, 65000));
        }
        
      } catch (error) {
        console.error(`❌ Error in batch ${batchNumber}:`, error.message);
        console.log('⚠️  Continuing with next batch...\n');
      }
    }
    
    // Save all questions combined
    const finalTimestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filepath = saveQuestionsToFile(allQuestions, `all_questions_${finalTimestamp}.json`);
    
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║  Batch Generation Complete!                  ║');
    console.log('╚══════════════════════════════════════════════╝\n');
    console.log(`📊 Final Statistics:`);
    console.log(`   Total Questions Generated: ${allQuestions.length}`);
    console.log(`   Successful Batches: ${totalBatches}`);
    console.log(`   Combined File: ${filepath}\n`);
    
    // Category distribution
    const categoryCount = {};
    const difficultyCount = { easy: 0, medium: 0, hard: 0 };
    
    allQuestions.forEach(q => {
      categoryCount[q.category] = (categoryCount[q.category] || 0) + 1;
      difficultyCount[q.difficulty] = (difficultyCount[q.difficulty] || 0) + 1;
    });
    
    console.log('📈 Distribution:');
    console.log('\n   By Difficulty:');
    Object.entries(difficultyCount).forEach(([diff, count]) => {
      const percentage = ((count / allQuestions.length) * 100).toFixed(1);
      console.log(`   - ${diff.charAt(0).toUpperCase() + diff.slice(1)}: ${count} (${percentage}%)`);
    });
    
    console.log('\n   By Category:');
    Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        const percentage = ((count / allQuestions.length) * 100).toFixed(1);
        console.log(`   - ${cat}: ${count} (${percentage}%)`);
      });
    
    console.log('\n✨ Ready to seed into database!');
    console.log(`   Run: npm run seed:questions -- ${filepath}\n`);
    
    return allQuestions;
    
  } catch (error) {
    console.error('\n❌ Fatal error in batch generation:', error.message);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const totalQuestions = parseInt(args[0]) || 1000;
  const batchSize = parseInt(args[1]) || 30;
  
  if (totalQuestions > 10000) {
    console.warn('⚠️  Warning: Generating more than 10,000 questions may take several hours');
    console.log('    and may hit API rate limits. Consider running in smaller batches.\n');
  }
  
  await batchGenerate(totalQuestions, batchSize);
}

if (require.main === module) {
  main();
}

module.exports = { batchGenerate };
