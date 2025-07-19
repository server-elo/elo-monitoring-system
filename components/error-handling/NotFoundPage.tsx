'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, BookOpen, ArrowLeft, AlertTriangle, Clock, TrendingUp, Users, ChevronRight, MapPin, RefreshCw, Compass, Target } from 'lucide-react';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { SmartSearch } from '@/components/ui/SmartSearch';
import { getContextualSuggestions } from '@/lib/utils/redirects';
import { cn } from '@/lib/utils';

interface PopularCourse {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  students: number;
  href: string;
}

interface RecentLesson {
  id: string;
  title: string;
  course: string;
  progress: number;
  href: string;
}

const popularCourses: PopularCourse[] = [
  {
    id: '1',
    title: 'Solidity Fundamentals',
    description: 'Learn the basics of Solidity programming and smart contract development',
    level: 'beginner',
    duration: '4 hours',
    students: 1250,
    href: '/courses/solidity-fundamentals'
  },
  {
    id: '2',
    title: 'Advanced Smart Contracts',
    description: 'Master complex patterns and security best practices',
    level: 'advanced',
    duration: '8 hours',
    students: 890,
    href: '/courses/advanced-smart-contracts'
  },
  {
    id: '3',
    title: 'DeFi Development',
    description: 'Build decentralized finance applications with Solidity',
    level: 'intermediate',
    duration: '6 hours',
    students: 650,
    href: '/courses/defi-development'
  }
];

const recentLessons: RecentLesson[] = [
  {
    id: '1',
    title: 'Variables and Data Types',
    course: 'Solidity Fundamentals',
    progress: 75,
    href: '/courses/solidity-fundamentals/lessons/variables'
  },
  {
    id: '2',
    title: 'Function Modifiers',
    course: 'Advanced Smart Contracts',
    progress: 45,
    href: '/courses/advanced-smart-contracts/lessons/modifiers'
  }
];

