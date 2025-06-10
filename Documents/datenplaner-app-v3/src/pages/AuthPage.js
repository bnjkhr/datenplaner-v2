// src/pages/AuthPage.js
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';

export const AuthPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault(); setLoading(true); setError('');
        try { await signInWithEmailAndPassword(auth, email, password); } 
        catch (err) {
            let userFriendlyError = "Anmeldung fehlgeschlagen. Bitte überprüfen Sie E-Mail und Passwort.";
            if (err.code !== 'auth/user-not-found' && err.code !== 'auth/wrong-password' && err.code !== 'auth/invalid-credential') {
                 userFriendlyError = err.message;
            }
            setError(userFriendlyError);
        } finally { setLoading(false); }
    };

    return ( <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4"><div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md"><h1 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Datenprodukt Planer</h1><h2 className="text-xl text-gray-700 mb-6 text-center">Anmelden</h2><form onSubmit={handleLogin} className="space-y-6"><div><label htmlFor="auth-email" className="block text-sm font-medium text-gray-700">E-Mail Adresse</label><input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="deine.email@firma.de"/></div><div><label htmlFor="auth-password" className="block text-sm font-medium text-gray-700">Passwort</label><input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="Passwort"/></div>{error && <p className="text-sm text-red-500 text-center">{error}</p>}<div><button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300">{loading ? 'Bitte warten...' : 'Anmelden'}</button></div></form><p className="mt-8 text-xs text-gray-500 text-center">Benutzerkonten werden vom Administrator in der Firebase Console erstellt.</p></div></div> );
};

// ==========================================================