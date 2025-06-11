// src/components/ExcelUploadModal.js
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useData } from '../context/DataProvider';

export const ExcelUploadModal = ({ isOpen, onClose }) => {
  const { fuegePersonenImBatchHinzu, setError, error } = useData();
  const [parsedData, setParsedData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setParsedData([]);
    setUploadSuccess(false);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        // Daten umwandeln und validieren
        const personen = json.map(row => {
          const skills = row['Skills (kommagetrennt)'] ? String(row['Skills (kommagetrennt)']).split(',').map(s => s.trim()).filter(Boolean) : [];
          const teamsMail = row['MS Teams Email'] || row['Email']; // Fallback auf normale E-Mail
          const teamsLink = teamsMail ? `msteams:/l/chat/0/0?users=${teamsMail.trim()}` : '';
          
          return {
            name: row['Name'],
            email: row['Email'],
            skillIds: [], // Skills werden aktuell nicht per Excel importiert, da wir IDs bräuchten
            msTeamsLink: teamsLink,
            // Hier könnten noch weitere Felder aus dem Excel gemappt werden
          };
        });
        setParsedData(personen);
      } catch (err) {
        console.error("Error parsing file:", err);
        setError("Fehler beim Parsen der Datei. Stellen Sie sicher, dass es eine gültige .xlsx oder .csv Datei ist.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setError(null);
    setUploadSuccess(false);

    const success = await fuegePersonenImBatchHinzu(parsedData);

    if (success) {
      setUploadSuccess(true);
      setParsedData([]);
      setFileName('');
      setTimeout(onClose, 2000); // Modal nach 2s schließen
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

            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .csv" />
            <button onClick={() => fileInputRef.current.click()} className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-center">
                {fileName || "Datei auswählen..."}
            </button>
            
            {parsedData.length > 0 && (
                <div className="mt-4 flex-grow overflow-y-auto border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0"><tr><th className="px-4 py-2 text-left text-xs font-medium uppercase">Name</th><th className="px-4 py-2 text-left text-xs font-medium uppercase">Email</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {parsedData.map((p, i) => (<tr key={i}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{p.name}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{p.email}</td>
                            </tr>))}
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
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed">
                    {isUploading ? "Importiere..." : `${parsedData.length} Personen importieren`}
                </button>
            </div>
        </div>
    </div>
  );
};
