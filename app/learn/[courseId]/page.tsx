'use client';

import { ReactElement, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthenticatedNavbar } from '@/components/navigation/AuthenticatedNavbar';
import { useCourseStore } from '@/lib/stores/courseStore';
import { useUserStore } from '@/lib/stores/userStore';
import { Play, Clock, CheckCircle, Lock } from 'lucide-react';

export default function CourseDetailPage(): ReactElement {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const { courses, currentCourse, loadCourses, selectCourse, selectLesson, markLessonComplete } = useCourseStore();
  const { user, addXP, completeLesson } = useUserStore();

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (courses.length > 0 && courseId) {
      selectCourse(courseId);
    }
  }, [courses, courseId, selectCourse]);

  const handleStartLesson = (lessonId: string) => {
    selectLesson(lessonId);
    router.push(`/learn/${courseId}/${lessonId}`);
  };

  const handleCompleteLesson = (lessonId: string) => {
    markLessonComplete(lessonId);
    completeLesson(lessonId);
    addXP(50); // Award 50 XP for completing a lesson
  };

  if (!currentCourse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <AuthenticatedNavbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-white text-xl">Loading course...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <AuthenticatedNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Course Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-6xl">{currentCourse.icon}</div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{currentCourse.title}</h1>
                <p className="text-xl text-gray-300 mb-4">{currentCourse.description}</p>
                <div className="flex items-center space-x-6 text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{currentCourse.lessons.reduce((total, lesson) => total + lesson.duration, 0)} minutes</span>
                  </span>
                  <span>{currentCourse.lessons.length} lessons</span>
                  <span className="text-green-400">{currentCourse.progress}% complete</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-2">Progress</div>
              <div className="w-32 bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full" 
                  style={{width: `${currentCourse.progress}%`}}
                />
              </div>
              <div className="text-sm text-gray-300 mt-1">{currentCourse.progress}%</div>
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-6">Course Lessons</h2>
            <div className="space-y-4">
              {currentCourse.lessons.map((lesson, index) => {
                const isCompleted = lesson.completed || user?.completedLessons.includes(lesson.id);
                const isLocked = index > 0 && !currentCourse.lessons[index - 1].completed;
                
                return (
                  <div 
                    key={lesson.id} 
                    className={`bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 transition-all duration-200 ${
                      isLocked ? 'opacity-50' : 'hover:bg-white/15 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6 text-green-400" />
                          ) : isLocked ? (
                            <Lock className="w-6 h-6 text-gray-500" />
                          ) : (
                            <Play className="w-6 h-6 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold ${isLocked ? 'text-gray-500' : 'text-white'}`}>
                            {lesson.title}
                          </h3>
                          <p className={`text-sm ${isLocked ? 'text-gray-600' : 'text-gray-300'}`}>
                            {lesson.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{lesson.duration} min</span>
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              lesson.difficulty === 'beginner' ? 'bg-green-500/20 text-green-300' :
                              lesson.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {lesson.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {isCompleted ? (
                          <button 
                            onClick={() => handleStartLesson(lesson.id)}
                            className="px-4 py-2 bg-green-600/20 border border-green-500/30 text-green-300 rounded-lg text-sm hover:bg-green-600/30 transition-colors"
                          >
                            Review
                          </button>
                        ) : isLocked ? (
                          <button 
                            disabled
                            className="px-4 py-2 bg-gray-600/20 border border-gray-500/30 text-gray-500 rounded-lg text-sm cursor-not-allowed"
                          >
                            Locked
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleStartLesson(lesson.id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Start
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Course Sidebar */}
          <div className="space-y-6">
            {/* Course Stats */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-4">Course Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Lessons</span>
                  <span className="text-white">{currentCourse.lessons.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Completed</span>
                  <span className="text-green-400">
                    {currentCourse.lessons.filter(l => l.completed).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Duration</span>
                  <span className="text-white">
                    {Math.round(currentCourse.lessons.reduce((total, lesson) => total + lesson.duration, 0) / 60)} hours
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">XP Reward</span>
                  <span className="text-yellow-400">
                    {currentCourse.lessons.length * 50} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Next Lesson */}
            {(() => {
              const nextLesson = currentCourse.lessons.find(l => !l.completed);
              if (nextLesson) {
                return (
                  <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30">
                    <h3 className="text-lg font-bold text-white mb-2">Continue Learning</h3>
                    <p className="text-sm text-gray-300 mb-4">{nextLesson.title}</p>
                    <button 
                      onClick={() => handleStartLesson(nextLesson.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Continue Course
                    </button>
                  </div>
                );
              }
              return (
                <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-md rounded-xl p-6 border border-green-500/30">
                  <h3 className="text-lg font-bold text-white mb-2">🎉 Course Complete!</h3>
                  <p className="text-sm text-gray-300 mb-4">You've completed all lessons in this course.</p>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors">
                    Get Certificate
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}