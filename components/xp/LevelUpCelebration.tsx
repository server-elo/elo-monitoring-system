"use client"

import { ReactElement } from 'react';

interface LevelUpCelebrationProps {
  level?: number;
  onComplete?: () => void;
  visible?: boolean;
}

export function LevelUpCelebration({ level, onComplete, visible }: LevelUpCelebrationProps): ReactElement | null {
  if (!visible) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold text-green-600 mb-4">
          Level Up! 🎉
        </h2>
        {level && (
          <p className="text-lg mb-4">
            You reached level {level}!
          </p>
        )}
        <button
          onClick={onComplete}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default LevelUpCelebration;