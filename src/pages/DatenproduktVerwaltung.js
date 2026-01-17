// src/pages/DatenproduktVerwaltung.js
import React, { useState, useEffect } from "react";
import { useData } from "../context/DataProvider";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { NotesModal } from "../components/ui/NotesModal";
import { RoleRequirementsInput, TeamRecommendationResults } from "../components/TeamRecommendation";
import { generateOptimalTeam } from "../utils/teamRecommendation";

export const DatenproduktVerwaltung = ({ initialSelectedId, onSelectedClear }) => {
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
  const [selectedProduktForDetails, setSelectedProduktForDetails] = useState(null);

  // Open details when navigating with a specific product ID
  useEffect(() => {
    if (initialSelectedId && datenprodukte?.length > 0) {
      const produkt = datenprodukte.find(p => p.id === initialSelectedId);
      if (produkt) {
        setSelectedProduktForDetails(produkt);
        onSelectedClear?.();
      }
    }
  }, [initialSelectedId, datenprodukte, onSelectedClear]);

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
      setFormError("Fehler beim Speichern des Teams.");
    }
  };

  const handleOpenProduktForm = (produkt = null) => {
    setFormError("");
    setEditingProdukt(produkt);
    setShowProduktForm(true);
  };

  const handleShowDetails = (datenprodukt) => {
    setSelectedProduktForDetails(datenprodukt);
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

    // Berechne Stunden: direkte Eingabe oder Prozent der Kapazität
    let stundenWert = assignStunden;
    if (assignStunden && assignStunden.includes("%")) {
      const prozent = parseFloat(assignStunden.replace("%", "").trim());
      if (isNaN(prozent)) {
        setAssignmentError("Ungültiger Prozentwert.");
        return;
      }
      const person = personen.find(p => p.id === assignPersonId);
      const kapazitaet = person?.wochenstunden || 31;
      stundenWert = (kapazitaet * prozent) / 100;
    }

    const resultId = await weisePersonDatenproduktRolleZu(
      assignPersonId,
      selectedProduktForAssignment.id,
      assignRolleId,
      stundenWert
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
  const getRoleColor = (rolleId) =>
    rollen.find((r) => r.id === rolleId)?.color || "#6B7280";

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  if (error) return <p className="text-center text-red-500 dark:text-red-400 py-8">{error}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-ard-blue-50/30 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-6 py-8 max-w-[1600px]">
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-display">
              Teamverwaltung
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Verwalte deine Teams und Zuordnungen</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenTeamPlanner(null)}
              className="w-14 h-14 bg-purple-600 hover:bg-white text-white hover:text-purple-600 border-2 border-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group active:scale-95 flex-shrink-0"
              title="Team planen"
            >
              <svg
                className="w-6 h-6 transition-transform duration-200 group-active:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
            <button
              onClick={() => handleOpenProduktForm()}
              className="w-14 h-14 bg-ard-blue-600 hover:bg-white text-white hover:text-ard-blue-600 border-2 border-ard-blue-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group active:scale-95 flex-shrink-0"
              title="Neues Team erstellen"
            >
              <svg
                className="w-6 h-6 transition-transform duration-200 group-active:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>

        {showProduktForm && (
          <div
            className="fixed inset-0 bg-gray-800 bg-opacity-75 dark:bg-black dark:bg-opacity-75 flex justify-center items-center z-40 p-4"
            onClick={() => {
              setShowProduktForm(false);
              setEditingProdukt(null);
            }}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleProduktFormSubmit} className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
                  {editingProdukt
                    ? "Team bearbeiten"
                    : "Neues Team erstellen"}
                </h2>
                {formError && (
                  <p className="text-red-500 dark:text-red-400 text-sm mb-3">{formError}</p>
                )}
                <div>
                  <label htmlFor="dp-form-name" className="block text-sm text-gray-700 dark:text-gray-300">
                    Name
                  </label>
                  <input
                    id="dp-form-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label htmlFor="dp-form-beschreibung" className="block text-sm text-gray-700 dark:text-gray-300">
                    Beschreibung
                  </label>
                  <textarea
                    id="dp-form-beschreibung"
                    value={beschreibung}
                    onChange={(e) => setBeschreibung(e.target.value)}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="dp-form-status" className="block text-sm text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    id="dp-form-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
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
          title="Team löschen"
          message={`Möchten Sie "${produktToDelete?.name}" wirklich löschen?`}
          onConfirm={confirmDeleteDatenprodukt}
          onCancel={() => setShowDeleteModal(false)}
        />

        {datenprodukte.length === 0 && !loading && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Noch keine Teams erfasst.
          </p>
        )}

        <DatenproduktListe
          datenprodukte={datenprodukte}
          zuordnungen={zuordnungen}
          getPersonName={getPersonName}
          getRolleName={getRolleName}
          getRoleColor={getRoleColor}
          copyTeamEmailsToClipboard={copyTeamEmailsToClipboard}
          setSelectedProduktForAssignment={setSelectedProduktForAssignment}
          setAssignmentError={setAssignmentError}
          copySuccess={copySuccess}
          onShowDetails={handleShowDetails}
        />

        <DatenproduktDetailsModal
          datenprodukt={selectedProduktForDetails}
          isOpen={!!selectedProduktForDetails}
          onClose={() => setSelectedProduktForDetails(null)}
          onEdit={handleOpenProduktForm}
          onDelete={handleDeleteDatenproduktInitiation}
          onShowNotes={setNotesProdukt}
          onShowTeamAssignment={setSelectedProduktForAssignment}
          setAssignmentError={setAssignmentError}
          zuordnungen={zuordnungen}
          getPersonName={getPersonName}
          getRolleName={getRolleName}
          getRoleColor={getRoleColor}
          handleEditAssignment={handleEditAssignment}
          entfernePersonVonDatenproduktRolle={entfernePersonVonDatenproduktRolle}
          copyTeamEmailsToClipboard={copyTeamEmailsToClipboard}
          copySuccess={copySuccess}
        />

        {selectedProduktForAssignment && (
          <div
            className="fixed inset-0 bg-gray-800 bg-opacity-75 dark:bg-black dark:bg-opacity-75 flex justify-center items-center z-50 p-4"
            onClick={() => setSelectedProduktForAssignment(null)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Team für "{selectedProduktForAssignment.name}" verwalten
              </h3>
              {assignmentError && (
                <p className="text-red-500 dark:text-red-400 text-sm mb-3">{assignmentError}</p>
              )}
              <form onSubmit={handleAssignRoleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="assign-person" className="block text-sm text-gray-700 dark:text-gray-300">
                    Person
                  </label>
                  <select
                    id="assign-person"
                    value={assignPersonId}
                    onChange={(e) => setAssignPersonId(e.target.value)}
                    required
                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                  <label htmlFor="assign-role" className="block text-sm text-gray-700 dark:text-gray-300">
                    Rolle
                  </label>
                  <select
                    id="assign-role"
                    value={assignRolleId}
                    onChange={(e) => setAssignRolleId(e.target.value)}
                    required
                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                      className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <button
                      type="button"
                      onClick={handleNeueRolleAnlegen}
                      className="ml-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                    >
                      Hinzufügen
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="assign-stunden" className="block text-sm text-gray-700 dark:text-gray-300">
                    Stunden pro Woche
                  </label>
                  <input
                    id="assign-stunden"
                    type="text"
                    value={assignStunden}
                    onChange={(e) => setAssignStunden(e.target.value)}
                    placeholder="z.B. 20 oder 50%"
                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Optional: Stunden direkt oder Prozent der Kapazität (z.B. 50%)</p>
                </div>
                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedProduktForAssignment(null)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
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
            personen={personen}
            onSave={handleUpdateAssignment}
            onClose={() => setEditingAssignment(null)}
            getPersonName={getPersonName}
          />
        )}
        
        {/* Team Planner Modal */}
        {showTeamPlanner && (
          <div
            className="fixed inset-0 bg-gray-800 bg-opacity-75 dark:bg-black dark:bg-opacity-75 flex justify-center items-center z-50 p-4"
            onClick={handleCloseTeamPlanner}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {teamPlanerProdukt
                      ? `Team planen für "${teamPlanerProdukt.name}"`
                      : "Neues Team planen"
                    }
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Wähle die benötigten Rollen und Stunden aus, um Teamvorschläge zu erhalten
                  </p>
                </div>
                <button
                  onClick={handleCloseTeamPlanner}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleCloseTeamPlanner}
                      className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium rounded-lg transition-colors"
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
            className="fixed inset-0 bg-gray-800 bg-opacity-75 dark:bg-black dark:bg-opacity-75 flex justify-center items-center z-60 p-4"
            onClick={handleCancelTeamSave}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Neues Team erstellen
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Gib einen Namen für das neue Team ein. Die Mitglieder werden automatisch zugewiesen.
              </p>
              <div className="mb-6">
                <label htmlFor="team-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Team-Name
                </label>
                <input
                  id="team-name"
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="z.B. Marketing Analytics Team"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  autoFocus
                  required
                />
              </div>

              {recommendedTeam && (
                <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Team-Übersicht</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
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
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium rounded-lg transition-colors"
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

const DatenproduktDetailsModal = ({
  datenprodukt,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onShowNotes,
  onShowTeamAssignment,
  setAssignmentError,
  zuordnungen,
  getPersonName,
  getRolleName,
  getRoleColor,
  handleEditAssignment,
  entfernePersonVonDatenproduktRolle,
  copyTeamEmailsToClipboard,
  copySuccess
}) => {
  if (!datenprodukt) return null;

  const teamZuordnungen = zuordnungen.filter((z) => z.datenproduktId === datenprodukt.id);

  // Calculate total hours
  const totalStunden = teamZuordnungen.reduce((sum, z) => sum + (z.stunden || 0), 0);

  // Status color helper
  const getStatusColor = (status) => {
    switch (status) {
      case 'Live': return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'In Entwicklung': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'In Planung': return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'Archiviert': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
      case 'On Hold / Pausiert': return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const getStatusGradient = (status) => {
    switch (status) {
      case 'Live': return 'from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-900/20';
      case 'In Entwicklung': return 'from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-900/20';
      case 'In Planung': return 'from-yellow-50 to-yellow-100/50 dark:from-yellow-900/30 dark:to-yellow-900/20';
      case 'Archiviert': return 'from-gray-50 to-gray-100/50 dark:from-gray-700/30 dark:to-gray-700/20';
      case 'On Hold / Pausiert': return 'from-red-50 to-red-100/50 dark:from-red-900/30 dark:to-red-900/20';
      default: return 'from-gray-50 to-gray-100/50 dark:from-gray-700/30 dark:to-gray-700/20';
    }
  };

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
        className={`fixed inset-y-0 right-0 w-full sm:w-[520px] bg-white dark:bg-gray-800 shadow-2xl z-50
                    transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className={`flex-shrink-0 bg-gradient-to-br ${getStatusGradient(datenprodukt.status)} border-b border-gray-200 dark:border-gray-700`}>
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
                <div className="flex gap-2">
                  <button
                    onClick={() => { onEdit(datenprodukt); onClose(); }}
                    className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-white/50 dark:hover:bg-gray-600 transition-all"
                    title="Bearbeiten"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => { onDelete(datenprodukt); onClose(); }}
                    className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white/50 dark:hover:bg-gray-600 transition-all"
                    title="Löschen"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Team Icon & Name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600
                                flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  📊
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{datenprodukt.name}</h2>
                  <span className={`inline-flex items-center px-2.5 py-1 mt-1 rounded-lg text-xs font-semibold border ${getStatusColor(datenprodukt.status)}`}>
                    {datenprodukt.status}
                  </span>
                </div>
              </div>

              {/* Description */}
              {datenprodukt.beschreibung && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 line-clamp-2">
                  {datenprodukt.beschreibung}
                </p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-accent-50 dark:bg-accent-900/30 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">{teamZuordnungen.length}</div>
                  <div className="text-xs text-accent-700 dark:text-accent-300">Team-Mitglieder</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalStunden}h</div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">Wochenstunden</div>
                </div>
              </div>

              {/* Team Management Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Team-Mitglieder</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyTeamEmailsToClipboard(datenprodukt)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                      title="E-Mail-Adressen kopieren"
                      disabled={teamZuordnungen.length === 0}
                    >
                      📧 E-Mails
                    </button>
                    <button
                      onClick={() => {
                        onShowTeamAssignment(datenprodukt);
                        setAssignmentError("");
                        onClose();
                      }}
                      className="text-xs bg-green-600 text-white hover:bg-green-700 px-2.5 py-1 rounded-lg transition-colors font-medium"
                    >
                      + Person
                    </button>
                  </div>
                </div>

                {teamZuordnungen.length > 0 ? (
                  <div className="space-y-2">
                    {teamZuordnungen.map((zuordnung) => (
                      <div
                        key={zuordnung.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500
                                          flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {getPersonName(zuordnung.personId).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {getPersonName(zuordnung.personId)}
                            </div>
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-white mt-0.5"
                              style={{ backgroundColor: getRoleColor(zuordnung.rolleId) }}
                            >
                              {getRolleName(zuordnung.rolleId)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          <span className="bg-accent-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                            {zuordnung.stunden || 0}h
                          </span>
                          <button
                            onClick={() => handleEditAssignment(zuordnung)}
                            className="p-1.5 text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors"
                            title="Bearbeiten"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => entfernePersonVonDatenproduktRolle(zuordnung.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors"
                            title="Entfernen"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="text-3xl mb-2">👥</div>
                    <p className="font-medium text-sm">Kein Team zugewiesen</p>
                    <p className="text-xs mt-1">Füge Personen zu diesem Team hinzu</p>
                  </div>
                )}
              </div>

              {/* Notes Section */}
              {datenprodukt.notizen && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span>📝</span> Notizen
                  </h3>
                  <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{datenprodukt.notizen}</p>
                  </div>
                </div>
              )}

              {/* Action Button for Notes */}
              <button
                onClick={() => { onShowNotes(datenprodukt); onClose(); }}
                className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
                  datenprodukt.notizen
                    ? "bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 hover:bg-accent-200 dark:hover:bg-accent-900/50"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {datenprodukt.notizen ? "📝 Notizen bearbeiten" : "📝 Notizen hinzufügen"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const DatenproduktKarte = ({
  dp,
  zuordnungen,
  getPersonName,
  getRolleName,
  getRoleColor,
  copyTeamEmailsToClipboard,
  setSelectedProduktForAssignment,
  setAssignmentError,
  copySuccess,
  onShowDetails
}) => {
  const teamZuordnungen = zuordnungen.filter((z) => z.datenproduktId === dp.id);

  // Calculate team hours
  const totalHours = teamZuordnungen.reduce((sum, z) => sum + (z.stunden || 0), 0);

  // Staffing risk
  const uniquePersons = new Set(teamZuordnungen.map(z => z.personId)).size;
  const risk = uniquePersons === 0 ? 'critical' : uniquePersons === 1 ? 'high' : uniquePersons === 2 ? 'medium' : 'ok';

  const getRiskBadge = () => {
    const styles = {
      critical: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
      high: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      medium: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
      ok: ''
    };
    const labels = {
      critical: 'Kein Team',
      high: '1 Person',
      medium: '2 Personen',
      ok: null
    };
    if (!labels[risk]) return null;
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[risk]}`}>
        {labels[risk]}
      </span>
    );
  };

  return (
    <div
      className="dashboard-card cursor-pointer group"
      onClick={() => onShowDetails(dp)}
    >
      <div className="flex-1 min-w-0">
        {/* Name Row */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
            {dp.name}
          </h3>
          {dp.notizen && (
            <span className="text-xs text-ard-blue-600 dark:text-ard-blue-400">📝</span>
          )}
        </div>

        {/* Description */}
        {dp.beschreibung && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
            {dp.beschreibung}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {getRiskBadge()}
          {totalHours > 0 && (
            <span className="dashboard-badge bg-ard-blue-100 dark:bg-ard-blue-900/40 text-ard-blue-700 dark:text-ard-blue-300">
              {totalHours}h/Woche
            </span>
          )}
        </div>

        {/* Team Preview */}
        {teamZuordnungen.length > 0 ? (
          <div className="space-y-1.5">
            {teamZuordnungen.slice(0, 3).map((z) => (
              <div key={z.id} className="flex items-center gap-2 text-xs">
                <span className="text-gray-700 dark:text-gray-300 font-medium truncate">
                  {getPersonName(z.personId)}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white flex-shrink-0"
                  style={{ backgroundColor: getRoleColor(z.rolleId) }}
                >
                  {getRolleName(z.rolleId)}
                </span>
              </div>
            ))}
            {teamZuordnungen.length > 3 && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                +{teamZuordnungen.length - 3} weitere
              </span>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-400 dark:text-gray-500 italic">
            Kein Team zugewiesen
          </div>
        )}

        {/* Quick Links */}
        <div className="flex items-center gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyTeamEmailsToClipboard(dp);
            }}
            className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
            disabled={teamZuordnungen.length === 0}
          >
            E-Mails kopieren
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProduktForAssignment(dp);
              setAssignmentError("");
            }}
            className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
          >
            Team verwalten
          </button>
        </div>
      </div>
    </div>
  );
};

// Status-Konfiguration (wie kreisConfig in PersonenVerwaltung)
const statusConfig = {
  'Live': { color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30', textColor: 'text-emerald-700 dark:text-emerald-300' },
  'In Entwicklung': { color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-300' },
  'In Planung': { color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/30', textColor: 'text-amber-700 dark:text-amber-300' },
  'On Hold / Pausiert': { color: 'from-red-500 to-red-600', bgColor: 'bg-red-50 dark:bg-red-900/30', textColor: 'text-red-700 dark:text-red-300' },
  'Archiviert': { color: 'from-gray-400 to-gray-500', bgColor: 'bg-gray-50 dark:bg-gray-700', textColor: 'text-gray-600 dark:text-gray-400' },
};

// Sortier-Optionen
const sortOptions = [
  { value: 'name', label: 'Name', icon: '🔤' },
  { value: 'teamSize', label: 'Teamgröße', icon: '👥' },
  { value: 'hours', label: 'Stunden', icon: '⏱️' },
  { value: 'risk', label: 'Risiko', icon: '⚠️' },
];

const DatenproduktListe = ({
  datenprodukte,
  zuordnungen,
  getPersonName,
  getRolleName,
  getRoleColor,
  copyTeamEmailsToClipboard,
  setSelectedProduktForAssignment,
  setAssignmentError,
  copySuccess,
  onShowDetails
}) => {
  const [sortBy, setSortBy] = useState('name');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [collapsedStatus, setCollapsedStatus] = useState({});

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

  const toggleStatus = (status) => {
    setCollapsedStatus(prev => ({ ...prev, [status]: !prev[status] }));
  };

  // Calculate metrics for sorting
  const getTeamSize = (dp) => {
    return new Set(zuordnungen.filter(z => z.datenproduktId === dp.id).map(z => z.personId)).size;
  };

  const getTotalHours = (dp) => {
    return zuordnungen.filter(z => z.datenproduktId === dp.id).reduce((sum, z) => sum + (z.stunden || 0), 0);
  };

  const getRisk = (dp) => {
    const size = getTeamSize(dp);
    if (size === 0) return 0; // critical
    if (size === 1) return 1; // high
    if (size === 2) return 2; // medium
    return 3; // ok
  };

  // Sort function
  const getSortedProdukte = (produkte) => {
    switch (sortBy) {
      case 'teamSize':
        return [...produkte].sort((a, b) => getTeamSize(b) - getTeamSize(a));
      case 'hours':
        return [...produkte].sort((a, b) => getTotalHours(b) - getTotalHours(a));
      case 'risk':
        return [...produkte].sort((a, b) => getRisk(a) - getRisk(b));
      default:
        return [...produkte].sort((a, b) => a.name.localeCompare(b.name, 'de'));
    }
  };

  // Group data products by status
  const groupedProdukte = datenprodukte.reduce((groups, dp) => {
    const status = dp.status || 'Unbekannt';
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(dp);
    return groups;
  }, {});

  // Sort products within each group
  Object.keys(groupedProdukte).forEach((status) => {
    groupedProdukte[status] = getSortedProdukte(groupedProdukte[status]);
  });

  // Sort status groups by priority
  const statusOrder = ['Live', 'In Entwicklung', 'In Planung', 'On Hold / Pausiert', 'Archiviert'];
  const sortedStatus = Object.keys(groupedProdukte).sort((a, b) => {
    const indexA = statusOrder.indexOf(a) !== -1 ? statusOrder.indexOf(a) : 999;
    const indexB = statusOrder.indexOf(b) !== -1 ? statusOrder.indexOf(b) : 999;
    return indexA - indexB;
  });

  const currentSortOption = sortOptions.find(o => o.value === sortBy);

  return (
    <div className="space-y-6">
      {/* Globale Sortierung */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {datenprodukte.length} Team{datenprodukte.length !== 1 ? 's' : ''} in {sortedStatus.length} Status-Gruppe{sortedStatus.length !== 1 ? 'n' : ''}
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
                      ? "bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="text-base">{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                  {sortBy === option.value && (
                    <span className="ml-auto text-accent-600 dark:text-accent-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status-Gruppen */}
      {sortedStatus.map((status) => {
        const config = statusConfig[status] || statusConfig['Archiviert'];
        const isCollapsed = collapsedStatus[status];
        const produkte = groupedProdukte[status];

        return (
          <div key={status} className="space-y-4">
            {/* Status Header - Einklappbar */}
            <button
              onClick={() => toggleStatus(status)}
              className="w-full flex items-center gap-3 group"
            >
              {/* Farbbalken */}
              <div className={`w-1 h-8 rounded-full bg-gradient-to-b ${config.color} flex-shrink-0`} />

              <h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                {status}
              </h2>

              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}>
                {produkte.length} Team{produkte.length !== 1 ? 's' : ''}
              </span>

              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />

              {/* Chevron */}
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isCollapsed ? "" : "rotate-180"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Data Products Grid */}
            {!isCollapsed && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {produkte.map((dp) => (
                  <DatenproduktKarte
                    key={dp.id}
                    dp={dp}
                    zuordnungen={zuordnungen}
                    getPersonName={getPersonName}
                    getRolleName={getRolleName}
                    getRoleColor={getRoleColor}
                    copyTeamEmailsToClipboard={copyTeamEmailsToClipboard}
                    setSelectedProduktForAssignment={setSelectedProduktForAssignment}
                    setAssignmentError={setAssignmentError}
                    copySuccess={copySuccess}
                    onShowDetails={onShowDetails}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const EditAssignmentModal = ({ assignment, rollen, personen, onSave, onClose, getPersonName }) => {
  const [stunden, setStunden] = useState(assignment.stunden || 0);
  const [rolleId, setRolleId] = useState(assignment.rolleId || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    const updates = {};

    // Berechne Stunden: direkte Eingabe oder Prozent der Kapazität
    let stundenWert = stunden;
    if (stunden && String(stunden).includes("%")) {
      const prozent = parseFloat(String(stunden).replace("%", "").trim());
      if (!isNaN(prozent)) {
        const person = personen.find(p => p.id === assignment.personId);
        const kapazitaet = person?.wochenstunden || 31;
        stundenWert = (kapazitaet * prozent) / 100;
      }
    }

    if (Number(stundenWert) !== (assignment.stunden || 0)) {
      updates.stunden = stundenWert;
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
      className="fixed inset-0 bg-gray-800 bg-opacity-75 dark:bg-black dark:bg-opacity-75 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Zuordnung bearbeiten</h3>
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
          <p className="text-sm text-gray-900 dark:text-gray-100">
            <strong>{getPersonName(assignment.personId)}</strong>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-rolle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rolle
            </label>
            <select
              id="edit-rolle"
              value={rolleId}
              onChange={(e) => setRolleId(e.target.value)}
              required
              className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
            <label htmlFor="edit-stunden" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Stunden pro Woche
            </label>
            <input
              id="edit-stunden"
              type="text"
              value={stunden}
              onChange={(e) => setStunden(e.target.value)}
              placeholder="z.B. 20 oder 50%"
              className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Stunden direkt oder Prozent der Kapazität (z.B. 50%)</p>
          </div>
          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-ard-blue-600 hover:bg-ard-blue-700 text-white rounded-md"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};