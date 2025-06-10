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