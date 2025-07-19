// Achievement definitions and data

import { Achievement, AchievementCategory, AchievementRarity } from './types';

export const ACHIEVEMENTS: Achievement[] = [
  // Learning Achievements
  {
    id: 'first_lesson',
    title: 'First Steps',
    description: 'Complete your first Solidity lesson',
    longDescription: 'Welcome to the world of Solidity! You\'ve taken your first step into smart contract development.',
    category: 'learning',
    rarity: 'common',
    icon: '🎯',
    requirements: [
      {
        type: 'lesson_complete',
        target: 1,
        current: 0
      }
    ],
    rewards: {
      xp: 100,
      badge: 'first_steps',
      title: 'Solidity Beginner'
    }
  },
  {
    id: 'lesson_master',
    title: 'Lesson Master',
    description: 'Complete 10 Solidity lessons',
    longDescription: 'You\'re building a solid foundation in Solidity development. Keep up the great work!',
    category: 'learning',
    rarity: 'uncommon',
    icon: '📚',
    requirements: [
      {
        type: 'lesson_complete',
        target: 10,
        current: 0
      }
    ],
    rewards: {
      xp: 500,
      badge: 'lesson_master',
      title: 'Dedicated Learner'
    },
    prerequisites: ['first_lesson']
  },
  {
    id: 'solidity_scholar',
    title: 'Solidity Scholar',
    description: 'Complete 50 Solidity lessons',
    longDescription: 'Your dedication to learning Solidity is impressive. You\'re well on your way to mastery!',
    category: 'learning',
    rarity: 'rare',
    icon: '🎓',
    requirements: [
      {
        type: 'lesson_complete',
        target: 50,
        current: 0
      }
    ],
    rewards: {
      xp: 2500,
      badge: 'solidity_scholar',
      title: 'Solidity Scholar',
      unlocks: ['advanced_tutorials']
    },
    prerequisites: ['lesson_master']
  },

  // Quiz Achievements
  {
    id: 'quiz_ace',
    title: 'Quiz Ace',
    description: 'Score 100% on a quiz',
    longDescription: 'Perfect score! Your understanding of the material is excellent.',
    category: 'learning',
    rarity: 'uncommon',
    icon: '🏆',
    requirements: [
      {
        type: 'quiz_score',
        target: 100,
        current: 0,
        metadata: { minScore: 100 }
      }
    ],
    rewards: {
      xp: 200,
      badge: 'quiz_ace'
    }
  },
  {
    id: 'perfect_streak',
    title: 'Perfect Streak',
    description: 'Score 100% on 5 consecutive quizzes',
    longDescription: 'Incredible consistency! You\'ve demonstrated mastery across multiple topics.',
    category: 'learning',
    rarity: 'epic',
    icon: '⭐',
    requirements: [
      {
        type: 'quiz_score',
        target: 5,
        current: 0,
        metadata: { consecutivePerfect: true }
      }
    ],
    rewards: {
      xp: 1000,
      badge: 'perfect_streak',
      title: 'Quiz Master',
      special: {
        type: 'theme',
        value: 'golden_theme'
      }
    }
  },

  // Project Achievements
  {
    id: 'first_contract',
    title: 'First Contract',
    description: 'Deploy your first smart contract',
    longDescription: 'Congratulations! You\'ve deployed your first smart contract to the blockchain.',
    category: 'milestone',
    rarity: 'uncommon',
    icon: '📝',
    requirements: [
      {
        type: 'project_submit',
        target: 1,
        current: 0,
        metadata: { type: 'contract_deployment' }
      }
    ],
    rewards: {
      xp: 300,
      badge: 'first_contract',
      title: 'Contract Creator'
    }
  },
  {
    id: 'defi_developer',
    title: 'DeFi Developer',
    description: 'Complete a DeFi project',
    longDescription: 'You\'ve entered the exciting world of Decentralized Finance development!',
    category: 'milestone',
    rarity: 'rare',
    icon: '💰',
    requirements: [
      {
        type: 'project_submit',
        target: 1,
        current: 0,
        metadata: { category: 'defi' }
      }
    ],
    rewards: {
      xp: 800,
      badge: 'defi_developer',
      title: 'DeFi Pioneer',
      unlocks: ['defi_advanced_course']
    },
    prerequisites: ['first_contract']
  },

  // Streak Achievements
  {
    id: 'daily_learner',
    title: 'Daily Learner',
    description: 'Learn for 7 consecutive days',
    longDescription: 'Building a daily learning habit is key to mastering Solidity. Great consistency!',
    category: 'streak',
    rarity: 'uncommon',
    icon: '🔥',
    requirements: [
      {
        type: 'streak_days',
        target: 7,
        current: 0
      }
    ],
    rewards: {
      xp: 350,
      badge: 'daily_learner'
    }
  },
  {
    id: 'dedication_master',
    title: 'Dedication Master',
    description: 'Learn for 30 consecutive days',
    longDescription: 'Your dedication is inspiring! A month of consistent learning shows true commitment.',
    category: 'streak',
    rarity: 'epic',
    icon: '🌟',
    requirements: [
      {
        type: 'streak_days',
        target: 30,
        current: 0
      }
    ],
    rewards: {
      xp: 1500,
      badge: 'dedication_master',
      title: 'Dedicated Developer',
      special: {
        type: 'avatar',
        value: 'golden_avatar_frame'
      }
    },
    prerequisites: ['daily_learner']
  },

  // XP and Level Achievements
  {
    id: 'xp_collector',
    title: 'XP Collector',
    description: 'Earn 1,000 XP',
    longDescription: 'You\'re accumulating experience points at a great pace!',
    category: 'milestone',
    rarity: 'common',
    icon: '💎',
    requirements: [
      {
        type: 'xp_earned',
        target: 1000,
        current: 0
      }
    ],
    rewards: {
      xp: 100,
      badge: 'xp_collector'
    }
  },
  {
    id: 'level_up_legend',
    title: 'Level Up Legend',
    description: 'Reach level 10',
    longDescription: 'Double digits! You\'ve made significant progress in your Solidity journey.',
    category: 'milestone',
    rarity: 'rare',
    icon: '🚀',
    requirements: [
      {
        type: 'xp_earned',
        target: 10000, // Assuming 1000 XP per level
        current: 0
      }
    ],
    rewards: {
      xp: 1000,
      badge: 'level_up_legend',
      title: 'Rising Star',
      unlocks: ['intermediate_challenges']
    }
  },

  // Special and Time-Limited Achievements
  {
    id: 'early_adopter',
    title: 'Early Adopter',
    description: 'Join the platform in its first month',
    longDescription: 'Thank you for being an early supporter of our Solidity learning platform!',
    category: 'special',
    rarity: 'legendary',
    icon: '🌅',
    requirements: [
      {
        type: 'social_action',
        target: 1,
        current: 0,
        metadata: { action: 'early_signup' }
      }
    ],
    rewards: {
      xp: 500,
      badge: 'early_adopter',
      title: 'Pioneer',
      special: {
        type: 'theme',
        value: 'founder_theme'
      }
    },
    hidden: true,
    expiryDate: new Date('2024-12-31')
  },
  {
    id: 'community_contributor',
    title: 'Community Contributor',
    description: 'Help other learners in the community',
    longDescription: 'Your contributions to the learning community are valuable and appreciated!',
    category: 'social',
    rarity: 'rare',
    icon: '🤝',
    requirements: [
      {
        type: 'social_action',
        target: 10,
        current: 0,
        metadata: { action: 'help_others' }
      }
    ],
    rewards: {
      xp: 600,
      badge: 'community_contributor',
      title: 'Community Helper'
    }
  },

  // Time-based Achievements
  {
    id: 'speed_learner',
    title: 'Speed Learner',
    description: 'Complete a lesson in under 5 minutes',
    longDescription: 'Lightning fast! You\'ve demonstrated quick understanding and efficient learning.',
    category: 'special',
    rarity: 'uncommon',
    icon: '⚡',
    requirements: [
      {
        type: 'time_spent',
        target: 1,
        current: 0,
        metadata: { maxTime: 300 } // 5 minutes in seconds
      }
    ],
    rewards: {
      xp: 150,
      badge: 'speed_learner'
    }
  },
  {
    id: 'marathon_learner',
    title: 'Marathon Learner',
    description: 'Study for 4 hours in a single day',
    longDescription: 'Impressive dedication! You\'ve put in serious study time today.',
    category: 'special',
    rarity: 'rare',
    icon: '🏃',
    requirements: [
      {
        type: 'time_spent',
        target: 14400, // 4 hours in seconds
        current: 0,
        metadata: { singleDay: true }
      }
    ],
    rewards: {
      xp: 800,
      badge: 'marathon_learner',
      title: 'Study Marathon Champion'
    }
  }
];

