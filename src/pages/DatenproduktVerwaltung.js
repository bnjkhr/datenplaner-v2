// src/pages/DatenproduktVerwaltung.js
import React, { useState, useEffect } from "react";
import { useData } from "../context/DataProvider";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { NotesModal } from "../components/ui/NotesModal";

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
    aktualisiereZuordnungStunden,
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

  const handleUpdateAssignmentHours = async (stunden) => {
    if (editingAssignment) {
      const success = await aktualisiereZuordnungStunden(editingAssignment.id, stunden);
      if (success) {
        setEditingAssignment(null);
      }
    }
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
          <button
            onClick={() => handleOpenProduktForm()}
            className="bg-gradient-to-r from-ard-blue-600 to-ard-blue-700 hover:from-ard-blue-700 hover:to-ard-blue-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            Neues Datenprodukt
          </button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {datenprodukte.map((dp) => (
            <div
              key={dp.id}
              className="bg-white shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl p-6 flex flex-col justify-between border border-gray-100 hover:border-gray-200 hover:bg-gray-50/30"
            >
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 break-words">
                  {dp.name}
                </h3>
                <div className="mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200">
                    {dp.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3" title={dp.beschreibung}>
                  {dp.beschreibung || "Keine Beschreibung"}
                </p>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Team</h4>
                  {zuordnungen.filter((z) => z.datenproduktId === dp.id).length > 0 ? (
                    <div className="space-y-1">
                      {zuordnungen
                        .filter((z) => z.datenproduktId === dp.id)
                        .map((zuordnung) => (
                          <div
                            key={zuordnung.id}
                            className="text-xs bg-gradient-to-r from-gray-50 to-gray-100 p-2 rounded-md border border-gray-200 flex items-center justify-between"
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
                              <span className="bg-ard-blue-500 text-white px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">
                                {zuordnung.stunden || 0}h
                              </span>
                              <button
                                onClick={() => handleEditAssignment(zuordnung)}
                                className="text-ard-blue-500 hover:text-ard-blue-700 p-1 rounded transition-colors"
                                title="Bearbeiten"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() =>
                                  entfernePersonVonDatenproduktRolle(zuordnung.id)
                                }
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
            </div>
              <div className="mt-auto pt-4 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => {
                    setSelectedProduktForAssignment(dp);
                    setAssignmentError("");
                  }}
                  className="px-3 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 font-medium rounded-lg transition-all duration-200"
                  title="Team zuweisen"
                >
                  👥
                </button>
                <button
                  onClick={() => setNotesProdukt(dp)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${
                    dp.notizen 
                      ? "bg-ard-blue-500 text-white hover:bg-ard-blue-600" 
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }`}
                  title={dp.notizen ? "Notizen bearbeiten" : "Notizen hinzufügen"}
                >
                  {dp.notizen ? "📝" : "📄"}
                </button>
                <button
                  onClick={() => handleOpenProduktForm(dp)}
                  className="px-3 py-1.5 text-sm text-ard-blue-600 hover:text-ard-blue-700 hover:bg-ard-blue-50 font-medium rounded-lg transition-all duration-200"
                  title="Bearbeiten"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteDatenproduktInitiation(dp)}
                  className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 font-medium rounded-lg transition-all duration-200"
                  title="Löschen"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
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
      </div>
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
