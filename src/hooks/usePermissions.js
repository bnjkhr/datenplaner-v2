// src/hooks/usePermissions.js
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS, USER_ROLES } from '../utils/permissions';

/**
 * Custom Hook für Permission-Checks in UI-Komponenten
 *
 * Beispiel-Verwendung:
 * const { canEditAllProfiles, canDeleteProfiles } = usePermissions();
 *
 * if (canEditAllProfiles()) {
 *   // Zeige Bearbeiten-Button
 * }
 */
export const usePermissions = () => {
  const {
    role,
    checkPermission,
    personProfile,
    canEditProfile: canEditProfileById,
    isAdmin,
    isEditor,
  } = useAuth();

  return {
    // Basic Role Checks
    role,
    isAdmin,
    isEditor,
    isUser: () => role === USER_ROLES.USER,
    isViewer: () => role === USER_ROLES.VIEWER,

    // Profile Permissions
    canReadOwnProfile: () => checkPermission(PERMISSIONS.READ_OWN_PROFILE),
    canEditOwnProfile: () => checkPermission(PERMISSIONS.EDIT_OWN_PROFILE),
    canReadAllProfiles: () => checkPermission(PERMISSIONS.READ_ALL_PROFILES),
    canEditAllProfiles: () => checkPermission(PERMISSIONS.EDIT_ALL_PROFILES),
    canCreateProfiles: () => checkPermission(PERMISSIONS.CREATE_PROFILES),
    canDeleteProfiles: () => checkPermission(PERMISSIONS.DELETE_PROFILES),

    // Datenprodukte Permissions
    canReadProducts: () => checkPermission(PERMISSIONS.READ_PRODUCTS),
    canEditProducts: () => checkPermission(PERMISSIONS.EDIT_PRODUCTS),
    canCreateProducts: () => checkPermission(PERMISSIONS.CREATE_PRODUCTS),
    canDeleteProducts: () => checkPermission(PERMISSIONS.DELETE_PRODUCTS),

    // Zuordnungen Permissions
    canReadAssignments: () => checkPermission(PERMISSIONS.READ_ASSIGNMENTS),
    canEditAssignments: () => checkPermission(PERMISSIONS.EDIT_ASSIGNMENTS),
    canCreateAssignments: () => checkPermission(PERMISSIONS.CREATE_ASSIGNMENTS),
    canDeleteAssignments: () => checkPermission(PERMISSIONS.DELETE_ASSIGNMENTS),

    // Rollen Permissions
    canReadRoles: () => checkPermission(PERMISSIONS.READ_ROLES),
    canEditRoles: () => checkPermission(PERMISSIONS.EDIT_ROLES),
    canCreateRoles: () => checkPermission(PERMISSIONS.CREATE_ROLES),
    canDeleteRoles: () => checkPermission(PERMISSIONS.DELETE_ROLES),

    // Skills Permissions
    canReadSkills: () => checkPermission(PERMISSIONS.READ_SKILLS),
    canEditSkills: () => checkPermission(PERMISSIONS.EDIT_SKILLS),
    canCreateSkills: () => checkPermission(PERMISSIONS.CREATE_SKILLS),
    canDeleteSkills: () => checkPermission(PERMISSIONS.DELETE_SKILLS),

    // Admin Permissions
    canAssignRoles: () => checkPermission(PERMISSIONS.ASSIGN_ROLES),
    canManageUsers: () => checkPermission(PERMISSIONS.MANAGE_USERS),
    canViewAuditLog: () => checkPermission(PERMISSIONS.VIEW_AUDIT_LOG),

    // Complex Permission Checks
    canEditProfile: (profileId) => canEditProfileById(profileId),

    /**
     * Prüft ob User Daten generell bearbeiten kann (Datenprodukte, Zuordnungen, etc.)
     */
    canManageData: () => {
      return checkPermission(PERMISSIONS.EDIT_PRODUCTS) ||
             checkPermission(PERMISSIONS.EDIT_ASSIGNMENTS) ||
             checkPermission(PERMISSIONS.EDIT_ROLES) ||
             checkPermission(PERMISSIONS.EDIT_SKILLS);
    },

    /**
     * Gibt die Person-ID des eingeloggten Users zurück
     */
    getOwnPersonId: () => personProfile?.id || null,

    /**
     * Low-level permission check für custom cases
     */
    checkPermission,
  };
};

export default usePermissions;
