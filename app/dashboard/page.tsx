'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, TrendingUp, Map, Settings, Bell } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLearning } from '@/lib/context/LearningContext';
import { useRealTimeXP } from '@/lib/hooks/useRealTimeXP';
import { CurriculumManager } from '@/lib/curriculum/manager';
import { SOLIDITY_MODULES, LEARNING_PATHS, getModulesForPath, checkPrerequisites as checkPrerequisitesSync } from '@/lib/curriculum/data';
import { UserCurriculumProgress } from '@/lib/curriculum/types';
import { CurriculumDashboard } from '@/components/curriculum/CurriculumDashboard';
import { LearningAnalytics } from '@/components/curriculum/LearningAnalytics';
import { LearningPathVisualization } from '@/components/curriculum/LearningPathVisualization';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { cn } from '@/lib/utils';
import { withPageErrorBoundary } from '@/lib/components/ErrorBoundaryHOCs';

type DashboardView = 'overview' | 'modules' | 'path' | 'analytics';

function DashboardContent() {
  const { user } = useAuth();
  const { state: _learningState } = useLearning();
  const { currentXP, levelInfo, sessionXP: _sessionXP } = useRealTimeXP();
  
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [userProgress, setUserProgress] = useState<UserCurriculumProgress | null>(null);
  const [curriculumManager] = useState(() => CurriculumManager.getInstance());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string>('solidity-beginner');

  // Load user progress
  useEffect(() => {
    const loadProgress = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const progress = await curriculumManager.loadUserProgress(user.id);
        setUserProgress(progress);
        
        // Set current path if not set
        if (!progress.currentPath) {
          progress.currentPath = selectedPath;
          await curriculumManager.saveUserProgress(progress);
        } else {
          setSelectedPath(progress.currentPath);
        }
      } catch (error) {
        console.error('Failed to load user progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [user?.id, curriculumManager, selectedPath]);

  // Event handlers
  const handleModuleClick = (module: any) => {
    console.log('Navigate to module:', module.id);
    // In a real app, this would navigate to the module page
  };

  const handleLessonClick = (lesson: any) => {
    console.log('Navigate to lesson:', lesson.id);
    // In a real app, this would navigate to the lesson page
  };

  const handleStartModule = async (moduleId: string) => {
    if (!user?.id || !userProgress) return;
    
    try {
      // Mark module as started
      const module = SOLIDITY_MODULES.find(m => m.id === moduleId);
      if (module && module.lessons.length > 0) {
        await curriculumManager.startLesson(user.id, module.lessons[0].id);
        
        // Reload progress
        const updatedProgress = await curriculumManager.loadUserProgress(user.id);
        setUserProgress(updatedProgress);
      }
    } catch (error) {
      console.error('Failed to start module:', error);
    }
  };

  const handleStartLesson = async (lessonId: string) => {
    if (!user?.id) return;
    
    try {
      await curriculumManager.startLesson(user.id, lessonId);
      
      // Reload progress
      const updatedProgress = await curriculumManager.loadUserProgress(user.id);
      setUserProgress(updatedProgress);
    } catch (error) {
      console.error('Failed to start lesson:', error);
    }
  };

  const checkPrerequisites = (itemId: string): boolean => {
    if (!user?.id || !userProgress) return false;
    return checkPrerequisitesSync(itemId, userProgress);
  };

  const getUnmetPrerequisites = (_itemId: string): string[] => {
    if (!user?.id || !userProgress) return [];
    // This would be async in real implementation
    return [];
  };

  if (isLoading || !userProgress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading your learning dashboard...</p>
        </div>
      </div>
    );
  }

  const currentPath = LEARNING_PATHS.find(p => p.id === selectedPath);
  const pathModules = currentPath ? getModulesForPath(currentPath.id) : SOLIDITY_MODULES;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Learning Dashboard</h1>
            <p className="text-gray-300">Welcome back, {user?.name}! Continue your Solidity journey.</p>
          </div>

          <div className="flex items-center space-x-4">
            <EnhancedButton
              variant="ghost"
              className="text-gray-400 hover:text-white"
              touchTarget
            >
              <Bell className="w-5 h-5" />
            </EnhancedButton>
            
            <EnhancedButton
              variant="ghost"
              className="text-gray-400 hover:text-white"
              touchTarget
            >
              <Settings className="w-5 h-5" />
            </EnhancedButton>
          </div>
        </div>

        {/* Quick Stats */}
        <GlassCard className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">{levelInfo.currentLevel}</div>
              <div className="text-sm text-gray-400">Current Level</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">{currentXP.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total XP</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {Object.values(userProgress.modules).filter(m => m.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-400">Modules Completed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">{userProgress.streakDays}</div>
              <div className="text-sm text-gray-400">Day Streak</div>
            </div>
          </div>
        </GlassCard>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-black/20 rounded-lg p-1 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: BookOpen },
            { id: 'modules', label: 'Modules', icon: BookOpen },
            { id: 'path', label: 'Learning Path', icon: Map },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <EnhancedButton
                key={tab.id}
                onClick={() => setActiveView(tab.id as DashboardView)}
                variant={activeView === tab.id ? 'default' : 'ghost'}
                className={cn(
                  'flex-1 justify-center',
                  activeView === tab.id ? 'bg-white/10' : 'hover:bg-white/5'
                )}
                touchTarget
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </EnhancedButton>
            );
          })}
        </div>

        {/* Content */}
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeView === 'overview' && (
            <div className="space-y-8">
              {/* Quick Overview */}
              <CurriculumDashboard
                modules={pathModules.slice(0, 6)} // Show first 6 modules
                userProgress={userProgress}
                onModuleClick={handleModuleClick}
                onLessonClick={handleLessonClick}
                onStartModule={handleStartModule}
                onStartLesson={handleStartLesson}
                checkPrerequisites={checkPrerequisites}
                getUnmetPrerequisites={getUnmetPrerequisites}
              />
            </div>
          )}

          {activeView === 'modules' && (
            <CurriculumDashboard
              modules={pathModules}
              userProgress={userProgress}
              onModuleClick={handleModuleClick}
              onLessonClick={handleLessonClick}
              onStartModule={handleStartModule}
              onStartLesson={handleStartLesson}
              checkPrerequisites={checkPrerequisites}
              getUnmetPrerequisites={getUnmetPrerequisites}
            />
          )}

          {activeView === 'path' && currentPath && (
            <div className="space-y-6">
              {/* Path Selector */}
              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Learning Path</h3>
                  <select
                    value={selectedPath}
                    onChange={(e) => setSelectedPath(e.target.value)}
                    className="bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {LEARNING_PATHS.map(path => (
                      <option key={path.id} value={path.id} className="bg-slate-800">
                        {path.title}
                      </option>
                    ))}
                  </select>
                </div>
              </GlassCard>

              <LearningPathVisualization
                learningPath={currentPath}
                modules={pathModules}
                userProgress={userProgress}
                onModuleClick={handleModuleClick}
                checkPrerequisites={checkPrerequisites}
              />
            </div>
          )}

          {activeView === 'analytics' && (
            <LearningAnalytics
              userProgress={userProgress}
              timeframe="weekly"
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

function DashboardPage() {
  return (
    <ProtectedRoute permission={{ requireAuth: true }}>
      <DashboardContent />
    </ProtectedRoute>
  );
}

// Wrap with page-level error boundary for comprehensive error handling
export default withPageErrorBoundary(DashboardPage, {
  name: 'DashboardPage',
  enableRetry: false,
  showErrorDetails: process.env.NODE_ENV === 'development'
});
