import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataProvider';

// Animated Number Hook
const useAnimatedNumber = (target, duration = 600) => {
  const [current, setCurrent] = useState(0);
  const startRef = useRef(0);

  useEffect(() => {
    const startTime = Date.now();
    startRef.current = current;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(startRef.current + (target - startRef.current) * easeOut));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return current;
};

// Mini Progress Bar
const MiniBar = ({ value, max = 100, color = 'blue', showValue = true }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const colors = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    gray: 'bg-gray-400',
  };

  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-8 text-right">
          {value}%
        </span>
      )}
    </div>
  );
};

// Gauge Component
const Gauge = ({ value, size = 140 }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // Halbkreis
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      const newOffset = circumference - (Math.min(value, 100) / 100) * circumference;
      setOffset(newOffset);
    }, 100);
    return () => clearTimeout(timer);
  }, [value, circumference]);

  const getColor = (v) => {
    if (v > 100) return '#ef4444';
    if (v > 85) return '#f59e0b';
    if (v < 50) return '#6b7280';
    return '#10b981';
  };

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
      <svg width={size} height={size / 2 + 10} className="overflow-visible">
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={getColor(value)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 4px ${getColor(value)}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
        <span className="text-lg text-gray-400">%</span>
      </div>
    </div>
  );
};

