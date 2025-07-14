/**
 * Feature Flag System für Multi-Tenancy
 * Ermöglicht schrittweise Einführung von Multi-Tenant-Funktionalität
 */

// Feature Flag Konstanten
export const FEATURE_FLAGS = {
  MULTI_TENANCY: 'multi_tenancy',
  TENANT_MANAGEMENT: 'tenant_management',
  TENANT_INVITATION: 'tenant_invitation',
  TENANT_SWITCHING: 'tenant_switching'
};

// Feature Flag Status
export const FEATURE_STATUS = {
  DISABLED: 'disabled',
  ENABLED: 'enabled',
  BETA: 'beta',
  DEVELOPMENT: 'development'
};

/**
 * Prüft ob ein Feature Flag aktiviert ist
 * @param {string} flagName - Name des Feature Flags
 * @returns {boolean} - True wenn Feature aktiviert ist
 */
export const isFeatureEnabled = (flagName) => {
  // Entwicklungsumgebung: Alle Flags können über ENV-Variablen gesteuert werden
  if (process.env.NODE_ENV === 'development') {
    const envFlag = process.env[`REACT_APP_FEATURE_${flagName.toUpperCase()}`];
    if (envFlag !== undefined) {
      return envFlag === 'true' || envFlag === 'enabled';
    }
  }

  // Produktionsumgebung: Zentrale Konfiguration
  const config = getFeatureConfig();
  const feature = config[flagName];
  
  if (!feature) return false;
  
  return feature.status === FEATURE_STATUS.ENABLED || 
         feature.status === FEATURE_STATUS.BETA;
};

/**
 * Prüft ob ein Feature im Beta-Modus ist
 * @param {string} flagName - Name des Feature Flags
 * @returns {boolean} - True wenn Feature im Beta-Modus ist
 */
export const isFeatureBeta = (flagName) => {
  const config = getFeatureConfig();
  const feature = config[flagName];
  
  return feature?.status === FEATURE_STATUS.BETA;
};

/**
 * Gibt die aktuelle Feature-Konfiguration zurück
 * @returns {object} - Feature-Konfiguration
 */
export const getFeatureConfig = () => {
  // Basis-Konfiguration
  const baseConfig = {
    [FEATURE_FLAGS.MULTI_TENANCY]: {
      status: FEATURE_STATUS.DISABLED,
      description: 'Multi-Tenant-Funktionalität',
      rolloutPercentage: 0
    },
    [FEATURE_FLAGS.TENANT_MANAGEMENT]: {
      status: FEATURE_STATUS.DISABLED,
      description: 'Mandantenverwaltung',
      rolloutPercentage: 0,
      dependsOn: [FEATURE_FLAGS.MULTI_TENANCY]
    },
    [FEATURE_FLAGS.TENANT_INVITATION]: {
      status: FEATURE_STATUS.DISABLED,
      description: 'Mandanten-Einladungssystem',
      rolloutPercentage: 0,
      dependsOn: [FEATURE_FLAGS.TENANT_MANAGEMENT]
    },
    [FEATURE_FLAGS.TENANT_SWITCHING]: {
      status: FEATURE_STATUS.DISABLED,
      description: 'Mandantenwechsel',
      rolloutPercentage: 0,
      dependsOn: [FEATURE_FLAGS.MULTI_TENANCY]
    }
  };

  // Überschreibung durch Umgebungsvariablen
  const overrideConfig = {
    [FEATURE_FLAGS.MULTI_TENANCY]: {
      status: process.env.REACT_APP_MULTI_TENANCY_STATUS || baseConfig[FEATURE_FLAGS.MULTI_TENANCY].status
    },
    [FEATURE_FLAGS.TENANT_MANAGEMENT]: {
      status: process.env.REACT_APP_TENANT_MANAGEMENT_STATUS || baseConfig[FEATURE_FLAGS.TENANT_MANAGEMENT].status
    },
    [FEATURE_FLAGS.TENANT_INVITATION]: {
      status: process.env.REACT_APP_TENANT_INVITATION_STATUS || baseConfig[FEATURE_FLAGS.TENANT_INVITATION].status
    },
    [FEATURE_FLAGS.TENANT_SWITCHING]: {
      status: process.env.REACT_APP_TENANT_SWITCHING_STATUS || baseConfig[FEATURE_FLAGS.TENANT_SWITCHING].status
    }
  };

  // Merge base config mit overrides
  return Object.keys(baseConfig).reduce((acc, key) => {
    acc[key] = {
      ...baseConfig[key],
      ...overrideConfig[key]
    };
    return acc;
  }, {});
};

/**
 * Prüft ob alle Abhängigkeiten für ein Feature erfüllt sind
 * @param {string} flagName - Name des Feature Flags
 * @returns {boolean} - True wenn alle Abhängigkeiten erfüllt sind
 */
export const areDependenciesSatisfied = (flagName) => {
  const config = getFeatureConfig();
  const feature = config[flagName];
  
  if (!feature || !feature.dependsOn) {
    return true;
  }
  
  return feature.dependsOn.every(dep => isFeatureEnabled(dep));
};

/**
 * Gibt alle verfügbaren Feature Flags zurück
 * @returns {object} - Alle Feature Flags mit Status
 */
export const getAllFeatureFlags = () => {
  const config = getFeatureConfig();
  
  return Object.keys(config).reduce((acc, key) => {
    acc[key] = {
      ...config[key],
      enabled: isFeatureEnabled(key),
      beta: isFeatureBeta(key),
      dependenciesSatisfied: areDependenciesSatisfied(key)
    };
    return acc;
  }, {});
};

/**
 * Debugging-Funktion für Feature Flags
 * @param {string} flagName - Optional: Spezifischer Flag Name
 */
export const debugFeatureFlags = (flagName = null) => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  const config = flagName ? { [flagName]: getFeatureConfig()[flagName] } : getFeatureConfig();
  
  console.group('🏁 Feature Flags Debug');
  Object.entries(config).forEach(([key, value]) => {
    const enabled = isFeatureEnabled(key);
    const beta = isFeatureBeta(key);
    const deps = areDependenciesSatisfied(key);
    
    console.log(`${key}:`, {
      status: value.status,
      enabled,
      beta,
      dependenciesSatisfied: deps,
      description: value.description
    });
  });
  console.groupEnd();
};

// Export für einfache Verwendung
export default {
  isFeatureEnabled,
  isFeatureBeta,
  getFeatureConfig,
  getAllFeatureFlags,
  debugFeatureFlags,
  FEATURE_FLAGS,
  FEATURE_STATUS
};