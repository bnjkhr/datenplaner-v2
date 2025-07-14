// src/pages/PersonenVerwaltung.js - Production Version
import React, { useState, useEffect, useRef } from "react";
import { useData } from "../context/DataProvider";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { TagInput } from "../components/ui/TagInput";
import { ExcelUploadModal } from "../components/ExcelUploadModal";


// Comprehensive Search Component with Autocomplete
const GlobalSearch = ({ searchTerm, setSearchTerm, suggestions, onSuggestionClick }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

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
        setShowSuggestions(false);
        setActiveSuggestion(-1);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(value.length > 0 && suggestions.length > 0);
    setActiveSuggestion(-1);
  };

  const handleSuggestionClick = (suggestion) => {
    onSuggestionClick(suggestion);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          placeholder="Suche nach Namen, Skills, Datenprodukten..."
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(searchTerm.length > 0 && suggestions.length > 0)}
          className="flex-grow px-4 py-3 pr-10 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all w-full"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {searchTerm ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setShowSuggestions(false);
                setActiveSuggestion(-1);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          ) : (
            <div className="text-gray-400">🔍</div>
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${suggestion.id || index}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                index === activeSuggestion 
                  ? 'bg-blue-50 text-blue-900' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{suggestion.name}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      suggestion.type === 'person' ? 'bg-blue-100 text-blue-700' :
                      suggestion.type === 'skill' ? 'bg-green-100 text-green-700' :
                      suggestion.type === 'datenprodukt' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {suggestion.type === 'person' ? 'Person' :
                       suggestion.type === 'skill' ? 'Skill' :
                       suggestion.type === 'datenprodukt' ? 'Datenprodukt' :
                       suggestion.type}
                    </span>
                    {suggestion.details && <span>{suggestion.details}</span>}
                  </div>
                </div>
                {suggestion.matchedField && (
                  <div className="text-xs text-gray-500 italic">
                    in {suggestion.matchedField}
                  </div>
                )}
              </div>
            </div>
          ))}
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
}) => {
  const { name, email, skillIds, msTeamsLink, wochenstunden, isM13, kategorien } = person;
  const {
    datenprodukte,
    zuordnungen,
    rollen,
    skills: allSkills,
    vacations,
  } = useData();

  // Verbesserte Abwesenheits-Logik mit mehreren Matching-Strategien
  const getPersonVacations = () => {
    const today = new Date();
    const searchKeys = [
      name.toLowerCase(),
      name.toLowerCase().replace(/\s+/g, ""),
      email?.toLowerCase(),
      email?.split("@")[0]?.toLowerCase(),
    ].filter(Boolean);

    let personVacations = [];

    // Durchsuche alle möglichen Schlüssel
    for (const key of searchKeys) {
      if (vacations[key]) {
        personVacations = [...personVacations, ...vacations[key]];
      }
    }

    // Entferne Duplikate und filtere zukünftige/aktuelle Abwesenheiten
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

  // Formatiere Datum für Anzeige
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  // Prüfe ob Person aktuell abwesend ist
  const isCurrentlyAbsent = () => {
    const now = new Date();
    return upcomingVacations.some((vacation) => {
      const start = new Date(vacation.start);
      const end = new Date(vacation.end);
      return now >= start && now <= end;
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
        assignmentId: assignment.id,
      };
    })
    .filter((a) => a.produktName !== "...");

  return (
    <div
      className={`bg-white shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl p-6 flex flex-col justify-between border border-gray-100 hover:border-gray-200 ${
        isCurrentlyAbsent() ? "bg-gradient-to-br from-red-50 to-red-100/30 border-red-200" : "hover:bg-gray-50/30"
      }`}
    >
      <div>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-gray-900 break-words">
              {name}
            </h3>
            {isCurrentlyAbsent() && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500 text-white shadow-sm">
                Abwesend
              </span>
            )}
          </div>
          {msTeamsLink && (
            <a
              href={msTeamsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
              title="Chat in MS Teams starten"
            >
              <span className="text-lg">💬</span>
            </a>
          )}
        </div>

        {email && (
          <div className="mb-4">
            <a
              href={`mailto:${email}`}
              className="text-sm text-gray-600 hover:text-blue-600 break-all transition-colors"
            >
              {email}
            </a>
          </div>
        )}

        {/* Wochenstunden anzeigen */}
        {wochenstunden && (
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200">
              ⏰ {wochenstunden}h/Woche
            </span>
          </div>
        )}

        {/* M13 und Kategorien anzeigen */}
        {(isM13 || (kategorien && kategorien.length > 0)) && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {isM13 && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200">
                  ✓ M13
                </span>
              )}
              {kategorien && kategorien.map((kategorie) => (
                <span 
                  key={kategorie}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200"
                >
                  {kategorie}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Auslastungsanzeige */}
        <WorkloadIndicator person={person} zuordnungen={zuordnungen} />

        {/* Abwesenheiten anzeigen */}
        {upcomingVacations.length > 0 && (
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>🏖️</span>
              Anstehende Abwesenheiten
            </p>
            <div className="space-y-2">
              {upcomingVacations.slice(0, 3).map((vacation, index) => {
                const start = new Date(vacation.start);
                const end = new Date(vacation.end);
                const isCurrentVacation =
                  new Date() >= start && new Date() <= end;

                return (
                  <div
                    key={index}
                    className={`text-xs p-3 rounded-lg border ${
                      isCurrentVacation
                        ? "bg-gradient-to-r from-red-50 to-red-100 border-red-200 text-red-800"
                        : "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-800"
                    }`}
                  >
                    <div className="font-semibold mb-1">
                      {vacation.summary || "Abwesenheit"}
                    </div>
                    <div className="text-xs opacity-75">
                      {formatDate(vacation.start)} - {formatDate(vacation.end)}
                    </div>
                  </div>
                );
              })}
              {upcomingVacations.length > 3 && (
                <div className="text-xs text-gray-500 italic mt-2 px-2">
                  +{upcomingVacations.length - 3} weitere Abwesenheiten
                </div>
              )}
            </div>
          </div>
        )}

        {skillIds && skillIds.length > 0 && (
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {skillIds.map((id) => {
                const skill = allSkills.find((s) => s.id === id);
                if (!skill) return null;
                return (
                  <button
                    key={id}
                    onClick={() => onSkillClick(skill.name)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:scale-105 transition-all duration-200 shadow-sm border"
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
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Arbeitet an
            </p>
            <ul className="list-none space-y-2">
              {personAssignments.map((a) => {
                const assignment = zuordnungen.find(z => z.id === a.assignmentId);
                const stunden = assignment?.stunden || 0;
                return (
                  <li
                    key={a.assignmentId}
                    className="text-xs bg-gradient-to-r from-indigo-50 to-blue-50 p-3 rounded-lg border border-indigo-100 hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{a.produktName}</span>
                        <span className="text-gray-600">als {a.rolleName}</span>
                      </div>
                      {stunden > 0 && (
                        <div className="bg-blue-500 text-white px-2 py-1 rounded-md font-semibold">
                          {stunden}h
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 flex justify-end space-x-2 border-t border-gray-100">
        <button
          onClick={() => onEdit(person)}
          className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium rounded-lg transition-all duration-200"
        >
          Bearbeiten
        </button>
        <button
          onClick={() => onDeleteInitiation(person)}
          className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 font-medium rounded-lg transition-all duration-200"
        >
          Löschen
        </button>
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
          className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
          className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
          className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
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
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
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
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg font-semibold transition-all duration-200"
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
}) => {
  const { loading, error } = useData();
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {personenToDisplay.map((person) => (
        <PersonEintrag
          key={person.id}
          person={person}
          onEdit={onEditPerson}
          onDeleteInitiation={onDeleteInitiation}
          onSkillClick={onSkillClick}
        />
      ))}
    </div>
  );
};

const PersonenVerwaltung = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
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

  // Function to get currently absent people
  const getCurrentlyAbsentPeople = () => {
    const today = new Date();
    
    return personen.filter(person => {
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

      // Remove duplicates and check if currently absent
      const uniqueVacations = personVacations.filter((vacation, index, self) => {
        const vacationEnd = new Date(vacation.end);
        const isUnique =
          self.findIndex(
            (v) => v.start === vacation.start && v.end === vacation.end
          ) === index;

        return isUnique && vacationEnd >= today;
      });

      // Check if person is currently absent
      return uniqueVacations.some((vacation) => {
        const start = new Date(vacation.start);
        const end = new Date(vacation.end);
        return today >= start && today <= end;
      });
    });
  };

  const currentlyAbsentPeople = getCurrentlyAbsentPeople();

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.name);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Personenverwaltung</h1>
              <p className="text-gray-600">Verwalte dein Team und überwache die Arbeitsauslastung</p>
              {currentlyAbsentPeople.length > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">Aktuell abwesend:</span>
                  {currentlyAbsentPeople.map((person, index) => (
                    <span key={person.id} className="inline-flex items-center gap-1">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                        {person.name}
                      </span>
                      {index < currentlyAbsentPeople.length - 1 && (
                        <span className="text-gray-400">,</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 lg:flex-1 lg:max-w-2xl lg:ml-8">
              <div className="flex-1">
                <GlobalSearch
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  suggestions={suggestions}
                  onSuggestionClick={handleSuggestionClick}
                />
              </div>
              
              <div className="flex gap-3">
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 whitespace-nowrap"
                  >
                    Filter löschen
                  </button>
                )}
                <button
                  onClick={handleAddNewPerson}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="text-lg">+</span>
                  Neue Person
                </button>
                <button
                  onClick={() => setShowExcelModal(true)}
                  className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg border border-gray-200 transition-all duration-200 whitespace-nowrap"
                >
                  Excel Upload
                </button>
              </div>
            </div>
          </div>
          
          {debouncedSearchTerm && (
            <div className="mt-4 text-sm text-gray-600">
              {filteredPersonen.length} Person{filteredPersonen.length !== 1 ? 'en' : ''} gefunden für "{debouncedSearchTerm}"
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
      </div>
    </div>
  );
};

export default PersonenVerwaltung;
