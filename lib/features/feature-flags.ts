/**
 * Feature Flag System for managing beta/coming soon features
 */

export type UserRole = 'student' | 'instructor' | 'admin';

export type FeatureState = 'disabled' | 'coming_soon' | 'beta' | 'development' | 'enabled';

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  state: FeatureState;
  enabledForRoles?: UserRole[];
  enabledForUsers?: string[]; // User IDs
  releaseDate?: string; // ISO date string
  betaStartDate?: string;
  progressPercentage?: number; // For development features
  dependencies?: string[]; // Other feature keys this depends on
  metadata?: {
    estimatedCompletion?: string;
    contactEmail?: string;
    documentationUrl?: string;
    feedbackUrl?: string;
  };
}

// Feature flag definitions
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // AI Features
  ai_code_assistant: {
    key: 'ai_code_assistant',
    name: 'AI Code Assistant',
    description: 'AI-powered code suggestions and explanations',
    state: 'beta',
    enabledForRoles: ['instructor', 'admin'],
    betaStartDate: '2024-01-15',
    metadata: {
      feedbackUrl: '/feedback/ai-assistant',
      documentationUrl: '/docs/ai-assistant'
    }
  },
  
  ai_tutor_chat: {
    key: 'ai_tutor_chat',
    name: 'AI Tutor Chat',
    description: 'Real-time chat with AI tutor for personalized help',
    state: 'development',
    progressPercentage: 75,
    metadata: {
      estimatedCompletion: '2024-03-01',
      contactEmail: 'ai-team@soliditylearning.com'
    }
  },

  // Collaboration Features
  real_time_collaboration: {
    key: 'real_time_collaboration',
    name: 'Real-time Collaboration',
    description: 'Collaborative code editing with multiple users',
    state: 'beta',
    enabledForRoles: ['instructor', 'admin'],
    dependencies: ['websocket_infrastructure'],
    metadata: {
      feedbackUrl: '/feedback/collaboration'
    }
  },

  video_calls: {
    key: 'video_calls',
    name: 'Video Calls',
    description: 'Integrated video calls for pair programming',
    state: 'coming_soon',
    releaseDate: '2024-04-01',
    dependencies: ['real_time_collaboration'],
    metadata: {
      estimatedCompletion: '2024-04-01'
    }
  },

  // Advanced Learning Features
  adaptive_learning: {
    key: 'adaptive_learning',
    name: 'Adaptive Learning Path',
    description: 'Personalized learning paths based on progress and preferences',
    state: 'development',
    progressPercentage: 45,
    metadata: {
      estimatedCompletion: '2024-05-01'
    }
  },

  vr_learning: {
    key: 'vr_learning',
    name: 'VR Learning Environment',
    description: 'Virtual reality environment for immersive learning',
    state: 'coming_soon',
    releaseDate: '2024-12-01',
    metadata: {
      estimatedCompletion: '2024-12-01'
    }
  },

  // Blockchain Integration
  testnet_deployment: {
    key: 'testnet_deployment',
    name: 'Testnet Deployment',
    description: 'Deploy contracts directly to testnets from the platform',
    state: 'beta',
    enabledForRoles: ['instructor', 'admin'],
    metadata: {
      feedbackUrl: '/feedback/testnet-deployment',
      documentationUrl: '/docs/testnet-deployment'
    }
  },

  mainnet_deployment: {
    key: 'mainnet_deployment',
    name: 'Mainnet Deployment',
    description: 'Deploy contracts to Ethereum mainnet (advanced users)',
    state: 'coming_soon',
    releaseDate: '2024-06-01',
    enabledForRoles: ['admin'],
    dependencies: ['testnet_deployment'],
    metadata: {
      estimatedCompletion: '2024-06-01'
    }
  },

  // Infrastructure
  websocket_infrastructure: {
    key: 'websocket_infrastructure',
    name: 'WebSocket Infrastructure',
    description: 'Real-time communication infrastructure',
    state: 'enabled',
    enabledForRoles: ['student', 'instructor', 'admin']
  },

  // Analytics & Monitoring
  advanced_analytics: {
    key: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Detailed learning analytics and insights',
    state: 'beta',
    enabledForRoles: ['instructor', 'admin'],
    metadata: {
      feedbackUrl: '/feedback/analytics'
    }
  },

  // Mobile Features
  mobile_app: {
    key: 'mobile_app',
    name: 'Mobile App',
    description: 'Native mobile application for iOS and Android',
    state: 'development',
    progressPercentage: 30,
    metadata: {
      estimatedCompletion: '2024-08-01'
    }
  },

  // Gamification
  nft_certificates: {
    key: 'nft_certificates',
    name: 'NFT Certificates',
    description: 'Blockchain-based course completion certificates',
    state: 'coming_soon',
    releaseDate: '2024-07-01',
    dependencies: ['testnet_deployment'],
    metadata: {
      estimatedCompletion: '2024-07-01'
    }
  }
};

/**
 * Check if a feature is enabled for a specific user
 */
export function isFeatureEnabled(
  featureKey: string,
  userRole?: UserRole,
  userId?: string
): boolean {
  const feature = FEATURE_FLAGS[featureKey];
  
  if (!feature) {
    console.warn(`Feature flag not found: ${featureKey}`);
    return false;
  }

  // Feature is disabled
  if (feature.state === 'disabled') {
    return false;
  }

  // Feature is fully enabled
  if (feature.state === 'enabled') {
    return true;
  }

  // Check role-based access
  if (feature.enabledForRoles && userRole) {
    if (!feature.enabledForRoles.includes(userRole)) {
      return false;
    }
  }

  // Check user-specific access
  if (feature.enabledForUsers && userId) {
    if (!feature.enabledForUsers.includes(userId)) {
      return false;
    }
  }

  // For beta and development features, check if user has access
  if (feature.state === 'beta' || feature.state === 'development') {
    // If no specific roles/users defined, allow access
    if (!feature.enabledForRoles && !feature.enabledForUsers) {
      return true;
    }
    
    // Check if user meets role requirements
    if (feature.enabledForRoles && userRole && feature.enabledForRoles.includes(userRole)) {
      return true;
    }
    
    // Check if user is specifically enabled
    if (feature.enabledForUsers && userId && feature.enabledForUsers.includes(userId)) {
      return true;
    }
    
    return false;
  }

  // Coming soon features are not enabled
  if (feature.state === 'coming_soon') {
    return false;
  }

  return false;
}

/**
 * Get feature information including state and metadata
 */
export function getFeatureInfo(featureKey: string): FeatureFlag | null {
  return FEATURE_FLAGS[featureKey] || null;
}

/**
 * Get all features for a specific user
 */
export function getUserFeatures(userRole?: UserRole, userId?: string): Record<string, boolean> {
  const features: Record<string, boolean> = {};
  
  Object.keys(FEATURE_FLAGS).forEach(key => {
    features[key] = isFeatureEnabled(key, userRole, userId);
  });
  
  return features;
}

/**
 * Get features by state
 */
export function getFeaturesByState(state: FeatureState): FeatureFlag[] {
  return Object.values(FEATURE_FLAGS).filter(feature => feature.state === state);
}

/**
 * Check if feature dependencies are met
 */
export function areDependenciesMet(
  featureKey: string,
  userRole?: UserRole,
  userId?: string
): boolean {
  const feature = FEATURE_FLAGS[featureKey];
  
  if (!feature || !feature.dependencies) {
    return true;
  }
  
  return feature.dependencies.every(depKey => 
    isFeatureEnabled(depKey, userRole, userId)
  );
}

/**
 * Get feature access reason (for UI feedback)
 */
export function getFeatureAccessReason(
  featureKey: string,
  userRole?: UserRole,
  userId?: string
): {
  hasAccess: boolean;
  reason: string;
  action?: string;
} {
  const feature = FEATURE_FLAGS[featureKey];
  
  if (!feature) {
    return {
      hasAccess: false,
      reason: 'Feature not found'
    };
  }

  if (feature.state === 'disabled') {
    return {
      hasAccess: false,
      reason: 'This feature is currently disabled'
    };
  }

  if (feature.state === 'coming_soon') {
    const releaseDate = feature.releaseDate ? new Date(feature.releaseDate).toLocaleDateString() : 'soon';
    return {
      hasAccess: false,
      reason: `This feature is coming ${releaseDate}`,
      action: 'Stay tuned for updates!'
    };
  }

  if (feature.state === 'development') {
    const progress = feature.progressPercentage || 0;
    const completion = feature.metadata?.estimatedCompletion 
      ? new Date(feature.metadata.estimatedCompletion).toLocaleDateString()
      : 'soon';
    
    return {
      hasAccess: false,
      reason: `This feature is in development (${progress}% complete)`,
      action: `Expected completion: ${completion}`
    };
  }

  if (!areDependenciesMet(featureKey, userRole, userId)) {
    return {
      hasAccess: false,
      reason: 'This feature requires other features to be enabled first'
    };
  }

  if (feature.state === 'beta') {
    if (isFeatureEnabled(featureKey, userRole, userId)) {
      return {
        hasAccess: true,
        reason: 'You have access to this beta feature',
        action: feature.metadata?.feedbackUrl ? 'Share your feedback!' : undefined
      };
    } else {
      return {
        hasAccess: false,
        reason: 'This beta feature is available to selected users only',
        action: 'Contact support for access'
      };
    }
  }

  if (feature.state === 'enabled') {
    return {
      hasAccess: true,
      reason: 'This feature is available'
    };
  }

  return {
    hasAccess: false,
    reason: 'Access not available'
  };
}
