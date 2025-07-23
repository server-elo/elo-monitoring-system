import { create } from 'zustand';
import type { Course, Lesson } from '@/types';
import { DEFAULT_COURSE } from '@/constants';

interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  currentLesson: Lesson | null;
  isLoading: boolean;
  loadCourses: () => Promise<void>;
  selectCourse: (courseId: string) => void;
  selectLesson: (lessonId: string) => void;
  markLessonComplete: (lessonId: string) => void;
  updateProgress: (courseId: string, progress: number) => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [DEFAULT_COURSE],
  currentCourse: null,
  currentLesson: null,
  isLoading: false,

  loadCourses: async () => {
    set({ isLoading: true });
    try {
      // In a real app, this would fetch from an API
      const mockCourses: Course[] = [
        DEFAULT_COURSE,
        {
          id: 'advanced-solidity',
          title: 'Advanced Solidity',
          description: 'Deep dive into advanced Solidity concepts',
          icon: '🚀',
          difficulty: 'Advanced' as const,
          estimatedTime: 120,
          lessons: [
            {
              id: 'gas-optimization',
              title: 'Gas Optimization',
              content: 'Learn how to optimize gas usage in your contracts',
              difficulty: 'Advanced' as const,
              estimatedTime: 45,
            },
          ],
          progress: 0,
        },
      ];
      set({ courses: mockCourses });
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  selectCourse: (courseId) => {
    const course = get().courses.find(c => c.id === courseId);
    if (course) {
      set({ currentCourse: course, currentLesson: null });
    }
  },

  selectLesson: (lessonId) => {
    const { currentCourse } = get();
    if (currentCourse) {
      const lesson = currentCourse.lessons.find(l => l.id === lessonId);
      if (lesson) {
        set({ currentLesson: lesson });
      }
    }
  },

  markLessonComplete: (lessonId) => {
    const { courses, currentCourse } = get();
    if (currentCourse) {
      const updatedCourses = courses.map(course => {
        if (course.id === currentCourse.id) {
          return {
            ...course,
            lessons: course.lessons.map(lesson =>
              lesson.id === lessonId ? { ...lesson, isCompleted: true } : lesson
            ),
          };
        }
        return course;
      });
      
      const updatedCourse = updatedCourses.find(c => c.id === currentCourse.id);
      set({ 
        courses: updatedCourses,
        currentCourse: updatedCourse || currentCourse,
      });
    }
  },

  updateProgress: (courseId, progress) => {
    const { courses } = get();
    const updatedCourses = courses.map(course =>
      course.id === courseId ? { ...course, progress } : course
    );
    set({ courses: updatedCourses });
  },
}));