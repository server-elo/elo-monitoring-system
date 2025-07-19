'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Filter, 
  Search, 
  Grid, 
  List,
  ChevronDown
} from 'lucide-react';
import { Module, Lesson, CurriculumFilter, UserCurriculumProgress } from '@/lib/curriculum/types';
import { ModuleCard } from './ModuleCard';
import { LessonCard } from './LessonCard';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { ProgressBar } from '@/components/xp/ProgressBar';
import { cn } from '@/lib/utils';

interface CurriculumDashboardProps {
  modules: Module[];
  userProgress: UserCurriculumProgress;
  onModuleClick: (module: Module) => void;
  onLessonClick: (lesson: Lesson) => void;
  onStartModule: (moduleId: string) => void;
  onStartLesson: (lessonId: string) => void;
  checkPrerequisites: (itemId: string) => boolean;
  getUnmetPrerequisites: (itemId: string) => string[];
  className?: string;
}

export function CurriculumDashboard({
  modules,
  userProgress,
  onModuleClick,
  onLessonClick,
  onStartModule,
  onStartLesson,
  checkPrerequisites,
  getUnmetPrerequisites,
  className
}: CurriculumDashboardProps) {
  const [filter, setFilter] = useState<CurriculumFilter>({
    sortBy: 'order',
    sortOrder: 'asc',
    showOptional: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'modules' | 'lessons'>('modules');
  const [showFilters, setShowFilters] = useState(false);
  const [_expandedModule, _setExpandedModule] = useState<string | null>(null);

  // Calculate overall statistics
  const stats = useMemo(() => {
    const totalModules = modules.length;
    const completedModules = Object.values(userProgress.modules).filter(m => m.status === 'completed').length;
    const inProgressModules = Object.values(userProgress.modules).filter(m => m.status === 'in_progress').length;
    
    const allLessons = modules.flatMap(m => m.lessons);
    const totalLessons = allLessons.length;
    const completedLessons = Object.values(userProgress.lessons).filter(l => l.status === 'completed').length;
    
    return {
      totalModules,
      completedModules,
      inProgressModules,
      totalLessons,
      completedLessons,
      overallProgress: userProgress.overallProgress || 0,
      totalXP: userProgress.totalXPEarned || 0,
      totalTime: userProgress.totalTimeSpent || 0
    };
  }, [modules, userProgress]);

  // Filter and sort modules
  const filteredModules = useMemo(() => {
    const filtered = modules.filter(module => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!module.title.toLowerCase().includes(searchLower) &&
            !module.description.toLowerCase().includes(searchLower) &&
            !module.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
          return false;
        }
      }

      // Status filter
      if (filter.status && filter.status.length > 0) {
        const moduleProgress = userProgress.modules[module.id];
        const status = moduleProgress?.status || 'available';
        if (!filter.status.includes(status)) {
          return false;
        }
      }

      // Difficulty filter
      if (filter.difficulty && filter.difficulty.length > 0) {
        if (!filter.difficulty.includes(module.difficulty)) {
          return false;
        }
      }

      // Category filter
      if (filter.category && filter.category.length > 0) {
        if (!filter.category.includes(module.category)) {
          return false;
        }
      }

      return true;
    });

    // Sort modules
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filter.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'difficulty':
          const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
          comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
          break;
        case 'duration':
          comparison = a.estimatedDuration - b.estimatedDuration;
          break;
        case 'progress':
          const progressA = userProgress.modules[a.id]?.progress || 0;
          const progressB = userProgress.modules[b.id]?.progress || 0;
          comparison = progressA - progressB;
          break;
        case 'order':
        default:
          comparison = a.order - b.order;
          break;
      }

      return filter.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [modules, userProgress, filter, searchTerm]);

  // Get all lessons for lesson view
  const allLessons = useMemo(() => {
    return filteredModules.flatMap(module => 
      module.lessons.map(lesson => ({ ...lesson, moduleId: module.id, moduleTitle: module.title }))
    );
  }, [filteredModules]);

  const toggleFilter = (type: keyof CurriculumFilter, value: any) => {
    setFilter(prev => {
      const currentValues = prev[type] as any[] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return { ...prev, [type]: newValues.length > 0 ? newValues : undefined };
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Stats */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Learning Dashboard</h1>
          <p className="text-gray-300">Track your progress through the Solidity curriculum</p>
        </div>

        {/* Progress Overview */}
        <GlassCard className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">{stats.completedModules}/{stats.totalModules}</div>
              <div className="text-sm text-gray-400">Modules Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">{stats.completedLessons}/{stats.totalLessons}</div>
              <div className="text-sm text-gray-400">Lessons Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">{stats.totalXP.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total XP Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">{Math.round(stats.totalTime / 60)}h</div>
              <div className="text-sm text-gray-400">Time Spent</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-300">Overall Progress</span>
              <span className="text-sm text-gray-300 font-mono">{Math.round(stats.overallProgress)}%</span>
            </div>
            <ProgressBar
              progress={stats.overallProgress}
              color="blue"
              size="md"
              animated={true}
              glowEffect={true}
            />
          </div>
        </GlassCard>
      </div>

      {/* Controls */}
      <GlassCard className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search modules and lessons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <EnhancedButton
              onClick={() => setViewMode('modules')}
              variant={viewMode === 'modules' ? 'default' : 'ghost'}
              size="sm"
              touchTarget
            >
              <Grid className="w-4 h-4 mr-2" />
              Modules
            </EnhancedButton>
            <EnhancedButton
              onClick={() => setViewMode('lessons')}
              variant={viewMode === 'lessons' ? 'default' : 'ghost'}
              size="sm"
              touchTarget
            >
              <List className="w-4 h-4 mr-2" />
              Lessons
            </EnhancedButton>
          </div>

          {/* Filter Toggle */}
          <EnhancedButton
            onClick={() => setShowFilters(!showFilters)}
            variant="ghost"
            className="text-white"
            touchTarget
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            <ChevronDown className={cn(
              'w-4 h-4 ml-2 transition-transform duration-200',
              showFilters && 'rotate-180'
            )} />
          </EnhancedButton>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-white/10 mt-4 space-y-4">
                {/* Status Filters */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {['available', 'in_progress', 'completed', 'locked'].map(status => (
                      <EnhancedButton
                        key={status}
                        onClick={() => toggleFilter('status', status)}
                        variant={filter.status?.includes(status as any) ? 'default' : 'ghost'}
                        size="sm"
                        className="text-xs"
                        touchTarget
                      >
                        {status.replace('_', ' ')}
                      </EnhancedButton>
                    ))}
                  </div>
                </div>

                {/* Difficulty Filters */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Difficulty</h4>
                  <div className="flex flex-wrap gap-2">
                    {['beginner', 'intermediate', 'advanced', 'expert'].map(difficulty => (
                      <EnhancedButton
                        key={difficulty}
                        onClick={() => toggleFilter('difficulty', difficulty)}
                        variant={filter.difficulty?.includes(difficulty as any) ? 'default' : 'ghost'}
                        size="sm"
                        className="text-xs"
                        touchTarget
                      >
                        {difficulty}
                      </EnhancedButton>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Sort By</h4>
                  <div className="flex items-center space-x-2">
                    <select
                      value={filter.sortBy}
                      onChange={(e) => setFilter(prev => ({ ...prev, sortBy: e.target.value as any }))}
                      className="bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="order">Order</option>
                      <option value="title">Title</option>
                      <option value="difficulty">Difficulty</option>
                      <option value="duration">Duration</option>
                      <option value="progress">Progress</option>
                    </select>
                    
                    <EnhancedButton
                      onClick={() => setFilter(prev => ({ 
                        ...prev, 
                        sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                      }))}
                      variant="ghost"
                      size="sm"
                      className="p-2"
                      touchTarget
                    >
                      {filter.sortOrder === 'asc' ? '↑' : '↓'}
                    </EnhancedButton>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Content Grid */}
      <div className="space-y-6">
        {viewMode === 'modules' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredModules.map((module, index) => (
                <motion.div
                  key={module.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ModuleCard
                    module={module}
                    progress={userProgress.modules[module.id] || {
                      moduleId: module.id,
                      status: 'available',
                      progress: 0,
                      lessonsCompleted: 0,
                      totalLessons: module.lessons.length,
                      totalXPEarned: 0,
                      timeSpent: 0
                    }}
                    isUnlocked={checkPrerequisites(module.id)}
                    unmetPrerequisites={getUnmetPrerequisites(module.id)}
                    onClick={() => onModuleClick(module)}
                    onStart={() => onStartModule(module.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {allLessons.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                >
                  <LessonCard
                    lesson={lesson}
                    progress={userProgress.lessons[lesson.id] || {
                      lessonId: lesson.id,
                      status: 'available',
                      progress: 0,
                      timeSpent: 0,
                      attempts: 0,
                      xpEarned: 0
                    }}
                    isUnlocked={checkPrerequisites(lesson.id)}
                    unmetPrerequisites={getUnmetPrerequisites(lesson.id)}
                    onClick={() => onLessonClick(lesson)}
                    onStart={() => onStartLesson(lesson.id)}
                    compact={true}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* No Results */}
      {(viewMode === 'modules' ? filteredModules : allLessons).length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">No content found</h3>
          <p className="text-gray-400 mb-4">Try adjusting your search or filters</p>
          <EnhancedButton
            onClick={() => {
              setFilter({ sortBy: 'order', sortOrder: 'asc', showOptional: true });
              setSearchTerm('');
            }}
            variant="ghost"
            className="text-blue-400 hover:text-blue-300"
            touchTarget
          >
            Clear Filters
          </EnhancedButton>
        </div>
      )}
    </div>
  );
}
