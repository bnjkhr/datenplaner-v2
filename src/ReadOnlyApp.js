// src/ReadOnlyApp.js - Standalone Read-Only App für Confluence
import React, { useState } from "react";
import { DataProvider } from "./context/DataProvider";
import { PersonenVerwaltungReadOnly } from "./pages/PersonenVerwaltungReadOnly";
import { AuswertungenReadOnly } from "./pages/AuswertungenReadOnly";

const ReadOnlyApp = () => {
  const [currentView, setCurrentView] = useState("personen");

  const NavLink = ({ viewName, children }) => (
    <button
      onClick={() => setCurrentView(viewName)}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
        currentView === viewName
          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
      }`}
    >
      {children}
    </button>
  );

  return (
    <DataProvider isReadOnly={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 font-sans">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-30">
          <nav className="container mx-auto px-6 py-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Datenprodukt Planer - Übersicht
              </div>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <NavLink viewName="personen">Team-Übersicht</NavLink>
                <NavLink viewName="auswertungen">Auswertungen</NavLink>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="py-4">
          {currentView === "personen" && <PersonenVerwaltungReadOnly />}
          {currentView === "auswertungen" && <AuswertungenReadOnly />}
        </main>

        {/* Footer */}
        <footer className="bg-white shadow-inner mt-auto py-4 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Datenprodukt Planungs-Tool - Read-Only Ansicht
          </p>
        </footer>
      </div>
    </DataProvider>
  );
};

export default ReadOnlyApp;