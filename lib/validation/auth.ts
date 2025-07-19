/**
 * Authentication validation utilities
 * Email and password validation functions
 */

/**
 * Validate email format using regex
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Basic format check
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // Length checks
  if (email.length > 254) {
    return false;
  }
  
  const [local, domain] = email.split('@');
  if (local.length > 64 || domain.length > 253) {
    return false;
  }
  
  return true;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): boolean {
  // At least 8 characters
  if (password.length < 8) {
    return false;
  }
  
  // Must contain uppercase letter
  if (!/[A-Z]/.test(password)) {
    return false;
  }
  
  // Must contain lowercase letter
  if (!/[a-z]/.test(password)) {
    return false;
  }
  
  // Must contain number
  if (!/\d/.test(password)) {
    return false;
  }
  
  // Must contain special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return false;
  }
  
  return true;
}

/**
 * Validate username format
 */
export function validateUsername(username: string): boolean {
  // 3-20 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Validate name format
 */
export function validateName(name: string): boolean {
  // 1-50 characters, letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']{1,50}$/;
  return nameRegex.test(name.trim());
}