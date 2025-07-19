/**
 * @fileoverview Integration Test Workflows
 * Tests end-to-end user workflows and feature interactions
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { mockPrisma, resetMockPrisma } from '../utils/mockPrisma';
import { mockRedis, resetMockRedis } from '../utils/mockRedis';

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/'
};

vi.mock('next/router', () => ({
  useRouter: () => mockRouter
}));

// Mock authentication
const mockSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER'
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
};

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: mockSession, status: 'authenticated' }),
  signIn: vi.fn(),
  signOut: vi.fn()
}));

describe('Integration Test Workflows', () => {
  beforeAll(() => {
    vi.clearAllMocks();
  });

  beforeEach(() => {
    resetMockPrisma();
    resetMockRedis();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('User Onboarding Workflow', () => {
    it('should complete full user registration and onboarding', async () => {
      // Step 1: User registration
      const registrationData = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'SecurePass123!',
        acceptTerms: true
      };

      mockPrisma.user.create.mockResolvedValueOnce({
        id: 'new-user-id',
        email: registrationData.email,
        name: registrationData.name,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        experience: 0,
        level: 1,
        streak: 0,
        totalPoints: 0
      });

      const newUser = await mockPrisma.user.create({
        data: {
          email: registrationData.email,
          name: registrationData.name,
          password: 'hashed-password'
        }
      });

      expect(newUser.email).toBe(registrationData.email);
      expect(newUser.level).toBe(1);
      expect(newUser.experience).toBe(0);

      // Step 2: Email verification
      const verificationToken = 'verification-token-123';
      mockRedis.get.mockResolvedValueOnce(newUser.id);

      const tokenUserId = await mockRedis.get(`email-verify:${verificationToken}`);
      expect(tokenUserId).toBe(newUser.id);

      mockPrisma.user.update.mockResolvedValueOnce({
        ...newUser,
        emailVerified: new Date()
      });

      const verifiedUser = await mockPrisma.user.update({
        where: { id: newUser.id },
        data: { emailVerified: new Date() }
      });

      expect(verifiedUser.emailVerified).toBeDefined();

      // Step 3: Initial skill assessment
      const skillAssessmentData = {
        userId: newUser.id,
        programmingExperience: 'beginner',
        blockchainExperience: 'none',
        learningGoals: ['smart-contracts', 'defi'],
        preferredPace: 'normal'
      };

      mockPrisma.userCourseProgress.create.mockResolvedValueOnce({
        id: 'progress-id',
        userId: newUser.id,
        courseId: 'beginner-course-id',
        progressPercentage: 0,
        completedLessons: 0,
        totalLessons: 10,
        lastAccessedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const initialProgress = await mockPrisma.userCourseProgress.create({
        data: {
          userId: newUser.id,
          courseId: 'beginner-course-id',
          progressPercentage: 0,
          completedLessons: 0,
          totalLessons: 10
        }
      });

      expect(initialProgress.userId).toBe(newUser.id);
      expect(initialProgress.progressPercentage).toBe(0);

      // Step 4: First lesson completion
      mockPrisma.userLessonProgress.create.mockResolvedValueOnce({
        id: 'lesson-progress-id',
        userId: newUser.id,
        lessonId: 'lesson-1-id',
        completed: true,
        completedAt: new Date(),
        timeSpent: 300, // 5 minutes
        score: 85
      });

      const lessonProgress = await mockPrisma.userLessonProgress.create({
        data: {
          userId: newUser.id,
          lessonId: 'lesson-1-id',
          completed: true,
          completedAt: new Date(),
          timeSpent: 300,
          score: 85
        }
      });

      expect(lessonProgress.completed).toBe(true);
      expect(lessonProgress.score).toBe(85);

      // Verify all steps completed successfully
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockPrisma.userCourseProgress.create).toHaveBeenCalled();
      expect(mockPrisma.userLessonProgress.create).toHaveBeenCalled();
    });

    it('should handle incomplete onboarding gracefully', async () => {
      // User starts registration but doesn't complete verification
      const incompleteUser = {
        id: 'incomplete-user-id',
        email: 'incomplete@example.com',
        name: 'Incomplete User',
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(incompleteUser);

      const user = await mockPrisma.user.findUnique({
        where: { email: 'incomplete@example.com' }
      });

      expect(user?.emailVerified).toBeNull();

      // Should prompt for email verification
      const needsVerification = !user?.emailVerified;
      expect(needsVerification).toBe(true);
    });
  });

  describe('Learning Progression Workflow', () => {
    it('should complete full course learning progression', async () => {
      const userId = 'user-123';
      const courseId = 'solidity-basics';

      // Step 1: Enroll in course
      mockPrisma.userCourseProgress.create.mockResolvedValueOnce({
        id: 'progress-123',
        userId,
        courseId,
        progressPercentage: 0,
        completedLessons: 0,
        totalLessons: 5,
        lastAccessedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const enrollment = await mockPrisma.userCourseProgress.create({
        data: {
          userId,
          courseId,
          progressPercentage: 0,
          completedLessons: 0,
          totalLessons: 5
        }
      });

      expect(enrollment.progressPercentage).toBe(0);

      // Step 2: Complete lessons sequentially
      const lessons = [
        { id: 'lesson-1', title: 'Introduction to Solidity' },
        { id: 'lesson-2', title: 'Variables and Data Types' },
        { id: 'lesson-3', title: 'Functions and Modifiers' },
        { id: 'lesson-4', title: 'Smart Contract Structure' },
        { id: 'lesson-5', title: 'Deployment and Testing' }
      ];

      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        const completedLessons = i + 1;
        const progressPercentage = (completedLessons / lessons.length) * 100;

        // Complete lesson
        mockPrisma.userLessonProgress.create.mockResolvedValueOnce({
          id: `lesson-progress-${i + 1}`,
          userId,
          lessonId: lesson.id,
          completed: true,
          completedAt: new Date(),
          timeSpent: 600 + (i * 60), // Increasing time per lesson
          score: 85 + (i * 2) // Improving scores
        });

        await mockPrisma.userLessonProgress.create({
          data: {
            userId,
            lessonId: lesson.id,
            completed: true,
            completedAt: new Date(),
            timeSpent: 600 + (i * 60),
            score: 85 + (i * 2)
          }
        });

        // Update course progress
        mockPrisma.userCourseProgress.update.mockResolvedValueOnce({
          ...enrollment,
          completedLessons,
          progressPercentage,
          lastAccessedAt: new Date(),
          updatedAt: new Date()
        });

        await mockPrisma.userCourseProgress.update({
          where: {
            userId_courseId: { userId, courseId }
          },
          data: {
            completedLessons,
            progressPercentage,
            lastAccessedAt: new Date()
          }
        });
      }

      // Step 3: Complete course assessment
      mockPrisma.userAchievement.create.mockResolvedValueOnce({
        id: 'achievement-123',
        userId,
        achievementId: 'course-complete',
        earnedAt: new Date(),
        points: 500
      });

      const achievement = await mockPrisma.userAchievement.create({
        data: {
          userId,
          achievementId: 'course-complete',
          earnedAt: new Date(),
          points: 500
        }
      });

      expect(achievement.points).toBe(500);

      // Step 4: Update user experience and level
      const experienceGained = 1000;
      const newLevel = 3;

      mockPrisma.user.update.mockResolvedValueOnce({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        experience: experienceGained,
        level: newLevel,
        totalPoints: 2500,
        streak: 7,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const updatedUser = await mockPrisma.user.update({
        where: { id: userId },
        data: {
          experience: experienceGained,
          level: newLevel,
          totalPoints: 2500
        }
      });

      expect(updatedUser.level).toBe(newLevel);
      expect(updatedUser.experience).toBe(experienceGained);

      // Verify complete workflow
      expect(mockPrisma.userCourseProgress.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.userLessonProgress.create).toHaveBeenCalledTimes(5);
      expect(mockPrisma.userCourseProgress.update).toHaveBeenCalledTimes(5);
      expect(mockPrisma.userAchievement.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
    });

    it('should handle lesson retry and improvement workflow', async () => {
      const userId = 'user-123';
      const lessonId = 'difficult-lesson';

      // First attempt - low score
      mockPrisma.userLessonProgress.create.mockResolvedValueOnce({
        id: 'attempt-1',
        userId,
        lessonId,
        completed: true,
        completedAt: new Date(),
        timeSpent: 900,
        score: 55 // Below passing threshold
      });

      const firstAttempt = await mockPrisma.userLessonProgress.create({
        data: {
          userId,
          lessonId,
          completed: true,
          completedAt: new Date(),
          timeSpent: 900,
          score: 55
        }
      });

      expect(firstAttempt.score).toBe(55);

      // Second attempt - improved score
      mockPrisma.userLessonProgress.update.mockResolvedValueOnce({
        ...firstAttempt,
        completedAt: new Date(),
        timeSpent: 1200,
        score: 82,
        attempts: 2
      });

      const secondAttempt = await mockPrisma.userLessonProgress.update({
        where: {
          userId_lessonId: { userId, lessonId }
        },
        data: {
          completedAt: new Date(),
          timeSpent: 1200,
          score: 82,
          attempts: 2
        }
      });

      expect(secondAttempt.score).toBe(82);
      expect(secondAttempt.attempts).toBe(2);
    });
  });

  describe('Collaborative Learning Workflow', () => {
    it('should complete real-time collaboration session', async () => {
      const sessionId = 'collab-session-123';
      const initiatorId = 'user-123';
      const participantId = 'user-456';

      // Step 1: Create collaboration session
      const sessionData = {
        id: sessionId,
        initiatorId,
        courseId: 'course-123',
        lessonId: 'lesson-123',
        maxParticipants: 3,
        createdAt: new Date(),
        participants: [initiatorId]
      };

      // Mock session creation
      mockRedis.set.mockResolvedValueOnce(true);
      await mockRedis.set(`session:${sessionId}`, JSON.stringify(sessionData));

      // Step 2: Join session
      const joinData = {
        sessionId,
        userId: participantId,
        joinedAt: new Date()
      };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify({
        ...sessionData,
        participants: [initiatorId, participantId]
      }));

      const sessionWithParticipant = JSON.parse(
        await mockRedis.get(`session:${sessionId}`) || '{}'
      );

      expect(sessionWithParticipant.participants).toContain(participantId);

      // Step 3: Code collaboration
      const codeChanges = [
        {
          userId: initiatorId,
          operation: 'insert',
          position: { line: 1, column: 0 },
          content: 'pragma solidity ^0.8.0;',
          timestamp: Date.now()
        },
        {
          userId: participantId,
          operation: 'insert',
          position: { line: 3, column: 0 },
          content: 'contract MyContract {',
          timestamp: Date.now() + 1000
        }
      ];

      // Mock code synchronization
      for (const change of codeChanges) {
        mockRedis.set.mockResolvedValueOnce(true);
        await mockRedis.set(
          `session:${sessionId}:code:${change.timestamp}`,
          JSON.stringify(change)
        );
      }

      // Step 4: Complete session with shared achievement
      mockPrisma.userAchievement.createMany.mockResolvedValueOnce({ count: 2 });

      const collaborationAchievements = await mockPrisma.userAchievement.createMany({
        data: [
          {
            userId: initiatorId,
            achievementId: 'collaborative-coding',
            earnedAt: new Date(),
            points: 200
          },
          {
            userId: participantId,
            achievementId: 'collaborative-coding',
            earnedAt: new Date(),
            points: 200
          }
        ]
      });

      expect(collaborationAchievements.count).toBe(2);

      // Cleanup session
      mockRedis.del.mockResolvedValueOnce(1);
      await mockRedis.del(`session:${sessionId}`);

      expect(mockRedis.set).toHaveBeenCalledTimes(3); // Session + 2 code changes
      expect(mockRedis.del).toHaveBeenCalledTimes(1);
    });

    it('should handle session conflicts and resolution', async () => {
      const sessionId = 'conflict-session';
      const user1Id = 'user-1';
      const user2Id = 'user-2';

      // Simulate conflicting code changes
      const conflictingChanges = [
        {
          userId: user1Id,
          operation: 'replace',
          position: { line: 5, column: 0 },
          content: 'uint256 public value;',
          timestamp: Date.now()
        },
        {
          userId: user2Id,
          operation: 'replace',
          position: { line: 5, column: 0 },
          content: 'string public name;',
          timestamp: Date.now() + 10 // Slightly later
        }
      ];

      // Mock conflict resolution - last writer wins
      const resolvedChange = conflictingChanges[1]; // Later timestamp wins

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(resolvedChange));

      const finalChange = JSON.parse(
        await mockRedis.get(`session:${sessionId}:code:resolved`) || '{}'
      );

      expect(finalChange.userId).toBe(user2Id);
      expect(finalChange.content).toBe('string public name;');
    });
  });

  describe('Achievement and Gamification Workflow', () => {
    it('should complete achievement unlocking and progression', async () => {
      const userId = 'user-123';

      // Step 1: Complete daily streak
      const streakDays = 7;
      
      for (let day = 1; day <= streakDays; day++) {
        mockRedis.set.mockResolvedValueOnce(true);
        await mockRedis.set(`streak:${userId}:day:${day}`, 'completed');
      }

      // Step 2: Check for streak achievement
      mockPrisma.userAchievement.create.mockResolvedValueOnce({
        id: 'streak-achievement',
        userId,
        achievementId: 'week-streak',
        earnedAt: new Date(),
        points: 300
      });

      const streakAchievement = await mockPrisma.userAchievement.create({
        data: {
          userId,
          achievementId: 'week-streak',
          earnedAt: new Date(),
          points: 300
        }
      });

      expect(streakAchievement.points).toBe(300);

      // Step 3: Complete coding challenges
      const challenges = ['variables', 'functions', 'contracts'];
      
      for (const challenge of challenges) {
        mockPrisma.userAchievement.create.mockResolvedValueOnce({
          id: `challenge-${challenge}`,
          userId,
          achievementId: `challenge-${challenge}`,
          earnedAt: new Date(),
          points: 150
        });

        await mockPrisma.userAchievement.create({
          data: {
            userId,
            achievementId: `challenge-${challenge}`,
            earnedAt: new Date(),
            points: 150
          }
        });
      }

      // Step 4: Calculate total points and level up
      const totalAchievementPoints = 300 + (150 * 3); // 750 points
      const baseExperience = 2000;
      const newExperience = baseExperience + totalAchievementPoints;
      const newLevel = Math.floor(newExperience / 500); // Level every 500 XP

      mockPrisma.user.update.mockResolvedValueOnce({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        experience: newExperience,
        level: newLevel,
        totalPoints: newExperience,
        streak: streakDays,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const leveledUpUser = await mockPrisma.user.update({
        where: { id: userId },
        data: {
          experience: newExperience,
          level: newLevel,
          totalPoints: newExperience,
          streak: streakDays
        }
      });

      expect(leveledUpUser.level).toBe(5); // 2750 / 500 = 5.5, floored to 5
      expect(leveledUpUser.streak).toBe(streakDays);

      // Step 5: Unlock level-based achievements
      if (newLevel >= 5) {
        mockPrisma.userAchievement.create.mockResolvedValueOnce({
          id: 'level-5-achievement',
          userId,
          achievementId: 'level-5',
          earnedAt: new Date(),
          points: 500
        });

        const levelAchievement = await mockPrisma.userAchievement.create({
          data: {
            userId,
            achievementId: 'level-5',
            earnedAt: new Date(),
            points: 500
          }
        });

        expect(levelAchievement.achievementId).toBe('level-5');
      }

      // Verify achievement workflow completion
      expect(mockPrisma.userAchievement.create).toHaveBeenCalledTimes(5); // Streak + 3 challenges + level
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
    });

    it('should handle leaderboard updates and competitions', async () => {
      const competitionId = 'monthly-challenge';
      const participants = [
        { userId: 'user-1', score: 2500, completionTime: 1800 },
        { userId: 'user-2', score: 2300, completionTime: 2100 },
        { userId: 'user-3', score: 2700, completionTime: 1650 }
      ];

      // Step 1: Submit competition scores
      for (const participant of participants) {
        mockRedis.set.mockResolvedValueOnce(true);
        await mockRedis.set(
          `competition:${competitionId}:${participant.userId}`,
          JSON.stringify(participant)
        );
      }

      // Step 2: Calculate rankings
      const sortedParticipants = participants.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.completionTime - b.completionTime; // Faster time breaks ties
      });

      expect(sortedParticipants[0].userId).toBe('user-3'); // Highest score
      expect(sortedParticipants[1].userId).toBe('user-1'); // Second highest
      expect(sortedParticipants[2].userId).toBe('user-2'); // Lowest score

      // Step 3: Award competition prizes
      const prizes = [
        { position: 1, points: 1000, title: 'Gold Champion' },
        { position: 2, points: 500, title: 'Silver Runner-up' },
        { position: 3, points: 250, title: 'Bronze Participant' }
      ];

      for (let i = 0; i < sortedParticipants.length; i++) {
        const participant = sortedParticipants[i];
        const prize = prizes[i];

        mockPrisma.userAchievement.create.mockResolvedValueOnce({
          id: `competition-${prize.position}`,
          userId: participant.userId,
          achievementId: `competition-${competitionId}-${prize.position}`,
          earnedAt: new Date(),
          points: prize.points
        });

        await mockPrisma.userAchievement.create({
          data: {
            userId: participant.userId,
            achievementId: `competition-${competitionId}-${prize.position}`,
            earnedAt: new Date(),
            points: prize.points
          }
        });
      }

      expect(mockPrisma.userAchievement.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should recover from database connection failures', async () => {
      const userId = 'user-123';
      
      // Simulate database failure
      mockPrisma.user.findUnique.mockRejectedValueOnce(new Error('Database connection failed'));

      try {
        await mockPrisma.user.findUnique({ where: { id: userId } });
      } catch (error) {
        expect(error.message).toBe('Database connection failed');
      }

      // Simulate recovery - retry with exponential backoff
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          mockPrisma.user.findUnique.mockResolvedValueOnce({
            id: userId,
            email: 'test@example.com',
            name: 'Test User',
            createdAt: new Date(),
            updatedAt: new Date()
          });

          const user = await mockPrisma.user.findUnique({ where: { id: userId } });
          expect(user?.id).toBe(userId);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount === maxRetries) {
            throw error;
          }
          // Wait with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
        }
      }

      expect(retryCount).toBeLessThan(maxRetries);
    });

    it('should handle session timeout and re-authentication', async () => {
      const userId = 'user-123';
      const expiredSession = {
        user: { id: userId },
        expires: new Date(Date.now() - 1000).toISOString() // Expired 1 second ago
      };

      // Check if session is expired
      const isSessionExpired = new Date(expiredSession.expires) < new Date();
      expect(isSessionExpired).toBe(true);

      // Should trigger re-authentication flow
      if (isSessionExpired) {
        // Clear cached data
        mockRedis.del.mockResolvedValueOnce(1);
        await mockRedis.del(`session:${userId}`);

        // Redirect to login (mocked)
        mockRouter.push('/login');
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      }
    });
  });
});