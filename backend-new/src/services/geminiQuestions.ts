import { GoogleGenerativeAI } from '@google/generative-ai';
import winston from 'winston';
import { db } from './database';

interface AIQuestion {
  Question: string;
  Answer: string;
  Options: string[];
  Difficulty: 'Easy' | 'Medium' | 'Difficult';
}

interface GeneratedQuestion {
  text: string;
  correct_answer: string;
  options: string[];
  difficulty: string;
  category: string;
  language: string;
  is_active: boolean;
}

interface SessionQuestion {
  sessionQuestionId: string;
  text: string;
  correct_answer: string;
  options: string[];
  randomized_options: string[];
  difficulty: string;
  category: string;
}

export class GeminiQuestionService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private logger: winston.Logger;
  private generationCache: Map<string, Date>;
  private sessionQuestions: Map<string, SessionQuestion[]>; // In-memory storage: sessionId -> questions
  private generatingSessions: Set<string>; // Track sessions currently generating questions

  constructor() {
    this.sessionQuestions = new Map();
    this.generatingSessions = new Set();
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use gemini-2.5-flash - fastest and most cost-effective
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/gemini-questions.log' })
      ]
    });

    this.generationCache = new Map();
    this.logger.info('Gemini Question Service initialized');
  }

  private getSystemInstruction(): string {
    return `# Professional Trivia Question Generation System Instructions

## Role Definition
You are an expert trivia content creator and global events researcher specializing in generating intellectually stimulating, professionally crafted questions spanning current affairs, historical events, scientific discoveries, cultural milestones, and global developments. Your responsibility is to produce high-quality, non-repetitive trivia questions with sophisticated multiple-choice options that challenge knowledge while maintaining accuracy and relevance across varying difficulty levels.

---

## Core Objectives

1. **Intellectual Rigor**: Generate questions that require genuine knowledge and critical thinking
2. **Dynamic Difficulty**: Randomly distribute questions across Easy, Medium, and Difficult levels
3. **Temporal Diversity**: Balance between current events, recent history, and ancient/historical topics
4. **Global Perspective**: Cover events, developments, and knowledge from all regions and cultures
5. **Professional Quality**: Maintain sophisticated language and avoid trivial or obvious questions
6. **Accuracy Verification**: Ensure all facts, dates, and information are correct and verifiable
7. **Non-Repetition**: Never duplicate questions or recycle similar content within or across sessions

---

## Difficulty Level Framework

### Difficulty Distribution (Random but Balanced)
For every 30 questions, maintain approximately:
- **Easy**: 8-10 questions (27-33%)
- **Medium**: 10-12 questions (33-40%)
- **Difficult**: 8-10 questions (27-33%)

**CRITICAL**: Difficulty levels must be randomly distributed throughout the question set—NOT grouped together. Use a randomization approach to ensure unpredictable difficulty progression.

---

## Output Specifications

### Strict JSON Format

Return ONLY valid JSON array with no markdown, no commentary, no explanation.

\`\`\`json
[
  {
    "Question": "Which streaming service launched in November 2019 became one of the fastest platforms to reach 100 million subscribers?",
    "Answer": "Disney+",
    "Options": ["HBO Max", "Disney+", "Apple TV+"],
    "Difficulty": "Easy"
  }
]
\`\`\`

**Field Requirements:**

- **Question**: Complete, grammatically correct question ending with a question mark
- **Answer**: Precise correct answer (no explanations or additional context)
- **Options**: Array of exactly 3 options including the correct answer
  - All options must be strings
  - One option must exactly match the Answer field
  - Options must be distinct from each other
- **Difficulty**: Exactly one of: "Easy", "Medium", or "Difficult"

---

## Critical Compliance Rules

1. **Zero Repetition**: Never generate duplicate or nearly identical questions
2. **Factual Accuracy**: All information must be verifiable and correct across all difficulty levels
3. **Difficulty Randomization**: Distribute Easy/Medium/Difficult questions unpredictably
4. **Difficulty Calibration**: Ensure each question genuinely matches its assigned difficulty
5. **Professional Standard**: Maintain sophisticated language appropriate to each level
6. **Format Adherence**: Deliver only JSON array with Difficulty field included
7. **Complete Delivery**: Always generate exactly the requested number of questions
8. **Balanced Coverage**: Maintain specified distributions across time, geography, topics, AND difficulty
9. **Option Quality**: All distractors must match the difficulty level of the question
10. **JSON Only**: Return ONLY valid JSON, no markdown code blocks, no explanations

---

## Mission Statement

Deliver intellectually engaging, meticulously researched trivia questions that span global events across all time periods with dynamically varied difficulty levels. Challenge knowledge appropriately at Easy, Medium, and Difficult tiers while maintaining professional standards, factual accuracy, sophisticated presentation, and unpredictable difficulty progression. Each question set should educate, engage, and test genuine understanding at the appropriate level of expertise.`;
  }

  async generateQuestions(
    count: number = 30,
    category?: string,
    language: string = 'en'
  ): Promise<GeneratedQuestion[]> {
    try {
      this.logger.info(`Generating ${count} questions for category: ${category || 'general'}, language: ${language}`);

      const prompt = this.buildPrompt(count, category, language);
      
      const result = await this.model.generateContent({
        contents: [{ 
          role: 'user', 
          parts: [{ text: prompt }] 
        }],
        systemInstruction: this.getSystemInstruction(),
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      });

      const response = await result.response;
      const text = response.text();

      this.logger.info('Raw AI response received, parsing...');

      const aiQuestions = this.parseAIResponse(text);
      
      if (aiQuestions.length === 0) {
        throw new Error('No questions parsed from AI response');
      }

      const formattedQuestions = this.formatQuestionsForDB(aiQuestions, category, language);

      this.logger.info(`Successfully generated ${formattedQuestions.length} questions`);
      
      return formattedQuestions;

    } catch (error) {
      this.logger.error('Error generating questions with Gemini:', error);
      throw error;
    }
  }

  private buildPrompt(count: number, category?: string, language: string = 'en'): string {
    let prompt = `Generate exactly ${count} high-quality trivia questions in ${language === 'en' ? 'English' : 'German'}.`;

    if (category) {
      prompt += `\n\nFocus on the category: ${category}`;
    }

    prompt += `\n\nIMPORTANT:
- Return ONLY a valid JSON array
- No markdown code blocks (\`\`\`json)
- No explanatory text before or after
- Exactly ${count} questions
- Random difficulty distribution (Easy, Medium, Difficult)
- Exactly 3 options per question (including the correct answer)
- One option must exactly match the Answer field

Example format:
[
  {
    "Question": "Your question here?",
    "Answer": "Correct answer",
    "Options": ["Option 1", "Correct answer", "Option 3"],
    "Difficulty": "Medium"
  }
]`;

    return prompt;
  }

  private parseAIResponse(text: string): AIQuestion[] {
    try {
      // Remove markdown code blocks if present
      let cleanedText = text.trim();
      
      // Remove ```json and ``` if present
      cleanedText = cleanedText.replace(/^```json\s*/i, '');
      cleanedText = cleanedText.replace(/^```\s*/i, '');
      cleanedText = cleanedText.replace(/```\s*$/i, '');
      cleanedText = cleanedText.trim();

      // Find JSON array in the text
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        this.logger.error('No JSON array found in response:', cleanedText);
        throw new Error('Invalid AI response format - no JSON array found');
      }

      const parsed = JSON.parse(jsonMatch[0]) as AIQuestion[];

      // Validate structure
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      // Validate each question
      const validQuestions = parsed.filter(q => {
        const isValid = 
          q.Question && 
          q.Answer && 
          Array.isArray(q.Options) && 
          q.Options.length === 3 &&
          q.Options.includes(q.Answer) &&
          ['Easy', 'Medium', 'Difficult'].includes(q.Difficulty);

        if (!isValid) {
          this.logger.warn('Invalid question filtered out:', q);
        }

        return isValid;
      });

      this.logger.info(`Parsed ${validQuestions.length} valid questions from AI response`);

      return validQuestions;

    } catch (error) {
      this.logger.error('Error parsing AI response:', error);
      this.logger.error('Raw text:', text);
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private formatQuestionsForDB(
    aiQuestions: AIQuestion[],
    category?: string,
    language: string = 'en'
  ): GeneratedQuestion[] {
    return aiQuestions.map(q => ({
      text: q.Question,
      correct_answer: q.Answer,
      options: q.Options,
      difficulty: q.Difficulty.toLowerCase(),
      category: category || 'general',
      language: language,
      is_active: true,
    }));
  }

  async generateAndSaveQuestions(
    count: number = 30,
    category?: string,
    language: string = 'en'
  ): Promise<{ success: boolean; count: number; questions?: any[]; error?: string }> {
    try {
      const questions = await this.generateQuestions(count, category, language);

      // Save to database
      const savedQuestions = [];
      for (const question of questions) {
        const { data, error } = await db.getClient()
          .from('questions')
          .insert({
            text: question.text,
            correct_answer: question.correct_answer,
            options: question.options,
            difficulty: question.difficulty,
            category: question.category,
            language: question.language,
            is_active: question.is_active,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          this.logger.error('Error saving question:', error);
          continue;
        }

        savedQuestions.push(data);
      }

      this.logger.info(`Saved ${savedQuestions.length} questions to database`);

      return {
        success: true,
        count: savedQuestions.length,
        questions: savedQuestions,
      };

    } catch (error) {
      this.logger.error('Error in generateAndSaveQuestions:', error);
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async generateQuestionsForSession(
    sessionId: string,
    count: number = 100,
    category?: string,
    language: string = 'en'
  ): Promise<{ success: boolean; questions?: SessionQuestion[]; error?: string }> {
    try {
      this.logger.info(`Generating ${count} questions for session ${sessionId} (in-memory only)`);

      // Generate questions in batches of 30
      const batchSize = 30;
      const batches = Math.ceil(count / batchSize);
      let allSessionQuestions: SessionQuestion[] = [];

      // If we already have questions for this session, start from them
      const existing = this.sessionQuestions.get(sessionId) || [];
      if (existing.length > 0) {
        allSessionQuestions = [...existing];
      }

      for (let i = 0; i < batches; i++) {
        const batchCount = Math.min(batchSize, count - (i * batchSize));
        
        this.logger.info(`Generating batch ${i + 1}/${batches} (${batchCount} questions)`);
        
        const questions = await this.generateQuestions(batchCount, category, language);
        
        // Store questions in memory only (NO DATABASE SAVE)
        for (let j = 0; j < questions.length; j++) {
          const question = questions[j];
          const questionIndex = allSessionQuestions.length;
          
          // Generate unique session question ID
          const sessionQuestionId = `${sessionId}_q${questionIndex}`;
          
          // Randomize options for this session
          const randomizedOptions = this.shuffleArray([...question.options]);

          const sessionQuestion: SessionQuestion = {
            sessionQuestionId,
            text: question.text,
            correct_answer: question.correct_answer,
            options: question.options,
            randomized_options: randomizedOptions,
            difficulty: question.difficulty,
            category: question.category,
          };

          allSessionQuestions.push(sessionQuestion);
        }

        // Small delay between batches to avoid rate limiting
        if (i < batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Store all questions in memory for this session (append or set)
      this.sessionQuestions.set(sessionId, allSessionQuestions);

      this.logger.info(`Successfully generated ${allSessionQuestions.length} questions for session ${sessionId} (stored in memory)`);

      return {
        success: true,
        questions: allSessionQuestions,
      };

    } catch (error) {
      this.logger.error('Error generating questions for session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Ensure a minimum number of questions exist for a session, generating more in the background if needed
  async ensureQuestionsForSession(
    sessionId: string,
    targetCount: number,
    category?: string,
    language: string = 'en'
  ): Promise<void> {
    const existing = this.sessionQuestions.get(sessionId) || [];
    if (existing.length >= targetCount) {
      return;
    }

    if (this.generatingSessions.has(sessionId)) {
      // Already generating for this session; avoid duplicate work
      return;
    }

    const remaining = targetCount - existing.length;
    if (remaining <= 0) return;

    this.generatingSessions.add(sessionId);

    try {
      this.logger.info(
        `Background-generating ${remaining} additional questions for session ${sessionId} (target=${targetCount})`
      );

      const result = await this.generateQuestionsForSession(sessionId, remaining, category, language);
      if (!result.success) {
        this.logger.error(
          `Failed background generation for session ${sessionId}: ${result.error || 'Unknown error'}`
        );
      }
    } catch (error) {
      this.logger.error('Error in ensureQuestionsForSession:', error);
    } finally {
      this.generatingSessions.delete(sessionId);
    }
  }

  // Get questions for a session from memory
  getSessionQuestions(sessionId: string, limit?: number, offset: number = 0): SessionQuestion[] {
    const questions = this.sessionQuestions.get(sessionId) || [];
    
    if (limit) {
      return questions.slice(offset, offset + limit);
    }
    
    return questions.slice(offset);
  }

  // Get a specific question by sessionQuestionId
  getQuestionById(sessionId: string, sessionQuestionId: string): SessionQuestion | undefined {
    const questions = this.sessionQuestions.get(sessionId) || [];
    return questions.find(q => q.sessionQuestionId === sessionQuestionId);
  }

  // Clear session questions from memory (call when session is completed or expired)
  clearSessionQuestions(sessionId: string): void {
    this.sessionQuestions.delete(sessionId);
    this.logger.info(`Cleared questions from memory for session ${sessionId}`);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export const geminiQuestionService = new GeminiQuestionService();
