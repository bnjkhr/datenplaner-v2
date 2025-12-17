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
if (typeof document !== "undefined") {
  const existingStyles = document.getElementById("search-animation-styles");
  if (!existingStyles) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "search-animation-styles";
    styleSheet.textContent = searchAnimationStyles;
    document.head.appendChild(styleSheet);
  }
}

// Helper function to get readable text color from skill color
// Returns a darker shade of the color for better contrast on light backgrounds
const getReadableSkillColor = (hexColor) => {
  if (!hexColor) return '#6B7280';

  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // If the color is too light, darken it significantly
  if (luminance > 0.5) {
    // Darken by 40% for very light colors
    const darkenFactor = 0.5;
    const newR = Math.floor(r * darkenFactor);
    const newG = Math.floor(g * darkenFactor);
    const newB = Math.floor(b * darkenFactor);
    return `rgb(${newR}, ${newG}, ${newB})`;
  }

  return hexColor;
};

// Simple Search Component
const SimpleSearch = ({
  searchTerm,
  setSearchTerm,
  suggestions,
  onSuggestionClick,
}) => {
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(value.length > 0);
    setActiveSuggestion(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
        onSuggestionClick(suggestions[activeSuggestion]);
        setActiveSuggestion(-1);
        setShowSuggestions(false);
      }
    } else if (e.key === "Escape") {
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
          placeholder="Suche nach Namen, Skills, Teams..."
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(searchTerm.length > 0)}
          className={`w-full px-4 py-3 pl-10 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:ring-2 focus:ring-ard-blue-500 focus:border-ard-blue-500 transition-all ${
            searchTerm ? "pr-10" : "pr-4"
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
              setSearchTerm("");
              setShowSuggestions(false);
              setActiveSuggestion(-1);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Suche löschen"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 px-2 pb-2 font-medium">
              {suggestions.length} Ergebnis
              {suggestions.length !== 1 ? "se" : ""} gefunden
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
                    ? "bg-ard-blue-50 dark:bg-ard-blue-900/30 text-ard-blue-900 dark:text-ard-blue-100"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {suggestion.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          suggestion.type === "person"
                            ? "bg-ard-blue-100 dark:bg-ard-blue-900/50 text-ard-blue-700 dark:text-ard-blue-300"
                            : suggestion.type === "skill"
                              ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                              : suggestion.type === "datenprodukt"
                                ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {suggestion.type === "person"
                          ? "Person"
                          : suggestion.type === "skill"
                            ? "Skill"
                            : suggestion.type === "datenprodukt"
                              ? "Team"
                              : suggestion.type}
                      </span>
                      {suggestion.details && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {suggestion.details}
                        </span>
                      )}
                    </div>
                    {suggestion.matchedField && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">
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
    .filter((z) => z.personId === person.id)
    .reduce((sum, z) => sum + (z.stunden || 0), 0);

  const auslastung =
    verfügbareStunden > 0 ? (gebuchteStunden / verfügbareStunden) * 100 : 0;
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
  const { name, email, msTeamsLink, wochenstunden, kategorien, skillIds } = person;
  const { vacations, zuordnungen, skills: allSkills, canEditPerson } = useData();

  // Anzahl Datenprodukte berechnen
  const getDataProductCount = () => {
    const personAssignments = zuordnungen.filter(
      (z) => z.personId === person.id,
    );
    const uniqueDataProducts = new Set(
      personAssignments.map((z) => z.datenproduktId),
    );
    return uniqueDataProducts.size;
  };

  // Prüfe ob Person aktuell abwesend ist
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

  // Auslastung berechnen
  const getAuslastung = () => {
    const verfügbareStunden = wochenstunden || 31;
    const gebuchteStunden = zuordnungen
      .filter((z) => z.personId === person.id)
      .reduce((sum, z) => sum + (z.stunden || 0), 0);
    return verfügbareStunden > 0
      ? (gebuchteStunden / verfügbareStunden) * 100
      : 0;
  };

  const auslastung = person.isM13 ? getAuslastung() : null;
  const isUnderbooked = auslastung !== null && auslastung < 20;
  const isOverbooked = auslastung !== null && auslastung > 100;
  const absent = isCurrentlyAbsent();

  // Skills für Anzeige (max 3)
  const displaySkills = (skillIds || []).slice(0, 3).map(id =>
    allSkills.find(s => s.id === id)
  ).filter(Boolean);

  return (
    <div
      className={`dashboard-card cursor-pointer group ${
        absent ? "ring-2 ring-red-300 dark:ring-red-700 bg-red-50/50 dark:bg-red-900/20" : ""
      }`}
      onClick={() => onShowDetails(person)}
    >
      <div className="flex-1 min-w-0">
        {/* Name Row */}
        <div className="flex items-center gap-2 mb-1">
          {absent && (
            <div className="flex-shrink-0 w-2.5 h-2.5 bg-red-500 rounded-full" />
          )}
          <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
            {name}
          </h3>
          {person.isM13 && (
            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded">
              M13
            </span>
          )}
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {absent && (
            <span className="dashboard-badge bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
              Abwesend
            </span>
          )}
          {sortBy === "abwesenheit" && !absent && (() => {
            const nextAbsenceInfo = getNextAbsenceInfo(person);
            if (nextAbsenceInfo) {
              return (
                <span className="dashboard-badge bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                  Ab {nextAbsenceInfo.startDate.toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              );
            }
            return null;
          })()}
          {sortBy === "datenprodukte" && getDataProductCount() > 0 && (
            <span className="dashboard-badge bg-purple-accent-100 dark:bg-purple-accent-900/50 text-purple-accent-700 dark:text-purple-accent-300">
              {getDataProductCount()} Team{getDataProductCount() !== 1 ? 's' : ''}
            </span>
          )}
          {kategorien && kategorien.length > 0 && (
            <span className="dashboard-badge bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              {kategorien.join(', ')}
            </span>
          )}
        </div>

        {/* Skills Preview */}
        {displaySkills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {displaySkills.map(skill => (
              <span
                key={skill.id}
                className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                style={{
                  backgroundColor: skill.color + '25',
                  color: getReadableSkillColor(skill.color),
                  border: `1px solid ${skill.color}50`
                }}
              >
                {skill.name}
              </span>
            ))}
            {(skillIds || []).length > 3 && (
              <span className="px-2 py-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500">
                +{skillIds.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Auslastung für M13 */}
        {person.isM13 && auslastung !== null && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Auslastung</span>
              <span className={`text-[10px] font-semibold ${
                isUnderbooked ? 'text-red-600 dark:text-red-400' : isOverbooked ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {Math.round(auslastung)}%
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isUnderbooked
                    ? 'bg-gradient-to-r from-red-400 to-red-500'
                    : isOverbooked
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                      : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                }`}
                style={{ width: `${Math.min(auslastung, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {msTeamsLink && (
            <a
              href={msTeamsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Teams Chat
            </a>
          )}
          {person.terminbuchungsLink && (
            <a
              href={person.terminbuchungsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Termin buchen
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const PersonDetailsPanel = ({
  person,
  isOpen,
  onClose,
  onEdit,
  onDeleteInitiation,
  onSkillClick,
}) => {
  const {
    datenprodukte,
    zuordnungen,
    rollen,
    skills: allSkills,
    vacations,
    canEditPerson,
    isAdmin: currentUserIsAdmin,
    setAdminStatus,
  } = useData();

  const [adminLoading, setAdminLoading] = React.useState(false);
  const [adminSuccess, setAdminSuccess] = React.useState('');

  if (!person) return null;

  const {
    name,
    email,
    skillIds,
    msTeamsLink,
    wochenstunden,
    isM13,
    kategorien,
    isAdmin: personIsAdmin,
  } = person;

  const handleAdminToggle = async () => {
    if (!email) return;
    setAdminLoading(true);
    setAdminSuccess('');
    try {
      const success = await setAdminStatus(person.id, email, !personIsAdmin);
      if (success) {
        const message = !personIsAdmin
          ? 'Admin-Rechte erfolgreich vergeben'
          : 'Admin-Rechte erfolgreich entzogen';
        setAdminSuccess(message);
        setTimeout(() => setAdminSuccess(''), 3000);
      }
      // On failure, setAdminStatus already calls setError which triggers global error UI
    } finally {
      setAdminLoading(false);
    }
  };

  // Avatar-Farbe basierend auf Name
  const getAvatarColor = () => {
    const colors = [
      'from-accent-400 to-accent-600',
      'from-purple-accent-400 to-purple-accent-600',
      'from-blue-400 to-blue-600',
      'from-emerald-400 to-emerald-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = () => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Abwesenheits-Logik
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
      const isUnique = self.findIndex(
        (v) => v.start === vacation.start && v.end === vacation.end,
      ) === index;
      return isUnique && vacationEnd >= today;
    });

    return uniqueVacations.sort((a, b) => new Date(a.start) - new Date(b.start));
  };

  const upcomingVacations = getPersonVacations();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  // Auslastung berechnen
  const getAuslastung = () => {
    const verfügbareStunden = wochenstunden || 31;
    const gebuchteStunden = zuordnungen
      .filter((z) => z.personId === person.id)
      .reduce((sum, z) => sum + (z.stunden || 0), 0);
    return {
      verfügbar: verfügbareStunden,
      gebucht: gebuchteStunden,
      prozent: verfügbareStunden > 0 ? (gebuchteStunden / verfügbareStunden) * 100 : 0
    };
  };

  const personAssignments = zuordnungen
    .filter((z) => z.personId === person.id)
    .map((assignment) => {
      const produkt = datenprodukte.find((dp) => dp.id === assignment.datenproduktId);
      const rolleInProdukt = rollen.find((r) => r.id === assignment.rolleId);
      return {
        produktName: produkt?.name || "...",
        rolleName: rolleInProdukt?.name || "...",
        rolleColor: rolleInProdukt?.color || "#6B7280",
        assignmentId: assignment.id,
        stunden: assignment.stunden || 0,
      };
    })
    .filter((a) => a.produktName !== "...");

  const auslastung = isM13 ? getAuslastung() : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white dark:bg-gray-800 shadow-2xl z-50
                    transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-600 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {canEditPerson(person.id) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onEdit(person); onClose(); }}
                      className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-white dark:hover:bg-gray-600 transition-all"
                      title="Bearbeiten"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => { onDeleteInitiation(person); onClose(); }}
                      className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-gray-600 transition-all"
                      title="Löschen"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getAvatarColor()}
                                flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                  {getInitials()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{name}</h2>
                  {email && (
                    <a href={`mailto:${email}`} className="text-sm text-gray-500 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">
                      {email}
                    </a>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="flex gap-2 mt-4">
                {msTeamsLink && (
                  <a
                    href={msTeamsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600
                               text-sm text-gray-600 dark:text-gray-300 hover:border-accent-300 dark:hover:border-accent-600 hover:text-accent-600 dark:hover:text-accent-400 transition-all"
                  >
                    <span>💬</span> Teams
                  </a>
                )}
                {person.terminbuchungsLink && (
                  <a
                    href={person.terminbuchungsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600
                               text-sm text-gray-600 dark:text-gray-300 hover:border-accent-300 dark:hover:border-accent-600 hover:text-accent-600 dark:hover:text-accent-400 transition-all"
                  >
                    <span>📅</span> Termin
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                {isM13 && (
                  <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                    M13
                  </span>
                )}
                {personIsAdmin && (
                  <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                    Admin
                  </span>
                )}
                {wochenstunden && (
                  <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    {wochenstunden}h/Woche
                  </span>
                )}
                {kategorien && kategorien.map((kategorie) => (
                  <button
                    key={kategorie}
                    onClick={() => { onClose(); setTimeout(() => onSkillClick(kategorie), 10); }}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-purple-accent-100 dark:bg-purple-accent-900/50 text-purple-accent-700 dark:text-purple-accent-300
                               hover:bg-purple-accent-200 dark:hover:bg-purple-accent-900/70 transition-colors cursor-pointer"
                  >
                    {kategorie}
                  </button>
                ))}
              </div>

              {/* Admin-Verwaltung (nur für Admins sichtbar) */}
              {currentUserIsAdmin && email && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">Admin-Rechte</h4>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                        {personIsAdmin ? 'Hat Administrator-Zugriff' : 'Kein Administrator-Zugriff'}
                      </p>
                    </div>
                    <button
                      onClick={handleAdminToggle}
                      disabled={adminLoading}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                                  ${personIsAdmin ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}
                                  ${adminLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                                    transition duration-200 ease-in-out ${personIsAdmin ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                  {/* Success notification */}
                  {adminSuccess && (
                    <div className="mt-3 p-2 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-xs text-green-700 dark:text-green-300 font-medium">{adminSuccess}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Auslastung für M13 */}
              {isM13 && auslastung && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Auslastung</span>
                    <span className={`text-sm font-bold ${
                      auslastung.prozent < 20 ? 'text-red-600 dark:text-red-400' :
                      auslastung.prozent > 100 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {auslastung.gebucht}h / {auslastung.verfügbar}h ({Math.round(auslastung.prozent)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        auslastung.prozent < 20
                          ? 'bg-gradient-to-r from-red-400 to-red-500'
                          : auslastung.prozent > 100
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                            : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                      }`}
                      style={{ width: `${Math.min(auslastung.prozent, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Abwesenheiten */}
              {upcomingVacations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span>🏖️</span> Abwesenheiten
                  </h3>
                  <div className="space-y-2">
                    {upcomingVacations.slice(0, 4).map((vacation, index) => {
                      const start = new Date(vacation.start);
                      const end = new Date(vacation.end);
                      const isCurrentVacation = new Date() >= start && new Date() <= end;

                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-xl border ${
                            isCurrentVacation
                              ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
                              : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          <div className={`font-medium text-sm ${isCurrentVacation ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}`}>
                            {vacation.summary || 'Abwesenheit'}
                          </div>
                          <div className={`text-xs mt-1 ${isCurrentVacation ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {formatDate(vacation.start)} – {formatDate(vacation.end)}
                          </div>
                        </div>
                      );
                    })}
                    {upcomingVacations.length > 4 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 pl-1">+{upcomingVacations.length - 4} weitere</p>
                    )}
                  </div>
                </div>
              )}

              {/* Skills */}
              {skillIds && skillIds.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {skillIds.map((id) => {
                      const skill = allSkills.find((s) => s.id === id);
                      if (!skill) return null;
                      return (
                        <button
                          key={id}
                          onClick={() => { onClose(); setTimeout(() => onSkillClick(skill.name), 10); }}
                          className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                          style={{
                            backgroundColor: skill.color + '25',
                            color: getReadableSkillColor(skill.color),
                            border: `1px solid ${skill.color}50`
                          }}
                        >
                          {skill.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Arbeitet an */}
              {personAssignments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Arbeitet an</h3>
                  <div className="space-y-2">
                    {personAssignments.map((a) => (
                      <div
                        key={a.assignmentId}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                      >
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">{a.produktName}</div>
                          <span
                            className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: a.rolleColor }}
                          >
                            {a.rolleName}
                          </span>
                        </div>
                        {a.stunden > 0 && (
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-600 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-500">
                            {a.stunden}h
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Team/Kreis Details Panel
const TeamDetailsPanel = ({
  teamName,
  teamPersonen,
  isOpen,
  onClose,
  onShowPersonDetails,
  kreisConfig,
}) => {
  const { zuordnungen, datenprodukte, vacations } = useData();

  if (!teamName) return null;

  const config = kreisConfig[teamName] || kreisConfig['Ohne Kreis'];

  // Team-Statistiken berechnen
  const m13Count = teamPersonen.filter(p => p.isM13).length;
  const totalWochenstunden = teamPersonen.reduce((sum, p) => sum + (p.wochenstunden || 0), 0);
  const gebuchteStunden = teamPersonen.reduce((sum, p) => {
    const personStunden = zuordnungen
      .filter(z => z.personId === p.id)
      .reduce((s, z) => s + (z.stunden || 0), 0);
    return sum + personStunden;
  }, 0);
  const auslastungProzent = totalWochenstunden > 0 ? (gebuchteStunden / totalWochenstunden) * 100 : 0;

  // Abwesende Personen im Team
  const getAbwesendePersonen = () => {
    const today = new Date();
    return teamPersonen.filter(person => {
      const searchKeys = [
        person.name.toLowerCase(),
        person.name.toLowerCase().replace(/\s+/g, ""),
        person.email?.toLowerCase(),
        person.email?.split("@")[0]?.toLowerCase(),
      ].filter(Boolean);

      for (const key of searchKeys) {
        if (vacations[key]) {
          const isAbsent = vacations[key].some(v => {
            const start = new Date(v.start);
            const end = new Date(v.end);
            return today >= start && today <= end;
          });
          if (isAbsent) return true;
        }
      }
      return false;
    });
  };

  const abwesendePersonen = getAbwesendePersonen();

  // Datenprodukte in denen Team-Mitglieder arbeiten
  const getTeamDatenprodukte = () => {
    const produktIds = new Set();
    teamPersonen.forEach(p => {
      zuordnungen
        .filter(z => z.personId === p.id)
        .forEach(z => produktIds.add(z.datenproduktId));
    });
    return datenprodukte.filter(dp => produktIds.has(dp.id));
  };

  const teamDatenprodukte = getTeamDatenprodukte();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white dark:bg-gray-800 shadow-2xl z-50
                    transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className={`flex-shrink-0 bg-gradient-to-r ${config.bgColor} border-b border-gray-200 dark:border-gray-700`}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Team Icon & Name */}
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.color}
                                flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                  👥
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{teamName}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {teamPersonen.length} Person{teamPersonen.length !== 1 ? 'en' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{m13Count}</div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-300">M13</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalWochenstunden}h</div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">Wochenstunden</div>
                </div>
              </div>

              {/* Team-Auslastung */}
              {totalWochenstunden > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Team-Auslastung</span>
                    <span className={`text-sm font-bold ${
                      auslastungProzent < 20 ? 'text-red-600 dark:text-red-400' :
                      auslastungProzent > 100 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {gebuchteStunden}h / {totalWochenstunden}h ({Math.round(auslastungProzent)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        auslastungProzent < 20
                          ? 'bg-gradient-to-r from-red-400 to-red-500'
                          : auslastungProzent > 100
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                            : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                      }`}
                      style={{ width: `${Math.min(auslastungProzent, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Aktuell Abwesend */}
              {abwesendePersonen.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span>🏖️</span> Aktuell abwesend ({abwesendePersonen.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {abwesendePersonen.map(person => (
                      <button
                        key={person.id}
                        onClick={() => onShowPersonDetails(person)}
                        className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium
                                   hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        {person.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Team-Mitglieder */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Team-Mitglieder</h3>
                <div className="space-y-2">
                  {teamPersonen.map(person => {
                    const personStunden = zuordnungen
                      .filter(z => z.personId === person.id)
                      .reduce((s, z) => s + (z.stunden || 0), 0);
                    const personAuslastung = person.wochenstunden > 0
                      ? Math.round((personStunden / person.wochenstunden) * 100)
                      : 0;

                    return (
                      <button
                        key={person.id}
                        onClick={() => onShowPersonDetails(person)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl
                                   hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          {person.avatarUrl ? (
                            <img
                              src={person.avatarUrl}
                              alt={person.name}
                              className="w-10 h-10 rounded-xl object-cover"
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500
                                            flex items-center justify-center text-white font-bold text-sm`}>
                              {person.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">{person.name}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              {person.isM13 && <span className="text-emerald-600 dark:text-emerald-400">M13</span>}
                              {person.wochenstunden && <span>{person.wochenstunden}h/Wo</span>}
                            </div>
                          </div>
                        </div>
                        {person.isM13 && person.wochenstunden > 0 && (
                          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                            personAuslastung < 20 ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                            personAuslastung > 100 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                          }`}>
                            {personAuslastung}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Datenprodukte */}
              {teamDatenprodukte.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Arbeitet an ({teamDatenprodukte.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {teamDatenprodukte.map(dp => (
                      <span
                        key={dp.id}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
                      >
                        {dp.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
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
  const [wochenstunden, setWochenstunden] = useState(
    personToEdit?.wochenstunden || 31,
  );
  const [msTeamsEmail, setMsTeamsEmail] = useState(() => {
    if (personToEdit?.msTeamsLink) {
      const emailMatch = personToEdit.msTeamsLink.match(/users=([^&]+)/);
      return emailMatch ? emailMatch[1] : personToEdit.email || "";
    }
    return personToEdit?.email || "";
  });
  const [isM13, setIsM13] = useState(personToEdit?.isM13 || false);
  const [kategorien, setKategorien] = useState(personToEdit?.kategorien || []);
  const [terminbuchungsLink, setTerminbuchungsLink] = useState(
    personToEdit?.terminbuchungsLink || "",
  );
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
      terminbuchungsLink: terminbuchungsLink.trim(),
    };

    const success = personToEdit
      ? await aktualisierePerson(personToEdit.id, personData)
      : await fuegePersonHinzu(personData);

    if (success) {
      onFormClose?.();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl"
    >
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        {personToEdit ? "Person bearbeiten" : "Neue Person hinzufügen"}
      </h2>
      {(validationError || globalError) && (
        <div
          className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-6 py-4 rounded-xl mb-6"
          role="alert"
        >
          {validationError || globalError}
        </div>
      )}
      <div>
        <label
          htmlFor="person-name"
          className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
        >
          Name
        </label>
        <input
          id="person-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl shadow-sm focus:ring-2 focus:ring-ard-blue-500 focus:border-ard-blue-500 transition-all"
        />
      </div>
      <div>
        <label
          htmlFor="person-email"
          className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
        >
          E-Mail
        </label>
        <input
          id="person-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl shadow-sm focus:ring-2 focus:ring-ard-blue-500 focus:border-ard-blue-500 transition-all"
        />
      </div>
      <div>
        <label
          htmlFor="person-wochenstunden"
          className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
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
          className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl shadow-sm focus:ring-2 focus:ring-ard-blue-500 focus:border-ard-blue-500 transition-all"
        />
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Anzahl der Arbeitsstunden pro Woche (Standard: 31, Bereich: 1-80).
        </p>
      </div>
      <div>
        <label
          htmlFor="msTeamsEmail"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          MS Teams E-Mail
        </label>
        <input
          id="msTeamsEmail"
          type="email"
          value={msTeamsEmail}
          onChange={(e) => setMsTeamsEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Für den Chat-Link.</p>
      </div>
      <div>
        <label
          htmlFor="terminbuchungsLink"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Terminbuchungslink
        </label>
        <input
          id="terminbuchungsLink"
          type="url"
          value={terminbuchungsLink}
          onChange={(e) => setTerminbuchungsLink(e.target.value)}
          placeholder="https://..."
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-md"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Link zur Terminbuchungsseite (optional).
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
            className="w-4 h-4 text-ard-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-ard-blue-500 focus:ring-2"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">M13</span>
        </label>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Mitarbeiter mit M13-Status</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Kreise
        </label>
        <div className="space-y-2">
          {["Plattform", "Datenprodukt", "Governance"].map((kategorie) => (
            <label key={kategorie} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={kategorien.includes(kategorie)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setKategorien([...kategorien, kategorie]);
                  } else {
                    setKategorien(kategorien.filter((k) => k !== kategorie));
                  }
                }}
                className="w-4 h-4 text-ard-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-ard-blue-500 focus:ring-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{kategorie}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Mehrfachauswahl möglich</p>
      </div>
      <div className="flex justify-end space-x-4 pt-6">
        {onFormClose && (
          <button
            type="button"
            onClick={onFormClose}
            className="px-6 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            Abbrechen
          </button>
        )}
        <button
          type="submit"
          className="px-6 py-3 bg-gradient-to-r from-accent-500 to-purple-accent-500 hover:from-accent-600 hover:to-purple-accent-600 text-white rounded-xl shadow-lg font-semibold transition-all duration-200"
        >
          {personToEdit ? "Speichern" : "Hinzufügen"}
        </button>
      </div>
    </form>
  );
};

// Kreis-Farben
const kreisConfig = {
  'Plattform': { color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-300' },
  'Datenprodukt': { color: 'from-purple-accent-500 to-purple-accent-600', bgColor: 'bg-purple-accent-50 dark:bg-purple-accent-900/30', textColor: 'text-purple-accent-700 dark:text-purple-accent-300' },
  'Governance': { color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30', textColor: 'text-emerald-700 dark:text-emerald-300' },
  'Ohne Kreis': { color: 'from-gray-400 to-gray-500', bgColor: 'bg-gray-50 dark:bg-gray-700', textColor: 'text-gray-600 dark:text-gray-400' },
};

// Sortier-Optionen
const sortOptions = [
  { value: 'name', label: 'Name', icon: '🔤' },
  { value: 'auslastung', label: 'Auslastung', icon: '📊' },
  { value: 'abwesenheit', label: 'Abwesenheit', icon: '🏖️' },
  { value: 'datenprodukte', label: 'Teams', icon: '👥' },
];

const PersonenListe = ({
  personenToDisplay,
  onEditPerson,
  onDeleteInitiation,
  onSkillClick,
  onShowDetails,
}) => {
  const { loading, error, zuordnungen, vacations, canEditPerson, canEditData } = useData();
  const [sortBy, setSortBy] = useState("name");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [collapsedKreise, setCollapsedKreise] = useState({});
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [teamToShowDetails, setTeamToShowDetails] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSortDropdown && !event.target.closest(".sort-dropdown")) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSortDropdown]);

  const toggleKreis = (kreis) => {
    setCollapsedKreise(prev => ({ ...prev, [kreis]: !prev[kreis] }));
  };

  const handleShowTeamDetails = (kreis, personen) => {
    setTeamToShowDetails({ name: kreis, personen });
    setShowTeamDetails(true);
  };

  const handleCloseTeamDetails = () => {
    setShowTeamDetails(false);
    setTeamToShowDetails(null);
  };

  // Funktion um Auslastung zu berechnen
  const calculateAuslastung = (person) => {
    const verfügbareStunden = person.wochenstunden || 31;
    const gebuchteStunden = zuordnungen
      .filter((z) => z.personId === person.id)
      .reduce((sum, z) => sum + (z.stunden || 0), 0);
    return verfügbareStunden > 0
      ? (gebuchteStunden / verfügbareStunden) * 100
      : 0;
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

    const uniqueFutureVacations = personVacations
      .filter(
        (vacation, index, self) =>
          self.findIndex(
            (v) => v.start === vacation.start && v.end === vacation.end,
          ) === index,
      )
      .filter((vacation) => new Date(vacation.start) > today)
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    return uniqueFutureVacations.length > 0
      ? new Date(uniqueFutureVacations[0].start)
      : null;
  };

  // Funktion um Anzahl Datenprodukte zu berechnen
  const getDataProductCount = (person) => {
    const personAssignments = zuordnungen.filter(
      (z) => z.personId === person.id,
    );
    const uniqueDataProducts = new Set(
      personAssignments.map((z) => z.datenproduktId),
    );
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

    const uniqueFutureVacations = personVacations
      .filter(
        (vacation, index, self) =>
          self.findIndex(
            (v) => v.start === vacation.start && v.end === vacation.end,
          ) === index,
      )
      .filter((vacation) => new Date(vacation.start) > today)
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    if (uniqueFutureVacations.length > 0) {
      return {
        startDate: new Date(uniqueFutureVacations[0].start),
        endDate: new Date(uniqueFutureVacations[0].end),
      };
    }
    return null;
  };

  // Funktion um Personen zu sortieren
  const getSortedPersonen = (personen) => {
    switch (sortBy) {
      case "auslastung":
        return [...personen].sort(
          (a, b) => calculateAuslastung(b) - calculateAuslastung(a),
        );
      case "abwesenheit":
        return [...personen].sort((a, b) => {
          const aNext = getNextAbsenceDate(a);
          const bNext = getNextAbsenceDate(b);
          if (aNext && !bNext) return -1;
          if (!aNext && bNext) return 1;
          if (aNext && bNext) return aNext - bNext;
          return a.name.localeCompare(b.name);
        });
      case "datenprodukte":
        return [...personen].sort((a, b) => {
          const aCount = getDataProductCount(a);
          const bCount = getDataProductCount(b);
          if (aCount !== bCount) return bCount - aCount;
          return a.name.localeCompare(b.name);
        });
      default:
        return [...personen].sort((a, b) => a.name.localeCompare(b.name));
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-400 to-purple-accent-500 animate-pulse mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">Lade Team...</p>
      </div>
    );
  if (error && !personenToDisplay.length)
    return (
      <div className="dashboard-card text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
      </div>
    );
  if (personenToDisplay.length === 0)
    return (
      <div className="dashboard-card text-center py-12">
        <div className="text-4xl mb-4">👥</div>
        <p className="text-gray-500 dark:text-gray-400">Keine Personen gefunden.</p>
      </div>
    );

  // Gruppiere Personen nach Kreisen
  const groupedPersonen = personenToDisplay.reduce((groups, person) => {
    const kreise =
      person.kategorien && person.kategorien.length > 0
        ? person.kategorien
        : ["Ohne Kreis"];

    kreise.forEach((kreis) => {
      if (!groups[kreis]) {
        groups[kreis] = [];
      }
      groups[kreis].push(person);
    });

    return groups;
  }, {});

  // Sortiere Personen innerhalb jeder Gruppe
  Object.keys(groupedPersonen).forEach((kreis) => {
    groupedPersonen[kreis] = getSortedPersonen(groupedPersonen[kreis]);
  });

  // Sortiere Gruppen
  const sortedKreise = Object.keys(groupedPersonen).sort((a, b) => {
    const order = ["Plattform", "Datenprodukt", "Governance", "Ohne Kreis"];
    const indexA = order.indexOf(a) !== -1 ? order.indexOf(a) : 999;
    const indexB = order.indexOf(b) !== -1 ? order.indexOf(b) : 999;
    return indexA - indexB;
  });

  const currentSortOption = sortOptions.find(o => o.value === sortBy);

  return (
    <div className="space-y-6">
      {/* Globale Sortierung */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {personenToDisplay.length} Person{personenToDisplay.length !== 1 ? 'en' : ''} in {sortedKreise.length} Kreis{sortedKreise.length !== 1 ? 'en' : ''}
        </div>

        {/* Sortier-Dropdown */}
        <div className="relative sort-dropdown">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                       hover:border-accent-300 dark:hover:border-accent-600 rounded-xl shadow-sm transition-all duration-200"
          >
            <span className="text-base">{currentSortOption?.icon}</span>
            <span className="text-gray-700 dark:text-gray-300">{currentSortOption?.label}</span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${showSortDropdown ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showSortDropdown && (
            <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-20 min-w-[180px]">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value);
                    setShowSortDropdown(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    sortBy === option.value
                      ? "bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 font-semibold"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="text-base">{option.icon}</span>
                  <span>{option.label}</span>
                  {sortBy === option.value && (
                    <svg className="w-4 h-4 ml-auto text-accent-500 dark:text-accent-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Kreis-Sections */}
      {sortedKreise.map((kreis) => {
        const config = kreisConfig[kreis] || kreisConfig['Ohne Kreis'];
        const isCollapsed = collapsedKreise[kreis];
        const personCount = groupedPersonen[kreis].length;

        return (
          <div key={kreis} className="dashboard-card-no-hover overflow-hidden">
            {/* Kreis-Header */}
            <div className="flex items-center gap-4 p-4 sm:p-5">
              {/* Color Bar - klickbar für Details */}
              <button
                onClick={() => handleShowTeamDetails(kreis, groupedPersonen[kreis])}
                className={`flex-shrink-0 w-1.5 h-12 rounded-full bg-gradient-to-b ${config.color} hover:scale-110 transition-transform cursor-pointer`}
                title={`${kreis} Details anzeigen`}
              />

              {/* Title & Count - klickbar für Details */}
              <button
                onClick={() => handleShowTeamDetails(kreis, groupedPersonen[kreis])}
                className="flex-1 text-left hover:opacity-80 transition-opacity"
                title={`${kreis} Details anzeigen`}
              >
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{kreis}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {personCount} Person{personCount !== 1 ? 'en' : ''}
                </p>
              </button>

              {/* Collapse Icon - klickbar für Ein-/Ausklappen */}
              <button
                onClick={() => toggleKreis(kreis)}
                className={`p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 ${isCollapsed ? '' : 'rotate-180'}`}
                title={isCollapsed ? 'Ausklappen' : 'Einklappen'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Personen-Grid */}
            {!isCollapsed && (
              <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
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
            )}
          </div>
        );
      })}

      {/* Team Details Panel */}
      <TeamDetailsPanel
        teamName={teamToShowDetails?.name}
        teamPersonen={teamToShowDetails?.personen || []}
        isOpen={showTeamDetails}
        onClose={handleCloseTeamDetails}
        onShowPersonDetails={(person) => {
          handleCloseTeamDetails();
          onShowDetails(person);
        }}
        kreisConfig={kreisConfig}
      />
    </div>
  );
};

const PersonenVerwaltung = ({ initialSelectedId, onSelectedClear }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [personToShowDetails, setPersonToShowDetails] = useState(null);
  const {
    personen,
    skills,
    datenprodukte,
    zuordnungen,
    rollen,
    loeschePerson,
    vacations,
    canEditPerson,
    canEditData,
  } = useData();

  // Open details modal when navigating with a specific person ID
  useEffect(() => {
    if (initialSelectedId && personen?.length > 0) {
      const person = personen.find(p => p.id === initialSelectedId);
      if (person) {
        setPersonToShowDetails(person);
        setShowDetailsModal(true);
        onSelectedClear?.();
      }
    }
  }, [initialSelectedId, personen, onSelectedClear]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showAllUpcomingAbsent, setShowAllUpcomingAbsent] = useState(false);
  const [showAllCurrentAbsent, setShowAllCurrentAbsent] = useState(false);

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
    personen.forEach((person) => {
      if (person.name.toLowerCase().includes(lowerTerm)) {
        suggestions.push({
          id: person.id,
          name: person.name,
          type: "person",
          details: person.email,
          matchedField: "Name",
          data: person,
        });
      } else if (person.email?.toLowerCase().includes(lowerTerm)) {
        suggestions.push({
          id: person.id,
          name: person.name,
          type: "person",
          details: person.email,
          matchedField: "E-Mail",
          data: person,
        });
      } else if (person.isM13 && "m13".includes(lowerTerm)) {
        suggestions.push({
          id: person.id,
          name: person.name,
          type: "person",
          details: "M13-Status",
          matchedField: "M13",
          data: person,
        });
      } else if (
        person.kategorien?.some((kat) => kat.toLowerCase().includes(lowerTerm))
      ) {
        const matchedKategorie = person.kategorien.find((kat) =>
          kat.toLowerCase().includes(lowerTerm),
        );
        suggestions.push({
          id: person.id,
          name: person.name,
          type: "person",
          details: `Kreis: ${matchedKategorie}`,
          matchedField: "Kreis",
          data: person,
        });
      }
    });

    // Search in skills
    skills.forEach((skill) => {
      if (skill.name.toLowerCase().includes(lowerTerm)) {
        const personCount = personen.filter(
          (p) => p.skillIds && p.skillIds.includes(skill.id),
        ).length;
        suggestions.push({
          id: skill.id,
          name: skill.name,
          type: "skill",
          details: `${personCount} Person${personCount !== 1 ? "en" : ""}`,
          matchedField: "Skill",
          data: skill,
        });
      }
    });

    // Search in data products
    datenprodukte.forEach((dp) => {
      if (dp.name.toLowerCase().includes(lowerTerm)) {
        const teamSize = zuordnungen.filter(
          (z) => z.datenproduktId === dp.id,
        ).length;
        suggestions.push({
          id: dp.id,
          name: dp.name,
          type: "datenprodukt",
          details: `${teamSize} Teammitglied${teamSize !== 1 ? "er" : ""}`,
          matchedField: "Team",
          data: dp,
        });
      } else if (dp.beschreibung?.toLowerCase().includes(lowerTerm)) {
        const teamSize = zuordnungen.filter(
          (z) => z.datenproduktId === dp.id,
        ).length;
        suggestions.push({
          id: dp.id,
          name: dp.name,
          type: "datenprodukt",
          details: `${teamSize} Teammitglied${teamSize !== 1 ? "er" : ""}`,
          matchedField: "Beschreibung",
          data: dp,
        });
      }
    });

    // Search in roles
    rollen.forEach((rolle) => {
      if (rolle.name.toLowerCase().includes(lowerTerm)) {
        const assignmentCount = zuordnungen.filter(
          (z) => z.rolleId === rolle.id,
        ).length;
        suggestions.push({
          id: rolle.id,
          name: rolle.name,
          type: "rolle",
          details: `${assignmentCount} Zuweisung${assignmentCount !== 1 ? "en" : ""}`,
          matchedField: "Rolle",
          data: rolle,
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

    return personen.filter((person) => {
      // Search in person name, email, M13, and kategorien
      if (
        person.name.toLowerCase().includes(lowerTerm) ||
        person.email?.toLowerCase().includes(lowerTerm) ||
        (person.isM13 && "m13".includes(lowerTerm)) ||
        person.kategorien?.some((kat) => kat.toLowerCase().includes(lowerTerm))
      ) {
        return true;
      }

      // Search in person's skills
      if (person.skillIds) {
        const hasMatchingSkill = person.skillIds.some((skillId) => {
          const skill = skills.find((s) => s.id === skillId);
          return skill && skill.name.toLowerCase().includes(lowerTerm);
        });
        if (hasMatchingSkill) return true;
      }

      // Search in person's data products and roles
      const personAssignments = zuordnungen.filter(
        (z) => z.personId === person.id,
      );
      const hasMatchingAssignment = personAssignments.some((assignment) => {
        const datenprodukt = datenprodukte.find(
          (dp) => dp.id === assignment.datenproduktId,
        );
        const rolle = rollen.find((r) => r.id === assignment.rolleId);

        return (
          (datenprodukt &&
            (datenprodukt.name.toLowerCase().includes(lowerTerm) ||
              datenprodukt.beschreibung?.toLowerCase().includes(lowerTerm))) ||
          (rolle && rolle.name.toLowerCase().includes(lowerTerm))
        );
      });

      return hasMatchingAssignment;
    });
  };

  const filteredPersonen = getFilteredPersonen();

  // Function to get currently absent people with their vacation end dates
  const getCurrentlyAbsentPeople = () => {
    const today = new Date();

    return personen
      .map((person) => {
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
        const uniqueVacations = personVacations.filter(
          (vacation, index, self) => {
            const vacationEnd = new Date(vacation.end);
            const isUnique =
              self.findIndex(
                (v) => v.start === vacation.start && v.end === vacation.end,
              ) === index;

            return isUnique && vacationEnd >= today;
          },
        );

        // Find current vacation and its end date
        const currentVacation = uniqueVacations.find((vacation) => {
          const start = new Date(vacation.start);
          const end = new Date(vacation.end);
          return today >= start && today <= end;
        });

        if (currentVacation) {
          return {
            ...person,
            vacationEndDate: currentVacation.end,
          };
        }

        return null;
      })
      .filter(Boolean);
  };

  // Function to get people who will be absent in the next week
  const getUpcomingAbsentPeople = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return personen
      .map((person) => {
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
        const uniqueVacations = personVacations.filter(
          (vacation, index, self) =>
            self.findIndex(
              (v) => v.start === vacation.start && v.end === vacation.end,
            ) === index,
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
            vacationEndDate: upcomingVacation.end,
          };
        }

        return null;
      })
      .filter(Boolean);
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
    <div className="min-h-screen bg-gray-50/30 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8 max-w-[1600px]">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-display">
                Personen
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {personen.length} Personen · {personen.filter(p => p.isM13).length} M13
              </p>
            </div>

            {/* Search & Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="flex-1 sm:flex-initial sm:min-w-0 sm:w-72">
                <SimpleSearch
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  suggestions={suggestions}
                  onSuggestionClick={handleSuggestionClick}
                />
              </div>

              <div className="flex items-center gap-2">
                {canEditData() && (
                  <>
                    <button
                      onClick={handleAddNewPerson}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-500 to-purple-accent-500
                                 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="hidden sm:inline">Person</span>
                    </button>

                    <button
                      onClick={() => setShowExcelModal(true)}
                      className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400
                                 hover:border-emerald-300 dark:hover:border-emerald-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200"
                      title="Excel Upload"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Absence Panels */}
        {(currentlyAbsentPeople.length > 0 || upcomingAbsentPeople.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Currently Absent */}
            {currentlyAbsentPeople.length > 0 && (
              <div className="dashboard-card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300">Heute abwesend</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">({currentlyAbsentPeople.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(showAllCurrentAbsent ? currentlyAbsentPeople : currentlyAbsentPeople.slice(0, 6)).map((person) => (
                    <button
                      key={person.id}
                      onClick={() => handleShowDetails(person)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600
                                 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all text-sm"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{person.name}</span>
                      {person.vacationEndDate && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          bis {new Date(person.vacationEndDate).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                        </span>
                      )}
                    </button>
                  ))}
                  {currentlyAbsentPeople.length > 6 && (
                    <button
                      onClick={() => setShowAllCurrentAbsent(!showAllCurrentAbsent)}
                      className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 font-medium hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors"
                      title={showAllCurrentAbsent ? "Weniger anzeigen" : "Alle anzeigen"}
                    >
                      {showAllCurrentAbsent ? "weniger" : `+${currentlyAbsentPeople.length - 6}`}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Upcoming Absences */}
            {upcomingAbsentPeople.length > 0 && (
              <div className="dashboard-card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300">Diese Woche abwesend</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">({upcomingAbsentPeople.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(showAllUpcomingAbsent ? upcomingAbsentPeople : upcomingAbsentPeople.slice(0, 6)).map((person) => (
                    <button
                      key={person.id}
                      onClick={() => handleShowDetails(person)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600
                                 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all text-sm"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{person.name}</span>
                      {person.vacationStartDate && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          ab {new Date(person.vacationStartDate).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                        </span>
                      )}
                    </button>
                  ))}
                  {upcomingAbsentPeople.length > 6 && (
                    <button
                      onClick={() => setShowAllUpcomingAbsent(!showAllUpcomingAbsent)}
                      className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 font-medium hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors"
                      title={showAllUpcomingAbsent ? "Weniger anzeigen" : "Alle anzeigen"}
                    >
                      {showAllUpcomingAbsent ? "weniger" : `+${upcomingAbsentPeople.length - 6}`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Results Info */}
        {(debouncedSearchTerm || searchTerm) && (
          <div className="mb-4 flex items-center justify-between px-1">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {debouncedSearchTerm ? (
                <span>
                  <span className="font-semibold text-gray-900 dark:text-white">{filteredPersonen.length}</span> Ergebnis{filteredPersonen.length !== 1 ? 'se' : ''} für "{debouncedSearchTerm}"
                </span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">Suche läuft...</span>
              )}
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                           text-gray-600 dark:text-gray-300 rounded-lg font-medium transition-all"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Löschen
              </button>
            )}
          </div>
        )}

        {showForm && (
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex justify-center items-center z-40 p-4"
            onClick={handleFormClose}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
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
        <PersonDetailsPanel
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
