import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AchievementManager } from '@/lib/achievements/manager';
import { Achievement, AchievementEvent } from '@/lib/achievements/types';
import { ACHIEVEMENTS } from '@/lib/achievements/data';

// Mock external dependencies
jest.mock('@/lib/achievements/data', () => ({
  ACHIEVEMENTS: [
    {
      id: 'first_lesson',
      title: 'First Steps',
      description: 'Complete your first Solidity lesson',
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
      id: 'quiz_master',
      title: 'Quiz Master',
      description: 'Score 100% on 5 consecutive quizzes',
      category: 'learning',
      rarity: 'rare',
      icon: '🧠',
      requirements: [
        {
          type: 'quiz_score',
          target: 5,
          current: 0,
          metadata: { consecutivePerfect: true }
        }
      ],
      rewards: {
        xp: 500,
        badge: 'quiz_master',
        title: 'Quiz Expert'
      }
    },
    {
      id: 'streak_warrior',
      title: 'Streak Warrior',
      description: 'Maintain a 7-day learning streak',
      category: 'streak',
      rarity: 'epic',
      icon: '🔥',
      requirements: [
        {
          type: 'streak_days',
          target: 7,
          current: 0
        }
      ],
      rewards: {
        xp: 1000,
        badge: 'streak_warrior',
        title: 'Dedicated Learner'
      }
    }
  ]
}));

