// src/pages/LabelsVerwaltung.js
import React, { useState } from "react";
import { useData } from "../context/DataProvider";
import { ConfirmModal } from "../components/ui/ConfirmModal";

export const LabelsVerwaltung = () => {
  const {
    labels,
    personen,
    fuegeLabelHinzu,
    aktualisiereLabel,
    loescheLabel,
    loading,
    error,
    setError,
  } = useData();

  const [neuerLabelName, setNeuerLabelName] = useState("");
  const [neueLabelFarbe, setNeueLabelFarbe] = useState("#4c84d4"); // Modern blue
  const [editingLabel, setEditingLabel] = useState(null);
  const [labelToDelete, setLabelToDelete] = useState(null);

  const handleAddLabel = async (e) => {
    e.preventDefault();
    setError(null);
    if (neuerLabelName.trim()) {
      await fuegeLabelHinzu(neuerLabelName.trim(), neueLabelFarbe);
      setNeuerLabelName("");
      setNeueLabelFarbe("#4c84d4");
    }
  };

  const handleUpdateLabel = async () => {
    setError(null);
    if (editingLabel && editingLabel.name.trim()) {
      await aktualisiereLabel(
        editingLabel.id,
        editingLabel.name.trim(),
        editingLabel.color
      );
      setEditingLabel(null);
    }
  };

  const handleDeleteInitiation = (label) => {
    setError(null);
    setLabelToDelete(label);
  };

  const confirmDelete = async () => {
    if (labelToDelete) {
      const success = await loescheLabel(labelToDelete.id);
      if (success) {
        setLabelToDelete(null);
      }
    }
  };

  // Get persons with each label
  const getLabelPersons = (labelId) => {
    return personen.filter(
      (person) => person.labelIds && person.labelIds.includes(labelId)
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ard-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-ard-blue-50/30">
      <div className="container mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Label-Verwaltung
          </h1>
          <p className="text-gray-600">Verwalte Labels und deren Zuweisungen</p>
        </div>

        {error && (
          <div
            className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-800 px-6 py-4 rounded-xl mb-6"
            role="alert"
          >
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 font-bold ml-4"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="mb-6 p-4 bg-white shadow-md rounded-xl border border-gray-100">
          <form
            onSubmit={handleAddLabel}
            className="flex flex-col sm:flex-row gap-3 items-end"
          >
            <div className="flex-grow">
              <label
                htmlFor="neues-label"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Neues Label
              </label>
              <input
                id="neues-label"
                type="text"
                value={neuerLabelName}
                onChange={(e) => setNeuerLabelName(e.target.value)}
                placeholder="z.B. Python, React, Data Science"
                className="block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-ard-blue-500 focus:border-ard-blue-500 transition-all"
              />
            </div>
            <div className="flex-shrink-0">
              <label
                htmlFor="neue-farbe"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Farbe
              </label>
              <input
                id="neue-farbe"
                type="color"
                value={neueLabelFarbe}
                onChange={(e) => setNeueLabelFarbe(e.target.value)}
                className="block w-12 h-10 p-1 border border-gray-200 rounded-lg cursor-pointer shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-lg shadow-md font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
            >
              <span className="text-lg">+</span>
              Hinzufügen
            </button>
          </form>
        </div>

        {labels.length === 0 ? (
          <div className="bg-white shadow-md rounded-xl border border-gray-100 text-center py-8 text-gray-500">
            Noch keine Labels angelegt.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {labels.map((label) => {
              const labelPersons = getLabelPersons(label.id);

              return (
                <div
                  key={label.id}
                  className="bg-white shadow-md rounded-xl border border-gray-100 p-4 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {editingLabel?.id === label.id ? (
                        <input
                          type="color"
                          value={editingLabel.color}
                          onChange={(e) =>
                            setEditingLabel({
                              ...editingLabel,
                              color: e.target.value,
                            })
                          }
                          className="w-6 h-6 p-0 border border-gray-200 rounded cursor-pointer"
                        />
                      ) : (
                        <div
                          className="w-6 h-6 rounded border border-gray-200 shadow-sm flex-shrink-0"
                          style={{ backgroundColor: label.color }}
                        ></div>
                      )}

                      {editingLabel?.id === label.id ? (
                        <input
                          type="text"
                          value={editingLabel.name}
                          onChange={(e) =>
                            setEditingLabel({
                              ...editingLabel,
                              name: e.target.value,
                            })
                          }
                          className="flex-grow px-2 py-1 text-sm border border-ard-blue-300 rounded focus:ring-1 focus:ring-ard-blue-500 focus:border-ard-blue-500"
                          autoFocus
                        />
                      ) : (
                        <span className="font-semibold text-gray-900 text-sm">
                          {label.name}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-1">
                      {editingLabel?.id === label.id ? (
                        <>
                          <button
                            onClick={handleUpdateLabel}
                            className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-all"
                            title="Speichern"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingLabel(null)}
                            className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-all"
                            title="Abbrechen"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingLabel({ ...label })}
                            className="p-1 text-ard-blue-600 hover:text-ard-blue-700 hover:bg-ard-blue-50 rounded transition-all"
                            title="Bearbeiten"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteInitiation(label)}
                            className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            title="Löschen"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Personen ({labelPersons.length})
                      </span>
                    </div>

                    {labelPersons.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {labelPersons.map((person) => (
                          <span
                            key={person.id}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            {person.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        Niemand zugewiesen
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <ConfirmModal
          isOpen={!!labelToDelete}
          title="Label löschen"
          message={`Möchten Sie das Label "${labelToDelete?.name}" wirklich löschen? Alle Zuweisungen zu Personen werden ebenfalls entfernt.`}
          onConfirm={confirmDelete}
          onCancel={() => setLabelToDelete(null)}
        />
      </div>
    </div>
  );
};

export default LabelsVerwaltung;
