// Update Game Modes to Require Fewer Questions
// Run: node update-game-modes.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateGameModes() {
  console.log('🔧 Updating game modes to require 100 questions...\n');

  const updates = [
    {
      type: 'FREE',
      questions: 100,
      min_answers_to_qualify: 100,
      description: 'Play 100 questions for free and compete for $100 prize pool',
      name: 'Free Weekly Challenge'
    },
    {
      type: 'CHALLENGE',
      questions: 100,
      min_answers_to_qualify: 100,
      description: 'Monthly competition with 100 questions for $10 entry',
      name: 'Monthly Challenge'
    },
    {
      type: 'TOURNAMENT',
      questions: 100,
      min_answers_to_qualify: 100,
      description: 'Epic monthly tournament with 100 questions',
      name: 'Grand Tournament'
    },
    {
      type: 'SUPER_TOURNAMENT',
      questions: 100,
      min_answers_to_qualify: 100,
      description: 'Ultimate monthly championship for serious players',
      name: 'Super Championship'
    }
  ];

  for (const update of updates) {
    const { type, ...data } = update;
    
    console.log(`Updating ${type}...`);
    
    const { data: result, error } = await supabase
      .from('game_modes')
      .update(data)
      .eq('type', type)
      .select();

    if (error) {
      console.error(`❌ Error updating ${type}:`, error.message);
    } else {
      console.log(`✅ ${type} updated:`, result[0]?.name, '-', result[0]?.questions, 'questions');
    }
  }

  // Verify updates
  console.log('\n📊 Current game modes configuration:\n');
  
  const { data: gameModes, error } = await supabase
    .from('game_modes')
    .select('type, name, questions, min_answers_to_qualify, description')
    .order('sort_order');

  if (error) {
    console.error('❌ Error fetching game modes:', error.message);
  } else {
    console.table(gameModes);
  }

  console.log('\n✅ Game modes updated successfully!');
  console.log('🎮 You can now join games with your 320 questions in the database.');
}

updateGameModes()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
