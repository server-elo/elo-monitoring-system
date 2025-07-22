/**;
* @fileoverview Lesson viewer component with markdown support
* @module components/learning/LessonViewer
*/
'use client';
import { ReactElement, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Lesson, LessonProgress, Exercise } from '@/types/learning';
import { cn } from '@/lib/utils';
import {
  Clock,
  Video,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Code,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
interface LessonViewerProps {
  /** The lesson to display */
  lesson: Lesson;
  /** User's progress for this lesson */
  progress?: LessonProgress;
  /** Callback when lesson is completed */
  onComplete?: () => void;
  /** Callback when an exercise is started */
  onStartExercise?: (exercise: Exercise) => void;
  /** Callback to navigate to next lesson */
  onNextLesson?: () => void;
  /** Callback to navigate to previous lesson */
  onPreviousLesson?: () => void;
  /** Whether there is a next lesson */
  hasNextLesson?: boolean;
  /** Whether there is a previous lesson */
  hasPreviousLesson?: boolean;
  /** Optional CSS class name */
  className?: string;
}
/**
* Displays lesson content with markdown rendering and interactive features.
*
* Supports markdown content, syntax highlighting, video embedding,
* exercises, and progress tracking.
*
* @component
* @example
* ```tsx
* <LessonViewer
*   lesson={currentLesson}
*   progress={userProgress}
*   onComplete={handleLessonComplete}
*   onStartExercise={handleExerciseStart}
*   onNextLesson={handleNextLesson}
*   hasPreviousLesson={true}
*   hasNextLesson={true}
* />
* ```
*/
export function LessonViewer({
  lesson,
  progress,
  onComplete,
  onStartExercise,
  onNextLesson,
  onPreviousLesson,
  hasNextLesson = false,
  hasPreviousLesson = false,
  className
}: LessonViewerProps): ReactElement {
  const [activeTab, setActiveTab] = useState<'content' | 'exercises' | 'resources'>('content');
  const [readingProgress, setReadingProgress] = useState(0);
  const [startTime] = useState(Date.now());
  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.getElementById('lesson-content');
      if (!scrollContainer) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };
    const scrollContainer = document.getElementById('lesson-content');
    scrollContainer?.addEventListener('scroll', handleScroll);
    return () => scrollContainer?.removeEventListener('scroll', handleScroll);
  }, []);
  // Mark lesson as complete when reading progress reaches 100%
  useEffect(() => {
    if (readingProgress >= 95 && !progress?.completed) {
      const timeSpent = Math.floor((Date.now() - startTime) / 60000); // in minutes
      if (timeSpent >= lesson.duration * 0.5) { // At least 50% of estimated time
      onComplete?.();
    }
  }
}, [readingProgress, progress?.completed, startTime, lesson.duration, onComplete]);
// Custom markdown components
const markdownComponents = {
  code({ node,
  inline,
  className,
  children,
  ...props
}: unknown) {
  const match = /language-(\w+)/.exec(className || '');
  return !inline && match ? (
    <SyntaxHighlighter
    style={vscDarkPlus}
    language={match[1]}
    PreTag="div"
    {...props}>{String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  ) : (
    <code className={cn('bg-muted px-1 py-0.5 rounded text-sm font-mono', className)} {...props}>
    {children}
    </code>
  );
},
h1: ({ children }: unknown) => (
  <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>
),
h2: ({ children }: unknown) => (
  <h2 className="text-2xl font-semibold mt-6 mb-3">{children}</h2>
),
h3: ({ children }: unknown) => (
  <h3 className="text-xl font-semibold mt-4 mb-2">{children}</h3>
),
p: ({ children }: unknown) => (
  <p className="mb-4 leading-relaxed">{children}</p>
),
ul: ({ children }: unknown) => (
  <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
),
ol: ({ children }: unknown) => (
  <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
),
li: ({ children }: unknown) => (
  <li className="ml-4">{children}</li>
),
blockquote: ({ children }: unknown) => (
  <blockquote className="border-l-4 border-primary pl-4 italic my-4">
  {children}
  </blockquote>
)
};
// Get lesson type icon
const getLessonTypeIcon = () => {
  switch (lesson.type) {
    case 'theory':
      return <BookOpen className="w-4 h-4" />;
    case 'practical':
    case 'exercise':
      return <Code className="w-4 h-4" />;
    case 'project':
      return <FileText className="w-4 h-4" />;
    case 'quiz':
      return <Lightbulb className="w-4 h-4" />;
    default:
      return <BookOpen className="w-4 h-4" />;
  }
};
return (
  <div className={cn('flex flex-col h-full', className)}>
  {/* Header */}
  <div className="border-b p-6">
  <div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-2">
  {getLessonTypeIcon()}
  <Badge variant="outline">{lesson.type}</Badge>
  <span className="text-sm text-muted-foreground flex items-center gap-1">
  <Clock className="w-3 h-3" />
  {lesson.duration} min
  </span>
  </div>
  {progress?.completed && (
    <Badge variant="default" className="gap-1">
    <CheckCircle2 className="w-3 h-3" />
    Completed
    </Badge>
  )}
  </div>
  <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
  <p className="text-muted-foreground">{lesson.description}</p>
  {/* Reading Progress */}
  <div className="mt-4">
  <Progress value={readingProgress} className="h-1" />
  </div>
  </div>
  {/* Content Tabs */}
  <Tabs value={activeTab} onValueChange={(v: unknown) => setActiveTab(v as any)} className="flex-1 flex flex-col">
  <TabsList className="mx-6 mt-4">
  <TabsTrigger value="content">Content</TabsTrigger>
  {lesson.exercises.length>0 && (
    <TabsTrigger value="exercises">
    Exercises ({lesson.exercises.length})
    </TabsTrigger>
  )}
  {lesson.resources.length>0 && (
    <TabsTrigger value="resources">
    Resources ({lesson.resources.length})
    </TabsTrigger>
  )}
  </TabsList>
  {/* Content Tab */}
  <TabsContent value="content" className="flex-1 p-0">
  <ScrollArea id="lesson-content" className="flex-1 px-6">
  <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
  className="py-6 max-w-4xl mx-auto">{/* Video if available */}
  {lesson.videoUrl && (
    <Card className="mb-6 p-4">
    <div className="flex items-center gap-2 mb-2">
    <Video className="w-4 h-4" />
    <span className="font-medium">Video Lesson</span>
    </div>
    <div className="aspect-video bg-black rounded-lg">
    <iframe
    src={lesson.videoUrl}
    className="w-full h-full rounded-lg"
    allowFullScreen
    />
    </div>
    </Card>
  )}
  {/* Markdown Content */}
  <div className="prose prose-gray dark:prose-invert max-w-none">
  <ReactMarkdown components={markdownComponents}>
  {lesson.content}
  </ReactMarkdown>
  </div>
  {/* Key Takeaways */}
  {lesson.keyTakeaways.length>0 && (
    <Card className="mt-8 p-6 bg-primary/5">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
    <Lightbulb className="w-5 h-5 text-primary" />
    Key Takeaways
    </h3>
    <ul className="space-y-2">
    {lesson.keyTakeaways.map((takeaway, index) => (
      <motion.li
      key={index}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
      <span>{takeaway}</span>
      </motion.li>
    ))}
    </ul>
    </Card>
  )}
  </motion.div>
  </ScrollArea>
  </TabsContent>
  {/* Exercises Tab */}
  <TabsContent value="exercises" className="flex-1 p-6">
  <ScrollArea className="h-full">
  <div className="space-y-4 max-w-4xl mx-auto">
  {lesson.exercises.map((exercise, index) => (
    <motion.div
    key={exercise.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}><Card className="p-6">
    <div className="flex items-start justify-between mb-4">
    <div>
    <h3 className="text-lg font-semibold mb-1">{exercise.title}</h3>
    <p className="text-sm text-muted-foreground">{exercise.description}</p>
    </div>
    <div className="flex items-center gap-2">
    <Badge variant="outline">
    {exercise.difficulty}
    </Badge>
    <Badge variant="secondary">
    {exercise.xpReward} XP
    </Badge>
    </div>
    </div>
    <p className="mb-4">{exercise.instructions}</p>
    {exercise.timeLimit && (
      <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
      <Clock className="w-3 h-3" />
      Time limit: {exercise.timeLimit} minutes
      </p>
    )}
    <Button
    onClick={() => onStartExercise?.(exercise)}
    className="w-full">Start Exercise
    </Button>
    </Card>
    </motion.div>
  ))}
  </div>
  </ScrollArea>
  </TabsContent>
  {/* Resources Tab */}
  <TabsContent value="resources" className="flex-1 p-6">
  <ScrollArea className="h-full">
  <div className="space-y-4 max-w-4xl mx-auto">
  {lesson.resources.map((resource, index) => (
    <motion.a
    key={resource.id}
    href={resource.url}
    target="_blank"
    rel="noopener noreferrer"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="block"><Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
    <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
    <FileText className="w-5 h-5 text-muted-foreground" />
    <div>
    <h4 className="font-medium">{resource.title}</h4>
    {resource.description && (
      <p className="text-sm text-muted-foreground">
      {resource.description}
      </p>
    )}
    </div>
    </div>
    <ExternalLink className="w-4 h-4 text-muted-foreground" />
    </div>
    </Card>
    </motion.a>
  ))}
  </div>
  </ScrollArea>
  </TabsContent>
  </Tabs>
  {/* Navigation Footer */}
  <div className="border-t p-4 flex items-center justify-between">
  <Button
  variant="outline"
  onClick={onPreviousLesson}
  disabled={!hasPreviousLesson}
  className="gap-2"><ChevronLeft className="w-4 h-4" />
  Previous Lesson
  </Button>
  {!progress?.completed && readingProgress >= 95 && (
    <Button
    onClick={onComplete}
    variant="default">Mark as Complete
    </Button>
  )}
  <Button
  variant="outline"
  onClick={onNextLesson}
  disabled={!hasNextLesson}
  className="gap-2">Next Lesson
  <ChevronRight className="w-4 h-4" />
  </Button>
  </div>
  </div>
);
}
