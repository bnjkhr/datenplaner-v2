// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { USER_ROLES, DEFAULT_ROLE, hasPermission, PERMISSIONS } from '../utils/permissions';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * AuthProvider - Verwaltet Auth-State und User-Profile
 *
 * Verbindet:
 * - Firebase Auth User (uid, email)
 * - User-Dokument (/users/{uid}) mit Metadaten
 * - Personen-Profil (/personen/{personId}) mit vollständigen Daten
 */
export const AuthProvider = ({ children, user }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [personProfile, setPersonProfile] = useState(null);
  const [role, setRole] = useState(DEFAULT_ROLE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Lädt User-Profil aus Firestore (/users/{uid})
   */
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setPersonProfile(null);
      setRole(DEFAULT_ROLE);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to user document
    const userDocRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      async (snapshot) => {
        try {
          if (snapshot.exists()) {
            const userData = snapshot.data();
            setUserProfile({
              uid: user.uid,
              ...userData,
            });

            // Setze Rolle aus Custom Claims oder aus User-Dokument
            const userRole = user.customClaims?.role || userData.role || DEFAULT_ROLE;
            setRole(userRole);

            // Lade zugehöriges Personen-Profil falls vorhanden
            if (userData.personId) {
              loadPersonProfile(userData.personId);
            } else {
              setPersonProfile(null);
              setLoading(false);
            }
          } else {
            // User-Dokument existiert noch nicht - erstelle es
            await createUserDocument(user);
          }
        } catch (err) {
          console.error('Error loading user profile:', err);
          setError('Fehler beim Laden des Benutzerprofils');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error subscribing to user document:', err);
        setError('Fehler beim Laden des Benutzerprofils');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  /**
   * Erstellt ein neues User-Dokument beim ersten Login
   */
  const createUserDocument = async (firebaseUser) => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);

      const newUserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || null,
        role: DEFAULT_ROLE,
        personId: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      await setDoc(userDocRef, newUserData);

      setUserProfile({
        uid: firebaseUser.uid,
        ...newUserData,
      });
      setRole(DEFAULT_ROLE);
      setPersonProfile(null);
      setLoading(false);
    } catch (err) {
      console.error('Error creating user document:', err);
      setError('Fehler beim Erstellen des Benutzerprofils');
      setLoading(false);
    }
  };

  /**
   * Lädt Personen-Profil aus Firestore
   */
  const loadPersonProfile = async (personId) => {
    try {
      // TODO: Use collection path from DataProvider (Multi-Tenancy support)
      // For now, use legacy path
      const personDocRef = doc(db, `artifacts/datenplaner-app-v3/public/data/personen/${personId}`);

      const personDoc = await getDoc(personDocRef);

      if (personDoc.exists()) {
        setPersonProfile({
          id: personDoc.id,
          ...personDoc.data(),
        });
      } else {
        console.warn(`Person document not found: ${personId}`);
        setPersonProfile(null);
      }
    } catch (err) {
      console.error('Error loading person profile:', err);
      setPersonProfile(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aktualisiert Last Login Timestamp
   */
  useEffect(() => {
    if (user && userProfile) {
      const updateLastLogin = async () => {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, {
            lastLoginAt: new Date().toISOString(),
          }, { merge: true });
        } catch (err) {
          console.error('Error updating last login:', err);
        }
      };
      updateLastLogin();
    }
  }, [user, userProfile]);

  /**
   * Permission Helper Functions
   */
  const checkPermission = (permission) => {
    return hasPermission(role, permission);
  };

  const canEditOwnProfile = () => {
    return checkPermission(PERMISSIONS.EDIT_OWN_PROFILE);
  };

  const canEditAllProfiles = () => {
    return checkPermission(PERMISSIONS.EDIT_ALL_PROFILES);
  };

  const canDeleteProfiles = () => {
    return checkPermission(PERMISSIONS.DELETE_PROFILES);
  };

  const canManageData = () => {
    return checkPermission(PERMISSIONS.EDIT_PRODUCTS) ||
           checkPermission(PERMISSIONS.EDIT_ASSIGNMENTS) ||
           checkPermission(PERMISSIONS.EDIT_ROLES);
  };

  const canAssignRoles = () => {
    return checkPermission(PERMISSIONS.ASSIGN_ROLES);
  };

  const isAdmin = () => {
    return role === USER_ROLES.ADMIN;
  };

  const isEditor = () => {
    return role === USER_ROLES.EDITOR || role === USER_ROLES.ADMIN;
  };

  const canEditProfile = (profileId) => {
    // Admin und Editor können alle Profile bearbeiten
    if (canEditAllProfiles()) return true;

    // User kann nur eigenes Profil bearbeiten
    if (canEditOwnProfile() && personProfile?.id === profileId) return true;

    return false;
  };

  const value = {
    // Auth State
    user,
    userProfile,
    personProfile,
    role,
    loading,
    error,

    // Profile Checks
    hasProfile: !!personProfile,
    isProfileLinked: !!(userProfile?.personId),

    // Permission Checks
    checkPermission,
    canEditOwnProfile,
    canEditAllProfiles,
    canDeleteProfiles,
    canManageData,
    canAssignRoles,
    canEditProfile,
    isAdmin,
    isEditor,

    // Helper Methods
    setError,
    loadPersonProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
