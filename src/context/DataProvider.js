import React, {
  useState,
  createContext,
  useContext,
  useEffect,
  useCallback,
} from "react";
import {
  db,
  appId,
  confluenceCalendarUrl,
  calendarProxyUrl,
  logServerUrl,
} from "../firebase/config";
import { fetchCalendarEvents } from "../api/calendar";
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
  writeBatch,
  setDoc,
} from "firebase/firestore";

export const DataContext = createContext();
export const useData = () => useContext(DataContext);

const tagColors = [
  "#FECACA",
  "#FED7AA",
  "#FDE68A",
  "#D9F99D",
  "#A7F3D0",
  "#A5F3FC",
  "#A5B4FC",
  "#C4B5FD",
  "#F5D0FE",
  "#FECDD3",
];
const getRandomColor = () =>
  tagColors[Math.floor(Math.random() * tagColors.length)];

export const DataProvider = ({ children, isReadOnly, user }) => {
  const [personen, setPersonen] = useState([]);
  const [datenprodukte, setDatenprodukte] = useState([]);
  const [rollen, setRollen] = useState([]);
  const [skills, setSkills] = useState([]);
  const [zuordnungen, setZuordnungen] = useState([]);
  const [urlaube, setUrlaube] = useState([]); // neu: Urlaubs-Daten
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChange, setLastChange] = useState(null);
  const [vacations, setVacations] = useState({});
  const lastChangeRef = doc(db, `artifacts/${appId}/public/meta`);

  const recordLastChange = async (description) => {
    const change = {
      description,
      userEmail: user?.email || "Unbekannt",
      timestamp: new Date(),
    };
    setLastChange(change);
    try {
      await setDoc(lastChangeRef, { lastChange: change }, { merge: true });
      const logUrl = logServerUrl || "http://localhost:3001/log";
      fetch(logUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(change),
      }).catch((err) => console.error("Log server error:", err));
    } catch (e) {
      console.error("Error updating last change:", e);
    }
  };

  const getCollectionPath = useCallback(
    (name) => `/artifacts/${appId}/public/data/${name}`,
    []
  );

  useEffect(() => {
    const unsubscribe = onSnapshot(lastChangeRef, (snapshot) => {
      if (snapshot.exists()) {
        setLastChange(snapshot.data().lastChange || null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadVacations = async () => {
      const url = calendarProxyUrl || confluenceCalendarUrl;
      console.log('🔍 Calendar URL:', url);
      console.log('🔍 calendarProxyUrl:', calendarProxyUrl);
      console.log('🔍 confluenceCalendarUrl:', confluenceCalendarUrl);
      
      if (!url) {
        console.log('❌ No calendar URL configured');
        return;
      }
      
      try {
        console.log('📅 Fetching calendar from:', url);
        const events = await fetchCalendarEvents(url);
        console.log('📊 Events received:', events.length, events);
        
        const upcoming = events.filter((ev) => new Date(ev.end) >= new Date());
        console.log('📅 Upcoming events:', upcoming.length);

        const mapping = {};
        upcoming.forEach((ev) => {
          (ev.attendees || []).forEach((name) => {
            const key = name.toLowerCase();
            if (!mapping[key]) mapping[key] = [];
            mapping[key].push({
              start: ev.start,
              end: ev.end,
              summary: ev.summary,
            });
          });
        });
        
        console.log('🗂️ Final mapping:', mapping);
        console.log('🗂️ Mapping keys:', Object.keys(mapping));
        setVacations(mapping);
      } catch (error) {
        console.error('❌ Calendar loading error:', error);
        setVacations({});
      }
    };
    loadVacations();
  }, [calendarProxyUrl, confluenceCalendarUrl]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const collections = [
      { path: getCollectionPath("personen"), setter: setPersonen },
      { path: getCollectionPath("datenprodukte"), setter: setDatenprodukte },
      { path: getCollectionPath("zuordnungen"), setter: setZuordnungen },
      { path: getCollectionPath("rollen"), setter: setRollen },
      { path: getCollectionPath("skills"), setter: setSkills },
      { path: getCollectionPath("urlaube"), setter: setUrlaube }, // neu
    ];
    let loadedCount = 0;
    const checkAllLoaded = () => {
      if (++loadedCount >= collections.length) setLoading(false);
    };

    const unsubscribes = collections.map(({ path, setter }) => {
      const q = query(collection(db, path));
      return onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          if (!path.includes("zuordnungen")) {
            data.sort((a, b) =>
              (a.name || "").localeCompare(b.name || "", "de")
            );
          }
          setter(data);
          checkAllLoaded();
        },
        (err) => {
          console.error(`Error at ${path}:`, err);
          setError(`Fehler: ${err.code}.`);
          checkAllLoaded();
        }
      );
    });
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [getCollectionPath]);

  const preventWriteActions =
    (func) =>
    async (...args) => {
      if (isReadOnly) {
        setError("Diese Aktion ist im Nur-Lese-Modus nicht verfügbar.");
        setTimeout(() => setError(null), 3000);
        return null;
      }
      setError(null);
      return func(...args);
    };

  const fuegePersonHinzu = preventWriteActions(async (personDaten) => {
    try {
      const docRef = await addDoc(
        collection(db, getCollectionPath("personen")),
        {
          ...personDaten,
          wochenstunden: personDaten.wochenstunden || 31, // Standard: 31 Stunden
          erstelltAm: new Date().toISOString(),
          letzteAenderung: new Date().toISOString(),
        }
      );
      recordLastChange("Neue Person angelegt");
      return docRef.id;
    } catch (e) {
      console.error(e);
      setError(`Speicherfehler Person: ${e.code}`);
      return null;
    }
  });

  const fuegePersonenImBatchHinzu = preventWriteActions(
    async (personenArray) => {
      if (!personenArray || personenArray.length === 0) {
        setError("Keine Personen zum Hinzufügen vorhanden.");
        return false;
      }
      const batch = writeBatch(db);
      for (const personData of personenArray) {
        if (!personData.name || !personData.email) {
          setError(
            `Fehler in den Daten: Ein Eintrag hat keinen Namen oder keine E-Mail.`
          );
          return false;
        }
        const newPersonRef = doc(collection(db, getCollectionPath("personen")));
        batch.set(newPersonRef, {
          ...personData,
          wochenstunden: personData.wochenstunden || 31, // Standard: 31 Stunden
          erstelltAm: new Date().toISOString(),
          letzteAenderung: new Date().toISOString(),
        });
      }
      try {
        await batch.commit();
        recordLastChange("Mehrere Personen angelegt");
        return true;
      } catch (e) {
        console.error("Error committing batch:", e);
        setError(`Fehler beim Batch-Upload: ${e.code || e.message}`);
        return false;
      }
    }
  );

  const aktualisierePerson = preventWriteActions(
    async (personId, neueDaten) => {
      try {
        await updateDoc(doc(db, getCollectionPath("personen"), personId), {
          ...neueDaten,
          letzteAenderung: new Date().toISOString(),
        });
        recordLastChange("Person geändert");
        return true;
      } catch (e) {
        console.error(e);
        setError(`Update-Fehler Person: ${e.code}`);
        return false;
      }
    }
  );
  const loeschePerson = preventWriteActions(async (personId) => {
    try {
      const batch = writeBatch(db);
      const assignmentsQuery = query(
        collection(db, getCollectionPath("zuordnungen")),
        where("personId", "==", personId)
      );
      const assignmentSnapshot = await getDocs(assignmentsQuery);
      assignmentSnapshot.forEach((doc) => batch.delete(doc.ref));
      batch.delete(doc(db, getCollectionPath("personen"), personId));
      await batch.commit();
      recordLastChange("Person gelöscht");
      return true;
    } catch (e) {
      console.error(e);
      setError(`Löschfehler Person: ${e.code}`);
      return false;
    }
  });
  const erstelleDatenprodukt = preventWriteActions(async (produktDaten) => {
    try {
      const docRef = await addDoc(
        collection(db, getCollectionPath("datenprodukte")),
        {
          ...produktDaten,
          erstelltAm: new Date().toISOString(),
          letzteAenderung: new Date().toISOString(),
        }
      );
      recordLastChange("Neues Datenprodukt angelegt");
      return docRef.id;
    } catch (e) {
      console.error(e);
      setError(`Speicherfehler: ${e.code}`);
      return null;
    }
  });
  const aktualisiereDatenprodukt = preventWriteActions(
    async (produktId, neueDaten) => {
      try {
        await updateDoc(
          doc(db, getCollectionPath("datenprodukte"), produktId),
          {
            ...neueDaten,
            letzteAenderung: new Date().toISOString(),
          }
        );
        recordLastChange("Datenprodukt geändert");
        return true;
      } catch (e) {
        console.error(e);
        setError(`Update-Fehler: ${e.code}`);
        return false;
      }
    }
  );
  const loescheDatenprodukt = preventWriteActions(async (produktId) => {
    try {
      const batch = writeBatch(db);
      const q = query(
        collection(db, getCollectionPath("zuordnungen")),
        where("datenproduktId", "==", produktId)
      );
      const assignments = await getDocs(q);
      assignments.forEach((doc) => batch.delete(doc.ref));
      batch.delete(doc(db, getCollectionPath("datenprodukte"), produktId));
      await batch.commit();
      recordLastChange("Datenprodukt gelöscht");
      return true;
    } catch (e) {
      console.error(e);
      setError(`Löschfehler: ${e.code}`);
      return false;
    }
  });
  const weisePersonDatenproduktRolleZu = preventWriteActions(
    async (personId, produktId, rolleId, stunden = 0) => {
      const existing = zuordnungen.find(
        (z) =>
          z.personId === personId &&
          z.datenproduktId === produktId &&
          z.rolleId === rolleId
      );
      if (existing) {
        setError("Diese Person hat diese Rolle bereits.");
        setTimeout(() => setError(null), 3000);
        return null;
      }
      try {
        const docRef = await addDoc(
          collection(db, getCollectionPath("zuordnungen")),
          {
            personId,
            datenproduktId: produktId,
            rolleId,
            stunden: Number(stunden) || 0,
            erstelltAm: new Date().toISOString(),
          }
        );
        recordLastChange("Rolle zugewiesen");
        return docRef.id;
      } catch (e) {
        console.error(e);
        setError(`Zuweisungsfehler: ${e.code}`);
        return null;
      }
    }
  );
  const entfernePersonVonDatenproduktRolle = preventWriteActions(
    async (zuordnungId) => {
      try {
        await deleteDoc(doc(db, getCollectionPath("zuordnungen"), zuordnungId));
        recordLastChange("Rolle entfernt");
        return true;
      } catch (e) {
        console.error(e);
        setError(`Löschfehler: ${e.code}`);
        return false;
      }
    }
  );

  const aktualisiereZuordnungStunden = preventWriteActions(
    async (zuordnungId, stunden) => {
      try {
        await updateDoc(doc(db, getCollectionPath("zuordnungen"), zuordnungId), {
          stunden: Number(stunden) || 0,
        });
        recordLastChange("Stunden aktualisiert");
        return true;
      } catch (e) {
        console.error(e);
        setError(`Update-Fehler Stunden: ${e.code}`);
        return false;
      }
    }
  );
  const fuegeRolleHinzu = preventWriteActions(async (rollenName) => {
    if (!rollenName?.trim()) return null;
    try {
      const docRef = await addDoc(collection(db, getCollectionPath("rollen")), {
        name: rollenName.trim(),
      });
      recordLastChange("Neue Rolle angelegt");
      return docRef.id;
    } catch (e) {
      console.error(e);
      setError(`Speicherfehler Rolle: ${e.code}`);
      return null;
    }
  });

  const aktualisiereRolle = preventWriteActions(async (rolleId, rollenName) => {
    if (!rollenName?.trim()) return false;
    try {
      await updateDoc(doc(db, getCollectionPath("rollen"), rolleId), {
        name: rollenName.trim(),
      });
      recordLastChange("Rolle geändert");
      return true;
    } catch (e) {
      console.error(e);
      setError(`Update-Fehler Rolle: ${e.code}`);
      return false;
    }
  });
  const loescheRolle = preventWriteActions(async (rolleId) => {
    const isRoleInUse = zuordnungen.some((z) => z.rolleId === rolleId);
    if (isRoleInUse) {
      setError("Diese Rolle wird noch verwendet.");
      setTimeout(() => setError(null), 4000);
      return false;
    }
    try {
      await deleteDoc(doc(db, getCollectionPath("rollen"), rolleId));
      recordLastChange("Rolle gelöscht");
      return true;
    } catch (e) {
      console.error(e);
      setError(`Löschfehler Rolle: ${e.code}`);
      return false;
    }
  });

  const fuegeSkillHinzu = preventWriteActions(async (skillName, color) => {
    if (!skillName?.trim()) return null;
    const colorToUse = color || getRandomColor();
    try {
      const docRef = await addDoc(collection(db, getCollectionPath("skills")), {
        name: skillName.trim(),
        color: colorToUse,
      });
      recordLastChange("Neuer Skill angelegt");
      return docRef.id;
    } catch (e) {
      console.error("Error adding skill:", e);
      setError("Fehler beim Hinzufügen des Skills.");
      return null;
    }
  });
  const aktualisiereSkill = preventWriteActions(
    async (skillId, skillName, color) => {
      if (!skillName?.trim()) return false;
      try {
        await updateDoc(doc(db, getCollectionPath("skills"), skillId), {
          name: skillName.trim(),
          color,
        });
        recordLastChange("Skill geändert");
        return true;
      } catch (e) {
        console.error("Error updating skill:", e);
        setError("Fehler beim Aktualisieren des Skills.");
        return false;
      }
    }
  );
  const loescheSkill = preventWriteActions(async (skillId) => {
    const isSkillInUse = personen.some(
      (p) => p.skillIds && p.skillIds.includes(skillId)
    );
    if (isSkillInUse) {
      setError("Dieser Skill wird noch verwendet.");
      setTimeout(() => setError(null), 4000);
      return false;
    }
    try {
      await deleteDoc(doc(db, getCollectionPath("skills"), skillId));
      recordLastChange("Skill gelöscht");
      return true;
    } catch (e) {
      console.error("Error deleting skill:", e);
      setError(`Löschfehler Skill: ${e.code}`);
      return false;
    }
  });

  return (
    <DataContext.Provider
      value={{
        personen,
        datenprodukte,
        rollen,
        skills,
        zuordnungen,
        urlaube,
        vacations,
        fuegePersonHinzu,
        aktualisierePerson,
        loeschePerson,
        fuegePersonenImBatchHinzu,
        erstelleDatenprodukt,
        aktualisiereDatenprodukt,
        loescheDatenprodukt,
        weisePersonDatenproduktRolleZu,
        entfernePersonVonDatenproduktRolle,
        aktualisiereZuordnungStunden,
        fuegeRolleHinzu,
        aktualisiereRolle,
        loescheRolle,
        fuegeSkillHinzu,
        aktualisiereSkill,
        loescheSkill,
        loading,
        error,
        setError,
        lastChange,
      }}
    >
      {" "}
      {children}{" "}
    </DataContext.Provider>
  );
};
