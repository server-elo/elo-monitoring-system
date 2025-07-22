/**;
 * @fileoverview Learning dashboard component that integrates all learning modules
 * @module components/learning/LearningDashboard
 */
"use client";
import { ReactElement, useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Module,
  Lesson,
  Exercise,
  ModuleStatus,
  LearningPath,
  UserId,
} from "@/types/learning";
import { useLearningProgress } from "@/hooks/useLearningProgress";
import { cn } from "@/lib/utils";
import {
  getAllModules,
  getModuleById,
  getLessonById,
  getNextLesson,
  getPreviousLesson,
  learningPaths,
} from "@/lib/curriculum/solidityModules";
// Components
import { LearningPathVisualization } from "./LearningPathVisualization";
import { ModuleCard } from "./ModuleCard";
import { LessonCard } from "./LessonCard";
import { ModuleNavigation } from "./ModuleNavigation";
import { LessonViewer } from "./LessonViewer";
import { InteractiveExercise } from "./InteractiveExercise";
// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Book,
  Trophy,
  Zap,
  Target,
  TrendingUp,
  Calendar,
  ChevronLeft,
  Grid,
  List,
} from "lucide-react";
interface LearningDashboardProps {
  /** User ID for tracking progress */
  userId: UserId;
  /** Optional CSS class name */
  className?: string;
}
type ViewMode = "path" | "modules" | "lesson" | "exercise";
/**
 * Main learning dashboard that provides access to all learning features.
 *
 * Integrates learning paths, modules, lessons, exercises, and progress tracking
 * into a comprehensive learning experience.
 *
 * @component
 * @example
 * ```tsx
 * <LearningDashboard userId={currentUser.id} />
 * ```
 */
