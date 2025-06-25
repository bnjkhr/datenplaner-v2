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
      <p className="text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Dein Datenprodukt Planungs-Tool
      </p>
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
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        currentPage === pageName
          ? "bg-indigo-600 text-white shadow-md"
          : "text-gray-700 hover:bg-indigo-100"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <header className="bg-white shadow-md sticky top-0 z-30">
        <nav className="container mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
          <div className="text-xl sm:text-2xl font-bold text-indigo-700">
            Datenprodukt Planer
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <NavLink pageName="personen">Personen</NavLink>
            <NavLink pageName="datenprodukte">Datenprodukte</NavLink>
            <NavLink pageName="rollen">Rollen</NavLink>
            <NavLink pageName="skills">Skills</NavLink> {/* NEU */}
            <NavLink pageName="auswertungen">Auswertungen</NavLink>
            <button
              onClick={() => setShowChangePasswordModal(true)}
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              title="Passwort ändern"
            >
              Passwort ändern
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-100"
              title="Abmelden"
            >
              Logout
            </button>
            <button
              onClick={() => setShowReleaseNotesModal(true)}
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              title="Was ist neu?"
            >
              Was ist neu?
            </button>
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
