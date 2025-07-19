import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock XP system implementation based on the codebase analysis
interface XPEvent {
  type: 'lesson_complete' | 'quiz_perfect' | 'project_submit' | 'streak_bonus' | 'achievement_unlock';
  baseXP: number;
  multipliers?: {
    streak?: number;
    difficulty?: number;
    performance?: number;
    bonus?: number;
  };
  metadata?: Record<string, any>;
}

interface LevelInfo {
  currentLevel: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXPForLevel: number;
  levelProgress: number; // 0-100 percentage
}

class XPSystem {
  private readonly baseXPValues = {
    lesson_complete: 100,
    quiz_perfect: 150,
    project_submit: 300,
    streak_bonus: 50,
    achievement_unlock: 0 // Variable based on achievement
  };

  private readonly levelThresholds = [
    0, 1000, 2500, 4500, 7000, 10000, 14000, 19000, 25000, 32000, 40000
  ];

  calculateXP(event: XPEvent): number {
    let xp = event.baseXP || this.baseXPValues[event.type];
    
    if (event.multipliers) {
      if (event.multipliers.streak) {
        xp *= (1 + (event.multipliers.streak - 1) * 0.1); // 10% per streak day
      }
      if (event.multipliers.difficulty) {
        xp *= event.multipliers.difficulty;
      }
      if (event.multipliers.performance) {
        xp *= event.multipliers.performance;
      }
      if (event.multipliers.bonus) {
        xp += event.multipliers.bonus;
      }
    }

    return Math.floor(xp);
  }

  getLevelInfo(totalXP: number): LevelInfo {
    let currentLevel = 1;
    
    for (let i = this.levelThresholds.length - 1; i >= 0; i--) {
      if (totalXP >= this.levelThresholds[i]) {
        currentLevel = i + 1;
        break;
      }
    }

    const currentLevelXP = this.levelThresholds[currentLevel - 1] || 0;
    const nextLevelXP = this.levelThresholds[currentLevel] || this.levelThresholds[this.levelThresholds.length - 1] + 10000;
    const xpInCurrentLevel = totalXP - currentLevelXP;
    const xpToNextLevel = nextLevelXP - totalXP;
    const levelProgress = (xpInCurrentLevel / (nextLevelXP - currentLevelXP)) * 100;

    return {
      currentLevel,
      currentXP: totalXP,
      xpToNextLevel: Math.max(0, xpToNextLevel),
      totalXPForLevel: nextLevelXP - currentLevelXP,
      levelProgress: Math.min(100, Math.max(0, levelProgress))
    };
  }

  getXPForLevel(level: number): number {
    return this.levelThresholds[level - 1] || 0;
  }

  calculateStreakMultiplier(streakDays: number): number {
    return Math.min(1 + (streakDays - 1) * 0.1, 3.0); // Cap at 3x multiplier
  }

  calculateDifficultyMultiplier(difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'): number {
    const multipliers = {
      beginner: 1.0,
      intermediate: 1.2,
      advanced: 1.5,
      expert: 2.0
    };
    return multipliers[difficulty];
  }

  calculatePerformanceMultiplier(score: number): number {
    if (score >= 95) return 1.5;
    if (score >= 90) return 1.3;
    if (score >= 80) return 1.1;
    if (score >= 70) return 1.0;
    return 0.8;
  }
}

