'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Zap, Lock, Calendar, MessageSquare, ExternalLink, Mail, Info, CheckCircle, Wrench } from 'lucide-react';
import { FeatureFlag, FeatureState, getFeatureAccessReason, UserRole } from '@/lib/features/feature-flags';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { cn } from '@/lib/utils';

interface FeatureStateProps {
  feature: FeatureFlag;
  userRole?: UserRole;
  userId?: string;
  className?: string;
  variant?: 'badge' | 'card' | 'banner' | 'inline';
  showDescription?: boolean;
  showActions?: boolean;
}

export function FeatureStateComponent({
  feature,
  userRole,
  userId,
  className,
  variant = 'badge',
  showDescription = false,
  showActions = false
}: FeatureStateProps) {
  const accessInfo = getFeatureAccessReason(feature.key, userRole, userId);

  if (variant === 'badge') {
    return <FeatureBadge feature={feature} accessInfo={accessInfo} className={className} />;
  }

  if (variant === 'card') {
    return (
      <FeatureCard 
        feature={feature} 
        accessInfo={accessInfo} 
        className={className}
        showDescription={showDescription}
        showActions={showActions}
      />
    );
  }

  if (variant === 'banner') {
    return (
      <FeatureBanner 
        feature={feature} 
        accessInfo={accessInfo} 
        className={className}
        showActions={showActions}
      />
    );
  }

  if (variant === 'inline') {
    return <FeatureInline feature={feature} accessInfo={accessInfo} className={className} />;
  }

  return null;
}

// Feature Badge Component
function FeatureBadge({ 
  feature, 
  accessInfo, 
  className 
}: { 
  feature: FeatureFlag; 
  accessInfo: ReturnType<typeof getFeatureAccessReason>;
  className?: string;
}) {
  const getStateConfig = (state: FeatureState) => {
    switch (state) {
      case 'enabled':
        return {
          icon: CheckCircle,
          label: 'Available',
          className: 'bg-green-500/20 text-green-400 border-green-500/30'
        };
      case 'beta':
        return {
          icon: Zap,
          label: 'Beta',
          className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        };
      case 'development':
        return {
          icon: Wrench,
          label: 'In Development',
          className: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        };
      case 'coming_soon':
        return {
          icon: Clock,
          label: 'Coming Soon',
          className: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
        };
      case 'disabled':
        return {
          icon: Lock,
          label: 'Disabled',
          className: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        };
    }
  };

  const config = getStateConfig(feature.state);
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
      title={accessInfo.reason}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
      {feature.state === 'development' && feature.progressPercentage && (
        <span className="ml-1">({feature.progressPercentage}%)</span>
      )}
    </span>
  );
}

