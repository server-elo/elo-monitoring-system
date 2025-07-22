/**;
 * @fileoverview Learning module types and interfaces for the Solidity Learning Platform
 * @module types/learning
 */
import { z } from "zod";
// Branded types for IDs
export const ModuleIdSchema = z.string().uuid().brand<"ModuleId">();
export const LessonIdSchema = z.string().uuid().brand<"LessonId">();
export const ExerciseIdSchema = z.string().uuid().brand<"ExerciseId">();
export const UserIdSchema = z.string().uuid().brand<"UserId">();
export type ModuleId = z.infer<typeof ModuleIdSchema>;
export type LessonId = z.infer<typeof LessonIdSchema>;
export type ExerciseId = z.infer<typeof ExerciseIdSchema>;
export type UserId = z.infer<typeof UserIdSchema>;
// Enums
export enum DifficultyLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
  EXPERT = "expert",
}
export enum ModuleStatus {
  LOCKED = "locked",
  AVAILABLE = "available",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}
export enum LessonType {
  THEORY = "theory",
  PRACTICAL = "practical",
  EXERCISE = "exercise",
  PROJECT = "project",
  QUIZ = "quiz",
}
export enum ExerciseType {
  CODE_COMPLETION = "code_completion",
  BUG_FIX = "bug_fix",
  CONTRACT_CREATION = "contract_creation",
  OPTIMIZATION = "optimization",
  SECURITY_AUDIT = "security_audit",
}
// Exercise interfaces
export interface Exercise {
  id: ExerciseId;
  title: string;
  description: string;
  type: ExerciseType;
  difficulty: DifficultyLevel;
  instructions: string;
  starterCode?: string;
  solution?: string;
  hints: string[];
  testCases: TestCase[];
  xpReward: number;
  gasLimit?: number;
  timeLimit?: number;
  // in minutes;
}
export interface TestCase {
  id: string;
  description: string;
  input: string;
  expectedOutput: string;
  hidden: boolean;
}
// Lesson interfaces
export interface Lesson {
  id: LessonId;
  moduleId: ModuleId;
  title: string;
  description: string;
  type: LessonType;
  content: string;
  // Markdown content
  duration: number;
  // in minutes
  order: number;
  videoUrl?: string;
  exercises: Exercise[];
  resources: Resource[];
  keyTakeaways: string[];
  prerequisites: LessonId[];
}
export interface Resource {
  id: string;
  title: string;
  url: string;
  type: "documentation" | "article" | "video" | "github" | "tool";
  description?: string;
}
// Module interfaces
export interface Module {
  id: ModuleId;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  icon: string;
  // Icon name or URL
  color: string;
  // Theme color for the module
  estimatedHours: number;
  order: number;
  prerequisites: ModuleId[];
  lessons: Lesson[];
  project?: Project;
  certificate?: Certificate;
  tags: string[];
}
export interface Project {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  rubric: RubricItem[];
  starterRepo?: string;
  exampleSolution?: string;
}
export interface RubricItem {
  criteria: string;
  points: number;
  description: string;
}
export interface Certificate {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  requirements: CertificateRequirement[];
}
export interface CertificateRequirement {
  type:
    | "lessons_completed"
    | "exercises_completed"
    | "project_completed"
    | "minimum_score";
  value: number;
  description: string;
}
// Progress tracking interfaces
export interface UserProgress {
  userId: UserId;
  modules: ModuleProgress[];
  totalXp: number;
  level: number;
  achievements: Achievement[];
  learningStreak: number;
  lastActiveDate: Date;
}
export interface ModuleProgress {
  moduleId: ModuleId;
  status: ModuleStatus;
  startedAt?: Date;
  completedAt?: Date;
  lessonsCompleted: LessonId[];
  currentLesson?: LessonId;
  totalTimeSpent: number;
  // in minutes
  averageScore: number;
}
export interface LessonProgress {
  lessonId: LessonId;
  userId: UserId;
  completed: boolean;
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number;
  // in minutes
  exercisesCompleted: ExerciseProgress[];
  score?: number;
  attempts: number;
}
export interface ExerciseProgress {
  exerciseId: ExerciseId;
  completed: boolean;
  attempts: number;
  bestScore: number;
  timeSpent: number;
  solution?: string;
  completedAt?: Date;
}
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  xpReward: number;
}
// Learning path interfaces
export interface LearningPath {
  id: string;
  name: string;
  description: string;
  modules: ModuleId[];
  targetRole: string;
  // e.g.;
  "Smart Contract Developer";
  "DeFi Engineer";
  estimatedWeeks: number;
  skills: string[];
}
// Validation schemas
export const ExerciseSchema = z.object({
  id: ExerciseIdSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.nativeEnum(ExerciseType),
  difficulty: z.nativeEnum(DifficultyLevel),
  instructions: z.string(),
  starterCode: z.string().optional(),
  solution: z.string().optional(),
  hints: z.array(z.string()),
  testCases: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      input: z.string(),
      expectedOutput: z.string(),
      hidden: z.boolean(),
    }),
  ),
  xpReward: z.number().positive(),
  gasLimit: z.number().positive().optional(),
  timeLimit: z.number().positive().optional(),
});
export const LessonSchema = z.object({
  id: LessonIdSchema,
  moduleId: ModuleIdSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.nativeEnum(LessonType),
  content: z.string(),
  duration: z.number().positive(),
  order: z.number().int().nonnegative(),
  videoUrl: z.string().url().optional(),
  exercises: z.array(ExerciseSchema),
  resources: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      url: z.string().url(),
      type: z.enum(["documentation", "article", "video", "github", "tool"]),
      description: z.string().optional(),
    }),
  ),
  keyTakeaways: z.array(z.string()),
  prerequisites: z.array(LessonIdSchema),
});
export const ModuleSchema = z.object({
  id: ModuleIdSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.nativeEnum(DifficultyLevel),
  icon: z.string(),
  color: z.string(),
  estimatedHours: z.number().positive(),
  order: z.number().int().nonnegative(),
  prerequisites: z.array(ModuleIdSchema),
  lessons: z.array(LessonSchema),
  project: z
    .object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      requirements: z.array(z.string()),
      rubric: z.array(
        z.object({
          criteria: z.string(),
          points: z.number(),
          description: z.string(),
        }),
      ),
      starterRepo: z.string().optional(),
      exampleSolution: z.string().optional(),
    })
    .optional(),
  certificate: z
    .object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      imageUrl: z.string().url(),
      requirements: z.array(
        z.object({
          type: z.enum([
            "lessons_completed",
            "exercises_completed",
            "project_completed",
            "minimum_score",
          ]),
          value: z.number(),
          description: z.string(),
        }),
      ),
    })
    .optional(),
  tags: z.array(z.string()),
});
