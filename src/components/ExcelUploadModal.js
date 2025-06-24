import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useData } from '../context/DataProvider';

export const ExcelUploadModal = ({ isOpen, onClose }) => {
const { fuegePersonenImBatchHinzu, fuegeSkillHinzu, skills: allSkills, personen, setError, error } = useData();  const [parsedData, setParsedData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);
  

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setParsedData([]);
    setUploadSuccess(false);
    setFileName(file.name);

    const reader = new FileReader();
    
    reader.onload = async (event) => {
    const existingEmails = new Set(personen.map(p => p.email.toLowerCase()));  
      
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        // Skill-Namen → Skill-Objekt-Map
        const skillMap = {};
        allSkills.forEach(skill => {
          skillMap[skill.name.toLowerCase()] = skill;
        });
const existingEmails = new Set(personen.map(p => p.email.toLowerCase()));
        const neuePersonen = [];

        for (const row of json) {
  const name = row['Name'];
  const email = row['Email'];

  if (!email || existingEmails.has(email.toLowerCase())) {
  continue; // doppelte oder ungültige E-Mail → überspringen
}

          const skillsRaw = row['Skills (kommagetrennt)'] || '';
          const teamsMail = row['MS Teams Email'] || email;
          const teamsLink = teamsMail ? `msteams:/l/chat/0/0?users=${teamsMail.trim()}` : '';

const seen = new Set();
const skillNames = [];

for (const rawSkill of skillsRaw.split(',')) {
  const cleaned = rawSkill.trim();
  const lower = cleaned.toLowerCase();
  if (cleaned && !seen.has(lower)) {
    seen.add(lower);
    skillNames.push(cleaned); // Bewahre Original-Schreibweise
  }
}          const skillIds = [];

          for (const skillName of skillNames) {
            const skillKey = skillName.toLowerCase();
            if (skillMap[skillKey]) {
              skillIds.push(skillMap[skillKey].id);
            } else {
              // Neuen Skill anlegen
              const neueSkill = await fuegeSkillHinzu(skillName);
              if (neueSkill?.id) {
                skillMap[skillKey] = neueSkill;
                skillIds.push(neueSkill.id);
              }
            }
          }

          neuePersonen.push({
            name,
            email,
            skillIds,
            msTeamsLink: teamsLink,
          });
        }

        setParsedData(neuePersonen);
      } catch (err) {
        console.error("Fehler beim Parsen:", err.message, err.stack);
alert("Fehler beim Parsen:\n" + err.message);
        setError("Fehler beim Parsen der Datei. Stelle sicher, dass es eine gültige .xlsx oder .csv-Datei ist.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
  setIsUploading(true);
  setError(null);
  setUploadSuccess(false);

  const anzahl = parsedData.length;
  const success = await fuegePersonenImBatchHinzu(parsedData);

  if (success) {
    setUploadSuccess(true);
    setParsedData([]);
    setFileName('');
    alert(`${anzahl} Personen erfolgreich importiert.`);
    setTimeout(onClose, 2000);
  }

  setIsUploading(false);
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Personen per Excel importieren</h2>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-6 text-sm text-blue-800">
                <h3 className="font-bold mb-2">Anleitung & Format</h3>
                <p>Laden Sie eine Excel-Datei (.xlsx) hoch. Die erste Zeile muss die Spaltenüberschriften enthalten. Erforderliche Spalten:</p>
                <ul className="list-disc list-inside mt-2 font-mono text-xs">
                    <li>Name</li>
                    <li>Email</li>
                </ul>
                <p className="mt-2">Optionale Spalten:</p>
                 <ul className="list-disc list-inside mt-2 font-mono text-xs">
                    <li>MS Teams Email</li>
                    <li>Skills (kommagetrennt)</li>
                </ul>
            </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-6 text-sm text-blue-800">
          <h3 className="font-bold mb-2">Anleitung & Format</h3>
          <p>Pflichtspalten: <code>Name</code>, <code>Email</code></p>
          <p>Optional: <code>MS Teams Email</code>, <code>Skills (kommagetrennt)</code></p>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .csv" />
        <button onClick={() => fileInputRef.current.click()} className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
          {fileName || "Datei auswählen..."}
        </button>

        {parsedData.length > 0 && (
          <div className="mt-4 overflow-y-auto border rounded-md">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left"># Skills</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedData.map((p, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2">{p.email}</td>
                    <td className="px-4 py-2">{p.skillIds.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(error || uploadSuccess) && (
          <div className={`mt-4 p-3 rounded-md text-sm text-center ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {error || `${parsedData.length} Personen erfolgreich importiert!`}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm">Abbrechen</button>
          <button
            onClick={handleUpload}
            disabled={parsedData.length === 0 || isUploading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            {isUploading
  ? "Importiere..."
  : parsedData.length === 1
    ? "1 Person importieren"
    : `${parsedData.length} Personen importieren`}
          </button>
        </div>
      </div>
    </div>
  );
};