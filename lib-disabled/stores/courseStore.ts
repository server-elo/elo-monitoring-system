import { create } from 'zustand';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content?: string;
  completed?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
  lessons: Lesson[];
  progress: number;
}

interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  currentLesson: Lesson | null;
  loadCourses: () => void;
  selectCourse: (courseId: string) => void;
  selectLesson: (lessonId: string) => void;
  markLessonComplete: (lessonId: string) => void;
  getCourseProgress: (courseId: string) => number;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  currentCourse: null,
  currentLesson: null,

  loadCourses: () => {
    // Mock course data
    const mockCourses: Course[] = [
      {
        id: 'solidity-basics',
        title: 'Solidity Basics',
        description: 'Learn the fundamentals of Solidity programming',
        icon: '🌱',
        progress: 75,
        lessons: [
          {
            id: 'solidity-basics-1',
            title: 'Introduction to Solidity',
            description: 'Learn what Solidity is and why it matters',
            duration: 15,
            difficulty: 'beginner',
            completed: true,
          },
          {
            id: 'solidity-basics-2',
            title: 'Variables and Data Types',
            description: 'Understanding primitive data types in Solidity',
            duration: 20,
            difficulty: 'beginner',
            completed: true,
          },
          {
            id: 'solidity-basics-3',
            title: 'Functions and Modifiers',
            description: 'Creating and using functions in smart contracts',
            duration: 30,
            difficulty: 'beginner',
            completed: false,
          },
          {
            id: 'solidity-basics-4',
            title: 'Smart Contract Structure',
            description: 'Building your first complete smart contract',
            duration: 45,
            difficulty: 'beginner',
            completed: false,
          },
        ],
      },
      {
        id: 'advanced-patterns',
        title: 'Advanced Patterns',
        description: 'Learn advanced Solidity development patterns',
        icon: '🚀',
        progress: 30,
        lessons: [
          {
            id: 'advanced-1',
            title: 'Inheritance and Interfaces',
            description: 'Using OOP concepts in Solidity',
            duration: 40,
            difficulty: 'intermediate',
            completed: true,
          },
          {
            id: 'advanced-2',
            title: 'Design Patterns',
            description: 'Common smart contract design patterns',
            duration: 50,
            difficulty: 'intermediate',
            completed: false,
          },
        ],
      },
      {
        id: 'defi-protocols',
        title: 'DeFi Protocols',
        description: 'Build complex DeFi applications',
        icon: '⚡',
        progress: 0,
        lessons: [
          {
            id: 'defi-1',
            title: 'Introduction to DeFi',
            description: 'Understanding decentralized finance',
            duration: 35,
            difficulty: 'advanced',
            completed: false,
          },
        ],
      },
    ];

    set({ courses: mockCourses });
  },

  selectCourse: (courseId) => {
    const { courses } = get();
    const course = courses.find(c => c.id === courseId);
    if (course) {
      set({ currentCourse: course });
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
    const { courses } = get();
    const updatedCourses = courses.map(course => ({
      ...course,
      lessons: course.lessons.map(lesson =>
        lesson.id === lessonId ? { ...lesson, completed: true } : lesson
      ),
    }));
    
    // Recalculate progress
    updatedCourses.forEach(course => {
      const completedCount = course.lessons.filter(l => l.completed).length;
      course.progress = Math.round((completedCount / course.lessons.length) * 100);
    });

    set({ courses: updatedCourses });
  },

  getCourseProgress: (courseId) => {
    const { courses } = get();
    const course = courses.find(c => c.id === courseId);
    return course?.progress || 0;
  },
}));