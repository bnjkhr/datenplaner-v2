// src/pages/SkillsVerwaltung.js
import React, { useState } from 'react';
import { useData } from '../context/DataProvider';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export const SkillsVerwaltung = () => {
    const { skills, personen, fuegeSkillHinzu, aktualisiereSkill, loescheSkill, loading, error, setError } = useData();
    
    const [neuerSkillName, setNeuerSkillName] = useState('');
    const [neueSkillFarbe, setNeueSkillFarbe] = useState('#4c84d4'); // Modern blue
    const [editingSkill, setEditingSkill] = useState(null); 
    const [skillToDelete, setSkillToDelete] = useState(null);

    const handleAddSkill = async (e) => {
        e.preventDefault();
        setError(null);
        if (neuerSkillName.trim()) {
            await fuegeSkillHinzu(neuerSkillName.trim(), neueSkillFarbe);
            setNeuerSkillName('');
            setNeueSkillFarbe('#4c84d4');
        }
    };

    const handleUpdateSkill = async () => {
        setError(null);
        if (editingSkill && editingSkill.name.trim()) {
            await aktualisiereSkill(editingSkill.id, editingSkill.name.trim(), editingSkill.color);
            setEditingSkill(null);
        }
    };

    const handleDeleteInitiation = (skill) => {
        setError(null);
        setSkillToDelete(skill);
    };

    const confirmDelete = async () => {
        if (skillToDelete) {
            const success = await loescheSkill(skillToDelete.id);
            if (success) {
                setSkillToDelete(null);
            }
        }
    };

    // Get persons with each skill
    const getSkillPersons = (skillId) => {
        return personen.filter(person => 
            person.skillIds && person.skillIds.includes(skillId)
        );
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">Skill-Verwaltung</h1>
                    <p className="text-gray-600">Verwalte Skills und deren Zuweisungen</p>
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
                    <form onSubmit={handleAddSkill} className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="flex-grow">
                            <label htmlFor="neuer-skill" className="block text-sm font-medium text-gray-700 mb-1">
                                Neuer Skill
                            </label>
                            <input 
                                id="neuer-skill" 
                                type="text" 
                                value={neuerSkillName} 
                                onChange={(e) => setNeuerSkillName(e.target.value)} 
                                placeholder="z.B. Python, React, Data Science" 
                                className="block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-ard-blue-500 focus:border-ard-blue-500 transition-all"
                            />
                        </div>
                        <div className="flex-shrink-0">
                            <label htmlFor="neue-farbe" className="block text-sm font-medium text-gray-700 mb-1">
                                Farbe
                            </label>
                            <input 
                                id="neue-farbe" 
                                type="color" 
                                value={neueSkillFarbe} 
                                onChange={(e) => setNeueSkillFarbe(e.target.value)} 
                                className="block w-12 h-10 p-1 border border-gray-200 rounded-lg cursor-pointer shadow-sm"
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

                {skills.length === 0 ? (
                    <div className="bg-white shadow-md rounded-xl border border-gray-100 text-center py-8 text-gray-500">
                        Noch keine Skills angelegt.
                    </div>
                ) : (
                    <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Skill</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Personen</th>
                                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">Anzahl</th>
                                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {skills.map((skill) => {
                                        const skillPersons = getSkillPersons(skill.id);
                                        
                                        return (
                                            <tr key={skill.id} className="hover:bg-gray-25 transition-colors">
                                                <td className="px-4 py-3">
                                                    {editingSkill?.id === skill.id ? (
                                                        <input 
                                                            type="text" 
                                                            value={editingSkill.name} 
                                                            onChange={(e) => setEditingSkill({...editingSkill, name: e.target.value})} 
                                                            className="block w-full px-2 py-1 text-sm border border-ard-blue-300 rounded focus:ring-1 focus:ring-ard-blue-500 focus:border-ard-blue-500" 
                                                            autoFocus 
                                                        />
                                                    ) : (
                                                        <span className="font-medium text-gray-900 text-sm">{skill.name}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {skillPersons.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {skillPersons.map((person) => (
                                                                <span 
                                                                    key={person.id}
                                                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                                                    style={{ 
                                                                        backgroundColor: skill.color, 
                                                                        color: '#1f2937'
                                                                    }}
                                                                >
                                                                    {person.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">
                                                            Niemand zugewiesen
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                                        {skillPersons.length}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {editingSkill?.id === skill.id ? (
                                                            <>
                                                                <button 
                                                                    onClick={handleUpdateSkill} 
                                                                    className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-all text-sm"
                                                                    title="Speichern"
                                                                >
                                                                    ✓
                                                                </button>
                                                                <button 
                                                                    onClick={() => setEditingSkill(null)} 
                                                                    className="p-1.5 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-all text-sm"
                                                                    title="Abbrechen"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button 
                                                                    onClick={() => setEditingSkill({ ...skill })} 
                                                                    className="p-1.5 text-ard-blue-600 hover:text-ard-blue-700 hover:bg-ard-blue-50 rounded transition-all text-sm"
                                                                    title="Bearbeiten"
                                                                >
                                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                                    </svg>
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteInitiation(skill)} 
                                                                    className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-all text-sm"
                                                                    title="Löschen"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <ConfirmModal 
                    isOpen={!!skillToDelete} 
                    title="Skill löschen" 
                    message={`Möchten Sie den Skill "${skillToDelete?.name}" wirklich löschen? Alle Zuweisungen zu Personen werden ebenfalls entfernt.`}
                    onConfirm={confirmDelete} 
                    onCancel={() => setSkillToDelete(null)} 
                />
            </div>
        </div>
    );
};

export default SkillsVerwaltung;
