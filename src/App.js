import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
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
  setDoc,
  query,
  where,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid'; // For unique IDs

// --- Tailwind CSS ---
// Make sure Tailwind is included in your project, e.g., via CDN in index.html:
// <script src="https://cdn.tailwindcss.com"></script>

// --- !!! WICHTIG: Passwort für den einfachen Zugriffsschutz !!! ---
// Dieses Passwort ist im Quellcode sichtbar und bietet KEINE hohe Sicherheit.
// Für echte Sicherheit ist eine serverseitige Authentifizierung nötig.
const APP_PASSWORD = "Modul13!"; // ÄNDERE DIESES PASSWORT!

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDNdCSEHHveLZloWrdrgq4zqgi8DUR72RE",
  authDomain: "datenprodukt-planer-app.firebaseapp.com",
  projectId: "datenprodukt-planer-app",
  storageBucket: "datenprodukt-planer-app.firebasestorage.app",
  messagingSenderId: "32250523439",
  appId: "1:32250523439:web:3bafa128b7758f36253bda",
  measurementId: "G-CEV457PXY1"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-data-product-app';

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Data Context ---
const DataContext = createContext();

export const useData = () => useContext(DataContext);

// Initial roles as defined by the user
const initialRollen = [
  { id: 'rolle1', name: 'Datenprodukt-Owner (DPO)' },
  { id: 'rolle2', name: 'Facilitator' },
  { id: 'rolle3', name: 'Transparenzmeister:in' },
  { id: 'rolle4', name: 'Link Domäne Gremien' },
  { id: 'rolle5', name: 'Link Medienforschung (Optional)' },
  { id: 'rolle6', name: 'Datenprodukt-Engineer (Data-Engineer)' },
  { id: 'rolle7', name: 'Daten-Analyst' },
  { id: 'rolle8', name: 'Link M13-Data-Plattform' },
  { id: 'rolle9', name: 'Data-Contract Expert:in' },
  { id: 'rolle10', name: 'Projektmanager:in' },
  { id: 'rolle11', name: 'Pate M13-Kernteam' }
];

