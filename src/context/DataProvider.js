import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { db, appId } from '../firebase/config';
<<<<<<< HEAD
import { ErrorOverlay } from '../components/ui/ErrorOverlay';
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
=======
import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
>>>>>>> 7c73999 (Excel Upload)

export const DataContext = createContext();
export const useData = () => useContext(DataContext);

const tagColors = [ '#FECACA', '#FED7AA', '#FDE68A', '#D9F99D', '#A7F3D0', '#A5F3FC', '#A5B4FC', '#C4B5FD', '#F5D0FE', '#FECDD3' ];
const getRandomColor = () => tagColors[Math.floor(Math.random() * tagColors.length)];

export const DataProvider = ({ children, isReadOnly }) => {
  const [personen, setPersonen] = useState([]);
  const [datenprodukte, setDatenprodukte] = useState([]);
  const [rollen, setRollen] = useState([]);
  const [skills, setSkills] = useState([]);
  const [zuordnungen, setZuordnungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getCollectionPath = useCallback((name) => `/artifacts/${appId}/public/data/${name}`, []);

  useEffect(() => {
    setLoading(true); setError(null);
    const collections = [
      { path: getCollectionPath('personen'), setter: setPersonen }, { path: getCollectionPath('datenprodukte'), setter: setDatenprodukte },
      { path: getCollectionPath('zuordnungen'), setter: setZuordnungen }, { path: getCollectionPath('rollen'), setter: setRollen },
      { path: getCollectionPath('skills'), setter: setSkills }
    ];
    let loadedCount = 0;
    const checkAllLoaded = () => { if (++loadedCount >= collections.length) setLoading(false); };
    
    const unsubscribes = collections.map(({ path, setter }) => {
        const q = query(collection(db, path));
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (!path.includes('zuordnungen')) { data.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de')); }
            setter(data);
            checkAllLoaded();
        }, (err) => { console.error(`Error at ${path}:`, err); setError(`Fehler: ${err.code}.`); checkAllLoaded(); });
    });
    return () => unsubscribes.forEach(unsub => unsub());
  }, [getCollectionPath]);

  const preventWriteActions = (func) => async (...args) => {
    if (isReadOnly) { setError("Diese Aktion ist im Nur-Lese-Modus nicht verfügbar."); setTimeout(() => setError(null), 3000); return null; }
    setError(null); return func(...args);
  };
  
  const fuegePersonHinzu = preventWriteActions(async (personDaten) => { try { const docRef = await addDoc(collection(db, getCollectionPath('personen')), { ...personDaten, erstelltAm: new Date().toISOString(), letzteAenderung: new Date().toISOString() }); return docRef.id; } catch (e) { console.error(e); setError(`Speicherfehler Person: ${e.code}`); return null; } });
  
  const fuegePersonenImBatchHinzu = preventWriteActions(async (personenArray) => {
    if (!personenArray || personenArray.length === 0) { setError("Keine Personen zum Hinzufügen vorhanden."); return false; }
    const batch = writeBatch(db);
    for (const personData of personenArray) {
        if (!personData.name || !personData.email) { setError(`Fehler in den Daten: Ein Eintrag hat keinen Namen oder keine E-Mail.`); return false; }
        const newPersonRef = doc(collection(db, getCollectionPath('personen')));
        batch.set(newPersonRef, { ...personData, erstelltAm: new Date().toISOString(), letzteAenderung: new Date().toISOString() });
    }
    try { await batch.commit(); return true; } 
    catch (e) { console.error("Error committing batch:", e); setError(`Fehler beim Batch-Upload: ${e.code || e.message}`); return false; }
  });

  const aktualisierePerson = preventWriteActions(async (personId, neueDaten) => { try { await updateDoc(doc(db, getCollectionPath('personen'), personId), { ...neueDaten, letzteAenderung: new Date().toISOString() }); return true; } catch (e) { console.error(e); setError(`Update-Fehler Person: ${e.code}`); return false; } });
  const loeschePerson = preventWriteActions(async (personId) => { try { const batch = writeBatch(db); const assignmentsQuery = query(collection(db, getCollectionPath('zuordnungen')), where("personId", "==", personId)); const assignmentSnapshot = await getDocs(assignmentsQuery); assignmentSnapshot.forEach(doc => batch.delete(doc.ref)); batch.delete(doc(db, getCollectionPath('personen'), personId)); await batch.commit(); return true; } catch (e) { console.error(e); setError(`Löschfehler Person: ${e.code}`); return false; } });
  const erstelleDatenprodukt = preventWriteActions(async (produktDaten) => { try { const docRef = await addDoc(collection(db, getCollectionPath('datenprodukte')), { ...produktDaten, erstelltAm: new Date().toISOString(), letzteAenderung: new Date().toISOString() }); return docRef.id; } catch(e) { console.error(e); setError(`Speicherfehler: ${e.code}`); return null; } });
  const aktualisiereDatenprodukt = preventWriteActions(async (produktId, neueDaten) => { try { await updateDoc(doc(db, getCollectionPath('datenprodukte'), produktId), { ...neueDaten, letzteAenderung: new Date().toISOString() }); return true; } catch(e) { console.error(e); setError(`Update-Fehler: ${e.code}`); return false; } });
  const loescheDatenprodukt = preventWriteActions(async (produktId) => { try { const batch = writeBatch(db); const q = query(collection(db, getCollectionPath('zuordnungen')), where("datenproduktId", "==", produktId)); const assignments = await getDocs(q); assignments.forEach(doc => batch.delete(doc.ref)); batch.delete(doc(db, getCollectionPath('datenprodukte'), produktId)); await batch.commit(); return true; } catch(e) { console.error(e); setError(`Löschfehler: ${e.code}`); return false; } });
  const weisePersonDatenproduktRolleZu = preventWriteActions(async (personId, produktId, rolleId) => { const existing = zuordnungen.find(z => z.personId === personId && z.datenproduktId === produktId && z.rolleId === rolleId); if (existing) { setError("Diese Person hat diese Rolle bereits."); setTimeout(() => setError(null), 3000); return null; } try { const docRef = await addDoc(collection(db, getCollectionPath('zuordnungen')), { personId, datenproduktId: produktId, rolleId, erstelltAm: new Date().toISOString() }); return docRef.id; } catch(e) { console.error(e); setError(`Zuweisungsfehler: ${e.code}`); return null; } });
  const entfernePersonVonDatenproduktRolle = preventWriteActions(async (zuordnungId) => { try { await deleteDoc(doc(db, getCollectionPath('zuordnungen'), zuordnungId)); return true; } catch(e) { console.error(e); setError(`Löschfehler: ${e.code}`); return false; } });
  const fuegeRolleHinzu = preventWriteActions(async (rollenName) => { if (!rollenName?.trim()) return null; try { const docRef = await addDoc(collection(db, getCollectionPath('rollen')), { name: rollenName.trim() }); return docRef.id; } catch (e) { console.error(e); setError(`Speicherfehler Rolle: ${e.code}`); return null; } });
  
  // HIER WAR DER FEHLER: `preventInDemo` wurde zu `preventWriteActions` korrigiert
  const aktualisiereRolle = preventWriteActions(async (rolleId, rollenName) => { if (!rollenName?.trim()) return false; try { await updateDoc(doc(db, getCollectionPath('rollen'), rolleId), { name: rollenName.trim() }); return true; } catch (e) { console.error(e); setError(`Update-Fehler Rolle: ${e.code}`); return false; } });
  const loescheRolle = preventWriteActions(async (rolleId) => { const isRoleInUse = zuordnungen.some(z => z.rolleId === rolleId); if (isRoleInUse) { setError("Diese Rolle wird noch verwendet."); setTimeout(() => setError(null), 4000); return false; } try { await deleteDoc(doc(db, getCollectionPath('rollen'), rolleId)); return true; } catch (e) { console.error(e); setError(`Löschfehler Rolle: ${e.code}`); return false; } });
  
  const fuegeSkillHinzu = preventWriteActions(async (skillName, color) => { if (!skillName?.trim()) return null; const colorToUse = color || getRandomColor(); try { const docRef = await addDoc(collection(db, getCollectionPath('skills')), { name: skillName.trim(), color: colorToUse }); return docRef.id; } catch (e) { console.error("Error adding skill:", e); setError("Fehler beim Hinzufügen des Skills."); return null; } });
  const aktualisiereSkill = preventWriteActions(async (skillId, skillName, color) => { if (!skillName?.trim()) return false; try { await updateDoc(doc(db, getCollectionPath('skills'), skillId), { name: skillName.trim(), color }); return true; } catch (e) { console.error("Error updating skill:", e); setError("Fehler beim Aktualisieren des Skills."); return false; } });
  const loescheSkill = preventWriteActions(async (skillId) => { const isSkillInUse = personen.some(p => p.skillIds && p.skillIds.includes(skillId)); if (isSkillInUse) { setError("Dieser Skill wird noch verwendet."); setTimeout(() => setError(null), 4000); return false; } try { await deleteDoc(doc(db, getCollectionPath('skills'), skillId)); return true; } catch (e) { console.error("Error deleting skill:", e); setError(`Löschfehler Skill: ${e.code}`); return false; } });

  return (
    <DataContext.Provider value={{ personen, datenprodukte, rollen, skills, zuordnungen, fuegePersonHinzu, aktualisierePerson, loeschePerson, fuegePersonenImBatchHinzu, erstelleDatenprodukt, aktualisiereDatenprodukt, loescheDatenprodukt, weisePersonDatenproduktRolleZu, entfernePersonVonDatenproduktRolle, fuegeRolleHinzu, aktualisiereRolle, loescheRolle, fuegeSkillHinzu, aktualisiereSkill, loescheSkill, loading, error, setError }}>
      {children}
      <ErrorOverlay message={error} onClose={() => setError(null)} />
    </DataContext.Provider>
  );
};