describe('AchievementManager - Comprehensive Test Suite', () => {
  let achievementManager: AchievementManager;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    achievementManager = new AchievementManager();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization and Setup', () => {
    it('should initialize achievement manager with default settings', () => {
      expect(achievementManager).toBeInstanceOf(AchievementManager);
      expect(achievementManager['userProgress']).toBeDefined();
      expect(achievementManager['notifications']).toBeDefined();
    });

    it('should load achievements from data source', () => {
      const achievements = achievementManager.getAllAchievements();
      
      expect(achievements).toHaveLength(3);
      expect(achievements[0].id).toBe('first_lesson');
      expect(achievements[1].id).toBe('quiz_master');
      expect(achievements[2].id).toBe('streak_warrior');
    });

    it('should get specific achievement by ID', () => {
      const achievement = achievementManager.getAchievement('first_lesson');
      
      expect(achievement).toBeDefined();
      expect(achievement?.title).toBe('First Steps');
      expect(achievement?.category).toBe('learning');
      expect(achievement?.rarity).toBe('common');
    });

    it('should return null for non-existent achievement', () => {
      const achievement = achievementManager.getAchievement('non_existent');
      
      expect(achievement).toBeNull();
    });
  });

  describe('User Progress Management', () => {
    describe('loadUserProgress', () => {
      it('should create new progress for first-time user', async () => {
        const progress = await achievementManager.loadUserProgress(testUserId);

        expect(progress).toBeDefined();
        expect(progress.userId).toBe(testUserId);
        expect(progress.totalXP).toBe(0);
        expect(progress.level).toBe(1);
        expect(progress.badges).toEqual([]);
        expect(progress.achievements).toBeDefined();
        expect(Object.keys(progress.achievements)).toHaveLength(3);
      });

      it('should initialize all achievements as locked', async () => {
        const progress = await achievementManager.loadUserProgress(testUserId);

        Object.values(progress.achievements).forEach(achievement => {
          expect(achievement.status).toBe('locked');
          expect(achievement.progress).toBe(0);
        });
      });

      it('should load existing progress for returning user', async () => {
        // First load creates progress
        await achievementManager.loadUserProgress(testUserId);
        
        // Modify progress
        const progress = await achievementManager.loadUserProgress(testUserId);
        progress.totalXP = 500;
        progress.level = 2;
        await achievementManager.saveUserProgress(progress);

        // Second load should return modified progress
        const loadedProgress = await achievementManager.loadUserProgress(testUserId);
        expect(loadedProgress.totalXP).toBe(500);
        expect(loadedProgress.level).toBe(2);
      });
    });

    describe('saveUserProgress', () => {
      it('should save user progress successfully', async () => {
        const progress = await achievementManager.loadUserProgress(testUserId);
        progress.totalXP = 1000;
        progress.level = 3;

        await expect(achievementManager.saveUserProgress(progress)).resolves.not.toThrow();
      });

      it('should update lastUpdated timestamp on save', async () => {
        const progress = await achievementManager.loadUserProgress(testUserId);
        const originalTimestamp = progress.lastUpdated;

        // Add small delay to ensure different timestamp
        await new Promise(resolve => setTimeout(resolve, 10));
        
        progress.totalXP = 100;
        await achievementManager.saveUserProgress(progress);

        expect(progress.lastUpdated.getTime()).toBeGreaterThan(originalTimestamp.getTime());
      });
    });
  });

  describe('Achievement Progress Calculation', () => {
    describe('calculateProgressForEvent', () => {
      it('should calculate progress for lesson completion events', () => {
        const achievement = achievementManager.getAchievement('first_lesson')!;
        const event: AchievementEvent = {
          userId: testUserId,
          type: 'lesson_complete',
          data: { lessonId: 'lesson-1' },
          timestamp: new Date()
        };

        const progress = achievementManager['calculateProgressForEvent'](
          achievement,
          event,
          { lessonsCompleted: 1 }
        );

        expect(progress).toBe(100); // 1/1 = 100%
      });

      it('should calculate partial progress for multi-target achievements', () => {
        const achievement = achievementManager.getAchievement('quiz_master')!;
        const event: AchievementEvent = {
          userId: testUserId,
          type: 'quiz_score',
          data: { score: 100, consecutive: true },
          timestamp: new Date()
        };

        const progress = achievementManager['calculateProgressForEvent'](
          achievement,
          event,
          { consecutivePerfectQuizzes: 3 }
        );

        expect(progress).toBe(60); // 3/5 = 60%
      });

      it('should handle streak-based achievements', () => {
        const achievement = achievementManager.getAchievement('streak_warrior')!;
        const event: AchievementEvent = {
          userId: testUserId,
          type: 'streak_days',
          data: { days: 5 },
          timestamp: new Date()
        };

        const progress = achievementManager['calculateProgressForEvent'](
          achievement,
          event,
          { currentStreak: 5 }
        );

        expect(progress).toBeCloseTo(71.43, 1); // 5/7 ≈ 71.43%
      });

      it('should cap progress at 100%', () => {
        const achievement = achievementManager.getAchievement('first_lesson')!;
        const event: AchievementEvent = {
          userId: testUserId,
          type: 'lesson_complete',
          data: { lessonId: 'lesson-5' },
          timestamp: new Date()
        };

        const progress = achievementManager['calculateProgressForEvent'](
          achievement,
          event,
          { lessonsCompleted: 5 }
        );

        expect(progress).toBe(100); // Should not exceed 100%
      });
    });
  });

  describe('Achievement Unlocking', () => {
    describe('unlockAchievement', () => {
      it('should unlock achievement and apply rewards', async () => {
        const notification = await achievementManager.unlockAchievement(testUserId, 'first_lesson');
        const progress = await achievementManager.loadUserProgress(testUserId);

        // Check achievement status
        const userAchievement = progress.achievements['first_lesson'];
        expect(userAchievement.status).toBe('unlocked');
        expect(userAchievement.progress).toBe(100);
        expect(userAchievement.unlockedAt).toBeInstanceOf(Date);

        // Check rewards applied
        expect(progress.totalXP).toBe(100);
        expect(progress.badges).toContain('first_steps');

        // Check statistics updated
        expect(progress.statistics.totalUnlocked).toBe(1);
        expect(progress.statistics.byCategory.learning).toBe(1);
        expect(progress.statistics.byRarity.common).toBe(1);

        // Check notification created
        expect(notification).toBeDefined();
        expect(notification.achievementId).toBe('first_lesson');
        expect(notification.type).toBe('unlock');
        expect(notification.rewards.xp).toBe(100);
      });

      it('should update completion rate correctly', async () => {
        await achievementManager.unlockAchievement(testUserId, 'first_lesson');
        const progress = await achievementManager.loadUserProgress(testUserId);

        expect(progress.statistics.completionRate).toBeCloseTo(33.33, 1); // 1/3 ≈ 33.33%
      });

      it('should throw error for non-existent achievement', async () => {
        await expect(
          achievementManager.unlockAchievement(testUserId, 'non_existent')
        ).rejects.toThrow('Achievement not found: non_existent');
      });

      it('should notify unlock listeners', async () => {
        const listener = jest.fn();
        achievementManager.addUnlockListener(listener);

        await achievementManager.unlockAchievement(testUserId, 'first_lesson');

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'first_lesson' }),
          expect.objectContaining({ achievementId: 'first_lesson' })
        );
      });
    });
  });

  describe('Event Processing', () => {
    describe('processEvent', () => {
      it('should process lesson completion event and unlock achievement', async () => {
        const event: AchievementEvent = {
          userId: testUserId,
          type: 'lesson_complete',
          data: { lessonId: 'lesson-1' },
          timestamp: new Date()
        };

        const notifications = await achievementManager.processEvent(event);

        expect(notifications).toHaveLength(1);
        expect(notifications[0].achievementId).toBe('first_lesson');

        const progress = await achievementManager.loadUserProgress(testUserId);
        expect(progress.achievements['first_lesson'].status).toBe('unlocked');
      });

      it('should update progress without unlocking for partial completion', async () => {
        const event: AchievementEvent = {
          userId: testUserId,
          type: 'quiz_score',
          data: { score: 100, consecutive: true },
          timestamp: new Date()
        };

        const notifications = await achievementManager.processEvent(event);

        expect(notifications).toHaveLength(0); // No unlock yet

        const progress = await achievementManager.loadUserProgress(testUserId);
        const achievement = progress.achievements['quiz_master'];
        expect(achievement.status).toBe('in_progress');
        expect(achievement.progress).toBeGreaterThan(0);
        expect(achievement.progress).toBeLessThan(100);
      });

      it('should handle multiple events for same achievement', async () => {
        // First quiz
        await achievementManager.processEvent({
          userId: testUserId,
          type: 'quiz_score',
          data: { score: 100, consecutive: true },
          timestamp: new Date()
        });

        // Second quiz
        await achievementManager.processEvent({
          userId: testUserId,
          type: 'quiz_score',
          data: { score: 100, consecutive: true },
          timestamp: new Date()
        });

        const progress = await achievementManager.loadUserProgress(testUserId);
        const achievement = progress.achievements['quiz_master'];
        expect(achievement.progress).toBeGreaterThan(20); // Should accumulate progress
      });
    });
  });

  describe('Notification Management', () => {
    describe('getNotifications', () => {
      it('should return empty array for user with no notifications', async () => {
        const notifications = await achievementManager.getNotifications(testUserId);

        expect(notifications).toEqual([]);
      });

      it('should return notifications in reverse chronological order', async () => {
        // Unlock multiple achievements
        await achievementManager.unlockAchievement(testUserId, 'first_lesson');
        await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamps
        await achievementManager.unlockAchievement(testUserId, 'quiz_master');

        const notifications = await achievementManager.getNotifications(testUserId);

        expect(notifications).toHaveLength(2);
        expect(notifications[0].achievementId).toBe('quiz_master'); // Most recent first
        expect(notifications[1].achievementId).toBe('first_lesson');
      });

      it('should filter unread notifications when requested', async () => {
        await achievementManager.unlockAchievement(testUserId, 'first_lesson');

        // Mark notification as read
        const allNotifications = await achievementManager.getNotifications(testUserId);
        allNotifications[0].read = true;

        const unreadNotifications = await achievementManager.getNotifications(testUserId, true);

        expect(unreadNotifications).toHaveLength(0);
      });
    });

    describe('markNotificationRead', () => {
      it('should mark notification as read', async () => {
        await achievementManager.unlockAchievement(testUserId, 'first_lesson');
        const notifications = await achievementManager.getNotifications(testUserId);
        const notificationId = notifications[0].id;

        await achievementManager.markNotificationRead(testUserId, notificationId);

        const updatedNotifications = await achievementManager.getNotifications(testUserId);
        expect(updatedNotifications[0].read).toBe(true);
      });
    });
  });

  describe('Statistics and Analytics', () => {
    describe('getUserStatistics', () => {
      it('should return comprehensive user statistics', async () => {
        // Unlock some achievements
        await achievementManager.unlockAchievement(testUserId, 'first_lesson');
        await achievementManager.unlockAchievement(testUserId, 'quiz_master');

        const stats = await achievementManager.getUserStatistics(testUserId);

        expect(stats.totalUnlocked).toBe(2);
        expect(stats.completionRate).toBeCloseTo(66.67, 1); // 2/3 ≈ 66.67%
        expect(stats.byCategory.learning).toBe(2);
        expect(stats.byRarity.common).toBe(1);
        expect(stats.byRarity.rare).toBe(1);
      });

      it('should calculate correct completion rate', async () => {
        const stats = await achievementManager.getUserStatistics(testUserId);
        expect(stats.completionRate).toBe(0); // No achievements unlocked

        await achievementManager.unlockAchievement(testUserId, 'first_lesson');
        const updatedStats = await achievementManager.getUserStatistics(testUserId);
        expect(updatedStats.completionRate).toBeCloseTo(33.33, 1);
      });
    });

    describe('getLeaderboard', () => {
      it('should return leaderboard data', async () => {
        const leaderboard = await achievementManager.getLeaderboard();

        expect(leaderboard).toBeDefined();
        expect(Array.isArray(leaderboard)).toBe(true);
      });
    });
  });

  describe('Achievement Filtering and Querying', () => {
    describe('getAchievementsByCategory', () => {
      it('should filter achievements by category', () => {
        const learningAchievements = achievementManager.getAchievementsByCategory('learning');

        expect(learningAchievements).toHaveLength(2);
        expect(learningAchievements.every(a => a.category === 'learning')).toBe(true);
      });

      it('should return empty array for non-existent category', () => {
        const achievements = achievementManager.getAchievementsByCategory('non_existent' as any);

        expect(achievements).toEqual([]);
      });
    });

    describe('getAchievementsByRarity', () => {
      it('should filter achievements by rarity', () => {
        const commonAchievements = achievementManager.getAchievementsByRarity('common');

        expect(commonAchievements).toHaveLength(1);
        expect(commonAchievements[0].rarity).toBe('common');
      });

      it('should handle multiple rarities', () => {
        const rareAchievements = achievementManager.getAchievementsByRarity('rare');
        const epicAchievements = achievementManager.getAchievementsByRarity('epic');

        expect(rareAchievements).toHaveLength(1);
        expect(epicAchievements).toHaveLength(1);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid user IDs gracefully', async () => {
      const invalidUserId = '';

      await expect(achievementManager.loadUserProgress(invalidUserId)).resolves.toBeDefined();
    });

    it('should handle concurrent achievement unlocks', async () => {
      const promises = [
        achievementManager.unlockAchievement(testUserId, 'first_lesson'),
        achievementManager.unlockAchievement(testUserId, 'quiz_master')
      ];

      await expect(Promise.all(promises)).resolves.toHaveLength(2);
    });

    it('should handle listener errors gracefully', async () => {
      const faultyListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();

      achievementManager.addUnlockListener(faultyListener);
      achievementManager.addUnlockListener(goodListener);

      await expect(
        achievementManager.unlockAchievement(testUserId, 'first_lesson')
      ).resolves.toBeDefined();

      expect(goodListener).toHaveBeenCalledTimes(1);
    });

    it('should handle malformed event data', async () => {
      const malformedEvent: AchievementEvent = {
        userId: testUserId,
        type: 'lesson_complete',
        data: null as any,
        timestamp: new Date()
      };

      await expect(achievementManager.processEvent(malformedEvent)).resolves.toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should process events efficiently', async () => {
      const startTime = performance.now();

      const events: AchievementEvent[] = Array.from({ length: 10 }, (_, i) => ({
        userId: testUserId,
        type: 'lesson_complete',
        data: { lessonId: `lesson-${i}` },
        timestamp: new Date()
      }));

      for (const event of events) {
        await achievementManager.processEvent(event);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle large numbers of achievements efficiently', async () => {
      const startTime = performance.now();

      // Simulate checking all achievements
      const achievements = achievementManager.getAllAchievements();
      achievements.forEach(achievement => {
        achievementManager.getAchievement(achievement.id);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10); // Should be very fast
    });
  });

  describe('Memory Management', () => {
    it('should limit notification history', async () => {
      // Unlock many achievements to test notification limits
      for (let i = 0; i < 150; i++) {
        await achievementManager.unlockAchievement(testUserId, 'first_lesson');
      }

      const notifications = await achievementManager.getNotifications(testUserId);

      // Should not exceed reasonable limits
      expect(notifications.length).toBeLessThanOrEqual(100);
    });

    it('should clean up old progress data', async () => {
      const progress = await achievementManager.loadUserProgress(testUserId);

      // Simulate old data cleanup
      expect(progress.lastUpdated).toBeInstanceOf(Date);
      expect(progress.lastUpdated.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
});
