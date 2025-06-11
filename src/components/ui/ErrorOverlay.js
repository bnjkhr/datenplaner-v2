import React from 'react';

export const ErrorOverlay = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-red-600 mb-4 break-words">{message}</p>
        <div className="text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
