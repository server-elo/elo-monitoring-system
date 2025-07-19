/**
 * Comprehensive UAT Testing Scenarios for Solidity Learning Platform
 * Defines structured testing scenarios covering core user journeys
 */

export interface UATTask {
  id: string;
  title: string;
  description: string;
  category: 'onboarding' | 'collaboration' | 'ai-tutoring' | 'learning-path' | 'social';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  prerequisites: string[];
  steps: UATStep[];
  successCriteria: string[];
  metrics: {
    completionRate: number;
    averageTime: number;
    satisfactionScore: number;
    errorRate: number;
  };
}

export interface UATStep {
  id: string;
  instruction: string;
  expectedResult: string;
  helpText?: string;
  screenshot?: boolean;
  validation?: {
    type: 'element' | 'text' | 'url' | 'custom';
    selector?: string;
    expectedValue?: string;
    customValidator?: string;
  };
}

export interface UATSession {
  id: string;
  testerId: string;
  testerInfo: {
    name: string;
    email: string;
    experience: 'beginner' | 'intermediate' | 'expert';
    background: string;
    device: string;
    browser: string;
  };
  assignedTasks: string[];
  startTime: Date;
  endTime?: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  feedback: UATFeedback[];
  metrics: {
    tasksCompleted: number;
    totalTime: number;
    errorsEncountered: number;
    helpRequests: number;
  };
}

export interface UATFeedback {
  taskId: string;
  stepId?: string;
  type: 'success' | 'error' | 'suggestion' | 'confusion';
  rating: number; // 1-5
  comment: string;
  timestamp: Date;
  screenshot?: string;
  videoRecording?: string;
}

/**
 * Core UAT Testing Scenarios
 */
