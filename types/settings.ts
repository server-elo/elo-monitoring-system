export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    lessons: boolean;
    achievements: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
  privacy: {
    showProfile: boolean;
    showProgress: boolean;
    allowTracking: boolean;
  };
  learningPreferences: {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    pace: 'slow' | 'medium' | 'fast';
    interactiveMode: boolean;
    codeHints: boolean;
  };
}

export type SettingsSection = keyof UserSettings;
export type ThemeMode = UserSettings['theme'];
export type LanguageCode = string;
export type DifficultyLevel = UserSettings['learningPreferences']['difficulty'];
export type LearningPace = UserSettings['learningPreferences']['pace'];
export type FontSize = UserSettings['accessibility']['fontSize'];

export interface SettingsUpdatePayload {
  section: SettingsSection;
  data: Partial<UserSettings[SettingsSection]>;
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'auto',
  language: 'en',
  notifications: {
    email: true,
    push: true,
    lessons: true,
    achievements: true,
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    fontSize: 'medium',
  },
  privacy: {
    showProfile: true,
    showProgress: true,
    allowTracking: false,
  },
  learningPreferences: {
    difficulty: 'beginner',
    pace: 'medium',
    interactiveMode: true,
    codeHints: true,
  },
};
