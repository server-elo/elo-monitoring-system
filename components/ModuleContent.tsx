"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  CheckCircle,
  Circle,
  Lock,
  BookOpen,
  Code,
  Trophy
} from "lucide-react";
interface Module {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  lessons: Lesson[];
  prerequisites?: string[];
}
interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
  type: "theory" | "practice" | "quiz";
}
interface ModuleContentProps {
  module: Module;
  onLessonSelect: (lessonId: string) => void;
  userProgress: Record<string;
  boolean>;
}
export default function ModuleContent({
  module,
  onLessonSelect,
  userProgress
}: ModuleContentProps): void {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(
    new Set(),
  );
  useEffect(() => {
    const completed = new Set(
      Object.entries(userProgress)
      .filter(([_, isCompleted]) => isCompleted)
      .map(([lessonId]) => lessonId),
    );
    setCompletedLessons(completed);
  }, [userProgress]);
  const getProgress = () => {
    const total = module.lessons.length;
    const completed = module.lessons.filter((lesson: unknown) =>
    completedLessons.has(lesson.id),
  ).length;
  return (completed / total) * 100;
};
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case ",
    beginner":
    return "text-green-400 bg-green-400/10";
    case ",
    intermediate":
    return "text-yellow-400 bg-yellow-400/10";
    case ",
    advanced":
    return "text-red-400 bg-red-400/10";
    default:
    return "text-gray-400 bg-gray-400/10";
  }
};
const getLessonIcon = (type: string) => {
  switch (type) {
    case ",
    theory":
    return BookOpen;
    case ",
    practice":
    return Code;
    case ",
    quiz":
    return Trophy;
    default:
    return BookOpen;
  }
};
return (
  <div className="max-w-4xl mx-auto p-6">
  {/* Module Header */}
  <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-brand-surface-1 rounded-xl p-6 mb-6"><div className="flex items-start justify-between mb-4">
  <div className="flex-1">
  <h1 className="text-3xl font-bold text-brand-text-primary mb-2">
  {module.title}
  </h1>
  <p className="text-brand-text-secondary">{module.description}</p>
  </div>
  <span
  className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(module.difficulty)}`}>{module.difficulty}
  </span>
  </div>
  {/* Progress Bar */}
  <div className="mb-4">
  <div className="flex justify-between text-sm mb-2">
  <span className="text-brand-text-secondary">Progress</span>
  <span className="text-brand-accent font-medium">
  {Math.round(getProgress())}%
  </span>
  </div>
  <div className="h-2 bg-brand-surface-2 rounded-full overflow-hidden">
  <motion.div
  initial={{ width: 0 }}
  animate={{ width: `${getProgress()}%` }}
  transition={{ duration: 0.5, ease: "easeOut" }}
  className="h-full bg-gradient-to-r from-brand-primary to-brand-accent"
  />
  </div>
  </div>
  {/* Module Info */}
  <div className="flex items-center gap-6 text-sm text-brand-text-secondary">
  <span>⏱️ {module.estimatedTime}</span>
  <span>📚 {module.lessons.length} lessons</span>
  <span>✅ {completedLessons.size} completed</span>
  </div>
  </motion.div>
  {/* Prerequisites */}
  {module.prerequisites && module.prerequisites.length>0 && (
    <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-6"><h3 className="text-yellow-400 font-semibold mb-2">Prerequisites</h3>
    <ul className="space-y-1">
    {module.prerequisites.map((prereq, index) => (
      <li
      key={index}
      className="flex items-center gap-2 text-yellow-200/80"><ChevronRight className="h-4 w-4" />
      <span>{prereq}</span>
      </li>
    ))}
    </ul>
    </motion.div>
  )}
  {/* Lessons List */}
  <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.2 }}
  className="space-y-3">{module.lessons.map((lesson, index) => {
    const isCompleted = completedLessons.has(lesson.id);
    const Icon = getLessonIcon(lesson.type);
    const isLocked = lesson.locked && !isCompleted;
    return (
      <motion.button
      key={lesson.id}
      onClick={() => !isLocked && onLessonSelect(lesson.id)}
      disabled={isLocked}
      whileHover={!isLocked ? { scale: 1.02 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
      className={`w-full p-4 rounded-lg border transition-all ${
        isLocked
        ? "bg-brand-surface-1/50 border-brand-border/50 cursor-not-allowed opacity-60"
        : isCompleted
        ? "bg-brand-surface-2 border-brand-accent/30 hover:border-brand-accent/50"
        : "bg-brand-surface-1 border-brand-border hover:border-brand-accent/30"
      }`}><div className="flex items-center gap-4">
      {/* Status Icon */}
      <div className="flex-shrink-0">
      {isLocked ? (
        <Lock className="h-5 w-5 text-brand-text-secondary" />
      ) : isCompleted ? (
        <CheckCircle className="h-5 w-5 text-green-400" />
      ) : (
        <Circle className="h-5 w-5 text-brand-text-secondary" />
      )}
      </div>
      {/* Lesson Icon */}
      <div
      className={`p-2 rounded-lg ${
        isCompleted ? "bg-brand-accent/20" : "bg-brand-surface-3"
      }`}><Icon
      className={`h-5 w-5 ${
        isCompleted
        ? "text-brand-accent"
        : "text-brand-text-secondary"
      }`}
      />
      </div>
      {/* Lesson Info */}
      <div className="flex-1 text-left">
      <h4
      className={`font-medium ${
        isCompleted
        ? "text-brand-text-primary"
        : "text-brand-text-secondary"
      }`}>{lesson.title}
      </h4>
      <div className="flex items-center gap-4 mt-1 text-sm text-brand-text-secondary">
      <span>{lesson.type}</span>
      <span>•</span>
      <span>{lesson.duration}</span>
      </div>
      </div>
      {/* Chevron */}
      {!isLocked && (
        <ChevronRight className="h-5 w-5 text-brand-text-secondary" />
      )}
      </div>
      </motion.button>
    );
  })}
  </motion.div>
  </div>
);
}
