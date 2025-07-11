// src/readonly-entry.js - Entry point für die Read-Only Version
import React from 'react';
import ReactDOM from 'react-dom/client';
import ReadOnlyApp from './ReadOnlyApp';
import './index.css';

// Erstelle Root Element für die Read-Only App
const container = document.getElementById('readonly-root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <ReadOnlyApp />
    </React.StrictMode>
  );
} else {
  console.error('Read-Only root element nicht gefunden!');
}

// Export für externe Nutzung (z.B. Confluence)
window.DatenproduktPlanerReadOnly = {
  mount: (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      const root = ReactDOM.createRoot(element);
      root.render(
        <React.StrictMode>
          <ReadOnlyApp />
        </React.StrictMode>
      );
      return root;
    }
    throw new Error(`Element mit ID "${elementId}" nicht gefunden`);
  }
};