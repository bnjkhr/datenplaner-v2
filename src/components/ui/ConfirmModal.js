// src/components/ui/ConfirmModal.js
import React from 'react';

export const ConfirmModal = ({ isOpen, message, onConfirm, onCancel, confirmText = "Löschen", cancelText = "Abbrechen", title = "Bestätigung" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="relative p-6 bg-white w-full sm:max-w-md m-auto flex-col flex rounded-lg shadow-xl">
                <h3 className="text-xl font-semibold mb-4">{title}</h3>
                <div className="text-md mb-6">{message}</div>
                <div className="flex justify-end space-x-3">
                    <button onClick={onCancel} className="px-4 py-2 border rounded-md text-sm"> {cancelText} </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"> {confirmText} </button>
                </div>
            </div>
        </div>
    );
};