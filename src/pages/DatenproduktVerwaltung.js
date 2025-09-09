// src/pages/DatenproduktVerwaltung.js
import React, { useState, useEffect } from "react";
import { useData } from "../context/DataProvider";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { NotesModal } from "../components/ui/NotesModal";
import { RoleRequirementsInput, TeamRecommendationResults } from "../components/TeamRecommendation";
import { generateOptimalTeam } from "../utils/teamRecommendation";

export const DatenproduktVerwaltung = () => {
  const {
    datenprodukte,
    erstelleDatenprodukt,
    aktualisiereDatenprodukt,
    loescheDatenprodukt,
    loading,
    error,
    personen,
    rollen,
    weisePersonDatenproduktRolleZu,
    zuordnungen,
    entfernePersonVonDatenproduktRolle,
    aktualisiereZuordnung,
    fuegeRolleHinzu,
  } = useData();

  const [showProduktForm, setShowProduktForm] = useState(false);
  const [editingProdukt, setEditingProdukt] = useState(null);
  const [name, setName] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [status, setStatus] = useState("In Planung");
  const [formError, setFormError] = useState("");
  const [selectedProduktForAssignment, setSelectedProduktForAssignment] =
    useState(null);
  const [assignPersonId, setAssignPersonId] = useState("");
  const [assignRolleId, setAssignRolleId] = useState("");
  const [assignStunden, setAssignStunden] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [produktToDelete, setProduktToDelete] = useState(null);
  const [notesProdukt, setNotesProdukt] = useState(null);
  const [neueRolleName, setNeueRolleName] = useState("");
  const [copySuccess, setCopySuccess] = useState(null);
  const [showTeamPlanner, setShowTeamPlanner] = useState(false);
  const [teamPlanerProdukt, setTeamPlanerProdukt] = useState(null);
  const [roleRequirements, setRoleRequirements] = useState([]);
  const [recommendedTeam, setRecommendedTeam] = useState(null);
  const [showTeamSaveDialog, setShowTeamSaveDialog] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  useEffect(() => {
    if (editingProdukt) {
      setName(editingProdukt.name);
      setBeschreibung(editingProdukt.beschreibung || "");
      setStatus(editingProdukt.status);
    } else {
      setName("");
      setBeschreibung("");
      setStatus("In Planung");
    }
  }, [editingProdukt]);

  const handleProduktFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!name.trim()) {
      setFormError("Name ist ein Pflichtfeld.");
      return;
    }
    const produktData = {
      name: name.trim(),
      beschreibung: beschreibung.trim(),
      status,
    };
    let success = false;
    if (editingProdukt && editingProdukt.id) {
      success = await aktualisiereDatenprodukt(editingProdukt.id, produktData);
    } else {
      success = await erstelleDatenprodukt(produktData);
    }
    if (success) {
      setShowProduktForm(false);
      setEditingProdukt(null);
    } else {
      setFormError("Fehler beim Speichern des Datenprodukts.");
    }
  };

  const handleOpenProduktForm = (produkt = null) => {
    setFormError("");
    setEditingProdukt(produkt);
    setShowProduktForm(true);
  };
  const handleDeleteDatenproduktInitiation = (produkt) => {
    setProduktToDelete(produkt);
    setShowDeleteModal(true);
  };
  const confirmDeleteDatenprodukt = async () => {
    if (produktToDelete) {
      await loescheDatenprodukt(produktToDelete.id);
    }
    setShowDeleteModal(false);
    setProduktToDelete(null);
  };

  const handleSaveNotes = async (text) => {
    if (notesProdukt) {
      await aktualisiereDatenprodukt(notesProdukt.id, { notizen: text });
    }
    setNotesProdukt(null);
  };

  const statusOptionen = [
    "In Planung",
    "In Entwicklung",
    "Live",
    "Archiviert",
    "On Hold / Pausiert",
  ];

  const handleAssignRoleSubmit = async (e) => {
    e.preventDefault();
    setAssignmentError("");
    if (!selectedProduktForAssignment || !assignPersonId || !assignRolleId) {
      setAssignmentError("Bitte Person und Rolle auswählen.");
      return;
    }
    const resultId = await weisePersonDatenproduktRolleZu(
      assignPersonId,
      selectedProduktForAssignment.id,
      assignRolleId,
      assignStunden
    );
    if (resultId) {
      setAssignPersonId("");
      setAssignRolleId("");
      setAssignStunden("");
    } else {
      setAssignmentError("Fehler bei der Zuweisung.");
    }
  };

  const handleNeueRolleAnlegen = async () => {
    if (!neueRolleName.trim()) return;
    const newId = await fuegeRolleHinzu(neueRolleName);
    if (newId) {
      setAssignRolleId(newId);
      setNeueRolleName("");
    }
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
  };


  const handleUpdateAssignment = async (updates) => {
    if (editingAssignment) {
      const success = await aktualisiereZuordnung(editingAssignment.id, updates);
      if (success) {
        setEditingAssignment(null);
      }
    }
  };

  const getPersonName = (personId) =>
    personen.find((p) => p.id === personId)?.name || "...";
  const getRolleName = (rolleId) =>
    rollen.find((r) => r.id === rolleId)?.name || "...";


  const copyTeamEmailsToClipboard = async (datenprodukt) => {
    const teamZuordnungen = zuordnungen.filter((z) => z.datenproduktId === datenprodukt.id);
    const emails = teamZuordnungen
      .map((z) => {
        const person = personen.find((p) => p.id === z.personId);
        return person ? `${person.name} <${person.email}>` : null;
      })
      .filter(Boolean)
      .join('; ');
    
    if (emails) {
      try {
        await navigator.clipboard.writeText(emails);
        setCopySuccess(datenprodukt.id);
        setTimeout(() => setCopySuccess(null), 2000);
      } catch (err) {
        console.error('Failed to copy emails:', err);
      }
    }
  };

  const handleOpenTeamPlanner = (datenprodukt = null) => {
    setShowTeamPlanner(true);
    setTeamPlanerProdukt(datenprodukt);
    setRoleRequirements([]);
    setRecommendedTeam(null);
  };

  const handleCloseTeamPlanner = () => {
    setShowTeamPlanner(false);
    setTeamPlanerProdukt(null);
    setRoleRequirements([]);
    setRecommendedTeam(null);
  };

  const handleRoleRequirementsChange = (requirements) => {
    setRoleRequirements(requirements);
  };

  const handleTeamChange = (team) => {
    setRecommendedTeam(team);
  };

  const handleCreateTeam = () => {
    // If no manual team selection was made, use the optimal team from recommendations
    let teamToUse = recommendedTeam;
    
    if (!teamToUse && roleRequirements.length > 0) {
      // Generate the optimal team automatically
      const optimalTeam = generateOptimalTeam(
        roleRequirements,
        personen,
        zuordnungen,
        [],
        rollen
      );
      teamToUse = optimalTeam;
    }
    
    if (!teamToUse || !teamToUse.team || teamToUse.team.length === 0) {
      return;
    }
    
    // Store the team to use for creation
    setRecommendedTeam(teamToUse);
    setShowTeamPlanner(false); // Close the team planner modal first
    setShowTeamSaveDialog(true);
  };

  const handleSaveNewTeam = async () => {
    if (!newTeamName.trim() || !recommendedTeam) {
      return;
    }

    try {
      // Create new data product
      const newProductId = await erstelleDatenprodukt({
        name: newTeamName.trim(),
        beschreibung: "Automatisch erstellt durch Team-Planung",
        status: "In Planung"
      });

      if (newProductId) {
        // Assign team members to the new data product
        for (const member of recommendedTeam.team) {
          await weisePersonDatenproduktRolleZu(
            member.personId,
            newProductId,
            member.rolleId,
            member.hours
          );
        }

        // Close modals and reset state
        setShowTeamSaveDialog(false);
        setShowTeamPlanner(false);
        setNewTeamName("");
        setRoleRequirements([]);
        setRecommendedTeam(null);
        setTeamPlanerProdukt(null);
      }
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleCancelTeamSave = () => {
    setShowTeamSaveDialog(false);
    setNewTeamName("");
    setShowTeamPlanner(true); // Reopen the team planner modal
  };

  const sortedPersonen = [...personen].sort((a, b) =>
    a.name.localeCompare(b.name, "de")
  );

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  if (error) return <p className="text-center text-red-500 py-8">{error}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-ard-blue-50/30">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Datenproduktverwaltung
            </h1>
            <p className="text-gray-600">Verwalte deine Datenprodukte und Teams</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenTeamPlanner(null)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-lg">🎯</span>
              Team planen
            </button>
            <button
              onClick={() => handleOpenProduktForm()}
              className="bg-gradient-to-r from-ard-blue-600 to-ard-blue-700 hover:from-ard-blue-700 hover:to-ard-blue-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Neues Datenprodukt
            </button>
          </div>
        </div>
      {showProduktForm && (
        <div
          className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-40 p-4"
          onClick={() => {
            setShowProduktForm(false);
            setEditingProdukt(null);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleProduktFormSubmit} className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                {editingProdukt
                  ? "Datenprodukt bearbeiten"
                  : "Neues Datenprodukt erstellen"}
              </h2>
              {formError && (
                <p className="text-red-500 text-sm mb-3">{formError}</p>
              )}
              <div>
                <label htmlFor="dp-form-name" className="block text-sm">
                  Name
                </label>
                <input
                  id="dp-form-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label htmlFor="dp-form-beschreibung" className="block text-sm">
                  Beschreibung
                </label>
                <textarea
                  id="dp-form-beschreibung"
                  value={beschreibung}
                  onChange={(e) => setBeschreibung(e.target.value)}
                  rows="3"
                  className="mt-1 block w-full border rounded-md p-2"
                ></textarea>
              </div>
              <div>
                <label htmlFor="dp-form-status" className="block text-sm">
                  Status
                </label>
                <select
                  id="dp-form-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 block w-full border rounded-md p-2"
                >
                  {statusOptionen.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowProduktForm(false);
                    setEditingProdukt(null);
                  }}
                  className="px-4 py-2 border rounded-md"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md"
                >
                  {editingProdukt ? "Speichern" : "Erstellen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Datenprodukt löschen"
        message={`Möchten Sie "${produktToDelete?.name}" wirklich löschen?`}
        onConfirm={confirmDeleteDatenprodukt}
        onCancel={() => setShowDeleteModal(false)}
      />
      {datenprodukte.length === 0 && !loading && (
        <p className="text-center text-gray-500 py-8">
          Noch keine Datenprodukte erfasst.
        </p>
      )}
        <DatenproduktListe
          datenprodukte={datenprodukte}
          zuordnungen={zuordnungen}
          getPersonName={getPersonName}
          getRolleName={getRolleName}
          handleEditAssignment={handleEditAssignment}
          entfernePersonVonDatenproduktRolle={entfernePersonVonDatenproduktRolle}
          copyTeamEmailsToClipboard={copyTeamEmailsToClipboard}
          setSelectedProduktForAssignment={setSelectedProduktForAssignment}
          setAssignmentError={setAssignmentError}
          setNotesProdukt={setNotesProdukt}
          handleOpenProduktForm={handleOpenProduktForm}
          handleDeleteDatenproduktInitiation={handleDeleteDatenproduktInitiation}
          copySuccess={copySuccess}
        />
      {selectedProduktForAssignment && (
        <div
          className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50 p-4"
          onClick={() => setSelectedProduktForAssignment(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">
              Team für "{selectedProduktForAssignment.name}" verwalten
            </h3>
            {assignmentError && (
              <p className="text-red-500 text-sm mb-3">{assignmentError}</p>
            )}
            <form onSubmit={handleAssignRoleSubmit} className="space-y-4">
              <div>
                <label htmlFor="assign-person" className="block text-sm">
                  Person
                </label>
                <select
                  id="assign-person"
                  value={assignPersonId}
                  onChange={(e) => setAssignPersonId(e.target.value)}
                  required
                  className="mt-1 block w-full p-2 border rounded-md"
                >
                  <option value="">Person auswählen</option>
                  {sortedPersonen.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="assign-role" className="block text-sm">
                  Rolle
                </label>
                <select
                  id="assign-role"
                  value={assignRolleId}
                  onChange={(e) => setAssignRolleId(e.target.value)}
                  required
                  className="mt-1 block w-full p-2 border rounded-md"
                >
                  <option value="">Rolle auswählen</option>
                  {rollen.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex">
                  <input
                    type="text"
                    value={neueRolleName}
                    onChange={(e) => setNeueRolleName(e.target.value)}
                    placeholder="Neue Rolle"
                    className="flex-grow p-2 border rounded-md"
                  />
                  <button
                    type="button"
                    onClick={handleNeueRolleAnlegen}
                    className="ml-2 px-3 py-2 bg-indigo-600 text-white rounded-md"
                  >
                    Hinzufügen
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="assign-stunden" className="block text-sm">
                  Stunden pro Woche
                </label>
                <input
                  id="assign-stunden"
                  type="number"
                  min="0"
                  max="80"
                  step="0.5"
                  value={assignStunden}
                  onChange={(e) => setAssignStunden(e.target.value)}
                  placeholder="z.B. 20"
                  className="mt-1 block w-full p-2 border rounded-md"
                />
                <p className="mt-1 text-xs text-gray-500">Optional: Wochenstunden für diese Zuweisung</p>
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedProduktForAssignment(null)}
                  className="px-4 py-2 border rounded-md"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md"
                >
                  Zuweisen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <NotesModal
        isOpen={!!notesProdukt}
        initialNotes={notesProdukt?.notizen || ""}
        onSave={handleSaveNotes}
        onClose={() => setNotesProdukt(null)}
      />
      {editingAssignment && (
        <EditAssignmentModal
          assignment={editingAssignment}
          rollen={rollen}
          onSave={handleUpdateAssignment}
          onClose={() => setEditingAssignment(null)}
          getPersonName={getPersonName}
        />
      )}
      
      {/* Team Planner Modal */}
      {showTeamPlanner && (
        <div
          className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50 p-4"
          onClick={handleCloseTeamPlanner}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {teamPlanerProdukt 
                    ? `Team planen für "${teamPlanerProdukt.name}"`
                    : "Neues Team planen"
                  }
                </h2>
                <p className="text-gray-600 mt-1">
                  Wähle die benötigten Rollen und Stunden aus, um Teamvorschläge zu erhalten
                </p>
              </div>
              <button
                onClick={handleCloseTeamPlanner}
                className="text-gray-400 hover:text-gray-600 text-2xl p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Schließen"
              >
                ×
              </button>
            </div>

            <div className="space-y-8">
              <RoleRequirementsInput
                onRequirementsChange={handleRoleRequirementsChange}
                initialRequirements={roleRequirements}
              />

              {roleRequirements.length > 0 && (
                <TeamRecommendationResults
                  roleRequirements={roleRequirements}
                  onTeamChange={handleTeamChange}
                />
              )}

              {roleRequirements.length > 0 && (
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleCloseTeamPlanner}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleCreateTeam}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                  >
                    <span className="text-lg">✨</span>
                    Team anlegen
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Team Save Dialog */}
      {showTeamSaveDialog && (
        <div
          className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-60 p-4"
          onClick={handleCancelTeamSave}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Neues Team erstellen
            </h3>
            <p className="text-gray-600 mb-4">
              Gib einen Namen für das neue Datenprodukt ein. Das Team wird automatisch zugewiesen.
            </p>
            <div className="mb-6">
              <label htmlFor="team-name" className="block text-sm font-medium text-gray-700 mb-2">
                Datenprodukt-Name
              </label>
              <input
                id="team-name"
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="z.B. Marketing Analytics Team"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                autoFocus
                required
              />
            </div>
            
            {recommendedTeam && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Team-Übersicht</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {recommendedTeam.team.map((member, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{member.personName}</span>
                      <span>{member.rolleName} ({member.hours}h)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelTeamSave}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveNewTeam}
                disabled={!newTeamName.trim()}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-2 px-6 rounded-lg shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200 disabled:cursor-not-allowed"
              >
                Team erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Overlay */}
      {copySuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Adressen in die Zwischenablage kopiert</span>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

const DatenproduktKarte = ({ 
  dp, 
  zuordnungen, 
  getPersonName, 
  getRolleName, 
  handleEditAssignment,
  entfernePersonVonDatenproduktRolle,
  copyTeamEmailsToClipboard,
  setSelectedProduktForAssignment,
  setAssignmentError,
  setNotesProdukt,
  handleOpenProduktForm,
  handleDeleteDatenproduktInitiation,
  copySuccess 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const teamZuordnungen = zuordnungen.filter((z) => z.datenproduktId === dp.id);
  
  // Status-Indikator für kompakte Ansicht
  const getStatusColor = (status) => {
    switch (status) {
      case 'Live': return 'bg-green-100 text-green-700 border-green-200';
      case 'In Entwicklung': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'In Planung': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Archiviert': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'On Hold / Pausiert': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-lg border border-gray-200 hover:border-gray-300 overflow-hidden">
      {/* Kompakte Ansicht */}
      <div 
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Status-Indikator */}
          <div className={`flex-shrink-0 w-3 h-3 rounded-full ${getStatusColor(dp.status).replace('text-', 'bg-').replace('border-', '').split(' ')[0]}`}></div>
          
          {/* Name und Team-Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{dp.name}</h3>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${getStatusColor(dp.status)}`}>
                {dp.status}
              </span>
            </div>
            
            {/* Team-Info - kompakt */}
            {teamZuordnungen.length > 0 && (
              <div className="text-xs text-gray-500 truncate mt-1">
                Team: {teamZuordnungen.slice(0, 2).map(z => getPersonName(z.personId)).join(', ')}
                {teamZuordnungen.length > 2 && ` +${teamZuordnungen.length - 2}`}
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons - Essentials */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyTeamEmailsToClipboard(dp);
            }}
            className="inline-flex items-center justify-center w-7 h-7 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="E-Mail-Adressen kopieren"
            disabled={teamZuordnungen.length === 0}
          >
            <span className="text-sm">📧</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProduktForAssignment(dp);
              setAssignmentError("");
            }}
            className="inline-flex items-center justify-center w-7 h-7 text-green-600 hover:bg-green-50 rounded-md transition-colors"
            title="Team zuweisen"
          >
            <span className="text-sm">👥</span>
          </button>
          
          {/* Expand-Indikator */}
          <div className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Erweiterte Ansicht */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {/* Beschreibung */}
          <div className="mb-3 mt-3">
            <p className="text-sm text-gray-600">
              {dp.beschreibung || "Keine Beschreibung"}
            </p>
          </div>

          {/* Team Details */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Team</h4>
            {teamZuordnungen.length > 0 ? (
              <div className="space-y-1">
                {teamZuordnungen.map((zuordnung) => (
                  <div
                    key={zuordnung.id}
                    className="text-xs bg-gradient-to-r from-gray-50 to-gray-100 p-2 rounded border border-gray-200 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {getPersonName(zuordnung.personId)}
                      </div>
                      <div className="text-gray-600 text-xs truncate">
                        {getRolleName(zuordnung.rolleId)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <span className="bg-ard-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap">
                        {zuordnung.stunden || 0}h
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAssignment(zuordnung);
                        }}
                        className="text-ard-blue-500 hover:text-ard-blue-700 p-1 rounded transition-colors"
                        title="Bearbeiten"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          entfernePersonVonDatenproduktRolle(zuordnung.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                        title="Zuweisung entfernen"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">Kein Team zugewiesen.</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-gray-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNotesProdukt(dp);
              }}
              className={`px-2 py-1 text-sm font-medium rounded transition-all duration-200 ${
                dp.notizen 
                  ? "bg-ard-blue-500 text-white hover:bg-ard-blue-600" 
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
              title={dp.notizen ? "Notizen bearbeiten" : "Notizen hinzufügen"}
            >
              {dp.notizen ? "📝" : "📄"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenProduktForm(dp);
              }}
              className="px-2 py-1 text-sm text-ard-blue-600 hover:text-ard-blue-700 hover:bg-ard-blue-50 font-medium rounded transition-all duration-200"
              title="Bearbeiten"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteDatenproduktInitiation(dp);
              }}
              className="px-2 py-1 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 font-medium rounded transition-all duration-200"
              title="Löschen"
            >
              🗑️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DatenproduktListe = ({
  datenprodukte,
  zuordnungen,
  getPersonName,
  getRolleName,
  handleEditAssignment,
  entfernePersonVonDatenproduktRolle,
  copyTeamEmailsToClipboard,
  setSelectedProduktForAssignment,
  setAssignmentError,
  setNotesProdukt,
  handleOpenProduktForm,
  handleDeleteDatenproduktInitiation,
  copySuccess
}) => {
  // Gruppiere Datenprodukte nach Status
  const groupedProdukte = datenprodukte.reduce((groups, dp) => {
    const status = dp.status || 'Unbekannt';
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(dp);
    return groups;
  }, {});

  // Sortiere Status-Gruppen nach Priorität
  const statusOrder = ['Live', 'In Entwicklung', 'In Planung', 'On Hold / Pausiert', 'Archiviert'];
  const sortedStatus = Object.keys(groupedProdukte).sort((a, b) => {
    const indexA = statusOrder.indexOf(a) !== -1 ? statusOrder.indexOf(a) : 999;
    const indexB = statusOrder.indexOf(b) !== -1 ? statusOrder.indexOf(b) : 999;
    return indexA - indexB;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Live': return 'text-green-700 bg-green-100 border-green-200';
      case 'In Entwicklung': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'In Planung': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'Archiviert': return 'text-gray-700 bg-gray-100 border-gray-200';
      case 'On Hold / Pausiert': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {sortedStatus.map((status) => (
        <div key={status} className="space-y-4">
          {/* Status-Header */}
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">{status}</h2>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}>
              {groupedProdukte[status].length} Produkt{groupedProdukte[status].length !== 1 ? 'e' : ''}
            </span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
          
          {/* Datenprodukte-Grid für diesen Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {groupedProdukte[status].map((dp) => (
              <DatenproduktKarte
                key={dp.id}
                dp={dp}
                zuordnungen={zuordnungen}
                getPersonName={getPersonName}
                getRolleName={getRolleName}
                handleEditAssignment={handleEditAssignment}
                entfernePersonVonDatenproduktRolle={entfernePersonVonDatenproduktRolle}
                copyTeamEmailsToClipboard={copyTeamEmailsToClipboard}
                setSelectedProduktForAssignment={setSelectedProduktForAssignment}
                setAssignmentError={setAssignmentError}
                setNotesProdukt={setNotesProdukt}
                handleOpenProduktForm={handleOpenProduktForm}
                handleDeleteDatenproduktInitiation={handleDeleteDatenproduktInitiation}
                copySuccess={copySuccess}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const EditAssignmentModal = ({ assignment, rollen, onSave, onClose, getPersonName }) => {
  const [stunden, setStunden] = useState(assignment.stunden || 0);
  const [rolleId, setRolleId] = useState(assignment.rolleId || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    const updates = {};
    
    if (Number(stunden) !== (assignment.stunden || 0)) {
      updates.stunden = stunden;
    }
    
    if (rolleId !== assignment.rolleId) {
      updates.rolleId = rolleId;
    }
    
    if (Object.keys(updates).length > 0) {
      onSave(updates);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4">Zuordnung bearbeiten</h3>
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm">
            <strong>{getPersonName(assignment.personId)}</strong>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-rolle" className="block text-sm font-medium">
              Rolle
            </label>
            <select
              id="edit-rolle"
              value={rolleId}
              onChange={(e) => setRolleId(e.target.value)}
              required
              className="mt-1 block w-full p-2 border rounded-md"
            >
              <option value="">Rolle auswählen</option>
              {rollen.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="edit-stunden" className="block text-sm font-medium">
              Stunden pro Woche
            </label>
            <input
              id="edit-stunden"
              type="number"
              min="0"
              max="80"
              step="0.5"
              value={stunden}
              onChange={(e) => setStunden(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md"
            />
            <p className="mt-1 text-xs text-gray-500">Optional: Wochenstunden für diese Zuweisung</p>
          </div>
          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-ard-blue-600 text-white rounded-md"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
