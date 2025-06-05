import React from 'react';
import ReactDOM from 'react-dom/client';
// import './index.css'; // Optional: Für globale Styles, falls du welche hast
import App from './App'; // Deine Haupt-App-Komponente

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
