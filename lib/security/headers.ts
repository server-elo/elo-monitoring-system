/**
 * Security headers configuration for production-ready deployment
 * Implements comprehensive security policies and headers
 */

export const securityHeaders = {
  // Content Security Policy - Strict configuration
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' ws: wss: https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests"
  ].join('; '),

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // XSS Protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', '),
  
  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Cross-Origin Policies
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  
  // Remove server information
  'Server': 'Learning-Solidity-Platform',
  'X-Powered-By': 'Next.js',
  
  // Cache Control for sensitive pages
  'Cache-Control': 'no-store, max-age=0'
};

export const developmentHeaders = {
  ...securityHeaders,
  // Relax CSP for development
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https:",
    "style-src 'self' 'unsafe-inline' https:",
    "font-src 'self' https:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' ws: wss: https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'"
  ].join('; ')
};

/**
 * Get appropriate security headers based on environment
 */
export function getSecurityHeaders(isDevelopment = false) {
  return isDevelopment ? developmentHeaders : securityHeaders;
}

/**
 * Security headers for API routes
 */
export const apiSecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'no-store, max-age=0',
  'Pragma': 'no-cache'
};