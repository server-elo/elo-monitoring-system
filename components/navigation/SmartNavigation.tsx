'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, ChevronRight, BookOpen, Code, Users, Trophy, Settings, User, ExternalLink, AlertCircle, CheckCircle, Clock, Zap, Briefcase, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/lib/hooks/useSettings';
import { useAuth } from '@/lib/hooks/useAuth';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { errorTracker } from '@/lib/monitoring/error-tracking';

// Smart back button with context awareness
export function SmartBackButton({ 
  className,
  fallbackUrl = '/',
  showText = true,
  variant = 'default'
}: {
  className?: string;
  fallbackUrl?: string;
  showText?: boolean;
  variant?: 'default' | 'minimal' | 'floating';
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { settings } = useSettings();
  const shouldAnimate = !settings?.accessibility?.reduceMotion;
  
  const [canGoBack, setCanGoBack] = useState(false);
  const [backContext, setBackContext] = useState<string>('');

  useEffect(() => {
    // Check if we can go back in history
    const hasHistory = window.history.length > 1;
    setCanGoBack(hasHistory);
    
    // Determine back context based on current path
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length > 1) {
      const parentPath = pathSegments[pathSegments.length - 2];
      setBackContext(parentPath.charAt(0).toUpperCase() + parentPath.slice(1));
    }
  }, [pathname]);

  const handleBack = useCallback(() => {
    try {
      if (canGoBack) {
        router.back();
      } else {
        router.push(fallbackUrl);
      }
      
      // Track navigation
      errorTracker.addBreadcrumb(
        `Smart back navigation from ${pathname}`,
        'navigation',
        'info',
        { canGoBack, fallbackUrl }
      );
    } catch (error) {
      console.error('Navigation error:', error);
      router.push(fallbackUrl);
    }
  }, [canGoBack, router, fallbackUrl, pathname]);

  const variants = {
    default: 'flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors',
    minimal: 'p-2 text-gray-400 hover:text-white transition-colors',
    floating: 'fixed top-20 left-4 z-40 p-3 bg-black/50 backdrop-blur-md hover:bg-black/70 text-white rounded-full transition-colors'
  };

  return (
    <motion.button
      onClick={handleBack}
      className={cn(variants[variant], className)}
      whileHover={shouldAnimate ? { scale: 1.05 } : {}}
      whileTap={shouldAnimate ? { scale: 0.95 } : {}}
      aria-label={`Go back to ${backContext || 'previous page'}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {showText && variant !== 'minimal' && (
        <span className="text-sm">
          {canGoBack ? `Back to ${backContext}` : 'Home'}
        </span>
      )}
    </motion.button>
  );
}

// Enhanced breadcrumb navigation
export function SmartBreadcrumbs({
  className,
  maxItems = 4,
  showHome = true
}: {
  className?: string;
  maxItems?: number;
  showHome?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useSettings();
  const shouldAnimate = !settings?.accessibility?.reduceMotion;

  const pathSegments = pathname.split('/').filter(Boolean);
  
  const breadcrumbItems = [
    ...(showHome ? [{ label: 'Home', href: '/', icon: Home }] : []),
    ...pathSegments.map((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      
      // Add icons for common routes
      let icon;
      switch (segment) {
        case 'learn': icon = BookOpen; break;
        case 'code': icon = Code; break;
        case 'collaborate': icon = Users; break;
        case 'achievements': icon = Trophy; break;
        case 'jobs': icon = Briefcase; break;
        case 'certificates': icon = Award; break;
        case 'settings': icon = Settings; break;
        case 'profile': icon = User; break;
        default: icon = undefined;
      }
      
      return { label, href, icon };
    })
  ];

  // Truncate if too many items
  const displayItems = breadcrumbItems.length > maxItems 
    ? [
        breadcrumbItems[0],
        { label: '...', href: '', icon: undefined },
        ...breadcrumbItems.slice(-2)
      ]
    : breadcrumbItems;

  return (
    <nav 
      className={cn("flex items-center space-x-2 text-sm", className)}
      aria-label="Breadcrumb navigation"
    >
      {displayItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
          
          {item.href && item.href !== pathname ? (
            <motion.button
              onClick={() => router.push(item.href)}
              className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
              whileHover={shouldAnimate ? { scale: 1.05 } : {}}
              aria-label={`Navigate to ${item.label}`}
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              <span>{item.label}</span>
            </motion.button>
          ) : (
            <span className="flex items-center space-x-1 text-white font-medium">
              {item.icon && <item.icon className="w-4 h-4" />}
              <span>{item.label}</span>
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// Continue learning suggestions
export function ContinueLearning({
  className,
  variant = 'card'
}: {
  className?: string;
  variant?: 'card' | 'banner' | 'inline';
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Array<{
    title: string;
    description: string;
    href: string;
    progress?: number;
    type: 'lesson' | 'course' | 'achievement' | 'collaboration';
    icon: React.ComponentType<{ className?: string }>;
    priority: 'high' | 'medium' | 'low';
  }>>([]);

  useEffect(() => {
    // Mock suggestions - in real app, fetch from API based on user progress
    const mockSuggestions = [
      {
        title: 'Continue: Smart Contracts Basics',
        description: 'You\'re 75% through this lesson',
        href: '/learn/smart-contracts/basics',
        progress: 75,
        type: 'lesson' as const,
        icon: BookOpen,
        priority: 'high' as const
      },
      {
        title: 'Try the Code Lab',
        description: 'Practice what you\'ve learned',
        href: '/code',
        type: 'course' as const,
        icon: Code,
        priority: 'medium' as const
      },
      {
        title: 'Join a Study Group',
        description: '3 active groups in your area',
        href: '/collaborate',
        type: 'collaboration' as const,
        icon: Users,
        priority: 'medium' as const
      }
    ];
    
    setSuggestions(mockSuggestions);
  }, [user]);

  if (suggestions.length === 0) return null;

  const handleSuggestionClick = (suggestion: typeof suggestions[0]) => {
    errorTracker.addBreadcrumb(
      `Continue learning suggestion clicked: ${suggestion.title}`,
      'navigation',
      'info',
      { type: suggestion.type, href: suggestion.href }
    );
    router.push(suggestion.href);
  };

  if (variant === 'banner') {
    const topSuggestion = suggestions[0];
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-4",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <topSuggestion.icon className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-white font-medium">{topSuggestion.title}</h3>
              <p className="text-gray-400 text-sm">{topSuggestion.description}</p>
            </div>
          </div>
          <button
            onClick={() => handleSuggestionClick(topSuggestion)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <span>Continue</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
        
        {topSuggestion.progress && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{topSuggestion.progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="h-2 bg-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${topSuggestion.progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center space-x-4", className)}>
        <span className="text-gray-400 text-sm">Continue:</span>
        {suggestions.slice(0, 2).map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className="flex items-center space-x-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
          >
            <suggestion.icon className="w-4 h-4" />
            <span>{suggestion.title.replace('Continue: ', '')}</span>
          </button>
        ))}
      </div>
    );
  }

  // Card variant
  return (
    <GlassContainer intensity="medium" className={cn("p-6", className)}>
      <div className="flex items-center space-x-2 mb-4">
        <Zap className="w-5 h-5 text-yellow-400" />
        <h3 className="text-white font-semibold">Continue Learning</h3>
      </div>
      
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-3">
              <div className={cn(
                "p-2 rounded-lg",
                suggestion.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                suggestion.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-blue-500/20 text-blue-400'
              )}>
                <suggestion.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-white font-medium text-sm">{suggestion.title}</div>
                <div className="text-gray-400 text-xs">{suggestion.description}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {suggestion.progress && (
                <div className="text-xs text-gray-400">{suggestion.progress}%</div>
              )}
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </div>
          </motion.button>
        ))}
      </div>
    </GlassContainer>
  );
}

// Navigation status indicator
export function NavigationStatus({
  className
}: {
  className?: string;
}) {
  const pathname = usePathname();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('ready');
  const [pageInfo, setPageInfo] = useState<{
    title: string;
    description: string;
    lastVisited?: Date;
  } | null>(null);

  useEffect(() => {
    // Simulate page loading and get page info
    setStatus('loading');
    
    setTimeout(() => {
      // Mock page info - in real app, fetch from API or metadata
      const pathSegments = pathname.split('/').filter(Boolean);
      const currentPage = pathSegments[pathSegments.length - 1] || 'home';
      
      setPageInfo({
        title: currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace(/-/g, ' '),
        description: `You're currently viewing the ${currentPage} page`,
        lastVisited: new Date(Date.now() - Math.random() * 86400000) // Random time in last 24h
      });
      
      setStatus('ready');
    }, 500);
  }, [pathname]);

  const statusIcons = {
    loading: Clock,
    ready: CheckCircle,
    error: AlertCircle
  };

  const statusColors = {
    loading: 'text-yellow-400',
    ready: 'text-green-400',
    error: 'text-red-400'
  };

  const StatusIcon = statusIcons[status];

  return (
    <div className={cn("flex items-center space-x-2 text-sm", className)}>
      <StatusIcon className={cn("w-4 h-4", statusColors[status])} />
      <div>
        <div className="text-white font-medium">
          {pageInfo?.title || 'Loading...'}
        </div>
        {pageInfo?.description && (
          <div className="text-gray-400 text-xs">
            {pageInfo.description}
          </div>
        )}
      </div>
    </div>
  );
}
