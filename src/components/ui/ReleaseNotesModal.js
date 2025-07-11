import React, { useEffect, useState } from "react";

export const ReleaseNotesModal = ({ isOpen, onClose }) => {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    fetch("/release-notes.txt")
      .then((res) => {
        if (!res.ok) throw new Error("Fehler beim Laden der Release Notes");
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setError("");
      })
      .catch(() => setError("Release Notes konnten nicht geladen werden."));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">Was ist neu?</h2>
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <pre className="whitespace-pre-wrap text-sm">{content}</pre>
        )}
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
