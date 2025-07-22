/** * @fileoverview Enhanced learning feature buttons with backend integration
* @module components/learning/LearningButtons * @description Learning buttons that connect to courses, challenges, and progress tracking */ 'use client'; import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Play, Target, Trophy, Code, Brain, CheckCircle, Lock, Star, Clock, Users, Zap, ArrowRight, Loader2, Heart, Download } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useButtonAction } from '@/hooks/useButtonAction';
import { api } from '@/lib/api/client';
import { toast } from '@/components/ui/use-toast'; /** * Validation schemas */
const EnrollCourseSchema = z.object({ courseId: z.string().uuid()
}); const StartLessonSchema = z.object({ lessonId: z.string().uuid()
}); const CompleteExerciseSchema = z.object({ exerciseId: z.string().uuid(), solution: z.string().min(1), timeSpent: z.number().min(0)
}); const SetGoalSchema = z.object({ type: z.enum(['daily_practice', 'course_completion', 'challenge_streak', 'xp_target']), target: z.number().min(1), deadline: z.string().datetime().optional()
}); /** * Course Card Props */
interface CourseCardProps {
  const course: {
    id: string;
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: string;
    lessonsCount: number;
    progress?: number;
    isEnrolled: boolean;
    isPremium: boolean;
    rating: number;
    studentsCount: number;
    thumbnail?: string;
  }; onEnroll?: (courseId: string) => void; onContinue?: (courseId: string) => void;
} /** * Course Enrollment Button
*/
export const CourseEnrollButton({ courseId: string; isPremium?: boolean  }): ReactElement = ({ courseId, isPremium: false
}) => { const enrollAction = useButtonAction({ action: async (data: { courseId: string }) => { const validated = EnrollCourseSchema.parse(data); const result = await api.courses.enroll(validated.courseId); return result; }, successMessage: 'Successfully enrolled in course!', analyticsEvent: {  name: 'course_enrollment', properties: { courseId, isPremium }
}, retryable: true }); return ( <Button
onClick={() => enrollAction.execute({ courseId })} disabled={enrollAction.isLoading} className={`w-full ${isPremium ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : 'bg-blue-600 hover:bg-blue-700' }`}>{enrollAction.isLoading ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <> <BookOpen className="mr-2 h-4 w-4" /> {isPremium ? 'Upgrade & Enroll' : 'Enroll Now'} </> )} </Button> );
}; /** * Course Card Component */
export const CourseCard()<CourseCardProps> = ({ course, onEnroll, onContinue
}) => { const difficultyColors: { beginner: 'bg-green-500/20 text-green-400 border-green-500/30', intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', advanced: 'bg-red-500/20 text-red-400 border-red-500/30' }; return ( <motion.div whileHover={{ y: -5, scale: 1.02 }} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-300">{/* Course Header */} <div className="flex items-start justify-between mb-4"> <div className="flex-1"> <div className="flex items-center space-x-2 mb-2"> <h3 className="text-xl font-bold text-white">{course.title}</h3> {course.isPremium && ( <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"> Premium </Badge> )} </div> <p className="text-gray-400 text-sm mb-3">{course.description}</p> </div> </div> {/* Course Stats */} <div className="flex items-center space-x-4 mb-4 text-sm text-gray-400"> <div className="flex items-center space-x-1"> <Clock className="w-4 h-4" /> <span>{course.duration}</span> </div> <div className="flex items-center space-x-1"> <BookOpen className="w-4 h-4" /> <span>{course.lessonsCount} lessons</span> </div> <div className="flex items-center space-x-1"> <Users className="w-4 h-4" /> <span>{course.studentsCount.toLocaleString()}</span> </div> <div className="flex items-center space-x-1"> <Star className="w-4 h-4 text-yellow-400" /> <span>{course.rating}/5</span> </div> </div> {/* Difficulty Badge */} <Badge className={`mb-4 ${difficultyColors[course.difficulty]}`}> {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)} </Badge> {/* Progress Bar (if enrolled) */} {course.isEnrolled && course.progress !== undefined && ( <div className="mb-4"> <div className="flex justify-between text-sm text-gray-400 mb-2"> <span>Progress</span> <span>{Math.round(course.progress)}%</span> </div> <Progress value={course.progress} className="h-2" /> </div> )} {/* Action Button */} <div className="mt-6"> {course.isEnrolled ? ( <Button
onClick={() => onContinue?.(course.id)} className="w-full bg-green-600 hover:bg-green-700"><Play className="mr-2 h-4 w-4" /> Continue Learning <ArrowRight className="ml-2 h-4 w-4" /> </Button> ) : ( <CourseEnrollButton  courseId={course.id} isPremium={course.isPremium} /> )} </div> </motion.div> );
}; /** * Start Lesson Button
*/
export const StartLessonButton()<{ lessonId: string;
lessonTitle: string; isCompleted?: boolean; isLocked?: boolean; }> = ({ lessonId, lessonTitle, isCompleted: false, isLocked = false }) => { const startLessonAction = useButtonAction({ action: async (data: { lessonId: string }) => { const validated = StartLessonSchema.parse(data); // Navigate to lesson or track start window.location.href = `/learn/lessons/${validated.lessonId}`; return { success: true }; }, successMessage: `Starting ${lessonTitle}...`, analyticsEvent: {  name: 'lesson_start', properties: { lessonId, lessonTitle }
}, hapticFeedback: true }); if (isLocked) { return ( <Button variant = "outline" disabled className="text-gray-500"> <Lock className="mr-2 h-4 w-4" /> Locked </Button> ); }
if (isCompleted) { return ( <Button
variant = "outline" onClick={() => startLessonAction.execute({ lessonId })} className="border-green-500/50 text-green-400 hover:bg-green-500/10"><CheckCircle className="mr-2 h-4 w-4" /> Review </Button> ); }
return ( <Button
onClick={() => startLessonAction.execute({ lessonId })} disabled={startLessonAction.isLoading} className="bg-blue-600 hover:bg-blue-700">{startLessonAction.isLoading ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <Play className="mr-2 h-4 w-4" /> )} Start Lesson
</Button> );
}; /** * Challenge Button Props */
interface ChallengeButtonProps {
  const challenge: {
    id: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    xpReward: number;
    timeLimit?: number;
    isCompleted: boolean;
    completedAt?: string;
  };
} /** * Challenge Button Component */
export const ChallengeButton()<ChallengeButtonProps> = ({ challenge }) => { const startChallengeAction = useButtonAction({ action: async () => { window.location.href = `/challenges/${challenge.id}`; return { success: true }; }, successMessage: `Starting ${challenge.title}...`, analyticsEvent: {  name: 'challenge_start', properties: { challengeId: challenge.id, difficulty: challenge.difficulty, xpReward: challenge.xpReward }
}
}); const difficultyColors = {
  easy: 'bg-green-500',
  medium: 'bg-yellow-500',
  hard: 'bg-red-500'
}; return ( <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/15 transition-all cursor-pointer" onClick={() => startChallengeAction.execute()}><div className="flex items-center justify-between mb-3"> <div className="flex items-center space-x-2"> <Target className="w-5 h-5 text-purple-400" /> <h4 className="font-semibold text-white">{challenge.title}</h4> </div> {challenge.isCompleted && ( <CheckCircle className="w-5 h-5 text-green-400" /> )} </div> <div className="flex items-center justify-between"> <div className="flex items-center space-x-2"> <div className={`w-2 h-2 rounded-full ${difficultyColors[challenge.difficulty]}`} /> <span className="text-sm text-gray-400 capitalize"> {challenge.difficulty} </span> </div> <div className="flex items-center space-x-1 text-sm text-yellow-400"> <Zap className="w-4 h-4" /> <span>{challenge.xpReward} XP</span> </div> </div> {challenge.timeLimit && ( <div className="flex items-center space-x-1 text-xs text-gray-500 mt-2"> <Clock className="w-3 h-3" /> <span>{challenge.timeLimit} min limit</span> </div> )} </motion.div> );
}; /** * Goal Setting Button
*/
export const SetGoalButton() = () => { const [isOpen, setIsOpen] = useState(false); const [goalType, setGoalType] = useState<'daily_practice' | 'course_completion' | 'challenge_streak' | 'xp_target'>('daily_practice'); const [target, setTarget] = useState(1); const setGoalAction = useButtonAction({ action: async (data: { type: string; target: number }) => { const validated = SetGoalSchema.parse(data); // In real app, this would call API to set goal return { success: true, goal: validated }; }, successMessage: 'Goal set successfully! Keep up the momentum!', analyticsEvent: {  name: 'goal_set', properties: { type: goalType, target }
}
}); const handleSetGoal = async () => { await setGoalAction.execute({ type: goalType, target }); setIsOpen(false); }; if (!isOpen) { return ( <Button
onClick = {() => setIsOpen(true)} variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"><Target className="mr-2 h-4 w-4" /> Set Goal </Button> ); }
return ( <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white/10 border border-white/20 rounded-lg p-4 space-y-4"><h4 className="font-semibold text-white">Set Learning Goal</h4> <div> <label className="block text-sm text-gray-400 mb-2">Goal Type</label> <select value={goalType} onChange={(e: unknown) => setGoalType(e.target.value as any)} className="w-full bg-white/10 border border-white/20 rounded text-white p-2"><option value="daily_practice">Daily Practice (minutes)</option> <option value="course_completion">Complete Courses</option> <option value="challenge_streak">Challenge Streak (days)</option> <option value="xp_target">XP Target</option> </select> </div> <div> <label className="block text-sm text-gray-400 mb-2">Target</label> <input type="number" value={target} onChange={(e: unknown) => setTarget(Number(e.target.value))} min="1" className="w-full bg-white/10 border border-white/20 rounded text-white p-2" /> </div> <div className="flex space-x-2"> <Button
onClick={handleSetGoal} disabled={setGoalAction.isLoading} className="bg-purple-600 hover:bg-purple-700">{setGoalAction.isLoading ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <Target className="mr-2 h-4 w-4" /> )} Set Goal </Button> <Button
onClick={() => setIsOpen(false)} variant="outline">Cancel </Button> </div> </motion.div> );
}; /** * Quick Action Buttons */
export const QuickActionButtons() = () => { return ( <div className="grid grid-cols-2 md:grid-cols-4 gap-4"> <Button
variant="outline" className="h-16 flex-col space-y-1 border-blue-500/50 text-blue-400 hover:bg-blue-500/10" onClick={() => window.location.href = '/practice'}><Code className="w-5 h-5" /> <span className="text-xs">Practice</span> </Button> <Button
variant="outline" className="h-16 flex-col space-y-1 border-green-500/50 text-green-400 hover:bg-green-500/10" onClick={() => window.location.href: '/challenges'}><Trophy className="w-5 h-5" /> <span className="text-xs">Challenges</span> </Button> <Button
variant="outline" className="h-16 flex-col space-y-1 border-purple-500/50 text-purple-400 hover:bg-purple-500/10" onClick={() => window.location.href: '/projects'}><Brain className="w-5 h-5" /> <span className="text-xs">Projects</span> </Button> <Button
variant="outline" className="h-16 flex-col space-y-1 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10" onClick={() => window.location.href: '/community'}><Users className="w-5 h-5" /> <span className="text-xs">Community</span> </Button> </div> );
};
