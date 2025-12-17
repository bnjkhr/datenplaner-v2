// src/components/auth/MeinProfilModal.js
import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataProvider';
import { auth } from '../../firebase/config';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export const MeinProfilModal = ({ isOpen, onClose }) => {
  const {
    currentPerson,
    skills,
    datenprodukte,
    zuordnungen,
    rollen,
    aktualisierePerson,
    fuegeZuordnungHinzu,
    loescheZuordnung,
    aktualisiereZuordnungStunden,
    isAdmin
  } = useData();

  const [editMode, setEditMode] = useState(false);
  const [editZuordnungen, setEditZuordnungen] = useState(false);
  const [editLinks, setEditLinks] = useState(false);
  const [editSkills, setEditSkills] = useState(false);
  const [selectedSkillIds, setSelectedSkillIds] = useState([]);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [formData, setFormData] = useState({
    wochenstunden: 31,
    terminbuchungsLink: '',
    msTeamsLink: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [zuordnungenEdits, setZuordnungenEdits] = useState({});
  const [newZuordnung, setNewZuordnung] = useState({ datenproduktId: '', rolleId: '', stunden: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Formular mit aktuellen Daten initialisieren
  useEffect(() => {
    if (currentPerson) {
      setFormData({
        wochenstunden: currentPerson.wochenstunden || 31,
        terminbuchungsLink: currentPerson.terminbuchungsLink || '',
        msTeamsLink: currentPerson.msTeamsLink || ''
      });
    }
  }, [currentPerson]);

  // Initialize selected skills when person changes
  useEffect(() => {
    if (currentPerson) {
      setSelectedSkillIds(currentPerson.skillIds || []);
    }
  }, [currentPerson]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditMode(false);
      setEditZuordnungen(false);
      setEditLinks(false);
      setEditSkills(false);
      setShowPasswordChange(false);
      setError('');
      setSuccess('');
      setZuordnungenEdits({});
      setNewZuordnung({ datenproduktId: '', rolleId: '', stunden: 0 });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      if (currentPerson) {
        setSelectedSkillIds(currentPerson.skillIds || []);
      }
    }
  }, [isOpen, currentPerson]);

  if (!isOpen) return null;

  // Kein verknüpftes Profil gefunden
  if (!currentPerson) {
    return (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onClose}
        />

        {/* Slide-in Panel */}
        <div
          className={`fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white dark:bg-gray-800 shadow-2xl z-50
                      transform transition-transform duration-300 ease-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-ard-blue-600 to-ard-blue-700 text-white p-6">
              <div className="flex items-start justify-between">
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <h2 className="text-xl font-bold mt-4">Mein Profil</h2>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Kein Profil gefunden</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Deine E-Mail-Adresse ist noch nicht mit einem Personen-Eintrag verknüpft.
                  Bitte kontaktiere einen Administrator.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Berechnungen
  const personSkills = (currentPerson.skillIds || [])
    .map(skillId => skills.find(s => s.id === skillId))
    .filter(Boolean);

  const personZuordnungen = zuordnungen.filter(z => z.personId === currentPerson.id);

  const produktZuordnungen = personZuordnungen.map(z => {
    const produkt = datenprodukte.find(dp => dp.id === z.datenproduktId);
    const rolle = rollen.find(r => r.id === z.rolleId);
    return {
      id: z.id,
      datenproduktId: z.datenproduktId,
      rolleId: z.rolleId,
      produkt: produkt?.name || 'Unbekannt',
      rolle: rolle?.name || 'Unbekannt',
      rolleColor: rolle?.color,
      stunden: z.stunden || 0
    };
  });

  const totalStunden = produktZuordnungen.reduce((sum, z) => {
    const editedStunden = zuordnungenEdits[z.id]?.stunden;
    return sum + (editedStunden !== undefined ? editedStunden : z.stunden);
  }, 0);

  const wochenstundenValue = editMode ? formData.wochenstunden : currentPerson.wochenstunden || 31;
  const auslastung = wochenstundenValue
    ? Math.round((totalStunden / wochenstundenValue) * 100)
    : 0;

  // Datenprodukte, bei denen der User noch nicht zugeordnet ist
  const verfuegbareProdukte = datenprodukte.filter(
    dp => !personZuordnungen.some(z => z.datenproduktId === dp.id)
  );

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await aktualisierePerson(currentPerson.id, {
        ...currentPerson,
        wochenstunden: formData.wochenstunden
      });
      setSuccess('Profil erfolgreich aktualisiert!');
      setEditMode(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Fehler beim Speichern. Bitte versuche es erneut.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLinks = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await aktualisierePerson(currentPerson.id, {
        ...currentPerson,
        terminbuchungsLink: formData.terminbuchungsLink,
        msTeamsLink: formData.msTeamsLink
      });
      setSuccess('Links erfolgreich aktualisiert!');
      setEditLinks(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating links:', err);
      setError('Fehler beim Speichern. Bitte versuche es erneut.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSkills = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await aktualisierePerson(currentPerson.id, {
        ...currentPerson,
        skillIds: selectedSkillIds
      });
      setSuccess('Skills erfolgreich aktualisiert!');
      setEditSkills(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating skills:', err);
      setError('Fehler beim Speichern der Skills.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSkills = () => {
    setSelectedSkillIds(currentPerson?.skillIds || []);
    setEditSkills(false);
    setError('');
  };

  const toggleSkill = (skillId) => {
    setSelectedSkillIds(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Die neuen Passwörter stimmen nicht überein.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('Das neue Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordData.newPassword);
      setSuccess('Passwort erfolgreich geändert!');
      setShowPasswordChange(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      if (err.code === 'auth/wrong-password') {
        setError('Das aktuelle Passwort ist falsch.');
      } else if (err.code === 'auth/weak-password') {
        setError('Das neue Passwort ist zu schwach.');
      } else {
        setError('Fehler beim Ändern des Passworts. Bitte versuche es erneut.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveZuordnungen = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Alle geänderten Zuordnungen speichern
      for (const [zuordnungId, changes] of Object.entries(zuordnungenEdits)) {
        if (changes.stunden !== undefined) {
          await aktualisiereZuordnungStunden(zuordnungId, changes.stunden);
        }
      }
      setSuccess('Zuordnungen erfolgreich aktualisiert!');
      setEditZuordnungen(false);
      setZuordnungenEdits({});
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating zuordnungen:', err);
      setError('Fehler beim Speichern der Zuordnungen.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddZuordnung = async () => {
    if (!newZuordnung.datenproduktId || !newZuordnung.rolleId) {
      setError('Bitte wähle ein Datenprodukt und eine Rolle aus.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await fuegeZuordnungHinzu({
        personId: currentPerson.id,
        datenproduktId: newZuordnung.datenproduktId,
        rolleId: newZuordnung.rolleId,
        stunden: newZuordnung.stunden || 0
      });
      setNewZuordnung({ datenproduktId: '', rolleId: '', stunden: 0 });
      setSuccess('Zuordnung hinzugefügt!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding zuordnung:', err);
      setError('Fehler beim Hinzufügen der Zuordnung.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZuordnung = async (zuordnungId) => {
    if (!window.confirm('Zuordnung wirklich entfernen?')) return;

    setSaving(true);
    setError('');

    try {
      await loescheZuordnung(zuordnungId);
      setSuccess('Zuordnung entfernt!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting zuordnung:', err);
      setError('Fehler beim Entfernen der Zuordnung.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      wochenstunden: currentPerson.wochenstunden || 31,
      terminbuchungsLink: currentPerson.terminbuchungsLink || '',
      msTeamsLink: currentPerson.msTeamsLink || ''
    });
    setEditMode(false);
    setError('');
  };

  const handleCancelLinks = () => {
    setFormData({
      ...formData,
      terminbuchungsLink: currentPerson.terminbuchungsLink || '',
      msTeamsLink: currentPerson.msTeamsLink || ''
    });
    setEditLinks(false);
    setError('');
  };

  const handleCancelPassword = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordChange(false);
    setError('');
  };

  const handleCancelZuordnungen = () => {
    setZuordnungenEdits({});
    setEditZuordnungen(false);
    setError('');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white dark:bg-gray-800 shadow-2xl z-50
                    transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 bg-gradient-to-r from-ard-blue-600 to-ard-blue-700 text-white">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Avatar & Name */}
              <div className="flex items-center gap-4">
                {currentPerson.avatarUrl ? (
                  <img
                    src={currentPerson.avatarUrl}
                    alt={currentPerson.name}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {currentPerson.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold">{currentPerson.name}</h2>
                  <p className="text-white/80 text-sm">Mein Profil</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Status Messages */}
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mx-6 mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
                {success}
              </div>
            )}

            {/* Content */}
            <div className="p-6 space-y-6">
          {/* Basis-Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">E-Mail</p>
              <p className="font-medium text-gray-900 dark:text-white">{currentPerson.email || '-'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
              <div className="flex items-center gap-2">
                {currentPerson.isM13 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    M13
                  </span>
                )}
                {isAdmin && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                    Admin
                  </span>
                )}
                {!currentPerson.isM13 && !isAdmin && (
                  <span className="text-gray-600 dark:text-gray-400">Standard</span>
                )}
              </div>
            </div>
          </div>

          {/* Wochenstunden & Auslastung */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Wochenstunden & Auslastung</h3>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-sm text-ard-blue-600 dark:text-ard-blue-400 hover:text-ard-blue-700 dark:hover:text-ard-blue-300 font-medium"
                >
                  Bearbeiten
                </button>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Wochenstunden
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={formData.wochenstunden}
                      onChange={(e) => setFormData({ ...formData, wochenstunden: parseFloat(e.target.value) || 0 })}
                      className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ard-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-ard-blue-600 hover:bg-ard-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Speichern...' : 'Speichern'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalStunden}</span>
                      <span className="text-gray-500 dark:text-gray-400">h</span>
                      <span className="text-gray-400 dark:text-gray-500 mx-1">/</span>
                      <span className="text-gray-600 dark:text-gray-400">{wochenstundenValue}h</span>
                    </div>
                    <div className={`text-2xl font-bold ${
                      auslastung > 100 ? 'text-red-600 dark:text-red-400' :
                      auslastung > 80 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      {auslastung}%
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        auslastung > 100 ? 'bg-red-500' :
                        auslastung > 80 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(auslastung, 100)}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Links (Terminbuchung & Teams) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Kontakt-Links</h3>
              {!editLinks && (
                <button
                  onClick={() => setEditLinks(true)}
                  className="text-sm text-ard-blue-600 dark:text-ard-blue-400 hover:text-ard-blue-700 dark:hover:text-ard-blue-300 font-medium"
                >
                  Bearbeiten
                </button>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              {editLinks ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Outlook Terminbuchungslink (M365 Bookings)
                    </label>
                    <input
                      type="url"
                      value={formData.terminbuchungsLink}
                      onChange={(e) => setFormData({ ...formData, terminbuchungsLink: e.target.value })}
                      placeholder="https://outlook.office.com/bookwithme/..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ard-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Teams-Link (für direkte Anrufe)
                    </label>
                    <input
                      type="url"
                      value={formData.msTeamsLink}
                      onChange={(e) => setFormData({ ...formData, msTeamsLink: e.target.value })}
                      placeholder="https://teams.microsoft.com/l/chat/..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ard-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleCancelLinks}
                      disabled={saving}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleSaveLinks}
                      disabled={saving}
                      className="px-4 py-2 bg-ard-blue-600 hover:bg-ard-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Speichern...' : 'Speichern'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {currentPerson.terminbuchungsLink ? (
                      <a
                        href={currentPerson.terminbuchungsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ard-blue-600 dark:text-ard-blue-400 hover:underline"
                      >
                        Termin buchen
                      </a>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic text-sm">Kein Terminbuchungslink hinterlegt</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                    {currentPerson.msTeamsLink ? (
                      <a
                        href={currentPerson.msTeamsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ard-blue-600 dark:text-ard-blue-400 hover:underline"
                      >
                        Teams-Chat öffnen
                      </a>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic text-sm">Kein Teams-Link hinterlegt</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Passwort ändern */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sicherheit</h3>
              {!showPasswordChange && (
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="text-sm text-ard-blue-600 dark:text-ard-blue-400 hover:text-ard-blue-700 dark:hover:text-ard-blue-300 font-medium"
                >
                  Passwort ändern
                </button>
              )}
            </div>
            {showPasswordChange && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Aktuelles Passwort
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ard-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Neues Passwort
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ard-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Neues Passwort bestätigen
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ard-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCancelPassword}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="px-4 py-2 bg-ard-blue-600 hover:bg-ard-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Speichern...' : 'Passwort ändern'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Skills */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Meine Skills</h3>
              {!editSkills && (
                <button
                  onClick={() => setEditSkills(true)}
                  className="text-sm text-ard-blue-600 dark:text-ard-blue-400 hover:text-ard-blue-700 dark:hover:text-ard-blue-300 font-medium"
                >
                  Bearbeiten
                </button>
              )}
            </div>
            {editSkills ? (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Wähle deine Skills aus:</p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map(skill => {
                      const isSelected = selectedSkillIds.includes(skill.id);
                      return (
                        <button
                          key={skill.id}
                          onClick={() => toggleSkill(skill.id)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                            isSelected
                              ? 'ring-2 ring-offset-1 ring-ard-blue-500'
                              : 'opacity-60 hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor: `${skill.color}20`,
                            borderColor: skill.color
                          }}
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: skill.color }}
                          />
                          {skill.name}
                          {isSelected && (
                            <svg className="w-4 h-4 text-ard-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {skills.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm italic">Keine Skills verfügbar</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelSkills}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSaveSkills}
                    disabled={saving}
                    className="px-4 py-2 bg-ard-blue-600 hover:bg-ard-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Speichern...' : 'Speichern'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {personSkills.length > 0 ? (
                  personSkills.map(skill => (
                    <span
                      key={skill.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border"
                      style={{
                        backgroundColor: `${skill.color}20`,
                        borderColor: skill.color
                      }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: skill.color }}
                      />
                      {skill.name}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm italic">Keine Skills hinterlegt</p>
                )}
              </div>
            )}
          </div>

          {/* Zuordnungen */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Meine Datenprodukte ({produktZuordnungen.length})
              </h3>
              {!editZuordnungen && (
                <button
                  onClick={() => setEditZuordnungen(true)}
                  className="text-sm text-ard-blue-600 dark:text-ard-blue-400 hover:text-ard-blue-700 dark:hover:text-ard-blue-300 font-medium"
                >
                  Bearbeiten
                </button>
              )}
            </div>

            {editZuordnungen ? (
              <div className="space-y-3">
                {/* Bestehende Zuordnungen */}
                {produktZuordnungen.map((z) => (
                  <div key={z.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {z.rolleColor && (
                        <div
                          className="w-1 h-10 rounded-full flex-shrink-0"
                          style={{ backgroundColor: z.rolleColor }}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{z.produkt}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{z.rolle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={zuordnungenEdits[z.id]?.stunden ?? z.stunden}
                        onChange={(e) => setZuordnungenEdits({
                          ...zuordnungenEdits,
                          [z.id]: { stunden: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                      />
                      <span className="text-gray-500 dark:text-gray-400 text-sm">h</span>
                      <button
                        onClick={() => handleDeleteZuordnung(z.id)}
                        disabled={saving}
                        className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Zuordnung entfernen"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Neue Zuordnung hinzufügen */}
                {verfuegbareProdukte.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">Neue Zuordnung hinzufügen</p>
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={newZuordnung.datenproduktId}
                        onChange={(e) => setNewZuordnung({ ...newZuordnung, datenproduktId: e.target.value })}
                        className="flex-1 min-w-[150px] px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="">Datenprodukt wählen...</option>
                        {verfuegbareProdukte.map(dp => (
                          <option key={dp.id} value={dp.id}>{dp.name}</option>
                        ))}
                      </select>
                      <select
                        value={newZuordnung.rolleId}
                        onChange={(e) => setNewZuordnung({ ...newZuordnung, rolleId: e.target.value })}
                        className="flex-1 min-w-[120px] px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="">Rolle wählen...</option>
                        {rollen.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={newZuordnung.stunden}
                        onChange={(e) => setNewZuordnung({ ...newZuordnung, stunden: parseFloat(e.target.value) || 0 })}
                        placeholder="h"
                        className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-right"
                      />
                      <button
                        onClick={handleAddZuordnung}
                        disabled={saving || !newZuordnung.datenproduktId || !newZuordnung.rolleId}
                        className="px-3 py-1.5 bg-ard-blue-600 hover:bg-ard-blue-700 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {produktZuordnungen.length === 0 && verfuegbareProdukte.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm italic text-center py-4">
                    Keine Datenprodukte verfügbar
                  </p>
                )}

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCancelZuordnungen}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Abbrechen
                  </button>
                  {Object.keys(zuordnungenEdits).length > 0 && (
                    <button
                      onClick={handleSaveZuordnungen}
                      disabled={saving}
                      className="px-4 py-2 bg-ard-blue-600 hover:bg-ard-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Speichern...' : 'Änderungen speichern'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {produktZuordnungen.length > 0 ? (
                  produktZuordnungen.map((z) => (
                    <div key={z.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {z.rolleColor && (
                          <div
                            className="w-1 h-10 rounded-full"
                            style={{ backgroundColor: z.rolleColor }}
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{z.produkt}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{z.rolle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-ard-blue-600 dark:text-ard-blue-400">{z.stunden}h</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">pro Woche</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm italic text-center py-4">
                    Noch keinen Datenprodukten zugeordnet
                  </p>
                )}
              </div>
            )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default MeinProfilModal;
