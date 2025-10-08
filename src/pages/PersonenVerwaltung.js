// src/pages/PersonenVerwaltung.js - Production Version
import React, { useState, useEffect, useRef } from "react";
import { useData } from "../context/DataProvider";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { TagInput } from "../components/ui/TagInput";
import { ExcelUploadModal } from "../components/ExcelUploadModal";

// CSS Keyframes for search animations
const searchAnimationStyles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes slideInScale {
    0% {
      opacity: 0;
      transform: translateY(-20px) scale(0.9);
    }
    50% {
      opacity: 1;
      transform: translateY(-10px) scale(1.02);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Inject styles into document
if (typeof document !== 'undefined') {
  const existingStyles = document.getElementById('search-animation-styles');
  if (!existingStyles) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'search-animation-styles';
    styleSheet.textContent = searchAnimationStyles;
    document.head.appendChild(styleSheet);
  }
}


// Simple Search Component
const SimpleSearch = ({ searchTerm, setSearchTerm, suggestions, onSuggestionClick }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setActiveSuggestion(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(value.length > 0);
    setActiveSuggestion(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
        onSuggestionClick(suggestions[activeSuggestion]);
        setActiveSuggestion(-1);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onSuggestionClick(suggestion);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    // Keep focus on input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Suche nach Namen, Skills, Datenprodukten..."
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(searchTerm.length > 0)}
          className={`w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-ard-blue-500 focus:border-ard-blue-500 transition-all ${
            searchTerm ? 'pr-10' : 'pr-4'
          }`}
        />
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400">🔍</span>
        </div>
        {/* Clear button */}
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setShowSuggestions(false);
              setActiveSuggestion(-1);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            title="Suche löschen"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-500 px-2 pb-2 font-medium">
              {suggestions.length} Ergebnis{suggestions.length !== 1 ? 'se' : ''} gefunden
            </div>
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.type}-${suggestion.id || index}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSuggestionClick(suggestion);
                }}
                className={`px-3 py-3 cursor-pointer transition-colors rounded-lg mb-1 ${
                  index === activeSuggestion
                    ? 'bg-ard-blue-50 text-ard-blue-900'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{suggestion.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        suggestion.type === 'person' ? 'bg-ard-blue-100 text-ard-blue-700' :
                        suggestion.type === 'skill' ? 'bg-green-100 text-green-700' :
                        suggestion.type === 'datenprodukt' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {suggestion.type === 'person' ? 'Person' :
                         suggestion.type === 'skill' ? 'Skill' :
                         suggestion.type === 'datenprodukt' ? 'Produkt' :
                         suggestion.type}
                      </span>
                      {suggestion.details && (
                        <span className="text-xs text-gray-500 truncate">{suggestion.details}</span>
                      )}
                    </div>
                    {suggestion.matchedField && (
                      <div className="text-xs text-gray-400 mt-1 italic">
                        gefunden in {suggestion.matchedField}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const WorkloadIndicator = ({ person, zuordnungen }) => {
  const verfügbareStunden = person.wochenstunden || 31;
  const gebuchteStunden = zuordnungen
    .filter(z => z.personId === person.id)
    .reduce((sum, z) => sum + (z.stunden || 0), 0);
  
  const auslastung = verfügbareStunden > 0 ? (gebuchteStunden / verfügbareStunden) * 100 : 0;
  const isUnderbooked = auslastung < 20;
  
  // Moderne Farben basierend auf Auslastung
  let barColor = "bg-gradient-to-r from-emerald-400 to-emerald-500"; // Normal (20-100%)
  let bgColor = "bg-emerald-50";
  let textColor = "text-emerald-700";
  
  if (isUnderbooked) {
    barColor = "bg-gradient-to-r from-red-400 to-red-500"; // Unterbuchung (<20%)
    bgColor = "bg-red-50";
    textColor = "text-red-700";
  } else if (auslastung > 100) {
    barColor = "bg-gradient-to-r from-amber-400 to-orange-500"; // Überbucht (>100%)
    bgColor = "bg-amber-50";
    textColor = "text-amber-700";
  }

  return (
    <div className={`mb-4 p-3 rounded-xl ${bgColor} border border-gray-100`}>
      <div className="flex justify-between items-center mb-2">
        <span className={`text-xs font-semibold ${textColor}`}>Auslastung</span>
        <span className={`text-xs font-medium ${textColor}`}>
          {gebuchteStunden}h / {verfügbareStunden}h ({Math.round(auslastung)}%)
        </span>
      </div>
      <div className="w-full bg-white/60 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor} shadow-sm`}
          style={{ width: `${Math.min(auslastung, 100)}%` }}
        />
      </div>
      {auslastung > 100 && (
        <div className="text-xs text-amber-700 mt-2 font-medium">
          ⚠️ Überbucht um {Math.round(auslastung - 100)}%
        </div>
      )}
      {isUnderbooked && gebuchteStunden > 0 && (
        <div className="text-xs text-red-700 mt-2 font-medium">
          📉 Unterausgelastet
        </div>
      )}
    </div>
  );
};


