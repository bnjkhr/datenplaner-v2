import React, { useState } from 'react';
import { auth, setAnalyticsUserId, waitForAnalytics } from '../firebase/config';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { logEvent } from 'firebase/analytics';
import { ErrorOverlay } from '../components/ui/ErrorOverlay';
import { checkRateLimit, validateEmail, sanitizeInput, validatePassword } from '../utils/security';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    let sanitizedEmail = '';
    
    try {
      // Validate and sanitize inputs
      sanitizedEmail = sanitizeInput(email);
      if (!validateEmail(sanitizedEmail)) {
        setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
        return;
      }
      
      // Check rate limiting
      if (!checkRateLimit(sanitizedEmail, 5, 60000)) {
        setError('Zu viele Login-Versuche. Bitte warten Sie einen Moment.');
        return;
      }
      
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        setError(passwordValidation.errors[0]);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);

      // Setze Analytics User ID für personalisierte Verfolgung
      await setAnalyticsUserId(userCredential.user.uid);

      const analyticsInstance = await waitForAnalytics();
      if (analyticsInstance) {
        logEvent(analyticsInstance, 'login', {
          method: 'email',
          user_email: userCredential.user.email,
          user_id: userCredential.user.uid,
          login_timestamp: Date.now()
        });
      }
    } catch (err) {
      // Don't expose detailed error messages to users
      let userMessage = 'Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.';
      
      // Map specific error codes to user-friendly messages
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        userMessage = 'E-Mail oder Passwort ist falsch.';
      } else if (err.code === 'auth/too-many-requests') {
        userMessage = 'Zu viele Login-Versuche. Bitte versuchen Sie es später erneut.';
      } else if (err.code === 'auth/invalid-email') {
        userMessage = 'Ungültige E-Mail-Adresse.';
      }
      
      setError(userMessage);
      setMessage('');

      const analyticsInstance = await waitForAnalytics();
      if (analyticsInstance) {
        logEvent(analyticsInstance, 'login_failed', {
          method: 'email',
          error_code: err.code,
          attempted_email: sanitizedEmail,
          login_timestamp: Date.now()
        });
      }
    }
  };

  const handlePasswordReset = async () => {
    try {
      // Validate and sanitize email
      const sanitizedEmail = sanitizeInput(email);
      if (!validateEmail(sanitizedEmail)) {
        setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
        return;
      }
      
      // Check rate limiting for password reset
      if (!checkRateLimit(`reset:${sanitizedEmail}`, 3, 300000)) {
        setError('Zu viele Passwort-Reset-Versuche. Bitte warten Sie einen Moment.');
        return;
      }
      
      await sendPasswordResetEmail(auth, sanitizedEmail);
      setMessage('Passwort-Zurücksetzungs-E-Mail gesendet!');
      setError('');
    } catch (err) {
      // Don't expose detailed error messages to users
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center font-display">{resetMode ? 'Passwort vergessen' : 'Login'}</h2>

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
