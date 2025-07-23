import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  image?: string;
  level: number;
  xp: number;
  achievements: string[];
  completedLessons: string[];
  streak: number;
  lastActiveDate: string;
  role: 'USER' | 'ADMIN' | 'INSTRUCTOR' | 'MENTOR';
}

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
        
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock successful login
        const mockUser: User = {
          id: '1',
          email,
          name: email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          username: email.split('@')[0],
          role: 'USER',
          level: 3,
          xp: 850,
          achievements: ['first-contract', 'knowledge-seeker', 'code-master', 'collaborator'],
          completedLessons: ['solidity-basics-1', 'solidity-basics-2'],
          streak: 7,
          lastActiveDate: new Date().toISOString(),
        };
        
        set({ user: mockUser, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },

      addXP: (amount) => {
        const { user } = get();
        if (user) {
          const newXP = user.xp + amount;
          const newLevel = Math.floor(newXP / 1000) + 1;
          set({ 
            user: { 
              ...user, 
              xp: newXP,
              level: newLevel
            } 
          });
        }
      },

      completeLesson: (lessonId) => {
        const { user } = get();
        if (user && !user.completedLessons.includes(lessonId)) {
          set({
            user: {
              ...user,
              completedLessons: [...user.completedLessons, lessonId]
            }
          });
        }
      },

      unlockAchievement: (achievementId) => {
        const { user } = get();
        if (user && !user.achievements.includes(achievementId)) {
          set({
            user: {
              ...user,
              achievements: [...user.achievements, achievementId]
            }
          });
        }
      },
    }),
    {
      name: 'user-storage',
    }
  )
);