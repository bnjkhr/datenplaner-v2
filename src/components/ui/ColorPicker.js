// src/components/ui/ColorPicker.js
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const roleColors = [
  "#EF4444", // red-500
  "#F97316", // orange-500  
  "#EAB308", // yellow-500
  "#22C55E", // green-500
  "#06B6D4", // cyan-500
  "#3B82F6", // blue-500
  "#8B5CF6", // violet-500
  "#EC4899", // pink-500
  "#10B981", // emerald-500
  "#F59E0B", // amber-500
  "#6366F1", // indigo-500
  "#84CC16", // lime-500
  "#14B8A6", // teal-500
  "#F43F5E", // rose-500
  "#8B5A2B", // brown-500
  "#6B7280", // gray-500
  // Erweiterte Palette mit helleren und dunkleren Varianten
  "#DC2626", // red-600
  "#EA580C", // orange-600
  "#CA8A04", // yellow-600
  "#16A34A", // green-600
  "#0891B2", // cyan-600
  "#2563EB", // blue-600
  "#7C3AED", // violet-600
  "#DB2777", // pink-600
  "#059669", // emerald-600
  "#D97706", // amber-600
  "#4F46E5", // indigo-600
  "#65A30D", // lime-600
  "#0D9488", // teal-600
  "#E11D48", // rose-600
  "#7F4F24", // brown-600
  "#4B5563", // gray-600
  // Noch mehr Farben
  "#B91C1C", // red-700
  "#C2410C", // orange-700
  "#A16207", // yellow-700
  "#15803D", // green-700
  "#0E7490", // cyan-700
  "#1D4ED8", // blue-700
  "#6D28D9", // violet-700
  "#BE185D", // pink-700
  "#047857", // emerald-700
  "#B45309", // amber-700
  "#3730A3", // indigo-700
  "#4D7C0F", // lime-700
  "#0F766E", // teal-700
  "#BE123C", // rose-700
  "#92400E", // brown-700
  "#374151", // gray-700
];

export const ColorPicker = ({ 
  currentColor, 
  onColorChange, 
  usedColors = [], 
  isOpen, 
  onClose,
  buttonRef 
}) => {
  const pickerRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && buttonRef?.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // ColorPicker Dimensionen (ca. 240px breit, 320px hoch)
      const pickerWidth = 240;
      const pickerHeight = 320;
      const margin = 8;
      
      let top = buttonRect.bottom + scrollY + 4; // Standard: unter dem Button
      let left = buttonRect.left + scrollX;
      
      // Prüfe ob genug Platz nach unten ist
      if (buttonRect.bottom + pickerHeight + margin > viewportHeight) {
        // Nicht genug Platz unten -> über dem Button öffnen
        top = buttonRect.top + scrollY - pickerHeight - 4;
      }
      
      // Prüfe ob genug Platz nach rechts ist
      if (buttonRect.left + pickerWidth + margin > viewportWidth) {
        // Nicht genug Platz rechts -> linksbündig zum Button
        left = buttonRect.right + scrollX - pickerWidth;
      }
      
      // Sicherstellen, dass das Overlay nicht über die linke Seite hinausragt
      if (left < margin) {
        left = margin;
      }
      
      // Sicherstellen, dass das Overlay nicht über die obere Seite hinausragt
      if (top < margin) {
        top = margin;
      }
      
      setPosition({ top, left });
    }
  }, [isOpen, buttonRef]);

  if (!isOpen) return null;

  const pickerContent = (
    <div 
      ref={pickerRef}
      className="fixed z-50 p-3 bg-white rounded-lg shadow-xl border border-gray-200"
      style={{ 
        minWidth: '240px',
        maxHeight: '320px',
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
    >
      <div className="mb-2">
        <p className="text-xs font-semibold text-gray-700 mb-2">Rollenfarbe wählen</p>
        <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto">
          {roleColors.map((color) => {
            const isUsed = usedColors.includes(color) && color !== currentColor;
            const isCurrent = color === currentColor;
            
            return (
              <button
                key={color}
                onClick={() => {
                  onColorChange(color);
                  onClose();
                }}
                className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                  isCurrent 
                    ? 'border-gray-800 ring-2 ring-gray-300' 
                    : isUsed 
                      ? 'border-gray-300 opacity-50 cursor-not-allowed' 
                      : 'border-gray-200 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
                title={isUsed ? 'Farbe bereits verwendet' : 'Farbe auswählen'}
                disabled={isUsed}
              />
            );
          })}
        </div>
        {usedColors.length >= roleColors.length && (
          <p className="text-xs text-gray-500 mt-2">
            Alle Farben sind vergeben. Doppelte Verwendung möglich.
          </p>
        )}
      </div>
    </div>
  );

  return createPortal(pickerContent, document.body);
};