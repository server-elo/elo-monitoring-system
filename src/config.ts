// Configuration file for environment variables and API keys

/**
 * Get API key from multiple possible sources
 * This function checks various environment variable sources and fallbacks
 */
export function getApiKey(): string | null {
  // Check all possible environment variable sources
  const sources = [
    // Vite environment variables (prefixed with VITE_)
    import.meta.env.VITE_GEMINI_API_KEY,
    import.meta.env.VITE_API_KEY,
    
    // Process environment variables (injected by Vite define)
    (globalThis as any).process?.env?.GEMINI_API_KEY,
    (globalThis as any).process?.env?.API_KEY,
    
    // Global variables (injected by Vite define)
    (globalThis as any).__GEMINI_API_KEY__,
    (globalThis as any).__API_KEY__,
    
    // Window variables (fallback)
    (window as any).__GEMINI_API_KEY__,
    (window as any).__API_KEY__,
    
    // Direct environment access (for Node.js environments)
    typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined,
    typeof process !== 'undefined' ? process.env?.API_KEY : undefined,
  ];

  // Find the first non-empty source
  for (const source of sources) {
    if (source && typeof source === 'string' && source.trim().length > 0) {
      console.log('✅ API key found from source');
      return source.trim();
    }
  }

  console.error('❌ No API key found in any source');
  console.log('Checked sources:', {
    'import.meta.env.VITE_GEMINI_API_KEY': !!import.meta.env.VITE_GEMINI_API_KEY,
    'import.meta.env.VITE_API_KEY': !!import.meta.env.VITE_API_KEY,
    'globalThis.process?.env?.GEMINI_API_KEY': !!(globalThis as any).process?.env?.GEMINI_API_KEY,
    'globalThis.process?.env?.API_KEY': !!(globalThis as any).process?.env?.API_KEY,
    'globalThis.__GEMINI_API_KEY__': !!(globalThis as any).__GEMINI_API_KEY__,
    'globalThis.__API_KEY__': !!(globalThis as any).__API_KEY__,
    'window.__GEMINI_API_KEY__': !!(window as any).__GEMINI_API_KEY__,
    'window.__API_KEY__': !!(window as any).__API_KEY__,
  });
  
  return null;
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false;
  
  // Basic validation for Google API key format
  // Google API keys typically start with "AIza" and are 39 characters long
  const isValidFormat = apiKey.startsWith('AIza') && apiKey.length === 39;
  
  if (!isValidFormat) {
    console.warn('⚠️ API key format appears invalid');
  }
  
  return isValidFormat;
}

/**
 * Get and validate API key
 */
export function getValidatedApiKey(): string | null {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.error('❌ No API key configured');
    return null;
  }
  
  if (!validateApiKey(apiKey)) {
    console.error('❌ API key format is invalid');
    return null;
  }
  
  console.log('✅ API key validated successfully');
  return apiKey;
}

// Export the API key for immediate use
export const API_KEY = getValidatedApiKey();

// Log configuration status on module load
console.log('🔧 Configuration loaded:', {
  apiKeyConfigured: !!API_KEY,
  environment: import.meta.env.MODE || 'unknown',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
});