const DataProvider = ({ children }) => {
  const [personen, setPersonen] = useState([]);
  const [datenprodukte, setDatenprodukte] = useState([]);
  const [rollen, setRollen] = useState(initialRollen);
  const [zuordnungen, setZuordnungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Define collection paths using useCallback to stabilize them if currentUserId changes
  const getPersonenCollectionPath = useCallback(() => `/artifacts/${appId}/users/${currentUserId}/personen`, [currentUserId]);
  const getDatenprodukteCollectionPath = useCallback(() => `/artifacts/${appId}/users/${currentUserId}/datenprodukte`, [currentUserId]);
  const getZuordnungenCollectionPath = useCallback(() => `/artifacts/${appId}/users/${currentUserId}/zuordnungen`, [currentUserId]);


  // --- Firebase Auth ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        setIsAuthReady(true);
      } else {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (authError) {
          console.error("Error signing in: ", authError);
          setError("Authentication failed: " + (authError.message || "Unknown auth error"));
          setIsAuthReady(true); 
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);


  // --- Firestore Listeners ---
  useEffect(() => {
    if (!isAuthReady || !currentUserId) {
      setLoading(false); 
      setPersonen([]);
      setDatenprodukte([]);
      setZuordnungen([]);
      return;
    }

    setLoading(true);
    setError(null); 

    const personenPath = getPersonenCollectionPath();
    const datenproduktePath = getDatenprodukteCollectionPath();
    const zuordnungenPath = getZuordnungenCollectionPath();

    let personenLoaded = false;
    let datenprodukteLoaded = false;
    let zuordnungenLoaded = false;

    const checkAllLoaded = () => {
        if(personenLoaded && datenprodukteLoaded && zuordnungenLoaded) {
            setLoading(false);
        }
    }

    const unsubscribePersonen = onSnapshot(query(collection(db, personenPath)), (snapshot) => {
      const personenData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPersonen(personenData);
      personenLoaded = true;
      checkAllLoaded();
    }, (err) => {
      console.error("Error fetching personen: ", err);
      setError("Error fetching personen: " + err.message);
      personenLoaded = true; 
      checkAllLoaded();
    });

    const unsubscribeDatenprodukte = onSnapshot(query(collection(db, datenproduktePath)), (snapshot) => {
        const datenprodukteData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDatenprodukte(datenprodukteData);
        datenprodukteLoaded = true;
        checkAllLoaded();
    }, (err) => {
        console.error("Error fetching datenprodukte: ", err);
        setError("Error fetching datenprodukte: " + err.message);
        datenprodukteLoaded = true;
        checkAllLoaded();
    });

    const unsubscribeZuordnungen = onSnapshot(query(collection(db, zuordnungenPath)), (snapshot) => {
        const zuordnungenData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setZuordnungen(zuordnungenData);
        zuordnungenLoaded = true;
        checkAllLoaded();
    }, (err) => {
        console.error("Error fetching zuordnungen: ", err);
        setError("Error fetching zuordnungen: " + err.message);
        zuordnungenLoaded = true;
        checkAllLoaded();
    });

    return () => {
      unsubscribePersonen();
      unsubscribeDatenprodukte();
      unsubscribeZuordnungen();
    };
  }, [isAuthReady, currentUserId, getPersonenCollectionPath, getDatenprodukteCollectionPath, getZuordnungenCollectionPath]);


  // --- Personen CRUD ---
  const fuegePersonHinzu = async (personDaten) => {
    if (!currentUserId) {
        setError("Cannot add person: User not authenticated.");
        return null;
    }
    try {
      const docRef = await addDoc(collection(db, getPersonenCollectionPath()), {
        ...personDaten,
        erstelltAm: new Date().toISOString(),
        letzteAenderung: new Date().toISOString(),
      });
      return docRef.id;
    } catch (e) {
      console.error("Error adding document: ", e);
      setError("Error adding person: " + e.message);
      return null;
    }
  };

  const aktualisierePerson = async (personId, neueDaten) => {
     if (!currentUserId) {
        setError("Cannot update person: User not authenticated.");
        return false;
    }
    try {
      const personDocRef = doc(db, getPersonenCollectionPath(), personId);
      await updateDoc(personDocRef, {
        ...neueDaten,
        letzteAenderung: new Date().toISOString(),
      });
      return true;
    } catch (e) {
      console.error("Error updating document: ", e);
      setError("Error updating person: " + e.message);
      return false;
    }
  };

  const loeschePerson = async (personId) => {
    if (!currentUserId) {
        setError("Cannot delete person: User not authenticated.");
        return false;
    }
    try {
      const assignmentsQuery = query(collection(db, getZuordnungenCollectionPath()), where("personId", "==", personId));
      const assignmentSnapshot = await getDocs(assignmentsQuery);
      const batch = []; 
      assignmentSnapshot.forEach(doc => {
          batch.push(deleteDoc(doc.ref));
      });
      await Promise.all(batch);

      await deleteDoc(doc(db, getPersonenCollectionPath(), personId));
      return true;
    } catch (e) {
      console.error("Error deleting person or their assignments: ", e);
      setError("Error deleting person: " + e.message);
      return false;
    }
  };

  // --- Datenprodukte CRUD ---
  const erstelleDatenprodukt = async (produktDaten) => {
    if (!currentUserId) {
        setError("Cannot add datenprodukt: User not authenticated.");
        return null;
    }
    try {
        const docRef = await addDoc(collection(db, getDatenprodukteCollectionPath()), {
            ...produktDaten,
            erstelltAm: new Date().toISOString(),
            letzteAenderung: new Date().toISOString(),
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding Datenprodukt: ", e);
        setError("Error adding Datenprodukt: " + e.message);
        return null;
    }
  };
  
  const aktualisiereDatenprodukt = async (produktId, neueDaten) => {
    if (!currentUserId) {
        setError("Cannot update datenprodukt: User not authenticated.");
        return false;
    }
    try {
        const produktDocRef = doc(db, getDatenprodukteCollectionPath(), produktId);
        await updateDoc(produktDocRef, {
            ...neueDaten,
            letzteAenderung: new Date().toISOString(),
        });
        return true;
    } catch (e) {
        console.error("Error updating Datenprodukt: ", e);
        setError("Error updating Datenprodukt: " + e.message);
        return false;
    }
  };

  const loescheDatenprodukt = async (produktId) => {
    if (!currentUserId) {
        setError("Cannot delete datenprodukt: User not authenticated.");
        return false;
    }
    try {
        const assignmentsQuery = query(collection(db, getZuordnungenCollectionPath()), where("datenproduktId", "==", produktId));
        const assignmentSnapshot = await getDocs(assignmentsQuery);
        const batch = [];
        assignmentSnapshot.forEach(doc => {
            batch.push(deleteDoc(doc.ref));
        });
        await Promise.all(batch);
        
        await deleteDoc(doc(db, getDatenprodukteCollectionPath(), produktId));
        return true;
    } catch (e) {
        console.error("Error deleting Datenprodukt or its assignments: ", e);
        setError("Error deleting Datenprodukt: " + e.message);
        return false;
    }
  };

  // --- Zuordnungen CRUD ---
  const weisePersonDatenproduktRolleZu = async (personId, produktId, rolleId) => {
    if (!currentUserId) {
        setError("Cannot assign role: User not authenticated.");
        return null;
    }
    const existingAssignment = zuordnungen.find(
        z => z.personId === personId && z.datenproduktId === produktId && z.rolleId === rolleId
    );
    if (existingAssignment) {
        console.warn("Assignment already exists:", personId, produktId, rolleId);
        return existingAssignment.id; 
    }

    try {
        const docRef = await addDoc(collection(db, getZuordnungenCollectionPath()), {
            personId,
            datenproduktId: produktId, 
            rolleId,
            erstelltAm: new Date().toISOString(),
        });
        return docRef.id;
    } catch (e) {
        console.error("Error assigning role: ", e);
        setError("Error assigning role: " + e.message);
        return null;
    }
  };

  const entfernePersonVonDatenproduktRolle = async (zuordnungId) => {
    if (!currentUserId) {
        setError("Cannot remove role assignment: User not authenticated.");
        return false;
    }
    try {
        await deleteDoc(doc(db, getZuordnungenCollectionPath(), zuordnungId));
        return true;
    } catch (e) {
        console.error("Error removing role assignment: ", e);
        setError("Error removing role assignment: " + e.message);
        return false;
    }
  };


  return (
    <DataContext.Provider value={{
      personen,
      datenprodukte,
      rollen,
      zuordnungen,
      fuegePersonHinzu,
      aktualisierePerson,
      loeschePerson,
      erstelleDatenprodukt,
      aktualisiereDatenprodukt,
      loescheDatenprodukt,
      weisePersonDatenproduktRolleZu,
      entfernePersonVonDatenproduktRolle,
      loading,
      error,
      currentUserId,
      isAuthReady
    }}>
      {children}
    </DataContext.Provider>
  );
};

// --- UI Components ---

// LoginScreen Component
const LoginScreen = ({ onLoginSuccess }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === APP_PASSWORD) {
            setError('');
            onLoginSuccess();
        } else {
            setError('Falsches Passwort. Bitte erneut versuchen.');
            setPassword('');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                <h1 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Datenprodukt Planer</h1>
                <p className="text-gray-600 mb-6 text-center">Bitte gib das Passwort ein, um auf das Tool zuzugreifen.</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="app-password" className="block text-sm font-medium text-gray-700 sr-only">
                            Passwort
                        </label>
                        <input
                            id="app-password"
                            name="app-password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Passwort"
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            Anmelden
                        </button>
                    </div>
                </form>
                <p className="mt-8 text-xs text-gray-500 text-center">
                    Hinweis: Dies ist ein einfacher Zugriffsschutz. Das Passwort ist im Quellcode hinterlegt.
                </p>
            </div>
        </div>
    );
};


// ConfirmModal.js
const ConfirmModal = ({ isOpen, message, onConfirm, onCancel, confirmText = "Löschen", cancelText = "Abbrechen", title = "Bestätigung" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50 p-4">
            <div className="relative p-6 bg-white w-full max-w-md m-auto flex-col flex rounded-lg shadow-xl">
                <h3 className="text-xl font-semibold mb-4">{title}</h3>
                <div className="text-md mb-6">{message}</div>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};


// TagInput.js
const TagInput = ({ tags, setTags, placeholder = "Add a skill" }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim() !== '') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md min-h-[40px]">
        {tags.map(tag => (
          <span key={tag} className="bg-blue-500 text-white px-2 py-1 rounded-full text-sm flex items-center">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-2 text-xs text-blue-100 hover:text-white focus:outline-none"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-grow p-1 outline-none text-sm"
        />
      </div>
    </div>
  );
};


// PersonFormular.js
const PersonFormular = ({ personToEdit, onFormClose }) => {
  const { fuegePersonHinzu, aktualisierePerson } = useData();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [skills, setSkills] = useState([]);
  const [msTeamsEmail, setMsTeamsEmail] = useState(''); 
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (personToEdit) {
      setName(personToEdit.name || '');
      setEmail(personToEdit.email || '');
      setSkills(personToEdit.skills || []);
      const teamsLink = personToEdit.msTeamsLink || '';
      const emailMatch = teamsLink.match(/users=([^&]+)/);
      setMsTeamsEmail(emailMatch ? emailMatch[1] : (personToEdit.email || ''));
    } else {
      setName('');
      setEmail('');
      setSkills([]);
      setMsTeamsEmail('');
    }
  }, [personToEdit]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!name.trim() || !email.trim()) {
      setFormError('Name und E-Mail sind Pflichtfelder.');
      return;
    }

    const finalMsTeamsLink = msTeamsEmail.trim() 
      ? `msteams:/l/chat/0/0?users=${msTeamsEmail.trim()}` 
      : '';

    const personData = { 
      name: name.trim(), 
      email: email.trim(), 
      skills, 
      msTeamsLink: finalMsTeamsLink 
    };

    let success = false;
    if (personToEdit && personToEdit.id) {
      success = await aktualisierePerson(personToEdit.id, personData);
    } else {
      const newId = await fuegePersonHinzu(personData);
      success = !!newId;
    }

    if (success) {
      if (!personToEdit) { 
        setName('');
        setEmail('');
        setSkills([]);
        setMsTeamsEmail('');
      }
      if (onFormClose) onFormClose();
    } else {
      setFormError('Fehler beim Speichern der Person. Bitte prüfen Sie die Konsole für Details.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">
        {personToEdit ? 'Person bearbeiten' : 'Neue Person hinzufügen'}
      </h2>
      {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}
      <div>
        <label htmlFor="person-name" className="block text-sm font-medium text-gray-700">Name</label>
        <input
          id="person-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Max Mustermann"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="person-email" className="block text-sm font-medium text-gray-700">E-Mail</label>
        <input
          id="person-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="max.mustermann@firma.de"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="msTeamsEmail" className="block text-sm font-medium text-gray-700">MS Teams E-Mail (für Chat-Link)</label>
        <input
          id="msTeamsEmail"
          type="email" 
          value={msTeamsEmail}
          onChange={e => setMsTeamsEmail(e.target.value)}
          placeholder="max.mustermann@firma.de (für Teams Link)"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
         <p className="mt-1 text-xs text-gray-500">Aus dieser E-Mail wird der MS Teams Chat-Link generiert.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Skills</label>
        <TagInput tags={skills} setTags={setSkills} placeholder="Skill hinzufügen und Enter drücken" />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        {onFormClose && (
          <button
            type="button"
            onClick={onFormClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Abbrechen
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {personToEdit ? 'Änderungen speichern' : 'Person hinzufügen'}
        </button>
      </div>
    </form>
  );
};

// PersonEintrag.js
const PersonEintrag = ({ person, onEdit, onDeleteInitiation, onSkillClick }) => {
  const { name, email, skills, msTeamsLink } = person; 
  const { datenprodukte, zuordnungen, rollen } = useData();

  const getPersonAssignments = () => {
    if (!datenprodukte || !zuordnungen || !rollen) return [];
    
    return zuordnungen
      .filter(z => z.personId === person.id)
      .map(assignment => {
        const produkt = datenprodukte.find(dp => dp.id === assignment.datenproduktId);
        const rolleInProdukt = rollen.find(r => r.id === assignment.rolleId);
        return {
          produktName: produkt ? produkt.name : 'Unbekanntes Produkt',
          rolleName: rolleInProdukt ? rolleInProdukt.name : 'Unbekannte Rolle',
          assignmentId: assignment.id,
        };
      })
      .filter(a => a.produktName !== 'Unbekanntes Produkt'); 
  };

  const personAssignments = getPersonAssignments();

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl transition-shadow duration-300 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-indigo-700 break-words mr-2">{name}</h3>
            {msTeamsLink && (
            <a
                href={msTeamsLink} 
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 hover:text-indigo-700 transition-colors flex-shrink-0 text-2xl" 
                title="Chat in MS Teams starten"
            >
                💬
            </a>
            )}
        </div>
        {email && (
            <div className="mb-3">
                <a href={`mailto:${email}`} className="text-sm text-gray-500 hover:text-indigo-600 break-all" title={`E-Mail an ${name} senden`}>
                    {email}
                </a>
            </div>
        )}
        {skills && skills.length > 0 && (
            <div className="mb-4">
            <p className="text-sm font-medium text-gray-600 mb-1">Skills:</p>
            <div className="flex flex-wrap gap-2">
                {skills.map(skill => (
                <button 
                    key={skill} 
                    onClick={() => onSkillClick(skill)}
                    className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium hover:bg-indigo-200 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    title={`Nach Personen mit Skill "${skill}" filtern`}
                >
                    {skill}
                </button>
                ))}
            </div>
            </div>
        )}
         {personAssignments.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-600 mb-1">Arbeitet an:</p>
            <ul className="list-none space-y-1">
              {personAssignments.map(assignment => (
                <li key={assignment.assignmentId} className="text-xs text-gray-700 bg-indigo-50 p-2 rounded-md">
                  <strong>{assignment.produktName}</strong> ({assignment.rolleName})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="mt-auto pt-4 flex justify-end space-x-3 border-t border-gray-200">
        <button
          onClick={() => onEdit(person)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Bearbeiten
        </button>
        <button
          onClick={() => onDeleteInitiation(person)}
          className="text-sm text-red-500 hover:text-red-700 font-medium"
        >
          Löschen
        </button>
      </div>
    </div>
  );
};

// PersonenListe.js
const PersonenListe = ({ personenToDisplay, onEditPerson, onDeleteInitiation, onSkillClick }) => {
  const { loading, error, isAuthReady } = useData(); 

  if (!isAuthReady || loading) return <div className="flex justify-center items-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div><p className="ml-3 text-gray-500">Lade Personen...</p></div>;
  if (error) return <p className="text-center text-red-500 py-8">Fehler: {error}</p>;
  if (personenToDisplay.length === 0) return <p className="text-center text-gray-500 py-8">Keine Personen entsprechen den Filterkriterien oder es wurden noch keine Personen erfasst.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
      {personenToDisplay.map(person => (
        <PersonEintrag
          key={person.id}
          person={person}
          onEdit={onEditPerson}
          onDeleteInitiation={onDeleteInitiation}
          onSkillClick={onSkillClick} 
        />
      ))}
    </div>
  );
};


// Main Components for different views/pages

const PersonenVerwaltung = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const { personen, loeschePerson } = useData(); 
  const [skillSearchTerm, setSkillSearchTerm] = useState('');


  const handleAddNewPerson = () => {
    setEditingPerson(null);
    setShowForm(true);
  };

  const handleEditPerson = (person) => {
    setEditingPerson(person);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPerson(null);
  };

  const handleDeleteInitiation = (person) => {
    setPersonToDelete(person);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (personToDelete) {
      await loeschePerson(personToDelete.id);
    }
    setShowDeleteModal(false);
    setPersonToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPersonToDelete(null);
  };
  
  const handleSkillFilterChange = (event) => {
    setSkillSearchTerm(event.target.value);
  };

  const handleSkillClick = (skill) => {
    setSkillSearchTerm(skill); 
  };

  const clearSkillFilter = () => {
    setSkillSearchTerm('');
  };

  const filteredPersonen = personen.filter(person => {
    if (!skillSearchTerm) return true; 
    if (!person.skills || person.skills.length === 0) return false; 
    return person.skills.some(skill => 
        skill.toLowerCase().includes(skillSearchTerm.toLowerCase())
    );
  });


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Personenverwaltung</h1>
        <button
          onClick={handleAddNewPerson}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          + Neue Person
        </button>
      </div>
      
      <div className="mb-8 p-4 bg-white shadow rounded-lg">
        <label htmlFor="skill-search" className="block text-sm font-medium text-gray-700 mb-1">
            Nach Skill suchen:
        </label>
        <div className="flex gap-2">
            <input
                id="skill-search"
                type="text"
                placeholder="z.B. Python, Tableau..."
                value={skillSearchTerm}
                onChange={handleSkillFilterChange}
                className="flex-grow mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {skillSearchTerm && (
                <button
                    onClick={clearSkillFilter}
                    className="mt-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                >
                    Filter löschen
                </button>
            )}
        </div>
      </div>


      {showForm && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-40 p-4" onClick={handleFormClose }>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation() }>
                 <PersonFormular personToEdit={editingPerson} onFormClose={handleFormClose} />
            </div>
        </div>
      )}
      <PersonenListe 
        personenToDisplay={filteredPersonen} 
        onEditPerson={handleEditPerson} 
        onDeleteInitiation={handleDeleteInitiation}
        onSkillClick={handleSkillClick} 
      />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Person löschen"
        message={`Möchten Sie ${personToDelete?.name || 'diese Person'} wirklich löschen? Alle zugehörigen Produktzuweisungen werden ebenfalls entfernt. Dies kann nicht rückgängig gemacht werden.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

const DatenproduktVerwaltung = () => {
  const { 
    datenprodukte, erstelleDatenprodukt, aktualisiereDatenprodukt, loescheDatenprodukt, 
    loading, error, isAuthReady, personen, rollen, 
    weisePersonDatenproduktRolleZu, zuordnungen, entfernePersonVonDatenproduktRolle 
  } = useData();

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


  useEffect(() => {
    if (editingProdukt) {
        setName(editingProdukt.name);
        setBeschreibung(editingProdukt.beschreibung || ''); 
        setStatus(editingProdukt.status);
    } else {
        setName('');
        setBeschreibung('');
        setStatus('In Planung');
    }
  }, [editingProdukt]);


  const handleProduktFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) {
        setFormError("Name ist ein Pflichtfeld für Datenprodukte.");
        return;
    }
    const produktData = { name: name.trim(), beschreibung: beschreibung.trim(), status };
    
    let success;
    if (editingProdukt && editingProdukt.id) {
        success = await aktualisiereDatenprodukt(editingProdukt.id, produktData);
    } else {
        success = await erstelleDatenprodukt(produktData);
    }

    if (success) {
        setShowProduktForm(false);
        setEditingProdukt(null);
    } else {
        setFormError('Fehler beim Speichern des Datenprodukts.');
    }
  };
  
  const handleOpenProduktForm = (produkt = null) => {
    setFormError('');
    setEditingProdukt(produkt);
    setShowProduktForm(true);
  };
  
  const handleDeleteDatenproduktInitiation = (produkt) => {
    setProduktToDelete(produkt);
    setShowDeleteModal(true);
  };

  const confirmDeleteDatenprodukt = async () => {
    if (produktToDelete) {
        await loescheDatenprodukt(produktToDelete.id);
    }
    setShowDeleteModal(false);
    setProduktToDelete(null);
  };


  const statusOptionen = ["In Planung", "In Entwicklung", "Live", "Archiviert", "On Hold / Pausiert"];

  const handleAssignRoleSubmit = async (e) => {
    e.preventDefault();
    setAssignmentError('');
    if (!selectedProduktForAssignment || !assignPersonId || !assignRolleId) {
        setAssignmentError("Bitte Person und Rolle auswählen.");
        return;
    }
    const resultId = await weisePersonDatenproduktRolleZu(assignPersonId, selectedProduktForAssignment.id, assignRolleId);
    if (resultId) {
        setAssignPersonId('');
        setAssignRolleId('');
    } else {
        setAssignmentError('Fehler bei der Zuweisung. Die Person hat diese Rolle möglicherweise bereits.');
    }
  };
  
  const handleRemoveRole = async (zuordnungId) => {
    await entfernePersonVonDatenproduktRolle(zuordnungId);
  }

  const getPersonName = (personId) => personen.find(p => p.id === personId)?.name || 'Unbekannt';
  const getRolleName = (rolleId) => rollen.find(r => r.id === rolleId)?.name || 'Unbekannt';


  if (!isAuthReady || (loading && datenprodukte.length === 0)) return <div className="flex justify-center items-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div><p className="ml-3 text-gray-500">Lade Datenprodukte...</p></div>;
  if (error && !loading) return <p className="text-center text-red-500 py-8">Fehler: {error}</p>; 

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Datenproduktverwaltung</h1>
            <button onClick={() => handleOpenProduktForm()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all">
                + Neues Datenprodukt
            </button>
        </div>

        {showProduktForm && (
             <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-40 p-4" onClick={() => {setShowProduktForm(false); setEditingProdukt(null);}}>
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
                    <form onSubmit={handleProduktFormSubmit} className="space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">{editingProdukt ? 'Datenprodukt bearbeiten' : 'Neues Datenprodukt erstellen'}</h2>
                        {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
                        <div>
                            <label htmlFor="dp-form-name" className="block text-sm font-medium text-gray-700">Name</label>
                            <input id="dp-form-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                        </div>
                        <div>
                            <label htmlFor="dp-form-beschreibung" className="block text-sm font-medium text-gray-700">Beschreibung</label>
                            <textarea id="dp-form-beschreibung" value={beschreibung} onChange={e => setBeschreibung(e.target.value)} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                        </div>
                        <div>
                            <label htmlFor="dp-form-status" className="block text-sm font-medium text-gray-700">Status</label>
                            <select id="dp-form-status" value={status} onChange={e => setStatus(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                {statusOptionen.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end space-x-3 pt-3">
                            <button type="button" onClick={() => {setShowProduktForm(false); setEditingProdukt(null);}} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Abbrechen</button>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700">{editingProdukt ? 'Speichern' : 'Erstellen'}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        
        <ConfirmModal
            isOpen={showDeleteModal}
            title="Datenprodukt löschen"
            message={`Möchten Sie "${produktToDelete?.name || 'dieses Datenprodukt'}" wirklich löschen? Alle Team-Zuweisungen zu diesem Produkt werden ebenfalls entfernt.`}
            onConfirm={confirmDeleteDatenprodukt}
            onCancel={() => setShowDeleteModal(false)}
        />


        {datenprodukte.length === 0 && !loading && <p className="text-center text-gray-500 py-8">Noch keine Datenprodukte erfasst.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {datenprodukte.map(dp => (
                <div key={dp.id} className="bg-white shadow-lg rounded-xl p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-indigo-700 mb-2 break-words">{dp.name}</h3>
                        <p className="text-gray-600 text-sm mb-1">Status: <span className="font-semibold">{dp.status}</span></p>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-3" title={dp.beschreibung}>{dp.beschreibung || "Keine Beschreibung"}</p>
                        <p className="text-xs text-gray-400 mb-3">Erstellt: {new Date(dp.erstelltAm).toLocaleDateString()}</p>
                        
                        <div className="mb-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">Team:</h4>
                            {zuordnungen.filter(z => z.datenproduktId === dp.id).length > 0 ? (
                                <ul className="list-none space-y-1">
                                {zuordnungen.filter(z => z.datenproduktId === dp.id).map(zuordnung => (
                                    <li key={zuordnung.id} className="text-xs text-gray-700 bg-gray-100 p-2 rounded-md flex justify-between items-center">
                                        <span>{getPersonName(zuordnung.personId)} ({getRolleName(zuordnung.rolleId)})</span>
                                        <button onClick={() => handleRemoveRole(zuordnung.id)} className="text-red-400 hover:text-red-600 text-xs ml-2 p-0.5 focus:outline-none" title="Zuweisung entfernen">&times;</button>
                                    </li>
                                ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-gray-500">Noch kein Team zugewiesen.</p>
                            )}
                        </div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-gray-200 flex flex-wrap gap-2 justify-end">
                        <button onClick={() => {setSelectedProduktForAssignment(dp); setAssignmentError('');}} className="text-sm text-green-600 hover:text-green-800 font-medium">
                            Team zuweisen
                        </button>
                         <button onClick={() => handleOpenProduktForm(dp)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                            Bearbeiten
                        </button>
                        <button onClick={() => handleDeleteDatenproduktInitiation(dp)} className="text-sm text-red-500 hover:text-red-700 font-medium">
                            Löschen
                        </button>
                    </div>
                </div>
            ))}
        </div>
        
        {selectedProduktForAssignment && (
            <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={() => setSelectedProduktForAssignment(null)}>
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-semibold mb-4">Team für "{selectedProduktForAssignment.name}" verwalten</h3>
                    {assignmentError && <p className="text-red-500 text-sm mb-3">{assignmentError}</p>}
                    <form onSubmit={handleAssignRoleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="assign-person" className="block text-sm font-medium text-gray-700">Person</label>
                            <select id="assign-person" value={assignPersonId} onChange={e => setAssignPersonId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                <option value="">Person auswählen</option>
                                {personen.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="assign-role" className="block text-sm font-medium text-gray-700">Rolle</label>
                            <select id="assign-role" value={assignRolleId} onChange={e => setAssignRolleId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                <option value="">Rolle auswählen</option>
                                {rollen.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end space-x-3 pt-3">
                            <button type="button" onClick={() => setSelectedProduktForAssignment(null)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Abbrechen</button>
                            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700">Zuweisen</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

    </div>
  );
};

const Auswertungen = () => {
    const { personen, datenprodukte, zuordnungen, rollen, loading, error, isAuthReady } = useData();

    if (!isAuthReady || loading) return <div className="flex justify-center items-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div><p className="ml-3 text-gray-500">Lade Auswertungsdaten...</p></div>;
    if (error) return <p className="text-center text-red-500 py-8">Fehler beim Laden der Daten: {error}</p>;

    const personenAuslastung = personen.map(person => {
        const personAssignments = zuordnungen.filter(z => z.personId === person.id);
        const uniqueDatenproduktIds = [...new Set(personAssignments.map(z => z.datenproduktId))];
        
        const produktDetails = uniqueDatenproduktIds.map(dpId => {
            const produkt = datenprodukte.find(dp => dp.id === dpId);
            // Find all roles this person has in this specific product
            const rollenInProdukt = personAssignments
                .filter(pa => pa.datenproduktId === dpId)
                .map(pa => rollen.find(r => r.id === pa.rolleId)?.name)
                .filter(Boolean) // Remove undefined if role not found
                .join(', ');
            return {
                name: produkt ? produkt.name : 'Unbekanntes Produkt',
                rollen: rollenInProdukt || 'Keine Rolle zugewiesen'
            };
        }).filter(p => p.name !== 'Unbekanntes Produkt');

        return {
            id: person.id, 
            name: person.name,
            email: person.email,
            anzahlProdukte: uniqueDatenproduktIds.length,
            produktDetails: produktDetails,
        };
    });


    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Auswertungen: Team-Auslastung</h1>
            {personenAuslastung.length === 0 && <p className="text-center text-gray-500">Keine Personen oder Zuordnungen vorhanden für eine Auswertung.</p>}
            
            {personenAuslastung.length > 0 && (
                <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    E-Mail
                                </th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Anzahl Datenprodukte
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Zugeordnete Datenprodukte (Rollen)
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {personenAuslastung.map((person, index) => (
                                <tr key={person.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {person.anzahlProdukte > 3 && <span className="text-red-500 mr-1">❗️</span>}
                                        {person.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{person.anzahlProdukte}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {person.produktDetails.length > 0 ? (
                                            <ul className="list-none space-y-1">
                                                {person.produktDetails.map((pd, idx) => (
                                                    <li key={idx} className="text-xs">
                                                        <strong>{pd.name}</strong> ({pd.rollen})
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="text-xs italic">Keinen Produkten zugewiesen</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// New component for the footer content
const FooterContent = () => {
  const { currentUserId, isAuthReady, error } = useData();
  let userIdDisplay = "Authenticating...";

  if (isAuthReady) {
    if (currentUserId) {
      userIdDisplay = currentUserId;
    } else if (error && error.toLowerCase().includes("authentication failed")) { 
      userIdDisplay = "Auth Failed";
    } else { 
      userIdDisplay = "Not Authenticated";
    }
  }

  return (
    <>
      <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Dein Datenprodukt Planungs-Tool</p>
      <div className="mt-2 text-xs text-gray-400">
        User ID: <span className="font-mono">{userIdDisplay}</span>
      </div>
    </>
  );
};

// Main App Component with Password Protection
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // State for password auth

  // Function to be called on successful password entry
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    // Optional: Store a token in localStorage/sessionStorage if you want to persist login across refreshes
    // For this simple example, it resets on refresh.
  };

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // If authenticated, render the main application
  return <MainAppContent />;
}


// Renamed original App content to MainAppContent
const MainAppContent = () => {
  const [currentPage, setCurrentPage] = useState('personen'); 

  const NavLink = ({ pageName, children }) => (
    <button
      onClick={() => setCurrentPage(pageName)}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors
        ${currentPage === pageName
          ? 'bg-indigo-600 text-white shadow-md'
          : 'text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
        }`}
    >
      {children}
    </button>
  );

  return (
    <DataProvider>
      <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
        <header className="bg-white shadow-md sticky top-0 z-30">
          <nav className="container mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
            <div className="text-xl sm:text-2xl font-bold text-indigo-700">Datenprodukt Planer</div>
            <div className="flex space-x-2 sm:space-x-3">
              <NavLink pageName="personen">Personen</NavLink>
              <NavLink pageName="datenprodukte">Datenprodukte</NavLink>
              <NavLink pageName="auswertungen">Auswertungen</NavLink>
            </div>
          </nav>
        </header>

        <main className="py-4 flex-grow">
          {currentPage === 'personen' && <PersonenVerwaltung />}
          {currentPage === 'datenprodukte' && <DatenproduktVerwaltung />}
          {currentPage === 'auswertungen' && <Auswertungen />}
        </main>

        <footer className="bg-white shadow-inner mt-auto py-6 text-center">
          <FooterContent /> 
        </footer>
      </div>
    </DataProvider>
  );
}

export default App;
