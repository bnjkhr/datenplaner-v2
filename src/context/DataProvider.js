// src/context/DataProvider.js
import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
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

export const DataProvider = ({ children }) => {
  const [personen, setPersonen] = useState([]);
  const [datenprodukte, setDatenprodukte] = useState([]);
  const [rollen, setRollen] = useState([]);
  const [skills, setSkills] = useState([]); // NEU
  const [zuordnungen, setZuordnungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sharedDataPath = `/artifacts/${appId}/public/data`;
  const getPersonenCollectionPath = useCallback(() => `${sharedDataPath}/personen`, []);
  const getDatenprodukteCollectionPath = useCallback(() => `${sharedDataPath}/datenprodukte`, []);
  const getZuordnungenCollectionPath = useCallback(() => `${sharedDataPath}/zuordnungen`, []);
  const getRollenCollectionPath = useCallback(() => `${sharedDataPath}/rollen`, []);
  const getSkillsCollectionPath = useCallback(() => `${sharedDataPath}/skills`, []); // NEU

  useEffect(() => {
    setLoading(true);
    setError(null); 
    const unsubscribes = [];
    let loadedCount = 0;
    const totalCollections = 5; // Jetzt 5: personen, datenprodukte, rollen, zuordnungen, skills

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalCollections) {
        setLoading(false);
      }
    };

    const setupListener = (path, setter) => {
      const q = query(collection(db, path));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Alphabetische Sortierung für alles außer Zuordnungen
        if (!path.includes('zuordnungen')) {
            data.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de', { sensitivity: 'base' }));
        }
        setter(data);
        checkAllLoaded();
      }, (err) => {
        console.error(`Error at ${path}:`, err);
        setError(`Fehler beim Laden von Daten.`);
        setLoading(false);
      });
      unsubscribes.push(unsubscribe);
    };

    setupListener(getPersonenCollectionPath(), setPersonen);
    setupListener(getDatenprodukteCollectionPath(), setDatenprodukte);
    setupListener(getZuordnungenCollectionPath(), setZuordnungen);
    setupListener(getRollenCollectionPath(), setRollen);
    setupListener(getSkillsCollectionPath(), setSkills); // NEU

    return () => unsubscribes.forEach(unsub => unsub());
  }, [getPersonenCollectionPath, getDatenprodukteCollectionPath, getZuordnungenCollectionPath, getRollenCollectionPath, getSkillsCollectionPath]);

  // --- CRUD-Funktionen für Skills (NEU) ---
  const fuegeSkillHinzu = async (skillName, color) => {
    if (!skillName?.trim()) return null;
    try {
      const docRef = await addDoc(collection(db, getSkillsCollectionPath()), { name: skillName.trim(), color });
      return docRef.id;
    } catch (e) { console.error("Error adding skill:", e); setError("Fehler beim Hinzufügen des Skills."); return null; }
  };

  const aktualisiereSkill = async (skillId, skillName, color) => {
    if (!skillName?.trim()) return false;
    try {
      const skillDocRef = doc(db, getSkillsCollectionPath(), skillId);
      await updateDoc(skillDocRef, { name: skillName.trim(), color });
      return true;
    } catch (e) { console.error("Error updating skill:", e); setError("Fehler beim Aktualisieren des Skills."); return false; }
  };

  const loescheSkill = async (skillId) => {
      try {
          const batch = writeBatch(db);
          batch.delete(doc(db, getSkillsCollectionPath(), skillId));
          
          personen.forEach(person => {
              if (person.skillIds && person.skillIds.includes(skillId)) {
                  const updatedSkills = person.skillIds.filter(id => id !== skillId);
                  batch.update(doc(db, getPersonenCollectionPath(), person.id), { skillIds: updatedSkills });
              }
          });
          
          await batch.commit();
          return true;
      } catch (e) { console.error("Error deleting skill:", e); setError("Fehler beim Löschen des Skills."); return false; }
  };
  
  // --- CRUD-Funktionen für Personen (angepasst für skillIds) ---
  const fuegePersonHinzu = async (personDaten) => {
    try {
      const docRef = await addDoc(collection(db, getPersonenCollectionPath()), {
        ...personDaten, erstelltAm: new Date().toISOString(), letzteAenderung: new Date().toISOString(),
      });
      return docRef.id;
    } catch (e) { console.error("Error adding person:", e); setError("Fehler beim Hinzufügen der Person."); return null; }
  };

  const aktualisierePerson = async (personId, neueDaten) => {
    try {
      const personDocRef = doc(db, getPersonenCollectionPath(), personId);
      await updateDoc(personDocRef, { ...neueDaten, letzteAenderung: new Date().toISOString() });
      return true;
    } catch (e) { console.error("Error updating person:", e); setError("Fehler beim Aktualisieren der Person."); return false; }
  };

  //... (Restliche CRUD-Funktionen bleiben gleich)
  const loeschePerson = async (personId) => { try { const assignmentsQuery = query(collection(db, getZuordnungenCollectionPath()), where("personId", "==", personId)); const assignmentSnapshot = await getDocs(assignmentsQuery); const batch = []; assignmentSnapshot.forEach(doc => { batch.push(deleteDoc(doc.ref)); }); await Promise.all(batch); await deleteDoc(doc(db, getPersonenCollectionPath(), personId)); return true; } catch (e) { console.error("Error deleting person: ", e); setError("Fehler beim Löschen der Person."); return false; } };
  const erstelleDatenprodukt = async (produktDaten) => { try { const docRef = await addDoc(collection(db, getDatenprodukteCollectionPath()), { ...produktDaten, erstelltAm: new Date().toISOString(), letzteAenderung: new Date().toISOString(), }); return docRef.id; } catch (e) { console.error("Error adding datenprodukt: ", e); setError("Fehler beim Erstellen des Datenprodukts."); return null; } };
  const aktualisiereDatenprodukt = async (produktId, neueDaten) => { try { const produktDocRef = doc(db, getDatenprodukteCollectionPath(), produktId); await updateDoc(produktDocRef, { ...neueDaten, letzteAenderung: new Date().toISOString(), }); return true; } catch (e) { console.error("Error updating datenprodukt: ", e); setError("Fehler beim Aktualisieren des Datenprodukts."); return false; } };
  const loescheDatenprodukt = async (produktId) => { try { const assignmentsQuery = query(collection(db, getZuordnungenCollectionPath()), where("datenproduktId", "==", produktId)); const assignmentSnapshot = await getDocs(assignmentsQuery); const batch = []; assignmentSnapshot.forEach(doc => { batch.push(deleteDoc(doc.ref)); }); await Promise.all(batch); await deleteDoc(doc(db, getDatenprodukteCollectionPath(), produktId)); return true; } catch (e) { console.error("Error deleting datenprodukt: ", e); setError("Fehler beim Löschen des Datenprodukts."); return false; } };
  const weisePersonDatenproduktRolleZu = async (personId, produktId, rolleId) => { setError(null); const existingAssignment = zuordnungen.find( z => z.personId === personId && z.datenproduktId === produktId && z.rolleId === rolleId ); if (existingAssignment) { setError("Diese Person hat diese Rolle bereits."); setTimeout(() => setError(null), 3000); return null; } try { const docRef = await addDoc(collection(db, getZuordnungenCollectionPath()), { personId, datenproduktId: produktId, rolleId, erstelltAm: new Date().toISOString(), }); return docRef.id; } catch (e) { console.error("Error assigning role: ", e); setError(`Zuweisungsfehler: ${e.code || e.message}`); return null; } };
  const entfernePersonVonDatenproduktRolle = async (zuordnungId) => { try { await deleteDoc(doc(db, getZuordnungenCollectionPath(), zuordnungId)); return true; } catch (e) { console.error("Error removing role assignment: ", e); setError(`Löschfehler: ${e.code || e.message}`); return false; } };
  const fuegeRolleHinzu = async (rollenName) => { if (!rollenName?.trim()) return null; try { const docRef = await addDoc(collection(db, getRollenCollectionPath()), { name: rollenName.trim() }); return docRef.id; } catch (e) { console.error("Error adding role: ", e); setError(`Speicherfehler: ${e.code || e.message}`); return null; } };
  const aktualisiereRolle = async (rolleId, rollenName) => { if (!rollenName?.trim()) return false; try { const rolleDocRef = doc(db, getRollenCollectionPath(), rolleId); await updateDoc(rolleDocRef, { name: rollenName.trim() }); return true; } catch (e) { console.error("Error updating role: ", e); setError(`Update-Fehler: ${e.code || e.message}`); return false; } };
  const loescheRolle = async (rolleId) => { const isRoleInUse = zuordnungen.some(z => z.rolleId === rolleId); if (isRoleInUse) { setError("Diese Rolle wird noch verwendet und kann nicht gelöscht werden."); setTimeout(() => setError(null), 3000); return false; } try { await deleteDoc(doc(db, getRollenCollectionPath(), rolleId)); return true; } catch (e) { console.error("Error deleting role: ", e); setError(`Löschfehler: ${e.code || e.message}`); return false; } };

  return (
    <DataContext.Provider value={{
      personen, datenprodukte, rollen, skills, zuordnungen,
      fuegePersonHinzu, aktualisierePerson, loeschePerson,
      erstelleDatenprodukt, aktualisiereDatenprodukt, loescheDatenprodukt,
      weisePersonDatenproduktRolleZu, entfernePersonVonDatenproduktRolle,
      fuegeRolleHinzu, aktualisiereRolle, loescheRolle,
      fuegeSkillHinzu, aktualisiereSkill, loescheSkill,
      loading, error,
    }}>
      {children}
    </DataContext.Provider>
  );
};