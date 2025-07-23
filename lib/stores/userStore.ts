import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  addXP: (amount: number) => void;
  completeLesson: (lessonId: string) => void;
  unlockAchievement: (achievementId: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // Simulate login
          const mockUser: User = {
            id: '1',
            email,
            name: 'Demo User',
            xp: 0,
            level: 1,
            achievements: [],
            completedLessons: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          set({ user: mockUser, isAuthenticated: true });
        } catch (error) {
          console.error('Login failed:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },

      addXP: (amount) => {
        const currentUser = get().user;
        if (currentUser) {
          const newXP = currentUser.xp + amount;
          const newLevel = Math.floor(newXP / 1000) + 1;
          set({
            user: {
              ...currentUser,
              xp: newXP,
              level: newLevel,
            },
          });
        }
      },

      completeLesson: (lessonId) => {
        const currentUser = get().user;
        if (currentUser && !currentUser.completedLessons.includes(lessonId)) {
          set({
            user: {
              ...currentUser,
              completedLessons: [...currentUser.completedLessons, lessonId],
            },
          });
        }
      },

      unlockAchievement: (achievementId) => {
        const currentUser = get().user;
        if (currentUser && !currentUser.achievements.includes(achievementId)) {
          set({
            user: {
              ...currentUser,
              achievements: [...currentUser.achievements, achievementId],
            },
          });
        }
      },
    }),
    {
      name: 'user-storage',
    }
  )
);