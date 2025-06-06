import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// --- Firebase Configuration ---
// ERSETZE DIES MIT DEINER ECHTEN FIREBASE-KONFIGURATION!
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDNdCSEHHveLZloWrdrgq4zqgi8DUR72RE",
  authDomain: "datenprodukt-planer-app.firebaseapp.com",
  projectId: "datenprodukt-planer-app",
  storageBucket: "datenprodukt-planer-app.firebasestorage.app",
  messagingSenderId: "32250523439",
  appId: "1:32250523439:web:3bafa128b7758f36253bda",
  measurementId: "G-CEV457PXY1"
};

// --- App ID for Firestore paths ---
const appId = 'datenplaner-app-v3';

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Data Context ---
const DataContext = createContext();
export const useData = () => useContext(DataContext);

const initialRollen = [
  { id: 'rolle1', name: 'Datenprodukt-Owner (DPO)' }, { id: 'rolle2', name: 'Facilitator' },
  { id: 'rolle3', name: 'Transparenzmeister:in' }, { id: 'rolle4', name: 'Link Domäne Gremien' },
  { id: 'rolle5', name: 'Link Medienforschung (Optional)' }, { id: 'rolle6', name: 'Datenprodukt-Engineer (Data-Engineer)' },
  { id: 'rolle7', name: 'Daten-Analyst' }, { id: 'rolle8', name: 'Link M13-Data-Plattform' },
  { id: 'rolle9', name: 'Data-Contract Expert:in' }, { id: 'rolle10', name: 'Projektmanager:in' },
  { id: 'rolle11', name: 'Pate M13-Kernteam' }
];

