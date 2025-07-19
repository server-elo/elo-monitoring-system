'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Search, RefreshCw, AlertCircle, Clock, Users, Star, Play, FileText, Settings } from 'lucide-react';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className
}: EmptyStateProps) {
  const renderActionButton = () => {
    if (!action) return null;
    
    const buttonClasses = cn(
      'inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200',
      action.variant === 'secondary'
        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
    );
    
    if (action.href) {
      return (
        <Link href={action.href} className={buttonClasses}>
          {action.label}
        </Link>
      );
    }
    
    return (
      <button onClick={action.onClick} className={buttonClasses}>
        {action.label}
      </button>
    );
  };
  
  const renderSecondaryButton = () => {
    if (!secondaryAction) return null;
    
    const buttonClasses = "text-purple-400 hover:text-purple-300 transition-colors text-sm";
    
    if (secondaryAction.href) {
      return (
        <Link href={secondaryAction.href} className={buttonClasses}>
          {secondaryAction.label}
        </Link>
      );
    }
    
    return (
      <button onClick={secondaryAction.onClick} className={buttonClasses}>
        {secondaryAction.label}
      </button>
    );
  };

  return (
    <GlassContainer intensity="medium" className={cn('p-12 text-center', className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        {/* Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
            {icon || <BookOpen className="w-8 h-8 text-purple-400" />}
          </div>
        </div>

        {/* Content */}
        <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
        <p className="text-gray-300 mb-8 leading-relaxed">{description}</p>

        {/* Actions */}
        <div className="space-y-3">
          {renderActionButton()}
          {secondaryAction && (
            <div>
              {renderSecondaryButton()}
            </div>
          )}
        </div>
      </motion.div>
    </GlassContainer>
  );
}

// Predefined Empty States

export function EmptyCoursesState() {
  return (
    <EmptyState
      icon={<BookOpen className="w-8 h-8 text-purple-400" />}
      title="No Courses Available"
      description="It looks like there are no courses to display right now. Start your Solidity learning journey by exploring our course catalog."
      action={{
        label: "Browse Course Catalog",
        href: "/courses"
      }}
      secondaryAction={{
        label: "View Learning Paths",
        href: "/learning-paths"
      }}
    />
  );
}

export function EmptySearchState({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={<Search className="w-8 h-8 text-purple-400" />}
      title="No Results Found"
      description={
        query 
          ? `We couldn't find any results for "${query}". Try adjusting your search terms or browse our popular courses.`
          : "No search results to display. Try entering a search term to find courses, lessons, or topics."
      }
      action={{
        label: "Browse All Courses",
        href: "/courses"
      }}
      secondaryAction={{
        label: "Clear Search",
        onClick: () => window.location.href = '/search'
      }}
    />
  );
}

export function EmptyLessonsState() {
  return (
    <EmptyState
      icon={<Play className="w-8 h-8 text-purple-400" />}
      title="No Lessons Available"
      description="This course doesn't have any lessons yet, or they're still being prepared. Check back soon for new content!"
      action={{
        label: "Explore Other Courses",
        href: "/courses"
      }}
      secondaryAction={{
        label: "View Course Details",
        onClick: () => window.history.back()
      }}
    />
  );
}

export function EmptyProgressState() {
  return (
    <EmptyState
      icon={<Clock className="w-8 h-8 text-purple-400" />}
      title="No Progress Yet"
      description="You haven't started any courses yet. Begin your Solidity learning journey today and track your progress here."
      action={{
        label: "Start Learning",
        href: "/courses"
      }}
      secondaryAction={{
        label: "View Learning Paths",
        href: "/learning-paths"
      }}
    />
  );
}

export function EmptyNotificationsState() {
  return (
    <EmptyState
      icon={<AlertCircle className="w-8 h-8 text-purple-400" />}
      title="No Notifications"
      description="You're all caught up! You'll see notifications here when there are updates about your courses or achievements."
      action={{
        label: "Notification Settings",
        href: "/settings",
        variant: "secondary"
      }}
    />
  );
}

export function EmptyAchievementsState() {
  return (
    <EmptyState
      icon={<Star className="w-8 h-8 text-purple-400" />}
      title="No Achievements Yet"
      description="Complete lessons and courses to earn achievements and badges. Start learning to unlock your first achievement!"
      action={{
        label: "Start Learning",
        href: "/courses"
      }}
      secondaryAction={{
        label: "View All Achievements",
        href: "/achievements"
      }}
    />
  );
}

export function EmptyPlaygroundState() {
  return (
    <EmptyState
      icon={<FileText className="w-8 h-8 text-purple-400" />}
      title="No Saved Projects"
      description="You haven't saved any projects in the playground yet. Create your first Solidity contract and save it here."
      action={{
        label: "Open Playground",
        href: "/playground"
      }}
      secondaryAction={{
        label: "View Examples",
        href: "/playground/examples"
      }}
    />
  );
}

// Error States

export function ErrorState({
  title = "Something went wrong",
  description = "We encountered an error while loading this content. Please try again.",
  onRetry,
  showRetry = true
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}) {
  return (
    <EmptyState
      icon={<AlertCircle className="w-8 h-8 text-red-400" />}
      title={title}
      description={description}
      action={showRetry ? {
        label: "Try Again",
        onClick: onRetry || (() => window.location.reload()),
        variant: "secondary"
      } : undefined}
      secondaryAction={{
        label: "Go Home",
        href: "/"
      }}
    />
  );
}

export function OfflineState() {
  // DISABLED: Never show offline state
  return null;
}

export function LoadingErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<RefreshCw className="w-8 h-8 text-yellow-400" />}
      title="Loading Failed"
      description="We're having trouble loading this content. This might be due to a slow connection or temporary server issue."
      action={{
        label: "Retry",
        onClick: onRetry || (() => window.location.reload())
      }}
      secondaryAction={{
        label: "Go Back",
        onClick: () => window.history.back()
      }}
    />
  );
}

export function UnauthorizedState() {
  return (
    <EmptyState
      icon={<Users className="w-8 h-8 text-red-400" />}
      title="Access Restricted"
      description="You don't have permission to view this content. Please log in or contact support if you believe this is an error."
      action={{
        label: "Sign In",
        href: "/auth/login"
      }}
      secondaryAction={{
        label: "Contact Support",
        href: "/support"
      }}
    />
  );
}

export function MaintenanceState() {
  return (
    <EmptyState
      icon={<Settings className="w-8 h-8 text-blue-400" />}
      title="Under Maintenance"
      description="This feature is temporarily unavailable while we perform maintenance. We'll be back shortly!"
      action={{
        label: "Check Status",
        href: "/status",
        variant: "secondary"
      }}
      secondaryAction={{
        label: "Go Home",
        href: "/"
      }}
    />
  );
}
