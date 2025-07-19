/**
 * Data Generators
 * Utilities for generating consistent test data
 */

import { faker } from '@faker-js/faker';

// Seed faker for consistent test data
faker.seed(12345);

// User data generators
export const generateUser = (_overrides: any = {}) => ({
  id: faker.string.uuid(_),
  email: faker.internet.email(_),
  username: faker.internet.username(_),
  firstName: faker.person.firstName(_),
  lastName: faker.person.lastName(_),
  role: faker.helpers.arrayElement( ['STUDENT', 'INSTRUCTOR', 'ADMIN']),
  status: faker.helpers.arrayElement( ['ACTIVE', 'INACTIVE', 'BANNED']),
  emailVerified: faker.date.past(_),
  image: faker.image.avatar(_),
  createdAt: faker.date.past(_),
  updatedAt: faker.date.recent(_),
  ...overrides,
});

export const generateStudent = (_overrides: any = {}) => 
  generateUser( { role: 'STUDENT', ...overrides });

export const generateInstructor = (_overrides: any = {}) => 
  generateUser( { role: 'INSTRUCTOR', ...overrides });

export const generateAdmin = (_overrides: any = {}) => 
  generateUser( { role: 'ADMIN', ...overrides });

// User profile generators
export const generateUserProfile = (_overrides: any = {}) => ({
  id: faker.string.uuid(_),
  userId: faker.string.uuid(_),
  xpTotal: faker.number.int( { min: 0, max: 10000 }),
  level: faker.number.int( { min: 1, max: 50 }),
  lessonsCompleted: faker.number.int( { min: 0, max: 100 }),
  coursesCompleted: faker.number.int( { min: 0, max: 20 }),
  achievementsCount: faker.number.int( { min: 0, max: 50 }),
  currentStreak: faker.number.int( { min: 0, max: 30 }),
  longestStreak: faker.number.int( { min: 0, max: 100 }),
  lastActiveAt: faker.date.recent(_),
  preferences: {
    theme: faker.helpers.arrayElement( ['light', 'dark', 'system']),
    language: faker.helpers.arrayElement( ['en', 'es', 'fr', 'de', 'zh']),
    timezone: faker.location.timeZone(_),
    emailNotifications: faker.datatype.boolean(_),
    pushNotifications: faker.datatype.boolean(_),
    weeklyDigest: faker.datatype.boolean(_),
    achievementNotifications: faker.datatype.boolean(_),
  },
  createdAt: faker.date.past(_),
  updatedAt: faker.date.recent(_),
  ...overrides,
});

