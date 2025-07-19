// Solidity curriculum data and learning paths

import { Module, Lesson, LearningPath } from './types';

export const SOLIDITY_LESSONS: Lesson[] = [
  // Fundamentals Module Lessons
  {
    id: 'sol-intro',
    title: 'Introduction to Solidity',
    description: 'Learn the basics of Solidity programming language and smart contracts',
    type: 'theory',
    difficulty: 'beginner',
    estimatedDuration: 30,
    xpReward: 100,
    prerequisites: [],
    content: {
      videoUrl: '/videos/solidity-intro.mp4',
      readingMaterial: '/docs/solidity-basics.md',
      codeExamples: ['pragma solidity ^0.8.0;', 'contract HelloWorld {}']
    },
    tags: ['basics', 'introduction', 'smart-contracts'],
    order: 1,
    isOptional: false,
    unlockMessage: 'Start your Solidity journey!'
  },
  {
    id: 'sol-variables',
    title: 'Variables and Data Types',
    description: 'Understanding Solidity data types, variables, and storage',
    type: 'practical',
    difficulty: 'beginner',
    estimatedDuration: 45,
    xpReward: 150,
    prerequisites: [
      { type: 'lesson', id: 'sol-intro', name: 'Introduction to Solidity' }
    ],
    content: {
      videoUrl: '/videos/solidity-variables.mp4',
      readingMaterial: '/docs/variables-datatypes.md',
      codeExamples: ['uint256 public count;', 'string private name;', 'bool public isActive;'],
      exercises: ['variable-declaration', 'type-conversion']
    },
    tags: ['variables', 'data-types', 'storage'],
    order: 2,
    isOptional: false
  },
  {
    id: 'sol-functions',
    title: 'Functions and Modifiers',
    description: 'Learn to write functions, modifiers, and understand visibility',
    type: 'practical',
    difficulty: 'beginner',
    estimatedDuration: 60,
    xpReward: 200,
    prerequisites: [
      { type: 'lesson', id: 'sol-variables', name: 'Variables and Data Types' }
    ],
    content: {
      videoUrl: '/videos/solidity-functions.mp4',
      readingMaterial: '/docs/functions-modifiers.md',
      codeExamples: [
        'function getName() public view returns (string memory) {}',
        'modifier onlyOwner() { require(msg.sender == owner); _; }'
      ],
      exercises: ['function-writing', 'modifier-creation']
    },
    tags: ['functions', 'modifiers', 'visibility'],
    order: 3,
    isOptional: false
  },
  {
    id: 'sol-quiz-basics',
    title: 'Solidity Basics Quiz',
    description: 'Test your understanding of Solidity fundamentals',
    type: 'quiz',
    difficulty: 'beginner',
    estimatedDuration: 20,
    xpReward: 100,
    prerequisites: [
      { type: 'lesson', id: 'sol-functions', name: 'Functions and Modifiers' }
    ],
    content: {
      quizQuestions: 10
    },
    tags: ['quiz', 'assessment', 'basics'],
    order: 4,
    isOptional: false
  },

  // Intermediate Module Lessons
  {
    id: 'sol-inheritance',
    title: 'Inheritance and Interfaces',
    description: 'Master contract inheritance and interface implementation',
    type: 'practical',
    difficulty: 'intermediate',
    estimatedDuration: 75,
    xpReward: 250,
    prerequisites: [
      { type: 'quiz_score', id: 'sol-quiz-basics', name: 'Solidity Basics Quiz', requirement: 70 }
    ],
    content: {
      videoUrl: '/videos/solidity-inheritance.mp4',
      readingMaterial: '/docs/inheritance-interfaces.md',
      codeExamples: [
        'contract Child is Parent {}',
        'interface IERC20 { function transfer(address to, uint256 amount) external; }'
      ],
      exercises: ['inheritance-practice', 'interface-implementation']
    },
    tags: ['inheritance', 'interfaces', 'oop'],
    order: 5,
    isOptional: false
  },
  {
    id: 'sol-events-errors',
    title: 'Events and Error Handling',
    description: 'Learn to emit events and handle errors properly',
    type: 'practical',
    difficulty: 'intermediate',
    estimatedDuration: 50,
    xpReward: 200,
    prerequisites: [
      { type: 'lesson', id: 'sol-inheritance', name: 'Inheritance and Interfaces' }
    ],
    content: {
      videoUrl: '/videos/solidity-events.mp4',
      readingMaterial: '/docs/events-errors.md',
      codeExamples: [
        'event Transfer(address indexed from, address indexed to, uint256 value);',
        'require(balance >= amount, "Insufficient balance");'
      ],
      exercises: ['event-emission', 'error-handling']
    },
    tags: ['events', 'errors', 'debugging'],
    order: 6,
    isOptional: false
  },

  // Advanced Module Lessons
  {
    id: 'sol-defi-basics',
    title: 'DeFi Fundamentals',
    description: 'Introduction to Decentralized Finance concepts and implementation',
    type: 'theory',
    difficulty: 'advanced',
    estimatedDuration: 90,
    xpReward: 300,
    prerequisites: [
      { type: 'lesson', id: 'sol-events-errors', name: 'Events and Error Handling' }
    ],
    content: {
      videoUrl: '/videos/defi-fundamentals.mp4',
      readingMaterial: '/docs/defi-basics.md',
      codeExamples: [
        'interface IERC20 { function balanceOf(address) external view returns (uint256); }',
        'contract LiquidityPool {}'
      ]
    },
    tags: ['defi', 'finance', 'advanced'],
    order: 7,
    isOptional: false
  },
  {
    id: 'sol-defi-project',
    title: 'Build a DeFi Protocol',
    description: 'Create a complete DeFi protocol with staking and rewards',
    type: 'project',
    difficulty: 'advanced',
    estimatedDuration: 180,
    xpReward: 500,
    prerequisites: [
      { type: 'lesson', id: 'sol-defi-basics', name: 'DeFi Fundamentals' }
    ],
    content: {
      readingMaterial: '/docs/defi-project-guide.md',
      exercises: ['staking-contract', 'reward-distribution', 'governance-token']
    },
    tags: ['project', 'defi', 'staking'],
    order: 8,
    isOptional: false
  }
];

