/**
 * Error handling utilities for secure error management
 * Prevents information disclosure and provides user-friendly messages
 */

/**
 * Firebase error code mappings to user-friendly messages
 */
const FIREBASE_ERROR_MESSAGES = {
  // Authentication errors
  'auth/user-not-found': 'E-Mail oder Passwort ist falsch.',
  'auth/wrong-password': 'E-Mail oder Passwort ist falsch.',
  'auth/invalid-email': 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
  'auth/too-many-requests': 'Zu viele Login-Versuche. Bitte versuchen Sie es später erneut.',
  'auth/network-request-failed': 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.',
  'auth/internal-error': 'Ein interner Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
  'auth/invalid-credential': 'Anmeldedaten sind ungültig.',
  'auth/user-disabled': 'Dieses Konto wurde deaktiviert.',
  'auth/account-exists-with-different-credential': 'Ein Konto mit dieser E-Mail existiert bereits.',
  
  // Firestore errors
  'permission-denied': 'Sie haben keine Berechtigung für diese Aktion.',
  'not-found': 'Die angeforderte Ressource wurde nicht gefunden.',
  'already-exists': 'Diese Ressource existiert bereits.',
  'resource-exhausted': 'Ressourcenlimit erreicht. Bitte versuchen Sie es später erneut.',
  'unavailable': 'Dienst vorübergehend nicht verfügbar.',
  'deadline-exceeded': 'Zeitlimit überschritten. Bitte versuchen Sie es erneut.',
  
  // Generic errors
  'invalid-argument': 'Ungültige Eingabe. Bitte überprüfen Sie Ihre Daten.',
  'failed-precondition': 'Aktion kann nicht ausgeführt werden.',
  'out-of-range': 'Wert liegt außerhalb des gültigen Bereichs.',
  'unauthenticated': 'Bitte melden Sie sich an, um fortzufahren.'
};

/**
 * Get user-friendly error message from Firebase error code
 * @param {string} errorCode - Firebase error code
 * @returns {string} - User-friendly error message
 */
export const getUserErrorMessage = (errorCode) => {
  if (!errorCode) return 'Ein unerwarteter Fehler ist aufgetreten.';
  
  // Check for specific Firebase error codes
  if (FIREBASE_ERROR_MESSAGES[errorCode]) {
    return FIREBASE_ERROR_MESSAGES[errorCode];
  }
  
  // Check for error code patterns
  if (errorCode.includes('network')) {
    return 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
  }
  
  if (errorCode.includes('timeout') || errorCode.includes('deadline')) {
    return 'Zeitlimit überschritten. Bitte versuchen Sie es erneut.';
  }
  
  if (errorCode.includes('permission') || errorCode.includes('denied')) {
    return 'Sie haben keine Berechtigung für diese Aktion.';
  }
  
  if (errorCode.includes('not-found')) {
    return 'Die angeforderte Ressource wurde nicht gefunden.';
  }
  
  // Default generic message
  return 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
};

/**
 * Log detailed error for debugging (internal use only)
 * @param {Error} error - Error object
 * @param {object} context - Additional context
 */
export const logDetailedError = (error, context = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Detailed error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...context
    });
  }
  
  // In production, send to secure logging service
  if (process.env.NODE_ENV === 'production') {
    // This would integrate with your secure logging utility
    console.warn('Error logged:', error.code || error.message);
  }
};

/**
 * Handle errors securely without exposing sensitive information
 * @param {Error} error - Error to handle
 * @param {Function} setError - Function to set user-facing error message
 * @param {object} options - Additional options
 */
export const handleSecureError = (error, setError, options = {}) => {
  const {
    showDetailedErrors = process.env.NODE_ENV === 'development',
    customMessages = {},
    logError = true
  } = options;
  
  // Log detailed error for debugging
  if (logError) {
    logDetailedError(error);
  }
  
  // Get user-friendly message
  let userMessage = getUserErrorMessage(error.code);
  
  // Apply custom messages if provided
  if (customMessages[error.code]) {
    userMessage = customMessages[error.code];
  }
  
  // Show detailed errors only in development
  if (showDetailedErrors && process.env.NODE_ENV === 'development') {
    userMessage += ` (${error.code}: ${error.message})`;
  }
  
  // Set user-facing error
  if (setError && typeof setError === 'function') {
    setError(userMessage);
  }
  
  return userMessage;
};

/**
 * Wrap async function with error handling
 * @param {Function} asyncFunction - Async function to wrap
 * @param {Function} setError - Error setter function
 * @param {object} options - Options
 * @returns {Function} - Wrapped function
 */
export const withErrorHandling = (asyncFunction, setError, options = {}) => {
  return async (...args) => {
    try {
      return await asyncFunction(...args);
    } catch (error) {
      handleSecureError(error, setError, options);
      throw error; // Re-throw for further handling if needed
    }
  };
};

/**
 * Validate error object structure
 * @param {any} error - Potential error object
 * @returns {boolean} - True if valid error object
 */
export const isValidError = (error) => {
  return error && (
    error instanceof Error ||
    (typeof error === 'object' && error.message) ||
    (typeof error === 'string')
  );
};

/**
 * Create error handler for React components
 * @param {Function} setError - State setter for error messages
 * @param {object} options - Configuration options
 * @returns {Function} - Error handler function
 */
export const createErrorHandler = (setError, options = {}) => {
  return (error, customContext = {}) => {
    if (!isValidError(error)) {
      error = new Error('Unknown error occurred');
    }
    
    const errorObj = error instanceof Error ? error : new Error(error);
    return handleSecureError(errorObj, setError, { ...options, ...customContext });
  };
};

export default {
  getUserErrorMessage,
  logDetailedError,
  handleSecureError,
  withErrorHandling,
  isValidError,
  createErrorHandler,
  FIREBASE_ERROR_MESSAGES
};