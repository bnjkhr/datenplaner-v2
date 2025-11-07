/**
 * Rate limiting utility for client-side security
 * Prevents brute force attacks on authentication endpoints
 */

// Simple in-memory rate limiter (clears on page reload)
const rateLimitStore = new Map();

/**
 * Check if action is within rate limits
 * @param {string} identifier - Unique identifier (email, IP, etc.)
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - True if within limits, false if rate limited
 */
export const checkRateLimit = (identifier, maxAttempts = 5, windowMs = 60000) => {
  const now = Date.now();
  const windowKey = `${identifier}:${Math.floor(now / windowMs)}`;
  
  const current = rateLimitStore.get(windowKey) || 0;
  
  if (current >= maxAttempts) {
    return false; // Rate limit exceeded
  }
  
  rateLimitStore.set(windowKey, current + 1);
  return true;
};

/**
 * Get remaining attempts for an identifier
 * @param {string} identifier - Unique identifier
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {number} - Remaining attempts
 */
export const getRemainingAttempts = (identifier, maxAttempts = 5, windowMs = 60000) => {
  const now = Date.now();
  const windowKey = `${identifier}:${Math.floor(now / windowMs)}`;
  
  const current = rateLimitStore.get(windowKey) || 0;
  return Math.max(0, maxAttempts - current);
};

/**
 * Clear expired entries (optional cleanup)
 */
export const cleanupRateLimit = () => {
  const now = Date.now();
  const oneHourAgo = now - 3600000;
  
  for (const [key, timestamp] of rateLimitStore.entries()) {
    const keyTimestamp = parseInt(key.split(':')[1]) * 60000;
    if (keyTimestamp < oneHourAgo) {
      rateLimitStore.delete(key);
    }
  }
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 100;
};

/**
 * Sanitize input to prevent XSS
 * @param {string} input - Input to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input, maxLength = 100) => {
  if (typeof input !== 'string') return '';
  
  // Remove script tags and other dangerous content
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  // Trim and limit length
  sanitized = sanitized.trim().substring(0, maxLength);
  
  return sanitized;
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result {valid: boolean, errors: string[]}
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Passwort muss mindestens 6 Zeichen lang sein');
  }
  
  if (password.length > 128) {
    errors.push('Passwort ist zu lang (max. 128 Zeichen)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export default {
  checkRateLimit,
  getRemainingAttempts,
  cleanupRateLimit,
  validateEmail,
  sanitizeInput,
  validatePassword
};