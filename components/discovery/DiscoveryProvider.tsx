'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FeatureSpotlight, PLATFORM_FEATURES } from './FeatureSpotlight';

interface DiscoveryContextType {
  // Feature spotlight
  showFeatureSpotlight: boolean;
  setShowFeatureSpotlight: (show: boolean) => void;
  dismissFeature: (featureId: string) => void;
  
  // User behavior tracking
  visitCount: number;
  timeSpent: number;
  usedFeatures: string[];
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  
  // Feature interaction tracking
  trackFeatureUsage: (featureId: string) => void;
  trackTimeSpent: (seconds: number) => void;
  setUserLevel: (level: 'beginner' | 'intermediate' | 'advanced') => void;
  
  // Discovery settings
  discoveryEnabled: boolean;
  setDiscoveryEnabled: (enabled: boolean) => void;
}

const DiscoveryContext = createContext<DiscoveryContextType | undefined>(undefined);

interface DiscoveryProviderProps {
  children: React.ReactNode;
  userRole?: string;
  initialUserLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export const DiscoveryProvider: React.FC<DiscoveryProviderProps> = ({
  children,
  userRole = 'student',
  initialUserLevel = 'beginner',
}) => {
  const [showFeatureSpotlight, setShowFeatureSpotlight] = useState(true);
  const [visitCount, setVisitCount] = useState(1);
  const [timeSpent, setTimeSpent] = useState(0);
  const [usedFeatures, setUsedFeatures] = useState<string[]>([]);
  const [userLevel, setUserLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(initialUserLevel);
  const [discoveryEnabled, setDiscoveryEnabled] = useState(true);
  const [sessionStartTime] = useState(Date.now());

  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('discoveryData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setVisitCount(data.visitCount || 1);
        setTimeSpent(data.timeSpent || 0);
        setUsedFeatures(data.usedFeatures || []);
        setUserLevel(data.userLevel || initialUserLevel);
        setDiscoveryEnabled(data.discoveryEnabled !== false);
      } catch (error) {
        console.error('Failed to load discovery data:', error);
      }
    }

    // Increment visit count
    setVisitCount(prev => {
      const newCount = prev + 1;
      saveDiscoveryData({ visitCount: newCount });
      return newCount;
    });
  }, [initialUserLevel]);

  // Track time spent on platform
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTimeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
      setTimeSpent(prev => {
        const newTimeSpent = prev + currentTimeSpent;
        saveDiscoveryData({ timeSpent: newTimeSpent });
        return newTimeSpent;
      });
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Save discovery data to localStorage
  const saveDiscoveryData = (updates: Partial<{
    visitCount: number;
    timeSpent: number;
    usedFeatures: string[];
    userLevel: 'beginner' | 'intermediate' | 'advanced';
    discoveryEnabled: boolean;
  }>) => {
    const currentData = JSON.parse(localStorage.getItem('discoveryData') || '{}');
    const newData = { ...currentData, ...updates };
    localStorage.setItem('discoveryData', JSON.stringify(newData));
  };

  const trackFeatureUsage = (featureId: string) => {
    setUsedFeatures(prev => {
      if (prev.includes(featureId)) return prev;
      const newFeatures = [...prev, featureId];
      saveDiscoveryData({ usedFeatures: newFeatures });
      return newFeatures;
    });
  };

  const trackTimeSpent = (seconds: number) => {
    setTimeSpent(prev => {
      const newTimeSpent = prev + seconds;
      saveDiscoveryData({ timeSpent: newTimeSpent });
      return newTimeSpent;
    });
  };

  const dismissFeature = (featureId: string) => {
    // This is handled by the FeatureSpotlight component
    // but we can track it here for analytics
    console.log(`Feature dismissed: ${featureId}`);
  };

  const handleUserLevelChange = (level: 'beginner' | 'intermediate' | 'advanced') => {
    setUserLevel(level);
    saveDiscoveryData({ userLevel: level });
  };

  const handleDiscoveryEnabledChange = (enabled: boolean) => {
    setDiscoveryEnabled(enabled);
    saveDiscoveryData({ discoveryEnabled: enabled });
  };

  // Auto-adjust user level based on behavior
  useEffect(() => {
    if (userLevel === 'beginner' && usedFeatures.length > 10 && timeSpent > 3600) {
      handleUserLevelChange('intermediate');
    } else if (userLevel === 'intermediate' && usedFeatures.length > 25 && timeSpent > 7200) {
      handleUserLevelChange('advanced');
    }
  }, [usedFeatures.length, timeSpent, userLevel]);

  const value: DiscoveryContextType = {
    showFeatureSpotlight,
    setShowFeatureSpotlight,
    dismissFeature,
    visitCount,
    timeSpent,
    usedFeatures,
    userLevel,
    trackFeatureUsage,
    trackTimeSpent,
    setUserLevel: handleUserLevelChange,
    discoveryEnabled,
    setDiscoveryEnabled: handleDiscoveryEnabledChange,
  };

  return (
    <DiscoveryContext.Provider value={value}>
      {children}
      
      {/* Feature Spotlight */}
      {discoveryEnabled && showFeatureSpotlight && (
        <FeatureSpotlight
          features={PLATFORM_FEATURES}
          userRole={userRole}
          visitCount={visitCount}
          timeSpent={timeSpent}
          usedFeatures={usedFeatures}
          onFeatureDismissed={dismissFeature}
          onFeatureInteracted={(featureId, action) => {
            console.log(`Feature interaction: ${featureId} - ${action}`);
            trackFeatureUsage(featureId);
          }}
        />
      )}
    </DiscoveryContext.Provider>
  );
};

