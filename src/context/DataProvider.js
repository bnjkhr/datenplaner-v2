// src/context/DataProvider.js
import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { db, appId } from '../firebase/config';
import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, where, writeBatch } from 'firebase/firestore';

export const DataContext = createContext();
export const useData = () => useContext(DataContext);

// Farbpalette für neue Skills
const tagColors = [ '#FECACA', '#FED7AA', '#FDE68A', '#D9F99D', '#A7F3D0', '#A5F3FC', '#A5B4FC', '#C4B5FD', '#F5D0FE', '#FECDD3' ];
const getRandomColor = () => tagColors[Math.floor(Math.random() * tagColors.length)];

export const DataProvider = ({ children }) => {
  const [personen, setPersonen] = useState([]);
  const [datenprodukte, setDatenprodukte] = useState([]);
  const [rollen, setRollen] = useState([]);
  const [skills, setSkills] = useState([]);
  const [zuordnungen, setZuordnungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getPersonenCollectionPath = useCallback(() => `/artifacts/${appId}/public/data/personen`, []);
  const getDatenprodukteCollectionPath = useCallback(() => `/artifacts/${appId}/public/data/datenprodukte`, []);
  const getZuordnungenCollectionPath = useCallback(() => `/artifacts/${appId}/public/data/zuordnungen`, []);
  const getRollenCollectionPath = useCallback(() => `/artifacts/${appId}/public/data/rollen`, []);
  const getSkillsCollectionPath = useCallback(() => `/artifacts/${appId}/public/data/skills`, []);

  useEffect(() => {
    setLoading(true); setError(null);
    const unsubscribes = [];
    let loadedCount = 0;
    const totalCollections = 5;

    const checkAllLoaded = () => { if (++loadedCount >= totalCollections) setLoading(false); };
    
    const setupListener = (path, setter) => {
        const q = query(collection(db, path));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (!path.includes('zuordnungen')) { data.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de')); }
            setter(data);
            checkAllLoaded();
        }, (err) => {
            console.error(`Error at ${path}:`, err); setError(`Fehler beim Laden von Daten.`); setLoading(false);
        });
        unsubscribes.push(unsubscribe);
    };

    setupListener(getPersonenCollectionPath(), setPersonen);
    setupListener(getDatenprodukteCollectionPath(), setDatenprodukte);
    setupListener(getZuordnungenCollectionPath(), setZuordnungen);
    setupListener(getRollenCollectionPath(), setRollen);
    setupListener(getSkillsCollectionPath(), setSkills);

    return () => unsubscribes.forEach(unsub => unsub());
  }, [getPersonenCollectionPath, getDatenprodukteCollectionPath, getZuordnungenCollectionPath, getRollenCollectionPath, getSkillsCollectionPath]);

  // --- CRUD-Funktionen für Skills (angepasst) ---
  const fuegeSkillHinzu = async (skillName, color) => {
    if (!skillName?.trim()) return null;
    const colorToUse = color || getRandomColor();
    try {
      const docRef = await addDoc(collection(db, getSkillsCollectionPath()), { name: skillName.trim(), color: colorToUse });
      return docRef.id;
    } catch (e) { console.error("Error adding skill:", e); setError("Fehler beim Hinzufügen des Skills."); return null; }
  };
  const aktualisiereSkill = async (skillId, skillName, color) => { /* ... */ };
  const loescheSkill = async (skillId) => { /* ... */ };
  
  // (Restliche CRUD-Funktionen bleiben gleich)
  const fuegePersonHinzu = async (personDaten) => { /* ... */ };
  const aktualisierePerson = async (personId, neueDaten) => { /* ... */ };
  const loeschePerson = async (personId) => { /* ... */ };
  const erstelleDatenprodukt = async (produktDaten) => { /* ... */ };
  const aktualisiereDatenprodukt = async (produktId, neueDaten) => { /* ... */ };
  const loescheDatenprodukt = async (produktId) => { /* ... */ };
  const weisePersonDatenproduktRolleZu = async (personId, produktId, rolleId) => { /* ... */ };
  const entfernePersonVonDatenproduktRolle = async (zuordnungId) => { /* ... */ };
  const fuegeRolleHinzu = async (rollenName) => { /* ... */ };
  const aktualisiereRolle = async (rolleId, rollenName) => { /* ... */ };
  const loescheRolle = async (rolleId) => { /* ... */ };

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
