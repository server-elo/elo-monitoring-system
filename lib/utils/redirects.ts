/**
 * Intelligent redirect system for handling common URL patterns and broken links
 */

export interface RedirectRule {
  pattern: RegExp;
  replacement: string;
  priority: number;
  description: string;
}

export interface RedirectSuggestion {
  url: string;
  confidence: number;
  reason: string;
}

// Common redirect patterns ordered by priority
const REDIRECT_RULES: RedirectRule[] = [
  // Course URL patterns
  {
    pattern: /^\/course\/(.+)$/,
    replacement: '/courses/$1',
    priority: 1,
    description: 'Course URL pattern fix'
  },
  {
    pattern: /^\/lesson\/(.+)$/,
    replacement: '/lessons/$1',
    priority: 1,
    description: 'Lesson URL pattern fix'
  },
  {
    pattern: /^\/class\/(.+)$/,
    replacement: '/courses/$1',
    priority: 1,
    description: 'Class to course redirect'
  },
  
  // User/Profile patterns
  {
    pattern: /^\/user\/(.+)$/,
    replacement: '/profile/$1',
    priority: 1,
    description: 'User to profile redirect'
  },
  {
    pattern: /^\/users\/(.+)$/,
    replacement: '/profile/$1',
    priority: 1,
    description: 'Users to profile redirect'
  },
  {
    pattern: /^\/account\/(.+)$/,
    replacement: '/profile/$1',
    priority: 1,
    description: 'Account to profile redirect'
  },
  
  // Learning paths
  {
    pattern: /^\/path\/(.+)$/,
    replacement: '/learning-paths/$1',
    priority: 1,
    description: 'Learning path redirect'
  },
  {
    pattern: /^\/track\/(.+)$/,
    replacement: '/learning-paths/$1',
    priority: 1,
    description: 'Track to learning path redirect'
  },
  
  // Documentation patterns
  {
    pattern: /^\/docs?\/(.+)$/,
    replacement: '/documentation/$1',
    priority: 1,
    description: 'Documentation redirect'
  },
  {
    pattern: /^\/help\/(.+)$/,
    replacement: '/support/$1',
    priority: 1,
    description: 'Help to support redirect'
  },
  
  // Common typos and variations
  {
    pattern: /^\/solididty(.*)$/,
    replacement: '/solidity$1',
    priority: 2,
    description: 'Solidity typo fix'
  },
  {
    pattern: /^\/ethereum(.*)$/,
    replacement: '/courses/ethereum$1',
    priority: 2,
    description: 'Ethereum content redirect'
  },
  
  // Trailing slash fixes
  {
    pattern: /^(.+)\/$/,
    replacement: '$1',
    priority: 3,
    description: 'Remove trailing slash'
  },
  
  // Case sensitivity fixes
  {
    pattern: /^\/([A-Z].*)$/,
    replacement: (_match, p1) => `/${p1.toLowerCase()}`,
    priority: 3,
    description: 'Lowercase URL fix'
  }
];

// Known valid routes for fuzzy matching
const VALID_ROUTES = [
  '/',
  '/courses',
  '/courses/solidity-fundamentals',
  '/courses/advanced-smart-contracts',
  '/courses/defi-development',
  '/courses/nft-development',
  '/learning-paths',
  '/learning-paths/beginner',
  '/learning-paths/intermediate',
  '/learning-paths/advanced',
  '/profile',
  '/settings',
  '/dashboard',
  '/playground',
  '/documentation',
  '/support',
  '/about',
  '/contact',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password'
];

/**
 * Generate intelligent redirect suggestions for a given path
 */
