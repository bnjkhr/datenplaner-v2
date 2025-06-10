// src/components/ui/TagInput.js
import React, { useState, useRef, useEffect } from 'react';

export const TagInput = ({ selectedSkillIds, setSelectedSkillIds, allSkills = [], placeholder = "Skill auswählen", onCreateSkill }) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredSuggestions = allSkills
    .filter(skill => !selectedSkillIds.includes(skill.id))
    .filter(skill => skill.name.toLowerCase().includes(inputValue.toLowerCase()));

  const addSkillById = (skillId) => {
    if (skillId && !selectedSkillIds.includes(skillId)) {
      setSelectedSkillIds([...selectedSkillIds, skillId]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeSkill = (skillIdToRemove) => {
    setSelectedSkillIds(selectedSkillIds.filter(id => id !== skillIdToRemove));
  };
  
  const handleKeyDown = async (e) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault();
      const newSkillName = inputValue.trim();
      const existingSuggestion = filteredSuggestions.find(s => s.name.toLowerCase() === newSkillName.toLowerCase());

      if (existingSuggestion) {
        addSkillById(existingSuggestion.id);
      } else {
        // Skill existiert nicht, also neu anlegen
        if (onCreateSkill) {
          const newSkillId = await onCreateSkill(newSkillName); // Ruft fuegeSkillHinzu auf
          if (newSkillId) {
            addSkillById(newSkillId);
          }
        }
      }
    } else if (e.key === 'Backspace' && inputValue === '' && selectedSkillIds.length > 0) {
        removeSkill(selectedSkillIds[selectedSkillIds.length - 1]);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md min-h-[42px] cursor-text"
        onClick={() => wrapperRef.current.querySelector('input').focus()}
      >
        {selectedSkillIds.map(skillId => {
          const skill = allSkills.find(s => s.id === skillId);
          if (!skill) return null;
          return (
            <span key={skillId} className="px-3 py-1 rounded-full text-sm flex items-center font-semibold" style={{ backgroundColor: skill.color, color: '#1f2937' }}>
              {skill.name}
              <button type="button" onClick={(e) => { e.stopPropagation(); removeSkill(skillId); }} className="ml-2 opacity-70 hover:opacity-100 font-bold">&times;</button>
            </span>
          );
        })}
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={selectedSkillIds.length === 0 ? placeholder : ""}
          className="flex-grow p-1 outline-none text-sm bg-transparent"
        />
      </div>
      {showSuggestions && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map(suggestion => (
              <li key={suggestion.id} onMouseDown={() => addSkillById(suggestion.id)} className="px-3 py-2 cursor-pointer hover:bg-indigo-100 text-sm">
                {suggestion.name}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-gray-500">Keine Vorschläge. Drücke Enter, um "{inputValue}" zu erstellen.</li>
          )}
        </ul>
      )}
    </div>
  );
};
