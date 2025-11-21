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
import { MyProfile } from "./components/profile/MyProfile";
import { UserManagement } from "./components/admin/UserManagement";
import { useData } from "./context/DataProvider";
import { useAuth } from "./context/AuthContext";
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
    <footer className="opaque-card mt-auto py-6 text-center">
      {user && (
        <div className="mb-3 text-sm text-gray-600">
          Angemeldet als: <span className="font-semibold text-gray-900">{user.email}</span>
        </div>
      )}
      {lastChange && (
        <div className="mb-3 text-sm text-gray-600">
          Letzte Änderung: <span className="font-medium">{lastChange.description}</span> am{" "}
          <span className="font-medium">{formatTimestamp(lastChange.timestamp)}</span> von{" "}
          <span className="font-semibold text-gray-900">{lastChange.userEmail}</span>
        </div>
      )}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} DP Planer
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
  const { calendarError, personen } = useData();
  const { isAdmin, canManageData } = useAuth();

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
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
        currentPage === pageName
          ? "bg-white text-ard-blue-600 shadow-lg"
          : "text-white/80 hover:text-white hover:bg-white/10 hover:shadow-lg"
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
          className="p-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transform hover:scale-110 transition-all duration-200"
          title={isMobile ? "Menü" : "Benutzermenü"}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>

        {showBurgerMenu && (
          <div className={`absolute right-0 mt-3 opaque-card z-50 ${isMobile ? 'w-64' : 'w-56'}`}>
            <div className="py-3">
              {isMobile && (
                <>
                  <button
                    onClick={() => handleNavigation("personen")}
                    className={`w-full px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                      currentPage === "personen"
                        ? "bg-modern-primary/10 text-modern-primary border-r-2 border-modern-primary"
                        : "text-modern-neutral-700 hover:bg-modern-primary/5 hover:text-modern-primary"
                    }`}
                  >
                    Personen
                  </button>
                  <button
                    onClick={() => handleNavigation("datenprodukte")}
                    className={`w-full px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                      currentPage === "datenprodukte"
                        ? "bg-modern-primary/10 text-modern-primary border-r-2 border-modern-primary"
                        : "text-modern-neutral-700 hover:bg-modern-primary/5 hover:text-modern-primary"
                    }`}
                  >
                    DP-Verwaltung
                  </button>
                  <button
                    onClick={() => handleNavigation("auswertungen")}
                    className={`w-full px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                      currentPage === "auswertungen"
                        ? "bg-modern-primary/10 text-modern-primary border-r-2 border-modern-primary"
                        : "text-modern-neutral-700 hover:bg-modern-primary/5 hover:text-modern-primary"
                    }`}
                  >
                    Auswertungen
                  </button>
                  <div className="border-t border-modern-neutral-200 my-2 mx-4"></div>
                </>
              )}
              <button
                onClick={() => handleNavigation("rollen")}
                className={`w-full px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                  currentPage === "rollen"
                    ? "bg-modern-primary/10 text-modern-primary-dark border-r-2 border-modern-primary"
                    : "text-modern-neutral-700 hover:bg-modern-primary/5 hover:text-modern-primary"
                }`}
              >
                Rollen
              </button>
              <button
                onClick={() => handleNavigation("skills")}
                className={`w-full px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                  currentPage === "skills"
                    ? "bg-modern-primary/10 text-modern-primary-dark border-r-2 border-modern-primary"
                    : "text-modern-neutral-700 hover:bg-modern-primary/5 hover:text-modern-primary"
                }`}
              >
                Skills
              </button>
              <div className="border-t border-modern-neutral-200 my-2 mx-4"></div>
              <button
                onClick={() => handleNavigation("my-profile")}
                className={`w-full px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                  currentPage === "my-profile"
                    ? "bg-modern-primary/10 text-modern-primary-dark border-r-2 border-modern-primary"
                    : "text-modern-neutral-700 hover:bg-modern-primary/5 hover:text-modern-primary"
                }`}
              >
                Mein Profil
              </button>
              {isAdmin() && (
                <button
                  onClick={() => handleNavigation("user-management")}
                  className={`w-full px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                    currentPage === "user-management"
                      ? "bg-modern-primary/10 text-modern-primary-dark border-r-2 border-modern-primary"
                      : "text-modern-neutral-700 hover:bg-modern-primary/5 hover:text-modern-primary"
                  }`}
                >
                  Benutzerverwaltung
                </button>
              )}
              <div className="border-t border-modern-neutral-200 my-2 mx-4"></div>
              <button
                onClick={() => {
                  setShowChangePasswordModal(true);
                  setShowBurgerMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-modern-neutral-700 hover:bg-modern-primary/5 hover:text-modern-primary transition-all duration-200"
              >
                Passwort ändern
              </button>
              <button
                onClick={() => {
                  setShowReleaseNotesModal(true);
                  setShowBurgerMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-modern-neutral-700 hover:bg-modern-primary/5 hover:text-modern-primary transition-all duration-200"
              >
                Was ist neu?
              </button>
              <button
                onClick={handleCopyAllEmails}
                className="w-full px-4 py-3 text-left text-sm text-modern-neutral-700 hover:bg-modern-primary/5 hover:text-modern-primary transition-all duration-200"
              >
                Alle Adressen kopieren
              </button>
              <div className="border-t border-modern-neutral-200 my-2 mx-4"></div>
              <button
                onClick={() => {
                  handleLogout();
                  setShowBurgerMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-modern-error hover:bg-modern-error/10 hover:text-modern-error-dark transition-all duration-200"
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
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <header className="bg-ard-blue-600 sticky top-0 z-30 shadow-lg">
        <nav className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white truncate">
                DP Planer
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {!isMobile && (
                <>
                  <NavLink pageName="personen">Personen</NavLink>
                  <NavLink pageName="datenprodukte">Datenprodukte</NavLink>
                  <NavLink pageName="auswertungen">Auswertungen</NavLink>
                  <div className="w-px h-8 bg-gray-200 mx-1"></div>
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
        {currentPage === "skills" && <SkillsVerwaltung />}
        {currentPage === "auswertungen" && <Auswertungen />}
        {currentPage === "my-profile" && <MyProfile />}
        {currentPage === "user-management" && <UserManagement />}
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
