/**
 * Environment variable validation and security configuration checks
 * Ensures proper security configuration before app startup
 */

/**
 * Required environment variables for basic functionality
 */
const REQUIRED_ENV_VARS = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

/**
 * Security-sensitive environment variables
 */
const SECURITY_SENSITIVE_VARS = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_CONFLUENCE_CALENDAR_URL',
  'REACT_APP_LOG_SERVER_URL'
];

/**
 * Validate environment variables
 * @returns {object} - Validation results
 */
export const validateEnvironment = () => {
  const errors = [];
  const warnings = [];
  const config = {};
  
  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      errors.push(`Required environment variable missing: ${envVar}`);
    } else {
      config[envVar] = '✓ Present';
    }
  }
  
  // Check for default/placeholder values
  for (const envVar of SECURITY_SENSITIVE_VARS) {
    const value = process.env[envVar];
    if (value) {
      if (value.includes('your-') || value.includes('placeholder') || value === 'true' || value === 'false') {
        warnings.push(`Environment variable ${envVar} appears to have default/placeholder value`);
      }
      
      // Check for potential secrets in values
      if (value.length < 10 && envVar.includes('KEY')) {
        warnings.push(`Environment variable ${envVar} has suspiciously short value`);
      }
    }
  }
  
  // Validate specific configurations
  if (process.env.REACT_APP_CONFLUENCE_CALENDAR_URL) {
    try {
      new URL(process.env.REACT_APP_CONFLUENCE_CALENDAR_URL);
    } catch {
      warnings.push('REACT_APP_CONFLUENCE_CALENDAR_URL is not a valid URL');
    }
  }
  
  if (process.env.REACT_APP_LOG_SERVER_URL) {
    try {
      new URL(process.env.REACT_APP_LOG_SERVER_URL);
    } catch {
      warnings.push('REACT_APP_LOG_SERVER_URL is not a valid URL');
    }
  }
  
  // Check for development-only configurations in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.REACT_APP_LOG_SERVER_URL?.includes('localhost')) {
      warnings.push('REACT_APP_LOG_SERVER_URL points to localhost in production');
    }
    
    if (process.env.REACT_APP_CONFLUENCE_CALENDAR_URL?.includes('localhost')) {
      warnings.push('REACT_APP_CONFLUENCE_CALENDAR_URL points to localhost in production');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    config
  };
};

/**
 * Security configuration recommendations
 * @returns {object} - Recommendations
 */
export const getSecurityRecommendations = () => {
  const recommendations = [];
  
  // Check for HTTPS in production
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    if (window.location.protocol !== 'https:') {
      recommendations.push('Use HTTPS in production for secure communication');
    }
  }
  
  // Check for App Check configuration
  if (!process.env.REACT_APP_RECAPTCHA_SITE_KEY) {
    recommendations.push('Consider adding Firebase App Check with reCAPTCHA for additional security');
  }
  
  // Check for rate limiting configuration
  if (!process.env.REACT_APP_RATE_LIMIT_WINDOW || !process.env.REACT_APP_RATE_LIMIT_MAX) {
    recommendations.push('Consider implementing server-side rate limiting configuration');
  }
  
  // Check for CORS configuration
  if (!process.env.REACT_APP_CORS_ORIGINS) {
    recommendations.push('Define explicit CORS origins instead of using wildcards');
  }
  
  return recommendations;
};

/**
 * Validate Firebase configuration
 * @returns {object} - Firebase validation results
 */
export const validateFirebaseConfig = () => {
  const errors = [];
  const warnings = [];
  
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
  };
  
  // Check for placeholder values
  for (const [key, value] of Object.entries(firebaseConfig)) {
    if (value && (value.includes('your-') || value.includes('placeholder'))) {
      errors.push(`Firebase configuration ${key} has placeholder value`);
    }
  }
  
  // Validate auth domain format
  if (firebaseConfig.authDomain && !firebaseConfig.authDomain.endsWith('.firebaseapp.com')) {
    warnings.push('Firebase auth domain does not follow expected format');
  }
  
  // Check for test project IDs in production
  if (process.env.NODE_ENV === 'production' && firebaseConfig.projectId) {
    if (firebaseConfig.projectId.includes('test') || firebaseConfig.projectId.includes('demo')) {
      warnings.push('Firebase project ID appears to be a test/demo project in production');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    config: firebaseConfig
  };
};

/**
 * Run comprehensive security validation
 * @returns {object} - Complete validation results
 */
export const runSecurityValidation = () => {
  const envValidation = validateEnvironment();
  const firebaseValidation = validateFirebaseConfig();
  const recommendations = getSecurityRecommendations();
  
  const allErrors = [...envValidation.errors, ...firebaseValidation.errors];
  const allWarnings = [...envValidation.warnings, ...firebaseValidation.warnings, ...recommendations];
  
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    details: {
      environment: envValidation,
      firebase: firebaseValidation,
      recommendations
    }
  };
};

/**
 * Display security validation results in console
 */
export const displaySecurityValidation = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  const validation = runSecurityValidation();
  
  console.group('🔒 Security Configuration Validation');
  
  if (validation.valid) {
    console.log('✅ Security configuration is valid');
  } else {
    console.error('❌ Security configuration has errors:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Security warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  console.groupEnd();
};

const envValidation = {
  validateEnvironment,
  getSecurityRecommendations,
  validateFirebaseConfig,
  runSecurityValidation,
  displaySecurityValidation
};
export default envValidation;