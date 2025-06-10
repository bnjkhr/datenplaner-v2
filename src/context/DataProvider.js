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

const tagColors = [
    '#FECACA', '#FED7AA', '#FDE68A', '#D9F99D', '#A7F3D0', '#A5F3FC', 
    '#A5B4FC', '#C4B5FD', '#F5D0FE', '#FECDD3'
];
const getRandomColor = () => tagColors[Math.floor(Math.random() * tagColors.length)];

export const DataProvider = ({ children }) => {
  const [personen, setPersonen] = useState([]);
  const [datenprodukte, setDatenprodukte] = useState([]);
  const [rollen, setRollen] = useState([]);
  const [skills, setSkills] = useState([]);
  const [zuordnungen, setZuordnungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sharedDataPath = `/artifacts/${appId}/public/data`;
  const getCollectionPath = (name) => `${sharedDataPath}/${name}`;

  useEffect(() => {
    const collections = [
      { path: getCollectionPath('personen'), setter: setPersonen },
      { path: getCollectionPath('datenprodukte'), setter: setDatenprodukte },
      { path: getCollectionPath('zuordnungen'), setter: setZuordnungen },
      { path: getCollectionPath('rollen'), setter: setRollen },
      { path: getCollectionPath('skills'), setter: setSkills }
    ];

    const unsubscribes = collections.map(({ path, setter }) => {
      const q = query(collection(db, path));
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (!path.includes('zuordnungen')) {
          data.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'));
        }
        setter(data);
      }, (err) => {
        console.error(`Error at ${path}:`, err);
        setError(`Fehler beim Laden von Daten: ${err.message}`);
      });
    });
    
    // Initial data seeding and loading management
    const checkInitialData = async () => {
        const rollenSnapshot = await getDocs(collection(db, getCollectionPath('rollen')));
        if (rollenSnapshot.empty) {
            console.log("Seeding initial roles...");
            const batch = writeBatch(db);
            initialRollenSeed.forEach(role => {
                const docRef = doc(collection(db, getCollectionPath('rollen')));
                batch.set(docRef, role);
            });
            await batch.commit();
        }
        setLoading(false);
    }
    checkInitialData();

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const fuegePersonHinzu = async (personDaten) => {
    try {
      const docRef = await addDoc(collection(db, getCollectionPath('personen')), { ...personDaten, erstelltAm: new Date().toISOString(), letzteAenderung: new Date().toISOString() });
      return docRef;
    } catch (e) { console.error("Error adding person:", e); setError(`Fehler beim Speichern: ${e.code}`); return null; }
  };

  const aktualisierePerson = async (personId, neueDaten) => {
    try {
      await updateDoc(doc(db, getCollectionPath('personen'), personId), { ...neueDaten, letzteAenderung: new Date().toISOString() });
      return true;
    } catch (e) { console.error("Error updating person:", e); setError(`Update-Fehler: ${e.code}`); return false; }
  };

  const loeschePerson = async (personId) => {
    try {
        const batch = writeBatch(db);
        const assignmentsQuery = query(collection(db, getCollectionPath('zuordnungen')), where("personId", "==", personId));
        const assignmentSnapshot = await getDocs(assignmentsQuery);
        assignmentSnapshot.forEach(doc => batch.delete(doc.ref));
        batch.delete(doc(db, getCollectionPath('personen'), personId));
        await batch.commit();
        return true;
    } catch (e) { console.error("Error deleting person:", e); setError(`Löschfehler: ${e.code}`); return false; }
  };
  
  const fuegeSkillHinzu = async (skillName, color) => {
    if (!skillName?.trim()) return null;
    const colorToUse = color || getRandomColor();
    try {
      const docRef = await addDoc(collection(db, getCollectionPath('skills')), { name: skillName.trim(), color: colorToUse });
      return docRef.id;
    } catch (e) { console.error("Error adding skill:", e); setError("Fehler beim Hinzufügen des Skills."); return null; }
  };
  
  // (andere CRUD Funktionen...)

  return (
    <DataContext.Provider value={{
      personen, datenprodukte, rollen, skills, zuordnungen,
      fuegePersonHinzu, aktualisierePerson, loeschePerson,
      fuegeSkillHinzu,
      // ...alle anderen CRUD-Funktionen
      loading, error, setError
    }}>
      {children}
    </DataContext.Provider>
  );
};
