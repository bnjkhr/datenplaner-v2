// src/components/auth/ChangePasswordModal.js
import React, { useState, useEffect } from 'react';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../firebase/config';

export const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setSuccess('');
        if (newPassword !== confirmPassword) { setError('Die Passwörter stimmen nicht überein.'); return; }
        if (newPassword.length < 6) { setError('Das Passwort muss mindestens 6 Zeichen lang sein.'); return; }
        const user = auth.currentUser;
        if (user) {
            setLoading(true);
            try {
                await updatePassword(user, newPassword);
                setSuccess('Passwort erfolgreich geändert! Das Fenster schließt in 3 Sekunden.');
                setTimeout(() => onClose(), 3000);
            } catch (err) {
                console.error("Error updating password:", err);
                setError('Fehler beim Ändern des Passworts. Bitte versuchen Sie es später erneut.');
            } finally { setLoading(false); }
        }
    };
    
    useEffect(() => { if (!isOpen) { setNewPassword(''); setConfirmPassword(''); setError(''); setSuccess(''); setLoading(false); } }, [isOpen]);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg shadow-xl w-full sm:max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-semibold text-gray-700 mb-6">Passwort ändern</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">Neues Passwort</label>
                        <input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Neues Passwort bestätigen</label>
                        <input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {success && <p className="text-sm text-green-600">{success}</p>}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 border rounded-md text-sm">Abbrechen</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300">{loading ? 'Speichern...' : 'Passwort speichern'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