export const SOLIDITY_MODULES: Module[] = [
  {
    id: 'fundamentals',
    title: 'Solidity Fundamentals',
    description: 'Master the core concepts of Solidity programming',
    difficulty: 'beginner',
    estimatedDuration: 3,
    totalXPReward: 550,
    prerequisites: [],
    lessons: SOLIDITY_LESSONS.filter(lesson => 
      ['sol-intro', 'sol-variables', 'sol-functions', 'sol-quiz-basics'].includes(lesson.id)
    ),
    order: 1,
    category: 'Core',
    tags: ['fundamentals', 'basics', 'solidity'],
    icon: '📚',
    color: 'blue',
    isCore: true,
    unlockMessage: 'Begin your Solidity journey with the fundamentals!',
    completionCertificate: {
      name: 'Solidity Fundamentals Certificate',
      description: 'Certified in Solidity programming basics'
    }
  },
  {
    id: 'intermediate',
    title: 'Intermediate Solidity',
    description: 'Advanced Solidity concepts and best practices',
    difficulty: 'intermediate',
    estimatedDuration: 2.5,
    totalXPReward: 450,
    prerequisites: [
      { type: 'module', id: 'fundamentals', name: 'Solidity Fundamentals' }
    ],
    lessons: SOLIDITY_LESSONS.filter(lesson => 
      ['sol-inheritance', 'sol-events-errors'].includes(lesson.id)
    ),
    order: 2,
    category: 'Core',
    tags: ['intermediate', 'oop', 'best-practices'],
    icon: '⚡',
    color: 'purple',
    isCore: true,
    unlockMessage: 'Ready for intermediate Solidity concepts!',
    completionCertificate: {
      name: 'Intermediate Solidity Certificate',
      description: 'Certified in advanced Solidity programming'
    }
  },
  {
    id: 'defi-development',
    title: 'DeFi Development',
    description: 'Build decentralized finance applications',
    difficulty: 'advanced',
    estimatedDuration: 4.5,
    totalXPReward: 800,
    prerequisites: [
      { type: 'module', id: 'intermediate', name: 'Intermediate Solidity' }
    ],
    lessons: SOLIDITY_LESSONS.filter(lesson => 
      ['sol-defi-basics', 'sol-defi-project'].includes(lesson.id)
    ),
    order: 3,
    category: 'Specialization',
    tags: ['defi', 'finance', 'advanced'],
    icon: '💰',
    color: 'green',
    isCore: false,
    unlockMessage: 'Enter the world of Decentralized Finance!',
    completionCertificate: {
      name: 'DeFi Developer Certificate',
      description: 'Certified DeFi protocol developer'
    }
  }
];

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'solidity-beginner',
    title: 'Solidity Beginner Path',
    description: 'Complete beginner path to Solidity development',
    difficulty: 'beginner',
    estimatedDuration: 6,
    modules: ['fundamentals', 'intermediate'],
    prerequisites: [],
    tags: ['beginner', 'complete', 'solidity'],
    isRecommended: true,
    targetAudience: ['Complete beginners', 'Web developers new to blockchain'],
    learningObjectives: [
      'Understand Solidity syntax and concepts',
      'Write basic smart contracts',
      'Implement inheritance and interfaces',
      'Handle events and errors properly'
    ],
    completionRewards: {
      xp: 1000,
      badges: ['solidity-beginner'],
      certificates: ['Solidity Developer Certificate']
    }
  },
  {
    id: 'defi-specialist',
    title: 'DeFi Specialist Path',
    description: 'Become a DeFi protocol developer',
    difficulty: 'advanced',
    estimatedDuration: 10,
    modules: ['fundamentals', 'intermediate', 'defi-development'],
    prerequisites: [
      { type: 'achievement', id: 'solidity_scholar', name: 'Solidity Scholar' }
    ],
    tags: ['defi', 'advanced', 'finance'],
    isRecommended: false,
    targetAudience: ['Experienced developers', 'Finance professionals'],
    learningObjectives: [
      'Master advanced Solidity concepts',
      'Understand DeFi protocols and mechanisms',
      'Build complete DeFi applications',
      'Implement staking and governance systems'
    ],
    completionRewards: {
      xp: 2000,
      badges: ['defi-specialist', 'protocol-builder'],
      certificates: ['DeFi Expert Certificate']
    }
  }
];