// Custom hook to use the discovery context
export const useDiscovery = (): DiscoveryContextType => {
  const context = useContext(DiscoveryContext);
  if (context === undefined) {
    throw new Error('useDiscovery must be used within a DiscoveryProvider');
  }
  return context;
};

// Helper component for tracking feature usage
interface FeatureTrackerProps {
  featureId: string;
  children: React.ReactNode;
  trackOnMount?: boolean;
  trackOnClick?: boolean;
  trackOnHover?: boolean;
}

export const FeatureTracker: React.FC<FeatureTrackerProps> = ({
  featureId,
  children,
  trackOnMount = false,
  trackOnClick = false,
  trackOnHover = false,
}) => {
  const { trackFeatureUsage } = useDiscovery();

  useEffect(() => {
    if (trackOnMount) {
      trackFeatureUsage(featureId);
    }
  }, [featureId, trackOnMount, trackFeatureUsage]);

  const handleClick = () => {
    if (trackOnClick) {
      trackFeatureUsage(featureId);
    }
  };

  const handleHover = () => {
    if (trackOnHover) {
      trackFeatureUsage(featureId);
    }
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleHover}
      data-feature-id={featureId}
    >
      {children}
    </div>
  );
};

// Helper component for discovery settings
export const DiscoverySettings: React.FC = () => {
  const { 
    discoveryEnabled, 
    setDiscoveryEnabled, 
    userLevel, 
    setUserLevel,
    visitCount,
    timeSpent,
    usedFeatures 
  } = useDiscovery();

  return (
    <div className="glass border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Discovery Settings</h3>
      
      {/* Discovery Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <label className="text-white font-medium">Feature Discovery</label>
          <p className="text-gray-400 text-sm">Show helpful tips and feature spotlights</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={discoveryEnabled}
            onChange={(e) => setDiscoveryEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* User Level */}
      <div className="mb-4">
        <label className="text-white font-medium mb-2 block">Experience Level</label>
        <select
          value={userLevel}
          onChange={(e) => setUserLevel(e.target.value as any)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-400">{visitCount}</div>
          <div className="text-xs text-gray-400">Visits</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-400">{Math.floor(timeSpent / 60)}</div>
          <div className="text-xs text-gray-400">Minutes</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-400">{usedFeatures.length}</div>
          <div className="text-xs text-gray-400">Features</div>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryProvider;
