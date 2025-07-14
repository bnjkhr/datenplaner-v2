import React, { useState } from 'react';
import { useData } from '../context/DataProvider';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export const RollenVerwaltung = () => {
    const { rollen, personen, zuordnungen, fuegeRolleHinzu, aktualisiereRolle, loescheRolle, loading, error, setError } = useData();
    const [neueRolleName, setNeueRolleName] = useState('');
    const [editingRolle, setEditingRolle] = useState(null);
    const [rolleToDelete, setRolleToDelete] = useState(null);

    const handleAddRolle = async (e) => {
        e.preventDefault();
        setError(null);
        if (neueRolleName.trim()) {
            await fuegeRolleHinzu(neueRolleName.trim());
            setNeueRolleName('');
        }
    };

    const handleUpdateRolle = async () => {
        setError(null);
        if (editingRolle && editingRolle.name.trim()) {
            await aktualisiereRolle(editingRolle.id, editingRolle.name.trim());
            setEditingRolle(null);
        }
    };

    const handleDeleteInitiation = (rolle) => {
        setError(null);
        setRolleToDelete(rolle);
    };

    const confirmDelete = async () => {
        if (rolleToDelete) {
            const success = await loescheRolle(rolleToDelete.id);
            if (success) {
                setRolleToDelete(null);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ard-blue-600"></div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-ard-blue-50/30">
            <div className="container mx-auto px-6 py-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">Rollenverwaltung</h1>
                    <p className="text-gray-600">Verwalte Rollen und deren Zuweisungen</p>
                </div>

                {error && (
                    <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-800 px-6 py-4 rounded-xl mb-6" role="alert">
                        <div className="flex justify-between items-center">
                            <span>{error}</span>
                            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800 font-bold ml-4">
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                <div className="mb-6 p-4 bg-white shadow-md rounded-xl border border-gray-100">
                    <form onSubmit={handleAddRolle} className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="flex-grow">
                            <label htmlFor="neue-rolle" className="block text-sm font-medium text-gray-700 mb-1">
                                Neue Rolle hinzufügen
                            </label>
                            <input 
                                id="neue-rolle" 
                                type="text" 
                                value={neueRolleName} 
                                onChange={(e) => setNeueRolleName(e.target.value)} 
                                placeholder="z.B. Data Scientist" 
                                className="block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-ard-ard-blue-500 focus:border-ard-ard-blue-500 transition-all"
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="px-4 py-2 bg-gradient-to-r from-ard-blue-600 to-ard-blue-700 hover:from-ard-blue-700 hover:to-ard-blue-800 text-white rounded-lg shadow-md font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                        >
                            <span className="text-lg">+</span>
                            Hinzufügen
                        </button>
                    </form>
                </div>
                {rollen.length === 0 ? (
                    <div className="bg-white shadow-md rounded-xl border border-gray-100 text-center py-8 text-gray-500">
                        Noch keine Rollen angelegt.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rollen.map((rolle) => {
                            const assignedPersonIds = [...new Set(zuordnungen.filter(z => z.rolleId === rolle.id).map(z => z.personId))];
                            const assignedPeople = assignedPersonIds.map(id => personen.find(p => p.id === id)).filter(Boolean);
                            
                            return (
                                <div key={rolle.id} className="bg-white shadow-md rounded-xl border border-gray-100 p-4 hover:shadow-lg transition-all duration-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3 flex-grow">
                                            <div className="w-6 h-6 rounded bg-gradient-to-r from-indigo-400 to-purple-400 flex-shrink-0"></div>
                                            
                                            {editingRolle?.id === rolle.id ? (
                                                <input 
                                                    type="text" 
                                                    value={editingRolle.name} 
                                                    onChange={(e) => setEditingRolle({...editingRolle, name: e.target.value})} 
                                                    className="flex-grow px-2 py-1 text-sm border border-ard-blue-300 rounded focus:ring-1 focus:ring-ard-ard-blue-500 focus:border-ard-ard-blue-500" 
                                                    autoFocus 
                                                />
                                            ) : (
                                                <span className="font-semibold text-gray-900 text-sm">{rolle.name}</span>
                                            )}
                                        </div>
                                        
                                        <div className="flex gap-1">
                                            {editingRolle?.id === rolle.id ? (
                                                <>
                                                    <button 
                                                        onClick={handleUpdateRolle} 
                                                        className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-all"
                                                        title="Speichern"
                                                    >
                                                        ✓
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingRolle(null)} 
                                                        className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-all"
                                                        title="Abbrechen"
                                                    >
                                                        ✕
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button 
                                                        onClick={() => setEditingRolle({ ...rolle })} 
                                                        className="p-1 text-ard-blue-600 hover:text-ard-blue-700 hover:bg-ard-blue-50 rounded transition-all"
                                                        title="Bearbeiten"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteInitiation(rolle)} 
                                                        className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                                        title="Löschen"
                                                    >
                                                        🗑️
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="border-t border-gray-100 pt-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                Zugewiesen an ({assignedPeople.length})
                                            </span>
                                        </div>
                                        
                                        {assignedPeople.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {assignedPeople.map((person) => (
                                                    <span 
                                                        key={person.id}
                                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
                                                    >
                                                        {person.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">
                                                Nicht zugewiesen
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <ConfirmModal 
                    isOpen={!!rolleToDelete} 
                    title="Rolle löschen" 
                    message={`Möchten Sie die Rolle "${rolleToDelete?.name}" wirklich löschen?`} 
                    onConfirm={confirmDelete} 
                    onCancel={() => setRolleToDelete(null)}
                />
            </div>
        </div>
    );
};