const DataProvider = ({ children }) => {
  const [personen, setPersonen] = useState([]);
  const [datenprodukte, setDatenprodukte] = useState([]);
  const [rollen, setRollen] = useState(initialRollen);
  const [zuordnungen, setZuordnungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sharedDataPath = `/artifacts/${appId}/public/data`;
  const getPersonenCollectionPath = useCallback(() => `${sharedDataPath}/personen`, []);
  const getDatenprodukteCollectionPath = useCallback(() => `${sharedDataPath}/datenprodukte`, []);
  const getZuordnungenCollectionPath = useCallback(() => `${sharedDataPath}/zuordnungen`, []);

  useEffect(() => {
    setLoading(true);
    setError(null); 

    const unsubscribes = [];
    let initialDataLoaded = false;
    
    const onDataLoaded = () => {
        if (!initialDataLoaded) {
            setLoading(false);
            initialDataLoaded = true;
        }
    };

    const setupListener = (collectionPath, setData) => {
        const q = query(collection(db, collectionPath));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setData(data);
            onDataLoaded(); // Mark loading as done on first successful fetch
        }, (err) => {
            console.error(`Error fetching from ${collectionPath}: `, err);
            setError(`Fehler beim Laden der Daten von ${collectionPath.split('/').pop()}. Bitte die Firestore-Sicherheitsregeln überprüfen.`);
            setLoading(false);
        });
        unsubscribes.push(unsubscribe);
    };

    setupListener(getPersonenCollectionPath(), setPersonen);
    setupListener(getDatenprodukteCollectionPath(), setDatenprodukte);
    setupListener(getZuordnungenCollectionPath(), setZuordnungen);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [getPersonenCollectionPath, getDatenprodukteCollectionPath, getZuordnungenCollectionPath]);

  const fuegePersonHinzu = async (personDaten) => {
    try {
      const docRef = await addDoc(collection(db, getPersonenCollectionPath()), {
        ...personDaten, erstelltAm: new Date().toISOString(), letzteAenderung: new Date().toISOString(),
      });
      return docRef.id;
    } catch (e) { console.error("Error adding document: ", e); setError("Fehler beim Hinzufügen der Person."); return null; }
  };

  const aktualisierePerson = async (personId, neueDaten) => {
    try {
      const personDocRef = doc(db, getPersonenCollectionPath(), personId);
      await updateDoc(personDocRef, { ...neueDaten, letzteAenderung: new Date().toISOString(), });
      return true;
    } catch (e) { console.error("Error updating document: ", e); setError("Fehler beim Aktualisieren der Person."); return false; }
  };

  const loeschePerson = async (personId) => {
    try {
      const assignmentsQuery = query(collection(db, getZuordnungenCollectionPath()), where("personId", "==", personId));
      const assignmentSnapshot = await getDocs(assignmentsQuery);
      const batch = []; 
      assignmentSnapshot.forEach(doc => { batch.push(deleteDoc(doc.ref)); });
      await Promise.all(batch);
      await deleteDoc(doc(db, getPersonenCollectionPath(), personId));
      return true;
    } catch (e) { console.error("Error deleting person or their assignments: ", e); setError("Fehler beim Löschen der Person."); return false; }
  };

  const erstelleDatenprodukt = async (produktDaten) => {
    try {
        const docRef = await addDoc(collection(db, getDatenprodukteCollectionPath()), { ...produktDaten, erstelltAm: new Date().toISOString(), letzteAenderung: new Date().toISOString(), });
        return docRef.id;
    } catch (e) { console.error("Error adding Datenprodukt: ", e); setError("Fehler beim Erstellen des Datenprodukts."); return null; }
  };
  
  const aktualisiereDatenprodukt = async (produktId, neueDaten) => {
    try {
        const produktDocRef = doc(db, getDatenprodukteCollectionPath(), produktId);
        await updateDoc(produktDocRef, { ...neueDaten, letzteAenderung: new Date().toISOString(), });
        return true;
    } catch (e) { console.error("Error updating Datenprodukt: ", e); setError("Fehler beim Aktualisieren des Datenprodukts."); return false; }
  };

  const loescheDatenprodukt = async (produktId) => {
    try {
        const assignmentsQuery = query(collection(db, getZuordnungenCollectionPath()), where("datenproduktId", "==", produktId));
        const assignmentSnapshot = await getDocs(assignmentsQuery);
        const batch = [];
        assignmentSnapshot.forEach(doc => { batch.push(deleteDoc(doc.ref)); });
        await Promise.all(batch);
        await deleteDoc(doc(db, getDatenprodukteCollectionPath(), produktId));
        return true;
    } catch (e) { console.error("Error deleting Datenprodukt or its assignments: ", e); setError("Fehler beim Löschen des Datenprodukts."); return false; }
  };

  const weisePersonDatenproduktRolleZu = async (personId, produktId, rolleId) => {
    const existingAssignment = zuordnungen.find( z => z.personId === personId && z.datenproduktId === produktId && z.rolleId === rolleId );
    if (existingAssignment) { console.warn("Assignment already exists:", personId, produktId, rolleId); return existingAssignment.id; }
    try {
        const docRef = await addDoc(collection(db, getZuordnungenCollectionPath()), { personId, datenproduktId: produktId, rolleId, erstelltAm: new Date().toISOString(), });
        return docRef.id;
    } catch (e) { console.error("Error assigning role: ", e); setError("Fehler bei der Rollenzuweisung."); return null; }
  };

  const entfernePersonVonDatenproduktRolle = async (zuordnungId) => {
    try {
        await deleteDoc(doc(db, getZuordnungenCollectionPath(), zuordnungId));
        return true;
    } catch (e) { console.error("Error removing role assignment: ", e); setError("Fehler beim Entfernen der Rollenzuweisung."); return false; }
  };

  return (
    <DataContext.Provider value={{
      personen, datenprodukte, rollen, zuordnungen,
      fuegePersonHinzu, aktualisierePerson, loeschePerson,
      erstelleDatenprodukt, aktualisiereDatenprodukt, loescheDatenprodukt,
      weisePersonDatenproduktRolleZu, entfernePersonVonDatenproduktRolle,
      loading, error,
    }}>
      {children}
    </DataContext.Provider>
  );
};

const AuthPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault(); setLoading(true); setError('');
        try { await signInWithEmailAndPassword(auth, email, password); } 
        catch (err) {
            let userFriendlyError = "Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.";
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {} else { userFriendlyError = err.message; }
            setError(userFriendlyError); console.error("Firebase Auth Error:", err.code, err.message);
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                <h1 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Datenprodukt Planer</h1>
                <h2 className="text-xl text-gray-700 mb-6 text-center">Anmelden</h2>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="auth-email" className="block text-sm font-medium text-gray-700">E-Mail Adresse</label>
                        <input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="deine.email@firma.de"/>
                    </div>
                    <div>
                         <label htmlFor="auth-password" className="block text-sm font-medium text-gray-700">Passwort</label>
                        <input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="Passwort"/>
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <div>
                        <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300">
                            {loading ? 'Bitte warten...' : 'Anmelden'}
                        </button>
                    </div>
                </form>
                 <p className="mt-8 text-xs text-gray-500 text-center">Benutzerkonten werden vom Administrator in der Firebase Console erstellt.</p>
            </div>
        </div>
    );
};

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setSuccess('');
        if (newPassword !== confirmPassword) { setError('Die Passwörter stimmen nicht überein.'); return; }
        if (newPassword.length < 6) { setError('Das Passwort muss mindestens 6 Zeichen lang sein.'); return; }
        const user = auth.currentUser;
        if (user) {
            setLoading(true);
            try {
                await updatePassword(user, newPassword);
                setSuccess('Passwort erfolgreich geändert! Das Fenster schließt in 3 Sekunden.');
                setTimeout(() => onClose(), 3000);
            } catch (err) {
                console.error("Error updating password:", err);
                setError('Fehler beim Ändern des Passworts. Bitte versuchen Sie es später erneut.');
            } finally { setLoading(false); }
        }
    };
    
    useEffect(() => { if (!isOpen) { setNewPassword(''); setConfirmPassword(''); setError(''); setSuccess(''); setLoading(false); } }, [isOpen]);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-semibold text-gray-700 mb-6">Passwort ändern</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">Neues Passwort</label>
                        <input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Neues Passwort bestätigen</label>
                        <input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {success && <p className="text-sm text-green-600">{success}</p>}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 border rounded-md text-sm">Abbrechen</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300">{loading ? 'Speichern...' : 'Passwort speichern'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel, confirmText = "Löschen", cancelText = "Abbrechen", title = "Bestätigung" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="relative p-6 bg-white w-full max-w-md m-auto flex-col flex rounded-lg shadow-xl">
                <h3 className="text-xl font-semibold mb-4">{title}</h3>
                <div className="text-md mb-6">{message}</div>
                <div className="flex justify-end space-x-3">
                    <button onClick={onCancel} className="px-4 py-2 border rounded-md text-sm"> {cancelText} </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"> {confirmText} </button>
                </div>
            </div>
        </div>
    );
};

const TagInput = ({ tags, setTags, placeholder = "Add a skill" }) => {
    const [inputValue, setInputValue] = useState('');
    const handleKeyDown = (e) => {
        if ((e.key === 'Enter' || e.key === ',') && inputValue.trim() !== '') {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (!tags.includes(newTag)) { setTags([...tags, newTag]); }
            setInputValue('');
        } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };
    return (
        <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md min-h-[40px]">
            {tags.map(tag => (
                <span key={tag} className="bg-blue-500 text-white px-2 py-1 rounded-full text-sm flex items-center">
                    {tag}
                    <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="ml-2 text-xs text-blue-100 hover:text-white">&times;</button>
                </span>
            ))}
            <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={tags.length === 0 ? placeholder : ""} className="flex-grow p-1 outline-none text-sm"/>
        </div>
    );
};

