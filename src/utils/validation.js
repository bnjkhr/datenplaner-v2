/**
 * Input validation utilities for form data sanitization
 * Provides XSS protection and input validation
 */

/**
 * Sanitize input to prevent XSS attacks
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
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:\s*text\/html/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/onerror\s*=/gi, '');
  
  // Trim and limit length
  sanitized = sanitized.trim().substring(0, maxLength);
  
  return sanitized;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export const validateEmail = (email) => {
  if (typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 100 && email.length >= 3;
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result {valid: boolean, errors: string[]}
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (typeof password !== 'string') {
    errors.push('Passwort muss eine Zeichenkette sein');
    return { valid: false, errors };
  }
  
  if (password.length < 6) {
    errors.push('Passwort muss mindestens 6 Zeichen lang sein');
  }
  
  if (password.length > 128) {
    errors.push('Passwort ist zu lang (max. 128 Zeichen)');
  }
  
  // Check for common weak passwords
  const weakPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('Passwort ist zu schwach - wählen Sie ein stärkeres Passwort');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate name fields (prevent injection)
 * @param {string} name - Name to validate
 * @returns {object} - Validation result {valid: boolean, error: string}
 */
export const validateName = (name) => {
  if (typeof name !== 'string') {
    return { valid: false, error: 'Name muss eine Zeichenkette sein' };
  }
  
  if (name.length < 1) {
    return { valid: false, error: 'Name ist erforderlich' };
  }
  
  if (name.length > 50) {
    return { valid: false, error: 'Name ist zu lang (max. 50 Zeichen)' };
  }
  
  // Check for suspicious patterns
  if (/<|>|&lt;|&gt;|javascript:|on\w+\s*=/.test(name)) {
    return { valid: false, error: 'Name enthält ungültige Zeichen' };
  }
  
  return { valid: true, error: null };
};

/**
 * Validate numeric inputs
 * @param {string|number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {object} - Validation result {valid: boolean, error: string}
 */
export const validateNumber = (value, min = 0, max = 1000) => {
  const num = Number(value);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Wert muss eine Zahl sein' };
  }
  
  if (num < min || num > max) {
    return { valid: false, error: `Wert muss zwischen ${min} und ${max} liegen` };
  }
  
  return { valid: true, error: null };
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid URL
 */
export const validateUrl = (url) => {
  if (typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
export const escapeHtml = (text) => {
  if (typeof text !== 'string') return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return text.replace(/[&<>"'/]/g, (s) => map[s]);
};

export default {
  sanitizeInput,
  validateEmail,
  validatePassword,
  validateName,
  validateNumber,
  validateUrl,
  escapeHtml
};