import React, { useState } from 'react';
import { auth, analytics, setAnalyticsUserId } from '../firebase/config';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { logEvent } from 'firebase/analytics';
import { ErrorOverlay } from '../components/ui/ErrorOverlay';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Setze Analytics User ID für personalisierte Verfolgung
      setAnalyticsUserId(userCredential.user.uid);

      // Analytics Event für erfolgreichen Login mit User-Info
      if (analytics) {
        logEvent(analytics, 'login', {
          method: 'email',
          user_email: userCredential.user.email,
          user_id: userCredential.user.uid
        });
      }
    } catch (err) {
      setError(err.message);
      setMessage('');

      // Analytics Event für fehlgeschlagenen Login
      if (analytics) {
        logEvent(analytics, 'login_failed', {
          method: 'email',
          error_code: err.code,
          attempted_email: email
        });
      }
    }
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Passwort-Zurücksetzungs-E-Mail gesendet!');
      setError('');
    } catch (err) {
      setError(err.message);
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">{resetMode ? 'Passwort vergessen' : 'Login'}</h2>

        <input
          type="email"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-3 border rounded-lg"
          onKeyDown={(e) => e.key === 'Enter' && (resetMode ? handlePasswordReset() : handleLogin())}

        />

        {!resetMode && (
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 p-3 border rounded-lg"
            onKeyDown={(e) => e.key === 'Enter' && (resetMode ? handlePasswordReset() : handleLogin())}

          />
        )}

        <button
          onClick={resetMode ? handlePasswordReset : handleLogin}
          className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 py-3 rounded-lg font-semibold transition"
        >
          {resetMode ? 'Zurücksetzen' : 'Login'}
        </button>

        <p
          className="mt-5 text-sm text-ard-blue-500 text-center cursor-pointer underline"
          onClick={() => {
            setResetMode(!resetMode);
            setMessage('');
            setError('');
          }}
        >
          {resetMode ? 'Zurück zum Login' : 'Passwort vergessen?'}
        </p>

        {message && <p className="mt-4 text-green-600 text-center">{message}</p>}
        <ErrorOverlay message={error} onClose={() => setError('')} />
      </div>
    </div>
  );
};

export default AuthPage;
