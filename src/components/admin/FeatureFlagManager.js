import React, { useState, useEffect, useCallback } from 'react';
import { 
  getAllFeatureFlags, 
  isFeatureEnabled, 
  debugFeatureFlags, 
  FEATURE_FLAGS, 
  FEATURE_STATUS 
} from '../../utils/featureFlags';

/**
 * Feature Flag Management Component
 * Nur für Development-Umgebung verfügbar
 */
export const FeatureFlagManager = () => {
  const [flags, setFlags] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);

  const loadFlags = useCallback(() => {
    const allFlags = getAllFeatureFlags();
    setFlags(allFlags);
  }, []);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  useEffect(() => {
    if (!showDebugInfo) {
      return;
    }

    const info = debugFeatureFlags();
    setDebugInfo(info);
  }, [showDebugInfo, flags, debugFeatureFlags]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    loadFlags();
  }, [isVisible, loadFlags]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleStorageChange = (event) => {
      if (!event?.key) {
        loadFlags();
        return;
      }

      if (event.key.startsWith('REACT_APP_') && event.key.endsWith('_STATUS')) {
        loadFlags();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadFlags]);

  // Nur in Development-Umgebung anzeigen
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
    setShowDebugInfo(false);
  };

  const handleOpen = () => {
    setShowDebugInfo(false);
    setIsVisible(true);
  };

  const handleToggleFlag = (flagName) => {
    const currentStatus = flags[flagName]?.status || FEATURE_STATUS.DISABLED;
    const newStatus = currentStatus === FEATURE_STATUS.ENABLED ?
      FEATURE_STATUS.DISABLED :
      FEATURE_STATUS.ENABLED;
    
    // Setze Umgebungsvariable temporär (nur für Development)
    const envVarName = `REACT_APP_${flagName.toUpperCase()}_STATUS`;
    
    // Simuliere Umgebungsvariable durch localStorage für Development
    if (newStatus === FEATURE_STATUS.ENABLED) {
      localStorage.setItem(envVarName, 'enabled');
    } else {
      localStorage.removeItem(envVarName);
    }
    
    // Seite neu laden um Änderungen zu übernehmen
    window.location.reload();
  };

  const handleToggleDebugInfo = () => {
    if (showDebugInfo) {
      setShowDebugInfo(false);
      return;
    }

    const info = debugFeatureFlags();
    setDebugInfo(info);
    setShowDebugInfo(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case FEATURE_STATUS.ENABLED:
        return 'bg-green-100 text-green-800';
      case FEATURE_STATUS.BETA:
        return 'bg-yellow-100 text-yellow-800';
      case FEATURE_STATUS.DEVELOPMENT:
        return 'bg-blue-100 text-blue-800';
      case FEATURE_STATUS.DISABLED:
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case FEATURE_STATUS.ENABLED:
        return '✅';
      case FEATURE_STATUS.BETA:
        return '⚠️';
      case FEATURE_STATUS.DEVELOPMENT:
        return '🔧';
      case FEATURE_STATUS.DISABLED:
      default:
        return '❌';
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleOpen}
          className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Feature Flags öffnen"
        >
          🏁
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            🏁 Feature Flags
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
              DEV
            </span>
          </h3>
          <div className="flex gap-2">
            <button
              onClick={loadFlags}
              className="text-sm text-gray-500 hover:text-gray-700"
              title="Feature-Flags aktualisieren"
            >
              🔄
            </button>
            <button
              onClick={handleToggleDebugInfo}
              className={`text-sm ${showDebugInfo ? 'text-purple-600' : 'text-blue-600'} hover:text-purple-700`}
              title={showDebugInfo ? 'Debug-Informationen verbergen' : 'Debug-Informationen anzeigen'}
            >
              🐛
            </button>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {Object.entries(flags).map(([flagName, flag]) => (
            <div key={flagName} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {flagName}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(flag.status)}`}>
                    {getStatusIcon(flag.status)} {flag.status}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleFlag(flagName)}
                  className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                    flag.enabled 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                  disabled={!flag.dependenciesSatisfied}
                >
                  {flag.enabled ? 'Deaktivieren' : 'Aktivieren'}
                </button>
              </div>
              
              <p className="text-xs text-gray-600 mb-2">
                {flag.description}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className={`flex items-center gap-1 ${flag.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                  {flag.enabled ? '✅' : '❌'} Aktiviert
                </span>
                <span className={`flex items-center gap-1 ${flag.beta ? 'text-yellow-600' : 'text-gray-400'}`}>
                  {flag.beta ? '⚠️' : '➖'} Beta
                </span>
                <span className={`flex items-center gap-1 ${flag.dependenciesSatisfied ? 'text-green-600' : 'text-red-600'}`}>
                  {flag.dependenciesSatisfied ? '✅' : '❌'} Abhängigkeiten
                </span>
              </div>
              
              {flag.dependsOn && flag.dependsOn.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  <span className="font-medium">Abhängigkeiten:</span> {flag.dependsOn.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>

        {showDebugInfo && (
          <div className="mt-4 border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-900">Debug-Informationen</h4>
              <button
                onClick={() => setShowDebugInfo(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
                title="Debug-Informationen verbergen"
              >
                ✕
              </button>
            </div>
            {debugInfo.length > 0 ? (
              <div className="space-y-2">
                {debugInfo.map((info) => (
                  <div key={info.flag} className="bg-gray-50 rounded-md p-2">
                    <div className="text-xs font-semibold text-gray-800">{info.flag}</div>
                    <dl className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-600">
                      <dt>Status</dt>
                      <dd className="text-right text-gray-800 font-medium">{info.status}</dd>
                      <dt>Aktiv</dt>
                      <dd className="text-right">{info.enabled ? 'Ja' : 'Nein'}</dd>
                      <dt>Beta</dt>
                      <dd className="text-right">{info.beta ? 'Ja' : 'Nein'}</dd>
                      <dt>Abhängigkeiten</dt>
                      <dd className="text-right">{info.dependenciesSatisfied ? 'Erfüllt' : 'Offen'}</dd>
                    </dl>
                    {info.description && (
                      <p className="mt-2 text-[11px] text-gray-500">{info.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500">
                Keine Debug-Informationen verfügbar.
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            💡 Änderungen erfordern Seiten-Reload
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureFlagManager;