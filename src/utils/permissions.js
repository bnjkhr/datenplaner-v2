// src/utils/permissions.js
// Permissions und Rollen-Definitionen für das Auth-System

/**
 * Verfügbare Benutzerrollen im System
 */
export const USER_ROLES = {
  ADMIN: 'admin',      // Volle Rechte, kann alles verwalten
  EDITOR: 'editor',    // Kann Daten lesen & bearbeiten (nicht Personen löschen)
  USER: 'user',        // Kann eigenes Profil bearbeiten + Daten lesen
  VIEWER: 'viewer',    // Nur Lesezugriff auf Daten
};

/**
 * Rollen-Labels für die UI (Deutsch)
 */
export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.EDITOR]: 'Bearbeiter',
  [USER_ROLES.USER]: 'Benutzer',
  [USER_ROLES.VIEWER]: 'Betrachter',
};

/**
 * Rollen-Beschreibungen
 */
export const ROLE_DESCRIPTIONS = {
  [USER_ROLES.ADMIN]: 'Volle Rechte: Kann alle Daten verwalten und Benutzerrollen zuweisen',
  [USER_ROLES.EDITOR]: 'Kann alle Daten bearbeiten, aber keine Personen löschen oder Rollen zuweisen',
  [USER_ROLES.USER]: 'Kann eigenes Profil bearbeiten und alle Daten ansehen',
  [USER_ROLES.VIEWER]: 'Kann nur Daten ansehen, keine Bearbeitung',
};

/**
 * Standard-Rolle für neue Benutzer
 */
export const DEFAULT_ROLE = USER_ROLES.VIEWER;

/**
 * Verfügbare Aktionen/Permissions im System
 */
export const PERMISSIONS = {
  // Profil-Permissions
  READ_OWN_PROFILE: 'read_own_profile',
  EDIT_OWN_PROFILE: 'edit_own_profile',
  READ_ALL_PROFILES: 'read_all_profiles',
  EDIT_ALL_PROFILES: 'edit_all_profiles',
  CREATE_PROFILES: 'create_profiles',
  DELETE_PROFILES: 'delete_profiles',

  // Datenprodukte
  READ_PRODUCTS: 'read_products',
  EDIT_PRODUCTS: 'edit_products',
  CREATE_PRODUCTS: 'create_products',
  DELETE_PRODUCTS: 'delete_products',

  // Zuordnungen
  READ_ASSIGNMENTS: 'read_assignments',
  EDIT_ASSIGNMENTS: 'edit_assignments',
  CREATE_ASSIGNMENTS: 'create_assignments',
  DELETE_ASSIGNMENTS: 'delete_assignments',

  // Rollen & Skills
  READ_ROLES: 'read_roles',
  EDIT_ROLES: 'edit_roles',
  CREATE_ROLES: 'create_roles',
  DELETE_ROLES: 'delete_roles',

  READ_SKILLS: 'read_skills',
  EDIT_SKILLS: 'edit_skills',
  CREATE_SKILLS: 'create_skills',
  DELETE_SKILLS: 'delete_skills',

  // Admin-Permissions
  ASSIGN_ROLES: 'assign_roles',
  MANAGE_USERS: 'manage_users',
  VIEW_AUDIT_LOG: 'view_audit_log',
};

