export const APP_NAME = 'Solidity Learning Platform';
export const APP_VERSION = '2.0.0';
export const APP_DESCRIPTION = 'Master Smart Contract Development';

export const NAVIGATION_ITEMS = [
  { name: 'Home', href: '/', icon: 'home' },
  { name: 'Learn', href: '/learn', icon: 'book' },
  { name: 'Code Lab', href: '/code', icon: 'code' },
  { name: 'Collaborate', href: '/collaborate', icon: 'users' },
  { name: 'Achievements', href: '/achievements', icon: 'trophy' },
  { name: 'Jobs', href: '/jobs', icon: 'briefcase' },
  { name: 'Certificates', href: '/certificates', icon: 'award' },
];

export const DEFAULT_LESSON = {
  id: 'intro-solidity',
  title: 'Introduction to Solidity',
  content: 'Welcome to Solidity development!',
  difficulty: 'Beginner' as const,
  estimatedTime: 30,
};

export const DEFAULT_COURSE = {
  id: 'solidity-basics',
  title: 'Solidity Basics',
  description: 'Learn the fundamentals of Solidity programming',
  icon: '📚',
  difficulty: 'Beginner' as const,
  estimatedTime: 60,
  lessons: [DEFAULT_LESSON],
  progress: 0,
};
