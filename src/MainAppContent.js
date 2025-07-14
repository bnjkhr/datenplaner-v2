// src/MainAppContent.js
import React, { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase/config";
import { ChangePasswordModal } from "./components/auth/ChangePasswordModal";
import PersonenVerwaltung from "./pages/PersonenVerwaltung";
import { DatenproduktVerwaltung } from "./pages/DatenproduktVerwaltung";
import { Auswertungen } from "./pages/Auswertungen";
import { RollenVerwaltung } from "./pages/RollenVerwaltung";
import { SkillsVerwaltung } from "./pages/SkillsVerwaltung"; // NEU
import { useData } from "./context/DataProvider";
import { ReleaseNotesModal } from "./components/ui/ReleaseNotesModal";

const AppFooter = ({ user }) => {
  const { lastChange } = useData();
  const formatTimestamp = (ts) => {
    if (!ts) return "";
    const dateObj = ts.toDate ? ts.toDate() : new Date(ts);
    return dateObj.toLocaleString("de-DE");
  };
  return (
    <footer className="bg-white shadow-inner mt-auto py-4 text-center">
      {user && (
        <div className="mb-2 text-sm text-gray-600">
          Angemeldet als: <span className="font-semibold">{user.email}</span>
        </div>
      )}
      {lastChange && (
        <div className="mb-2 text-sm text-gray-600">
          Letzte Änderung: {lastChange.description} am{" "}
          {formatTimestamp(lastChange.timestamp)} von{" "}
          <span className="font-semibold">{lastChange.userEmail}</span>
        </div>
      )}
      <div className="flex flex-col items-center gap-2">
        <a
          href="https://www.notion.so/Datenprodukt-Planer-20a15fafe8268041aca7d879881030a5?source=copy_link"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-ard-blue-500 hover:text-ard-blue-700 hover:underline transition-colors"
        >
          Bugs? Feature-Request? Hier eintragen.
        </a>
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Dein Datenprodukt Planungs-Tool
        </p>
      </div>
    </footer>
  );
};

export const MainAppContent = ({ user }) => {
  const [currentPage, setCurrentPage] = useState("personen");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showReleaseNotesModal, setShowReleaseNotesModal] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };


  const NavLink = ({ pageName, children }) => (
    <button
      onClick={() => setCurrentPage(pageName)}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
        currentPage === pageName
          ? "bg-gradient-to-r from-ard-blue-500 to-ard-blue-600 text-white shadow-lg"
          : "text-gray-600 hover:text-ard-blue-500 hover:bg-ard-blue-50"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-ard-blue-50/30 font-sans flex flex-col">
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-30">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/ard-logo.svg" 
                alt="ARD Logo" 
                className="h-8 w-auto"
              />
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-ard-blue-500 to-ard-blue-600 bg-clip-text text-transparent">
                Datenprodukt Planer
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <NavLink pageName="personen">Personen</NavLink>
              <NavLink pageName="datenprodukte">Datenprodukte</NavLink>
              <NavLink pageName="rollen">Rollen</NavLink>
              <NavLink pageName="skills">Skills</NavLink>
              <NavLink pageName="auswertungen">Auswertungen</NavLink>
              <div className="w-px h-6 bg-gray-300 mx-2"></div>
              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all"
                title="Passwort ändern"
              >
                Passwort ändern
              </button>
              <button
                onClick={() => setShowReleaseNotesModal(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all"
                title="Was ist neu?"
              >
                Was ist neu?
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all"
                title="Abmelden"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
      </header>
      <main className="py-4 flex-grow">
        {currentPage === "personen" && <PersonenVerwaltung />}
        {currentPage === "datenprodukte" && <DatenproduktVerwaltung />}
        {currentPage === "rollen" && <RollenVerwaltung />}
        {currentPage === "skills" && <SkillsVerwaltung />} {/* NEU */}
        {currentPage === "auswertungen" && <Auswertungen />}
      </main>
      <AppFooter user={user} />
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
      <ReleaseNotesModal
        isOpen={showReleaseNotesModal}
        onClose={() => setShowReleaseNotesModal(false)}
      />
    </div>
  );
};