/**
 * Berechtigungsmatrix: Welche Rolle hat welche Permissions
 */
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    // Alle Permissions
    ...Object.values(PERMISSIONS),
  ],

  [USER_ROLES.EDITOR]: [
    // Profile
    PERMISSIONS.READ_OWN_PROFILE,
    PERMISSIONS.EDIT_OWN_PROFILE,
    PERMISSIONS.READ_ALL_PROFILES,
    PERMISSIONS.EDIT_ALL_PROFILES,
    PERMISSIONS.CREATE_PROFILES,
    // DELETE_PROFILES explizit nicht enthalten

    // Datenprodukte
    PERMISSIONS.READ_PRODUCTS,
    PERMISSIONS.EDIT_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.DELETE_PRODUCTS,

    // Zuordnungen
    PERMISSIONS.READ_ASSIGNMENTS,
    PERMISSIONS.EDIT_ASSIGNMENTS,
    PERMISSIONS.CREATE_ASSIGNMENTS,
    PERMISSIONS.DELETE_ASSIGNMENTS,

    // Rollen & Skills
    PERMISSIONS.READ_ROLES,
    PERMISSIONS.EDIT_ROLES,
    PERMISSIONS.CREATE_ROLES,
    PERMISSIONS.DELETE_ROLES,
    PERMISSIONS.READ_SKILLS,
    PERMISSIONS.EDIT_SKILLS,
    PERMISSIONS.CREATE_SKILLS,
    PERMISSIONS.DELETE_SKILLS,
  ],

  [USER_ROLES.USER]: [
    // Eigenes Profil
    PERMISSIONS.READ_OWN_PROFILE,
    PERMISSIONS.EDIT_OWN_PROFILE,

    // Lesen von Daten
    PERMISSIONS.READ_ALL_PROFILES,
    PERMISSIONS.READ_PRODUCTS,
    PERMISSIONS.READ_ASSIGNMENTS,
    PERMISSIONS.READ_ROLES,
    PERMISSIONS.READ_SKILLS,
  ],

  [USER_ROLES.VIEWER]: [
    // Nur Lesen
    PERMISSIONS.READ_OWN_PROFILE,
    PERMISSIONS.READ_ALL_PROFILES,
    PERMISSIONS.READ_PRODUCTS,
    PERMISSIONS.READ_ASSIGNMENTS,
    PERMISSIONS.READ_ROLES,
    PERMISSIONS.READ_SKILLS,
  ],
};

/**
 * Prüft ob eine Rolle eine bestimmte Permission hat
 * @param {string} role - Die Benutzerrolle
 * @param {string} permission - Die zu prüfende Permission
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
  if (!role || !permission) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

/**
 * Prüft ob eine Rolle eine von mehreren Permissions hat
 * @param {string} role - Die Benutzerrolle
 * @param {string[]} permissions - Array von Permissions
 * @returns {boolean}
 */
export const hasAnyPermission = (role, permissions) => {
  if (!role || !permissions || !Array.isArray(permissions)) return false;
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Prüft ob eine Rolle alle angegebenen Permissions hat
 * @param {string} role - Die Benutzerrolle
 * @param {string[]} permissions - Array von Permissions
 * @returns {boolean}
 */
export const hasAllPermissions = (role, permissions) => {
  if (!role || !permissions || !Array.isArray(permissions)) return false;
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Gibt alle Permissions für eine Rolle zurück
 * @param {string} role - Die Benutzerrolle
 * @returns {string[]}
 */
export const getPermissionsForRole = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Prüft ob eine Person ihr eigenes Profil bearbeiten kann
 * @param {string} role - Die Benutzerrolle
 * @param {string} userId - Die User ID
 * @param {string} personId - Die Person ID die bearbeitet werden soll
 * @param {string} userPersonId - Die Person ID des eingeloggten Users
 * @returns {boolean}
 */
export const canEditProfile = (role, userId, personId, userPersonId) => {
  // Admin und Editor können alle Profile bearbeiten
  if (hasPermission(role, PERMISSIONS.EDIT_ALL_PROFILES)) {
    return true;
  }

  // User kann nur eigenes Profil bearbeiten
  if (hasPermission(role, PERMISSIONS.EDIT_OWN_PROFILE)) {
    return personId === userPersonId;
  }

  return false;
};

/**
 * Validiert ob eine Rolle gültig ist
 * @param {string} role - Die zu prüfende Rolle
 * @returns {boolean}
 */
export const isValidRole = (role) => {
  return Object.values(USER_ROLES).includes(role);
};
