// src/App.js
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import { DataProvider } from './context/DataProvider';
import { ThemeProvider } from './context/ThemeContext';
import AuthPage from './pages/AuthPage';
import { MainAppContent } from './MainAppContent';
import FeatureFlagManager from './components/admin/FeatureFlagManager';
import { displaySecurityValidation } from './utils/envValidation';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Run security validation in development
    if (process.env.NODE_ENV === 'development') {
      displaySecurityValidation();
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
             <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
        </div>
    );
  }

  return (
      <ThemeProvider>
        {!user ? (
            <AuthPage />
        ) : (
            <DataProvider user={user}>
                <MainAppContent user={user} />
            </DataProvider>
        )}
        <FeatureFlagManager />
      </ThemeProvider>
  );
}

export default App;
