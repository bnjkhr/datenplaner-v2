import React, { useState } from "react";
import { useData } from "../context/DataProvider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import * as XLSX from "xlsx";
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

  // Filter states
  const [filterAuslastung, setFilterAuslastung] = useState("alle");
  const [filterSkill, setFilterSkill] = useState("");
  const [filterDatenprodukt, setFilterDatenprodukt] = useState("");
  const [filterRolle, setFilterRolle] = useState("");

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="container mx-auto px-6 py-8">
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-800 px-6 py-4 rounded-xl" role="alert">
            Fehler beim Laden der Daten: {error}
          </div>
        </div>
      </div>
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

  // --- NEU: Auslastungs-Daten ---
  const workloadData = personen.map((person) => {
    const verfügbareStunden = person.wochenstunden || 31; // Standard: 31 Stunden
    const gebuchteStunden = zuordnungen
      .filter(z => z.personId === person.id)
      .reduce((sum, z) => sum + (z.stunden || 0), 0);
    
    const auslastung = verfügbareStunden > 0 ? (gebuchteStunden / verfügbareStunden) * 100 : 0;
    
    return {
      id: person.id,
      name: person.name,
      verfügbareStunden,
      gebuchteStunden,
      auslastung: Math.round(auslastung * 10) / 10, // Runde auf 1 Dezimalstelle
      status: auslastung > 100 ? 'overbooked' : 
              auslastung < 20 ? 'underbooked' : 'normal'
    };
  }).sort((a, b) => b.auslastung - a.auslastung); // Sortiert von hoch zu niedrig

  // Filter logic
  const filteredWorkloadData = workloadData.filter(person => {
    // Filter by utilization
    if (filterAuslastung !== "alle") {
      if (filterAuslastung === "hoch" && person.auslastung <= 100) return false;
      if (filterAuslastung === "normal" && (person.auslastung < 20 || person.auslastung > 100)) return false;
      if (filterAuslastung === "niedrig" && person.auslastung >= 20) return false;
    }

    // Filter by skill
    if (filterSkill) {
      const personData = personen.find(p => p.id === person.id);
      if (!personData?.skillIds?.includes(filterSkill)) return false;
    }

    // Filter by data product
    if (filterDatenprodukt) {
      const hasDataProduct = zuordnungen.some(z => 
        z.personId === person.id && z.datenproduktId === filterDatenprodukt
      );
      if (!hasDataProduct) return false;
    }

    // Filter by role
    if (filterRolle) {
      const hasRole = zuordnungen.some(z => 
        z.personId === person.id && z.rolleId === filterRolle
      );
      if (!hasRole) return false;
    }

    return true;
  });

  // --- NEU: Funktion für den Excel-Export ---
  const handleExportToExcel = () => {
    // 1. Auslastungsübersicht (Workload Data)
    const workloadSheetData = workloadData.map((person) => {
      const personData = personen.find(p => p.id === person.id);
      const personSkills = personData?.skillIds?.map(skillId => 
        skills.find(s => s.id === skillId)?.name
      ).filter(Boolean).join(', ') || 'Keine Skills';
      
      const personProducts = zuordnungen
        .filter(z => z.personId === person.id)
        .map(z => {
          const product = datenprodukte.find(dp => dp.id === z.datenproduktId)?.name || 'Unbekannt';
          const role = rollen.find(r => r.id === z.rolleId)?.name || 'Unbekannt';
          return `${product} (${role}, ${z.stunden}h)`;
        }).join('; ');

      return {
        Name: person.name,
        'Verfügbare Stunden': person.verfügbareStunden,
        'Gebuchte Stunden': person.gebuchteStunden,
        'Auslastung (%)': person.auslastung,
        Status: person.status === 'overbooked' ? 'Überbucht' : 
                person.status === 'underbooked' ? 'Unterausgelastet' : 'Normal',
        Skills: personSkills,
        'Zugewiesene Produkte': personProducts || 'Keine Zuweisungen'
      };
    });

    // 2. Tabellarische Übersicht (Team-Auslastung)
    const teamAuslastungSheetData = tableData.map((p) => ({
      Name: p.name,
      "Anzahl Produkte": p["Anzahl Produkte"],
      Datenprodukte: p.produktDetails
        .map((pd) => `${pd.name} (${pd.rollen})`)
        .join("; "),
    }));

    // 3. Personen-Auslastung Chart Data
    const personenChartSheetData = chartDataPersonen.map((p) => ({
      Name: p.name,
      'Anzahl Produkte': p['Anzahl Produkte'],
      Status: p['Anzahl Produkte'] > 3 ? 'Hohe Auslastung' : 'Normale Auslastung'
    }));

    // 4. Datenprodukt-Besetzung
    const produktBesetzungSheetData = produktBesetzungData.map((p) => ({
      Datenprodukt: p.name,
      'Anzahl Personen': p['Anzahl Personen']
    }));

    // 5. Skill-Verteilung
    const skillVerteilungSheetData = skillUsageCount.map((s) => ({
      Skill: s.name,
      "Anzahl Personen": s.Anzahl,
      Farbe: s.color
    }));

    // 6. Unbelegte Skills
    const unbelegteSkillsSheetData = unassignedSkills.map((s) => ({
      "Unbelegter Skill": s.name,
      Farbe: s.color
    }));

    // 7. Detaillierte Zuordnungen
    const zuordnungenSheetData = zuordnungen.map((z) => {
      const person = personen.find(p => p.id === z.personId);
      const produkt = datenprodukte.find(dp => dp.id === z.datenproduktId);
      const rolle = rollen.find(r => r.id === z.rolleId);
      
      return {
        Person: person?.name || 'Unbekannt',
        Datenprodukt: produkt?.name || 'Unbekannt',
        Rolle: rolle?.name || 'Unbekannt',
        'Stunden pro Woche': z.stunden || 0,
        'Erstellt am': z.erstelltAm ? new Date(z.erstelltAm).toLocaleDateString('de-DE') : ''
      };
    });

    // 8. Personen-Details
    const personenDetailsSheetData = personen.map((p) => {
      const personSkills = p.skillIds?.map(skillId => 
        skills.find(s => s.id === skillId)?.name
      ).filter(Boolean).join(', ') || 'Keine Skills';
      
      const totalStunden = zuordnungen
        .filter(z => z.personId === p.id)
        .reduce((sum, z) => sum + (z.stunden || 0), 0);

      return {
        Name: p.name,
        Email: p.email || '',
        'Wochenstunden': p.wochenstunden || 31,
        'Gebuchte Stunden': totalStunden,
        'Auslastung (%)': p.wochenstunden > 0 ? Math.round((totalStunden / p.wochenstunden) * 100 * 10) / 10 : 0,
        Skills: personSkills,
        'Erstellt am': p.erstelltAm ? new Date(p.erstelltAm).toLocaleDateString('de-DE') : '',
        'Letzte Änderung': p.letzteAenderung ? new Date(p.letzteAenderung).toLocaleDateString('de-DE') : ''
      };
    });

    // Erstelle die Tabellenblätter
    const wsWorkload = XLSX.utils.json_to_sheet(workloadSheetData);
    const wsTeamAuslastung = XLSX.utils.json_to_sheet(teamAuslastungSheetData);
    const wsPersonenChart = XLSX.utils.json_to_sheet(personenChartSheetData);
    const wsProduktBesetzung = XLSX.utils.json_to_sheet(produktBesetzungSheetData);
    const wsSkillVerteilung = XLSX.utils.json_to_sheet(skillVerteilungSheetData);
    const wsUnbelegteSkills = XLSX.utils.json_to_sheet(unbelegteSkillsSheetData);
    const wsZuordnungen = XLSX.utils.json_to_sheet(zuordnungenSheetData);
    const wsPersonenDetails = XLSX.utils.json_to_sheet(personenDetailsSheetData);

    // Erstelle ein neues Workbook und füge die Blätter hinzu
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsWorkload, "Auslastungsübersicht");
    XLSX.utils.book_append_sheet(wb, wsTeamAuslastung, "Team-Auslastung");
    XLSX.utils.book_append_sheet(wb, wsPersonenChart, "Personen-Produktzahl");
    XLSX.utils.book_append_sheet(wb, wsProduktBesetzung, "Produkt-Besetzung");
    XLSX.utils.book_append_sheet(wb, wsSkillVerteilung, "Skill-Verteilung");
    XLSX.utils.book_append_sheet(wb, wsUnbelegteSkills, "Unbelegte Skills");
    XLSX.utils.book_append_sheet(wb, wsZuordnungen, "Detaillierte Zuordnungen");
    XLSX.utils.book_append_sheet(wb, wsPersonenDetails, "Personen-Details");

    // Speichere die Datei
    XLSX.writeFile(wb, "Datenprodukt_Auswertungen_Komplett.xlsx");
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="text-sm font-medium">{`${label}`}</p>
          {payload.map((pld, index) => (
            <p key={index} className="text-sm" style={{ color: pld.color }}>
              {`${pld.dataKey}: ${pld.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Auswertungen</h1>
            <p className="text-gray-600">Analysiere deine Teams und Datenprodukte</p>
          </div>
          <button
            onClick={handleExportToExcel}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <span className="text-lg">📊</span>
            Excel-Export
          </button>
        </div>

        <div className="space-y-8">

          {/* NEU: Kompakte Auslastungsübersicht */}
          <CollapsibleSection title="Auslastungsübersicht" defaultOpen={true}>
            {/* Filter Controls */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Auslastung Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Auslastung</label>
                  <select
                    value={filterAuslastung}
                    onChange={(e) => setFilterAuslastung(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="alle">Alle</option>
                    <option value="hoch">Hoch (&gt;100%)</option>
                    <option value="normal">Normal (20-100%)</option>
                    <option value="niedrig">Niedrig (&lt;20%)</option>
                  </select>
                </div>

                {/* Skill Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Skill</label>
                  <select
                    value={filterSkill}
                    onChange={(e) => setFilterSkill(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Alle Skills</option>
                    {skills.map(skill => (
                      <option key={skill.id} value={skill.id}>{skill.name}</option>
                    ))}
                  </select>
                </div>

                {/* Datenprodukt Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Datenprodukt</label>
                  <select
                    value={filterDatenprodukt}
                    onChange={(e) => setFilterDatenprodukt(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Alle Datenprodukte</option>
                    {datenprodukte.map(dp => (
                      <option key={dp.id} value={dp.id}>{dp.name}</option>
                    ))}
                  </select>
                </div>

                {/* Rolle Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rolle</label>
                  <select
                    value={filterRolle}
                    onChange={(e) => setFilterRolle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Alle Rollen</option>
                    {rollen.map(rolle => (
                      <option key={rolle.id} value={rolle.id}>{rolle.name}</option>
                    ))}
                  </select>
                </div>

              </div>
              
              {/* Clear filters button */}
              {(filterAuslastung !== "alle" || filterSkill || filterDatenprodukt || filterRolle) && (
                <button
                  onClick={() => {
                    setFilterAuslastung("alle");
                    setFilterSkill("");
                    setFilterDatenprodukt("");
                    setFilterRolle("");
                  }}
                  className="mt-3 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Filter zurücksetzen
                </button>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Sortiert nach Auslastung (hoch → niedrig) • {filteredWorkloadData.length} von {workloadData.length} Personen
            </p>
            
            {filteredWorkloadData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredWorkloadData.map((person) => (
                    <div 
                      key={person.id}
                      className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                        person.status === 'overbooked' 
                          ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200' 
                          : person.status === 'underbooked'
                            ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                            : 'bg-gradient-to-br from-green-50 to-emerald-50 border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{person.name}</h3>
                        <span 
                          className={`text-xs font-bold px-2 py-1 rounded-full ${
                            person.status === 'overbooked' 
                              ? 'bg-orange-200 text-orange-800' 
                              : person.status === 'underbooked'
                                ? 'bg-red-200 text-red-800'
                                : 'bg-emerald-200 text-emerald-800'
                          }`}
                        >
                          {person.auslastung}%
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Gebucht:</span>
                          <span className="font-medium">{person.gebuchteStunden}h</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Verfügbar:</span>
                          <span className="font-medium">{person.verfügbareStunden}h</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              person.status === 'overbooked' 
                                ? 'bg-gradient-to-r from-orange-400 to-red-500' 
                                : person.status === 'underbooked'
                                  ? 'bg-gradient-to-r from-red-400 to-red-500'
                                  : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                            }`}
                            style={{ width: `${Math.min(person.auslastung, 100)}%` }}
                          />
                        </div>
                        
                        {person.auslastung > 100 && (
                          <div className="text-xs text-orange-700 font-medium">
                            ⚠️ Überbucht um {Math.round(person.auslastung - 100)}%
                          </div>
                        )}
                        {person.status === 'underbooked' && person.gebuchteStunden > 0 && (
                          <div className="text-xs text-red-700 font-medium">
                            📉 Unterausgelastet
                          </div>
                        )}
                        {person.gebuchteStunden === 0 && (
                          <div className="text-xs text-gray-500 font-medium">
                            💤 Nicht zugewiesen
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {workloadData.length === 0 ? "Keine Auslastungsdaten verfügbar." : "Keine Personen entsprechen den Filterkriterien."}
                </div>
              )}
          </CollapsibleSection>

          {/* Tabellarische Übersicht */}
          <CollapsibleSection title="Tabellarische Übersicht der Auslastung" defaultOpen={false}>
            {tableData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        Anzahl Produkte
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        Zugeordnete Datenprodukte (Rollen)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {tableData.map((person, index) => (
                      <tr key={person.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {person["Anzahl Produkte"] > 3 && (
                              <span
                                className="text-red-500"
                                title="Hohe Auslastung"
                              >
                                ❗️
                              </span>
                            )}
                            <span className="text-gray-900">{person.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            person["Anzahl Produkte"] > 3 
                              ? 'bg-red-100 text-red-700' 
                              : person["Anzahl Produkte"] > 1 
                                ? 'bg-yellow-100 text-yellow-700' 
                                : 'bg-green-100 text-green-700'
                          }`}>
                            {person["Anzahl Produkte"]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {person.produktDetails.length > 0 ? (
                            <div className="space-y-1">
                              {person.produktDetails.map((pd, idx) => (
                                <div key={idx} className="text-xs bg-gray-50 px-2 py-1 rounded">
                                  <span className="font-medium text-gray-900">{pd.name}</span>
                                  <span className="text-gray-600 ml-1">({pd.rollen})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs italic text-gray-500">
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
              <div className="text-center py-12 text-gray-500">
                Keine Daten vorhanden.
              </div>
            )}
          </CollapsibleSection>

          {/* Grafische Auswertungen */}
          <CollapsibleSection title="Grafische Auswertungen" defaultOpen={false}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Personen-Auslastung
                  </h3>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-inner">
                    {chartDataPersonen.length > 0 ? (
                      <ResponsiveContainer width="100%" height={personenChartHeight}>
                        <BarChart
                          data={chartDataPersonen}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
                          barCategoryGap={10}
                        >
                          <CartesianGrid strokeDasharray="none" stroke="#e2e8f0" strokeWidth={1} />
                          <XAxis 
                            type="number" 
                            allowDecimals={false} 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                          />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={150}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            interval={0}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                          />
                          <Bar 
                            dataKey="Anzahl Produkte" 
                            radius={[0, 8, 8, 0]}
                            animationBegin={0}
                            animationDuration={1500}
                            animationEasing="ease-out"
                          >
                            {chartDataPersonen.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.fill === '#ef4444' ? '#f87171' : '#3b82f6'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-gray-500 py-10">Keine Daten.</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Datenprodukt-Besetzung
                  </h3>
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-inner">
                    {produktBesetzungData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                          data={produktBesetzungData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="none" stroke="#e2e8f0" strokeWidth={1} />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10, angle: -45, textAnchor: "end", fill: '#64748b' }}
                            height={80}
                            interval={0}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis 
                            allowDecimals={false} 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                          />
                          <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "rgba(16, 185, 129, 0.1)" }}
                          />
                          <Bar 
                            dataKey="Anzahl Personen" 
                            fill="#10b981" 
                            radius={[8, 8, 0, 0]}
                            animationBegin={200}
                            animationDuration={1500}
                            animationEasing="ease-out"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-gray-500 py-10">Keine Daten.</p>
                    )}
                  </div>
                </div>
              </div>
          </CollapsibleSection>

          {/* Skill-Analyse */}
          <CollapsibleSection title="Skill-Analyse" defaultOpen={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Häufigkeit der Skills
                </h3>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 shadow-inner">
                  {skillUsageCount.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {skillUsageCount.map((skill) => (
                        <div
                          key={skill.name}
                          className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: skill.color }}
                            />
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {skill.name}
                            </span>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-white text-gray-700 shadow-sm ml-2 flex-shrink-0">
                            {skill.Anzahl}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Keine Skills zugewiesen.</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Nicht zugewiesene Skills
                </h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  {unassignedSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {unassignedSkills.map((skill) => (
                        <span
                          key={skill.id}
                          className="inline-flex items-center px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold border border-orange-200"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-green-600 text-2xl mb-2">✅</div>
                      <p className="text-sm text-gray-600">
                        Alle Skills sind mindestens einer Person zugewiesen.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CollapsibleSection>

        </div>
      </div>
    </div>
  );
};
