// src/pages/DatenproduktVerwaltung.js
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataProvider';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export const DatenproduktVerwaltung = () => {
  const { 
    datenprodukte, erstelleDatenprodukt, aktualisiereDatenprodukt, loescheDatenprodukt, 
    loading, error, personen, rollen, 
    weisePersonDatenproduktRolleZu, zuordnungen, entfernePersonVonDatenproduktRolle 
  } = useData();

  const [showProduktForm, setShowProduktForm] = useState(false);
  const [editingProdukt, setEditingProdukt] = useState(null); 
  const [name, setName] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [status, setStatus] = useState('In Planung');
  const [formError, setFormError] = useState('');
  const [selectedProduktForAssignment, setSelectedProduktForAssignment] = useState(null);
  const [assignPersonId, setAssignPersonId] = useState('');
  const [assignRolleId, setAssignRolleId] = useState('');
  const [assignmentError, setAssignmentError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [produktToDelete, setProduktToDelete] = useState(null);

  useEffect(() => {
    if (editingProdukt) {
        setName(editingProdukt.name);
        setBeschreibung(editingProdukt.beschreibung || ''); 
        setStatus(editingProdukt.status);
    } else {
        setName('');
        setBeschreibung('');
        setStatus('In Planung');
    }
  }, [editingProdukt]);

  const handleProduktFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) { setFormError("Name ist ein Pflichtfeld."); return; }
    const produktData = { name: name.trim(), beschreibung: beschreibung.trim(), status };
    let success = false;
    if (editingProdukt && editingProdukt.id) {
        success = await aktualisiereDatenprodukt(editingProdukt.id, produktData);
    } else {
        success = await erstelleDatenprodukt(produktData);
    }
    if (success) { setShowProduktForm(false); setEditingProdukt(null); } 
    else { setFormError('Fehler beim Speichern des Datenprodukts.'); }
  };
  
  const handleOpenProduktForm = (produkt = null) => { setFormError(''); setEditingProdukt(produkt); setShowProduktForm(true); };
  const handleDeleteDatenproduktInitiation = (produkt) => { setProduktToDelete(produkt); setShowDeleteModal(true); };
  const confirmDeleteDatenprodukt = async () => { if (produktToDelete) { await loescheDatenprodukt(produktToDelete.id); } setShowDeleteModal(false); setProduktToDelete(null); };

  const statusOptionen = ["In Planung", "In Entwicklung", "Live", "Archiviert", "On Hold / Pausiert"];

  const handleAssignRoleSubmit = async (e) => {
    e.preventDefault();
    setAssignmentError('');
    if (!selectedProduktForAssignment || !assignPersonId || !assignRolleId) { setAssignmentError("Bitte Person und Rolle auswählen."); return; }
    const resultId = await weisePersonDatenproduktRolleZu(assignPersonId, selectedProduktForAssignment.id, assignRolleId);
    if (resultId) { setAssignPersonId(''); setAssignRolleId(''); } 
    else { setAssignmentError('Fehler bei der Zuweisung.'); }
  };
  
  const getPersonName = (personId) => personen.find(p => p.id === personId)?.name || '...';
  const getRolleName = (rolleId) => rollen.find(r => r.id === rolleId)?.name || '...';

  const sortedPersonen = [...personen].sort((a, b) => a.name.localeCompare(b.name, 'de'));

  if (loading) return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (error) return <p className="text-center text-red-500 py-8">{error}</p>; 

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4"><h1 className="text-3xl font-bold text-gray-800">Datenproduktverwaltung</h1><button onClick={() => handleOpenProduktForm()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md">+ Neues Datenprodukt</button></div>
        {showProduktForm && ( <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-40 p-4" onClick={() => {setShowProduktForm(false); setEditingProdukt(null);}}><div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}><form onSubmit={handleProduktFormSubmit} className="space-y-4"><h2 className="text-2xl font-semibold text-gray-700 mb-4">{editingProdukt ? 'Datenprodukt bearbeiten' : 'Neues Datenprodukt erstellen'}</h2>{formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}<div><label htmlFor="dp-form-name" className="block text-sm">Name</label><input id="dp-form-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border rounded-md p-2"/></div><div><label htmlFor="dp-form-beschreibung" className="block text-sm">Beschreibung</label><textarea id="dp-form-beschreibung" value={beschreibung} onChange={e => setBeschreibung(e.target.value)} rows="3" className="mt-1 block w-full border rounded-md p-2"></textarea></div><div><label htmlFor="dp-form-status" className="block text-sm">Status</label><select id="dp-form-status" value={status} onChange={e => setStatus(e.target.value)} className="mt-1 block w-full border rounded-md p-2">{statusOptionen.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div><div className="flex justify-end space-x-3 pt-3"><button type="button" onClick={() => {setShowProduktForm(false); setEditingProdukt(null);}} className="px-4 py-2 border rounded-md">Abbrechen</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">{editingProdukt ? 'Speichern' : 'Erstellen'}</button></div></form></div></div> )}
        <ConfirmModal isOpen={showDeleteModal} title="Datenprodukt löschen" message={`Möchten Sie "${produktToDelete?.name}" wirklich löschen?`} onConfirm={confirmDeleteDatenprodukt} onCancel={() => setShowDeleteModal(false)}/>
        {datenprodukte.length === 0 && !loading && <p className="text-center text-gray-500 py-8">Noch keine Datenprodukte erfasst.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{datenprodukte.map(dp => (<div key={dp.id} className="bg-white shadow-lg rounded-xl p-6 flex flex-col justify-between"><div><h3 className="text-xl font-bold text-indigo-700 mb-2 break-words">{dp.name}</h3><p className="text-sm mb-1">Status: <span className="font-semibold">{dp.status}</span></p><p className="text-sm mb-3 line-clamp-3" title={dp.beschreibung}>{dp.beschreibung || "Keine Beschreibung"}</p><div className="mb-3"><h4 className="text-sm font-semibold mb-1">Team:</h4>{zuordnungen.filter(z => z.datenproduktId === dp.id).length > 0 ? ( <ul className="list-none space-y-1">{zuordnungen.filter(z => z.datenproduktId === dp.id).map(zuordnung => (<li key={zuordnung.id} className="text-xs bg-gray-100 p-2 rounded-md flex justify-between items-center"><span>{getPersonName(zuordnung.personId)} ({getRolleName(zuordnung.rolleId)})</span><button onClick={() => entfernePersonVonDatenproduktRolle(zuordnung.id)} className="text-red-400 hover:text-red-600 text-xs ml-2 p-0.5" title="Zuweisung entfernen">&times;</button></li>))}</ul> ) : (<p className="text-xs text-gray-500">Kein Team zugewiesen.</p>)}</div></div><div className="mt-auto pt-4 border-t flex flex-wrap gap-2 justify-end"><button onClick={() => {setSelectedProduktForAssignment(dp); setAssignmentError('');}} className="text-sm text-green-600 hover:text-green-800">Team zuweisen</button><button onClick={() => handleOpenProduktForm(dp)} className="text-sm text-indigo-600 hover:text-indigo-800">Bearbeiten</button><button onClick={() => handleDeleteDatenproduktInitiation(dp)} className="text-sm text-red-500 hover:text-red-700">Löschen</button></div></div>))}</div>
        {selectedProduktForAssignment && ( <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={() => setSelectedProduktForAssignment(null)}><div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}><h3 className="text-xl font-semibold mb-4">Team für "{selectedProduktForAssignment.name}" verwalten</h3>{assignmentError && <p className="text-red-500 text-sm mb-3">{assignmentError}</p>}<form onSubmit={handleAssignRoleSubmit} className="space-y-4"><div><label htmlFor="assign-person" className="block text-sm">Person</label><select id="assign-person" value={assignPersonId} onChange={e => setAssignPersonId(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md"><option value="">Person auswählen</option>{sortedPersonen.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div><label htmlFor="assign-role" className="block text-sm">Rolle</label><select id="assign-role" value={assignRolleId} onChange={e => setAssignRolleId(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md"><option value="">Rolle auswählen</option>{rollen.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div><div className="flex justify-end space-x-3 pt-3"><button type="button" onClick={() => setSelectedProduktForAssignment(null)} className="px-4 py-2 border rounded-md">Abbrechen</button><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">Zuweisen</button></div></form></div></div> )}
    </div>
  );
};

// ==========================================================

// src/pages/RollenVerwaltung.js
import React, { useState } from 'react';
import { useData } from '../context/DataProvider';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export const RollenVerwaltung = () => {
    const { rollen, personen, zuordnungen, fuegeRolleHinzu, aktualisiereRolle, loescheRolle, loading, error } = useData();
    const [neueRolleName, setNeueRolleName] = useState('');
    const [editingRolle, setEditingRolle] = useState(null);
    const [rolleToDelete, setRolleToDelete] = useState(null);

    const handleAddRolle = async (e) => { e.preventDefault(); if (neueRolleName) { await fuegeRolleHinzu(neueRolleName); setNeueRolleName(''); } };
    const handleUpdateRolle = async () => { if (editingRolle && editingRolle.name) { await aktualisiereRolle(editingRolle.id, editingRolle.name); setEditingRolle(null); } };
    const handleDeleteRolle = async () => { if(rolleToDelete) { await loescheRolle(rolleToDelete.id); setRolleToDelete(null); } };

    if (loading) return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
    
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Rollenverwaltung</h1>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
            <div className="mb-8 p-6 bg-white shadow-md rounded-lg">
                <form onSubmit={handleAddRolle} className="flex gap-4 items-end">
                    <div className="flex-grow">
                        <label htmlFor="neue-rolle" className="block text-sm font-medium text-gray-700">Neue Rolle hinzufügen</label>
                        <input id="neue-rolle" type="text" value={neueRolleName} onChange={(e) => setNeueRolleName(e.target.value)} placeholder="z.B. Data Scientist" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700">Hinzufügen</button>
                </form>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rollenname</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zugewiesen an</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rollen.map(rolle => {
                            const assignedPeople = zuordnungen.filter(z => z.rolleId === rolle.id).map(z => personen.find(p => p.id === z.personId)).filter(p => p);
                            return (
                                <tr key={rolle.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{editingRolle?.id === rolle.id ? ( <input type="text" value={editingRolle.name} onChange={(e) => setEditingRolle({...editingRolle, name: e.target.value})} className="block w-full px-2 py-1 border border-indigo-300 rounded-md" autoFocus/> ) : ( <div className="text-sm text-gray-900">{rolle.name}</div> )}</td>
                                    <td className="px-6 py-4"><div className="flex flex-wrap gap-1">{assignedPeople.length > 0 ? ( assignedPeople.map(p => (<span key={p.id} className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full">{p.name}</span>)) ) : (<span className="text-xs text-gray-400 italic">Nicht zugewiesen</span>)}</div></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">{editingRolle?.id === rolle.id ? ( <> <button onClick={handleUpdateRolle} className="text-green-600 hover:text-green-900 mr-4">Speichern</button><button onClick={() => setEditingRolle(null)} className="text-gray-600 hover:text-gray-900">Abbrechen</button> </> ) : ( <> <button onClick={() => setEditingRolle({ ...rolle })} className="text-indigo-600 hover:text-indigo-900 mr-4">Bearbeiten</button><button onClick={() => setRolleToDelete(rolle)} className="text-red-600 hover:text-red-900">Löschen</button> </> )}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <ConfirmModal isOpen={!!rolleToDelete} title="Rolle löschen" message={`Möchten Sie die Rolle "${rolleToDelete?.name}" wirklich löschen?`} onConfirm={handleDeleteRolle} onCancel={() => setRolleToDelete(null)}/>
        </div>
    );
};

// ==========================================================

// src/pages/Auswertungen.js
import React from 'react';
import { useData } from '../context/DataProvider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export const Auswertungen = () => {
    const { personen, datenprodukte, zuordnungen, rollen, skills, loading, error } = useData();

    if (loading) return <div className="flex justify-center items-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div><p className="ml-3 text-gray-500">Lade Auswertungsdaten...</p></div>;
    if (error) return <p className="text-center text-red-500 py-8">Fehler beim Laden der Daten: {error}</p>;

    // Datenaufbereitung für alle Auswertungen
    const auswertungsDaten = personen.map(person => {
        const personAssignments = zuordnungen.filter(z => z.personId === person.id);
        const uniqueDatenproduktIds = [...new Set(personAssignments.map(z => z.datenproduktId))];
        const anzahlProdukte = uniqueDatenproduktIds.length;
        const produktDetails = uniqueDatenproduktIds.map(dpId => {
            const produkt = datenprodukte.find(dp => dp.id === dpId);
            const rollenInProdukt = personAssignments.filter(pa => pa.datenproduktId === dpId).map(pa => rollen.find(r => r.id === pa.rolleId)?.name).filter(Boolean).join(', ');
            return { name: produkt ? produkt.name : 'Unbekanntes Produkt', rollen: rollenInProdukt || 'Keine Rolle zugewiesen' };
        }).filter(p => p.name !== 'Unbekanntes Produkt');

        return { id: person.id, name: person.name, email: person.email, "Anzahl Produkte": anzahlProdukte, produktDetails: produktDetails, fill: anzahlProdukte > 3 ? '#ef4444' : '#4f46e5' };
    });

    const tableData = [...auswertungsDaten].sort((a, b) => a.name.localeCompare(b.name, 'de'));
    const chartDataPersonen = [...auswertungsDaten].sort((a, b) => b["Anzahl Produkte"] - a["Anzahl Produkte"]);

    const produktBesetzungData = datenprodukte.map(produkt => ({
        name: produkt.name,
        "Anzahl Personen": [...new Set(zuordnungen.filter(z => z.datenproduktId === produkt.id).map(z => z.personId))].length,
    })).sort((a, b) => b["Anzahl Personen"] - a["Anzahl Personen"]);

    const skillUsageCount = skills.map(skill => ({
        name: skill.name,
        "Anzahl": personen.filter(p => p.skillIds && p.skillIds.includes(skill.id)).length,
        color: skill.color
    })).sort((a, b) => b.Anzahl - a.Anzahl);

    const assignedSkillIds = new Set(personen.flatMap(p => p.skillIds || []));
    const unassignedSkills = skills.filter(skill => !assignedSkillIds.has(skill.id));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
            <div className="p-2 bg-white border border-gray-300 rounded shadow-lg">
                <p className="font-bold text-gray-800">{label}</p>
                <p className="text-sm" style={{ color: payload[0].color || payload[0].payload.fill }}>{`${payload[0].name}: ${payload[0].value}`}</p>
            </div>
            );
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
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase">Name</th><th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase">Anzahl Produkte</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase">Zugeordnete Datenprodukte (Rollen)</th></tr></thead>
                                <tbody className="bg-white divide-y divide-gray-200">{tableData.map((person) => (<tr key={person.id} className="hover:bg-gray-50"><td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{person["Anzahl Produkte"] > 3 && <span className="text-red-500 mr-2" title="Hohe Auslastung">❗️</span>}{person.name}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-center">{person["Anzahl Produkte"]}</td><td className="px-6 py-4 text-sm">{person.produktDetails.length > 0 ? ( <ul className="list-none space-y-1">{person.produktDetails.map((pd, idx) => (<li key={idx} className="text-xs"><strong>{pd.name}</strong> ({pd.rollen})</li>))}</ul> ) : (<span className="text-xs italic">Keinen Produkten zugewiesen</span>)}</td></tr>))}</tbody>
                            </table>
                        </div>
                    ) : <p className="text-center text-gray-500 py-10">Keine Daten vorhanden.</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="p-6 bg-white shadow-lg rounded-xl">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Personen-Auslastung (Grafik)</h2>
                    {chartDataPersonen.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}><BarChart data={chartDataPersonen} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 20 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} interval={0} /><Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(239, 246, 255, 0.5)'}}/><Legend /><Bar dataKey="Anzahl Produkte">{chartDataPersonen.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.fill} /> ))}</Bar></BarChart></ResponsiveContainer>
                    ) : <p className="text-center text-gray-500 py-10">Keine Daten vorhanden.</p>}
                </div>
                <div className="p-6 bg-white shadow-lg rounded-xl">
                     <h2 className="text-xl font-semibold text-gray-700 mb-4">Datenprodukt-Besetzung (Grafik)</h2>
                     {produktBesetzungData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}><BarChart data={produktBesetzungData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10, angle: -45, textAnchor: 'end' }} height={80} interval={0} /><YAxis allowDecimals={false} /><Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(239, 246, 255, 0.5)'}}/><Legend /><Bar dataKey="Anzahl Personen" fill="#818cf8" /></BarChart></ResponsiveContainer>
                     ) : <p className="text-center text-gray-500 py-10">Keine Daten vorhanden.</p>}
                </div>
            </div>

            <div className="p-6 bg-white shadow-lg rounded-xl">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Skill-Analyse</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-medium text-gray-600 mb-2">Häufigkeit der Skills</h3>
                        {skillUsageCount.length > 0 ? (
                            <ul className="space-y-2">{skillUsageCount.map(skill => (
                                <li key={skill.name} className="flex justify-between items-center text-sm pr-4">
                                    <span className="px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: skill.color, color: '#1f2937' }}>{skill.name}</span>
                                    <span className="font-bold text-gray-700">{skill.Anzahl}</span>
                                </li>
                            ))}</ul>
                        ) : <p className="text-sm text-gray-500">Keine Skills zugewiesen.</p>}
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-600 mb-2">Nicht zugewiesene Skills</h3>
                        {unassignedSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">{unassignedSkills.map(skill => (
                                <span key={skill.id} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-xs font-medium">{skill.name}</span>
                            ))}</div>
                        ) : <p className="text-sm text-gray-500">Alle Skills sind mindestens einer Person zugewiesen.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