// Helper functions
export function getModuleById(moduleId: string): Module | undefined {
  return SOLIDITY_MODULES.find(module => module.id === moduleId);
}

export function getLessonById(lessonId: string): Lesson | undefined {
  return SOLIDITY_LESSONS.find(lesson => lesson.id === lessonId);
}

export function getLearningPathById(pathId: string): LearningPath | undefined {
  return LEARNING_PATHS.find(path => path.id === pathId);
}

export function getModulesForPath(pathId: string): Module[] {
  const path = getLearningPathById(pathId);
  if (!path) return [];
  
  return path.modules
    .map(moduleId => getModuleById(moduleId))
    .filter(Boolean) as Module[];
}

export function calculateModuleProgress(moduleId: string, lessonProgress: Record<string, any>): number {
  const module = getModuleById(moduleId);
  if (!module) return 0;
  
  const totalLessons = module.lessons.length;
  if (totalLessons === 0) return 100;
  
  const completedLessons = module.lessons.filter(lesson => 
    lessonProgress[lesson.id]?.status === 'completed'
  ).length;
  
  return (completedLessons / totalLessons) * 100;
}

export function getNextAvailableLesson(moduleId: string, lessonProgress: Record<string, any>): Lesson | null {
  const module = getModuleById(moduleId);
  if (!module) return null;

  // Find first lesson that's not completed
  for (const lesson of module.lessons) {
    const progress = lessonProgress[lesson.id];
    if (!progress || progress.status !== 'completed') {
      return lesson;
    }
  }

  return null; // All lessons completed
}

export function checkPrerequisites(itemId: string, userProgress: any): boolean {
  const lesson = getLessonById(itemId);
  const module = getModuleById(itemId);

  const item = lesson || module;
  if (!item || !item.prerequisites.length) return true;

  return item.prerequisites.every(prereq => {
    switch (prereq.type) {
      case 'lesson':
        return userProgress.lessons[prereq.id]?.status === 'completed';
      case 'module':
        const moduleProgress = calculateModuleProgress(prereq.id, userProgress.lessons);
        return moduleProgress >= 100;
      case 'quiz_score':
        const lessonProg = userProgress.lessons[prereq.id];
        return lessonProg?.bestScore >= (prereq.requirement || 70);
      case 'achievement':
        return userProgress.achievements.includes(prereq.id);
      default:
        return false;
    }
  });
}