export function LearningDashboard({
  userId,
  className,
}: LearningDashboardProps): ReactElement {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>("modules");
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [moduleViewType, setModuleViewType] = useState<"grid" | "list">("grid");
  // Get all modules
  const modules = useMemo(() => getAllModules(), []);
  // Progress tracking
  const {
    userProgress,
    getModuleProgress,
    getLessonProgress,
    getExerciseProgress,
    startModule,
    completeModule,
    startLesson,
    completeLesson,
    startExercise,
    completeExercise,
    getModuleCompletionPercentage,
    getUserLevel,
    getXPForNextLevel,
    addXP,
  } = useLearningProgress(userId);
  // Calculate module statuses
  const moduleProgressMap = useMemo(() => {
    const map = new Map<string, ModuleStatus>();
    modules.forEach((module: unknown) => {
      const progress = getModuleProgress(module.id);
      if (progress?.status) {
        map.set(module.id, progress.status);
      } else {
        // Check if prerequisites are met
        const prerequisitesMet = module.prerequisites.every(
          (prereqId: unknown) => {
            const prereqProgress = getModuleProgress(prereqId as any);
            return prereqProgress?.status === ModuleStatus.COMPLETED;
          },
        );
        map.set(
          module.id,
          prerequisitesMet ? ModuleStatus.AVAILABLE : ModuleStatus.LOCKED,
        );
      }
    });
    return map;
  }, [modules, getModuleProgress]);
  // Calculate lesson progress map
  const lessonProgressMap = useMemo(() => {
    const map = new Map<string, any>();
    if (selectedModule) {
      selectedModule.lessons.forEach((lesson: unknown) => {
        const progress = getLessonProgress(lesson.id);
        if (progress) {
          map.set(lesson.id, progress);
        }
      });
    }
    return map;
  }, [selectedModule, getLessonProgress]);
  // Handle module selection
  const handleModuleSelect = (moduleId: string) => {
    const module = getModuleById(moduleId);
    if (module) {
      setSelectedModule(module);
      setViewMode("lesson");
      // Start module if not started
      const progress = getModuleProgress(module.id);
      if (!progress) {
        startModule(module.id);
      }
    }
  };
  // Handle lesson selection
  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    startLesson(lesson.id);
  };
  // Handle lesson completion
  const handleLessonComplete = () => {
    if (selectedLesson) {
      completeLesson(selectedLesson.id, 100);
      addXP(50); // Base XP for lesson completion
      // Check if module is complete
      if (selectedModule) {
        const allLessonsComplete = selectedModule.lessons.every(
          (lesson: unknown) => getLessonProgress(lesson.id)?.completed,
        );
        if (allLessonsComplete) {
          completeModule(selectedModule.id);
          addXP(200); // Bonus XP for module completion
        }
      }
    }
  };
  // Handle exercise start
  const handleExerciseStart = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setViewMode("exercise");
    startExercise(exercise.id);
  };
  // Handle exercise completion
  const handleExerciseComplete = (score: number, solution: string) => {
    if (selectedExercise) {
      completeExercise(selectedExercise.id, score, solution);
      addXP(selectedExercise.xpReward);
      setViewMode("lesson");
      setSelectedExercise(null);
    }
  };
  // Handle navigation
  const handleNextLesson = () => {
    if (selectedLesson) {
      const nextLesson = getNextLesson(selectedLesson.id);
      if (nextLesson) {
        handleLessonSelect(nextLesson);
      }
    }
  };
  const handlePreviousLesson = () => {
    if (selectedLesson) {
      const prevLesson = getPreviousLesson(selectedLesson.id);
      if (prevLesson) {
        handleLessonSelect(prevLesson);
      }
    }
  };
  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const totalModules = modules.length;
    const completedModules = Array.from(moduleProgressMap.values()).filter(
      (status: unknown) => (status = ModuleStatus.COMPLETED),
    ).length;
    return totalModules > 0
      ? Math.round((completedModules / totalModules) * 100)
      : 0;
  }, [modules, moduleProgressMap]);
  // Get current level and XP
  const currentLevel = getUserLevel();
  const xpForNextLevel = getXPForNextLevel();
  const currentXP = userProgress?.totalXp || 0;
  const xpProgress = ((currentXP % xpForNextLevel) / xpForNextLevel) * 100;
  return (
    <div className={cn("flex h-full", className)}>
      {/* Sidebar for lesson view */}
      {
        (viewMode = "lesson" && selectedModule && (
          <ModuleNavigation
            module={selectedModule}
            currentLesson={selectedLesson || undefined}
            moduleProgress={getModuleProgress(selectedModule.id)}
            lessonProgress={lessonProgressMap}
            onLessonSelect={handleLessonSelect}
            collapsible
          />
        ))
      }
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {viewMode !== "modules" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (viewMode === "exercise") {
                      setViewMode("lesson");
                    } else if (viewMode === "lesson") {
                      setViewMode("modules");
                      setSelectedModule(null);
                      setSelectedLesson(null);
                    } else {
                      setViewMode("modules");
                    }
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
              <h1 className="text-3xl font-bold">
                {(viewMode = "modules" && "Learning Dashboard")}
                {(viewMode = "path" && "Learning Path")}
                {(viewMode = "lesson" && selectedModule?.title)}
                {(viewMode = "exercise" && "Exercise")}
              </h1>
            </div>
            {/* User Stats */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="text-2xl font-bold">{currentLevel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  XP Progress
                </p>
                <div className="flex items-center gap-2">
                  <Progress value={xpProgress} className="w-32 h-2" />
                  <span className="text-sm">
                    {currentXP % xpForNextLevel} / {xpForNextLevel}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {userProgress?.learningStreak || 0}
                  <Zap className="w-5 h-5 text-yellow-500" />
                </p>
              </div>
            </div>
          </div>
          {/* Progress Overview (modules view only) */}
          {
            (viewMode = "modules" && (
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Book className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Modules</p>
                      <p className="text-xl font-bold">{modules.length}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Trophy className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-xl font-bold">
                        {
                          Array.from(moduleProgressMap.values()).filter(
                            (s: unknown) => (s = ModuleStatus.COMPLETED),
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                      <Target className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        In Progress
                      </p>
                      <p className="text-xl font-bold">
                        {
                          Array.from(moduleProgressMap.values()).filter(
                            (s: unknown) => (s = ModuleStatus.IN_PROGRESS),
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Progress</p>
                      <p className="text-xl font-bold">{overallProgress}%</p>
                    </div>
                  </div>
                </Card>
              </div>
            ))
          }
        </div>
        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Modules View */}
            {
              (viewMode = "modules" && (
                <motion.div
                  key="modules"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <Tabs defaultValue="modules" className="h-full flex flex-col">
                    <TabsList className="mx-6 mt-4">
                      <TabsTrigger value="paths">Learning Paths</TabsTrigger>
                      <TabsTrigger value="modules">All Modules</TabsTrigger>
                    </TabsList>
                    {/* Learning Paths Tab */}
                    <TabsContent value="paths" className="flex-1 p-6">
                      <ScrollArea className="h-full">
                        <div className="space-y-6">
                          {learningPaths.map((path: unknown) => (
                            <Card
                              key={path.id}
                              className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                              onClick={() => {
                                setSelectedPath(path);
                                setViewMode("path");
                              }}
                            >
                              <h3 className="text-xl font-semibold mb-2">
                                {path.name}
                              </h3>
                              <p className="text-muted-foreground mb-4">
                                {path.description}
                              </p>
                              <div className="flex items-center gap-6 text-sm">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {path.estimatedWeeks} weeks
                                </span>
                                <span className="flex items-center gap-1">
                                  <Book className="w-4 h-4" />
                                  {path.modules.length} modules
                                </span>
                                <Badge variant="outline">
                                  {path.targetRole}
                                </Badge>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    {/* All Modules Tab */}
                    <TabsContent value="modules" className="flex-1 p-0">
                      <div className="flex items-center justify-between px-6 py-3 border-b">
                        <p className="text-sm text-muted-foreground">
                          {modules.length} modules available
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={
                              (moduleViewType = "grid" ? "secondary" : "ghost")
                            }
                            size="icon"
                            onClick={() => setModuleViewType("grid")}
                          >
                            <Grid className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={
                              (moduleViewType = "list" ? "secondary" : "ghost")
                            }
                            size="icon"
                            onClick={() => setModuleViewType("list")}
                          >
                            <List className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <ScrollArea className="flex-1">
                        <div
                          className={cn(
                            "p-6",
                            (moduleViewType = "grid"
                              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                              : "space-y-4"),
                          )}
                        >
                          {modules.map((module: unknown) => (
                            <ModuleCard
                              key={module.id}
                              module={module}
                              status={
                                moduleProgressMap.get(module.id) ||
                                ModuleStatus.LOCKED
                              }
                              completionPercentage={getModuleCompletionPercentage(
                                module.id,
                                module.lessons.length,
                              )}
                              onClick={() => handleModuleSelect(module.id)}
                              detailed={(moduleViewType = "list")}
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </motion.div>
              ))
            }
            {/* Learning Path View */}
            {
              (viewMode = "path" && selectedPath && (
                <motion.div
                  key="path"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full overflow-auto"
                >
                  <LearningPathVisualization
                    learningPath={selectedPath}
                    modules={modules}
                    moduleProgress={moduleProgressMap}
                    onModuleClick={handleModuleSelect}
                  />
                </motion.div>
              ))
            }
            {/* Lesson View */}
            {
              (viewMode = "lesson" && selectedLesson && (
                <motion.div
                  key="lesson"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <LessonViewer
                    lesson={selectedLesson}
                    progress={getLessonProgress(selectedLesson.id)}
                    onComplete={handleLessonComplete}
                    onStartExercise={handleExerciseStart}
                    onNextLesson={handleNextLesson}
                    onPreviousLesson={handlePreviousLesson}
                    hasNextLesson={!!getNextLesson(selectedLesson.id)}
                    hasPreviousLesson={!!getPreviousLesson(selectedLesson.id)}
                  />
                </motion.div>
              ))
            }
            {/* Exercise View */}
            {
              (viewMode = "exercise" && selectedExercise && (
                <motion.div
                  key="exercise"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <InteractiveExercise
                    exercise={selectedExercise}
                    progress={getExerciseProgress(selectedExercise.id)}
                    onComplete={handleExerciseComplete}
                    onClose={() => {
                      setViewMode("lesson");
                      setSelectedExercise(null);
                    }}
                  />
                </motion.div>
              ))
            }
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
