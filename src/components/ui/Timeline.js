import React, { useMemo, useState } from 'react';

// Hilfsfunktion um Initialen zu generieren
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Farben für Avatare basierend auf Namen (konsistent)
const avatarColors = [
  'bg-accent-500',
  'bg-purple-accent-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
];

const getAvatarColor = (name) => {
  if (!name) return avatarColors[0];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length];
};

// Tooltip Komponente
const Tooltip = ({ children, content, visible }) => {
  if (!visible) return children;

  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
};

const Timeline = ({
  personen = [],
  zuordnungen = [],
  datenprodukte = [],
  rollen = [],
  onPersonClick,
  onProductClick,
  maxBars = 5,
  showHours = true,
}) => {
  const [hoveredBar, setHoveredBar] = useState(null);

  // Berechne Timeline-Daten für jede Person
  const timelineData = useMemo(() => {
    return personen
      .filter(person => person && person.id)
      .map(person => {
        // Finde alle Zuordnungen für diese Person
        const personZuordnungen = zuordnungen.filter(z => z.personId === person.id);

        // Mappe Zuordnungen zu Balken
        const bars = personZuordnungen.map(z => {
          const produkt = datenprodukte.find(dp => dp.id === z.datenproduktId);
          const rolle = rollen.find(r => r.id === z.rolleId);

          return {
            id: z.id,
            produktId: z.datenproduktId,
            produktName: produkt?.name || 'Unbekannt',
            produktStatus: produkt?.status,
            rolleId: z.rolleId,
            rolleName: rolle?.name || 'Unbekannt',
            rolleColor: rolle?.color || '#a855f7',
            stunden: z.stunden || 0,
          };
        }).filter(bar => bar.stunden > 0);

        // Berechne Gesamtstunden
        const totalStunden = bars.reduce((sum, bar) => sum + bar.stunden, 0);

        return {
          id: person.id,
          name: person.name,
          kategorien: person.kategorien || [],
          isM13: person.isM13,
          wochenstunden: person.wochenstunden || 31,
          bars,
          totalStunden,
        };
      })
      .filter(person => person.bars.length > 0) // Nur Personen mit Zuordnungen
      .sort((a, b) => b.totalStunden - a.totalStunden); // Nach Stunden sortieren
  }, [personen, zuordnungen, datenprodukte, rollen]);

  // Maximale Stunden für Skalierung
  const maxStunden = useMemo(() => {
    const max = Math.max(...timelineData.map(p => p.totalStunden), 40);
    return Math.ceil(max / 10) * 10; // Auf nächste 10er-Stelle aufrunden
  }, [timelineData]);

  if (timelineData.length === 0) {
    return (
      <div className="timeline-container">
        <div className="p-8 text-center text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <p>Keine Zuordnungen vorhanden</p>
          <p className="text-sm mt-2">Erstelle Zuordnungen um die Timeline zu sehen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      {/* Header mit Stundenleiste */}
      <div className="timeline-header">
        <div className="flex items-center">
          <div className="w-48 flex-shrink-0 text-sm font-medium text-gray-600">
            Mitarbeiter
          </div>
          <div className="flex-1 flex justify-between text-xs text-gray-400 px-2">
            <span>0h</span>
            <span>{maxStunden / 4}h</span>
            <span>{maxStunden / 2}h</span>
            <span>{(maxStunden * 3) / 4}h</span>
            <span>{maxStunden}h</span>
          </div>
        </div>
      </div>

      {/* Timeline Rows */}
      <div className="max-h-[400px] overflow-y-auto">
        {timelineData.map((person) => (
          <div key={person.id} className="timeline-row">
            {/* Person Info */}
            <div
              className="w-48 flex-shrink-0 flex items-center gap-3 cursor-pointer"
              onClick={() => onPersonClick?.(person)}
            >
              <div className={`timeline-avatar ${getAvatarColor(person.name)} text-white`}>
                {getInitials(person.name)}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-900 truncate text-sm">
                  {person.name}
                </div>
                <div className="text-xs text-gray-500">
                  {person.totalStunden}h / {person.wochenstunden}h
                  {person.isM13 && (
                    <span className="ml-2 dashboard-badge-purple">M13</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bars Container */}
            <div className="flex-1 flex items-center gap-1 px-2">
              {person.bars.slice(0, maxBars).map((bar, index) => {
                const widthPercent = (bar.stunden / maxStunden) * 100;
                const isHovered = hoveredBar === `${person.id}-${bar.id}`;

                return (
                  <div
                    key={bar.id}
                    className="timeline-bar relative flex items-center justify-center overflow-hidden"
                    style={{
                      width: `${Math.max(widthPercent, 3)}%`,
                      backgroundColor: bar.rolleColor,
                      minWidth: '40px',
                    }}
                    onMouseEnter={() => setHoveredBar(`${person.id}-${bar.id}`)}
                    onMouseLeave={() => setHoveredBar(null)}
                    onClick={() => onProductClick?.(bar)}
                  >
                    <span className="text-white text-xs font-medium truncate px-2">
                      {showHours && `${bar.stunden}h`}
                    </span>

                    {/* Hover Tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg">
                        <div className="font-semibold">{bar.produktName}</div>
                        <div className="text-gray-300 mt-1">
                          {bar.rolleName} • {bar.stunden}h/Woche
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* "Mehr" Indikator wenn mehr Bars existieren */}
              {person.bars.length > maxBars && (
                <div className="text-xs text-gray-400 ml-2">
                  +{person.bars.length - maxBars} weitere
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer mit Legende */}
      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="text-gray-500">Legende:</span>
          {rollen.slice(0, 6).map(rolle => (
            <div key={rolle.id} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: rolle.color || '#a855f7' }}
              />
              <span className="text-gray-600">{rolle.name}</span>
            </div>
          ))}
          {rollen.length > 6 && (
            <span className="text-gray-400">+{rollen.length - 6} weitere</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
