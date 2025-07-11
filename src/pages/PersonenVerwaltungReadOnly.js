// src/pages/PersonenVerwaltungReadOnly.js - Read-Only Version für Confluence
import React, { useState, useEffect } from "react";
import { useData } from "../context/DataProvider";

// Read-Only Search Component
const ReadOnlySearch = ({ searchTerm, setSearchTerm, suggestions, onSuggestionClick }) => {
  return (
    <div className="mb-6">
      <div className="relative">
        <input
          type="text"
          placeholder="Suche nach Namen, Skills, Datenprodukten..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          ) : (
            <div className="text-gray-400">🔍</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Workload Indicator Component
const WorkloadIndicator = ({ person, zuordnungen }) => {
  const wochenstunden = person.wochenstunden || 31;
  const gebuchteStunden = zuordnungen
    .filter((z) => z.personId === person.id)
    .reduce((sum, z) => sum + (z.stunden || 0), 0);
  
  const auslastung = wochenstunden > 0 ? (gebuchteStunden / wochenstunden) * 100 : 0;
  
  const getColorClass = () => {
    if (auslastung > 100) return "text-red-600 bg-red-50";
    if (auslastung < 20) return "text-orange-600 bg-orange-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${getColorClass()}`}>
      {Math.round(auslastung)}% ({gebuchteStunden}h/{wochenstunden}h)
    </div>
  );
};

export const PersonenVerwaltungReadOnly = () => {
  const {
    personen,
    datenprodukte,
    zuordnungen,
    rollen,
    skills,
    vacations,
    loading,
    error,
  } = useData();

  const [searchTerm, setSearchTerm] = useState("");

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="container mx-auto px-6 py-8">
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-800 px-6 py-4 rounded-xl" role="alert">
            Fehler beim Laden der Daten: {error}
          </div>
        </div>
      </div>
    );
  }

  // Filter logic
  const filteredPersonen = personen.filter((person) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search in name and email
    if (person.name?.toLowerCase().includes(searchLower) || 
        person.email?.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search in skills
    if (person.skillIds) {
      const personSkills = person.skillIds
        .map(skillId => skills.find(s => s.id === skillId)?.name)
        .filter(Boolean);
      if (personSkills.some(skill => skill.toLowerCase().includes(searchLower))) {
        return true;
      }
    }
    
    // Search in data products
    const personAssignments = zuordnungen.filter(z => z.personId === person.id);
    const assignedProducts = personAssignments
      .map(z => datenprodukte.find(dp => dp.id === z.datenproduktId)?.name)
      .filter(Boolean);
    if (assignedProducts.some(product => product.toLowerCase().includes(searchLower))) {
      return true;
    }
    
    return false;
  });

  // Function to get currently absent people
  const getCurrentlyAbsentPeople = () => {
    const today = new Date();
    const currentlyAbsent = [];

    personen.forEach((person) => {
      const nameVariations = [
        person.name.toLowerCase(),
        person.name.toLowerCase().replace(/\s+/g, ''),
        person.name.toLowerCase().split(' ').reverse().join(' '),
        person.email?.toLowerCase().split('@')[0] || ''
      ];

      let isAbsent = false;
      nameVariations.forEach((nameVar) => {
        if (nameVar && vacations[nameVar]) {
          const hasCurrentVacation = vacations[nameVar].some((vacation) => {
            const start = new Date(vacation.start);
            const end = new Date(vacation.end);
            return today >= start && today <= end;
          });
          if (hasCurrentVacation) {
            isAbsent = true;
          }
        }
      });

      if (isAbsent) {
        currentlyAbsent.push(person);
      }
    });

    return currentlyAbsent;
  };

  const currentlyAbsentPeople = getCurrentlyAbsentPeople();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="container mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Team-Übersicht
          </h1>
          <p className="text-gray-600">
            Verwalte dein Team und überwache die Arbeitsauslastung
          </p>
          
          {/* Currently absent people */}
          {currentlyAbsentPeople.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Aktuell abwesend:</span>
              {currentlyAbsentPeople.map((person) => (
                <span key={person.id} className="inline-flex items-center gap-1">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                    {person.name}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <ReadOnlySearch 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {/* Team Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Gesamt</p>
                <p className="text-2xl font-semibold text-gray-900">{personen.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Mit Zuordnung</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {personen.filter(p => zuordnungen.some(z => z.personId === p.id)).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 text-lg">⚠️</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Überbucht</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {personen.filter(p => {
                    const wochenstunden = p.wochenstunden || 31;
                    const gebuchteStunden = zuordnungen
                      .filter(z => z.personId === p.id)
                      .reduce((sum, z) => sum + (z.stunden || 0), 0);
                    return gebuchteStunden > wochenstunden;
                  }).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 text-lg">🏖️</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Abwesend</p>
                <p className="text-2xl font-semibold text-gray-900">{currentlyAbsentPeople.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* People List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Team-Mitglieder ({filteredPersonen.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {filteredPersonen.map((person) => {
              const personAssignments = zuordnungen.filter(z => z.personId === person.id);
              const uniqueProducts = [...new Set(personAssignments.map(z => z.datenproduktId))];
              
              return (
                <div key={person.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{person.name}</h3>
                        <WorkloadIndicator person={person} zuordnungen={zuordnungen} />
                      </div>
                      
                      {person.email && (
                        <p className="text-sm text-gray-600 mb-3">{person.email}</p>
                      )}

                      {/* Skills */}
                      {person.skillIds && person.skillIds.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {person.skillIds.map((skillId) => {
                              const skill = skills.find((s) => s.id === skillId);
                              return skill ? (
                                <span
                                  key={skillId}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-gray-700 border"
                                  style={{ backgroundColor: skill.color + "20", borderColor: skill.color + "40" }}
                                >
                                  {skill.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {/* Assignments */}
                      {personAssignments.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">
                            Zuordnungen ({uniqueProducts.length} Produkte):
                          </p>
                          <div className="space-y-1">
                            {personAssignments.map((assignment) => {
                              const produkt = datenprodukte.find(dp => dp.id === assignment.datenproduktId);
                              const rolle = rollen.find(r => r.id === assignment.rolleId);
                              
                              return (
                                <div key={assignment.id} className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                                  <span className="font-medium">{produkt?.name || 'Unbekanntes Produkt'}</span>
                                  <span className="text-gray-500"> als </span>
                                  <span className="font-medium">{rolle?.name || 'Unbekannte Rolle'}</span>
                                  <span className="text-gray-500"> • {assignment.stunden || 0}h/Woche</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {filteredPersonen.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'Keine Personen gefunden.' : 'Noch keine Personen angelegt.'}
          </div>
        )}
      </div>
    </div>
  );
};