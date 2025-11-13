-- Update Game Modes to Require Fewer Questions
-- Run this in your Supabase SQL Editor or via psql

-- Reduce question requirements to match available questions (320 in DB)

UPDATE game_modes 
SET 
  questions = 100,
  min_answers_to_qualify = 100,
  description = 'Weekly competition with 100 questions'
WHERE type = 'FREE';

UPDATE game_modes 
SET 
  questions = 100,
  min_answers_to_qualify = 100,
  description = 'Monthly challenge with 100 questions'
WHERE type = 'CHALLENGE';

UPDATE game_modes 
SET 
  questions = 100,
  min_answers_to_qualify = 100,
  description = 'Monthly tournament with 100 questions'
WHERE type = 'TOURNAMENT';

UPDATE game_modes 
SET 
  questions = 100,
  min_answers_to_qualify = 100,
  description = 'Elite monthly tournament with 100 questions'
WHERE type = 'SUPER_TOURNAMENT';

-- Verify the updates
SELECT type, name, questions, min_answers_to_qualify, description 
FROM game_modes 
ORDER BY sort_order;
