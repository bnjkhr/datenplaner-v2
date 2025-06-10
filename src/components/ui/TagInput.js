// src/components/ui/TagInput.js
import React, { useState, useRef, useEffect } from 'react';

export const TagInput = ({ selectedSkillIds, setSelectedSkillIds, allSkills = [], placeholder = "Skill auswählen" }) => {
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const filteredSuggestions = allSkills
    .filter(skill => !selectedSkillIds.includes(skill.id))
    .filter(skill => skill.name.toLowerCase().includes(inputValue.toLowerCase()));

  const addSkill = (skillId) => {
    if (skillId && !selectedSkillIds.includes(skillId)) {
      setSelectedSkillIds([...selectedSkillIds, skillId]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeSkill = (skillIdToRemove) => {
    setSelectedSkillIds(selectedSkillIds.filter(id => id !== skillIdToRemove));
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
        e.preventDefault();
        // Optional: Neuen Skill on-the-fly erstellen (aktuell nicht implementiert)
        // Stattdessen könnte man den ersten Vorschlag auswählen
        if (filteredSuggestions.length > 0) {
            addSkill(filteredSuggestions[0].id);
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
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
          {filteredSuggestions.map(suggestion => (
            <li
              key={suggestion.id}
              onMouseDown={() => addSkill(suggestion.id)} // onMouseDown, damit es vor dem onBlur des Inputs feuert
              className="px-3 py-2 cursor-pointer hover:bg-indigo-100 text-sm"
            >
              {suggestion.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
