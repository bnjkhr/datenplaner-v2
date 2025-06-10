// src/pages/SkillsVerwaltung.js
import React, { useState } from 'react';
import { useData } from '../context/DataProvider';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export const SkillsVerwaltung = () => {
    // setError wird jetzt auch aus dem Context geholt, um Fehler zurücksetzen zu können
    const { skills, fuegeSkillHinzu, aktualisiereSkill, loescheSkill, loading, error, setError } = useData();
    
    const [neuerSkillName, setNeuerSkillName] = useState('');
    const [neueSkillFarbe, setNeueSkillFarbe] = useState('#e0e7ff'); // Ein Standard-Indigo-Ton
    const [editingSkill, setEditingSkill] = useState(null); 
    const [skillToDelete, setSkillToDelete] = useState(null);

    const handleAddSkill = async (e) => {
        e.preventDefault();
        setError(null); // Alte Fehler zurücksetzen
        if (neuerSkillName) {
            await fuegeSkillHinzu(neuerSkillName, neueSkillFarbe);
            setNeuerSkillName('');
            setNeueSkillFarbe('#e0e7ff');
        }
    };

    const handleUpdateSkill = async () => {
        setError(null);
        if (editingSkill && editingSkill.name) {
            await aktualisiereSkill(editingSkill.id, editingSkill.name, editingSkill.color);
            setEditingSkill(null);
        }
    };

    // Diese Funktion setzt nur den State, um das Modal zu öffnen
    const handleDeleteInitiation = (skill) => {
        setError(null);
        setSkillToDelete(skill);
    };

    // Diese Funktion wird vom Modal aufgerufen und führt die Löschung aus
    const confirmDelete = async () => {
        if (skillToDelete) {
            const success = await loescheSkill(skillToDelete.id);
            // KORRIGIERT: Das Modal schließt nur, wenn der Vorgang erfolgreich war.
            // Ansonsten bleibt es offen und der Fehler aus dem DataProvider wird angezeigt.
            if (success) {
                setSkillToDelete(null);
            }
        }
    };

    if (loading) return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
    
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Skill-Verwaltung</h1>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}<button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3 font-bold">&times;</button></div>}
            
            <div className="mb-8 p-6 bg-white shadow-md rounded-lg">
                <form onSubmit={handleAddSkill} className="flex flex-wrap gap-4 items-end">
                    <div className="flex-grow">
                        <label htmlFor="neuer-skill" className="block text-sm font-medium text-gray-700">Neuer Skill</label>
                        <input id="neuer-skill" type="text" value={neuerSkillName} onChange={(e) => setNeuerSkillName(e.target.value)} placeholder="z.B. Python" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                         <label htmlFor="neue-farbe" className="block text-sm font-medium text-gray-700">Farbe</label>
                         <input id="neue-farbe" type="color" value={neueSkillFarbe} onChange={(e) => setNeueSkillFarbe(e.target.value)} className="mt-1 block w-24 h-10 p-1 border border-gray-300 rounded-md cursor-pointer"/>
                    </div>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700">Hinzufügen</button>
                </form>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill-Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farbe</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {skills.map(skill => (
                            <tr key={skill.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{editingSkill?.id === skill.id ? (<input type="text" value={editingSkill.name} onChange={(e) => setEditingSkill({...editingSkill, name: e.target.value})} className="block w-full px-2 py-1 border border-indigo-300 rounded-md" autoFocus />) : (<span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: skill.color, color: '#111827' }}>{skill.name}</span>)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{editingSkill?.id === skill.id ? (<input type="color" value={editingSkill.color} onChange={(e) => setEditingSkill({...editingSkill, color: e.target.value})} className="w-24 h-8 p-1 border rounded-md" />) : (<div className="w-8 h-8 rounded-full border" style={{ backgroundColor: skill.color }}></div>)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">{editingSkill?.id === skill.id ? (<> <button onClick={handleUpdateSkill} className="text-green-600 hover:text-green-900 mr-4">Speichern</button><button onClick={() => setEditingSkill(null)} className="text-gray-600 hover:text-gray-900">Abbrechen</button> </> ) : (<> <button onClick={() => setEditingSkill({ ...skill })} className="text-indigo-600 hover:text-indigo-900 mr-4">Bearbeiten</button><button onClick={() => handleDeleteInitiation(skill)} className="text-red-600 hover:text-red-900">Löschen</button> </> )}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmModal 
                isOpen={!!skillToDelete} 
                title="Skill löschen" 
                message={`Möchten Sie den Skill "${skillToDelete?.name}" wirklich löschen? Alle Zuweisungen zu Personen werden ebenfalls entfernt.`}
                onConfirm={confirmDelete} 
                onCancel={() => setSkillToDelete(null)} 
            />
        </div>
    );
};

export default SkillsVerwaltung;
