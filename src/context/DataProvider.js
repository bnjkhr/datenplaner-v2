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
  defaultTenantId,
  confluenceCalendarUrl,
  calendarProxyUrl,
  logServerUrl,
} from "../firebase/config";
import { isFeatureEnabled, FEATURE_FLAGS } from "../utils/featureFlags";
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

const roleColors = [
  "#EF4444", // red-500
  "#F97316", // orange-500  
  "#EAB308", // yellow-500
  "#22C55E", // green-500
  "#06B6D4", // cyan-500
  "#3B82F6", // blue-500
  "#8B5CF6", // violet-500
  "#EC4899", // pink-500
  "#10B981", // emerald-500
  "#F59E0B", // amber-500
  "#6366F1", // indigo-500
  "#84CC16", // lime-500
  "#14B8A6", // teal-500
  "#F43F5E", // rose-500
  "#8B5A2B", // brown-500
  "#6B7280", // gray-500
  // Erweiterte Palette mit helleren und dunkleren Varianten
  "#DC2626", // red-600
  "#EA580C", // orange-600
  "#CA8A04", // yellow-600
  "#16A34A", // green-600
  "#0891B2", // cyan-600
  "#2563EB", // blue-600
  "#7C3AED", // violet-600
  "#DB2777", // pink-600
  "#059669", // emerald-600
  "#D97706", // amber-600
  "#4F46E5", // indigo-600
  "#65A30D", // lime-600
  "#0D9488", // teal-600
  "#E11D48", // rose-600
  "#7F4F24", // brown-600
  "#4B5563", // gray-600
  // Noch mehr Farben
  "#B91C1C", // red-700
  "#C2410C", // orange-700
  "#A16207", // yellow-700
  "#15803D", // green-700
  "#0E7490", // cyan-700
  "#1D4ED8", // blue-700
  "#6D28D9", // violet-700
  "#BE185D", // pink-700
  "#047857", // emerald-700
  "#B45309", // amber-700
  "#3730A3", // indigo-700
  "#4D7C0F", // lime-700
  "#0F766E", // teal-700
  "#BE123C", // rose-700
  "#92400E", // brown-700
  "#374151", // gray-700
];

const getRandomColor = () =>
  tagColors[Math.floor(Math.random() * tagColors.length)];

const getRandomRoleColor = (existingColors = []) => {
  const availableColors = roleColors.filter(color => !existingColors.includes(color));
  if (availableColors.length === 0) {
    return roleColors[Math.floor(Math.random() * roleColors.length)];
  }
  return availableColors[Math.floor(Math.random() * availableColors.length)];
};

