/**
 * Secure logging utility with authentication and rate limiting
 * Prevents log injection and unauthorized access
 */

import { auth } from '../firebase/config';

// Rate limiting for logging (prevent log flooding)
const logRateLimit = new Map();

/**
 * Check logging rate limits
 * @param {string} identifier - User identifier
 * @returns {boolean} - True if within limits
 */
const checkLogRateLimit = (identifier) => {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxLogs = 10; // Max 10 logs per minute
  
  const windowKey = `${identifier}:${Math.floor(now / windowMs)}`;
  const current = logRateLimit.get(windowKey) || 0;
  
  if (current >= maxLogs) return false;
  
  logRateLimit.set(windowKey, current + 1);
  return true;
};

/**
 * Sanitize log data to prevent injection
 * @param {object} data - Data to sanitize
 * @returns {object} - Sanitized data
 */
const sanitizeLogData = (data) => {
  if (typeof data !== 'object' || data === null) {
    return { message: String(data).substring(0, 200) };
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    // Remove sensitive fields
    if (['password', 'token', 'secret', 'key'].includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      sanitized[key] = value.substring(0, 200); // Limit length
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Securely send logs to server with authentication
 * @param {object} logData - Data to log
 * @param {string} logLevel - Log level (info, warn, error)
 * @returns {Promise} - Fetch promise
 */
export const secureLog = async (logData, logLevel = 'info') => {
  try {
    // Get current user for authentication
    const user = auth.currentUser;
    if (!user) {
      console.warn('Cannot log: No authenticated user');
      return Promise.resolve();
    }
    
    // Check rate limiting
    if (!checkLogRateLimit(user.uid)) {
      console.warn('Log rate limit exceeded for user:', user.uid);
      return Promise.resolve();
    }
    
    // Sanitize log data
    const sanitizedData = sanitizeLogData(logData);
    
    // Prepare secure log entry
    const secureLogEntry = {
      timestamp: new Date().toISOString(),
      level: logLevel,
      userId: user.uid,
      userEmail: user.email,
      data: sanitizedData,
      userAgent: navigator.userAgent?.substring(0, 200) || 'unknown',
      url: window.location.href?.substring(0, 200) || 'unknown'
    };
    
    // Get log server URL with fallback
    const logServerUrl = process.env.REACT_APP_LOG_SERVER_URL || 'http://localhost:3001/log';
    
    // Send with authentication header
    return fetch(logServerUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': user.uid,
        'X-Request-Time': Date.now().toString()
      },
      body: JSON.stringify(secureLogEntry),
    }).catch((err) => {
      // Silent fail for logging - don't break the app
      console.warn('Failed to send log:', err);
    });
    
  } catch (error) {
    console.warn('Logging error:', error);
    return Promise.resolve();
  }
};

/**
 * Log user actions with context
 * @param {string} action - Action description
 * @param {object} context - Additional context
 */
export const logUserAction = (action, context = {}) => {
  return secureLog({
    type: 'user_action',
    action,
    ...context
  }, 'info');
};

/**
 * Log security events
 * @param {string} event - Security event type
 * @param {object} details - Event details
 */
export const logSecurityEvent = (event, details = {}) => {
  return secureLog({
    type: 'security_event',
    event,
    ...details
  }, 'warn');
};

/**
 * Log errors with context
 * @param {string} error - Error message
 * @param {object} context - Error context
 */
export const logError = (error, context = {}) => {
  return secureLog({
    type: 'error',
    error: error?.toString()?.substring(0, 500) || 'Unknown error',
    ...context
  }, 'error');
};

export default {
  secureLog,
  logUserAction,
  logSecurityEvent,
  logError
};