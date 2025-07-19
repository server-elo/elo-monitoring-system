'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Clock,
  BookOpen,
  Play,
  Users,
  FileText,
  Zap,
  TrendingUp,
  ArrowRight,
  X
} from 'lucide-react';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  id: string;
  title: string;
  description?: string;
  type: 'course' | 'lesson' | 'topic' | 'user' | 'documentation' | 'recent';
  href: string;
  icon?: React.ReactNode;
  metadata?: {
    progress?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    duration?: string;
    lastAccessed?: string;
  };
}

interface SmartSearchProps {
  placeholder?: string;
  className?: string;
  onSelect?: (suggestion: SearchSuggestion) => void;
  showRecentSearches?: boolean;
  showPopularSuggestions?: boolean;
  maxSuggestions?: number;
  autoFocus?: boolean;
}

// Mock data - in a real app, this would come from your API
const POPULAR_SUGGESTIONS: SearchSuggestion[] = [
  {
    id: '1',
    title: 'Solidity Fundamentals',
    description: 'Learn the basics of Solidity programming',
    type: 'course',
    href: '/courses/solidity-fundamentals',
    icon: <BookOpen className="w-4 h-4" />,
    metadata: { difficulty: 'beginner', duration: '4 hours' }
  },
  {
    id: '2',
    title: 'Smart Contract Security',
    description: 'Best practices for secure smart contracts',
    type: 'topic',
    href: '/topics/security',
    icon: <Zap className="w-4 h-4" />
  },
  {
    id: '3',
    title: 'Variables and Data Types',
    description: 'Understanding Solidity data types',
    type: 'lesson',
    href: '/courses/solidity-fundamentals/lessons/variables',
    icon: <Play className="w-4 h-4" />,
    metadata: { progress: 75 }
  }
];

const RECENT_SEARCHES: SearchSuggestion[] = [
  {
    id: 'r1',
    title: 'mapping in solidity',
    type: 'recent',
    href: '/search?q=mapping+in+solidity',
    icon: <Clock className="w-4 h-4" />,
    metadata: { lastAccessed: '2 hours ago' }
  },
  {
    id: 'r2',
    title: 'function modifiers',
    type: 'recent',
    href: '/search?q=function+modifiers',
    icon: <Clock className="w-4 h-4" />,
    metadata: { lastAccessed: '1 day ago' }
  }
];

