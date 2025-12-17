import React from 'react';

export const PersonDetailsModal = ({ person, skills, datenprodukte, zuordnungen, rollen, onClose }) => {
  if (!person) return null;

  // Finde Skills der Person
  const personSkills = (person.skillIds || [])
    .map(skillId => skills.find(s => s.id === skillId))
    .filter(Boolean);

  // Finde Zuordnungen der Person
  const personZuordnungen = zuordnungen.filter(z => z.personId === person.id);

  // Gruppiere nach Datenprodukt
  const produktZuordnungen = personZuordnungen.map(z => {
    const produkt = datenprodukte.find(dp => dp.id === z.datenproduktId);
    const rolle = rollen.find(r => r.id === z.rolleId);
    return {
      produkt: produkt?.name || 'Unbekannt',
      rolle: rolle?.name || 'Unbekannt',
      stunden: z.stunden || 0
    };
  });

  const totalStunden = produktZuordnungen.reduce((sum, z) => sum + z.stunden, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-ard-blue-600 to-ard-blue-700 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            {person.avatarUrl ? (
              <img
                src={person.avatarUrl}
                alt={person.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
              />
            ) : (
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold">
                  {person.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{person.name}</h2>
              {person.isM13 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-500 text-white mt-1">
                  M13
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Kontaktinformationen */}
          {person.email && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Kontakt</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <a
                  href={`mailto:${person.email}`}
                  className="text-ard-blue-600 hover:underline flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {person.email}
                </a>
              </div>
            </div>
          )}

          {/* Kategorien */}
          {person.kategorien && person.kategorien.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Kategorien</h3>
              <div className="flex flex-wrap gap-2">
                {person.kategorien.map((kat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-ard-blue-100 text-ard-blue-700 border border-ard-blue-200"
                  >
                    {kat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {personSkills.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {personSkills.map((skill) => (
                  <span
                    key={skill.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border"
                    style={{
                      backgroundColor: `${skill.color}20`,
                      borderColor: skill.color,
                      color: '#1f2937'
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: skill.color }}
                    />
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Auslastung */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Auslastung</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Wochenstunden</p>
                  <p className="text-xl font-bold text-gray-900">{person.wochenstunden || 31}h</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Gebucht</p>
                  <p className="text-xl font-bold text-gray-900">{totalStunden}h</p>
                </div>
              </div>
              {person.wochenstunden && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Auslastung</span>
                    <span className="font-semibold">
                      {Math.round((totalStunden / person.wochenstunden) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-full rounded-full ${
                        (totalStunden / person.wochenstunden) > 1
                          ? 'bg-red-500'
                          : (totalStunden / person.wochenstunden) > 0.8
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((totalStunden / person.wochenstunden) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Zuordnungen */}
          {produktZuordnungen.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Datenprodukt-Zuordnungen ({produktZuordnungen.length})
              </h3>
              <div className="space-y-2">
                {produktZuordnungen.map((z, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{z.produkt}</p>
                      <p className="text-sm text-gray-600">{z.rolle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-ard-blue-600">{z.stunden}h</p>
                      <p className="text-xs text-gray-600">pro Woche</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terminbuchungslink */}
          {person.terminbuchungsLink && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Terminbuchung</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <a
                  href={person.terminbuchungsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ard-blue-600 hover:underline flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Termin buchen
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-ard-blue-600 hover:bg-ard-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