const PersonFormular = ({ personToEdit, onFormClose }) => {
  const { fuegePersonHinzu, aktualisierePerson } = useData();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [skills, setSkills] = useState([]);
  const [msTeamsEmail, setMsTeamsEmail] = useState(''); 
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (personToEdit) {
      setName(personToEdit.name || ''); setEmail(personToEdit.email || ''); setSkills(personToEdit.skills || []);
      const teamsLink = personToEdit.msTeamsLink || '';
      const emailMatch = teamsLink.match(/users=([^&]+)/);
      setMsTeamsEmail(emailMatch ? emailMatch[1] : (personToEdit.email || ''));
    } else {
      setName(''); setEmail(''); setSkills([]); setMsTeamsEmail('');
    }
  }, [personToEdit]);

  const handleSubmit = async (event) => {
    event.preventDefault(); setFormError('');
    if (!name.trim() || !email.trim()) { setFormError('Name und E-Mail sind Pflichtfelder.'); return; }
    const finalMsTeamsLink = msTeamsEmail.trim() ? `msteams:/l/chat/0/0?users=${msTeamsEmail.trim()}` : '';
    const personData = { name: name.trim(), email: email.trim(), skills, msTeamsLink: finalMsTeamsLink };
    let success = false;
    if (personToEdit && personToEdit.id) { success = await aktualisierePerson(personToEdit.id, personData); } 
    else { const newId = await fuegePersonHinzu(personData); success = !!newId; }
    if (success) { if (!personToEdit) { setName(''); setEmail(''); setSkills([]); setMsTeamsEmail(''); } if (onFormClose) onFormClose();
    } else { setFormError('Fehler beim Speichern der Person.'); }
  };

  return ( <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg"><h2 className="text-2xl font-semibold text-gray-700 mb-6">{personToEdit ? 'Person bearbeiten' : 'Neue Person hinzufügen'}</h2>{formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}<div><label htmlFor="person-name" className="block text-sm font-medium text-gray-700">Name</label><input id="person-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Max Mustermann" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/></div><div><label htmlFor="person-email" className="block text-sm font-medium text-gray-700">E-Mail</label><input id="person-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="max.mustermann@firma.de" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/></div><div><label htmlFor="msTeamsEmail" className="block text-sm font-medium text-gray-700">MS Teams E-Mail (für Chat-Link)</label><input id="msTeamsEmail" type="email" value={msTeamsEmail} onChange={e => setMsTeamsEmail(e.target.value)} placeholder="max.mustermann@firma.de" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/><p className="mt-1 text-xs text-gray-500">Aus dieser E-Mail wird der MS Teams Chat-Link generiert.</p></div><div><label className="block text-sm font-medium text-gray-700">Skills</label><TagInput tags={skills} setTags={setSkills} placeholder="Skill hinzufügen und Enter drücken" /></div><div className="flex justify-end space-x-3 pt-4">{onFormClose && (<button type="button" onClick={onFormClose} className="px-4 py-2 border rounded-md text-sm">Abbrechen</button>)}<button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700">{personToEdit ? 'Speichern' : 'Hinzufügen'}</button></div></form> );
};

const PersonEintrag = ({ person, onEdit, onDeleteInitiation, onSkillClick }) => {
  const { name, email, skills, msTeamsLink } = person; 
  const { datenprodukte, zuordnungen, rollen } = useData();
  const personAssignments = zuordnungen.filter(z => z.personId === person.id).map(assignment => {
      const produkt = datenprodukte.find(dp => dp.id === assignment.datenproduktId);
      const rolleInProdukt = rollen.find(r => r.id === assignment.rolleId);
      return { produktName: produkt?.name || '...', rolleName: rolleInProdukt?.name || '...', assignmentId: assignment.id };
  }).filter(a => a.produktName !== '...');

  return ( <div className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl flex flex-col justify-between"><div><div className="flex justify-between items-start mb-2"><h3 className="text-xl font-bold text-indigo-700 break-words mr-2">{name}</h3>{msTeamsLink && (<a href={msTeamsLink} target="_blank" rel="noopener noreferrer" className="text-2xl" title="Chat in MS Teams starten">💬</a>)}</div>{email && (<div className="mb-3"><a href={`mailto:${email}`} className="text-sm text-gray-500 hover:text-indigo-600 break-all">{email}</a></div>)}{skills && skills.length > 0 && (<div className="mb-4"><p className="text-sm font-medium text-gray-600 mb-1">Skills:</p><div className="flex flex-wrap gap-2">{skills.map(skill => (<button key={skill} onClick={() => onSkillClick(skill)} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium hover:bg-indigo-200">{skill}</button>))}</div></div>)}{personAssignments.length > 0 && (<div className="mb-4"><p className="text-sm font-medium text-gray-600 mb-1">Arbeitet an:</p><ul className="list-none space-y-1">{personAssignments.map(a => (<li key={a.assignmentId} className="text-xs text-gray-700 bg-indigo-50 p-2 rounded-md"><strong>{a.produktName}</strong> ({a.rolleName})</li>))}</ul></div>)}</div><div className="mt-auto pt-4 flex justify-end space-x-3 border-t"><button onClick={() => onEdit(person)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Bearbeiten</button><button onClick={() => onDeleteInitiation(person)} className="text-sm text-red-500 hover:text-red-700 font-medium">Löschen</button></div></div> );
};