export function SmartSearch({
  placeholder = "Search courses, lessons, or topics...",
  className,
  onSelect,
  showRecentSearches = true,
  showPopularSuggestions = true,
  maxSuggestions = 8,
  autoFocus = false
}: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate contextual suggestions based on current page
  const getContextualSuggestions = useCallback(() => {
    const contextual: SearchSuggestion[] = [];
    
    if (pathname.includes('/courses')) {
      contextual.push({
        id: 'ctx1',
        title: 'Browse All Courses',
        description: 'Explore our complete course catalog',
        type: 'course',
        href: '/courses',
        icon: <BookOpen className="w-4 h-4" />
      });
    }
    
    if (pathname.includes('/playground')) {
      contextual.push({
        id: 'ctx2',
        title: 'Solidity Examples',
        description: 'Ready-to-use code examples',
        type: 'documentation',
        href: '/playground/examples',
        icon: <FileText className="w-4 h-4" />
      });
    }
    
    return contextual;
  }, [pathname]);

  // Search function with debouncing
  const searchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      const contextual = getContextualSuggestions();
      const popular = showPopularSuggestions ? POPULAR_SUGGESTIONS.slice(0, 3) : [];
      const recent = showRecentSearches ? RECENT_SEARCHES.slice(0, 2) : [];
      
      setSuggestions([...contextual, ...popular, ...recent].slice(0, maxSuggestions));
      return;
    }

    setIsLoading(true);
    
    // Simulate API call - replace with actual search
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock search results
    const mockResults: SearchSuggestion[] = [
      {
        id: 's1',
        title: `${searchQuery} in Solidity`,
        description: 'Learn about this concept in Solidity',
        type: 'topic',
        href: `/search?q=${encodeURIComponent(searchQuery)}`,
        icon: <Zap className="w-4 h-4" />
      },
      {
        id: 's2',
        title: `Advanced ${searchQuery}`,
        description: 'Deep dive into advanced concepts',
        type: 'course',
        href: `/courses/advanced-${searchQuery.toLowerCase().replace(/\s+/g, '-')}`,
        icon: <BookOpen className="w-4 h-4" />,
        metadata: { difficulty: 'advanced' }
      }
    ];
    
    setSuggestions(mockResults.slice(0, maxSuggestions));
    setIsLoading(false);
  }, [getContextualSuggestions, showPopularSuggestions, showRecentSearches, maxSuggestions]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchSuggestions(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchSuggestions]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
    if (!isOpen) setIsOpen(true);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(suggestions[selectedIndex]);
        } else if (query.trim()) {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion selection
  const handleSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    setIsOpen(false);
    setSelectedIndex(-1);
    
    // Save to recent searches
    if (suggestion.type !== 'recent') {
      saveToRecentSearches(suggestion);
    }
    
    onSelect?.(suggestion);
    router.push(suggestion.href);
  };

  // Handle direct search
  const handleSearch = () => {
    if (!query.trim()) return;
    
    setIsOpen(false);
    const searchUrl = `/search?q=${encodeURIComponent(query.trim())}`;
    
    // Save to recent searches
    saveToRecentSearches({
      id: `search-${Date.now()}`,
      title: query.trim(),
      type: 'recent',
      href: searchUrl,
      icon: <Search className="w-4 h-4" />
    });
    
    router.push(searchUrl);
  };

  // Save to recent searches (localStorage)
  const saveToRecentSearches = (suggestion: SearchSuggestion) => {
    try {
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const updated = [suggestion, ...recent.filter((s: SearchSuggestion) => s.title !== suggestion.title)].slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getSuggestionIcon = (suggestion: SearchSuggestion) => {
    if (suggestion.icon) return suggestion.icon;
    
    switch (suggestion.type) {
      case 'course': return <BookOpen className="w-4 h-4" />;
      case 'lesson': return <Play className="w-4 h-4" />;
      case 'topic': return <Zap className="w-4 h-4" />;
      case 'user': return <Users className="w-4 h-4" />;
      case 'documentation': return <FileText className="w-4 h-4" />;
      case 'recent': return <Clock className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Search Input */}
      <GlassContainer intensity="medium" className="relative">
        <div className="flex items-center">
          <Search className="w-5 h-5 text-gray-400 ml-4" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full bg-transparent border-none outline-none text-white placeholder-gray-400 px-4 py-3"
          />
          
          {query && (
            <button
              onClick={clearSearch}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          {isLoading && (
            <div className="p-2 mr-2">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </GlassContainer>

      {/* Search Suggestions */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 z-50 mt-2"
          >
            <GlassContainer intensity="heavy" className="max-h-96 overflow-y-auto">
              {suggestions.length > 0 ? (
                <div className="py-2">
                  {/* Section Headers */}
                  {!query && showRecentSearches && RECENT_SEARCHES.length > 0 && (
                    <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Recent Searches
                    </div>
                  )}
                  
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSelect(suggestion)}
                      className={cn(
                        'w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/10 transition-colors',
                        selectedIndex === index && 'bg-white/10'
                      )}
                    >
                      <div className="text-gray-400">
                        {getSuggestionIcon(suggestion)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium truncate">
                            {suggestion.title}
                          </span>
                          
                          {suggestion.metadata?.difficulty && (
                            <span className={cn(
                              'text-xs px-2 py-0.5 rounded-full bg-gray-700',
                              getDifficultyColor(suggestion.metadata.difficulty)
                            )}>
                              {suggestion.metadata.difficulty}
                            </span>
                          )}
                          
                          {suggestion.metadata?.progress && (
                            <span className="text-xs text-purple-400">
                              {suggestion.metadata.progress}% complete
                            </span>
                          )}
                        </div>
                        
                        {suggestion.description && (
                          <p className="text-sm text-gray-400 truncate mt-1">
                            {suggestion.description}
                          </p>
                        )}
                        
                        {suggestion.metadata?.duration && (
                          <p className="text-xs text-gray-500 mt-1">
                            {suggestion.metadata.duration}
                          </p>
                        )}
                        
                        {suggestion.metadata?.lastAccessed && (
                          <p className="text-xs text-gray-500 mt-1">
                            {suggestion.metadata.lastAccessed}
                          </p>
                        )}
                      </div>
                      
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                  
                  {/* Popular Suggestions Section */}
                  {!query && showPopularSuggestions && (
                    <>
                      <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide border-t border-gray-700 mt-2">
                        <TrendingUp className="w-3 h-3 inline mr-1" />
                        Popular
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-gray-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No suggestions found</p>
                  {query && (
                    <button
                      onClick={handleSearch}
                      className="mt-2 text-purple-400 hover:text-purple-300 text-sm underline"
                    >
                      Search for "{query}"
                    </button>
                  )}
                </div>
              )}
            </GlassContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
