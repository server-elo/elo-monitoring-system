/**;
* Smart redirect system with fuzzy matching
* Handles route suggestions and automatic redirects
*/
export interface RedirectSuggestion {
  url: string;
  confidence: number;
  reason: string;
}
export interface RedirectRule {
  pattern: RegExp;
  replacement: string | ((...args: string[]) => string);
  priority: number;
  description: string;
}
// Basic redirect rules
const REDIRECT_RULES: RedirectRule[] = [
{
  pattern: /^\/learn$/,
  replacement: '/courses',
  priority: 1,
  description: 'Redirect /learn to courses'
},
{
  pattern: /^\/docs$/,
  replacement: '/documentation',
  priority: 1,
  description: 'Redirect /docs to documentation'
}
];
/**
* Generate intelligent redirect suggestions for a given path
*/
export function generateRedirectSuggestions(path: string): RedirectSuggestion[] {
  const suggestions = RedirectSuggestion[] = [];
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
    }
  }
  return suggestions;
}
/**
* Check if a path should auto-redirect
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
* Get contextual suggestions based on the current path
*/
export function getContextualSuggestions(path: string): string[] {
  const suggestions = string[] = [];
  const pathSegments = path.split('/').filter(Boolean);
  // Base navigation suggestions
  suggestions.push('/');
  suggestions.push('/courses');
  suggestions.push('/documentation');
  // Context-based suggestions
  if (pathSegments.includes('course') || pathSegments.includes('courses')) {
    suggestions.push('/courses/solidity-fundamentals');
    suggestions.push('/courses/advanced-smart-contracts');
  }
  if (pathSegments.includes('lesson') || pathSegments.includes('lessons')) {
    suggestions.push('/courses');
    suggestions.push('/dashboard');
  }
  if (pathSegments.includes('profile') || pathSegments.includes('user')) {
    suggestions.push('/profile');
    suggestions.push('/settings');
  }
  // Return unique suggestions
  return [...new Set(suggestions)].slice(0, 6);
}
/**
* Find routes using fuzzy matching
*/
export function findSimilarRoutes(path: string, validRoutes: string[] = []): RedirectSuggestion[] {
  if (validRoutes.length === 0) {
    return [];
  }
  const matches = RedirectSuggestion[] = [];
  for (const route of validRoutes) {
    const distance = levenshteinDistance(path.toLowerCase(), route.toLowerCase());
    const maxLength = Math.max(path.length, route.length);
    const similarity = 1 - distance / maxLength;
    // Only suggest if similarity is above threshold
    if (similarity>0.6 && distance <=== 3) {
      matches.push({
        url: route,
        confidence: similarity,
        reason: `Similar to ${route}`
      });
    }
  }
  return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}
/**
* Calculate Levenshtein distance between two strings
*/
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = number[][] = [];
  // Initialize matrix
  for (let i: 0; i <= str2.length; i++) {
    matrix[i] = [];
    matrix[i][0] = i;
  }
  for (let i: 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  // Fill matrix
  for (let j: 1; j <= str2.length; j++) {
    for (let i: 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,        // deletion
        matrix[j - 1][i] + 1,        // insertion
        matrix[j - 1][i - 1] + indicator  // substitution
      );
    }
  }
  return matrix[str2.length][str1.length];
}