export function NotFoundPage() {
  const router = useRouter();
  const pathname = usePathname();
  // Search functionality moved to navigation bar
  // const [searchQuery, setSearchQuery] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [suggestedRedirects, setSuggestedRedirects] = useState<string[]>([]);

  useEffect(() => {
    // Generate breadcrumbs from pathname
    const pathSegments = pathname.split('/').filter(Boolean);
    setBreadcrumbs(pathSegments);

    // Generate intelligent redirect suggestions
    const suggestions = generateRedirectSuggestions(pathname);
    setSuggestedRedirects(suggestions);

    // Track 404 error
    trackNotFoundError(pathname);
  }, [pathname]);

  const generateRedirectSuggestions = (path: string): string[] => {
    const suggestions: string[] = [];
    
    // Common URL pattern fixes
    if (path.includes('/course/')) {
      suggestions.push(path.replace('/course/', '/courses/'));
    }
    if (path.includes('/lesson/')) {
      suggestions.push(path.replace('/lesson/', '/lessons/'));
    }
    if (path.includes('/user/')) {
      suggestions.push(path.replace('/user/', '/profile/'));
    }
    
    // Remove trailing slashes
    if (path.endsWith('/') && path.length > 1) {
      suggestions.push(path.slice(0, -1));
    }
    
    // Add leading slash if missing
    if (!path.startsWith('/')) {
      suggestions.push('/' + path);
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  };

  const trackNotFoundError = (path: string) => {
    // Track 404 errors for analytics
    if (typeof window !== 'undefined') {
      // Send to analytics service
      console.log('404 Error tracked:', { path, timestamp: new Date().toISOString() });
      
      // You can integrate with your analytics service here
      // analytics.track('404_error', { path, referrer: document.referrer });
    }
  };

  // Search handling moved to navigation bar
  // const handleSearch = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (searchQuery.trim()) {
  //     router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  //   }
  // };

  const handleReportBrokenLink = () => {
    // Open feedback form or email
    const subject = encodeURIComponent(`Broken Link Report: ${pathname}`);
    const body = encodeURIComponent(`I found a broken link at: ${window.location.href}\n\nAdditional details:`);
    window.open(`mailto:support@soliditylearning.com?subject=${subject}&body=${body}`);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-400 bg-green-400/10';
      case 'intermediate': return 'text-yellow-400 bg-yellow-400/10';
      case 'advanced': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Breadcrumbs */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
            <Home className="w-4 h-4" />
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            {breadcrumbs.map((segment, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="w-4 h-4" />
                <span className="capitalize">{segment.replace(/-/g, ' ')}</span>
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        {/* Main 404 Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="relative mb-8">
            <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
              404
            </h1>
            <div className="absolute inset-0 text-8xl font-bold text-purple-400/20 blur-sm">
              404
            </div>
          </div>
          
          <h2 className="text-3xl font-semibold text-white mb-4">
            Oops! Page Not Found
          </h2>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            The page you're looking for seems to have vanished into the blockchain. 
            Don't worry, we'll help you find your way back to learning Solidity!
          </p>

          {/* Smart Search */}
          <div className="max-w-md mx-auto mb-8">
            <SmartSearch
              placeholder="Search courses, lessons, or topics..."
              autoFocus
              showRecentSearches
              showPopularSuggestions
            />
          </div>
        </motion.div>

        {/* Suggested Redirects */}
        {suggestedRedirects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <GlassContainer intensity="medium" className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Did you mean?</h3>
              </div>
              <div className="space-y-2">
                {suggestedRedirects.map((suggestion, index) => (
                  <Link
                    key={index}
                    href={suggestion}
                    className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-purple-300 hover:text-purple-200"
                  >
                    {suggestion}
                  </Link>
                ))}
              </div>
            </GlassContainer>
          </motion.div>
        )}

        {/* Guided Recovery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <GlassContainer intensity="medium" className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Compass className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-semibold text-white">Let's Get You Back on Track</h3>
            </div>

            <p className="text-gray-300 mb-6">
              Based on where you were trying to go, here are some suggestions to help you find what you're looking for:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/" className="group">
                <div className="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-300 border border-white/10">
                  <div className="flex items-center space-x-3 mb-2">
                    <Home className="w-5 h-5 text-blue-400" />
                    <h4 className="text-white font-medium">Dashboard</h4>
                  </div>
                  <p className="text-gray-400 text-sm">Return to your learning dashboard</p>
                </div>
              </Link>

              <Link href="/courses" className="group">
                <div className="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-300 border border-white/10">
                  <div className="flex items-center space-x-3 mb-2">
                    <BookOpen className="w-5 h-5 text-green-400" />
                    <h4 className="text-white font-medium">Courses</h4>
                  </div>
                  <p className="text-gray-400 text-sm">Browse our course catalog</p>
                </div>
              </Link>

              <button onClick={handleReportBrokenLink} className="group text-left">
                <div className="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-300 border border-white/10">
                  <div className="flex items-center space-x-3 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <h4 className="text-white font-medium">Report Issue</h4>
                  </div>
                  <p className="text-gray-400 text-sm">Help us fix this broken link</p>
                </div>
              </button>
            </div>

            {/* Contextual Suggestions */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center space-x-2 mb-3">
                <Target className="w-5 h-5 text-orange-400" />
                <h4 className="text-white font-medium">Based on Your Path</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {getContextualSuggestions(pathname).map((suggestion, index) => (
                  <Link
                    key={index}
                    href={suggestion}
                    className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                  >
                    <span className="text-purple-300">{suggestion.replace('/', '').replace('-', ' ') || 'Home'}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          </GlassContainer>
        </motion.div>

        {/* Popular Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h3 className="text-2xl font-semibold text-white mb-6 flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            <span>Popular Courses</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {popularCourses.map((course) => (
              <Link key={course.id} href={course.href} className="group">
                <GlassContainer intensity="medium" className="p-6 h-full hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                      {course.title}
                    </h4>
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getLevelColor(course.level))}>
                      {course.level}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-4">{course.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{course.students.toLocaleString()}</span>
                    </div>
                  </div>
                </GlassContainer>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Lessons */}
        {recentLessons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-12"
          >
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center space-x-2">
              <Clock className="w-6 h-6 text-green-400" />
              <span>Continue Learning</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentLessons.map((lesson) => (
                <Link key={lesson.id} href={lesson.href} className="group">
                  <GlassContainer intensity="medium" className="p-6 hover:bg-white/10 transition-all duration-300">
                    <h4 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors mb-2">
                      {lesson.title}
                    </h4>
                    <p className="text-gray-400 text-sm mb-4">{lesson.course}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${lesson.progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-gray-400">{lesson.progress}%</span>
                    </div>
                  </GlassContainer>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Page</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
