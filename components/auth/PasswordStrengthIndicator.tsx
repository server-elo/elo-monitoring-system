'use client';

;
import { motion } from 'framer-motion';
import { Check, X, AlertTriangle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    noCommonPatterns: boolean;
  };
  estimatedCrackTime: string;
}

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
  showRequirements?: boolean;
  showEstimate?: boolean;
  minLength?: number;
}

export function PasswordStrengthIndicator({
  password,
  className,
  showRequirements = true,
  showEstimate = true,
  minLength = 8
}: PasswordStrengthIndicatorProps) {
  const strength = calculatePasswordStrength(password, minLength);

  const strengthColors: Record<number, string> = {
    0: 'bg-gray-300',
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-green-500'
  };

  const strengthLabels: Record<number, string> = {
    0: 'No password',
    1: 'Very weak',
    2: 'Weak',
    3: 'Good',
    4: 'Strong'
  };

  const strengthTextColors: Record<number, string> = {
    0: 'text-gray-500',
    1: 'text-red-500',
    2: 'text-orange-500',
    3: 'text-yellow-500',
    4: 'text-green-500'
  };

  if (!password) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">
            Password Strength
          </span>
          <span className={cn('text-sm font-medium', strengthTextColors[strength.score])}>
            {strengthLabels[strength.score]}
          </span>
        </div>
        
        <div className="flex space-x-1">
          {[1, 2, 3, 4].map((level) => (
            <motion.div
              key={level}
              className={cn(
                'h-2 flex-1 rounded-full transition-colors duration-300',
                level <= strength.score 
                  ? strengthColors[strength.score]
                  : 'bg-gray-700'
              )}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: level <= strength.score ? 1 : 0.3 }}
              transition={{ duration: 0.3, delay: level * 0.1 }}
            />
          ))}
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Requirements:</h4>
          <div className="grid grid-cols-1 gap-1">
            <RequirementItem
              met={strength.requirements.minLength}
              text={`At least ${minLength} characters`}
            />
            <RequirementItem
              met={strength.requirements.hasUppercase}
              text="One uppercase letter"
            />
            <RequirementItem
              met={strength.requirements.hasLowercase}
              text="One lowercase letter"
            />
            <RequirementItem
              met={strength.requirements.hasNumber}
              text="One number"
            />
            <RequirementItem
              met={strength.requirements.hasSpecialChar}
              text="One special character"
            />
            <RequirementItem
              met={strength.requirements.noCommonPatterns}
              text="No common patterns"
            />
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {strength.feedback.length > 0 && (
        <div className="space-y-1">
          {strength.feedback.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
              className="flex items-center space-x-2 text-sm text-yellow-400"
            >
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span>{message}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Crack Time Estimate */}
      {showEstimate && strength.score > 0 && (
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Shield className="w-3 h-3" />
          <span>Estimated crack time: {strength.estimatedCrackTime}</span>
        </div>
      )}
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center space-x-2 text-sm"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'w-4 h-4 rounded-full flex items-center justify-center',
          met ? 'bg-green-500' : 'bg-gray-600'
        )}
      >
        {met ? (
          <Check className="w-2.5 h-2.5 text-white" />
        ) : (
          <X className="w-2.5 h-2.5 text-gray-400" />
        )}
      </motion.div>
      <span className={cn(met ? 'text-green-400' : 'text-gray-400')}>
        {text}
      </span>
    </motion.div>
  );
}

export function calculatePasswordStrength(password: string, minLength: number = 8): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      feedback: [],
      requirements: {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        noCommonPatterns: false
      },
      estimatedCrackTime: 'Instantly'
    };
  }

  const requirements = {
    minLength: password.length >= minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noCommonPatterns: !hasCommonPatterns(password)
  };

  const feedback: string[] = [];
  let score = 0;

  // Check requirements and provide feedback
  if (!requirements.minLength) {
    feedback.push(`Use at least ${minLength} characters`);
  } else {
    score += 1;
  }

  if (!requirements.hasUppercase) {
    feedback.push('Add uppercase letters');
  } else {
    score += 0.5;
  }

  if (!requirements.hasLowercase) {
    feedback.push('Add lowercase letters');
  } else {
    score += 0.5;
  }

  if (!requirements.hasNumber) {
    feedback.push('Add numbers');
  } else {
    score += 0.5;
  }

  if (!requirements.hasSpecialChar) {
    feedback.push('Add special characters');
  } else {
    score += 0.5;
  }

  if (!requirements.noCommonPatterns) {
    feedback.push('Avoid common patterns like "123" or "abc"');
  } else {
    score += 1;
  }

  // Additional scoring based on length and complexity
  if (password.length >= 12) score += 0.5;
  if (password.length >= 16) score += 0.5;
  if (hasGoodEntropy(password)) score += 0.5;

  // Cap score at 4
  score = Math.min(4, Math.floor(score));

  // Estimate crack time
  const estimatedCrackTime = estimateCrackTime(password, score);

  return {
    score,
    feedback,
    requirements,
    estimatedCrackTime
  };
}

function hasCommonPatterns(password: string): boolean {
  const commonPatterns = [
    /123/,
    /abc/,
    /qwerty/i,
    /password/i,
    /admin/i,
    /login/i,
    /user/i,
    /test/i,
    /(.)\1{2,}/, // Repeated characters
    /012/,
    /789/,
    /987/,
    /321/
  ];

  return commonPatterns.some(pattern => pattern.test(password));
}

function hasGoodEntropy(password: string): boolean {
  // Check for good character distribution
  const charTypes = {
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const typeCount = Object.values(charTypes).filter(Boolean).length;
  return typeCount >= 3 && password.length >= 10;
}

function estimateCrackTime(password: string, score: number): string {
  // Simplified crack time estimation
  const baseTime = Math.pow(2, password.length * score);
  
  if (baseTime < 60) return 'Less than a minute';
  if (baseTime < 3600) return `${Math.floor(baseTime / 60)} minutes`;
  if (baseTime < 86400) return `${Math.floor(baseTime / 3600)} hours`;
  if (baseTime < 2592000) return `${Math.floor(baseTime / 86400)} days`;
  if (baseTime < 31536000) return `${Math.floor(baseTime / 2592000)} months`;
  
  return `${Math.floor(baseTime / 31536000)} years`;
}

// Hook for password validation
export function usePasswordValidation(minLength: number = 8) {
  const validatePassword = (password: string) => {
    const strength = calculatePasswordStrength(password, minLength);
    
    return {
      isValid: strength.score >= 3 && Object.values(strength.requirements).every(Boolean),
      strength,
      errors: strength.feedback
    };
  };

  return { validatePassword };
}