export function generateRedirectSuggestions(path: string): RedirectSuggestion[] {
  const suggestions: RedirectSuggestion[] = [];
  
  // Apply redirect rules
  for (const rule of REDIRECT_RULES) {
    if (typeof rule.replacement === 'string') {
      const match = path.match(rule.pattern);
      if (match) {
        const newPath = path.replace(rule.pattern, rule.replacement);
        suggestions.push({
          url: newPath,
          confidence: 1.0 - (rule.priority - 1) * 0.1,
          reason: rule.description
        });
      }
    } else {
      // Handle function replacements
      const match = path.match(rule.pattern);
      if (match) {
        const newPath = rule.replacement(match[0], ...match.slice(1));
        suggestions.push({
          url: newPath,
          confidence: 1.0 - (rule.priority - 1) * 0.1,
          reason: rule.description
        });
      }
    }
  }
  
  // Fuzzy matching against valid routes
  const fuzzyMatches = findFuzzyMatches(path, VALID_ROUTES);
  suggestions.push(...fuzzyMatches);
  
  // Remove duplicates and sort by confidence
  const uniqueSuggestions = suggestions
    .filter((suggestion, index, self) => 
      index === self.findIndex(s => s.url === suggestion.url)
    )
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5); // Limit to top 5 suggestions
  
  return uniqueSuggestions;
}

/**
 * Find fuzzy matches using Levenshtein distance
 */
function findFuzzyMatches(path: string, validRoutes: string[]): RedirectSuggestion[] {
  const matches: RedirectSuggestion[] = [];
  
  for (const route of validRoutes) {
    const distance = levenshteinDistance(path.toLowerCase(), route.toLowerCase());
    const maxLength = Math.max(path.length, route.length);
    const similarity = 1 - distance / maxLength;
    
    // Only suggest if similarity is above threshold
    if (similarity > 0.6 && distance <= 3) {
      matches.push({
        url: route,
        confidence: similarity * 0.8, // Lower confidence for fuzzy matches
        reason: `Similar to "${route}" (${Math.round(similarity * 100)}% match)`
      });
    }
  }
  
  return matches;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Check if a redirect should be applied automatically
 */
export function shouldAutoRedirect(path: string): string | null {
  // Only auto-redirect for high-confidence, simple pattern matches
  for (const rule of REDIRECT_RULES) {
    if (rule.priority === 1) { // Only highest priority rules
      if (typeof rule.replacement === 'string') {
        const match = path.match(rule.pattern);
        if (match) {
          return path.replace(rule.pattern, rule.replacement);
        }
      }
    }
  }
  
  return null;
}

/**
 * Track 404 errors for analytics
 */
export interface NotFoundEvent {
  path: string;
  referrer: string;
  userAgent: string;
  timestamp: string;
  suggestions: RedirectSuggestion[];
}

export function trackNotFoundError(path: string): NotFoundEvent {
  const event: NotFoundEvent = {
    path,
    referrer: typeof window !== 'undefined' ? document.referrer : '',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
    timestamp: new Date().toISOString(),
    suggestions: generateRedirectSuggestions(path)
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('404 Error:', event);
  }
  
  // Send to analytics service in production
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Replace with your analytics service
    // analytics.track('404_error', event);
    
    // Example: Send to Google Analytics
    if ('gtag' in window) {
      (window as any).gtag('event', 'page_not_found', {
        page_path: path,
        custom_parameter_1: event.referrer
      });
    }
  }
  
  return event;
}

/**
 * Get popular content suggestions based on current path
 */
export function getContextualSuggestions(path: string): string[] {
  const pathSegments = path.toLowerCase().split('/').filter(Boolean);
  const suggestions: string[] = [];
  
  // Course-related suggestions
  if (pathSegments.includes('course') || pathSegments.includes('courses')) {
    suggestions.push('/courses', '/courses/solidity-fundamentals', '/learning-paths');
  }
  
  // Lesson-related suggestions
  if (pathSegments.includes('lesson') || pathSegments.includes('lessons')) {
    suggestions.push('/courses', '/dashboard', '/playground');
  }
  
  // Profile-related suggestions
  if (pathSegments.includes('user') || pathSegments.includes('profile')) {
    suggestions.push('/profile', '/settings', '/dashboard');
  }
  
  // Documentation-related suggestions
  if (pathSegments.includes('doc') || pathSegments.includes('help')) {
    suggestions.push('/documentation', '/support', '/courses');
  }
  
  // Default suggestions if no context matches
  if (suggestions.length === 0) {
    suggestions.push('/', '/courses', '/dashboard');
  }
  
  return suggestions.slice(0, 3);
}