// Achievement categories with metadata
export const ACHIEVEMENT_CATEGORIES: Record<AchievementCategory, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  learning: {
    name: 'Learning',
    description: 'Achievements for completing lessons and mastering concepts',
    icon: '📚',
    color: 'blue'
  },
  social: {
    name: 'Social',
    description: 'Achievements for community participation and helping others',
    icon: '🤝',
    color: 'green'
  },
  milestone: {
    name: 'Milestone',
    description: 'Major accomplishments and project completions',
    icon: '🏆',
    color: 'yellow'
  },
  special: {
    name: 'Special',
    description: 'Unique achievements for exceptional performance',
    icon: '⭐',
    color: 'purple'
  },
  streak: {
    name: 'Streak',
    description: 'Consistency and daily learning achievements',
    icon: '🔥',
    color: 'orange'
  }
};

// Achievement rarity with visual styling
export const ACHIEVEMENT_RARITIES: Record<AchievementRarity, {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
}> = {
  common: {
    name: 'Common',
    color: '#9CA3AF',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/30',
    textColor: 'text-gray-300',
    glowColor: 'shadow-gray-500/20'
  },
  uncommon: {
    name: 'Uncommon',
    color: '#10B981',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-300',
    glowColor: 'shadow-green-500/20'
  },
  rare: {
    name: 'Rare',
    color: '#3B82F6',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-300',
    glowColor: 'shadow-blue-500/20'
  },
  epic: {
    name: 'Epic',
    color: '#8B5CF6',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-300',
    glowColor: 'shadow-purple-500/20'
  },
  legendary: {
    name: 'Legendary',
    color: '#F59E0B',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-300',
    glowColor: 'shadow-yellow-500/20'
  }
};

