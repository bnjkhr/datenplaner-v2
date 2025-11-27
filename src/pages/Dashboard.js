import React, { useMemo } from 'react';
import { useData } from '../context/DataProvider';
import KPICard from '../components/ui/KPICard';

// Icons als SVG-Komponenten
const Icons = {
  Users: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ChartBar: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Warning: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

const Dashboard = ({ onNavigate }) => {
  const {
    personen,
    datenprodukte,
    zuordnungen,
    rollen,
    skills,
    vacations,
  } = useData();

  // State für das Aufklappen der "x weitere" Sektionen
  const [expandedOverbooked, setExpandedOverbooked] = React.useState(false);
  const [expandedUnderbooked, setExpandedUnderbooked] = React.useState(false);

  // Team-Kapazität Berechnungen
  const capacityData = useMemo(() => {
    const m13Personen = personen?.filter(p => p.isM13) || [];

    // Gesamtkapazität (Summe aller Wochenstunden)
    const totalCapacity = m13Personen.reduce((sum, p) => sum + (p.wochenstunden || 31), 0);

    // Gebuchte Stunden
    const bookedHours = m13Personen.reduce((sum, person) => {
      const personZuordnungen = zuordnungen?.filter(z => z.personId === person.id) || [];
      return sum + personZuordnungen.reduce((h, z) => h + (z.stunden || 0), 0);
    }, 0);

    // Auslastung in %
    const utilization = totalCapacity > 0 ? Math.round((bookedHours / totalCapacity) * 100) : 0;

    // Über-/Unterbuchte Mitarbeiter
    const workloadStatus = m13Personen.map(person => {
      const personZuordnungen = zuordnungen?.filter(z => z.personId === person.id) || [];
      const stunden = personZuordnungen.reduce((h, z) => h + (z.stunden || 0), 0);
      const wochenstunden = person.wochenstunden || 31;
      const auslastung = Math.round((stunden / wochenstunden) * 100);
      return {
        ...person,
        stunden,
        wochenstunden,
        auslastung,
        status: auslastung > 100 ? 'overbooked' : auslastung < 50 ? 'underbooked' : 'ok'
      };
    });

    const overbooked = workloadStatus.filter(p => p.status === 'overbooked');
    const underbooked = workloadStatus.filter(p => p.status === 'underbooked');

    return {
      m13Count: m13Personen.length,
      totalCapacity,
      bookedHours,
      utilization,
      overbooked,
      underbooked,
      workloadStatus
    };
  }, [personen, zuordnungen]);

  // Abwesenheiten
  const absenceData = useMemo(() => {
    if (!personen || !vacations) return { current: [], upcoming: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const getPersonAbsences = (person) => {
      const searchKeys = [
        person.name?.toLowerCase(),
        person.email?.toLowerCase(),
      ].filter(Boolean);

      let absences = [];
      searchKeys.forEach(key => {
        const personVacations = vacations[key];
        if (Array.isArray(personVacations)) {
          absences = [...absences, ...personVacations];
        }
      });
      return absences;
    };

    const current = [];
    const upcoming = [];

    personen.forEach(person => {
      const absences = getPersonAbsences(person);
      absences.forEach(absence => {
        const start = new Date(absence.start);
        const end = new Date(absence.end);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        if (today >= start && today <= end) {
          current.push({ ...person, absence, endDate: end });
        } else if (start > today && start <= nextWeek) {
          upcoming.push({ ...person, absence, startDate: start });
        }
      });
    });

    return {
      current: current.slice(0, 6),
      upcoming: upcoming.slice(0, 6)
    };
  }, [personen, vacations]);

  // Produkt-Status mit Staffing-Risiko
  const productData = useMemo(() => {
    if (!datenprodukte || !zuordnungen) return [];

    const activeStatuses = ['Live', 'In Entwicklung', 'In Planung'];

    return datenprodukte
      .filter(dp => activeStatuses.includes(dp.status))
      .map(dp => {
        const teamSize = zuordnungen.filter(z => z.datenproduktId === dp.id).length;
        const uniquePersons = new Set(
          zuordnungen.filter(z => z.datenproduktId === dp.id).map(z => z.personId)
        ).size;

        let risk = 'ok';
        if (uniquePersons === 0) risk = 'critical';
        else if (uniquePersons === 1) risk = 'high';
        else if (uniquePersons === 2) risk = 'medium';

        return {
          ...dp,
          teamSize: uniquePersons,
          risk
        };
      })
      .sort((a, b) => {
        const riskOrder = { critical: 0, high: 1, medium: 2, ok: 3 };
        return riskOrder[a.risk] - riskOrder[b.risk];
      });
  }, [datenprodukte, zuordnungen]);

  // Skill-Risiken (Single Point of Failure)
  const skillRisks = useMemo(() => {
    if (!skills || !personen) return [];

    return skills
      .map(skill => {
        const personenMitSkill = personen.filter(p =>
          p.skills?.some(s => s.id === skill.id || s === skill.id)
        );
        return {
          ...skill,
          count: personenMitSkill.length,
          persons: personenMitSkill.slice(0, 3)
        };
      })
      .filter(s => s.count > 0 && s.count <= 2)
      .sort((a, b) => a.count - b.count);
  }, [skills, personen]);

  // KPIs
  const kpis = useMemo(() => ({
    totalPersonen: personen?.length || 0,
    m13Count: capacityData.m13Count,
    aktiveDatenprodukte: datenprodukte?.filter(
      dp => dp.status === 'Live' || dp.status === 'In Entwicklung'
    )?.length || 0,
    abwesendePersonen: absenceData.current.length,
  }), [personen, datenprodukte, capacityData, absenceData]);

  const handleNavigate = (page) => {
    if (onNavigate) onNavigate(page);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  const getUtilizationColor = (util) => {
    if (util > 100) return 'text-red-600 dark:text-red-400';
    if (util > 85) return 'text-amber-600 dark:text-amber-400';
    if (util < 50) return 'text-blue-600 dark:text-blue-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const getUtilizationBg = (util) => {
    if (util > 100) return 'bg-red-500';
    if (util > 85) return 'bg-amber-500';
    if (util < 50) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  const getRiskBadge = (risk) => {
    const styles = {
      critical: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
      high: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      medium: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
      ok: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
    };
    const labels = {
      critical: 'Kein Team',
      high: '1 Person',
      medium: '2 Personen',
      ok: 'OK'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[risk]}`}>
        {labels[risk]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-dashboard-bg dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">Team-Übersicht und Kapazitätsplanung</p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <KPICard
            title="Team-Mitglieder"
            value={kpis.totalPersonen}
            subtitle={`${kpis.m13Count} M13-Mitarbeiter`}
            icon={<Icons.Users />}
            color="pink"
            onClick={() => handleNavigate('personen')}
          />
          <KPICard
            title="Team-Auslastung"
            value={`${capacityData.utilization}%`}
            subtitle={`${capacityData.bookedHours}h / ${capacityData.totalCapacity}h`}
            icon={<Icons.Clock />}
            color="purple"
          />
          <KPICard
            title="Aktive Produkte"
            value={kpis.aktiveDatenprodukte}
            subtitle="Live & In Entwicklung"
            icon={<Icons.ChartBar />}
            color="blue"
            onClick={() => handleNavigate('datenprodukte')}
          />
          <KPICard
            title="Aktuell Abwesend"
            value={kpis.abwesendePersonen}
            subtitle={absenceData.upcoming.length > 0 ? `+${absenceData.upcoming.length} diese Woche` : 'Niemand geplant'}
            icon={<Icons.Calendar />}
            color="green"
          />
        </div>

        {/* Haupt-Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Team-Kapazität */}
          <div className="dashboard-card-no-hover">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team-Kapazität</h2>
              <span className={`text-2xl font-bold ${getUtilizationColor(capacityData.utilization)}`}>
                {capacityData.utilization}%
              </span>
            </div>

            {/* Auslastungsbalken */}
            <div className="mb-6">
              <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getUtilizationBg(capacityData.utilization)} transition-all duration-500`}
                  style={{ width: `${Math.min(capacityData.utilization, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{capacityData.bookedHours}h gebucht</span>
                <span>{capacityData.totalCapacity}h verfügbar</span>
              </div>
            </div>

            {/* Probleme */}
            {(capacityData.overbooked.length > 0 || capacityData.underbooked.length > 0) && (
              <div className="space-y-3">
                {capacityData.overbooked.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-xl">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300 text-sm font-medium mb-2">
                      <Icons.Warning />
                      <span>{capacityData.overbooked.length} überbucht</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(expandedOverbooked ? capacityData.overbooked : capacityData.overbooked.slice(0, 4)).map(p => (
                        <span key={p.id} className="px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-lg text-xs">
                          {p.name?.split(' ')[0]} ({p.auslastung}%)
                        </span>
                      ))}
                      {capacityData.overbooked.length > 4 && (
                        <button
                          onClick={() => setExpandedOverbooked(!expandedOverbooked)}
                          className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium transition-colors cursor-pointer"
                        >
                          {expandedOverbooked ? '↑ weniger' : `+${capacityData.overbooked.length - 4} weitere`}
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {capacityData.underbooked.length > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm font-medium mb-2">
                      <span>💡</span>
                      <span>{capacityData.underbooked.length} unter 50% Auslastung</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(expandedUnderbooked ? capacityData.underbooked : capacityData.underbooked.slice(0, 4)).map(p => (
                        <span key={p.id} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-lg text-xs">
                          {p.name?.split(' ')[0]} ({p.auslastung}%)
                        </span>
                      ))}
                      {capacityData.underbooked.length > 4 && (
                        <button
                          onClick={() => setExpandedUnderbooked(!expandedUnderbooked)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors cursor-pointer"
                        >
                          {expandedUnderbooked ? '↑ weniger' : `+${capacityData.underbooked.length - 4} weitere`}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Abwesenheiten */}
          <div className="dashboard-card-no-hover">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Abwesenheiten</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Aktuell abwesend */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Heute abwesend
                </h3>
                {absenceData.current.length > 0 ? (
                  <div className="space-y-2">
                    {absenceData.current.map((person, idx) => (
                      <div key={`current-${idx}`} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-gray-900 dark:text-white truncate flex-1 min-w-0">{person.name?.split(' ')[0]}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">bis {formatDate(person.endDate)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">Niemand abwesend</p>
                )}
              </div>

              {/* Kommende Woche */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Diese Woche
                </h3>
                {absenceData.upcoming.length > 0 ? (
                  <div className="space-y-2">
                    {absenceData.upcoming.map((person, idx) => (
                      <div key={`upcoming-${idx}`} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-gray-900 dark:text-white truncate flex-1 min-w-0">{person.name?.split(' ')[0]}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">ab {formatDate(person.startDate)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">Keine geplant</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Untere Sektion */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Produkte mit Staffing-Risiko */}
          <div className="dashboard-card-no-hover">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Produkt-Staffing</h2>
              <button
                onClick={() => handleNavigate('datenprodukte')}
                className="text-sm text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 font-medium"
              >
                Alle →
              </button>
            </div>

            {productData.filter(p => p.risk !== 'ok').length > 0 ? (
              <div className="space-y-3">
                {productData.filter(p => p.risk !== 'ok').slice(0, 6).map(product => (
                  <div key={product.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        product.status === 'Live' ? 'bg-emerald-500' :
                        product.status === 'In Entwicklung' ? 'bg-blue-500' : 'bg-amber-500'
                      }`} />
                      <span className="text-sm text-gray-900 dark:text-white truncate">{product.name}</span>
                    </div>
                    {getRiskBadge(product.risk)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <span className="text-3xl">✅</span>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Alle Produkte ausreichend besetzt</p>
              </div>
            )}
          </div>

          {/* Skill-Risiken */}
          <div className="dashboard-card-no-hover">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Skill-Risiken</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">Single Point of Failure</span>
            </div>

            {skillRisks.length > 0 ? (
              <div className="space-y-3">
                {skillRisks.slice(0, 6).map(skill => (
                  <div key={skill.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: skill.color || '#a855f7' }}
                      />
                      <span className="text-sm text-gray-900 dark:text-white">{skill.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        skill.count === 1 ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                      }`}>
                        {skill.count} {skill.count === 1 ? 'Person' : 'Personen'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <span className="text-3xl">✅</span>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Keine kritischen Skill-Abhängigkeiten</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
