import React from 'react';
import { useData } from '../context/DataProvider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export const Auswertungen = () => {
    const { personen, datenprodukte, zuordnungen, rollen, skills, loading, error } = useData();

    if (loading) return <div className="flex justify-center items-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div><p className="ml-3 text-gray-500">Lade Auswertungsdaten...</p></div>;
    if (error) return <p className="text-center text-red-500 py-8">Fehler beim Laden der Daten: {error}</p>;

    const auswertungsDaten = personen.map(person => {
        const personAssignments = zuordnungen.filter(z => z.personId === person.id);
        const uniqueDatenproduktIds = [...new Set(personAssignments.map(z => z.datenproduktId))];
        const anzahlProdukte = uniqueDatenproduktIds.length;
        const produktDetails = uniqueDatenproduktIds.map(dpId => {
            const produkt = datenprodukte.find(dp => dp.id === dpId);
            const rollenInProdukt = personAssignments.filter(pa => pa.datenproduktId === dpId).map(pa => rollen.find(r => r.id === pa.rolleId)?.name).filter(Boolean).join(', ');
            return { name: produkt ? produkt.name : 'Unbekanntes Produkt', rollen: rollenInProdukt || 'Keine Rolle zugewiesen' };
        }).filter(p => p.name !== 'Unbekanntes Produkt');
        return { id: person.id, name: person.name, "Anzahl Produkte": anzahlProdukte, produktDetails: produktDetails, fill: anzahlProdukte > 3 ? '#ef4444' : '#4f46e5' };
    });

    const tableData = [...auswertungsDaten].sort((a, b) => a.name.localeCompare(b.name, 'de'));
    const chartDataPersonen = [...auswertungsDaten].sort((a, b) => b["Anzahl Produkte"] - a["Anzahl Produkte"]);
    const produktBesetzungData = datenprodukte.map(produkt => ({ name: produkt.name, "Anzahl Personen": [...new Set(zuordnungen.filter(z => z.datenproduktId === produkt.id).map(z => z.personId))].length, })).sort((a, b) => b["Anzahl Personen"] - a["Anzahl Personen"]);
    const skillUsageCount = skills.map(skill => ({ name: skill.name, "Anzahl": personen.filter(p => p.skillIds && p.skillIds.includes(skill.id)).length, color: skill.color })).sort((a, b) => b.Anzahl - a.Anzahl);
    const assignedSkillIds = new Set(personen.flatMap(p => p.skillIds || []));
    const unassignedSkills = skills.filter(skill => !assignedSkillIds.has(skill.id));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (<div className="p-2 bg-white border border-gray-300 rounded shadow-lg"><p className="font-bold text-gray-800">{label}</p><p className="text-sm" style={{ color: payload[0].color || payload[0].payload.fill }}>{`${payload[0].name}: ${payload[0].value}`}</p></div>);
        }
        return null;
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-12">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Team-Auslastung</h1>
                <div className="p-6 bg-white shadow-lg rounded-xl">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Tabellarische Übersicht</h2>
                     {tableData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase">Name</th><th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase">Anzahl Produkte</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase">Zugeordnete Datenprodukte (Rollen)</th></tr></thead>
                                <tbody className="bg-white divide-y divide-gray-200">{tableData.map((person) => (<tr key={person.id} className="hover:bg-gray-50"><td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{person["Anzahl Produkte"] > 3 && <span className="text-red-500 mr-2" title="Hohe Auslastung">❗️</span>}{person.name}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-center">{person["Anzahl Produkte"]}</td><td className="px-6 py-4 text-sm">{person.produktDetails.length > 0 ? ( <ul className="list-none space-y-1">{person.produktDetails.map((pd, idx) => (<li key={idx} className="text-xs"><strong>{pd.name}</strong> ({pd.rollen})</li>))}</ul> ) : (<span className="text-xs italic">Keinen Produkten zugewiesen</span>)}</td></tr>))}</tbody>
                            </table>
                        </div>
                    ) : <p className="text-center text-gray-500 py-10">Keine Daten vorhanden.</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="p-6 bg-white shadow-lg rounded-xl"><h2 className="text-xl font-semibold text-gray-700 mb-4">Personen-Auslastung (Grafik)</h2>{chartDataPersonen.length > 0 ? (<ResponsiveContainer width="100%" height={400}><BarChart data={chartDataPersonen} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 20 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} interval={0} /><Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(239, 246, 255, 0.5)'}}/><Legend /><Bar dataKey="Anzahl Produkte">{chartDataPersonen.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.fill} /> ))}</Bar></BarChart></ResponsiveContainer>) : <p className="text-center text-gray-500 py-10">Keine Daten vorhanden.</p>}</div>
                <div className="p-6 bg-white shadow-lg rounded-xl"><h2 className="text-xl font-semibold text-gray-700 mb-4">Datenprodukt-Besetzung (Grafik)</h2>{produktBesetzungData.length > 0 ? (<ResponsiveContainer width="100%" height={400}><BarChart data={produktBesetzungData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10, angle: -45, textAnchor: 'end' }} height={80} interval={0} /><YAxis allowDecimals={false} /><Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(239, 246, 255, 0.5)'}}/><Legend /><Bar dataKey="Anzahl Personen" fill="#818cf8" /></BarChart></ResponsiveContainer>) : <p className="text-center text-gray-500 py-10">Keine Daten vorhanden.</p>}</div>
            </div>
            <div className="p-6 bg-white shadow-lg rounded-xl">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Skill-Analyse</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div><h3 className="text-lg font-medium text-gray-600 mb-2">Häufigkeit der Skills</h3>{skillUsageCount.length > 0 ? (<ul className="space-y-2">{skillUsageCount.map(skill => (<li key={skill.name} className="flex justify-between items-center text-sm pr-4"><span className="px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: skill.color, color: '#1f2937' }}>{skill.name}</span><span className="font-bold text-gray-700">{skill.Anzahl}</span></li>))}</ul>) : <p className="text-sm text-gray-500">Keine Skills zugewiesen.</p>}</div>
                    <div><h3 className="text-lg font-medium text-gray-600 mb-2">Nicht zugewiesene Skills</h3>{unassignedSkills.length > 0 ? (<div className="flex flex-wrap gap-2">{unassignedSkills.map(skill => (<span key={skill.id} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-xs font-medium">{skill.name}</span>))}</div>) : <p className="text-sm text-gray-500">Alle Skills sind mindestens einer Person zugewiesen.</p>}</div>
                </div>
            </div>
        </div>
    );
};