// Course data generators
export const generateCourse = (_overrides: any = {}) => ({
  id: faker.string.uuid(_),
  title: faker.lorem.sentence(_),
  description: faker.lorem.paragraphs(_),
  slug: faker.lorem.slug(_),
  difficulty: faker.helpers.arrayElement( ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  category: faker.helpers.arrayElement([
    'Smart Contracts',
    'DeFi',
    'NFTs',
    'Security',
    'Advanced Patterns',
    'Web3 Integration'
  ]),
  estimatedDuration: faker.number.int( { min: 30, max: 480 }), // 30 minutes to 8 hours
  xpReward: faker.number.int( { min: 100, max: 1000 }),
  instructorId: faker.string.uuid(_),
  status: faker.helpers.arrayElement( ['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  isPublished: faker.datatype.boolean(_),
  enrollmentCount: faker.number.int( { min: 0, max: 1000 }),
  completionCount: faker.number.int( { min: 0, max: 800 }),
  averageRating: faker.number.float( { min: 1, max: 5, fractionDigits: 1 }),
  ratingCount: faker.number.int( { min: 0, max: 200 }),
  tags: faker.helpers.arrayElements([
    'solidity',
    'ethereum',
    'smart-contracts',
    'defi',
    'nft',
    'security',
    'testing',
    'deployment'
  ], { min: 1, max: 4 }),
  prerequisites: [],
  createdAt: faker.date.past(_),
  updatedAt: faker.date.recent(_),
  ...overrides,
});

// Lesson data generators
export const generateLesson = (_overrides: any = {}) => ({
  id: faker.string.uuid(_),
  title: faker.lorem.sentence(_),
  description: faker.lorem.paragraph(_),
  content: generateSolidityCode(_),
  type: faker.helpers.arrayElement( ['THEORY', 'CODING', 'QUIZ', 'PROJECT']),
  difficulty: faker.helpers.arrayElement( ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  estimatedDuration: faker.number.int( { min: 10, max: 120 }), // 10 minutes to 2 hours
  xpReward: faker.number.int( { min: 50, max: 300 }),
  order: faker.number.int( { min: 1, max: 20 }),
  courseId: faker.string.uuid(_),
  prerequisites: [],
  tags: faker.helpers.arrayElements([
    'functions',
    'variables',
    'events',
    'modifiers',
    'inheritance',
    'interfaces'
  ], { min: 1, max: 3 }),
  status: faker.helpers.arrayElement( ['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  isPublished: faker.datatype.boolean(_),
  createdAt: faker.date.past(_),
  updatedAt: faker.date.recent(_),
  ...overrides,
});

// Progress data generators
export const generateProgress = (_overrides: any = {}) => ({
  id: faker.string.uuid(_),
  userId: faker.string.uuid(_),
  lessonId: faker.string.uuid(_),
  courseId: faker.string.uuid(_),
  status: faker.helpers.arrayElement( ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
  completedAt: faker.helpers.maybe(() => faker.date.recent(_), { probability: 0.6 }),
  timeSpent: faker.number.int( { min: 300, max: 7200 }), // 5 minutes to 2 hours in seconds
  score: faker.helpers.maybe(() => faker.number.int( { min: 60, max: 100 }), { probability: 0.7 }),
  attempts: faker.number.int( { min: 1, max: 5 }),
  createdAt: faker.date.past(_),
  updatedAt: faker.date.recent(_),
  ...overrides,
});

// Achievement data generators
export const generateAchievement = (_overrides: any = {}) => ({
  id: faker.string.uuid(_),
  title: faker.lorem.words(3),
  description: faker.lorem.sentence(_),
  type: faker.helpers.arrayElement( ['LESSON', 'COURSE', 'STREAK', 'XP', 'SPECIAL']),
  icon: faker.helpers.arrayElement( ['🏆', '🎯', '🔥', '⭐', '💎', '🚀']),
  condition: {
    type: faker.helpers.arrayElement( ['lesson_count', 'course_count', 'streak_days', 'xp_total']),
    value: faker.number.int( { min: 1, max: 100 }),
  },
  xpReward: faker.number.int( { min: 100, max: 500 }),
  isActive: faker.datatype.boolean(_),
  createdAt: faker.date.past(_),
  updatedAt: faker.date.recent(_),
  ...overrides,
});

// Collaboration data generators
export const generateCollaborationSession = (_overrides: any = {}) => ({
  id: faker.string.uuid(_),
  title: faker.lorem.words(_4),
  description: faker.lorem.sentence(_),
  hostId: faker.string.uuid(_),
  participants: Array.from( { length: faker.number.int({ min: 1, max: 5 }) }, (_) => ({
    id: faker.string.uuid(_),
    userId: faker.string.uuid(_),
    role: faker.helpers.arrayElement( ['HOST', 'PARTICIPANT', 'OBSERVER']),
    joinedAt: faker.date.recent(_),
    isActive: faker.datatype.boolean(_),
  })),
  document: {
    id: faker.string.uuid(_),
    content: generateSolidityCode(_),
    language: 'solidity',
    version: faker.number.int( { min: 1, max: 100 }),
  },
  status: faker.helpers.arrayElement( ['ACTIVE', 'PAUSED', 'ENDED']),
  maxParticipants: faker.number.int( { min: 2, max: 10 }),
  isPublic: faker.datatype.boolean(_),
  createdAt: faker.date.past(_),
  updatedAt: faker.date.recent(_),
  ...overrides,
});

// Code generation utilities
export const generateSolidityCode = (_options: { includeComments?: boolean; exerciseMarkers?: boolean } = {}) => {
  const { includeComments = false, exerciseMarkers = false } = options;
  const contractName = faker.word.noun({ capitalize: true  });
  const functions = Array.from( { length: faker.number.int({ min: 1, max: 3 }) }, (_) => 
    generateSolidityFunction(_)
  ).join('\n\n    ');

  let code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ${contractName}
 * @dev ${faker.lorem.sentence(_)}
 */
contract ${contractName} {
    ${functions}
}`;

  if (includeComments) {
    code = code.replace('contract ' + contractName, `// This is a sample Solidity contract\ncontract ${contractName}`);
  }

  if (exerciseMarkers) {
    code = code.replace(functions, functions + '\n\n    // TODO: Add your implementation here');
  }

  return code;
};

export const generateSolidityFunction = (_) => {
  const functionName = faker.word.verb(_);
  const paramType = faker.helpers.arrayElement( ['uint256', 'string memory', 'address', 'bool']);
  const paramName = faker.word.noun(_);
  const visibility = faker.helpers.arrayElement( ['public', 'private', 'internal', 'external']);
  const returnType = faker.helpers.arrayElement( ['uint256', 'string memory', 'bool', 'address']);

  return `function ${functionName}(_${paramType} ${paramName}) ${visibility} returns (_${returnType}) {
        // ${faker.lorem.sentence(_)}
        ${generateSolidityStatement(_)}
    }`;
};

export const generateSolidityStatement = (_) => {
  const statements = [
    `return ${faker.number.int( { min: 1, max: 1000 })};`,
    `require(_${faker.word.noun()} > 0, "${faker.lorem.words(3)}");`,
    `emit ${faker.word.noun({ capitalize: true  })}( ${faker.number.int({ min: 1, max: 100 })});`,
    `${faker.word.noun(_)} = ${faker.number.int( { min: 1, max: 1000 })};`,
  ];
  
  return faker.helpers.arrayElement(_statements);
};

// API response generators
export const generateApiResponse = <T>( data: T, overrides: any = {}) => ({
  success: true,
  data,
  timestamp: faker.date.recent(_).toISOString(),
  requestId: faker.string.uuid(_),
  ...overrides,
});

export const generateApiError = (_overrides: any = {}) => ({
  success: false,
  error: {
    code: faker.helpers.arrayElement( ['VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHORIZED', 'INTERNAL_ERROR']),
    message: faker.lorem.sentence(_),
    details: faker.helpers.maybe(() => [faker.lorem.sentence(_)], { probability: 0.3 }) || [],
  },
  timestamp: faker.date.recent(_).toISOString(),
  requestId: faker.string.uuid(_),
  ...overrides,
});

// Batch generators
export const generateUsers = ( count: number, overrides: any = {}) =>
  Array.from( { length: count }, () => generateUser(_overrides));

export const generateCourses = ( count: number, overrides: any = {}) =>
  Array.from( { length: count }, () => generateCourse(_overrides));

export const generateLessons = ( count: number, courseId?: string, overrides: any = {}) =>
  Array.from( { length: count }, (_, index) => generateLesson({
    courseId: courseId || faker.string.uuid(_),
    order: index + 1,
    ...overrides,
  }));

export const generateProgressRecords = ( count: number, userId?: string, overrides: any = {}) =>
  Array.from( { length: count }, () => generateProgress({
    userId: userId || faker.string.uuid(_),
    ...overrides,
  }));

// Complex scenario generators
export const generateCompleteUserJourney = (_) => {
  const user = generateStudent(_);
  const courses = generateCourses(3);
  const allLessons = courses.flatMap(course => 
    generateLessons( faker.number.int({ min: 3, max: 8 }), course.id)
  );
  const progress = allLessons.map(lesson => 
    generateProgress({
      userId: user.id,
      lessonId: lesson.id,
      courseId: lesson.courseId,
      status: faker.helpers.arrayElement( ['COMPLETED', 'IN_PROGRESS', 'NOT_STARTED']),
    })
  );
  const profile = generateUserProfile({ userId: user.id  });
  const achievements = generateAchievements( faker.number.int({ min: 2, max: 8 }));

  return {
    user,
    profile,
    courses,
    lessons: allLessons,
    progress,
    achievements,
  };
};

export const generateAchievements = ( count: number, overrides: any = {}) =>
  Array.from( { length: count }, () => generateAchievement(_overrides));

export const generateCourseWithLessons = (_lessonCount: number = 5) => {
  const course = generateCourse(_);
  const lessons = generateLessons( lessonCount, course.id);
  
  return {
    ...course,
    lessons,
  };
};

// Reset generator state
export const resetGenerators = (_) => {
  faker.seed(12345);
};

// Export specific generators for different test scenarios
export const testScenarios = {
  newUser: (_) => generateUser( { status: 'ACTIVE', role: 'STUDENT', emailVerified: null }),
  experiencedUser: (_) => generateUser({ 
    status: 'ACTIVE', 
    role: 'STUDENT',
    profile: generateUserProfile({ 
      xpTotal: faker.number.int( { min: 5000, max: 15000 }),
      level: faker.number.int( { min: 20, max: 40 }),
      lessonsCompleted: faker.number.int( { min: 50, max: 150 }),
    })
  }),
  beginnerCourse: (_) => generateCourse( { difficulty: 'BEGINNER', isPublished: true }),
  advancedCourse: (_) => generateCourse( { difficulty: 'ADVANCED', isPublished: true }),
  draftCourse: (_) => generateCourse( { status: 'DRAFT', isPublished: false }),
  completedLesson: (_) => generateProgress( { status: 'COMPLETED', score: faker.number.int({ min: 80, max: 100 }) }),
  failedLesson: (_) => generateProgress( { status: 'IN_PROGRESS', score: faker.number.int({ min: 0, max: 59 }) }),
};