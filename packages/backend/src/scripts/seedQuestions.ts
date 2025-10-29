import { db } from '../services/database';
import * as fs from 'fs';
import * as path from 'path';

interface QuestionData {
  Question: string;
  Answer: string;
  Options: string[];
}

async function seedQuestionsFromFile(filePath: string, language: string = 'en', category: string = 'general') {
  try {
    console.log(`📖 Reading questions from ${filePath}...`);
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const questions: QuestionData[] = JSON.parse(fileContent);
    
    console.log(`✅ Found ${questions.length} questions to seed`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const q of questions) {
      try {
        // Validate the question format
        if (!q.Question || !q.Answer || !Array.isArray(q.Options) || q.Options.length !== 3) {
          console.warn(`⚠️  Skipping invalid question: ${q.Question}`);
          errorCount++;
          continue;
        }
        
        // Check if answer is in options
        if (!q.Options.includes(q.Answer)) {
          console.warn(`⚠️  Answer not in options for: ${q.Question}`);
          errorCount++;
          continue;
        }
        
        // Insert into database
        const { data, error } = await db.getClient()
          .from('questions')
          .insert({
            text: q.Question,
            options: q.Options,
            correct_answer: q.Answer,
            language: language,
            category: category,
            is_active: true,
          });
        
        if (error) {
          console.error(`❌ Error inserting question: ${error.message}`);
          errorCount++;
        } else {
          successCount++;
          if (successCount % 10 === 0) {
            console.log(`   Progress: ${successCount}/${questions.length}`);
          }
        }
        
      } catch (err: any) {
        console.error(`❌ Error processing question: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Seeding complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Total: ${questions.length}`);
    
    return { successCount, errorCount };
    
  } catch (error: any) {
    console.error(`❌ Failed to seed questions: ${error.message}`);
    throw error;
  }
}

async function seedSampleQuestions() {
  console.log('🌱 Seeding sample trivia questions...\n');
  
  const sampleQuestions: QuestionData[] = [
    {
      Question: "What is the capital of France?",
      Answer: "Paris",
      Options: ["London", "Paris", "Berlin"]
    },
    {
      Question: "Who painted the Mona Lisa?",
      Answer: "Leonardo da Vinci",
      Options: ["Michelangelo", "Leonardo da Vinci", "Raphael"]
    },
    {
      Question: "What is the largest planet in our solar system?",
      Answer: "Jupiter",
      Options: ["Mars", "Jupiter", "Saturn"]
    },
    {
      Question: "In what year did World War II end?",
      Answer: "1945",
      Options: ["1943", "1944", "1945"]
    },
    {
      Question: "What is the chemical symbol for gold?",
      Answer: "Au",
      Options: ["Go", "Au", "Gd"]
    },
    {
      Question: "Who wrote 'Romeo and Juliet'?",
      Answer: "William Shakespeare",
      Options: ["Charles Dickens", "William Shakespeare", "Jane Austen"]
    },
    {
      Question: "What is the speed of light in vacuum?",
      Answer: "299,792,458 m/s",
      Options: ["299,792,458 m/s", "300,000,000 m/s", "150,000,000 m/s"]
    },
    {
      Question: "Which ocean is the largest?",
      Answer: "Pacific Ocean",
      Options: ["Atlantic Ocean", "Pacific Ocean", "Indian Ocean"]
    },
    {
      Question: "What is the smallest unit of life?",
      Answer: "Cell",
      Options: ["Atom", "Cell", "Molecule"]
    },
    {
      Question: "Who developed the theory of relativity?",
      Answer: "Albert Einstein",
      Options: ["Isaac Newton", "Albert Einstein", "Stephen Hawking"]
    },
    {
      Question: "What is the capital of Japan?",
      Answer: "Tokyo",
      Options: ["Osaka", "Kyoto", "Tokyo"]
    },
    {
      Question: "How many continents are there?",
      Answer: "7",
      Options: ["5", "6", "7"]
    },
    {
      Question: "What is the hardest natural substance on Earth?",
      Answer: "Diamond",
      Options: ["Gold", "Diamond", "Iron"]
    },
    {
      Question: "Who was the first person to walk on the moon?",
      Answer: "Neil Armstrong",
      Options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin"]
    },
    {
      Question: "What is the largest mammal?",
      Answer: "Blue Whale",
      Options: ["Elephant", "Blue Whale", "Giraffe"]
    },
    {
      Question: "In which country would you find the Eiffel Tower?",
      Answer: "France",
      Options: ["Italy", "France", "Spain"]
    },
    {
      Question: "What is the boiling point of water at sea level?",
      Answer: "100°C",
      Options: ["90°C", "100°C", "110°C"]
    },
    {
      Question: "Who invented the telephone?",
      Answer: "Alexander Graham Bell",
      Options: ["Thomas Edison", "Alexander Graham Bell", "Nikola Tesla"]
    },
    {
      Question: "What is the currency of the United Kingdom?",
      Answer: "Pound Sterling",
      Options: ["Euro", "Pound Sterling", "Dollar"]
    },
    {
      Question: "How many planets are in our solar system?",
      Answer: "8",
      Options: ["7", "8", "9"]
    },
    {
      Question: "What is the longest river in the world?",
      Answer: "Nile",
      Options: ["Amazon", "Nile", "Yangtze"]
    },
    {
      Question: "Who wrote '1984'?",
      Answer: "George Orwell",
      Options: ["George Orwell", "Aldous Huxley", "Ray Bradbury"]
    },
    {
      Question: "What is the smallest country in the world?",
      Answer: "Vatican City",
      Options: ["Monaco", "Vatican City", "San Marino"]
    },
    {
      Question: "What year did the Titanic sink?",
      Answer: "1912",
      Options: ["1910", "1912", "1914"]
    },
    {
      Question: "What is the main ingredient in guacamole?",
      Answer: "Avocado",
      Options: ["Tomato", "Avocado", "Lime"]
    },
    {
      Question: "How many strings does a standard guitar have?",
      Answer: "6",
      Options: ["5", "6", "7"]
    },
    {
      Question: "What is the capital of Australia?",
      Answer: "Canberra",
      Options: ["Sydney", "Melbourne", "Canberra"]
    },
    {
      Question: "Who painted 'The Starry Night'?",
      Answer: "Vincent van Gogh",
      Options: ["Claude Monet", "Vincent van Gogh", "Pablo Picasso"]
    },
    {
      Question: "What is the largest desert in the world?",
      Answer: "Antarctica",
      Options: ["Sahara", "Antarctica", "Arabian"]
    },
    {
      Question: "What is the chemical formula for water?",
      Answer: "H2O",
      Options: ["H2O", "CO2", "O2"]
    }
  ];
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const q of sampleQuestions) {
    try {
      const { error } = await db.getClient()
        .from('questions')
        .insert({
          text: q.Question,
          options: q.Options,
          correct_answer: q.Answer,
          language: 'en',
          category: 'general',
          difficulty: 'MEDIUM',
          is_active: true,
        });
      
      if (error) {
        console.error(`❌ Error inserting question: ${error.message}`);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 5 === 0) {
          console.log(`   Progress: ${successCount}/${sampleQuestions.length}`);
        }
      }
      
    } catch (err: any) {
      console.error(`❌ Error: ${err.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n✅ Sample questions seeded!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
}

// Main execution
async function main() {
  try {
    // Check for command line arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      // No file provided, seed sample questions
      console.log('📝 No file provided. Seeding sample questions...\n');
      await seedSampleQuestions();
    } else {
      // File path provided
      const filePath = args[0];
      const language = args[1] || 'en';
      const category = args[2] || 'general';
      
      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
      }
      
      await seedQuestionsFromFile(filePath, language, category);
    }
    
    console.log('\n✨ All done!\n');
    process.exit(0);
    
  } catch (error: any) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { seedQuestionsFromFile, seedSampleQuestions };
