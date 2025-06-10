import React from 'react';
import { useData } from '../context/DataProvider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export const Auswertungen = () => {
    const { personen, datenprodukte, zuordnungen, rollen, loading, error } = useData();

    if (loading) return <div className="flex justify-center items-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div><p className="ml-3 text-gray-500">Lade Auswertungsdaten...</p></div>;
    if (error) return <p className="text-center text-red-500 py-8">Fehler beim Laden der Daten: {error}</p>;

    // --- Aufbereitung der Daten für beide Ansichten ---
    const auswertungsDaten = personen.map(person => {
        const personAssignments = zuordnungen.filter(z => z.personId === person.id);
        const uniqueDatenproduktIds = [...new Set(personAssignments.map(z => z.datenproduktId))];
        const anzahlProdukte = uniqueDatenproduktIds.length;
        
        const produktDetails = uniqueDatenproduktIds.map(dpId => {
            const produkt = datenprodukte.find(dp => dp.id === dpId);
            const rollenInProdukt = personAssignments
                .filter(pa => pa.datenproduktId === dpId)
                .map(pa => rollen.find(r => r.id === pa.rolleId)?.name)
                .filter(Boolean)
                .join(', ');
            return {
                name: produkt ? produkt.name : 'Unbekanntes Produkt',
                rollen: rollenInProdukt || 'Keine Rolle zugewiesen'
            };
        }).filter(p => p.name !== 'Unbekanntes Produkt');

        return {
            id: person.id,
            name: person.name,
            email: person.email,
            "Anzahl Produkte": anzahlProdukte,
            produktDetails: produktDetails,
            // --- NEU: Dynamische Farbe für das Diagramm ---
            fill: anzahlProdukte > 3 ? '#ef4444' : '#4f46e5', // Tailwind red-500 & indigo-600
        };
    });

    const tableData = [...auswertungsDaten].sort((a, b) => a.name.localeCompare(b.name, 'de'));
    const chartDataPersonen = [...auswertungsDaten].sort((a, b) => b["Anzahl Produkte"] - a["Anzahl Produkte"]);

    const produktBesetzungData = datenprodukte.map(produkt => {
        const anzahlPersonen = [...new Set(zuordnungen.filter(z => z.datenproduktId === produkt.id).map(z => z.personId))].length;
        return {
            name: produkt.name,
            "Anzahl Personen": anzahlPersonen,
        }
    }).sort((a, b) => b["Anzahl Personen"] - a["Anzahl Personen"]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
            <div className="p-2 bg-white border border-gray-300 rounded shadow-lg">
                <p className="font-bold text-gray-800">{label}</p>
                <p className="text-sm" style={{ color: payload[0].color }}>{`${payload[0].name}: ${payload[0].value}`}</p>
            </div>
            );
        }
        return null;
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Auswertungen</h1>
            
            {/* --- NEU: Tabellarische Übersicht --- */}
            <div className="p-6 bg-white shadow-lg rounded-xl mb-12">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Tabellarische Übersicht der Auslastung</h2>
                 {tableData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Anzahl Produkte</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zugeordnete Datenprodukte (Rollen)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tableData.map((person) => (
                                    <tr key={person.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {person["Anzahl Produkte"] > 3 && <span className="text-red-500 mr-2" title="Hohe Auslastung">❗️</span>}
                                            {person.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{person["Anzahl Produkte"]}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {person.produktDetails.length > 0 ? (
                                                <ul className="list-none space-y-1">{person.produktDetails.map((pd, idx) => (
                                                    <li key={idx} className="text-xs"><strong>{pd.name}</strong> ({pd.rollen})</li>
                                                ))}</ul>
                                            ) : (<span className="text-xs italic">Keinen Produkten zugewiesen</span>)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="text-center text-gray-500 py-10">Keine Daten vorhanden.</p>}
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-8">Grafische Auswertungen</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Diagramm 1: Personen-Auslastung */}
                <div className="p-6 bg-white shadow-lg rounded-xl">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Personen-Auslastung</h2>
                    <p className="text-sm text-gray-500 mb-6">Zeigt, an wie vielen Datenprodukten jede Person arbeitet.</p>
                    {chartDataPersonen.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={chartDataPersonen} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} interval={0} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(239, 246, 255, 0.5)'}}/>
                                <Legend />
                                <Bar dataKey="Anzahl Produkte">
                                    {/* --- NEU: Individuelle Farben für die Balken --- */}
                                    {chartDataPersonen.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-center text-gray-500 py-10">Keine Daten vorhanden.</p>}
                </div>

                {/* Diagramm 2: Datenprodukt-Besetzung */}
                <div className="p-6 bg-white shadow-lg rounded-xl">
                     <h2 className="text-xl font-semibold text-gray-700 mb-4">Datenprodukt-Besetzung</h2>
                     <p className="text-sm text-gray-500 mb-6">Zeigt, wie viele Personen auf jedem Datenprodukt arbeiten.</p>
                     {produktBesetzungData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                             <BarChart data={produktBesetzungData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, angle: -45, textAnchor: 'end' }} height={80} interval={0} />
                                <YAxis allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(239, 246, 255, 0.5)'}}/>
                                <Legend />
                                <Bar dataKey="Anzahl Personen" fill="#818cf8" />
                            </BarChart>
                        </ResponsiveContainer>
                     ) : <p className="text-center text-gray-500 py-10">Keine Daten vorhanden.</p>}
                </div>
            </div>
        </div>
    );
};
