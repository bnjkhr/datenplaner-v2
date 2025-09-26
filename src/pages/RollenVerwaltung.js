import React, { useState, useRef } from 'react';
import { useData } from '../context/DataProvider';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ColorPicker } from '../components/ui/ColorPicker';

export const RollenVerwaltung = () => {
    const { rollen, personen, zuordnungen, fuegeRolleHinzu, aktualisiereRolle, loescheRolle, fixDuplicateRoleColors, loading, error, setError } = useData();
    const [neueRolleName, setNeueRolleName] = useState('');
    const [editingRolle, setEditingRolle] = useState(null);
    const [rolleToDelete, setRolleToDelete] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [rolleToShowDetails, setRolleToShowDetails] = useState(null);
    const [isFixingColors, setIsFixingColors] = useState(false);
    const [fixColorMessage, setFixColorMessage] = useState('');

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

    const handleShowDetails = (rolle) => {
        setRolleToShowDetails(rolle);
        setShowDetailsModal(true);
    };

    const handleCloseDetails = () => {
        setShowDetailsModal(false);
        setRolleToShowDetails(null);
    };

    const handleEditRolle = (rolle) => {
        setEditingRolle({ ...rolle });
        setShowDetailsModal(false);
    };

    const handleFixDuplicateColors = async () => {
        setIsFixingColors(true);
        setFixColorMessage('');
        const result = await fixDuplicateRoleColors();
        setIsFixingColors(false);
        if (result) {
            setFixColorMessage(result.message);
            setTimeout(() => setFixColorMessage(''), 5000);
        }
    };

    const hasDuplicateColors = () => {
        const colorCounts = {};
        const rolesWithColors = rollen.filter(r => r.color);
        
        rolesWithColors.forEach(role => {
            colorCounts[role.color] = (colorCounts[role.color] || 0) + 1;
        });
        
        return Object.values(colorCounts).some(count => count > 1);
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

                {hasDuplicateColors() && (
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-xl mb-6" role="alert">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">⚠️</span>
                                <div>
                                    <div className="font-semibold">Doppelte Rollenfarben erkannt</div>
                                    <div className="text-sm text-yellow-700">Mehrere Rollen verwenden dieselbe Farbe. Klicke hier, um automatisch eindeutige Farben zuzuweisen.</div>
                                </div>
                            </div>
                            <button 
                                onClick={handleFixDuplicateColors}
                                disabled={isFixingColors}
                                className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                {isFixingColors ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Wird behoben...
                                    </>
                                ) : (
                                    <>
                                        <span>🎨</span>
                                        Farben korrigieren
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {fixColorMessage && (
                    <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 text-green-800 px-6 py-4 rounded-xl mb-6" role="alert">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">✅</span>
                            <div>
                                <div className="font-semibold">Rollenfarben korrigiert</div>
                                <div className="text-sm text-green-700">{fixColorMessage}</div>
                            </div>
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
                                className="block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-ard-blue-500 focus:border-ard-blue-500 transition-all"
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-lg shadow-md font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
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
                    <RollenListe 
                        rollen={rollen}
                        zuordnungen={zuordnungen}
                        personen={personen}
                        editingRolle={editingRolle}
                        setEditingRolle={setEditingRolle}
                        handleUpdateRolle={handleUpdateRolle}
                        handleDeleteInitiation={handleDeleteInitiation}
                        aktualisiereRolle={aktualisiereRolle}
                        onShowDetails={handleShowDetails}
                    />
                )}

                <ConfirmModal 
                    isOpen={!!rolleToDelete} 
                    title="Rolle löschen" 
                    message={`Möchten Sie die Rolle "${rolleToDelete?.name}" wirklich löschen?`} 
                    onConfirm={confirmDelete} 
                    onCancel={() => setRolleToDelete(null)}
                />

                <RolleDetailsModal
                    rolle={rolleToShowDetails}
                    isOpen={showDetailsModal}
                    onClose={handleCloseDetails}
                    onEdit={handleEditRolle}
                    onDeleteInitiation={handleDeleteInitiation}
                    aktualisiereRolle={aktualisiereRolle}
                />
            </div>
        </div>
    );
};

const RolleDetailsModal = ({ rolle, isOpen, onClose, onEdit, onDeleteInitiation, aktualisiereRolle }) => {
    const { datenprodukte, zuordnungen, personen, rollen } = useData();
    const [showColorPicker, setShowColorPicker] = useState(false);
    const colorButtonRef = useRef(null);

    if (!isOpen || !rolle) return null;

    const assignedPersonIds = [...new Set(zuordnungen.filter(z => z.rolleId === rolle.id).map(z => z.personId))];
    const assignedPeople = assignedPersonIds.map(id => personen.find(p => p.id === id)).filter(Boolean);

    const roleAssignments = zuordnungen
        .filter(z => z.rolleId === rolle.id)
        .map(assignment => {
            const produkt = datenprodukte.find(dp => dp.id === assignment.datenproduktId);
            const person = personen.find(p => p.id === assignment.personId);
            return {
                produktName: produkt?.name || "...",
                personName: person?.name || "...",
                assignmentId: assignment.id,
            };
        })
        .filter(a => a.produktName !== "..." && a.personName !== "...");

    const usedInProducts = [...new Set(roleAssignments.map(a => a.produktName))];

    const handleColorChange = async (newColor) => {
        await aktualisiereRolle(rolle.id, rolle.name, newColor);
        setShowColorPicker(false);
    };

    const usedColors = rollen.filter(r => r.id !== rolle.id).map(r => r.color).filter(Boolean);

    return (
        <div 
            className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <button
                                    ref={colorButtonRef}
                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                    className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors flex-shrink-0"
                                    style={{ backgroundColor: rolle.color || '#6B7280' }}
                                    title="Farbe ändern"
                                />
                                <ColorPicker
                                    currentColor={rolle.color}
                                    onColorChange={handleColorChange}
                                    usedColors={usedColors}
                                    isOpen={showColorPicker}
                                    onClose={() => setShowColorPicker(false)}
                                    buttonRef={colorButtonRef}
                                />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">{rolle.name}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => onEdit(rolle)}
                            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-lg transition-colors"
                        >
                            Bearbeiten
                        </button>
                        <button
                            onClick={() => onDeleteInitiation(rolle)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                            Löschen
                        </button>
                    </div>

                    {/* Role Statistics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                            <h3 className="text-sm font-semibold text-blue-800 mb-1">Personen zugewiesen</h3>
                            <p className="text-2xl font-bold text-blue-900">{assignedPeople.length}</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                            <h3 className="text-sm font-semibold text-green-800 mb-1">Verwendet in Produkten</h3>
                            <p className="text-2xl font-bold text-green-900">{usedInProducts.length}</p>
                        </div>
                    </div>

                    {/* Assigned People */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Zugewiesene Personen ({assignedPeople.length})
                        </h3>
                        {assignedPeople.length > 0 ? (
                            <div className="space-y-2">
                                {assignedPeople.map((person) => (
                                    <div 
                                        key={person.id}
                                        className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-3 rounded-lg border border-indigo-200"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="font-semibold text-indigo-800">{person.name}</span>
                                                {person.email && (
                                                    <div className="text-sm text-indigo-600">{person.email}</div>
                                                )}
                                            </div>
                                            <div className="text-xs text-indigo-700">
                                                {roleAssignments.filter(a => a.personName === person.name).length} Zuweisungen
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">Keine Personen zugewiesen</p>
                        )}
                    </div>

                    {/* Used in Data Products */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Verwendet in Datenprodukten ({usedInProducts.length})
                        </h3>
                        {usedInProducts.length > 0 ? (
                            <div className="space-y-2">
                                {usedInProducts.map((produktName) => {
                                    const produktAssignments = roleAssignments.filter(a => a.produktName === produktName);
                                    return (
                                        <div 
                                            key={produktName}
                                            className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-green-800">{produktName}</span>
                                                <span className="text-xs text-green-700">
                                                    {produktAssignments.length} Person{produktAssignments.length !== 1 ? 'en' : ''}
                                                </span>
                                            </div>
                                            <div className="text-sm text-green-600 mt-1">
                                                {produktAssignments.map(a => a.personName).join(', ')}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">In keinen Datenprodukten verwendet</p>
                        )}
                    </div>

                    {/* All Assignments */}
                    {roleAssignments.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                Alle Zuweisungen ({roleAssignments.length})
                            </h3>
                            <div className="space-y-2">
                                {roleAssignments.map((assignment, index) => (
                                    <div 
                                        key={assignment.assignmentId || index}
                                        className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200 flex items-center justify-between"
                                    >
                                        <div>
                                            <span className="font-semibold text-gray-800">{assignment.personName}</span>
                                            <span className="text-gray-600 mx-2">→</span>
                                            <span className="text-gray-700">{assignment.produktName}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const RolleKarte = ({ 
    rolle, 
    zuordnungen, 
    personen, 
    rollen,
    editingRolle, 
    setEditingRolle, 
    handleUpdateRolle, 
    handleDeleteInitiation,
    aktualisiereRolle,
    onShowDetails
}) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const colorButtonRef = useRef(null);
    
    const assignedPersonIds = [...new Set(zuordnungen.filter(z => z.rolleId === rolle.id).map(z => z.personId))];
    const assignedPeople = assignedPersonIds.map(id => personen.find(p => p.id === id)).filter(Boolean);
    
    const handleColorChange = async (newColor) => {
        await aktualisiereRolle(rolle.id, rolle.name, newColor);
    };
    
    const usedColors = rollen.filter(r => r.id !== rolle.id).map(r => r.color).filter(Boolean);
    
    return (
        <div className="bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-lg border border-gray-200 hover:border-gray-300 overflow-hidden">
            {/* Kompakte Ansicht */}
            <div 
                className="p-4 cursor-pointer"
                onClick={() => onShowDetails(rolle)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative">
                            <button
                                ref={colorButtonRef}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowColorPicker(!showColorPicker);
                                }}
                                className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors flex-shrink-0"
                                style={{ backgroundColor: rolle.color || '#6B7280' }}
                                title="Farbe ändern"
                            />
                            <ColorPicker
                                currentColor={rolle.color}
                                onColorChange={handleColorChange}
                                usedColors={usedColors}
                                isOpen={showColorPicker}
                                onClose={() => setShowColorPicker(false)}
                                buttonRef={colorButtonRef}
                            />
                        </div>
                        
                        {editingRolle?.id === rolle.id ? (
                            <input 
                                type="text" 
                                value={editingRolle.name} 
                                onChange={(e) => setEditingRolle({...editingRolle, name: e.target.value})} 
                                className="flex-grow px-2 py-1 text-sm border border-ard-blue-300 rounded focus:ring-1 focus:ring-ard-blue-500 focus:border-ard-blue-500" 
                                autoFocus 
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 break-words leading-tight">{rolle.name}</h3>
                                <div className="text-xs text-gray-500 mt-1">
                                    {assignedPeople.length} Person{assignedPeople.length !== 1 ? 'en' : ''} zugewiesen
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                        {editingRolle?.id === rolle.id ? (
                            <>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateRolle();
                                    }}
                                    className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-all"
                                    title="Speichern"
                                >
                                    ✓
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingRolle(null);
                                    }}
                                    className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-all"
                                    title="Abbrechen"
                                >
                                    ✕
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingRolle({ ...rolle });
                                    }}
                                    className="inline-flex items-center justify-center w-7 h-7 text-ard-blue-600 hover:bg-ard-blue-50 rounded-md transition-colors"
                                    title="Bearbeiten"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteInitiation(rolle);
                                    }}
                                    className="inline-flex items-center justify-center w-7 h-7 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    title="Löschen"
                                >
                                    <span className="text-sm">🗑️</span>
                                </button>
                                
                                {/* Info-Indikator für Details */}
                                <div className="text-gray-400 transition-colors hover:text-gray-600">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const RollenListe = ({ 
    rollen, 
    zuordnungen, 
    personen, 
    editingRolle, 
    setEditingRolle, 
    handleUpdateRolle, 
    handleDeleteInitiation,
    aktualisiereRolle,
    onShowDetails
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {rollen.map((rolle) => (
                <RolleKarte
                    key={rolle.id}
                    rolle={rolle}
                    rollen={rollen}
                    zuordnungen={zuordnungen}
                    personen={personen}
                    editingRolle={editingRolle}
                    setEditingRolle={setEditingRolle}
                    handleUpdateRolle={handleUpdateRolle}
                    handleDeleteInitiation={handleDeleteInitiation}
                    aktualisiereRolle={aktualisiereRolle}
                    onShowDetails={onShowDetails}
                />
            ))}
        </div>
    );
};