const Dashboard = ({ onNavigate }) => {
  const { personen, datenprodukte, zuordnungen, vacations, skills, rollen } = useData();
  const [expandedSection, setExpandedSection] = useState(null);
  const [showWarnings, setShowWarnings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [expandedAbsences, setExpandedAbsences] = useState({ current: false, upcoming: false });
  const searchRef = useRef(null);

  // Berechnungen
  const stats = useMemo(() => {
    const m13 = personen?.filter(p => p.isM13) || [];
    const totalCapacity = m13.reduce((sum, p) => sum + (p.wochenstunden || 31), 0);
    const bookedHours = m13.reduce((sum, person) => {
      const pz = zuordnungen?.filter(z => z.personId === person.id) || [];
      return sum + pz.reduce((h, z) => h + (z.stunden || 0), 0);
    }, 0);
    const utilization = totalCapacity > 0 ? Math.round((bookedHours / totalCapacity) * 100) : 0;

    // Workload pro Person
    const workload = m13.map(person => {
      const pz = zuordnungen?.filter(z => z.personId === person.id) || [];
      const stunden = pz.reduce((h, z) => h + (z.stunden || 0), 0);
      const wochenstunden = person.wochenstunden || 31;
      const auslastung = Math.round((stunden / wochenstunden) * 100);
      return { ...person, stunden, wochenstunden, auslastung };
    }).sort((a, b) => b.auslastung - a.auslastung);

    const overbooked = workload.filter(p => p.auslastung > 100);
    const underbooked = workload.filter(p => p.auslastung < 50);
    const unassigned = m13.filter(p => {
      const pz = zuordnungen?.filter(z => z.personId === p.id) || [];
      return pz.length === 0;
    });

    return { m13Count: m13.length, totalCapacity, bookedHours, utilization, workload, overbooked, underbooked, unassigned };
  }, [personen, zuordnungen]);

  // Produkte
  const products = useMemo(() => {
    if (!datenprodukte || !zuordnungen) return { live: [], inDev: [], planned: [], noTeam: [] };

    const getInfo = (dp) => {
      const teamSize = new Set(zuordnungen.filter(z => z.datenproduktId === dp.id).map(z => z.personId)).size;
      const totalHours = zuordnungen.filter(z => z.datenproduktId === dp.id).reduce((sum, z) => sum + (z.stunden || 0), 0);
      return { ...dp, teamSize, totalHours };
    };

    const all = datenprodukte.map(getInfo);
    return {
      live: all.filter(dp => dp.status === 'Live'),
      inDev: all.filter(dp => dp.status === 'In Entwicklung'),
      planned: all.filter(dp => dp.status === 'In Planung'),
      noTeam: all.filter(dp => dp.teamSize === 0 && dp.status !== 'Archiviert'),
    };
  }, [datenprodukte, zuordnungen]);

  // Skills-Statistik
  const skillStats = useMemo(() => {
    if (!skills || !personen) return [];

    return skills.map(skill => {
      const count = personen.filter(p => p.skillIds?.includes(skill.id)).length;
      return { ...skill, count };
    }).sort((a, b) => b.count - a.count);
  }, [skills, personen]);

  // Rollen-Statistik
  const roleStats = useMemo(() => {
    if (!rollen || !zuordnungen) return [];

    return rollen.map(rolle => {
      const count = zuordnungen.filter(z => z.rolleId === rolle.id).length;
      return { ...rolle, count };
    }).sort((a, b) => b.count - a.count);
  }, [rollen, zuordnungen]);

  // Abwesenheiten
  const absences = useMemo(() => {
    if (!personen || !vacations) return { current: [], upcoming: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const current = [];
    const upcoming = [];

    personen.forEach(person => {
      const keys = [person.name?.toLowerCase(), person.email?.toLowerCase()].filter(Boolean);
      keys.forEach(key => {
        const pv = vacations[key];
        if (Array.isArray(pv)) {
          pv.forEach(absence => {
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

  const handleNavigate = (page, id = null) => onNavigate?.(page, id);
  const formatDate = (date) => new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

  // Universal Search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return null;

    const q = searchQuery.toLowerCase();
    const results = { personen: [], teams: [], skills: [], rollen: [] };

    // Personen durchsuchen
    personen?.forEach(p => {
      if (p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)) {
        const pz = zuordnungen?.filter(z => z.personId === p.id) || [];
        const stunden = pz.reduce((h, z) => h + (z.stunden || 0), 0);
        results.personen.push({ ...p, stunden });
      }
    });

    // Teams/Datenprodukte durchsuchen
    datenprodukte?.forEach(dp => {
      if (dp.name?.toLowerCase().includes(q)) {
        const teamSize = new Set(zuordnungen?.filter(z => z.datenproduktId === dp.id).map(z => z.personId)).size;
        results.teams.push({ ...dp, teamSize });
      }
    });

    // Skills durchsuchen
    skills?.forEach(s => {
      if (s.name?.toLowerCase().includes(q)) {
        const count = personen?.filter(p => p.skillIds?.includes(s.id)).length || 0;
        results.skills.push({ ...s, count });
      }
    });

    // Rollen durchsuchen
    rollen?.forEach(r => {
      if (r.name?.toLowerCase().includes(q)) {
        const count = zuordnungen?.filter(z => z.rolleId === r.id).length || 0;
        results.rollen.push({ ...r, count });
      }
    });

    const total = results.personen.length + results.teams.length + results.skills.length + results.rollen.length;
    return total > 0 ? results : null;
  }, [searchQuery, personen, datenprodukte, zuordnungen, skills, rollen]);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const animatedUtil = useAnimatedNumber(stats.utilization);
  const animatedBooked = useAnimatedNumber(stats.bookedHours);

  // Warnungen zählen
  const warningCount = stats.overbooked.length + products.noTeam.length + stats.unassigned.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8 max-w-[1600px]">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-display">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Universal Search */}
          <div className="flex-1 max-w-md relative" ref={searchRef}>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Suche nach Personen, Teams, Skills..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setShowSearch(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearch && searchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-30 overflow-hidden max-h-96 overflow-y-auto">
                {/* Personen */}
                {searchResults.personen.length > 0 && (
                  <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Personen</div>
                    {searchResults.personen.slice(0, 5).map(p => (
                      <button
                        key={p.id}
                        onClick={() => { handleNavigate('personen', p.id); setShowSearch(false); setSearchQuery(''); }}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                          {p.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{p.stunden}h/Wo</div>
                        </div>
                        {p.isM13 && <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded">M13</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* Teams */}
                {searchResults.teams.length > 0 && (
                  <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Teams</div>
                    {searchResults.teams.slice(0, 5).map(t => (
                      <button
                        key={t.id}
                        onClick={() => { handleNavigate('datenprodukte', t.id); setShowSearch(false); setSearchQuery(''); }}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-medium text-purple-600 dark:text-purple-400">
                          {t.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{t.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{t.teamSize} Personen · {t.status}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Skills */}
                {searchResults.skills.length > 0 && (
                  <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Skills</div>
                    {searchResults.skills.slice(0, 5).map(s => (
                      <button
                        key={s.id}
                        onClick={() => { handleNavigate('skills', s.id); setShowSearch(false); setSearchQuery(''); }}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color || '#6b7280' }} />
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{s.count} Personen</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Rollen */}
                {searchResults.rollen.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Rollen</div>
                    {searchResults.rollen.slice(0, 5).map(r => (
                      <button
                        key={r.id}
                        onClick={() => { handleNavigate('rollen', r.id); setShowSearch(false); setSearchQuery(''); }}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color || '#6b7280' }} />
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{r.name}</div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{r.count}× verwendet</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No Results */}
            {showSearch && searchQuery.length >= 2 && !searchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-30 p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Keine Ergebnisse für "{searchQuery}"
              </div>
            )}
          </div>

          {warningCount > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowWarnings(!showWarnings)}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded-lg transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {warningCount} {warningCount === 1 ? 'Warnung' : 'Warnungen'}
                </span>
                <svg className={`w-4 h-4 text-amber-600 dark:text-amber-400 transition-transform ${showWarnings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Warnungen Dropdown */}
              {showWarnings && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowWarnings(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-20 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Warnungen</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {/* Überbuchte Personen */}
                      {stats.overbooked.length > 0 && (
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-xs font-medium text-red-600 dark:text-red-400 uppercase">
                              {stats.overbooked.length} Überbucht
                            </span>
                          </div>
                          <div className="space-y-1">
                            {stats.overbooked.map(p => (
                              <button
                                key={p.id}
                                onClick={() => { handleNavigate('personen'); setShowWarnings(false); }}
                                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <span className="text-sm text-gray-900 dark:text-white">{p.name}</span>
                                <span className="text-xs font-medium text-red-600 dark:text-red-400">{p.auslastung}%</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Projekte ohne Team */}
                      {products.noTeam.length > 0 && (
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase">
                              {products.noTeam.length} Ohne Team
                            </span>
                          </div>
                          <div className="space-y-1">
                            {products.noTeam.map(p => (
                              <button
                                key={p.id}
                                onClick={() => { handleNavigate('datenprodukte', p.id); setShowWarnings(false); }}
                                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                              >
                                <span className="text-sm text-gray-900 dark:text-white">{p.name}</span>
                                <span className="text-xs text-gray-400">{p.status}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Nicht zugeordnete Personen */}
                      {stats.unassigned.length > 0 && (
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-gray-400" />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                              {stats.unassigned.length} Nicht zugeordnet
                            </span>
                          </div>
                          <div className="space-y-1">
                            {stats.unassigned.map(p => (
                              <button
                                key={p.id}
                                onClick={() => { handleNavigate('personen'); setShowWarnings(false); }}
                                className="w-full flex items-center px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                              >
                                <span className="text-sm text-gray-900 dark:text-white">{p.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-4">

          {/* Left Column - Auslastung */}
          <div className="col-span-12 lg:col-span-3 space-y-4">

            {/* Gauge Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 font-display">
                Team-Auslastung
              </div>
              <div className="flex justify-center">
                <Gauge value={animatedUtil} />
              </div>
              <div className="text-center text-sm text-gray-600 dark:text-gray-300 mt-2">
                <span className="font-semibold">{animatedBooked}h</span>
                <span className="text-gray-400"> / {stats.totalCapacity}h</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleNavigate('personen')} className="text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 -m-2 p-2 rounded-lg transition-colors">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{personen?.length || 0}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Personen</div>
                </button>
                <button onClick={() => handleNavigate('personen')} className="text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 -m-2 p-2 rounded-lg transition-colors">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.m13Count}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">M13-Team</div>
                </button>
                <button onClick={() => handleNavigate('datenprodukte')} className="text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 -m-2 p-2 rounded-lg transition-colors">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{products.live.length + products.inDev.length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Aktive Teams</div>
                </button>
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCapacity}<span className="text-sm font-normal text-gray-400">h</span></div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Wochenstunden</div>
                </div>
              </div>
            </div>

            {/* Warnungen */}
            {warningCount > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 font-display">
                  Warnungen
                </div>
                <div className="space-y-2">
                  {stats.overbooked.length > 0 && (
                    <button
                      onClick={() => handleNavigate('personen')}
                      className="w-full flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-sm text-red-700 dark:text-red-400">{stats.overbooked.length} überbucht</span>
                    </button>
                  )}
                  {products.noTeam.length > 0 && (
                    <button
                      onClick={() => handleNavigate('datenprodukte')}
                      className="w-full flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-sm text-amber-700 dark:text-amber-400">{products.noTeam.length} ohne Team</span>
                    </button>
                  )}
                  {stats.unassigned.length > 0 && (
                    <button
                      onClick={() => handleNavigate('personen')}
                      className="w-full flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{stats.unassigned.length} nicht zugeordnet</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Middle Column - Teams & Personen */}
          <div className="col-span-12 lg:col-span-6 space-y-4">

            {/* Top Auslastung */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide font-display">
                  Auslastung M13-Team
                </div>
                <button
                  onClick={() => handleNavigate('personen')}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Alle →
                </button>
              </div>
              <div className="space-y-2">
                {stats.workload.slice(0, 8).map((person, idx) => (
                  <div key={person.id} className="flex items-center gap-3">
                    <span className="w-4 text-xs text-gray-400 dark:text-gray-500">{idx + 1}</span>
                    <span className="w-28 text-sm text-gray-900 dark:text-white truncate">{person.name?.split(' ')[0]}</span>
                    <MiniBar
                      value={person.auslastung}
                      color={person.auslastung > 100 ? 'red' : person.auslastung > 85 ? 'amber' : person.auslastung < 50 ? 'gray' : 'emerald'}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Live */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-emerald-50/50 dark:bg-emerald-900/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Live</span>
                  <span className="text-xs text-gray-400">{products.live.length}</span>
                </div>
                <div className="p-2 max-h-48 overflow-y-auto">
                  {products.live.slice(0, 6).map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleNavigate('datenprodukte', p.id)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <span className="text-sm text-gray-900 dark:text-white truncate">{p.name}</span>
                      <span className="text-xs text-gray-400">{p.teamSize}P · {p.totalHours}h</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* In Entwicklung */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/10">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">In Entwicklung</span>
                  <span className="text-xs text-gray-400">{products.inDev.length}</span>
                </div>
                <div className="p-2 max-h-48 overflow-y-auto">
                  {products.inDev.slice(0, 6).map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleNavigate('datenprodukte', p.id)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <span className="text-sm text-gray-900 dark:text-white truncate">{p.name}</span>
                      <div className="flex items-center gap-2">
                        {p.teamSize === 0 && <span className="px-1.5 py-0.5 text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">!</span>}
                        <span className="text-xs text-gray-400">{p.teamSize}P · {p.totalHours}h</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* In Planung - Collapsible */}
            {products.planned.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'planned' ? null : 'planned')}
                  className="w-full flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">In Planung</span>
                  <span className="text-xs text-gray-400">{products.planned.length}</span>
                  <svg className={`ml-auto w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'planned' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSection === 'planned' && (
                  <div className="p-2 grid grid-cols-2 gap-1">
                    {products.planned.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleNavigate('datenprodukte', p.id)}
                        className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <span className="text-sm text-gray-900 dark:text-white truncate">{p.name}</span>
                        <span className="text-xs text-gray-400">{p.teamSize}P</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Skills, Rollen, Abwesenheiten */}
          <div className="col-span-12 lg:col-span-3 space-y-4">

            {/* Abwesenheiten */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 font-display">
                Abwesenheiten
              </div>

              {/* Heute */}
              <div className="mb-3">
                <button
                  onClick={() => absences.current.length > 4 && setExpandedAbsences(prev => ({ ...prev, current: !prev.current }))}
                  className={`flex items-center gap-2 mb-2 w-full text-left ${absences.current.length > 4 ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Heute</span>
                  <span className="text-xs text-gray-400">{absences.current.length}</span>
                  {absences.current.length > 4 && (
                    <svg className={`w-3 h-3 text-gray-400 ml-auto transition-transform ${expandedAbsences.current ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
                {absences.current.length > 0 ? (
                  <div className="space-y-1 pl-3">
                    {(expandedAbsences.current ? absences.current : absences.current.slice(0, 4)).map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300 truncate">{p.name?.split(' ')[0]}</span>
                        <span className="text-xs text-gray-400">bis {formatDate(p.endDate)}</span>
                      </div>
                    ))}
                    {!expandedAbsences.current && absences.current.length > 4 && (
                      <button
                        onClick={() => setExpandedAbsences(prev => ({ ...prev, current: true }))}
                        className="text-xs text-ard-blue-600 hover:text-ard-blue-700 dark:text-ard-blue-400"
                      >
                        +{absences.current.length - 4} weitere anzeigen
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 pl-3">Alle da</p>
                )}
              </div>

              {/* Diese Woche */}
              {absences.upcoming.length > 0 && (
                <div>
                  <button
                    onClick={() => absences.upcoming.length > 3 && setExpandedAbsences(prev => ({ ...prev, upcoming: !prev.upcoming }))}
                    className={`flex items-center gap-2 mb-2 w-full text-left ${absences.upcoming.length > 3 ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Diese Woche</span>
                    <span className="text-xs text-gray-400">{absences.upcoming.length}</span>
                    {absences.upcoming.length > 3 && (
                      <svg className={`w-3 h-3 text-gray-400 ml-auto transition-transform ${expandedAbsences.upcoming ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                  <div className="space-y-1 pl-3">
                    {(expandedAbsences.upcoming ? absences.upcoming : absences.upcoming.slice(0, 3)).map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300 truncate">{p.name?.split(' ')[0]}</span>
                        <span className="text-xs text-gray-400">ab {formatDate(p.startDate)}</span>
                      </div>
                    ))}
                    {!expandedAbsences.upcoming && absences.upcoming.length > 3 && (
                      <button
                        onClick={() => setExpandedAbsences(prev => ({ ...prev, upcoming: true }))}
                        className="text-xs text-ard-blue-600 hover:text-ard-blue-700 dark:text-ard-blue-400"
                      >
                        +{absences.upcoming.length - 3} weitere anzeigen
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Skills Übersicht */}
            {skillStats.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide font-display">
                    Skills im Team
                  </div>
                  <button
                    onClick={() => handleNavigate('skills')}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    Alle →
                  </button>
                </div>
                <div className="space-y-2">
                  {skillStats.slice(0, 6).map(skill => (
                    <div key={skill.id} className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: skill.color || '#6b7280' }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{skill.name}</span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{skill.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rollen Übersicht */}
            {roleStats.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide font-display">
                    Rollen-Verteilung
                  </div>
                  <button
                    onClick={() => handleNavigate('rollen')}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    Alle →
                  </button>
                </div>
                <div className="space-y-2">
                  {roleStats.filter(r => r.count > 0).slice(0, 6).map(role => (
                    <div key={role.id} className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: role.color || '#6b7280' }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{role.name}</span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{role.count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
