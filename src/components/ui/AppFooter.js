import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataProvider';

export const AppFooter = ({ user }) => {
  const { lastChangeInfo } = useData();
  const [lastChangeText, setLastChangeText] = useState('');

  useEffect(() => {
      if (lastChangeInfo && lastChangeInfo.timestamp) {
          const date = lastChangeInfo.timestamp.toDate();
          const formattedDate = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const formattedTime = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
          setLastChangeText(`Letzte Änderung: ${lastChangeInfo.action} am ${formattedDate} um ${formattedTime} Uhr von ${lastChangeInfo.userEmail}`);
      } else {
          setLastChangeText('');
      }
  }, [lastChangeInfo]);

  return (
    <footer className="bg-white shadow-inner mt-auto py-4 px-4 text-center">
        {user && ( <div className="text-sm text-gray-600">Angemeldet als: <span className="font-semibold">{user.email}</span></div> )}
        {lastChangeText && (<div className="text-xs text-gray-500 mt-1">{lastChangeText}</div>)}
        <p className="text-xs text-gray-400 mt-2">&copy; {new Date().getFullYear()} Dein Datenprodukt Planungs-Tool</p>
    </footer>
  );
};