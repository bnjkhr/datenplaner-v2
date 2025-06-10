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