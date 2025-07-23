'use client';

import { ReactElement, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthenticatedNavbar } from '@/components/navigation/AuthenticatedNavbar';
import { useCourseStore, Course } from '@/lib/stores/courseStore';

export default function LearnPage(): ReactElement {
  const { courses, loadCourses, selectCourse } = useCourseStore();
  const router = useRouter();

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleStartCourse = (course: Course) => {
    selectCourse(course.id);
    // For now, redirect to the first lesson or course overview
    router.push(`/learn/${course.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <AuthenticatedNavbar />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">📚 Learning Center</h1>
          <p className="text-xl text-gray-300">Master Solidity with our structured learning path</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const difficultyColors = {
              'solidity-basics': 'bg-green-600 hover:bg-green-700',
              'advanced-patterns': 'bg-blue-600 hover:bg-blue-700',
              'defi-protocols': 'bg-purple-600 hover:bg-purple-700',
            };
            
            return (
              <div key={course.id} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="text-3xl mb-4">{course.icon}</div>
                <h3 className="text-xl font-bold text-white mb-4">{course.title}</h3>
                <p className="text-gray-300 mb-4">{course.description}</p>
                <ul className="text-sm text-gray-400 space-y-2 mb-6">
                  {course.lessons.slice(0, 4).map((lesson) => (
                    <li key={lesson.id}>• {lesson.title}</li>
                  ))}
                </ul>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-300 mb-2">
                    <span>Progress</span>
                    <span>{course.progress}% Complete</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${course.progress > 0 ? 'bg-blue-500' : 'bg-gray-500'}`} 
                      style={{width: `${course.progress}%`}}
                    />
                  </div>
                </div>
                <button 
                  onClick={() => handleStartCourse(course)}
                  className={`w-full ${difficultyColors[course.id as keyof typeof difficultyColors] || 'bg-blue-600 hover:bg-blue-700'} text-white py-3 rounded-lg font-semibold transition-colors`}
                >
                  {course.progress > 0 ? 'Continue Course' : 'Start Course'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Progress Section */}
        <div className="mt-12 bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">Your Learning Progress</h2>
          <div className="space-y-4">
            {courses.map((course) => {
              const progressColor = course.progress >= 75 ? 'bg-green-500' : course.progress >= 30 ? 'bg-blue-500' : 'bg-purple-500';
              return (
                <div key={course.id}>
                  <div className="flex justify-between text-sm text-gray-300 mb-2">
                    <span>{course.title}</span>
                    <span>{course.progress === 0 ? 'Not Started' : `${course.progress}% Complete`}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className={`${progressColor} h-2 rounded-full`} style={{width: `${course.progress}%`}}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}