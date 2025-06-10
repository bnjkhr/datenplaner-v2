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
        setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => a.name?.localeCompare(b.name)));
        checkAllLoaded();
      }, (err) => {
        console.error(`Error at ${path}:`, err);
        setError(`Fehler: ${err.code}. Stellen Sie sicher, dass Ihre Firestore-Regeln korrekt sind.`);
        setLoading(false);
      });
      unsubscribes.push(unsubscribe);
    };

    setupListener(getPersonenCollectionPath(), setPersonen);
    setupListener(getDatenprodukteCollectionPath(), setDatenprodukte);
    setupListener(getZuordnungenCollectionPath(), setZuordnungen);
    setupListener(getRollenCollectionPath(), setRollen);

    return () => unsubscribes.forEach(unsub => unsub());
  }, [getPersonenCollectionPath, getDatenprodukteCollectionPath, getZuordnungenCollectionPath, getRollenCollectionPath]);

  // --- CRUD-Funktionen mit detailliertem Error-Handling ---
  const fuegePersonHinzu = async (personDaten) => {
    try {
      const docRef = await addDoc(collection(db, getPersonenCollectionPath()), {
        ...personDaten, erstelltAm: new Date().toISOString(), letzteAenderung: new Date().toISOString(),
      });
      return docRef.id;
    } catch (e) {
      console.error("Error adding person: ", e);
      setError(`Speicherfehler: ${e.code || e.message}`);
      return null;
    }
  };

  const aktualisierePerson = async (personId, neueDaten) => {
    try {
      const personDocRef = doc(db, getPersonenCollectionPath(), personId);
      await updateDoc(personDocRef, { ...neueDaten, letzteAenderung: new Date().toISOString() });
      return true;
    } catch (e) {
      console.error("Error updating person: ", e);
      setError(`Update-Fehler: ${e.code || e.message}`);
      return false;
    }
  };
  
  const loescheRolle = async (rolleId) => {
    const isRoleInUse = zuordnungen.some(z => z.rolleId === rolleId);
    if (isRoleInUse) {
        setError("Diese Rolle wird noch verwendet und kann nicht gelöscht werden.");
        setTimeout(() => setError(null), 3000);
        return false;
    }
    try {
      await deleteDoc(doc(db, getRollenCollectionPath(), rolleId));
      return true;
    } catch (e) { console.error("Error deleting role: ", e); setError(`Löschfehler: ${e.code || e.message}`); return false; }
  };
  
  // ... (Die anderen CRUD-Funktionen sollten ähnlich angepasst werden, um e.code und e.message im Fehlerfall zu setzen)
  const loeschePerson = async (personId) => { try { const assignmentsQuery = query(collection(db, getZuordnungenCollectionPath()), where("personId", "==", personId)); const assignmentSnapshot = await getDocs(assignmentsQuery); const batch = []; assignmentSnapshot.forEach(doc => { batch.push(deleteDoc(doc.ref)); }); await Promise.all(batch); await deleteDoc(doc(db, getPersonenCollectionPath(), personId)); return true; } catch (e) { console.error("Error deleting person: ", e); setError(`Löschfehler: ${e.code || e.message}`); return false; } };
  const fuegeRolleHinzu = async (rollenName) => { if (!rollenName?.trim()) return null; try { const docRef = await addDoc(collection(db, getRollenCollectionPath()), { name: rollenName.trim() }); return docRef.id; } catch (e) { console.error("Error adding role: ", e); setError(`Speicherfehler: ${e.code || e.message}`); return null; } };
  const aktualisiereRolle = async (rolleId, rollenName) => { if (!rollenName?.trim()) return false; try { const rolleDocRef = doc(db, getRollenCollectionPath(), rolleId); await updateDoc(rolleDocRef, { name: rollenName.trim() }); return true; } catch (e) { console.error("Error updating role: ", e); setError(`Update-Fehler: ${e.code || e.message}`); return false; } };
  const erstelleDatenprodukt = async (produktDaten) => { try { const docRef = await addDoc(collection(db, getDatenprodukteCollectionPath()), { ...produktDaten, erstelltAm: new Date().toISOString(), letzteAenderung: new Date().toISOString(), }); return docRef.id; } catch (e) { console.error("Error adding datenprodukt: ", e); setError(`Speicherfehler: ${e.code || e.message}`); return null; } };
  const aktualisiereDatenprodukt = async (produktId, neueDaten) => { try { const produktDocRef = doc(db, getDatenprodukteCollectionPath(), produktId); await updateDoc(produktDocRef, { ...neueDaten, letzteAenderung: new Date().toISOString(), }); return true; } catch (e) { console.error("Error updating datenprodukt: ", e); setError(`Update-Fehler: ${e.code || e.message}`); return false; } };
  const loescheDatenprodukt = async (produktId) => { try { const assignmentsQuery = query(collection(db, getZuordnungenCollectionPath()), where("datenproduktId", "==", produktId)); const assignmentSnapshot = await getDocs(assignmentsQuery); const batch = []; assignmentSnapshot.forEach(doc => { batch.push(deleteDoc(doc.ref)); }); await Promise.all(batch); await deleteDoc(doc(db, getDatenprodukteCollectionPath(), produktId)); return true; } catch (e) { console.error("Error deleting datenprodukt: ", e); setError(`Löschfehler: ${e.code || e.message}`); return false; } };
  const weisePersonDatenproduktRolleZu = async (personId, produktId, rolleId) => { setError(null); const existingAssignment = zuordnungen.find( z => z.personId === personId && z.datenproduktId === produktId && z.rolleId === rolleId ); if (existingAssignment) { setError("Diese Person hat diese Rolle bereits."); setTimeout(() => setError(null), 3000); return null; } try { const docRef = await addDoc(collection(db, getZuordnungenCollectionPath()), { personId, datenproduktId: produktId, rolleId, erstelltAm: new Date().toISOString(), }); return docRef.id; } catch (e) { console.error("Error assigning role: ", e); setError(`Zuweisungsfehler: ${e.code || e.message}`); return null; } };
  const entfernePersonVonDatenproduktRolle = async (zuordnungId) => { try { await deleteDoc(doc(db, getZuordnungenCollectionPath(), zuordnungId)); return true; } catch (e) { console.error("Error removing role assignment: ", e); setError(`Löschfehler: ${e.code || e.message}`); return false; } };


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