const PersonenListe = ({ personenToDisplay, onEditPerson, onDeleteInitiation, onSkillClick }) => {
  const { loading, error } = useData(); 
  if (loading) return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (error) return <p className="text-center text-red-500 py-8">{error}</p>;
  if (personenToDisplay.length === 0) return <p className="text-center text-gray-500 py-8">Keine Personen gefunden.</p>;
  return ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">{personenToDisplay.map(person => (<PersonEintrag key={person.id} person={person} onEdit={onEditPerson} onDeleteInitiation={onDeleteInitiation} onSkillClick={onSkillClick} />))}</div> );
};

const PersonenVerwaltung = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const { personen, loeschePerson } = useData(); 
  const [skillSearchTerm, setSkillSearchTerm] = useState('');

  const handleAddNewPerson = () => { setEditingPerson(null); setShowForm(true); };
  const handleEditPerson = (person) => { setEditingPerson(person); setShowForm(true); };
  const handleFormClose = () => { setShowForm(false); setEditingPerson(null); };
  const handleDeleteInitiation = (person) => { setPersonToDelete(person); setShowDeleteModal(true); };
  const confirmDelete = async () => { if (personToDelete) { await loeschePerson(personToDelete.id); } setShowDeleteModal(false); setPersonToDelete(null); };
  const cancelDelete = () => { setShowDeleteModal(false); setPersonToDelete(null); };
  const handleSkillClick = (skill) => { setSkillSearchTerm(skill); };
  const filteredPersonen = personen.filter(p => !skillSearchTerm || (p.skills && p.skills.some(s => s.toLowerCase().includes(skillSearchTerm.toLowerCase()))));

  return ( <div className="container mx-auto px-4 py-8"><div className="flex flex-wrap justify-between items-center mb-6 gap-4"><h1 className="text-3xl font-bold text-gray-800">Personenverwaltung</h1><button onClick={handleAddNewPerson} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md"> + Neue Person </button></div><div className="mb-8 p-4 bg-white shadow rounded-lg"><label htmlFor="skill-search" className="block text-sm font-medium text-gray-700 mb-1">Nach Skill suchen:</label><div className="flex gap-2"><input id="skill-search" type="text" placeholder="z.B. Python, Tableau..." value={skillSearchTerm} onChange={e => setSkillSearchTerm(e.target.value)} className="flex-grow mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"/>{skillSearchTerm && (<button onClick={() => setSkillSearchTerm('')} className="mt-1 px-4 py-2 border rounded-md text-sm">Filter löschen</button>)}</div></div>{showForm && (<div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-40 p-4" onClick={handleFormClose}><div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}><PersonFormular personToEdit={editingPerson} onFormClose={handleFormClose} /></div></div>)}<PersonenListe personenToDisplay={filteredPersonen} onEditPerson={handleEditPerson} onDeleteInitiation={handleDeleteInitiation} onSkillClick={handleSkillClick}/><ConfirmModal isOpen={showDeleteModal} title="Person löschen" message={`Möchten Sie ${personToDelete?.name || 'diese Person'} wirklich löschen?`} onConfirm={confirmDelete} onCancel={cancelDelete}/></div> );
};