describe('XP System - Comprehensive Test Suite', () => {
  let xpSystem: XPSystem;

  beforeEach(() => {
    xpSystem = new XPSystem();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('XP Calculation', () => {
    describe('Base XP Values', () => {
      it('should calculate correct base XP for lesson completion', () => {
        const event: XPEvent = {
          type: 'lesson_complete',
          baseXP: 100
        };

        const xp = xpSystem.calculateXP(event);
        expect(xp).toBe(100);
      });

      it('should calculate correct base XP for perfect quiz', () => {
        const event: XPEvent = {
          type: 'quiz_perfect',
          baseXP: 150
        };

        const xp = xpSystem.calculateXP(event);
        expect(xp).toBe(150);
      });

      it('should calculate correct base XP for project submission', () => {
        const event: XPEvent = {
          type: 'project_submit',
          baseXP: 300
        };

        const xp = xpSystem.calculateXP(event);
        expect(xp).toBe(300);
      });

      it('should use default base XP when not specified', () => {
        const event: XPEvent = {
          type: 'lesson_complete',
          baseXP: 0 // Will use default
        };

        const xp = xpSystem.calculateXP(event);
        expect(xp).toBe(100); // Default for lesson_complete
      });
    });

    describe('Streak Multipliers', () => {
      it('should apply streak multiplier correctly', () => {
        const event: XPEvent = {
          type: 'lesson_complete',
          baseXP: 100,
          multipliers: {
            streak: 5 // 5-day streak
          }
        };

        const xp = xpSystem.calculateXP(event);
        expect(xp).toBe(140); // 100 * (1 + 4 * 0.1) = 140
      });

      it('should calculate streak multiplier for different streak lengths', () => {
        expect(xpSystem.calculateStreakMultiplier(1)).toBe(1.0);
        expect(xpSystem.calculateStreakMultiplier(5)).toBe(1.4);
        expect(xpSystem.calculateStreakMultiplier(10)).toBe(1.9);
        expect(xpSystem.calculateStreakMultiplier(30)).toBe(3.0); // Capped at 3x
      });

      it('should cap streak multiplier at maximum value', () => {
        const event: XPEvent = {
          type: 'lesson_complete',
          baseXP: 100,
          multipliers: {
            streak: 50 // Very long streak
          }
        };

        const xp = xpSystem.calculateXP(event);
        expect(xp).toBe(300); // Should be capped at 3x multiplier
      });
    });

    describe('Difficulty Multipliers', () => {
      it('should apply difficulty multipliers correctly', () => {
        expect(xpSystem.calculateDifficultyMultiplier('beginner')).toBe(1.0);
        expect(xpSystem.calculateDifficultyMultiplier('intermediate')).toBe(1.2);
        expect(xpSystem.calculateDifficultyMultiplier('advanced')).toBe(1.5);
        expect(xpSystem.calculateDifficultyMultiplier('expert')).toBe(2.0);
      });

      it('should apply difficulty multiplier to XP calculation', () => {
        const event: XPEvent = {
          type: 'lesson_complete',
          baseXP: 100,
          multipliers: {
            difficulty: 1.5 // Advanced difficulty
          }
        };

        const xp = xpSystem.calculateXP(event);
        expect(xp).toBe(150);
      });
    });

    describe('Performance Multipliers', () => {
      it('should calculate performance multipliers based on score', () => {
        expect(xpSystem.calculatePerformanceMultiplier(100)).toBe(1.5);
        expect(xpSystem.calculatePerformanceMultiplier(95)).toBe(1.5);
        expect(xpSystem.calculatePerformanceMultiplier(92)).toBe(1.3);
        expect(xpSystem.calculatePerformanceMultiplier(85)).toBe(1.1);
        expect(xpSystem.calculatePerformanceMultiplier(75)).toBe(1.0);
        expect(xpSystem.calculatePerformanceMultiplier(65)).toBe(0.8);
      });

      it('should apply performance multiplier to XP calculation', () => {
        const event: XPEvent = {
          type: 'quiz_perfect',
          baseXP: 150,
          multipliers: {
            performance: 1.5 // Perfect score
          }
        };

        const xp = xpSystem.calculateXP(event);
        expect(xp).toBe(225); // 150 * 1.5
      });
    });

    describe('Combined Multipliers', () => {
      it('should apply multiple multipliers correctly', () => {
        const event: XPEvent = {
          type: 'lesson_complete',
          baseXP: 100,
          multipliers: {
            streak: 3, // 20% bonus
            difficulty: 1.5, // Advanced
            performance: 1.3 // Good score
          }
        };

        const xp = xpSystem.calculateXP(event);
        // 100 * 1.2 * 1.5 * 1.3 = 234
        expect(xp).toBe(234);
      });

      it('should handle bonus XP addition', () => {
        const event: XPEvent = {
          type: 'lesson_complete',
          baseXP: 100,
          multipliers: {
            bonus: 50 // Flat bonus
          }
        };

        const xp = xpSystem.calculateXP(event);
        expect(xp).toBe(150); // 100 + 50
      });

      it('should apply multipliers before adding bonus', () => {
        const event: XPEvent = {
          type: 'lesson_complete',
          baseXP: 100,
          multipliers: {
            difficulty: 2.0,
            bonus: 50
          }
        };

        const xp = xpSystem.calculateXP(event);
        expect(xp).toBe(250); // (100 * 2.0) + 50
      });
    });
  });

  describe('Level System', () => {
    describe('Level Calculation', () => {
      it('should calculate correct level for different XP amounts', () => {
        expect(xpSystem.getLevelInfo(0).currentLevel).toBe(1);
        expect(xpSystem.getLevelInfo(500).currentLevel).toBe(1);
        expect(xpSystem.getLevelInfo(1000).currentLevel).toBe(2);
        expect(xpSystem.getLevelInfo(2500).currentLevel).toBe(3);
        expect(xpSystem.getLevelInfo(5000).currentLevel).toBe(4);
      });

      it('should calculate XP to next level correctly', () => {
        const levelInfo = xpSystem.getLevelInfo(1500);
        
        expect(levelInfo.currentLevel).toBe(2);
        expect(levelInfo.xpToNextLevel).toBe(1000); // 2500 - 1500
        expect(levelInfo.totalXPForLevel).toBe(1500); // 2500 - 1000
      });

      it('should calculate level progress percentage', () => {
        const levelInfo = xpSystem.getLevelInfo(1750); // Halfway through level 2
        
        expect(levelInfo.currentLevel).toBe(2);
        expect(levelInfo.levelProgress).toBe(50); // 750/1500 * 100
      });

      it('should handle maximum level correctly', () => {
        const levelInfo = xpSystem.getLevelInfo(100000); // Very high XP
        
        expect(levelInfo.currentLevel).toBeGreaterThan(10);
        expect(levelInfo.xpToNextLevel).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Level Thresholds', () => {
      it('should return correct XP requirement for each level', () => {
        expect(xpSystem.getXPForLevel(1)).toBe(0);
        expect(xpSystem.getXPForLevel(2)).toBe(1000);
        expect(xpSystem.getXPForLevel(3)).toBe(2500);
        expect(xpSystem.getXPForLevel(5)).toBe(7000);
      });

      it('should handle invalid level requests', () => {
        expect(xpSystem.getXPForLevel(0)).toBe(0);
        expect(xpSystem.getXPForLevel(-1)).toBe(0);
        expect(xpSystem.getXPForLevel(100)).toBe(0); // Beyond defined levels
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle negative XP gracefully', () => {
      const event: XPEvent = {
        type: 'lesson_complete',
        baseXP: -100
      };

      const xp = xpSystem.calculateXP(event);
      expect(xp).toBeLessThanOrEqual(0);
    });

    it('should handle zero XP', () => {
      const event: XPEvent = {
        type: 'lesson_complete',
        baseXP: 0
      };

      const xp = xpSystem.calculateXP(event);
      expect(xp).toBe(100); // Should use default base XP
    });

    it('should handle missing multipliers', () => {
      const event: XPEvent = {
        type: 'lesson_complete',
        baseXP: 100
        // No multipliers
      };

      const xp = xpSystem.calculateXP(event);
      expect(xp).toBe(100);
    });

    it('should handle extreme multiplier values', () => {
      const event: XPEvent = {
        type: 'lesson_complete',
        baseXP: 100,
        multipliers: {
          difficulty: 1000 // Extreme multiplier
        }
      };

      const xp = xpSystem.calculateXP(event);
      expect(xp).toBe(100000);
    });

    it('should floor XP values to integers', () => {
      const event: XPEvent = {
        type: 'lesson_complete',
        baseXP: 100,
        multipliers: {
          performance: 1.33 // Results in decimal
        }
      };

      const xp = xpSystem.calculateXP(event);
      expect(xp).toBe(133); // Should be floored
      expect(Number.isInteger(xp)).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should calculate XP efficiently for many events', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        const event: XPEvent = {
          type: 'lesson_complete',
          baseXP: 100,
          multipliers: {
            streak: Math.floor(Math.random() * 10) + 1,
            difficulty: 1 + Math.random(),
            performance: 0.8 + Math.random() * 0.7
          }
        };
        xpSystem.calculateXP(event);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // Should complete within 50ms
    });

    it('should calculate level info efficiently', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        xpSystem.getLevelInfo(Math.random() * 50000);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(20); // Should be very fast
    });
  });
});