// Level progression system
export const LEVEL_PROGRESSION = [
  { level: 1, xpRequired: 0, title: 'Newcomer', description: 'Welcome to Solidity!' },
  { level: 2, xpRequired: 100, title: 'Beginner', description: 'Taking first steps' },
  { level: 3, xpRequired: 250, title: 'Learner', description: 'Building knowledge' },
  { level: 4, xpRequired: 500, title: 'Student', description: 'Making progress' },
  { level: 5, xpRequired: 1000, title: 'Apprentice', description: 'Understanding concepts' },
  { level: 6, xpRequired: 1750, title: 'Practitioner', description: 'Applying skills' },
  { level: 7, xpRequired: 2750, title: 'Developer', description: 'Building projects' },
  { level: 8, xpRequired: 4000, title: 'Advanced', description: 'Mastering techniques' },
  { level: 9, xpRequired: 5500, title: 'Expert', description: 'Deep understanding' },
  { level: 10, xpRequired: 7500, title: 'Master', description: 'Solidity mastery' },
  { level: 11, xpRequired: 10000, title: 'Guru', description: 'Teaching others' },
  { level: 12, xpRequired: 13000, title: 'Legend', description: 'Legendary skills' }
];

// Helper functions
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(achievement => achievement.id === id);
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return ACHIEVEMENTS.filter(achievement => achievement.category === category);
}

export function getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
  return ACHIEVEMENTS.filter(achievement => achievement.rarity === rarity);
}

export function getLevelInfo(xp: number) {
  let currentLevel = 1;
  let nextLevelXP = 100;

  for (const level of LEVEL_PROGRESSION) {
    if (xp >= level.xpRequired) {
      currentLevel = level.level;
    } else {
      nextLevelXP = level.xpRequired;
      break;
    }
  }

  const currentLevelInfo = LEVEL_PROGRESSION.find(l => l.level === currentLevel);
  const nextLevelInfo = LEVEL_PROGRESSION.find(l => l.level === currentLevel + 1);

  return {
    currentLevel,
    currentLevelInfo,
    nextLevelInfo,
    nextLevelXP,
    progressToNext: nextLevelInfo ? ((xp - (currentLevelInfo?.xpRequired || 0)) / (nextLevelXP - (currentLevelInfo?.xpRequired || 0))) * 100 : 100
  };
}

export function calculateAchievementProgress(achievement: Achievement, userStats: any): number {
  let totalProgress = 0;
  let completedRequirements = 0;

  for (const requirement of achievement.requirements) {
    let progress = 0;

    switch (requirement.type) {
      case 'lesson_complete':
        progress = Math.min((userStats.lessonsCompleted || 0) / requirement.target, 1);
        break;
      case 'quiz_score':
        if (requirement.metadata?.consecutivePerfect) {
          progress = Math.min((userStats.consecutivePerfectQuizzes || 0) / requirement.target, 1);
        } else {
          progress = userStats.highestQuizScore >= requirement.target ? 1 : 0;
        }
        break;
      case 'project_submit':
        const projectCount = userStats.projectsSubmitted || 0;
        progress = Math.min(projectCount / requirement.target, 1);
        break;
      case 'streak_days':
        progress = Math.min((userStats.currentStreak || 0) / requirement.target, 1);
        break;
      case 'xp_earned':
        progress = Math.min((userStats.totalXP || 0) / requirement.target, 1);
        break;
      case 'time_spent':
        const timeSpent = userStats.totalTimeSpent || 0;
        progress = Math.min(timeSpent / requirement.target, 1);
        break;
      case 'social_action':
        const socialActions = userStats.socialActions?.[requirement.metadata?.action] || 0;
        progress = Math.min(socialActions / requirement.target, 1);
        break;
    }

    totalProgress += progress;
    if (progress >= 1) completedRequirements++;
  }

  return (totalProgress / achievement.requirements.length) * 100;
}