// Feature Card Component
function FeatureCard({
  feature,
  accessInfo,
  className,
  showDescription,
  showActions
}: {
  feature: FeatureFlag;
  accessInfo: ReturnType<typeof getFeatureAccessReason>;
  className?: string;
  showDescription?: boolean;
  showActions?: boolean;
}) {
  return (
    <GlassContainer intensity="medium" className={cn('p-6', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-white">{feature.name}</h3>
            <FeatureBadge feature={feature} accessInfo={accessInfo} />
          </div>
          
          {showDescription && (
            <p className="text-gray-300 text-sm mb-3">{feature.description}</p>
          )}
          
          <p className="text-gray-400 text-sm">{accessInfo.reason}</p>
          {accessInfo.action && (
            <p className="text-purple-400 text-sm mt-1">{accessInfo.action}</p>
          )}
        </div>
      </div>

      {/* Progress Bar for Development Features */}
      {feature.state === 'development' && feature.progressPercentage && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Development Progress</span>
            <span>{feature.progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${feature.progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Release Date for Coming Soon Features */}
      {feature.state === 'coming_soon' && feature.releaseDate && (
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
          <Calendar className="w-4 h-4" />
          <span>Expected: {new Date(feature.releaseDate).toLocaleDateString()}</span>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex flex-wrap gap-2">
          {feature.metadata?.feedbackUrl && accessInfo.hasAccess && (
            <Link
              href={feature.metadata.feedbackUrl}
              className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              <span>Give Feedback</span>
            </Link>
          )}
          
          {feature.metadata?.documentationUrl && (
            <Link
              href={feature.metadata.documentationUrl}
              className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Documentation</span>
            </Link>
          )}
          
          {feature.metadata?.contactEmail && !accessInfo.hasAccess && (
            <a
              href={`mailto:${feature.metadata.contactEmail}?subject=Access Request: ${feature.name}`}
              className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            >
              <Mail className="w-3 h-3" />
              <span>Request Access</span>
            </a>
          )}
        </div>
      )}
    </GlassContainer>
  );
}

// Feature Banner Component
function FeatureBanner({
  feature,
  accessInfo,
  className,
  showActions
}: {
  feature: FeatureFlag;
  accessInfo: ReturnType<typeof getFeatureAccessReason>;
  className?: string;
  showActions?: boolean;
}) {
  const getBannerStyle = (state: FeatureState) => {
    switch (state) {
      case 'beta':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300';
      case 'development':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-300';
      case 'coming_soon':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-300';
      default:
        return 'bg-gray-500/10 border-gray-500/30 text-gray-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'border rounded-lg p-4',
        getBannerStyle(feature.state),
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Info className="w-5 h-5" />
          <div>
            <span className="font-medium">{feature.name}</span>
            <span className="mx-2">•</span>
            <span className="text-sm">{accessInfo.reason}</span>
            {accessInfo.action && (
              <>
                <span className="mx-2">•</span>
                <span className="text-sm font-medium">{accessInfo.action}</span>
              </>
            )}
          </div>
        </div>
        
        {showActions && feature.metadata?.feedbackUrl && accessInfo.hasAccess && (
          <Link
            href={feature.metadata.feedbackUrl}
            className="text-sm underline hover:no-underline"
          >
            Give Feedback
          </Link>
        )}
      </div>
    </motion.div>
  );
}

// Feature Inline Component
function FeatureInline({
  feature,
  accessInfo,
  className
}: {
  feature: FeatureFlag;
  accessInfo: ReturnType<typeof getFeatureAccessReason>;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center space-x-2', className)}>
      <span className="text-gray-300">{feature.name}</span>
      <FeatureBadge feature={feature} accessInfo={accessInfo} />
    </span>
  );
}

// Feature Gate Component - Wraps content that should only show when feature is enabled
export function FeatureGate({
  featureKey,
  userRole,
  userId,
  children,
  fallback,
  showFeatureInfo = false
}: {
  featureKey: string;
  userRole?: UserRole;
  userId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFeatureInfo?: boolean;
}) {
  const accessInfo = getFeatureAccessReason(featureKey, userRole, userId);
  
  if (accessInfo.hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showFeatureInfo) {
    const feature = require('@/lib/features/feature-flags').FEATURE_FLAGS[featureKey];
    if (feature) {
      return (
        <FeatureStateComponent
          feature={feature}
          userRole={userRole}
          userId={userId}
          variant="card"
          showDescription
          showActions
        />
      );
    }
  }

  return null;
}

// Coming Soon Placeholder
export function ComingSoonPlaceholder({
  title,
  description,
  releaseDate,
  className
}: {
  title: string;
  description?: string;
  releaseDate?: string;
  className?: string;
}) {
  return (
    <GlassContainer intensity="medium" className={cn('p-8 text-center', className)}>
      <div className="w-16 h-16 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
        <Clock className="w-8 h-8 text-purple-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      
      {description && (
        <p className="text-gray-300 mb-4">{description}</p>
      )}
      
      {releaseDate && (
        <div className="flex items-center justify-center space-x-2 text-purple-400">
          <Calendar className="w-4 h-4" />
          <span>Coming {new Date(releaseDate).toLocaleDateString()}</span>
        </div>
      )}
    </GlassContainer>
  );
}

// Beta Feature Notice
export function BetaFeatureNotice({
  featureName,
  feedbackUrl,
  className
}: {
  featureName: string;
  feedbackUrl?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6',
        className
      )}
    >
      <div className="flex items-start space-x-3">
        <Zap className="w-5 h-5 text-yellow-400 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-yellow-300 font-medium mb-1">Beta Feature</h4>
          <p className="text-yellow-200 text-sm mb-3">
            You're using the beta version of {featureName}. Some features may be incomplete or change based on feedback.
          </p>
          
          {feedbackUrl && (
            <Link
              href={feedbackUrl}
              className="inline-flex items-center space-x-1 text-yellow-300 hover:text-yellow-200 text-sm underline"
            >
              <MessageSquare className="w-3 h-3" />
              <span>Share your feedback</span>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
