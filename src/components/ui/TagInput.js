import React, { useState, useEffect, useRef } from 'react';

// Diese Farbpalette und Funktion kann auch zentral in einer utils.js Datei liegen,
// aber für die Übersichtlichkeit lassen wir sie hier.
const tagColors = [
    'bg-red-200 text-red-800', 'bg-orange-200 text-orange-800', 'bg-amber-200 text-amber-800', 
    'bg-yellow-200 text-yellow-800', 'bg-lime-200 text-lime-800', 'bg-green-200 text-green-800',
    'bg-emerald-200 text-emerald-800', 'bg-teal-200 text-teal-800', 'bg-cyan-200 text-cyan-800', 
    'bg-sky-200 text-sky-800', 'bg-blue-200 text-blue-800', 'bg-indigo-200 text-indigo-800',
    'bg-violet-200 text-violet-800', 'bg-purple-200 text-purple-800', 'bg-fuchsia-200 text-fuchsia-800',
    'bg-pink-200 text-pink-800', 'bg-rose-200 text-rose-800'
];

const getSkillColor = (skill) => {
  let hash = 0;
  for (let i = 0; i < skill.length; i++) {
    hash = skill.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const index = Math.abs(hash % tagColors.length);
  return tagColors[index];
};


export const TagInput = ({ tags, setTags, allSkills = [], placeholder = "Skill hinzufügen" }) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null); // Ref für den gesamten Container

  // Schließt die Vorschläge, wenn außerhalb geklickt wird
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
    .filter(skill => !tags.includes(skill))
    .filter(skill => skill.toLowerCase().includes(inputValue.toLowerCase()));

  const addTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim() !== '') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md min-h-[42px] cursor-text"
        onClick={() => wrapperRef.current.querySelector('input').focus()}
      >
        {tags.map(tag => (
          <span key={tag} className={`px-2 py-1 rounded-full text-sm flex items-center font-medium ${getSkillColor(tag)}`}>
            {tag}
            <button type="button" onClick={(e) => {e.stopPropagation(); removeTag(tag);}} className="ml-2 opacity-70 hover:opacity-100">&times;</button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-grow p-1 outline-none text-sm bg-transparent"
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
          {filteredSuggestions.map(suggestion => (
            <li
              key={suggestion}
              onClick={() => addTag(suggestion)}
              className="px-3 py-2 cursor-pointer hover:bg-indigo-100 text-sm"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
