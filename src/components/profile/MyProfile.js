// src/components/profile/MyProfile.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataProvider';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '../../utils/permissions';
import { TagInput } from '../ui/TagInput';

/**
 * Komponente zur Anzeige und Bearbeitung des eigenen Profils
 * Für alle eingeloggten User zugänglich
 */
export const MyProfile = () => {
  const {
    user,
    userProfile,
    personProfile,
    role,
    hasProfile,
    isProfileLinked,
    loading: authLoading,
    canEditOwnProfile,
  } = useAuth();

  const {
    aktualisierePerson,
    skills,
    loading: dataLoading,
    error,
    setError,
  } = useData();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    wochenstunden: 31,
    kategorien: [],
    terminbuchungsLink: '',
    skillIds: [],
  });

  // Load person data into form when available
  useEffect(() => {
    if (personProfile) {
      setFormData({
        name: personProfile.name || '',
        email: personProfile.email || '',
        wochenstunden: personProfile.wochenstunden || 31,
        kategorien: personProfile.kategorien || [],
        terminbuchungsLink: personProfile.terminbuchungsLink || '',
        skillIds: personProfile.skillIds || [],
      });
    }
  }, [personProfile]);

  const handleSave = async () => {
    if (!personProfile?.id) return;

    const success = await aktualisierePerson(personProfile.id, formData);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (personProfile) {
      setFormData({
        name: personProfile.name || '',
        email: personProfile.email || '',
        wochenstunden: personProfile.wochenstunden || 31,
        kategorien: personProfile.kategorien || [],
        terminbuchungsLink: personProfile.terminbuchungsLink || '',
        skillIds: personProfile.skillIds || [],
      });
    }
    setIsEditing(false);
  };

  if (authLoading || dataLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Profil...</p>
        </div>
      </div>
    );
  }

  // User ist nicht mit einem Profil verknüpft
  if (!isProfileLinked || !hasProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="opaque-card p-8 text-center max-w-2xl mx-auto">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Kein Profil verknüpft</h2>
          <p className="text-gray-600 mb-6">
            Ihr Benutzerkonto ist noch nicht mit einem Personenprofil verknüpft.
            Bitte kontaktieren Sie einen Administrator, um Ihr Profil zu verknüpfen.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Ihre Account-Informationen:</h3>
            <p className="text-sm text-gray-600"><strong>E-Mail:</strong> {user?.email}</p>
            <p className="text-sm text-gray-600"><strong>User ID:</strong> {user?.uid}</p>
            <p className="text-sm text-gray-600"><strong>Rolle:</strong> {ROLE_LABELS[role]}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mein Profil</h1>
            <p className="text-gray-600">Verwalten Sie Ihre persönlichen Informationen</p>
          </div>
          {!isEditing && canEditOwnProfile() && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Bearbeiten
            </button>
          )}
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

        <div className="opaque-card p-6 space-y-6">
          {/* Account Information */}
          <div className="pb-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account-Informationen</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rolle</label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                    {ROLE_LABELS[role]}
                  </span>
                  <span className="text-xs text-gray-500" title={ROLE_DESCRIPTIONS[role]}>ℹ️</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profil-Informationen</h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="text-gray-900">{personProfile?.name}</p>
                )}
              </div>

              {/* E-Mail */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kontakt-E-Mail</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="text-gray-900">{personProfile?.email}</p>
                )}
              </div>

              {/* Wochenstunden */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wochenstunden</label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={formData.wochenstunden}
                    onChange={(e) => setFormData({ ...formData, wochenstunden: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="text-gray-900">{personProfile?.wochenstunden || 31} Stunden</p>
                )}
              </div>

              {/* Kategorien */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategorien</label>
                {isEditing ? (
                  <TagInput
                    tags={formData.kategorien}
                    onTagsChange={(newTags) => setFormData({ ...formData, kategorien: newTags })}
                    placeholder="Kategorien hinzufügen..."
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(personProfile?.kategorien || []).length === 0 ? (
                      <p className="text-gray-500 italic">Keine Kategorien</p>
                    ) : (
                      personProfile?.kategorien.map((cat, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-sm">
                          {cat}
                        </span>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
                    {skills.map(skill => {
                      const isSelected = formData.skillIds?.includes(skill.id);
                      return (
                        <button
                          key={skill.id}
                          type="button"
                          onClick={() => {
                            const newSkillIds = isSelected
                              ? formData.skillIds.filter(id => id !== skill.id)
                              : [...(formData.skillIds || []), skill.id];
                            setFormData({ ...formData, skillIds: newSkillIds });
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                            isSelected
                              ? 'ring-2 ring-indigo-500'
                              : 'hover:ring-2 hover:ring-gray-300'
                          }`}
                          style={{ backgroundColor: skill.color }}
                        >
                          {skill.name} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(personProfile?.skillIds || []).length === 0 ? (
                      <p className="text-gray-500 italic">Keine Skills</p>
                    ) : (
                      personProfile?.skillIds.map(skillId => {
                        const skill = skills.find(s => s.id === skillId);
                        if (!skill) return null;
                        return (
                          <span
                            key={skillId}
                            className="px-3 py-1 rounded-full text-sm font-medium"
                            style={{ backgroundColor: skill.color }}
                          >
                            {skill.name}
                          </span>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Terminbuchungslink */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terminbuchungslink</label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.terminbuchungsLink}
                    onChange={(e) => setFormData({ ...formData, terminbuchungsLink: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  personProfile?.terminbuchungsLink ? (
                    <a
                      href={personProfile.terminbuchungsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 underline"
                    >
                      {personProfile.terminbuchungsLink}
                    </a>
                  ) : (
                    <p className="text-gray-500 italic">Kein Link angegeben</p>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Speichern
              </button>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="mt-6 opaque-card p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Profil-Metadaten</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Status:</span>{' '}
              <span className={personProfile?.isActive ? 'text-green-600' : 'text-gray-500'}>
                {personProfile?.isActive ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>
            <div>
              <span className="font-medium">Erstellt:</span>{' '}
              {personProfile?.erstelltAm ? new Date(personProfile.erstelltAm).toLocaleDateString('de-DE') : '-'}
            </div>
            <div>
              <span className="font-medium">Letzte Änderung:</span>{' '}
              {personProfile?.letzteAenderung ? new Date(personProfile.letzteAenderung).toLocaleDateString('de-DE') : '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
