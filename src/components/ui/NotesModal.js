import React, { useState, useEffect } from 'react';

export const NotesModal = ({ isOpen, initialNotes = '', onSave, onClose }) => {
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave && onSave(notes);
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
        <h3 className="text-xl font-semibold mb-4">Notizen</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows="6"
          className="w-full border rounded-md p-2 mb-4"
        />
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-md">Abbrechen</button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Speichern</button>
        </div>
      </div>
    </div>
  );
};