export const DataProvider = ({ children, isReadOnly, user, tenantId }) => {
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
  
  // Multi-Tenancy: Wähle entsprechenden Tenant oder fallback zu appId
  const currentTenantId = tenantId || (isFeatureEnabled(FEATURE_FLAGS.MULTI_TENANCY) ? defaultTenantId : appId);
  const isMultiTenancy = isFeatureEnabled(FEATURE_FLAGS.MULTI_TENANCY);
  
  const lastChangeRef = doc(db, isMultiTenancy ? 
    `tenants/${currentTenantId}` : 
    `artifacts/${appId}/public/meta`);

  const recordLastChange = async (description) => {
    const change = {
      description,
      userEmail: user?.email || "Unbekannt",
      timestamp: new Date(),
    };
    setLastChange(change);
    try {
      if (isMultiTenancy) {
        // Für Multi-Tenancy: Speichere als Field im Tenant-Dokument
        await setDoc(lastChangeRef, { lastChange: change }, { merge: true });
      } else {
        // Legacy-Pfad: Nutze die alte Struktur
        await setDoc(lastChangeRef, { lastChange: change }, { merge: true });
      }
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
    (name) => {
      if (isMultiTenancy) {
        return `tenant-${currentTenantId}-${name}`;
      }
      return `artifacts/${appId}/public/data/${name}`;
    },
    [isMultiTenancy, currentTenantId]
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
      // Always use CORS proxy in production to avoid proxy issues
      let url;
      
      if (process.env.NODE_ENV === 'development') {
        // Development: use direct URL
        url = confluenceCalendarUrl;
      } else {
        // Production: use CORS proxy directly
        url = `https://corsproxy.io/?${encodeURIComponent(confluenceCalendarUrl)}`;
      }
      
      console.log('🔍 Calendar URL:', url);
      console.log('🔍 calendarProxyUrl:', calendarProxyUrl);
      console.log('🔍 confluenceCalendarUrl:', confluenceCalendarUrl);
      console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
      
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
          (ev.attendees || []).forEach((attendee) => {
            const email = attendee.toLowerCase();
            const name = attendee.replace(/[@.].*$/, '').replace(/[._]/g, ' ').toLowerCase();
            
            // Store under email key
            if (!mapping[email]) mapping[email] = [];
            mapping[email].push({
              start: ev.start,
              end: ev.end,
              summary: ev.summary,
            });
            
            // Also store under name key for fallback
            if (!mapping[name]) mapping[name] = [];
            mapping[name].push({
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

  // Migration: Rollen ohne Farbe mit Farben versorgen
  useEffect(() => {
    if (loading || isReadOnly || rollen.length === 0) return;
    
    const rollenOhneFarbe = rollen.filter(rolle => !rolle.color);
    if (rollenOhneFarbe.length === 0) return;

    const migrateRoleColors = async () => {
      const existingColors = rollen.map(r => r.color).filter(Boolean);
      const batch = writeBatch(db);

      rollenOhneFarbe.forEach((rolle, index) => {
        const color = getRandomRoleColor([...existingColors, ...rollenOhneFarbe.slice(0, index).map((_, i) => roleColors[i % roleColors.length])]);
        existingColors.push(color);
        
        const rolleRef = doc(db, getCollectionPath("rollen"), rolle.id);
        batch.update(rolleRef, { color });
      });

      try {
        await batch.commit();
        console.log(`${rollenOhneFarbe.length} Rollen mit Farben versorgt`);
      } catch (error) {
        console.error('Fehler beim Migrieren der Rollen-Farben:', error);
      }
    };

    migrateRoleColors();
  }, [rollen, loading, isReadOnly, getCollectionPath]);

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
          isM13: personDaten.isM13 || false,
          kategorien: personDaten.kategorien || [],
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
          isM13: personData.isM13 || false,
          kategorien: personData.kategorien || [],
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

  const aktualisiereZuordnung = preventWriteActions(
    async (zuordnungId, updates) => {
      try {
        const updateData = {};
        if (updates.stunden !== undefined) {
          updateData.stunden = Number(updates.stunden) || 0;
        }
        if (updates.rolleId !== undefined) {
          updateData.rolleId = updates.rolleId;
        }
        
        await updateDoc(doc(db, getCollectionPath("zuordnungen"), zuordnungId), updateData);
        recordLastChange("Zuordnung aktualisiert");
        return true;
      } catch (e) {
        console.error(e);
        setError(`Update-Fehler Zuordnung: ${e.code}`);
        return false;
      }
    }
  );
  const fuegeRolleHinzu = preventWriteActions(async (rollenName) => {
    if (!rollenName?.trim()) return null;
    try {
      const existingColors = rollen.map(r => r.color).filter(Boolean);
      const newColor = getRandomRoleColor(existingColors);
      
      const docRef = await addDoc(collection(db, getCollectionPath("rollen")), {
        name: rollenName.trim(),
        color: newColor,
      });
      recordLastChange("Neue Rolle angelegt");
      return docRef.id;
    } catch (e) {
      console.error(e);
      setError(`Speicherfehler Rolle: ${e.code}`);
      return null;
    }
  });

  const aktualisiereRolle = preventWriteActions(async (rolleId, rollenName, color = null) => {
    if (!rollenName?.trim()) return false;
    try {
      const updateData = { name: rollenName.trim() };
      if (color !== null) {
        updateData.color = color;
      }
      
      await updateDoc(doc(db, getCollectionPath("rollen"), rolleId), updateData);
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
        aktualisiereZuordnung,
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
        // Multi-Tenancy Informationen
        currentTenantId,
        isMultiTenancy,
      }}
    >
      {" "}
      {children}{" "}
    </DataContext.Provider>
  );
};