const PersonEintrag = ({
  person,
  onEdit,
  onDeleteInitiation,
  onSkillClick,
  onShowDetails,
  sortBy,
  getNextAbsenceInfo,
}) => {
  const { name, email, msTeamsLink, wochenstunden, kategorien } = person;
  const { vacations, zuordnungen } = useData();

  // Kreis-Indikator für kompakte Ansicht
  const getKreisIndicator = () => {
    if (!kategorien || kategorien.length === 0) return null;
    return kategorien.map(k => k.charAt(0)).join('');
  };

  // Anzahl Datenprodukte berechnen
  const getDataProductCount = () => {
    const personAssignments = zuordnungen.filter(z => z.personId === person.id);
    const uniqueDataProducts = new Set(personAssignments.map(z => z.datenproduktId));
    return uniqueDataProducts.size;
  };

  // Prüfe ob Person aktuell abwesend ist (vereinfacht für Kachel)
  const isCurrentlyAbsent = () => {
    const today = new Date();
    const searchKeys = [
      name.toLowerCase(),
      name.toLowerCase().replace(/\s+/g, ""),
      email?.toLowerCase(),
      email?.split("@")[0]?.toLowerCase(),
    ].filter(Boolean);

    for (const key of searchKeys) {
      if (vacations[key]) {
        const hasCurrentVacation = vacations[key].some((vacation) => {
          const start = new Date(vacation.start);
          const end = new Date(vacation.end);
          return today >= start && today <= end;
        });
        if (hasCurrentVacation) return true;
      }
    }
    return false;
  };

  return (
    <div
      className={`bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-lg border border-gray-200 hover:border-gray-300 overflow-hidden cursor-pointer ${
        isCurrentlyAbsent() ? "bg-gradient-to-br from-red-50 to-red-100/30 border-red-200" : ""
      }`}
      onClick={() => onShowDetails(person)}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Kreis-Indikator */}
          {getKreisIndicator() && (
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-semibold">
              {getKreisIndicator()}
            </div>
          )}

          {/* Name und Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
              {isCurrentlyAbsent() && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-red-500 text-white">
                  Abwesend
                </span>
              )}
              {/* Datenprodukte-Tag bei entsprechender Sortierung */}
              {sortBy === 'datenprodukte' && getDataProductCount() > 0 && (
                <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {getDataProductCount()}
                </span>
              )}
            </div>

            {/* Abwesenheits-Info bei Sortierung nach Abwesenheit */}
            {sortBy === 'abwesenheit' && (() => {
              const nextAbsenceInfo = getNextAbsenceInfo(person);
              if (nextAbsenceInfo) {
                return (
                  <div className="text-xs text-gray-500 mt-1">
                    Abwesend ab {nextAbsenceInfo.startDate.toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit"
                    })}
                  </div>
                );
              }
              return null;
            })()}
            
            {/* Teams Link unter dem Namen */}
            {msTeamsLink && (
              <a
                href={msTeamsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-ard-blue-600 transition-colors mt-0.5 block"
                onClick={(e) => e.stopPropagation()}
              >
                Nachricht in Teams senden
              </a>
            )}
            
            {/* Auslastungsbalken - kompakt - nur für M13 */}
            {person.isM13 && (
              <div className="mt-2">
                {(() => {
                  const verfügbareStunden = wochenstunden || 31;
                  const gebuchteStunden = zuordnungen
                    .filter(z => z.personId === person.id)
                    .reduce((sum, z) => sum + (z.stunden || 0), 0);
                  const auslastung = verfügbareStunden > 0 ? (gebuchteStunden / verfügbareStunden) * 100 : 0;
                  const isUnderbooked = auslastung < 20;

                  let barColor = "bg-gradient-to-r from-emerald-400 to-emerald-500";
                  if (isUnderbooked) {
                    barColor = "bg-gradient-to-r from-red-400 to-red-500";
                  } else if (auslastung > 100) {
                    barColor = "bg-gradient-to-r from-amber-400 to-orange-500";
                  }

                  return (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                          style={{ width: `${Math.min(auslastung, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-medium min-w-0 flex-shrink-0">
                        {Math.round(auslastung)}%
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
        
        {/* Details-Indikator */}
        <div className="text-gray-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const PersonDetailsModal = ({ person, isOpen, onClose, onEdit, onDeleteInitiation, onSkillClick }) => {
  const {
    datenprodukte,
    zuordnungen,
    rollen,
    skills: allSkills,
    vacations,
  } = useData();

  if (!isOpen || !person) return null;

  const { name, email, skillIds, msTeamsLink, wochenstunden, isM13, kategorien } = person;

  // Verbesserte Abwesenheits-Logik
  const getPersonVacations = () => {
    const today = new Date();
    const searchKeys = [
      name.toLowerCase(),
      name.toLowerCase().replace(/\s+/g, ""),
      email?.toLowerCase(),
      email?.split("@")[0]?.toLowerCase(),
    ].filter(Boolean);

    let personVacations = [];

    for (const key of searchKeys) {
      if (vacations[key]) {
        personVacations = [...personVacations, ...vacations[key]];
      }
    }

    const uniqueVacations = personVacations.filter((vacation, index, self) => {
      const vacationEnd = new Date(vacation.end);
      const isUnique =
        self.findIndex(
          (v) => v.start === vacation.start && v.end === vacation.end
        ) === index;

      return isUnique && vacationEnd >= today;
    });

    return uniqueVacations.sort(
      (a, b) => new Date(a.start) - new Date(b.start)
    );
  };

  const upcomingVacations = getPersonVacations();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const personAssignments = zuordnungen
    .filter((z) => z.personId === person.id)
    .map((assignment) => {
      const produkt = datenprodukte.find(
        (dp) => dp.id === assignment.datenproduktId
      );
      const rolleInProdukt = rollen.find((r) => r.id === assignment.rolleId);
      return {
        produktName: produkt?.name || "...",
        rolleName: rolleInProdukt?.name || "...",
        rolleColor: rolleInProdukt?.color || "#6B7280",
        assignmentId: assignment.id,
      };
    })
    .filter((a) => a.produktName !== "...");

  return (
    <div
      className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {name}
                {email && (
                  <span className="text-lg font-normal text-gray-600 ml-2">
                    (<a
                      href={`mailto:${email}`}
                      className="hover:text-ard-blue-600 transition-colors"
                    >
                      {email}
                    </a>)
                  </span>
                )}
              </h2>
              {msTeamsLink && (
                <a
                  href={msTeamsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-500 hover:text-ard-blue-600 transition-colors mt-0.5 block"
                >
                  Nachricht in Teams senden
                </a>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {wochenstunden && (
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold bg-gradient-to-r from-ard-blue-50 to-ard-blue-100 text-ard-blue-700 border border-ard-blue-200">
                ⏰ {wochenstunden}h/Woche
              </span>
            </div>
          )}

          {(isM13 || (kategorien && kategorien.length > 0)) && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {isM13 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200">
                    ✓ M13
                  </span>
                )}
                {kategorien && kategorien.map((kategorie) => (
                  <button
                    key={kategorie}
                    onClick={() => {
                      onClose();
                      // Use setTimeout to ensure modal is closed before setting search term
                      setTimeout(() => onSkillClick(kategorie), 10);
                    }}
                    className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200 hover:from-purple-100 hover:to-purple-200 hover:scale-105 transition-all duration-200 cursor-pointer"
                    title={`Nach Kreis "${kategorie}" filtern`}
                  >
                    {kategorie}
                  </button>
                ))}
              </div>
            </div>
          )}

          {person.isM13 && <WorkloadIndicator person={person} zuordnungen={zuordnungen} />}

          {upcomingVacations.length > 0 && (
            <div className="mb-6">
              <p className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span>🏖️</span>
                Anstehende Abwesenheiten
              </p>
              <div className="space-y-3">
                {upcomingVacations.slice(0, 5).map((vacation, index) => {
                  const start = new Date(vacation.start);
                  const end = new Date(vacation.end);
                  const isCurrentVacation =
                    new Date() >= start && new Date() <= end;

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        isCurrentVacation
                          ? "bg-gradient-to-r from-red-50 to-red-100 border-red-200 text-red-800"
                          : "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-800"
                      }`}
                    >
                      <div className="font-semibold mb-1">
                        {vacation.summary || "Abwesenheit"}
                      </div>
                      <div className="text-sm opacity-75">
                        {formatDate(vacation.start)} - {formatDate(vacation.end)}
                      </div>
                    </div>
                  );
                })}
                {upcomingVacations.length > 5 && (
                  <div className="text-sm text-gray-500 italic">
                    +{upcomingVacations.length - 5} weitere Abwesenheiten
                  </div>
                )}
              </div>
            </div>
          )}

          {skillIds && skillIds.length > 0 && (
            <div className="mb-6">
              <p className="text-lg font-semibold text-gray-700 mb-3">Skills</p>
              <div className="flex flex-wrap gap-2">
                {skillIds.map((id) => {
                  const skill = allSkills.find((s) => s.id === id);
                  if (!skill) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        onClose();
                        // Use setTimeout to ensure modal is closed before setting search term
                        setTimeout(() => onSkillClick(skill.name), 10);
                      }}
                      className="px-3 py-2 rounded-lg text-sm font-semibold hover:scale-105 transition-all duration-200 shadow-sm border"
                      style={{ 
                        backgroundColor: skill.color, 
                        color: "#1f2937",
                        borderColor: skill.color
                      }}
                      title={`Nach Skill "${skill.name}" filtern`}
                    >
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {personAssignments.length > 0 && (
            <div className="mb-6">
              <p className="text-lg font-semibold text-gray-700 mb-3">
                Arbeitet an
              </p>
              <div className="space-y-2">
                {personAssignments.map((a) => {
                  const assignment = zuordnungen.find(z => z.id === a.assignmentId);
                  const stunden = assignment?.stunden || 0;
                  return (
                    <div
                      key={a.assignmentId}
                      className="bg-gradient-to-r from-indigo-50 to-ard-blue-50 p-3 rounded-lg border border-indigo-100"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{a.produktName}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-gray-600 text-sm">als</span>
                            <span 
                              className="inline-flex items-center px-2 py-1 rounded text-sm font-medium text-white"
                              style={{ backgroundColor: a.rolleColor }}
                            >
                              {a.rolleName}
                            </span>
                          </div>
                        </div>
                        {stunden > 0 && (
                          <div className="bg-ard-blue-500 text-white px-3 py-1 rounded text-sm font-semibold">
                            {stunden}h
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                onEdit(person);
                onClose();
              }}
              className="px-4 py-2 text-ard-blue-600 hover:text-ard-blue-700 hover:bg-ard-blue-50 font-medium rounded-lg transition-all duration-200"
            >
              Bearbeiten
            </button>
            <button
              onClick={() => {
                onDeleteInitiation(person);
                onClose();
              }}
              className="px-4 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 font-medium rounded-lg transition-all duration-200"
            >
              Löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PersonFormular = ({ personToEdit, onFormClose }) => {
  const {
    fuegePersonHinzu,
    aktualisierePerson,
    skills: allSkills,
    fuegeSkillHinzu,
    error: globalError,
    setError,
  } = useData();

  const [name, setName] = useState(personToEdit?.name || "");
  const [email, setEmail] = useState(personToEdit?.email || "");
  const [skillIds, setSkillIds] = useState(personToEdit?.skillIds || []);
  const [wochenstunden, setWochenstunden] = useState(personToEdit?.wochenstunden || 31);
  const [msTeamsEmail, setMsTeamsEmail] = useState(() => {
    if (personToEdit?.msTeamsLink) {
      const emailMatch = personToEdit.msTeamsLink.match(/users=([^&]+)/);
      return emailMatch ? emailMatch[1] : personToEdit.email || "";
    }
    return personToEdit?.email || "";
  });
  const [isM13, setIsM13] = useState(personToEdit?.isM13 || false);
  const [kategorien, setKategorien] = useState(personToEdit?.kategorien || []);
  const [validationError, setValidationError] = useState("");

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setValidationError("Bitte eine gültige E-Mail-Adresse eingeben.");
      return false;
    }
    if (name.trim().length < 2 || name.trim().length > 50) {
      setValidationError("Der Name muss zwischen 2 und 50 Zeichen lang sein.");
      return false;
    }
    if (wochenstunden < 1 || wochenstunden > 80) {
      setValidationError("Wochenstunden müssen zwischen 1 und 80 liegen.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError("");
    setError(null);

    if (!validateForm()) {
      return;
    }

    const finalMsTeamsLink = msTeamsEmail.trim()
      ? `msteams:/l/chat/0/0?users=${msTeamsEmail.trim()}`
      : "";
    const personData = {
      name: name.trim(),
      email: email.trim(),
      skillIds,
      wochenstunden: Number(wochenstunden),
      msTeamsLink: finalMsTeamsLink,
      isM13,
      kategorien,
    };

    const success = personToEdit
      ? await aktualisierePerson(personToEdit.id, personData)
      : await fuegePersonHinzu(personData);

    if (success) {
      onFormClose?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-8 bg-white rounded-2xl shadow-xl">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">
        {personToEdit ? "Person bearbeiten" : "Neue Person hinzufügen"}
      </h2>
      {(validationError || globalError) && (
        <div
          className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-800 px-6 py-4 rounded-xl mb-6"
          role="alert"
        >
          {validationError || globalError}
        </div>
      )}
      <div>
        <label
          htmlFor="person-name"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Name
        </label>
        <input
          id="person-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-ard-blue-500 focus:border-ard-blue-500 transition-all"
        />
      </div>
      <div>
        <label
          htmlFor="person-email"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          E-Mail
        </label>
        <input
          id="person-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-ard-blue-500 focus:border-ard-blue-500 transition-all"
        />
      </div>
      <div>
        <label
          htmlFor="person-wochenstunden"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Wochenstunden
        </label>
        <input
          id="person-wochenstunden"
          type="number"
          min="1"
          max="80"
          step="0.5"
          value={wochenstunden}
          onChange={(e) => setWochenstunden(e.target.value)}
          required
          className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-ard-blue-500 focus:border-ard-blue-500 transition-all"
        />
        <p className="mt-2 text-xs text-gray-500">Anzahl der Arbeitsstunden pro Woche (Standard: 31, Bereich: 1-80).</p>
      </div>
      <div>
        <label
          htmlFor="msTeamsEmail"
          className="block text-sm font-medium text-gray-700"
        >
          MS Teams E-Mail
        </label>
        <input
          id="msTeamsEmail"
          type="email"
          value={msTeamsEmail}
          onChange={(e) => setMsTeamsEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
        <p className="mt-1 text-xs text-gray-500">Für den Chat-Link.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Skills
        </label>
        <TagInput
          selectedSkillIds={skillIds}
          setSelectedSkillIds={setSkillIds}
          allSkills={allSkills}
          onCreateSkill={fuegeSkillHinzu}
        />
      </div>
      
      <div>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={isM13}
            onChange={(e) => setIsM13(e.target.checked)}
            className="w-4 h-4 text-ard-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-ard-blue-500 focus:ring-2"
          />
          <span className="text-sm font-medium text-gray-700">M13</span>
        </label>
        <p className="mt-1 text-xs text-gray-500">Mitarbeiter mit M13-Status</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kreise
        </label>
        <div className="space-y-2">
          {['Plattform', 'Datenprodukt', 'Governance'].map((kategorie) => (
            <label key={kategorie} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={kategorien.includes(kategorie)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setKategorien([...kategorien, kategorie]);
                  } else {
                    setKategorien(kategorien.filter(k => k !== kategorie));
                  }
                }}
                className="w-4 h-4 text-ard-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-ard-blue-500 focus:ring-2"
              />
              <span className="text-sm text-gray-700">{kategorie}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">Mehrfachauswahl möglich</p>
      </div>
      <div className="flex justify-end space-x-4 pt-6">
        {onFormClose && (
          <button
            type="button"
            onClick={onFormClose}
            className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
          >
            Abbrechen
          </button>
        )}
        <button
          type="submit"
          className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-xl shadow-lg font-semibold transition-all duration-200"
        >
          {personToEdit ? "Speichern" : "Hinzufügen"}
        </button>
      </div>
    </form>
  );
};

const PersonenListe = ({
  personenToDisplay,
  onEditPerson,
  onDeleteInitiation,
  onSkillClick,
  onShowDetails,
}) => {
  const { loading, error, zuordnungen, vacations } = useData();
  const [sortBy, setSortBy] = useState('name'); // 'name', 'auslastung', 'abwesenheit', 'datenprodukte'
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSortDropdown && !event.target.closest('.sort-dropdown')) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortDropdown]);

  // Funktion um Auslastung zu berechnen
  const calculateAuslastung = (person) => {
    const verfügbareStunden = person.wochenstunden || 31;
    const gebuchteStunden = zuordnungen
      .filter(z => z.personId === person.id)
      .reduce((sum, z) => sum + (z.stunden || 0), 0);
    return verfügbareStunden > 0 ? (gebuchteStunden / verfügbareStunden) * 100 : 0;
  };

  // Funktion um nächste Abwesenheit zu ermitteln
  const getNextAbsenceDate = (person) => {
    const today = new Date();
    const searchKeys = [
      person.name.toLowerCase(),
      person.name.toLowerCase().replace(/\s+/g, ""),
      person.email?.toLowerCase(),
      person.email?.split("@")[0]?.toLowerCase(),
    ].filter(Boolean);

    let personVacations = [];
    for (const key of searchKeys) {
      if (vacations[key]) {
        personVacations = [...personVacations, ...vacations[key]];
      }
    }

    // Remove duplicates and filter for future vacations
    const uniqueFutureVacations = personVacations
      .filter((vacation, index, self) =>
        self.findIndex(v => v.start === vacation.start && v.end === vacation.end) === index
      )
      .filter(vacation => new Date(vacation.start) > today)
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    return uniqueFutureVacations.length > 0 ? new Date(uniqueFutureVacations[0].start) : null;
  };


  // Funktion um Anzahl Datenprodukte zu berechnen
  const getDataProductCount = (person) => {
    const personAssignments = zuordnungen.filter(z => z.personId === person.id);
    const uniqueDataProducts = new Set(personAssignments.map(z => z.datenproduktId));
    return uniqueDataProducts.size;
  };

  // Funktion um nächste Abwesenheit mit Details zu ermitteln
  const getNextAbsenceInfo = (person) => {
    const today = new Date();
    const searchKeys = [
      person.name.toLowerCase(),
      person.name.toLowerCase().replace(/\s+/g, ""),
      person.email?.toLowerCase(),
      person.email?.split("@")[0]?.toLowerCase(),
    ].filter(Boolean);

    let personVacations = [];
    for (const key of searchKeys) {
      if (vacations[key]) {
        personVacations = [...personVacations, ...vacations[key]];
      }
    }

    // Remove duplicates and filter for future vacations
    const uniqueFutureVacations = personVacations
      .filter((vacation, index, self) =>
        self.findIndex(v => v.start === vacation.start && v.end === vacation.end) === index
      )
      .filter(vacation => new Date(vacation.start) > today)
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    if (uniqueFutureVacations.length > 0) {
      return {
        startDate: new Date(uniqueFutureVacations[0].start),
        endDate: new Date(uniqueFutureVacations[0].end)
      };
    }
    return null;
  };

  // Funktion um Personen zu sortieren
  const getSortedPersonen = (personen) => {
    switch (sortBy) {
      case 'auslastung':
        return [...personen].sort((a, b) => calculateAuslastung(b) - calculateAuslastung(a)); // Höchste zuerst
      case 'abwesenheit':
        return [...personen].sort((a, b) => {
          const aNext = getNextAbsenceDate(a);
          const bNext = getNextAbsenceDate(b);
          // Personen mit anstehender Abwesenheit zuerst, dann nach Datum sortiert
          if (aNext && !bNext) return -1;
          if (!aNext && bNext) return 1;
          if (aNext && bNext) return aNext - bNext; // Frühere Abwesenheit zuerst
          return a.name.localeCompare(b.name); // Gleiche Bedingung -> alphabetisch
        });
      case 'datenprodukte':
        return [...personen].sort((a, b) => {
          const aCount = getDataProductCount(a);
          const bCount = getDataProductCount(b);
          if (aCount !== bCount) return bCount - aCount; // Höhere Anzahl zuerst
          return a.name.localeCompare(b.name); // Bei gleicher Anzahl alphabetisch
        });
      default: // 'name'
        return [...personen].sort((a, b) => a.name.localeCompare(b.name)); // Alphabetisch
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  if (error && !personenToDisplay.length)
    return <p className="text-center text-red-500 py-8">{error}</p>;
  if (personenToDisplay.length === 0)
    return (
      <p className="text-center text-gray-500 py-8">Keine Personen gefunden.</p>
    );

  // Gruppiere Personen nach Kreisen und sortiere innerhalb der Gruppen
  const groupedPersonen = personenToDisplay.reduce((groups, person) => {
    const kreise = person.kategorien && person.kategorien.length > 0
      ? person.kategorien
      : ['Ohne Kreis'];

    // Person kann in mehreren Kreisen sein
    kreise.forEach(kreis => {
      if (!groups[kreis]) {
        groups[kreis] = [];
      }
      groups[kreis].push(person);
    });

    return groups;
  }, {});

  // Sortiere Personen innerhalb jeder Gruppe
  Object.keys(groupedPersonen).forEach(kreis => {
    groupedPersonen[kreis] = getSortedPersonen(groupedPersonen[kreis]);
  });

  // Sortiere Gruppen: Erst die bekannten Kreise, dann "Ohne Kreis"
  const sortedKreise = Object.keys(groupedPersonen).sort((a, b) => {
    const order = ['Plattform', 'Datenprodukt', 'Governance', 'Ohne Kreis'];
    const indexA = order.indexOf(a) !== -1 ? order.indexOf(a) : 999;
    const indexB = order.indexOf(b) !== -1 ? order.indexOf(b) : 999;
    return indexA - indexB;
  });

  return (
    <div className="space-y-8">
      {sortedKreise.map((kreis) => (
        <div key={kreis} className="space-y-4">
          {/* Kreis-Header */}
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">{kreis}</h2>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
              {groupedPersonen[kreis].length} Person{groupedPersonen[kreis].length !== 1 ? 'en' : ''}
            </span>

            {/* Sortierungs-Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-1 ml-4 flex-wrap">
              <span className="text-xs text-gray-500 mr-1">Sortieren:</span>
              <button
                onClick={() => setSortBy('name')}
                className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                  sortBy === 'name'
                    ? 'bg-ard-blue-100 text-ard-blue-700 border border-ard-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Nach Namen sortieren"
              >
                Name
              </button>
              <button
                onClick={() => setSortBy('auslastung')}
                className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                  sortBy === 'auslastung'
                    ? 'bg-ard-blue-100 text-ard-blue-700 border border-ard-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Nach Auslastung sortieren (höchste zuerst)"
              >
                Auslastung
              </button>
              <button
                onClick={() => setSortBy('abwesenheit')}
                className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                  sortBy === 'abwesenheit'
                    ? 'bg-ard-blue-100 text-ard-blue-700 border border-ard-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Nach anstehender Abwesenheit sortieren"
              >
                Abwesenheit
              </button>
              <button
                onClick={() => setSortBy('datenprodukte')}
                className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                  sortBy === 'datenprodukte'
                    ? 'bg-ard-blue-100 text-ard-blue-700 border border-ard-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Nach Anzahl Datenprodukte sortieren (mehr zuerst)"
              >
                Datenprodukte
              </button>
            </div>

            {/* Sortierungs-Dropdown - Mobile */}
            <div className="md:hidden relative ml-4 sort-dropdown">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-all"
              >
                <span>Sortieren:</span>
                <span className="text-ard-blue-700 font-semibold">
                  {sortBy === 'name' && 'Name'}
                  {sortBy === 'auslastung' && 'Auslastung'}
                  {sortBy === 'abwesenheit' && 'Abwesenheit'}
                  {sortBy === 'datenprodukte' && 'Datenprodukte'}
                </span>
                <svg className={`w-3 h-3 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {showSortDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                  <button
                    onClick={() => {
                      setSortBy('name');
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                      sortBy === 'name' ? 'text-ard-blue-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    Name
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('auslastung');
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                      sortBy === 'auslastung' ? 'text-ard-blue-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    Auslastung
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('abwesenheit');
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                      sortBy === 'abwesenheit' ? 'text-ard-blue-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    Abwesenheit
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('datenprodukte');
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                      sortBy === 'datenprodukte' ? 'text-ard-blue-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    Datenprodukte
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
          
          {/* Personen-Grid für diesen Kreis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
            {groupedPersonen[kreis].map((person) => (
              <PersonEintrag
                key={`${kreis}-${person.id}`}
                person={person}
                onEdit={onEditPerson}
                onDeleteInitiation={onDeleteInitiation}
                onSkillClick={onSkillClick}
                onShowDetails={onShowDetails}
                sortBy={sortBy}
                getNextAbsenceInfo={getNextAbsenceInfo}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const PersonenVerwaltung = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [personToShowDetails, setPersonToShowDetails] = useState(null);
  const { personen, skills, datenprodukte, zuordnungen, rollen, loeschePerson, vacations } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debouncing for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Comprehensive search function
  const getSearchSuggestions = (term) => {
    if (!term || term.length < 2) return [];
    
    const suggestions = [];
    const lowerTerm = term.toLowerCase();

    // Search in persons (name, email, M13, kategorien)
    personen.forEach(person => {
      if (person.name.toLowerCase().includes(lowerTerm)) {
        suggestions.push({
          id: person.id,
          name: person.name,
          type: 'person',
          details: person.email,
          matchedField: 'Name',
          data: person
        });
      } else if (person.email?.toLowerCase().includes(lowerTerm)) {
        suggestions.push({
          id: person.id,
          name: person.name,
          type: 'person',
          details: person.email,
          matchedField: 'E-Mail',
          data: person
        });
      } else if (person.isM13 && 'm13'.includes(lowerTerm)) {
        suggestions.push({
          id: person.id,
          name: person.name,
          type: 'person',
          details: 'M13-Status',
          matchedField: 'M13',
          data: person
        });
      } else if (person.kategorien?.some(kat => kat.toLowerCase().includes(lowerTerm))) {
        const matchedKategorie = person.kategorien.find(kat => kat.toLowerCase().includes(lowerTerm));
        suggestions.push({
          id: person.id,
          name: person.name,
          type: 'person',
          details: `Kreis: ${matchedKategorie}`,
          matchedField: 'Kreis',
          data: person
        });
      }
    });

    // Search in skills
    skills.forEach(skill => {
      if (skill.name.toLowerCase().includes(lowerTerm)) {
        const personCount = personen.filter(p => 
          p.skillIds && p.skillIds.includes(skill.id)
        ).length;
        suggestions.push({
          id: skill.id,
          name: skill.name,
          type: 'skill',
          details: `${personCount} Person${personCount !== 1 ? 'en' : ''}`,
          matchedField: 'Skill',
          data: skill
        });
      }
    });

    // Search in data products
    datenprodukte.forEach(dp => {
      if (dp.name.toLowerCase().includes(lowerTerm)) {
        const teamSize = zuordnungen.filter(z => z.datenproduktId === dp.id).length;
        suggestions.push({
          id: dp.id,
          name: dp.name,
          type: 'datenprodukt',
          details: `${teamSize} Teammitglied${teamSize !== 1 ? 'er' : ''}`,
          matchedField: 'Datenprodukt',
          data: dp
        });
      } else if (dp.beschreibung?.toLowerCase().includes(lowerTerm)) {
        const teamSize = zuordnungen.filter(z => z.datenproduktId === dp.id).length;
        suggestions.push({
          id: dp.id,
          name: dp.name,
          type: 'datenprodukt',
          details: `${teamSize} Teammitglied${teamSize !== 1 ? 'er' : ''}`,
          matchedField: 'Beschreibung',
          data: dp
        });
      }
    });

    // Search in roles
    rollen.forEach(rolle => {
      if (rolle.name.toLowerCase().includes(lowerTerm)) {
        const assignmentCount = zuordnungen.filter(z => z.rolleId === rolle.id).length;
        suggestions.push({
          id: rolle.id,
          name: rolle.name,
          type: 'rolle',
          details: `${assignmentCount} Zuweisung${assignmentCount !== 1 ? 'en' : ''}`,
          matchedField: 'Rolle',
          data: rolle
        });
      }
    });

    // Limit and sort suggestions
    return suggestions
      .slice(0, 10) // Limit to 10 suggestions
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.name.toLowerCase() === lowerTerm;
        const bExact = b.name.toLowerCase() === lowerTerm;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then by type priority (person > skill > datenprodukt > rolle)
        const typePriority = { person: 0, skill: 1, datenprodukt: 2, rolle: 3 };
        return typePriority[a.type] - typePriority[b.type];
      });
  };

  const suggestions = getSearchSuggestions(searchTerm);

  // Filter persons based on comprehensive search
  const getFilteredPersonen = () => {
    if (!debouncedSearchTerm) return personen;
    
    const lowerTerm = debouncedSearchTerm.toLowerCase();
    
    return personen.filter(person => {
      // Search in person name, email, M13, and kategorien
      if (person.name.toLowerCase().includes(lowerTerm) || 
          person.email?.toLowerCase().includes(lowerTerm) ||
          (person.isM13 && 'm13'.includes(lowerTerm)) ||
          person.kategorien?.some(kat => kat.toLowerCase().includes(lowerTerm))) {
        return true;
      }
      
      // Search in person's skills
      if (person.skillIds) {
        const hasMatchingSkill = person.skillIds.some(skillId => {
          const skill = skills.find(s => s.id === skillId);
          return skill && skill.name.toLowerCase().includes(lowerTerm);
        });
        if (hasMatchingSkill) return true;
      }
      
      // Search in person's data products and roles
      const personAssignments = zuordnungen.filter(z => z.personId === person.id);
      const hasMatchingAssignment = personAssignments.some(assignment => {
        const datenprodukt = datenprodukte.find(dp => dp.id === assignment.datenproduktId);
        const rolle = rollen.find(r => r.id === assignment.rolleId);
        
        return (datenprodukt && (
          datenprodukt.name.toLowerCase().includes(lowerTerm) ||
          datenprodukt.beschreibung?.toLowerCase().includes(lowerTerm)
        )) || (rolle && rolle.name.toLowerCase().includes(lowerTerm));
      });
      
      return hasMatchingAssignment;
    });
  };

  const filteredPersonen = getFilteredPersonen();

  // Function to get currently absent people with their vacation end dates
  const getCurrentlyAbsentPeople = () => {
    const today = new Date();

    return personen.map(person => {
      const searchKeys = [
        person.name.toLowerCase(),
        person.name.toLowerCase().replace(/\s+/g, ""),
        person.email?.toLowerCase(),
        person.email?.split("@")[0]?.toLowerCase(),
      ].filter(Boolean);

      let personVacations = [];

      // Search through all possible keys
      for (const key of searchKeys) {
        if (vacations[key]) {
          personVacations = [...personVacations, ...vacations[key]];
        }
      }

      // Remove duplicates and find current vacation
      const uniqueVacations = personVacations.filter((vacation, index, self) => {
        const vacationEnd = new Date(vacation.end);
        const isUnique =
          self.findIndex(
            (v) => v.start === vacation.start && v.end === vacation.end
          ) === index;

        return isUnique && vacationEnd >= today;
      });

      // Find current vacation and its end date
      const currentVacation = uniqueVacations.find((vacation) => {
        const start = new Date(vacation.start);
        const end = new Date(vacation.end);
        return today >= start && today <= end;
      });

      if (currentVacation) {
        return {
          ...person,
          vacationEndDate: currentVacation.end
        };
      }

      return null;
    }).filter(Boolean);
  };

  // Function to get people who will be absent in the next week
  const getUpcomingAbsentPeople = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return personen.map(person => {
      const searchKeys = [
        person.name.toLowerCase(),
        person.name.toLowerCase().replace(/\s+/g, ""),
        person.email?.toLowerCase(),
        person.email?.split("@")[0]?.toLowerCase(),
      ].filter(Boolean);

      let personVacations = [];

      // Search through all possible keys
      for (const key of searchKeys) {
        if (vacations[key]) {
          personVacations = [...personVacations, ...vacations[key]];
        }
      }

      // Remove duplicates
      const uniqueVacations = personVacations.filter((vacation, index, self) =>
        self.findIndex(
          (v) => v.start === vacation.start && v.end === vacation.end
        ) === index
      );

      // Find upcoming vacation within the next week (but not current)
      const upcomingVacation = uniqueVacations.find((vacation) => {
        const start = new Date(vacation.start);
        const end = new Date(vacation.end);
        // Vacation starts after today and within the next week
        return start > today && start <= nextWeek;
      });

      if (upcomingVacation) {
        return {
          ...person,
          vacationStartDate: upcomingVacation.start,
          vacationEndDate: upcomingVacation.end
        };
      }

      return null;
    }).filter(Boolean);
  };

  const currentlyAbsentPeople = getCurrentlyAbsentPeople();
  const upcomingAbsentPeople = getUpcomingAbsentPeople();

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.name);
    // Note: The search term persists and filters the results accordingly
    // The search remains active until manually cleared with the X button
  };

  const handleAddNewPerson = () => {
    setEditingPerson(null);
    setShowForm(true);
  };
  const handleEditPerson = (person) => {
    setEditingPerson(person);
    setShowForm(true);
  };
  const handleFormClose = () => {
    setShowForm(false);
    setEditingPerson(null);
  };
  const handleDeleteInitiation = (person) => {
    setPersonToDelete(person);
    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    if (personToDelete) {
      await loeschePerson(personToDelete.id);
    }
    setShowDeleteModal(false);
    setPersonToDelete(null);
  };
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPersonToDelete(null);
  };
  const handleSkillClick = (skillName) => {
    setSearchTerm(skillName);
  };
  
  const handleShowDetails = (person) => {
    setPersonToShowDetails(person);
    setShowDetailsModal(true);
  };
  
  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setPersonToShowDetails(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-ard-blue-50/30">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 lg:gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Personenverwaltung</h1>
                <p className="text-gray-600">Verwalte dein Team und überwache die Arbeitsauslastung</p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <div className="flex-1 sm:flex-initial sm:min-w-0 sm:max-w-xs lg:max-w-sm">
                  <SimpleSearch
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    suggestions={suggestions}
                    onSuggestionClick={handleSuggestionClick}
                  />
                </div>

                <div className="flex items-center gap-2 justify-start">
                  <button
                    onClick={handleAddNewPerson}
                    className="w-10 h-10 sm:w-14 sm:h-14 bg-ard-blue-600 hover:bg-white text-white hover:text-ard-blue-600 border-2 border-ard-blue-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group active:scale-95 flex-shrink-0"
                    title="Neue Person hinzufügen"
                  >
                    <svg
                      className="w-4 h-4 sm:w-6 sm:h-6 transition-transform duration-200 group-active:scale-110"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>

                  <button
                    onClick={() => setShowExcelModal(true)}
                    className="w-10 h-10 sm:w-14 sm:h-14 bg-green-600 hover:bg-white text-white hover:text-green-600 border-2 border-green-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group active:scale-95 flex-shrink-0"
                    title="Excel Upload"
                  >
                    <svg
                      className="w-4 h-4 sm:w-6 sm:h-6 transition-transform duration-200 group-active:scale-110"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Absence indicators */}
            <div className="flex flex-col gap-3">
              {/* Upcoming absences - next week */}
              {upcomingAbsentPeople.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-500 font-medium">Kommende Woche abwesend:</span>
                  <div className="flex items-center gap-3 flex-wrap">
                    {upcomingAbsentPeople.slice(0, 5).map((person) => (
                      <button
                        key={person.id}
                        onClick={() => handleShowDetails(person)}
                        className="inline-flex flex-col items-start text-xs font-semibold text-gray-700 hover:text-ard-blue-600 transition-all duration-200 cursor-pointer"
                        title={`Profil von ${person.name} anzeigen`}
                      >
                        <span>{person.name}</span>
                        {person.vacationStartDate && (
                          <span className="text-[10px] opacity-75 font-normal">
                            ab {new Date(person.vacationStartDate).toLocaleDateString("de-DE", {
                              day: "2-digit",
                              month: "2-digit"
                            })}
                          </span>
                        )}
                      </button>
                    ))}
                    {upcomingAbsentPeople.length > 5 && (
                      <span className="text-xs text-gray-500">+{upcomingAbsentPeople.length - 5} weitere</span>
                    )}
                  </div>
                </div>
              )}

              {/* Current absences */}
              {currentlyAbsentPeople.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-500 font-medium">Aktuell abwesend:</span>
                  <div className="flex items-center gap-3 flex-wrap">
                    {currentlyAbsentPeople.slice(0, 5).map((person) => (
                      <button
                        key={person.id}
                        onClick={() => handleShowDetails(person)}
                        className="inline-flex flex-col items-start px-3 py-2 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-all duration-200 cursor-pointer shadow-md"
                        title={`Profil von ${person.name} anzeigen`}
                      >
                        <span>{person.name}</span>
                        {person.vacationEndDate && (
                          <span className="text-[10px] opacity-90 font-normal">
                            bis {new Date(person.vacationEndDate).toLocaleDateString("de-DE", {
                              day: "2-digit",
                              month: "2-digit"
                            })}
                          </span>
                        )}
                      </button>
                    ))}
                    {currentlyAbsentPeople.length > 5 && (
                      <span className="text-xs text-gray-500">+{currentlyAbsentPeople.length - 5} weitere</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {(debouncedSearchTerm || searchTerm) && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {debouncedSearchTerm ? (
                  <>
                    {filteredPersonen.length} Person{filteredPersonen.length !== 1 ? 'en' : ''} gefunden für "{debouncedSearchTerm}"
                  </>
                ) : (
                  'Suche läuft...'
                )}
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-200"
                >
                  Filter löschen
                </button>
              )}
            </div>
          )}
        </div>


      {showForm && (
        <div
          className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-40 p-4"
          onClick={handleFormClose}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <PersonFormular
              personToEdit={editingPerson}
              onFormClose={handleFormClose}
            />
          </div>
        </div>
      )}
      <PersonenListe
        personenToDisplay={filteredPersonen}
        onEditPerson={handleEditPerson}
        onDeleteInitiation={handleDeleteInitiation}
        onSkillClick={handleSkillClick}
        onShowDetails={handleShowDetails}
      />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Person löschen"
        message={`Möchten Sie ${
          personToDelete?.name || "diese Person"
        } wirklich löschen?`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      {showExcelModal && (
        <ExcelUploadModal
          isOpen={showExcelModal}
          onClose={() => setShowExcelModal(false)}
        />
      )}
      <PersonDetailsModal
        person={personToShowDetails}
        isOpen={showDetailsModal}
        onClose={handleCloseDetails}
        onEdit={handleEditPerson}
        onDeleteInitiation={handleDeleteInitiation}
        onSkillClick={handleSkillClick}
      />
      </div>
    </div>
  );
};

export default PersonenVerwaltung;
