import React, { useState } from 'react';
import { useData } from '../context/DataProvider';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { TagInput } from '../components/ui/TagInput';

// --- Helper-Funktion für konsistente Tag-Farben ---
const tagColors = [
  'bg-blue-200 text-blue-800 hover:bg-blue-300',
  'bg-green-200 text-green-800 hover:bg-green-300',
  'bg-yellow-200 text-yellow-800 hover:bg-yellow-300',
  'bg-pink-200 text-pink-800 hover:bg-pink-300',
  'bg-purple-200 text-purple-800 hover:bg-purple-300',
  'bg-indigo-200 text-indigo-800 hover:bg-indigo-300',
  'bg-teal-200 text-teal-800 hover:bg-teal-300',
  'bg-red-200 text-red-800 hover:bg-red-300',
  'bg-orange-200 text-orange-800 hover:bg-orange-300',
  'bg-cyan-200 text-cyan-800 hover:bg-cyan-300',
];

const getSkillColor = (skill) => {
  let hash = 0;
  for (let i = 0; i < skill.length; i++) {
    hash = skill.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % tagColors.length);
  return tagColors[index];
};

const PersonFormular = ({ personToEdit, onFormClose }) => {
  const { fuegePersonHinzu, aktualisierePerson } = useData();
  const [name, setName] = useState(personToEdit?.name || '');
  const [email, setEmail] = useState(personToEdit?.email || '');
  const [skills, setSkills] = useState(personToEdit?.skills || []);
  const [msTeamsEmail, setMsTeamsEmail] = useState(() => {
    if (personToEdit?.msTeamsLink) {
      const emailMatch = personToEdit.msTeamsLink.match(/users=([^&]+)/);
      return emailMatch ? emailMatch[1] : (personToEdit.email || '');
    }
    return personToEdit?.email || '';
  });
  const [formError, setFormError] = useState('');

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Bitte eine gültige E-Mail-Adresse eingeben.');
      return false;
    }
    if (name.trim().length < 2 || name.trim().length > 50) {
      setFormError('Der Name muss zwischen 2 und 50 Zeichen lang sein.');
      return false;
    }
    if (skills.some(skill => skill.length > 30)) {
      setFormError('Ein einzelner Skill darf nicht länger als 30 Zeichen sein.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); 
    setFormError('');
    if (!validateForm()) { return; }
    const finalMsTeamsLink = msTeamsEmail.trim() ? `msteams:/l/chat/0/0?users=${msTeamsEmail.trim()}` : '';
    const personData = { name: name.trim(), email: email.trim(), skills, msTeamsLink: finalMsTeamsLink };
    let success = false;
    if (personToEdit && personToEdit.id) { 
        success = await aktualisierePerson(personToEdit.id, personData); 
    } else { 
        const newId = await fuegePersonHinzu(personData); 
        success = !!newId; 
    }
    if (success) {
      if (!personToEdit) { setName(''); setEmail(''); setSkills([]); setMsTeamsEmail(''); }
      if (onFormClose) onFormClose();
    } else { 
        if (!formError) { setFormError('Fehler beim Speichern der Person.'); }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">{personToEdit ? 'Person bearbeiten' : 'Neue Person hinzufügen'}</h2>
      {formError && <p className="text-sm text-red-500 mb-4">{formError}</p>}
      <div><label htmlFor="person-name" className="block text-sm font-medium text-gray-700">Name</label><input id="person-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Max Mustermann" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/></div>
      <div><label htmlFor="person-email" className="block text-sm font-medium text-gray-700">E-Mail</label><input id="person-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="max.mustermann@firma.de" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/></div>
      <div><label htmlFor="msTeamsEmail" className="block text-sm font-medium text-gray-700">MS Teams E-Mail (für Chat-Link)</label><input id="msTeamsEmail" type="email" value={msTeamsEmail} onChange={e => setMsTeamsEmail(e.target.value)} placeholder="max.mustermann@firma.de" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/><p className="mt-1 text-xs text-gray-500">Aus dieser E-Mail wird der MS Teams Chat-Link generiert.</p></div>
      <div><label className="block text-sm font-medium text-gray-700">Skills</label><TagInput tags={skills} setTags={setSkills} placeholder="Skill hinzufügen und Enter drücken" /></div>
      <div className="flex justify-end space-x-3 pt-4">{onFormClose && (<button type="button" onClick={onFormClose} className="px-4 py-2 border rounded-md text-sm">Abbrechen</button>)}<button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700">{personToEdit ? 'Speichern' : 'Hinzufügen'}</button></div>
    </form>
  );
};

const PersonEintrag = ({ person, onEdit, onDeleteInitiation, onSkillClick }) => {
  const { name, email, skills, msTeamsLink } = person; 
  const { datenprodukte, zuordnungen, rollen } = useData();
  const personAssignments = zuordnungen.filter(z => z.personId === person.id).map(assignment => {
      const produkt = datenprodukte.find(dp => dp.id === assignment.datenproduktId);
      const rolleInProdukt = rollen.find(r => r.id === assignment.rolleId);
      return { produktName: produkt?.name || 'Unbekanntes Produkt', rolleName: rolleInProdukt?.name || 'Unbekannte Rolle', assignmentId: assignment.id, };
  }).filter(a => a.produktName !== 'Unbekanntes Produkt');

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl flex flex-col justify-between">
        <div><div className="flex justify-between items-start mb-2"><h3 className="text-xl font-bold text-indigo-700 break-words mr-2">{name}</h3>{msTeamsLink && (<a href={msTeamsLink} target="_blank" rel="noopener noreferrer" className="text-2xl" title="Chat in MS Teams starten">💬</a>)}</div>{email && (<div className="mb-3"><a href={`mailto:${email}`} className="text-sm text-gray-500 hover:text-indigo-600 break-all">{email}</a></div>)}{skills && skills.length > 0 && (<div className="mb-4"><p className="text-sm font-medium text-gray-600 mb-1">Skills:</p><div className="flex flex-wrap gap-2">{skills.map(skill => (<button key={skill} onClick={() => onSkillClick(skill)} className={`px-3 py-1 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${getSkillColor(skill)}`} title={`Nach Personen mit Skill "${skill}" filtern`}>{skill}</button>))}</div></div>)}{personAssignments.length > 0 && (<div className="mb-4"><p className="text-sm font-medium text-gray-600 mb-1">Arbeitet an:</p><ul className="list-none space-y-1">{personAssignments.map(a => (<li key={a.assignmentId} className="text-xs text-gray-700 bg-indigo-50 p-2 rounded-md"><strong>{a.produktName}</strong> ({a.rolleName})</li>))}</ul></div>)}</div><div className="mt-auto pt-4 flex justify-end space-x-3 border-t"><button onClick={() => onEdit(person)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Bearbeiten</button><button onClick={() => onDeleteInitiation(person)} className="text-sm text-red-500 hover:text-red-700 font-medium">Löschen</button></div>
    </div>
  );
};

const PersonenListe = ({ personenToDisplay, onEditPerson, onDeleteInitiation, onSkillClick }) => {
  const { loading, error } = useData(); 
  if (loading) return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (error) return <p className="text-center text-red-500 py-8">{error}</p>;
  if (personenToDisplay.length === 0) return <p className="text-center text-gray-500 py-8">Keine Personen gefunden.</p>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
        {personenToDisplay.map(person => (<PersonEintrag key={person.id} person={person} onEdit={onEditPerson} onDeleteInitiation={onDeleteInitiation} onSkillClick={onSkillClick} />))}
    </div>
  );
};

