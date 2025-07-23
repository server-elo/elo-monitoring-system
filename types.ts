export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  xp: number;
  level: number;
  achievements: string[];
  completedLessons: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: number;
  lessons: Lesson[];
  progress: number;
  isLocked?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: number;
  codeExample?: string;
  quiz?: Quiz;
  isCompleted?: boolean;
}

export interface Quiz {
  id: string;
  questions: Question[];
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
}

export interface Certificate {
  id: string;
  title: string;
  description: string;
  issueDate: Date;
  blockchainHash?: string;
  downloadUrl?: string;
}
