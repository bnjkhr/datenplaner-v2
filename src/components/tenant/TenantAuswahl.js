import React, { useState } from 'react';
import { useData } from '../../context/DataProvider';
import { isFeatureEnabled, FEATURE_FLAGS } from '../../utils/featureFlags';

/**
 * Tenant-Auswahl Dropdown Komponente
 * Wird nur angezeigt wenn Multi-Tenancy Feature aktiviert ist
 */
export const TenantAuswahl = ({ onTenantChange }) => {
  const { currentTenantId, isMultiTenancy } = useData();
  const [isOpen, setIsOpen] = useState(false);

  // Nur anzeigen wenn Multi-Tenancy aktiviert ist
  if (!isMultiTenancy || !isFeatureEnabled(FEATURE_FLAGS.TENANT_SWITCHING)) {
    return null;
  }

  // Beispiel-Tenants (später aus Firestore laden)
  const availableTenants = [
    { id: 'datenplaner-app-v3', name: 'Standard Team', description: 'Haupt-Arbeitsbereich' },
    { id: 'team-alpha', name: 'Team Alpha', description: 'Alpha-Entwicklungsteam' },
    { id: 'team-beta', name: 'Team Beta', description: 'Beta-Testteam' }
  ];

  const currentTenant = availableTenants.find(t => t.id === currentTenantId) || availableTenants[0];

  const handleTenantSelect = (tenant) => {
    if (onTenantChange) {
      onTenantChange(tenant.id);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ard-blue-500 focus:border-ard-blue-500 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-ard-blue-500 rounded-full"></div>
          <span className="font-medium max-w-32 truncate">
            {currentTenant.name}
          </span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              Verfügbare Arbeitsbereiche
            </div>
            <div className="mt-2 space-y-1">
              {availableTenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleTenantSelect(tenant)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    tenant.id === currentTenantId
                      ? 'bg-ard-blue-50 text-ard-blue-700 border border-ard-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      tenant.id === currentTenantId ? 'bg-ard-blue-500' : 'bg-gray-300'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{tenant.name}</div>
                      <div className="text-xs text-gray-500 truncate">{tenant.description}</div>
                    </div>
                    {tenant.id === currentTenantId && (
                      <div className="text-ard-blue-500 text-xs">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            {isFeatureEnabled(FEATURE_FLAGS.TENANT_MANAGEMENT) && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    // TODO: Implementiere Tenant-Management Modal
                    console.log('Tenant-Management öffnen');
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="text-lg">⚙️</span>
                  <span>Arbeitsbereiche verwalten</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay zum Schließen */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default TenantAuswahl;