export const PersonenVerwaltung = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const { personen, loeschePerson } = useData(); 
  const [skillSearchTerm, setSkillSearchTerm] = useState('');

  const handleAddNewPerson = () => { setEditingPerson(null); setShowForm(true); };
  const handleEditPerson = (person) => { setEditingPerson(person); setShowForm(true); };
  const handleFormClose = () => { setShowForm(false); setEditingPerson(null); };
  const handleDeleteInitiation = (person) => { setPersonToDelete(person); setShowDeleteModal(true); };
  const confirmDelete = async () => { if (personToDelete) { await loeschePerson(personToDelete.id); } setShowDeleteModal(false); setPersonToDelete(null); };
  const cancelDelete = () => { setShowDeleteModal(false); setPersonToDelete(null); };
  const handleSkillClick = (skill) => { setSkillSearchTerm(skill); };
  const filteredPersonen = personen.filter(p => !skillSearchTerm || (p.skills && p.skills.some(s => s.toLowerCase().includes(skillSearchTerm.toLowerCase()))));

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Personenverwaltung</h1>
            <button onClick={handleAddNewPerson} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md"> + Neue Person </button>
        </div>
        <div className="mb-8 p-4 bg-white shadow rounded-lg">
            <label htmlFor="skill-search" className="block text-sm font-medium text-gray-700 mb-1">Nach Skill suchen:</label>
            <div className="flex gap-2">
                <input id="skill-search" type="text" placeholder="z.B. Python, Tableau..." value={skillSearchTerm} onChange={e => setSkillSearchTerm(e.target.value)} className="flex-grow mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"/>
                {skillSearchTerm && (<button onClick={() => setSkillSearchTerm('')} className="mt-1 px-4 py-2 border rounded-md text-sm">Filter löschen</button>)}
            </div>
        </div>
        {showForm && (
            <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-40 p-4" onClick={handleFormClose}>
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <PersonFormular personToEdit={editingPerson} onFormClose={handleFormClose} />
                </div>
            </div>
        )}
        <PersonenListe personenToDisplay={filteredPersonen} onEditPerson={handleEditPerson} onDeleteInitiation={handleDeleteInitiation} onSkillClick={handleSkillClick}/>
        <ConfirmModal isOpen={showDeleteModal} title="Person löschen" message={`Möchten Sie ${personToDelete?.name || 'diese Person'} wirklich löschen?`} onConfirm={confirmDelete} onCancel={cancelDelete}/>
    </div>
  );
};

export default PersonenVerwaltung;