export const uatScenarios: UATTask[] = [
  {
    id: 'onboarding-new-user',
    title: 'New User Onboarding and First Lesson',
    description: 'Complete the entire onboarding process and finish your first Solidity lesson',
    category: 'onboarding',
    difficulty: 'beginner',
    estimatedTime: 20,
    prerequisites: [],
    steps: [
      {
        id: 'step-1',
        instruction: 'Navigate to the homepage and click "Get Started"',
        expectedResult: 'You should see the sign-up page',
        validation: {
          type: 'url',
          expectedValue: '/auth/register'
        }
      },
      {
        id: 'step-2',
        instruction: 'Create a new account using GitHub or Google OAuth',
        expectedResult: 'You should be redirected to the dashboard after successful authentication',
        validation: {
          type: 'url',
          expectedValue: '/dashboard'
        }
      },
      {
        id: 'step-3',
        instruction: 'Complete the welcome survey about your programming experience',
        expectedResult: 'Survey should be submitted and you should see personalized recommendations',
        validation: {
          type: 'element',
          selector: '[data-testid="recommendations-panel"]'
        }
      },
      {
        id: 'step-4',
        instruction: 'Click on "Start Learning" and select the "Solidity Basics" course',
        expectedResult: 'You should be taken to the first lesson of the course',
        validation: {
          type: 'text',
          expectedValue: 'Lesson 1:'
        }
      },
      {
        id: 'step-5',
        instruction: 'Read through the lesson content and complete the interactive code example',
        expectedResult: 'Code should compile successfully and show expected output',
        validation: {
          type: 'element',
          selector: '[data-testid="compilation-success"]'
        }
      },
      {
        id: 'step-6',
        instruction: 'Take the lesson quiz and submit your answers',
        expectedResult: 'Quiz should be graded and you should see your score',
        validation: {
          type: 'element',
          selector: '[data-testid="quiz-results"]'
        }
      },
      {
        id: 'step-7',
        instruction: 'Mark the lesson as complete and proceed to the next lesson',
        expectedResult: 'Progress should be updated and next lesson should be unlocked',
        validation: {
          type: 'element',
          selector: '[data-testid="progress-updated"]'
        }
      }
    ],
    successCriteria: [
      'Account created successfully',
      'Welcome survey completed',
      'First lesson completed with passing grade',
      'Progress tracking working correctly',
      'Navigation between lessons works smoothly'
    ],
    metrics: {
      completionRate: 0,
      averageTime: 0,
      satisfactionScore: 0,
      errorRate: 0
    }
  },

  {
    id: 'collaboration-session',
    title: 'Collaborative Coding Session with Multiple Participants',
    description: 'Create and participate in a real-time collaborative coding session',
    category: 'collaboration',
    difficulty: 'intermediate',
    estimatedTime: 30,
    prerequisites: ['Account created', 'Basic Solidity knowledge'],
    steps: [
      {
        id: 'collab-1',
        instruction: 'Navigate to the Collaboration section and click "Create New Session"',
        expectedResult: 'Session creation form should appear',
        validation: {
          type: 'element',
          selector: '[data-testid="session-form"]'
        }
      },
      {
        id: 'collab-2',
        instruction: 'Fill in session details: title, description, and set max participants to 5',
        expectedResult: 'Form should accept all inputs without errors',
        validation: {
          type: 'element',
          selector: '[data-testid="form-valid"]'
        }
      },
      {
        id: 'collab-3',
        instruction: 'Create the session and wait for the collaborative editor to load',
        expectedResult: 'Monaco editor should load with real-time collaboration features',
        validation: {
          type: 'element',
          selector: '.monaco-editor'
        }
      },
      {
        id: 'collab-4',
        instruction: 'Share the session link with another tester (or open in another browser)',
        expectedResult: 'Second participant should be able to join the session',
        helpText: 'You can copy the session URL from the address bar or use the share button'
      },
      {
        id: 'collab-5',
        instruction: 'Start typing code in the editor and observe real-time synchronization',
        expectedResult: 'Code changes should appear in real-time for all participants',
        validation: {
          type: 'custom',
          customValidator: 'checkRealTimeSync'
        }
      },
      {
        id: 'collab-6',
        instruction: 'Use the chat feature to communicate with other participants',
        expectedResult: 'Messages should appear instantly for all participants',
        validation: {
          type: 'element',
          selector: '[data-testid="chat-message"]'
        }
      },
      {
        id: 'collab-7',
        instruction: 'Test the voice chat feature (if available)',
        expectedResult: 'Voice communication should work clearly',
        helpText: 'Make sure to allow microphone permissions'
      },
      {
        id: 'collab-8',
        instruction: 'Compile the collaborative code and check for errors',
        expectedResult: 'Compilation results should be visible to all participants',
        validation: {
          type: 'element',
          selector: '[data-testid="compilation-results"]'
        }
      },
      {
        id: 'collab-9',
        instruction: 'Save the session and leave the collaboration',
        expectedResult: 'Session should be saved and accessible later',
        validation: {
          type: 'element',
          selector: '[data-testid="session-saved"]'
        }
      }
    ],
    successCriteria: [
      'Session created successfully',
      'Multiple participants can join',
      'Real-time code synchronization works',
      'Chat functionality works',
      'Code compilation works for all participants',
      'Session can be saved and resumed'
    ],
    metrics: {
      completionRate: 0,
      averageTime: 0,
      satisfactionScore: 0,
      errorRate: 0
    }
  },

  {
    id: 'ai-tutoring-interaction',
    title: 'AI Tutoring and Code Debugging Assistance',
    description: 'Interact with the AI tutor to get help with Solidity code and debugging',
    category: 'ai-tutoring',
    difficulty: 'intermediate',
    estimatedTime: 25,
    prerequisites: ['Basic Solidity knowledge'],
    steps: [
      {
        id: 'ai-1',
        instruction: 'Navigate to the AI Tutor section',
        expectedResult: 'AI chat interface should load with welcome message',
        validation: {
          type: 'element',
          selector: '[data-testid="ai-chat-interface"]'
        }
      },
      {
        id: 'ai-2',
        instruction: 'Ask the AI: "Can you explain what a smart contract is?"',
        expectedResult: 'AI should provide a clear, helpful explanation',
        validation: {
          type: 'element',
          selector: '[data-testid="ai-response"]'
        }
      },
      {
        id: 'ai-3',
        instruction: 'Paste a buggy Solidity contract and ask the AI to find the issues',
        expectedResult: 'AI should identify bugs and suggest fixes',
        helpText: 'Use the provided sample buggy contract or create your own'
      },
      {
        id: 'ai-4',
        instruction: 'Ask for code optimization suggestions for your contract',
        expectedResult: 'AI should provide specific optimization recommendations',
        validation: {
          type: 'text',
          expectedValue: 'optimization'
        }
      },
      {
        id: 'ai-5',
        instruction: 'Request a code review of a complete smart contract',
        expectedResult: 'AI should provide comprehensive feedback on code quality',
        validation: {
          type: 'element',
          selector: '[data-testid="code-review-results"]'
        }
      },
      {
        id: 'ai-6',
        instruction: 'Ask for learning recommendations based on your current progress',
        expectedResult: 'AI should suggest relevant next topics or exercises',
        validation: {
          type: 'element',
          selector: '[data-testid="learning-recommendations"]'
        }
      },
      {
        id: 'ai-7',
        instruction: 'Test the AI\'s ability to generate code examples',
        expectedResult: 'AI should generate working Solidity code examples',
        helpText: 'Ask for something like "Create a simple ERC-20 token contract"'
      },
      {
        id: 'ai-8',
        instruction: 'Rate the AI responses and provide feedback',
        expectedResult: 'Feedback should be recorded successfully',
        validation: {
          type: 'element',
          selector: '[data-testid="feedback-submitted"]'
        }
      }
    ],
    successCriteria: [
      'AI responds quickly and accurately',
      'Code analysis provides useful insights',
      'Learning recommendations are relevant',
      'Generated code examples are correct',
      'Feedback system works properly'
    ],
    metrics: {
      completionRate: 0,
      averageTime: 0,
      satisfactionScore: 0,
      errorRate: 0
    }
  },

  {
    id: 'complete-learning-path',
    title: 'Complete Learning Path from Beginner to Intermediate',
    description: 'Progress through multiple lessons and achieve intermediate level',
    category: 'learning-path',
    difficulty: 'beginner',
    estimatedTime: 60,
    prerequisites: ['Account created'],
    steps: [
      {
        id: 'path-1',
        instruction: 'Start with "Solidity Fundamentals" course',
        expectedResult: 'Course should load with clear learning objectives',
        validation: {
          type: 'element',
          selector: '[data-testid="course-objectives"]'
        }
      },
      {
        id: 'path-2',
        instruction: 'Complete at least 5 lessons in the fundamentals course',
        expectedResult: 'Progress should be tracked and achievements unlocked',
        validation: {
          type: 'element',
          selector: '[data-testid="achievement-unlocked"]'
        }
      },
      {
        id: 'path-3',
        instruction: 'Take the mid-course assessment',
        expectedResult: 'Assessment should provide detailed feedback on performance',
        validation: {
          type: 'element',
          selector: '[data-testid="assessment-feedback"]'
        }
      },
      {
        id: 'path-4',
        instruction: 'Complete a hands-on project (build a simple contract)',
        expectedResult: 'Project should be submitted and reviewed',
        validation: {
          type: 'element',
          selector: '[data-testid="project-submitted"]'
        }
      },
      {
        id: 'path-5',
        instruction: 'Progress to "Intermediate Solidity" course',
        expectedResult: 'New course should be unlocked and accessible',
        validation: {
          type: 'element',
          selector: '[data-testid="course-unlocked"]'
        }
      },
      {
        id: 'path-6',
        instruction: 'Complete the first 3 lessons of the intermediate course',
        expectedResult: 'Progress should continue tracking across courses',
        validation: {
          type: 'element',
          selector: '[data-testid="cross-course-progress"]'
        }
      }
    ],
    successCriteria: [
      'Smooth progression between lessons',
      'Accurate progress tracking',
      'Meaningful achievements and milestones',
      'Clear learning path guidance',
      'Appropriate difficulty progression'
    ],
    metrics: {
      completionRate: 0,
      averageTime: 0,
      satisfactionScore: 0,
      errorRate: 0
    }
  },

  {
    id: 'social-features-usage',
    title: 'Social Features and Community Interaction',
    description: 'Explore leaderboards, achievements, and community features',
    category: 'social',
    difficulty: 'beginner',
    estimatedTime: 15,
    prerequisites: ['Account created', 'Some progress made'],
    steps: [
      {
        id: 'social-1',
        instruction: 'Navigate to the Leaderboard section',
        expectedResult: 'Leaderboard should display with your ranking',
        validation: {
          type: 'element',
          selector: '[data-testid="leaderboard"]'
        }
      },
      {
        id: 'social-2',
        instruction: 'Check your achievements and badges',
        expectedResult: 'Achievements page should show earned and available badges',
        validation: {
          type: 'element',
          selector: '[data-testid="achievements-grid"]'
        }
      },
      {
        id: 'social-3',
        instruction: 'Update your profile with a bio and profile picture',
        expectedResult: 'Profile should be updated successfully',
        validation: {
          type: 'element',
          selector: '[data-testid="profile-updated"]'
        }
      },
      {
        id: 'social-4',
        instruction: 'Browse other users\' profiles and follow someone',
        expectedResult: 'Following should work and update your network',
        validation: {
          type: 'element',
          selector: '[data-testid="following-updated"]'
        }
      },
      {
        id: 'social-5',
        instruction: 'Share a completed project or achievement on social media',
        expectedResult: 'Sharing functionality should work correctly',
        validation: {
          type: 'element',
          selector: '[data-testid="share-success"]'
        }
      }
    ],
    successCriteria: [
      'Leaderboard displays correctly',
      'Achievement system is motivating',
      'Profile customization works',
      'Social connections function properly',
      'Sharing features work'
    ],
    metrics: {
      completionRate: 0,
      averageTime: 0,
      satisfactionScore: 0,
      errorRate: 0
    }
  }
];

/**
 * Success Criteria and KPIs for UAT
 */
export const uatSuccessCriteria = {
  taskCompletionRate: {
    target: 85, // 85% of users should complete core tasks
    critical: 70 // Below 70% is critical
  },
  userSatisfactionScore: {
    target: 4.0, // Average rating of 4.0/5.0
    critical: 3.5 // Below 3.5 is critical
  },
  technicalPerformance: {
    pageLoadTime: {
      target: 3000, // 3 seconds
      critical: 5000 // 5 seconds is critical
    },
    realTimeSyncLatency: {
      target: 100, // 100ms
      critical: 500 // 500ms is critical
    },
    errorRate: {
      target: 5, // 5% error rate
      critical: 15 // 15% is critical
    }
  },
  learningEffectiveness: {
    knowledgeRetention: {
      target: 80, // 80% retention after 1 week
      critical: 60 // Below 60% is critical
    },
    skillProgression: {
      target: 75, // 75% show measurable improvement
      critical: 50 // Below 50% is critical
    }
  }
};

/**
 * UAT Tester Recruitment Criteria
 */
export const testerCriteria = {
  targetAudience: [
    {
      profile: 'Blockchain Developers',
      count: 10,
      requirements: ['2+ years blockchain experience', 'Solidity knowledge', 'Professional developer']
    },
    {
      profile: 'Solidity Learners',
      count: 10,
      requirements: ['Learning Solidity', 'Basic programming knowledge', 'Motivated to learn']
    },
    {
      profile: 'Coding Bootcamp Students',
      count: 10,
      requirements: ['Currently in bootcamp', 'Web development background', 'New to blockchain']
    }
  ],
  deviceMix: {
    desktop: 70, // 70% desktop users
    tablet: 20,  // 20% tablet users
    mobile: 10   // 10% mobile users
  },
  browserMix: {
    chrome: 50,
    firefox: 20,
    safari: 20,
    edge: 10
  }
};

export default uatScenarios;
