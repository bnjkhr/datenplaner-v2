import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataProvider';

const Dashboard = ({ onNavigate }) => {
  const {
    personen,
    datenprodukte,
    zuordnungen,
    vacations,
  } = useData();

  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedAbsence, setExpandedAbsence] = useState({ current: false, upcoming: false });

  // Team-Kapazität Berechnungen
  const capacityData = useMemo(() => {
    const m13Personen = personen?.filter(p => p.isM13) || [];
    const totalCapacity = m13Personen.reduce((sum, p) => sum + (p.wochenstunden || 31), 0);
    const bookedHours = m13Personen.reduce((sum, person) => {
      const personZuordnungen = zuordnungen?.filter(z => z.personId === person.id) || [];
      return sum + personZuordnungen.reduce((h, z) => h + (z.stunden || 0), 0);
    }, 0);
    const utilization = totalCapacity > 0 ? Math.round((bookedHours / totalCapacity) * 100) : 0;

    const workloadStatus = m13Personen.map(person => {
      const personZuordnungen = zuordnungen?.filter(z => z.personId === person.id) || [];
      const stunden = personZuordnungen.reduce((h, z) => h + (z.stunden || 0), 0);
      const wochenstunden = person.wochenstunden || 31;
      const auslastung = Math.round((stunden / wochenstunden) * 100);
      return { ...person, stunden, wochenstunden, auslastung };
    });

    const overbooked = workloadStatus.filter(p => p.auslastung > 100);
    const underbooked = workloadStatus.filter(p => p.auslastung < 50);

    return { m13Count: m13Personen.length, totalCapacity, bookedHours, utilization, overbooked, underbooked };
  }, [personen, zuordnungen]);

  // Abwesenheiten
  const absenceData = useMemo(() => {
    if (!personen || !vacations) return { current: [], upcoming: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const current = [];
    const upcoming = [];

    personen.forEach(person => {
      const searchKeys = [person.name?.toLowerCase(), person.email?.toLowerCase()].filter(Boolean);
      searchKeys.forEach(key => {
        const personVacations = vacations[key];
        if (Array.isArray(personVacations)) {
          personVacations.forEach(absence => {
            const start = new Date(absence.start);
            const end = new Date(absence.end);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            if (today >= start && today <= end) {
              current.push({ ...person, endDate: end });
            } else if (start > today && start <= nextWeek) {
              upcoming.push({ ...person, startDate: start });
            }
          });
        }
      });
    });

    return { current, upcoming };
  }, [personen, vacations]);

  // Produkt-Status
  const productData = useMemo(() => {
    if (!datenprodukte || !zuordnungen) return { live: [], inDev: [], planned: [] };

    const getProductInfo = (dp) => {
      const teamSize = new Set(zuordnungen.filter(z => z.datenproduktId === dp.id).map(z => z.personId)).size;
      const totalHours = zuordnungen.filter(z => z.datenproduktId === dp.id).reduce((sum, z) => sum + (z.stunden || 0), 0);
      return { ...dp, teamSize, totalHours };
    };

    return {
      live: datenprodukte.filter(dp => dp.status === 'Live').map(getProductInfo),
      inDev: datenprodukte.filter(dp => dp.status === 'In Entwicklung').map(getProductInfo),
      planned: datenprodukte.filter(dp => dp.status === 'In Planung').map(getProductInfo),
    };
  }, [datenprodukte, zuordnungen]);

  const handleNavigate = (page, productId = null) => {
    if (onNavigate) onNavigate(page, productId);
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

  // Utility-Funktion für Auslastungsfarbe
  const getUtilizationStyle = (util) => {
    if (util > 100) return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500' };
    if (util > 85) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500' };
    if (util < 50) return { color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-400' };
    return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500' };
  };

  const utilizationStyle = getUtilizationStyle(capacityData.utilization);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">

        {/* Header mit Key Metrics */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Team-Übersicht und Ressourcen</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <button
                onClick={() => handleNavigate('personen')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <span className="text-2xl font-semibold text-gray-900 dark:text-white">{personen?.length || 0}</span>
                <span>Personen</span>
              </button>
              <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
              <button
                onClick={() => handleNavigate('datenprodukte')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <span className="text-2xl font-semibold text-gray-900 dark:text-white">{productData.live.length + productData.inDev.length}</span>
                <span>Aktive Teams</span>
              </button>
              <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <span className={`text-2xl font-semibold ${utilizationStyle.color}`}>{capacityData.utilization}%</span>
                <span>Auslastung</span>
              </div>
            </div>
          </div>

          {/* Auslastungsbalken - volle Breite */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Team-Kapazität</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {capacityData.bookedHours}h von {capacityData.totalCapacity}h gebucht
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${utilizationStyle.bg} transition-all duration-500`}
                style={{ width: `${Math.min(capacityData.utilization, 100)}%` }}
              />
            </div>

            {/* Warnungen inline */}
            {(capacityData.overbooked.length > 0 || capacityData.underbooked.length > 0) && (
              <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                {capacityData.overbooked.length > 0 && (
                  <button
                    onClick={() => handleNavigate('personen')}
                    className="flex items-center gap-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 -mx-2 px-2 py-1 rounded-lg transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {capacityData.overbooked.length} überbucht
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">
                      ({capacityData.overbooked.slice(0, 3).map(p => p.name?.split(' ')[0]).join(', ')}{capacityData.overbooked.length > 3 && '...'})
                    </span>
                  </button>
                )}
                {capacityData.underbooked.length > 0 && (
                  <button
                    onClick={() => handleNavigate('personen')}
                    className="flex items-center gap-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 -mx-2 px-2 py-1 rounded-lg transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {capacityData.underbooked.length} unter 50%
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Haupt-Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Teams/Projekte - Nimmt 2 Spalten */}
          <div className="lg:col-span-2 space-y-4">

            {/* Live Teams */}
            {productData.live.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h2 className="font-medium text-gray-900 dark:text-white">Live</h2>
                    <span className="text-sm text-gray-400 dark:text-gray-500">{productData.live.length}</span>
                  </div>
                  <button
                    onClick={() => handleNavigate('datenprodukte')}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    Alle anzeigen
                  </button>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {productData.live.slice(0, 5).map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleNavigate('datenprodukte', product.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                    >
                      <span className="text-sm text-gray-900 dark:text-white">{product.name}</span>
                      <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                        <span>{product.teamSize} {product.teamSize === 1 ? 'Person' : 'Personen'}</span>
                        <span>{product.totalHours}h/Wo</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* In Entwicklung */}
            {productData.inDev.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <h2 className="font-medium text-gray-900 dark:text-white">In Entwicklung</h2>
                    <span className="text-sm text-gray-400 dark:text-gray-500">{productData.inDev.length}</span>
                  </div>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {productData.inDev.slice(0, 5).map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleNavigate('datenprodukte', product.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-900 dark:text-white">{product.name}</span>
                        {product.teamSize === 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                            Kein Team
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                        <span>{product.teamSize} {product.teamSize === 1 ? 'Person' : 'Personen'}</span>
                        <span>{product.totalHours}h/Wo</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* In Planung - kollabierbar */}
            {productData.planned.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'planned' ? null : 'planned')}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <h2 className="font-medium text-gray-900 dark:text-white">In Planung</h2>
                    <span className="text-sm text-gray-400 dark:text-gray-500">{productData.planned.length}</span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'planned' ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSection === 'planned' && (
                  <div className="divide-y divide-gray-50 dark:divide-gray-700/50 border-t border-gray-100 dark:border-gray-700">
                    {productData.planned.map(product => (
                      <button
                        key={product.id}
                        onClick={() => handleNavigate('datenprodukte', product.id)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                      >
                        <span className="text-sm text-gray-900 dark:text-white">{product.name}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {product.teamSize} {product.teamSize === 1 ? 'Person' : 'Personen'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Abwesenheiten */}
          <div className="space-y-4">

            {/* Heute abwesend */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <h2 className="font-medium text-gray-900 dark:text-white">Heute abwesend</h2>
                {absenceData.current.length > 0 && (
                  <span className="text-sm text-gray-400 dark:text-gray-500">{absenceData.current.length}</span>
                )}
              </div>
              <div className="p-4">
                {absenceData.current.length > 0 ? (
                  <div className="space-y-2">
                    {(expandedAbsence.current ? absenceData.current : absenceData.current.slice(0, 4)).map((person, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{person.name}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">bis {formatDate(person.endDate)}</span>
                      </div>
                    ))}
                    {absenceData.current.length > 4 && (
                      <button
                        onClick={() => setExpandedAbsence(prev => ({ ...prev, current: !prev.current }))}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium mt-1"
                      >
                        {expandedAbsence.current ? '↑ weniger' : `+${absenceData.current.length - 4} weitere`}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">Alle verfügbar</p>
                )}
              </div>
            </div>

            {/* Diese Woche */}
            {absenceData.upcoming.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <h2 className="font-medium text-gray-900 dark:text-white">Diese Woche</h2>
                  <span className="text-sm text-gray-400 dark:text-gray-500">{absenceData.upcoming.length}</span>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    {(expandedAbsence.upcoming ? absenceData.upcoming : absenceData.upcoming.slice(0, 4)).map((person, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{person.name}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">ab {formatDate(person.startDate)}</span>
                      </div>
                    ))}
                    {absenceData.upcoming.length > 4 && (
                      <button
                        onClick={() => setExpandedAbsence(prev => ({ ...prev, upcoming: !prev.upcoming }))}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium mt-1"
                      >
                        {expandedAbsence.upcoming ? '↑ weniger' : `+${absenceData.upcoming.length - 4} weitere`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h2 className="font-medium text-gray-900 dark:text-white mb-3">Übersicht</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">M13-Mitarbeiter</span>
                  <span className="font-medium text-gray-900 dark:text-white">{capacityData.m13Count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Wochenstunden gesamt</span>
                  <span className="font-medium text-gray-900 dark:text-white">{capacityData.totalCapacity}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Aktive Projekte</span>
                  <span className="font-medium text-gray-900 dark:text-white">{productData.live.length + productData.inDev.length + productData.planned.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
