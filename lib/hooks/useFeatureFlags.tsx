'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  isFeatureEnabled, 
  getFeatureInfo, 
  getUserFeatures, 
  getFeatureAccessReason,
  UserRole,
  FeatureFlag 
} from '@/lib/features/feature-flags';

interface UseFeatureFlagsReturn {
  isEnabled: (_featureKey: string) => boolean;
  getFeature: (_featureKey: string) => FeatureFlag | null;
  getAccessReason: (_featureKey: string) => ReturnType<typeof getFeatureAccessReason>;
  getAllFeatures: (_) => Record<string, boolean>;
  userRole: UserRole | undefined;
  userId: string | undefined;
  refreshFeatures: (_) => void;
}

interface UseFeatureFlagsOptions {
  userRole?: UserRole;
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function useFeatureFlags(_options: UseFeatureFlagsOptions = {}): UseFeatureFlagsReturn {
  const {
    userRole: initialUserRole,
    userId: initialUserId,
    autoRefresh = false,
    refreshInterval = 300000 // 5 minutes
  } = options;

  const [userRole, setUserRole] = useState<UserRole | undefined>(_initialUserRole);
  const [userId, setUserId] = useState<string | undefined>(_initialUserId);
  const [features, setFeatures] = useState<Record<string, boolean>>({  });

  // Load user info from session/auth context if not provided
  useEffect(() => {
    if (!initialUserRole || !initialUserId) {
      // In a real app, you'd get this from your auth context
      // For now, we'll use localStorage or default values
      const storedRole = localStorage.getItem('userRole') as UserRole;
      const storedUserId = localStorage.getItem('userId');
      
      if (storedRole && !initialUserRole) {
        setUserRole(_storedRole);
      }
      
      if (storedUserId && !initialUserId) {
        setUserId(_storedUserId);
      }
    }
  }, [initialUserRole, initialUserId]);

  // Refresh features when user info changes
  const refreshFeatures = useCallback(() => {
    const allFeatures = getUserFeatures( userRole, userId);
    setFeatures(_allFeatures);
  }, [userRole, userId]);

  // Initial load and refresh when dependencies change
  useEffect(() => {
    refreshFeatures(_);
  }, [refreshFeatures]);

  // Auto-refresh features if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval( refreshFeatures, refreshInterval);
    return (_) => clearInterval(_interval);
  }, [autoRefresh, refreshInterval, refreshFeatures]);

  // Check if a specific feature is enabled
  const isEnabled = useCallback((featureKey: string): boolean => {
    return isFeatureEnabled( featureKey, userRole, userId);
  }, [userRole, userId]);

  // Get feature information
  const getFeature = useCallback((featureKey: string): FeatureFlag | null => {
    return getFeatureInfo(_featureKey);
  }, []);

  // Get access reason for a feature
  const getAccessReason = useCallback((featureKey: string) => {
    return getFeatureAccessReason( featureKey, userRole, userId);
  }, [userRole, userId]);

  // Get all features
  const getAllFeatures = useCallback((): Record<string, boolean> => {
    return features;
  }, [features]);

  return {
    isEnabled,
    getFeature,
    getAccessReason,
    getAllFeatures,
    userRole,
    userId,
    refreshFeatures
  };
}

// Hook for a specific feature
export function useFeature( featureKey: string, options: UseFeatureFlagsOptions = {}) {
  const { isEnabled, getFeature, getAccessReason } = useFeatureFlags(_options);
  
  const enabled = isEnabled(_featureKey);
  const feature = getFeature(_featureKey);
  const accessReason = getAccessReason(_featureKey);

  return {
    enabled,
    feature,
    accessReason,
    hasAccess: accessReason.hasAccess
  };
}

// Hook for multiple features
export function useFeatures( featureKeys: string[], options: UseFeatureFlagsOptions = {}) {
  const { isEnabled, getFeature, getAccessReason } = useFeatureFlags(_options);
  
  const features = featureKeys.reduce( (acc, key) => {
    acc[key] = {
      enabled: isEnabled(_key),
      feature: getFeature(_key),
      accessReason: getAccessReason(_key)
    };
    return acc;
  }, {} as Record<string, {
    enabled: boolean;
    feature: FeatureFlag | null;
    accessReason: ReturnType<typeof getFeatureAccessReason>;
  }>);

  return features;
}

// Hook for beta features specifically
export function useBetaFeatures(_options: UseFeatureFlagsOptions = {}) {
  const { getAllFeatures, getFeature } = useFeatureFlags(_options);
  
  const allFeatures = getAllFeatures(_);
  const betaFeatures = Object.keys(_allFeatures)
    .map(key => getFeature(key))
    .filter((feature): feature is FeatureFlag => 
      feature !== null && feature.state === 'beta'
    )
    .filter(feature => allFeatures[feature.key]);

  return betaFeatures;
}

// Hook for coming soon features
export function useComingSoonFeatures(_options: UseFeatureFlagsOptions = {}) {
  const { getFeature } = useFeatureFlags(_options);
  
  // Get all feature keys from the feature flags
  // Note: Using dynamic import would be better, but for now using a static approach
  const FEATURE_FLAGS = {} as Record<string, any>;
  
  const comingSoonFeatures = Object.keys(_FEATURE_FLAGS)
    .map(key => getFeature(key))
    .filter((feature): feature is FeatureFlag => 
      feature !== null && feature.state === 'coming_soon'
    );

  return comingSoonFeatures;
}

// Hook for development features
export function useDevelopmentFeatures(_options: UseFeatureFlagsOptions = {}) {
  const { getFeature } = useFeatureFlags(_options);
  
  // Get all feature keys from the feature flags
  // Note: Using dynamic import would be better, but for now using a static approach
  const FEATURE_FLAGS = {} as Record<string, any>;
  
  const developmentFeatures = Object.keys(_FEATURE_FLAGS)
    .map(key => getFeature(key))
    .filter((feature): feature is FeatureFlag => 
      feature !== null && feature.state === 'development'
    );

  return developmentFeatures;
}

// Context provider for feature flags (_optional)
import React, { createContext, useContext } from 'react';

interface FeatureFlagsContextType extends UseFeatureFlagsReturn {
  // Additional context-specific properties can be added here
  contextVersion?: string;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(_undefined);

export function FeatureFlagsProvider({ 
  children, 
  userRole, 
  userId 
}: { 
  children: React.ReactNode;
  userRole?: UserRole;
  userId?: string;
}) {
  const featureFlags = useFeatureFlags( { userRole, userId, autoRefresh: true });

  return (
    <FeatureFlagsContext.Provider value={featureFlags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlagsContext(): FeatureFlagsContextType {
  const context = useContext(_FeatureFlagsContext);
  if (_context === undefined) {
    throw new Error('useFeatureFlagsContext must be used within a FeatureFlagsProvider');
  }
  return context;
}

// Utility hook for feature-gated components
export function useFeatureGate( featureKey: string, options: UseFeatureFlagsOptions = {}) {
  const { enabled, accessReason } = useFeature( featureKey, options);
  
  return {
    canAccess: enabled,
    reason: accessReason.reason,
    action: accessReason.action,
    shouldShow: enabled || accessReason.reason !== 'Feature not found'
  };
}
