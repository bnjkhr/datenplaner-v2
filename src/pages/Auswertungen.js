import React from "react";
import { useData } from "../context/DataProvider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import * as XLSX from "xlsx"; // Import der xlsx-Bibliothek
import { CollapsibleSection } from "../components/ui/CollapsibleSection";

export const Auswertungen = () => {
  const {
    personen,
    datenprodukte,
    zuordnungen,
    rollen,
    skills,
    loading,
    error,
  } = useData();

  if (loading)
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-3 text-gray-500">Lade Auswertungsdaten...</p>
      </div>
    );
  if (error)
    return (
      <p className="text-center text-red-500 py-8">
        Fehler beim Laden der Daten: {error}
      </p>
    );

  // --- Datenaufbereitung für alle Auswertungen ---
  const auswertungsDaten = personen.map((person) => {
    const personAssignments = zuordnungen.filter(
      (z) => z.personId === person.id
    );
    const uniqueDatenproduktIds = [
      ...new Set(personAssignments.map((z) => z.datenproduktId)),
    ];
    const anzahlProdukte = uniqueDatenproduktIds.length;
    const produktDetails = uniqueDatenproduktIds
      .map((dpId) => {
        const produkt = datenprodukte.find((dp) => dp.id === dpId);
        const rollenInProdukt = personAssignments
          .filter((pa) => pa.datenproduktId === dpId)
          .map((pa) => rollen.find((r) => r.id === pa.rolleId)?.name)
          .filter(Boolean)
          .join(", ");
        return {
          name: produkt ? produkt.name : "Unbekanntes Produkt",
          rollen: rollenInProdukt || "Keine Rolle zugewiesen",
        };
      })
      .filter((p) => p.name !== "Unbekanntes Produkt");

    return {
      id: person.id,
      name: person.name,
      email: person.email,
      "Anzahl Produkte": anzahlProdukte,
      produktDetails: produktDetails,
      fill: anzahlProdukte > 3 ? "#ef4444" : "#4f46e5",
    };
  });

  const tableData = [...auswertungsDaten].sort((a, b) =>
    a.name.localeCompare(b.name, "de")
  );
  const chartDataPersonen = [...auswertungsDaten].sort(
    (a, b) => b["Anzahl Produkte"] - a["Anzahl Produkte"]
  );
  const personenChartHeight = Math.max(400, chartDataPersonen.length * 30);

  const produktBesetzungData = datenprodukte
    .map((produkt) => ({
      name: produkt.name,
      "Anzahl Personen": [
        ...new Set(
          zuordnungen
            .filter((z) => z.datenproduktId === produkt.id)
            .map((z) => z.personId)
        ),
      ].length,
    }))
    .sort((a, b) => b["Anzahl Personen"] - a["Anzahl Personen"]);

  const skillUsageCount = skills
    .map((skill) => ({
      name: skill.name,
      Anzahl: personen.filter(
        (p) => p.skillIds && p.skillIds.includes(skill.id)
      ).length,
      color: skill.color,
    }))
    .sort((a, b) => b.Anzahl - a.Anzahl);

  const assignedSkillIds = new Set(personen.flatMap((p) => p.skillIds || []));
  const unassignedSkills = skills.filter(
    (skill) => !assignedSkillIds.has(skill.id)
  );

  // --- NEU: Funktion für den Excel-Export ---
  const handleExportToExcel = () => {
    // 1. Daten für das erste Tabellenblatt (Team-Auslastung) vorbereiten
    const auslastungSheetData = tableData.map((p) => ({
      Name: p.name,
      "Anzahl Produkte": p["Anzahl Produkte"],
      Datenprodukte: p.produktDetails
        .map((pd) => `${pd.name} (${pd.rollen})`)
        .join("; "),
    }));

    // 2. Daten für das zweite Tabellenblatt (Skill-Verteilung)
    const skillVerteilungSheetData = skillUsageCount.map((s) => ({
      Skill: s.name,
      "Anzahl Personen": s.Anzahl,
    }));

    // 3. Daten für das dritte Tabellenblatt (Unbelegte Skills)
    const unbelegteSkillsSheetData = unassignedSkills.map((s) => ({
      "Unbelegter Skill": s.name,
    }));

    // Erstelle die Tabellenblätter
    const wsAuslastung = XLSX.utils.json_to_sheet(auslastungSheetData);
    const wsSkillVerteilung = XLSX.utils.json_to_sheet(
      skillVerteilungSheetData
    );
    const wsUnbelegteSkills = XLSX.utils.json_to_sheet(
      unbelegteSkillsSheetData
    );

    // Erstelle ein neues Workbook und füge die Blätter hinzu
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsAuslastung, "Team-Auslastung");
    XLSX.utils.book_append_sheet(wb, wsSkillVerteilung, "Skill-Verteilung");
    XLSX.utils.book_append_sheet(wb, wsUnbelegteSkills, "Unbelegte Skills");

    // Speichere die Datei
    XLSX.writeFile(wb, "Datenprodukt_Auswertungen.xlsx");
  };

  const CustomTooltip = ({ active, payload, label }) => {
    /*...*/
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Auswertungen</h1>
        {/* --- NEU: Excel-Export Button --- */}
        <button
          onClick={handleExportToExcel}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md"
        >
          Excel-Export
        </button>
      </div>

      {/* Tabellarische Übersicht */}
      <CollapsibleSection title="Tabellarische Übersicht der Auslastung">
        {tableData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium uppercase"
                  >
                    Anzahl Produkte
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase"
                  >
                    Zugeordnete Datenprodukte (Rollen)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.map((person) => (
                  <tr key={person.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {person["Anzahl Produkte"] > 3 && (
                        <span
                          className="text-red-500 mr-2"
                          title="Hohe Auslastung"
                        >
                          ❗️
                        </span>
                      )}
                      {person.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {person["Anzahl Produkte"]}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {person.produktDetails.length > 0 ? (
                        <ul className="list-none space-y-1">
                          {person.produktDetails.map((pd, idx) => (
                            <li key={idx} className="text-xs">
                              <strong>{pd.name}</strong> ({pd.rollen})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-xs italic">
                          Keinen Produkten zugewiesen
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-10">
            Keine Daten vorhanden.
          </p>
        )}
      </CollapsibleSection>

      {/* Grafische Auswertungen */}
      <CollapsibleSection title="Grafische Auswertungen">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-lg font-medium text-gray-600 mb-4">
              Personen-Auslastung
            </h3>
            {chartDataPersonen.length > 0 ? (
              <ResponsiveContainer width="100%" height={personenChartHeight}>
                <BarChart
                  data={chartDataPersonen}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
                  barCategoryGap={10}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={150}
                    tick={{ fontSize: 12 }}
                    interval={0}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(239, 246, 255, 0.5)" }}
                  />
                  <Legend />
                  <Bar dataKey="Anzahl Produkte">
                    {chartDataPersonen.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-10">Keine Daten.</p>
            )}{" "}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-600 mb-4">
              Datenprodukt-Besetzung
            </h3>
            {produktBesetzungData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={produktBesetzungData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, angle: -45, textAnchor: "end" }}
                    height={80}
                    interval={0}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(239, 246, 255, 0.5)" }}
                  />
                  <Legend />
                  <Bar dataKey="Anzahl Personen" fill="#818cf8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-10">Keine Daten.</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Skill-Analyse */}
      <CollapsibleSection title="Skill-Analyse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Häufigkeit der Skills
            </h3>
            {skillUsageCount.length > 0 ? (
              <ul className="space-y-2">
                {skillUsageCount.map((skill) => (
                  <li
                    key={skill.name}
                    className="flex justify-between items-center text-sm pr-4"
                  >
                    <span
                      className="px-2 py-1 rounded-full font-semibold"
                      style={{ backgroundColor: skill.color, color: "#1f2937" }}
                    >
                      {skill.name}
                    </span>
                    <span className="font-bold text-gray-700">
                      {skill.Anzahl}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Keine Skills zugewiesen.</p>
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Nicht zugewiesene Skills
            </h3>
            {unassignedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {unassignedSkills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-xs font-medium"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Alle Skills sind mindestens einer Person zugewiesen.
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};
