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
import { SkillsVerwaltung } from "./pages/SkillsVerwaltung";
import Dashboard from "./pages/Dashboard";
import { useData } from "./context/DataProvider";
import { useTheme } from "./context/ThemeContext";
import { ReleaseNotesModal } from "./components/ui/ReleaseNotesModal";
import CalendarWarningBanner from "./components/CalendarWarningBanner";

const AppFooter = ({ user }) => {
  const { lastChange } = useData();
  const formatTimestamp = (ts) => {
    if (!ts) return "";
    const dateObj = ts.toDate ? ts.toDate() : new Date(ts);
    return dateObj.toLocaleString("de-DE");
  };
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto py-6 text-center">
      {user && (
        <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          Angemeldet als: <span className="font-semibold text-gray-900 dark:text-gray-100">{user.email}</span>
        </div>
      )}
      {lastChange && (
        <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          Letzte Änderung: <span className="font-medium">{lastChange.description}</span> am{" "}
          <span className="font-medium">{formatTimestamp(lastChange.timestamp)}</span> von{" "}
          <span className="font-semibold text-gray-900 dark:text-gray-100">{lastChange.userEmail}</span>
        </div>
      )}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-500">
          &copy; {new Date().getFullYear()} DP Planer
        </p>
      </div>
    </footer>
  );
};

  export const MainAppContent = ({ user }) => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showReleaseNotesModal, setShowReleaseNotesModal] = useState(false);
  const [showBurgerMenu, setShowBurgerMenu] = useState(false);
  const { calendarError, personen } = useData();
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Check for mobile screen size
  const [isMobile, setIsMobile] = useState(false);
  
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
      className={`nav-tab ${
        currentPage === pageName
          ? "nav-tab-active"
          : "nav-tab-inactive"
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
          className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/15 transition-all duration-200"
          title={isMobile ? "Menü" : "Benutzermenü"}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>

        {showBurgerMenu && (
          <div className={`absolute right-0 mt-3 opaque-card dark:bg-gray-800 dark:border-gray-700 z-50 ${isMobile ? 'w-64' : 'w-56'}`}>
            <div className="py-3">
              {isMobile && (
                <>
                  <button
                    onClick={() => handleNavigation("dashboard")}
                    className={`w-full px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                      currentPage === "dashboard"
                        ? "bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 border-r-2 border-accent-500"
                        : "text-gray-700 dark:text-gray-300 hover:bg-accent-50 dark:hover:bg-gray-700 hover:text-accent-600 dark:hover:text-accent-400"
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => handleNavigation("personen")}
                    className={`w-full px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                      currentPage === "personen"
                        ? "bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 border-r-2 border-accent-500"
                        : "text-gray-700 dark:text-gray-300 hover:bg-accent-50 dark:hover:bg-gray-700 hover:text-accent-600 dark:hover:text-accent-400"
                    }`}
                  >
                    Personen
                  </button>
                  <button
                    onClick={() => handleNavigation("datenprodukte")}
                    className={`w-full px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                      currentPage === "datenprodukte"
                        ? "bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 border-r-2 border-accent-500"
                        : "text-gray-700 dark:text-gray-300 hover:bg-accent-50 dark:hover:bg-gray-700 hover:text-accent-600 dark:hover:text-accent-400"
                    }`}
                  >
                    Datenprodukte
                  </button>
                  <button
                    onClick={() => handleNavigation("auswertungen")}
                    className={`w-full px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                      currentPage === "auswertungen"
                        ? "bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 border-r-2 border-accent-500"
                        : "text-gray-700 dark:text-gray-300 hover:bg-accent-50 dark:hover:bg-gray-700 hover:text-accent-600 dark:hover:text-accent-400"
                    }`}
                  >
                    Auswertungen
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-600 my-2 mx-4"></div>
                </>
              )}
              <button
                onClick={() => handleNavigation("rollen")}
                className={`w-full px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                  currentPage === "rollen"
                    ? "bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 border-r-2 border-accent-500"
                    : "text-gray-700 dark:text-gray-300 hover:bg-accent-50 dark:hover:bg-gray-700 hover:text-accent-600 dark:hover:text-accent-400"
                }`}
              >
                Rollen
              </button>
              <button
                onClick={() => handleNavigation("skills")}
                className={`w-full px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                  currentPage === "skills"
                    ? "bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 border-r-2 border-accent-500"
                    : "text-gray-700 dark:text-gray-300 hover:bg-accent-50 dark:hover:bg-gray-700 hover:text-accent-600 dark:hover:text-accent-400"
                }`}
              >
                Skills
              </button>
              <div className="border-t border-gray-200 dark:border-gray-600 my-2 mx-4"></div>
              <button
                onClick={() => {
                  setShowChangePasswordModal(true);
                  setShowBurgerMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-accent-50 dark:hover:bg-gray-700 hover:text-accent-600 dark:hover:text-accent-400 transition-all duration-200"
              >
                Passwort ändern
              </button>
              <button
                onClick={handleCopyAllEmails}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-accent-50 dark:hover:bg-gray-700 hover:text-accent-600 dark:hover:text-accent-400 transition-all duration-200"
              >
                Alle Adressen kopieren
              </button>
              <div className="border-t border-gray-200 dark:border-gray-600 my-2 mx-4"></div>
              <button
                onClick={() => {
                  handleLogout();
                  setShowBurgerMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200"
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
    <div className="min-h-screen bg-white dark:bg-gray-900 font-sans flex flex-col transition-colors duration-200">
      <header className="bg-ard-blue-600 dark:bg-gray-800 sticky top-0 z-30 shadow-lg">
        <nav className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="text-3xl sm:text-4xl font-black text-white drop-shadow-md">
                DP Planer
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              {!isMobile && (
                <>
                  <NavLink pageName="dashboard">Dashboard</NavLink>
                  <NavLink pageName="personen">Personen</NavLink>
                  <NavLink pageName="datenprodukte">Datenprodukte</NavLink>
                  <NavLink pageName="auswertungen">Auswertungen</NavLink>
                  <div className="w-px h-6 bg-white/30 mx-2"></div>
                </>
              )}
              {/* Dark Mode Toggle Button */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/15 transition-all duration-200"
                title={isDarkMode ? "Light Mode aktivieren" : "Dark Mode aktivieren"}
              >
                {isDarkMode ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              <BurgerMenu />
            </div>
          </div>
        </nav>
      </header>
      <CalendarWarningBanner show={calendarError} />
      <main className={`flex-grow ${currentPage === 'dashboard' ? '' : 'py-4'}`}>
        {currentPage === "dashboard" && <Dashboard onNavigate={setCurrentPage} />}
        {currentPage === "personen" && <PersonenVerwaltung />}
        {currentPage === "datenprodukte" && <DatenproduktVerwaltung />}
        {currentPage === "rollen" && <RollenVerwaltung />}
        {currentPage === "skills" && <SkillsVerwaltung />}
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
