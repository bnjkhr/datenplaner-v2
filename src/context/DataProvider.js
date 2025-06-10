// src/context/DataProvider.js
import React, { useState, createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { db, appId } from '../firebase/config';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch
} from 'firebase/firestore';

export const DataContext = createContext();
export const useData = () => useContext(DataContext);

// Diese Liste dient jetzt als Vorlage für die erstmalige Befüllung der Datenbank.
const initialRollenSeed = [
  { name: 'Datenprodukt-Owner (DPO)' },
  { name: 'Facilitator' },
  { name: 'Transparenzmeister:in' },
  { name: 'Link Domäne Gremien' },
  { name: 'Link Medienforschung (Optional)' },
  { name: 'Datenprodukt-Engineer (Data-Engineer)' },
  { name: 'Daten-Analyst' },
  { name: 'Link M13-Data-Plattform' },
  { name: 'Data-Contract Expert:in' },
  { name: 'Projektmanager:in' },
  { name: 'Pate M13-Kernteam' }
];

export const DataProvider = ({ children }) => {
  const [personen, setPersonen] = useState([]);
  const [datenprodukte, setDatenprodukte] = useState([]);
  const [rollen, setRollen] = useState([]);
  const [zuordnungen, setZuordnungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const hasSeededRoles = useRef(false);

  const sharedDataPath = `/artifacts/${appId}/public/data`;
  const getPersonenCollectionPath = useCallback(() => `${sharedDataPath}/personen`, []);
  const getDatenprodukteCollectionPath = useCallback(() => `${sharedDataPath}/datenprodukte`, []);
  const getZuordnungenCollectionPath = useCallback(() => `${sharedDataPath}/zuordnungen`, []);
  const getRollenCollectionPath = useCallback(() => `${sharedDataPath}/rollen`, []);

  // Effekt, der die initialen Rollen in die DB schreibt, falls sie leer ist
  useEffect(() => {
    if (hasSeededRoles.current) return;
    
    const rollenCollectionRef = collection(db, getRollenCollectionPath());

    const seedRoles = async () => {
      const snapshot = await getDocs(rollenCollectionRef);
      if (snapshot.empty) {
        console.log("Rollen-Kollektion ist leer, fülle sie mit initialen Daten...");
        const batch = writeBatch(db);
        initialRollenSeed.forEach(rolle => {
          const docRef = doc(rollenCollectionRef);
          batch.set(docRef, rolle);
        });
        await batch.commit();
        console.log("Initiale Rollen wurden erfolgreich in die Datenbank geschrieben.");
      }
      hasSeededRoles.current = true;
    };

    seedRoles().catch(console.error);
  }, [getRollenCollectionPath]);


  // Firestore Listeners
  useEffect(() => {
    setLoading(true);
    setError(null); 
    const unsubscribes = [];
    let loadedCount = 0;
    const totalCollections = 4;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === totalCollections) {
        setLoading(false);
      }
    };

    const setupListener = (path, setter) => {
      const q = query(collection(db, path));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        checkAllLoaded();
      }, (err) => {
        console.error(`Error at ${path}:`, err);
        setError(`Fehler beim Laden von Daten. Firestore-Regeln prüfen.`);
        setLoading(false);
      });
      unsubscribes.push(unsubscribe);
    };

    // --- GEÄNDERT: Eigener Listener für Rollen, um die Sortierung zu garantieren ---
    const setupRollenListener = () => {
        const q = query(collection(db, getRollenCollectionPath()));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Alphabetische Sortierung nach dem Namen
            data.sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));
            setRollen(data);
            checkAllLoaded();
        }, (err) => {
            console.error(`Error at ${getRollenCollectionPath()}:`, err);
            setError(`Fehler beim Laden von Daten. Firestore-Regeln prüfen.`);
            setLoading(false);
        });
        unsubscribes.push(unsubscribe);
    };


    setupListener(getPersonenCollectionPath(), setPersonen);
    setupListener(getDatenprodukteCollectionPath(), setDatenprodukte);
    setupListener(getZuordnungenCollectionPath(), setZuordnungen);
    setupRollenListener(); // Der neue, spezielle Listener für Rollen

    return () => unsubscribes.forEach(unsub => unsub());
  }, [getPersonenCollectionPath, getDatenprodukteCollectionPath, getZuordnungenCollectionPath, getRollenCollectionPath]);

  // --- CRUD-Funktionen für Rollen ---
  const fuegeRolleHinzu = async (rollenName) => {
    if (!rollenName || !rollenName.trim()) return null;
    try {
      const docRef = await addDoc(collection(db, getRollenCollectionPath()), { name: rollenName.trim() });
      return docRef.id;
    } catch (e) { console.error("Error adding role: ", e); setError("Fehler beim Hinzufügen der Rolle."); return null; }
  };

  const aktualisiereRolle = async (rolleId, rollenName) => {
    if (!rollenName || !rollenName.trim()) return false;
    try {
      const rolleDocRef = doc(db, getRollenCollectionPath(), rolleId);
      await updateDoc(rolleDocRef, { name: rollenName.trim() });
      return true;
    } catch (e) { console.error("Error updating role: ", e); setError("Fehler beim Aktualisieren der Rolle."); return false; }
  };

  const loescheRolle = async (rolleId) => {
    const isRoleInUse = zuordnungen.some(z => z.rolleId === rolleId);
    if (isRoleInUse) {
        setError("Diese Rolle wird noch verwendet und kann nicht gelöscht werden.");
        setTimeout(() => setError(null), 3000); // Fehler nach 3s ausblenden
        return false;
    }
    try {
      await deleteDoc(doc(db, getRollenCollectionPath(), rolleId));
      return true;
    } catch (e) { console.error("Error deleting role: ", e); setError("Fehler beim Löschen der Rolle."); return false; }
  };

  // --- CRUD-Funktionen für Zuweisungen (mit besserem Error-Handling) ---
  const weisePersonDatenproduktRolleZu = async (personId, produktId, rolleId) => {
    setError(null); 
    const existingAssignment = zuordnungen.find(
        z => z.personId === personId && z.datenproduktId === produktId && z.rolleId === rolleId
    );
    if (existingAssignment) {
        console.warn("Assignment already exists:", personId, produktId, rolleId);
        setError("Diese Person hat diese Rolle in diesem Datenprodukt bereits.");
        setTimeout(() => setError(null), 3000);
        return null;
    }
    try {
        const docRef = await addDoc(collection(db, getZuordnungenCollectionPath()), {
            personId, datenproduktId: produktId, rolleId, erstelltAm: new Date().toISOString(),
        });
        return docRef.id;
    } catch (e) { 
        console.error("Error assigning role: ", e); 
        setError("Fehler bei der Rollenzuweisung. Bitte die Konsole prüfen."); 
        return null; 
    }
  };

  const entfernePersonVonDatenproduktRolle = async (zuordnungId) => {
    try {
        await deleteDoc(doc(db, getZuordnungenCollectionPath(), zuordnungId));
        return true;
    } catch (e) { console.error("Error removing role assignment: ", e); setError("Fehler beim Entfernen der Rollenzuweisung."); return false; }
  };

  // --- Bestehende CRUD-Funktionen (bleiben unverändert) ---
  const fuegePersonHinzu = async (personDaten) => { /* ... */ };
  const aktualisierePerson = async (personId, neueDaten) => { /* ... */ };
  const loeschePerson = async (personId) => { /* ... */ };
  const erstelleDatenprodukt = async (produktDaten) => { /* ... */ };
  const aktualisiereDatenprodukt = async (produktId, neueDaten) => { /* ... */ };
  const loescheDatenprodukt = async (produktId) => { /* ... */ };
  
  return (
    <DataContext.Provider value={{
      personen, datenprodukte, rollen, zuordnungen,
      fuegePersonHinzu, aktualisierePerson, loeschePerson,
      erstelleDatenprodukt, aktualisiereDatenprodukt, loescheDatenprodukt,
      weisePersonDatenproduktRolleZu, entfernePersonVonDatenproduktRolle,
      fuegeRolleHinzu, aktualisiereRolle, loescheRolle,
      loading, error,
    }}>
      {children}
    </DataContext.Provider>
  );
};
