import React, { useState, useEffect } from "react";
import { useData } from "../context/DataProvider";
import {
  generateOptimalTeam,
  recommendTeamForProject,
  validateRoleRequirements,
} from "../utils/teamRecommendation";

const HoursInputOverlay = ({ isOpen, rolle, onSave, onClose }) => {
  const [hours, setHours] = useState("");

  useEffect(() => {
    if (isOpen && rolle) {
      setHours("");
    }
  }, [isOpen, rolle]);

  const handleSave = () => {
    if (hours) {
      onSave({
        rolleId: rolle.id,
        rolleName: rolle.name,
        hours: parseFloat(hours),
      });
    }
  };

  if (!isOpen || !rolle) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 rounded bg-ard-blue-500"></div>
          <h3 className="text-xl font-semibold text-gray-900">{rolle.name}</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stunden pro Woche
            </label>
            <input
              type="number"
              min="0.5"
              max="80"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="z.B. 20"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ard-blue-500 focus:border-ard-blue-500"
              autoFocus
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={!hours}
            className="px-6 py-2 bg-ard-blue-600 text-white rounded-lg hover:bg-ard-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
};

export const RoleRequirementsInput = ({
  onRequirementsChange,
  initialRequirements = [],
}) => {
  const { rollen } = useData();
  const [requirements, setRequirements] = useState(initialRequirements);
  const [showHoursInput, setShowHoursInput] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const handleRoleClick = (rolle) => {
    // Check if role is already selected
    const exists = requirements.find((req) => req.rolleId === rolle.id);
    if (exists) {
      // Remove existing requirement
      const updated = requirements.filter((req) => req.rolleId !== rolle.id);
      setRequirements(updated);
      onRequirementsChange(updated);
    } else {
      // Show hours input overlay
      setSelectedRole(rolle);
      setShowHoursInput(true);
    }
  };

  const handleHoursSave = (requirement) => {
    const updated = [...requirements, { ...requirement, id: Date.now() }];
    setRequirements(updated);
    onRequirementsChange(updated);
    setShowHoursInput(false);
    setSelectedRole(null);
  };

  const isRoleSelected = (rolleId) => {
    return requirements.some((req) => req.rolleId === rolleId);
  };

  const getRequirementByRole = (rolleId) => {
    return requirements.find((req) => req.rolleId === rolleId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Benötigte Rollen auswählen
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Klicke auf die Rollen, die für das Team benötigt werden. Bereits
          ausgewählte Rollen können durch erneutes Klicken entfernt werden.
        </p>

        <div className="flex flex-wrap gap-3">
          {rollen.map((rolle) => {
            const isSelected = isRoleSelected(rolle.id);
            const requirement = getRequirementByRole(rolle.id);

            return (
              <button
                key={rolle.id}
                onClick={() => handleRoleClick(rolle)}
                className={`relative px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 border-2 ${
                  isSelected
                    ? "border-ard-blue-500 text-white bg-ard-blue-500 shadow-lg transform scale-105"
                    : "border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md bg-white"
                }`}
              >
                {rolle.name}
                {isSelected && requirement && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                    {requirement.hours}h
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {requirements.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-xl">
          <h4 className="font-semibold text-gray-800 mb-3">
            Ausgewählte Rollen
          </h4>
          <div className="space-y-2">
            {requirements.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-ard-blue-500"></div>
                  <span className="font-medium text-gray-900">
                    {req.rolleName}
                  </span>
                  <span className="bg-ard-blue-100 text-ard-blue-800 px-2 py-1 rounded text-sm font-medium">
                    {req.hours}h/Woche
                  </span>
                </div>
                <button
                  onClick={() => handleRoleClick({ id: req.rolleId })}
                  className="text-red-500 hover:text-red-600 p-1 rounded transition-colors"
                  title="Entfernen"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <HoursInputOverlay
        isOpen={showHoursInput}
        rolle={selectedRole}
        onSave={handleHoursSave}
        onClose={() => {
          setShowHoursInput(false);
          setSelectedRole(null);
        }}
      />
    </div>
  );
};

export const TeamRecommendationResults = ({
  roleRequirements,
  onTeamChange,
}) => {
  const { personen, zuordnungen, labels, rollen } = useData();
  const [recommendations, setRecommendations] = useState(null);
  const [optimalTeam, setOptimalTeam] = useState(null);
  const [selectedCandidates, setSelectedCandidates] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    if (roleRequirements && roleRequirements.length > 0) {
      const errors = validateRoleRequirements(roleRequirements);
      setValidationErrors(errors);

      if (errors.length === 0) {
        const teamResult = generateOptimalTeam(
          roleRequirements,
          personen,
          zuordnungen,
          labels,
          rollen
        );
        setOptimalTeam(teamResult);

        const detailedRecommendations = recommendTeamForProject(
          roleRequirements,
          personen,
          zuordnungen,
          labels,
          rollen
        );
        setRecommendations(detailedRecommendations);

        // Initialize selected candidates with the optimal team
        const initialSelections = {};
        teamResult.team.forEach((member) => {
          initialSelections[member.rolleId] = member.personId;
        });
        setSelectedCandidates(initialSelections);
      } else {
        setOptimalTeam(null);
        setRecommendations(null);
        setSelectedCandidates({});
      }
    } else {
      setOptimalTeam(null);
      setRecommendations(null);
      setSelectedCandidates({});
      setValidationErrors([]);
    }
  }, [roleRequirements, personen, zuordnungen, labels, rollen]);

  const handleCandidateSelection = (rolleId, candidatePersonId) => {
    const updated = { ...selectedCandidates, [rolleId]: candidatePersonId };
    setSelectedCandidates(updated);

    // Create custom team based on selections
    const customTeam = [];
    roleRequirements.forEach((req) => {
      const selectedPersonId = updated[req.rolleId];
      if (selectedPersonId) {
        const recommendation = recommendations.find(
          (r) => r.rolleId === req.rolleId
        );
        const selectedCandidate = recommendation?.candidates.find(
          (c) => c.person.id === selectedPersonId
        );

        if (selectedCandidate) {
          customTeam.push({
            personId: selectedCandidate.person.id,
            personName: selectedCandidate.person.name,
            rolleId: req.rolleId,
            rolleName: req.rolleName,
            hours: req.hours,
            score: selectedCandidate.score,
            availableHours: selectedCandidate.availableHours,
            canFulfillHours: selectedCandidate.canFulfillHours,
            skillCount: selectedCandidate.skillCount,
          });
        }
      }
    });

    const customTeamResult = {
      team: customTeam,
      totalHours: customTeam.reduce((sum, member) => sum + member.hours, 0),
      feasible: customTeam.every((member) => member.canFulfillHours),
      recommendations,
    };

    if (onTeamChange) {
      onTeamChange(customTeamResult);
    }
  };

  if (validationErrors.length > 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Validierungsfehler
        </h3>
        <ul className="text-red-600 space-y-1">
          {validationErrors.map((error, index) => (
            <li key={index} className="text-sm">
              • {error}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!optimalTeam) return null;

  return (
    <div className="space-y-6">
      <div
        className={`p-6 rounded-xl border-2 ${
          optimalTeam.feasible
            ? "bg-green-50 border-green-200"
            : "bg-yellow-50 border-yellow-200"
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{optimalTeam.feasible ? "✅" : "⚠️"}</span>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Empfohlenes Team
            </h3>
            <p
              className={`text-sm ${
                optimalTeam.feasible ? "text-green-700" : "text-yellow-700"
              }`}
            >
              {optimalTeam.feasible
                ? "Alle Anforderungen können erfüllt werden"
                : "Einige Teammitglieder sind möglicherweise überlastet"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 mb-4">
          {optimalTeam.team.map((member, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">
                  {member.personName}
                </h4>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      member.canFulfillHours
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {member.canFulfillHours ? "Verfügbar" : "Überlastet"}
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                    Score: {Math.round(member.score)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Rolle:</span>
                  <p className="font-medium">{member.rolleName}</p>
                </div>
                <div>
                  <span className="text-gray-600">Rollen-Match:</span>
                  <p className="font-medium">
                    {Math.round(member.roleMatchScore || 100)}%
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Benötigt:</span>
                  <p className="font-medium">{member.hours}h/Woche</p>
                </div>
                <div>
                  <span className="text-gray-600">Verfügbar:</span>
                  <p className="font-medium">{member.availableHours}h/Woche</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-ard-blue-600">
                {optimalTeam.team.length}
              </p>
              <p className="text-sm text-gray-600">Teammitglieder</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-ard-blue-600">
                {optimalTeam.totalHours}h
              </p>
              <p className="text-sm text-gray-600">Gesamt pro Woche</p>
            </div>
            <div className="md:col-span-1 col-span-2">
              <p
                className={`text-2xl font-bold ${
                  optimalTeam.feasible ? "text-green-600" : "text-yellow-600"
                }`}
              >
                {Math.round(
                  (optimalTeam.team.filter((m) => m.canFulfillHours).length /
                    optimalTeam.team.length) *
                    100
                )}
                %
              </p>
              <p className="text-sm text-gray-600">Realisierbar</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Detaillierte Kandidaten
        </h3>
        {recommendations?.map((rec, index) => (
          <div key={index} className="mb-6 last:mb-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-4 h-4 rounded bg-ard-blue-500"></div>
              <h4 className="font-semibold text-gray-800">
                {rec.rolleName} ({rec.requiredHours}h/Woche)
              </h4>
              <span className="text-sm text-gray-600">
                - Wähle eine Person aus:
              </span>
            </div>
            <div className="grid gap-3">
              {rec.candidates.slice(0, 5).map((candidate, cidx) => {
                const isSelected =
                  selectedCandidates[rec.rolleId] === candidate.person.id;
                return (
                  <div
                    key={cidx}
                    onClick={() =>
                      handleCandidateSelection(rec.rolleId, candidate.person.id)
                    }
                    className={`bg-white p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected
                        ? "border-ard-blue-500 bg-ard-blue-50 ring-2 ring-ard-blue-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? "border-ard-blue-500 bg-ard-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">
                          {candidate.person.name}
                        </span>
                        {candidate.person.isM13 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                            M13
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {cidx === 0 && !isSelected && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            Empfohlen
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-xs bg-ard-blue-500 text-white px-2 py-1 rounded">
                            Ausgewählt
                          </span>
                        )}
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          Score: {Math.round(candidate.score)}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                      <div>Verfügbar: {candidate.availableHours}h</div>
                      <div>
                        Auslastung: {Math.round(candidate.workloadRatio * 100)}%
                      </div>
                      <div>
                        Rollen-Match:{" "}
                        {Math.round(
                          candidate.roleMatchScore || candidate.score
                        )}
                        %
                      </div>
                      <div
                        className={
                          candidate.canFulfillHours
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {candidate.canFulfillHours
                          ? "Kann erfüllen"
                          : "Überlastet"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