const DatenproduktVerwaltung = () => {
    const { datenprodukte, erstelleDatenprodukt, aktualisiereDatenprodukt, loescheDatenprodukt, loading, error, personen, rollen, weisePersonDatenproduktRolleZu, zuordnungen, entfernePersonVonDatenproduktRolle } = useData();
    const [showProduktForm, setShowProduktForm] = useState(false);
    const [editingProdukt, setEditingProdukt] = useState(null); 
    const [name, setName] = useState('');
    const [beschreibung, setBeschreibung] = useState('');
    const [status, setStatus] = useState('In Planung');
    const [formError, setFormError] = useState('');
    const [selectedProduktForAssignment, setSelectedProduktForAssignment] = useState(null);
    const [assignPersonId, setAssignPersonId] = useState('');
    const [assignRolleId, setAssignRolleId] = useState('');
    const [assignmentError, setAssignmentError] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [produktToDelete, setProduktToDelete] = useState(null);

    useEffect(() => { if (editingProdukt) { setName(editingProdukt.name); setBeschreibung(editingProdukt.beschreibung || ''); setStatus(editingProdukt.status); } else { setName(''); setBeschreibung(''); setStatus('In Planung'); } }, [editingProdukt]);
    const handleProduktFormSubmit = async (e) => { e.preventDefault(); setFormError(''); if (!name.trim()) { setFormError("Name ist Pflichtfeld."); return; } const produktData = { name: name.trim(), beschreibung: beschreibung.trim(), status }; let success; if (editingProdukt && editingProdukt.id) { success = await aktualisiereDatenprodukt(editingProdukt.id, produktData); } else { success = await erstelleDatenprodukt(produktData); } if (success) { setShowProduktForm(false); setEditingProdukt(null); } else { setFormError('Fehler beim Speichern.'); } };
    const handleOpenProduktForm = (produkt = null) => { setFormError(''); setEditingProdukt(produkt); setShowProduktForm(true); };
    const handleDeleteDatenproduktInitiation = (produkt) => { setProduktToDelete(produkt); setShowDeleteModal(true); };
    const confirmDeleteDatenprodukt = async () => { if (produktToDelete) { await loescheDatenprodukt(produktToDelete.id); } setShowDeleteModal(false); setProduktToDelete(null); };
    const statusOptionen = ["In Planung", "In Entwicklung", "Live", "Archiviert", "On Hold / Pausiert"];
    const handleAssignRoleSubmit = async (e) => { e.preventDefault(); setAssignmentError(''); if (!selectedProduktForAssignment || !assignPersonId || !assignRolleId) { setAssignmentError("Bitte alles auswählen."); return; } const resultId = await weisePersonDatenproduktRolleZu(assignPersonId, selectedProduktForAssignment.id, assignRolleId); if (resultId) { setAssignPersonId(''); setAssignRolleId(''); } else { setAssignmentError('Fehler. Rolle existiert evtl. schon.'); } };
    const handleRemoveRole = async (zuordnungId) => { await entfernePersonVonDatenproduktRolle(zuordnungId); };
    const getPersonName = (personId) => personen.find(p => p.id === personId)?.name || 'Unbekannt';
    const getRolleName = (rolleId) => rollen.find(r => r.id === rolleId)?.name || 'Unbekannt';

    if (loading) return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
    if (error) return <p className="text-center text-red-500 py-8">{error}</p>; 

    return ( <div className="container mx-auto px-4 py-8"><div className="flex flex-wrap justify-between items-center mb-8 gap-4"><h1 className="text-3xl font-bold text-gray-800">Datenproduktverwaltung</h1><button onClick={() => handleOpenProduktForm()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md">+ Neues Datenprodukt</button></div>{showProduktForm && ( <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-40 p-4" onClick={() => {setShowProduktForm(false); setEditingProdukt(null);}}><div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}><form onSubmit={handleProduktFormSubmit} className="space-y-4"><h2 className="text-2xl font-semibold mb-4">{editingProdukt ? 'Datenprodukt bearbeiten' : 'Neues Datenprodukt erstellen'}</h2>{formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}<div><label htmlFor="dp-form-name" className="block text-sm font-medium">Name</label><input id="dp-form-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md"/></div><div><label htmlFor="dp-form-beschreibung" className="block text-sm font-medium">Beschreibung</label><textarea id="dp-form-beschreibung" value={beschreibung} onChange={e => setBeschreibung(e.target.value)} rows="3" className="mt-1 block w-full px-3 py-2 border rounded-md"></textarea></div><div><label htmlFor="dp-form-status" className="block text-sm font-medium">Status</label><select id="dp-form-status" value={status} onChange={e => setStatus(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md">{statusOptionen.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div><div className="flex justify-end space-x-3 pt-3"><button type="button" onClick={() => {setShowProduktForm(false); setEditingProdukt(null);}} className="px-4 py-2 border rounded-md">Abbrechen</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm">{editingProdukt ? 'Speichern' : 'Erstellen'}</button></div></form></div></div> )}<ConfirmModal isOpen={showDeleteModal} title="Datenprodukt löschen" message={`Möchten Sie "${produktToDelete?.name}" wirklich löschen?`} onConfirm={confirmDeleteDatenprodukt} onCancel={() => setShowDeleteModal(false)} />{datenprodukte.length === 0 && !loading && <p className="text-center text-gray-500 py-8">Noch keine Datenprodukte erfasst.</p>}<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{datenprodukte.map(dp => ( <div key={dp.id} className="bg-white shadow-lg rounded-xl p-6 flex flex-col justify-between"><div><h3 className="text-xl font-bold text-indigo-700 mb-2 break-words">{dp.name}</h3><p className="text-gray-600 text-sm mb-1">Status: <span className="font-semibold">{dp.status}</span></p><p className="text-gray-600 text-sm mb-3 line-clamp-3" title={dp.beschreibung}>{dp.beschreibung || "Keine Beschreibung"}</p><p className="text-xs text-gray-400 mb-3">Erstellt: {new Date(dp.erstelltAm).toLocaleDateString()}</p><div className="mb-3"><h4 className="text-sm font-semibold text-gray-700 mb-1">Team:</h4>{zuordnungen.filter(z => z.datenproduktId === dp.id).length > 0 ? ( <ul className="list-none space-y-1">{zuordnungen.filter(z => z.datenproduktId === dp.id).map(zuordnung => ( <li key={zuordnung.id} className="text-xs bg-gray-100 p-2 rounded-md flex justify-between items-center"><span>{getPersonName(zuordnung.personId)} ({getRolleName(zuordnung.rolleId)})</span><button onClick={() => handleRemoveRole(zuordnung.id)} className="text-red-400 hover:text-red-600 ml-2" title="Zuweisung entfernen">&times;</button></li> ))}</ul> ) : ( <p className="text-xs text-gray-500">Noch kein Team zugewiesen.</p> )}</div></div><div className="mt-auto pt-4 border-t flex flex-wrap gap-2 justify-end"><button onClick={() => {setSelectedProduktForAssignment(dp); setAssignmentError('');}} className="text-sm text-green-600 hover:text-green-800">Team zuweisen</button><button onClick={() => handleOpenProduktForm(dp)} className="text-sm text-indigo-600 hover:text-indigo-800">Bearbeiten</button><button onClick={() => handleDeleteDatenproduktInitiation(dp)} className="text-sm text-red-500 hover:text-red-700">Löschen</button></div></div> ))}</div>{selectedProduktForAssignment && ( <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={() => setSelectedProduktForAssignment(null)}><div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}><h3 className="text-xl font-semibold mb-4">Team für "{selectedProduktForAssignment.name}" verwalten</h3>{assignmentError && <p className="text-red-500 text-sm mb-3">{assignmentError}</p>}<form onSubmit={handleAssignRoleSubmit} className="space-y-4"><div><label htmlFor="assign-person" className="block text-sm font-medium">Person</label><select id="assign-person" value={assignPersonId} onChange={e => setAssignPersonId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md"><option value="">Person auswählen</option>{personen.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div><label htmlFor="assign-role" className="block text-sm font-medium">Rolle</label><select id="assign-role" value={assignRolleId} onChange={e => setAssignRolleId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md"><option value="">Rolle auswählen</option>{rollen.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div><div className="flex justify-end space-x-3 pt-3"><button type="button" onClick={() => setSelectedProduktForAssignment(null)} className="px-4 py-2 border rounded-md">Abbrechen</button><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">Zuweisen</button></div></form></div></div> )}</div> );
};

const Auswertungen = () => {
    const { personen, zuordnungen, datenprodukte, rollen, loading, error } = useData();
    if (loading) return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
    if (error) return <p className="text-center text-red-500 py-8">{error}</p>;
    const personenAuslastung = personen.map(person => {
        const personAssignments = zuordnungen.filter(z => z.personId === person.id);
        const uniqueDatenproduktIds = [...new Set(personAssignments.map(z => z.datenproduktId))];
        const produktDetails = uniqueDatenproduktIds.map(dpId => {
            const produkt = datenprodukte.find(dp => dp.id === dpId);
            const rollenInProdukt = personAssignments.filter(pa => pa.datenproduktId === dpId).map(pa => rollen.find(r => r.id === pa.rolleId)?.name).filter(Boolean).join(', ');
            return { name: produkt ? produkt.name : '...', rollen: rollenInProdukt || 'N/A' };
        }).filter(p => p.name !== '...');
        return { id: person.id, name: person.name, email: person.email, anzahlProdukte: uniqueDatenproduktIds.length, produktDetails: produktDetails };
    });

    return ( <div className="container mx-auto px-4 py-8"><h1 className="text-3xl font-bold text-gray-800 mb-8">Auswertungen: Team-Auslastung</h1>{personenAuslastung.length > 0 ? ( <div className="overflow-x-auto bg-white shadow-md rounded-lg"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-Mail</th><th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Anzahl Produkte</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zugeordnete Produkte (Rollen)</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{personenAuslastung.map((person, index) => ( <tr key={person.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{person.anzahlProdukte > 3 && <span className="text-red-500 mr-1">❗️</span>}{person.name}</td><td className="px-6 py-4 whitespace-nowrap text-sm">{person.email}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-center">{person.anzahlProdukte}</td><td className="px-6 py-4 text-sm"><ul className="list-none space-y-1">{person.produktDetails.map((pd, idx) => ( <li key={idx} className="text-xs"><strong>{pd.name}</strong> ({pd.rollen})</li> ))}</ul></td></tr> ))}</tbody></table></div> ) : ( <p className="text-center text-gray-500">Keine Daten für eine Auswertung vorhanden.</p> )}</div> );
};

const AppFooter = ({ user }) => ( <footer className="bg-white shadow-inner mt-auto py-4 text-center">{user && (<div className="mb-2 text-sm text-gray-600">Angemeldet als: <span className="font-semibold">{user.email}</span></div>)}<p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Dein Datenprodukt Planungs-Tool</p></footer> );

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  useEffect(() => { const unsubscribe = onAuthStateChanged(auth, (user) => { setUser(user); setAuthLoading(false); }); return () => unsubscribe(); }, []);
  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div></div>;
  return ( <> {!user ? <AuthPage /> : <DataProvider><MainAppContent user={user} /></DataProvider>} </> );
}

const MainAppContent = ({ user }) => {
  const [currentPage, setCurrentPage] = useState('personen'); 
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const handleLogout = async () => { try { await signOut(auth); } catch (error) { console.error("Logout Error:", error); }};
  const NavLink = ({ pageName, children }) => ( <button onClick={() => setCurrentPage(pageName)} className={`px-3 py-2 rounded-md text-sm font-medium ${currentPage === pageName ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-indigo-100'}`}> {children} </button> );

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <header className="bg-white shadow-md sticky top-0 z-30">
        <nav className="container mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
          <div className="text-xl sm:text-2xl font-bold text-indigo-700">Datenprodukt Planer</div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <NavLink pageName="personen">Personen</NavLink>
            <NavLink pageName="datenprodukte">Datenprodukte</NavLink>
            <NavLink pageName="auswertungen">Auswertungen</NavLink>
            <button onClick={() => setShowChangePasswordModal(true)} className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100" title="Passwort ändern">Passwort ändern</button>
            <button onClick={handleLogout} className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-100" title="Abmelden">Logout</button>
          </div>
        </nav>
      </header>
      <main className="py-4 flex-grow">
        {currentPage === 'personen' && <PersonenVerwaltung />}
        {currentPage === 'datenprodukte' && <DatenproduktVerwaltung />}
        {currentPage === 'auswertungen' && <Auswertungen />}
      </main>
      <AppFooter user={user} /> 
      <ChangePasswordModal isOpen={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} />
    </div>
  );
}

export default App;
