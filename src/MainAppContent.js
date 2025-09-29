// src/MainAppContent.js
import React, { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth, waitForAnalytics } from "./firebase/config";
import { logEvent } from "firebase/analytics";
import { ChangePasswordModal } from "./components/auth/ChangePasswordModal";
import PersonenVerwaltung from "./pages/PersonenVerwaltung";
import { DatenproduktVerwaltung } from "./pages/DatenproduktVerwaltung";
import { Auswertungen } from "./pages/Auswertungen";
import { RollenVerwaltung } from "./pages/RollenVerwaltung";
import { SkillsVerwaltung } from "./pages/SkillsVerwaltung"; // NEU
import { useData } from "./context/DataProvider";
import { ReleaseNotesModal } from "./components/ui/ReleaseNotesModal";
import CalendarWarningBanner from "./components/CalendarWarningBanner";
import { SpeedInsights } from "@vercel/speed-insights/react";

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
  const [showBurgerMenu, setShowBurgerMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { calendarError, personen } = useData();

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Analytics für Seitenaufrufe
  useEffect(() => {
    let cancelled = false;

    waitForAnalytics().then((instance) => {
      if (!cancelled && instance) {
        logEvent(instance, 'page_view', {
          page_title: 'Datenplaner',
          page_location: window.location.href
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Analytics für Seitenwechsel
  useEffect(() => {
    let cancelled = false;

    waitForAnalytics().then((instance) => {
      if (!cancelled && instance) {
        logEvent(instance, 'screen_view', {
          screen_name: currentPage
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentPage]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const handleCopyAllEmails = async () => {
    try {
      const emails = personen
        .filter(person => person.email && person.email.trim() !== '')
        .map(person => person.email.trim())
        .join('; ');

      if (emails) {
        await navigator.clipboard.writeText(emails);
        // Optional: You could add a toast notification here
      }
    } catch (error) {
      console.error("Failed to copy emails:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      const emails = personen
        .filter(person => person.email && person.email.trim() !== '')
        .map(person => person.email.trim())
        .join('; ');
      textArea.value = emails;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setShowBurgerMenu(false);
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

  const BurgerMenu = () => {
    const menuRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setShowBurgerMenu(false);
        }
      };

      if (showBurgerMenu) {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }, [showBurgerMenu]);

    const handleNavigation = (pageName) => {
      setCurrentPage(pageName);
      setShowBurgerMenu(false);
    };

    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowBurgerMenu(!showBurgerMenu)}
          className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all"
          title={isMobile ? "Menü" : "Benutzermenü"}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>

        {showBurgerMenu && (
          <div className={`absolute right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 ${isMobile ? 'w-56' : 'w-48'}`}>
            <div className="py-2">
              {isMobile && (
                <>
                  <button
                    onClick={() => handleNavigation("personen")}
                    className={`w-full px-4 py-2 text-left text-sm font-semibold transition-colors ${
                      currentPage === "personen"
                        ? "bg-ard-blue-50 text-ard-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Personen
                  </button>
                  <button
                    onClick={() => handleNavigation("datenprodukte")}
                    className={`w-full px-4 py-2 text-left text-sm font-semibold transition-colors ${
                      currentPage === "datenprodukte"
                        ? "bg-ard-blue-50 text-ard-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Datenprodukte
                  </button>
                  <button
                    onClick={() => handleNavigation("rollen")}
                    className={`w-full px-4 py-2 text-left text-sm font-semibold transition-colors ${
                      currentPage === "rollen"
                        ? "bg-ard-blue-50 text-ard-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Rollen
                  </button>
                  <button
                    onClick={() => handleNavigation("skills")}
                    className={`w-full px-4 py-2 text-left text-sm font-semibold transition-colors ${
                      currentPage === "skills"
                        ? "bg-ard-blue-50 text-ard-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Skills
                  </button>
                  <button
                    onClick={() => handleNavigation("auswertungen")}
                    className={`w-full px-4 py-2 text-left text-sm font-semibold transition-colors ${
                      currentPage === "auswertungen"
                        ? "bg-ard-blue-50 text-ard-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Auswertungen
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                </>
              )}
              <button
                onClick={() => {
                  setShowChangePasswordModal(true);
                  setShowBurgerMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Passwort ändern
              </button>
              <button
                onClick={() => {
                  setShowReleaseNotesModal(true);
                  setShowBurgerMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Was ist neu?
              </button>
              <button
                onClick={handleCopyAllEmails}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Alle Adressen kopieren
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button
                onClick={() => {
                  handleLogout();
                  setShowBurgerMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-ard-blue-50/30 font-sans flex flex-col">
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-30">
        <nav className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-ard-blue-500 to-ard-blue-600 bg-clip-text text-transparent truncate">
                {isMobile ? "Datenplaner" : "Datenprodukt Planer"}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              {!isMobile && (
                <>
                  <NavLink pageName="personen">Personen</NavLink>
                  <NavLink pageName="datenprodukte">Datenprodukte</NavLink>
                  <NavLink pageName="rollen">Rollen</NavLink>
                  <NavLink pageName="skills">Skills</NavLink>
                  <NavLink pageName="auswertungen">Auswertungen</NavLink>
                  <div className="w-px h-6 bg-gray-300 mx-2"></div>
                </>
              )}
              <BurgerMenu />
            </div>
          </div>
        </nav>
      </header>
      <CalendarWarningBanner show={calendarError} />
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
