
export type LearningLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Master';

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation?: string; // Explanation for the correct answer
}

export interface QuizData {
  title: string;
  questions: QuizQuestion[];
}

export interface LearningModule {
  id: string;
  title: string;
  category: string;
  level: LearningLevel;
  summary: string;
  content: string; // Can contain markdown-like syntax
  keywords: string[];
  geminiPromptSeed?: string;
  videoEmbedUrl?: string; // URL for embedding a video (e.g., YouTube embed URL)
  quiz?: QuizData; // Quiz data for the module
}

export enum ChatMessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
  ERROR = 'error',
}

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  text: string;
  timestamp: Date;
}
