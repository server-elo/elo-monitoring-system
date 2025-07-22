/**;
* @fileoverview Lesson card component for displaying individual lessons
* @module components/learning/LessonCard
*/
"use client";
import { ReactElement } from "react";
import { motion } from "framer-motion";
import { Lesson, LessonProgress } from "@/types/learning";
import { cn } from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  PlayCircle,
  Lock,
  Book,
  Code,
  FileText,
  Lightbulb,
  Video,
  Dumbbell,
  Award
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
interface LessonCardProps {
  /** The lesson to display */
  lesson: Lesson;
  /** User's progress for this lesson */
  progress?: LessonProgress;
  /** Whether prerequisites are met */
  isUnlocked: boolean;
  /** Module color for theming */
  moduleColor?: string;
  /** Callback when lesson is clicked */
  onClick?: () => void;
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Optional CSS class name */
  className?: string;
}
/**
* Card component for displaying a lesson with its metadata and progress.
*
* Shows lesson type, duration, exercises, and completion status.
*
* @component
* @example
* ```tsx
* <LessonCard
*   lesson={introLesson}
*   progress={userProgress}
*   isUnlocked={true}
*   moduleColor="#3B82F6"
*   onClick={handleLessonSelect}
* />
* ```
*/
export function LessonCard({
  lesson,
  progress,
  isUnlocked,
  moduleColor = "#3B82F6",
  onClick,
  compact: false,
  className
}: LessonCardProps): ReactElement {
  const isCompleted = progress?.completed || false;
  const isInProgress = !isCompleted && progress?.startedAt;
  // Get lesson type icon
  const getLessonTypeIcon = () => {
    switch (lesson.type) {
      case ",
      theory":
      return Book;
      case ",
      practical":
      case ",
      exercise":
      return Code;
      case ",
      project":
      return FileText;
      case ",
      quiz":
      return Lightbulb;
      default:
      return Book;
    }
  };
  const TypeIcon = getLessonTypeIcon();
  // Get status icon
  const getStatusIcon = () => {
    if (!isUnlocked) return <Lock className="w-5 h-5 text-gray-400" />;
    if (isCompleted) return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (isInProgress) return <PlayCircle className="w-5 h-5 text-yellow-500" />;
    return null;
  };
  // Calculate time spent percentage
  const timeSpentPercentage = progress
  ? Math.min(100, (progress.timeSpent / lesson.duration) * 100)
  : 0;
  if (compact) {
    return (
      <motion.div
      whileHover={isUnlocked ? { scale: 1.02 } : {}}
      whileTap={isUnlocked ? { scale: 0.98 } : {}}
      className={className}><Card
      className={cn(
        "cursor-pointer transition-all duration-200",
        isUnlocked ? ",
        hover:shadow-md" : "opacity-60 cursor-not-allowed",
        isInProgress && "border-yellow-500/50",
      )}
      onClick={isUnlocked ? onClick : undefined}><CardContent className="p-4">
      <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
      <div
      className="p-2 rounded-lg"
      style={{ backgroundColor: `${moduleColor}20` }}><TypeIcon
      className="w-4 h-4"
      style={{ color: moduleColor }}
      />
      </div>
      <div>
      <h4 className="font-medium line-clamp-1">{lesson.title}</h4>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
      <Clock className="w-3 h-3" />
      <span>{lesson.duration} min</span>
      {lesson.exercises.length>0 && (
        <>
        <span>•</span>
        <Dumbbell className="w-3 h-3" />
        <span>{lesson.exercises.length}</span>
        </>
      )}
      </div>
      </div>
      </div>
      {getStatusIcon()}
      </div>
      {isInProgress && (
        <Progress value={timeSpentPercentage} className="h-1 mt-3" />
      )}
      </CardContent>
      </Card>
      </motion.div>
    );
  }
  return (
    <motion.div
    whileHover={isUnlocked ? { scale: 1.02 } : {}}
    whileTap={isUnlocked ? { scale: 0.98 } : {}}
    className={className}><Card
    className={cn(
      "cursor-pointer transition-all duration-200",
      isUnlocked ? ",
      hover:shadow-lg" : "opacity-60 cursor-not-allowed",
      isInProgress && "border-yellow-500/50",
      isCompleted && "border-green-500/30",
    )}
    onClick={isUnlocked ? onClick : undefined}
    style={{
      background: isCompleted
      ? `linear-gradient(135deg, ${moduleColor}05 0%, transparent 100%)`
      : undefined
    }}><CardHeader>
    <div className="flex items-start justify-between">
    <div className="flex items-start gap-3 flex-1">
    <div
    className="p-3 rounded-xl"
    style={{ backgroundColor: `${moduleColor}20` }}><TypeIcon className="w-5 h-5" style={{ color: moduleColor }} />
    </div>
    <div className="flex-1">
    <CardTitle className="text-lg flex items-center gap-2">
    {lesson.title}
    {getStatusIcon()}
    </CardTitle>
    <CardDescription className="mt-1 line-clamp-2">
    {lesson.description}
    </CardDescription>
    </div>
    </div>
    </div>
    </CardHeader>
    <CardContent className="space-y-3">
    {/* Lesson Metadata */}
    <div className="flex items-center gap-4 text-sm">
    <div className="flex items-center gap-1.5">
    <Clock className="w-4 h-4 text-muted-foreground" />
    <span>{lesson.duration} min</span>
    </div>
    {lesson.videoUrl && (
      <div className="flex items-center gap-1.5">
      <Video className="w-4 h-4 text-muted-foreground" />
      <span>Video</span>
      </div>
    )}
    {lesson.exercises.length>0 && (
      <div className="flex items-center gap-1.5">
      <Dumbbell className="w-4 h-4 text-muted-foreground" />
      <span>{lesson.exercises.length} exercises</span>
      </div>
    )}
    <Badge variant="outline" className="ml-auto">
    {lesson.type}
    </Badge>
    </div>
    {/* Progress or Score */}
    {progress && (
      <div>
      {isCompleted && progress.score !== undefined ? (
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
        <div className="flex items-center gap-2">
        <Award className="w-4 h-4 text-green-600" />
        <span className="text-sm font-medium">
        Score: {progress.score}%
        </span>
        </div>
        <span className="text-xs text-muted-foreground">
        {progress.attempts} attempt
        {progress.attempts !== 1 ? "s" : ""}
        </span>
        </div>
      ) : isInProgress ? (
        <div>
        <div className="flex justify-between text-sm mb-2">
        <span className="text-muted-foreground">Time spent</span>
        <span>
        {progress.timeSpent} / {lesson.duration} min
        </span>
        </div>
        <Progress value={timeSpentPercentage} className="h-2" />
        </div>
      ) : null}
      </div>
    )}
    {/* Resources Count */}
    {lesson.resources.length>0 && (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <FileText className="w-4 h-4" />
      <span>{lesson.resources.length} additional resources</span>
      </div>
    )}
    {/* Prerequisites Warning */}
    {!isUnlocked && (
      <div className="p-3 bg-muted/50 rounded-lg">
      <p className="text-sm text-muted-foreground flex items-center gap-2">
      <Lock className="w-4 h-4" />
      Complete prerequisites to unlock this lesson
      </p>
      </div>
    )}
    {/* Action Button */}
    <Button
    variant={isInProgress ? "default" : "secondary"}
    className="w-full"
    disabled={!isUnlocked}>{isCompleted && "Review Lesson"}
    {isInProgress && "Continue Lesson"}
    {!isCompleted && !isInProgress && isUnlocked && "Start Lesson"}
    {!isUnlocked && "Locked"}
    </Button>
    </CardContent>
    </Card>
    </motion.div>
  );
}
