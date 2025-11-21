// src/components/admin/UserManagement.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataProvider';
import { USER_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from '../../utils/permissions';
import { ConfirmModal } from '../ui/ConfirmModal';

/**
 * Admin-Komponente zur Verwaltung von Benutzern und Rollen
 * Nur für Admins zugänglich
 */
export const UserManagement = () => {
  const { isAdmin, canAssignRoles } = useAuth();
  const {
    personen,
    verknuepfeUserMitPerson,
    aktualisiereUserRolle,
    trenneUserVonPerson,
    loading,
    error,
    setError,
  } = useData();

  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [linkUserId, setLinkUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.USER);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter personen basierend auf Suchbegriff
  const filteredPersonen = personen.filter(person =>
    person.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Gruppiere Personen nach Verknüpfungsstatus
  const linkedPersonen = filteredPersonen.filter(p => p.authUserId);
  const unlinkedPersonen = filteredPersonen.filter(p => !p.authUserId);

  const handleLinkUser = async () => {
    if (!selectedPerson || !linkUserId.trim()) {
      setError('Bitte User ID eingeben');
      return;
    }

    const success = await verknuepfeUserMitPerson(linkUserId.trim(), selectedPerson.id, selectedRole);
    if (success) {
      setShowLinkDialog(false);
      setLinkUserId('');
      setSelectedPerson(null);
      setSelectedRole(USER_ROLES.USER);
    }
  };

  const handleUnlinkUser = async () => {
    if (!selectedPerson) return;

    const success = await trenneUserVonPerson(selectedPerson.authUserId, selectedPerson.id);
    if (success) {
      setShowUnlinkConfirm(false);
      setSelectedPerson(null);
    }
  };

  const handleRoleChange = async (person, newRole) => {
    if (!person.authUserId) {
      setError('Person ist nicht mit einem User verknüpft');
      return;
    }

    await aktualisiereUserRolle(person.authUserId, person.id, newRole);
  };

  if (!isAdmin() && !canAssignRoles()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="opaque-card p-6 text-center">
          <p className="text-red-600 font-semibold">
            Sie haben keine Berechtigung, diese Seite anzuzeigen.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Benutzerdaten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Benutzerverwaltung</h1>
        <p className="text-gray-600">Verwalten Sie Benutzerkonten, Rollen und Profilverknüpfungen</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Schließen
          </button>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Suche nach Namen oder E-Mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Verknüpfte Benutzer */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Verknüpfte Benutzer ({linkedPersonen.length})
        </h2>
        <div className="opaque-card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-Mail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rolle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {linkedPersonen.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    Keine verknüpften Benutzer gefunden
                  </td>
                </tr>
              ) : (
                linkedPersonen.map(person => (
                  <tr key={person.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{person.name}</div>
                      <div className="text-xs text-gray-500">User ID: {person.authUserId?.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {person.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={person.role || USER_ROLES.VIEWER}
                        onChange={(e) => handleRoleChange(person, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        title={ROLE_DESCRIPTIONS[person.role]}
                      >
                        {Object.values(USER_ROLES).map(role => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        person.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {person.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedPerson(person);
                          setShowUnlinkConfirm(true);
                        }}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Trennen
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nicht verknüpfte Personen */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Nicht verknüpfte Personen ({unlinkedPersonen.length})
        </h2>
        <div className="opaque-card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-Mail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {unlinkedPersonen.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    Alle Personen sind verknüpft
                  </td>
                </tr>
              ) : (
                unlinkedPersonen.map(person => (
                  <tr key={person.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {person.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {person.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedPerson(person);
                          setShowLinkDialog(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                      >
                        Verknüpfen
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Link User Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">User verknüpfen</h3>
            <p className="text-gray-600 mb-4">
              Verknüpfen Sie einen Firebase Auth User mit dem Profil von <strong>{selectedPerson?.name}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Firebase User ID (UID)
              </label>
              <input
                type="text"
                value={linkUserId}
                onChange={(e) => setLinkUserId(e.target.value)}
                placeholder="z.B. abc123xyz..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Die User ID finden Sie in der Firebase Console unter Authentication
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Benutzerrolle
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {Object.values(USER_ROLES).map(role => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]} - {ROLE_DESCRIPTIONS[role]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkUserId('');
                  setSelectedPerson(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleLinkUser}
                disabled={!linkUserId.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verknüpfen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlink Confirm Modal */}
      <ConfirmModal
        isOpen={showUnlinkConfirm}
        onClose={() => {
          setShowUnlinkConfirm(false);
          setSelectedPerson(null);
        }}
        onConfirm={handleUnlinkUser}
        title="Verknüpfung trennen?"
        message={`Möchten Sie die Verknüpfung zwischen dem User und ${selectedPerson?.name} wirklich trennen? Der User verliert dadurch den Zugriff auf dieses Profil.`}
        confirmText="Trennen"
        cancelText="Abbrechen"
        danger
      />
    </div>
  );
};

export default UserManagement;
