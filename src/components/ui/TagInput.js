// src/components/ui/TagInput.js
import { useState } from 'react';

export const TagInput = ({ tags, setTags, placeholder = "Add a skill" }) => {
    const [inputValue, setInputValue] = useState('');
    const handleKeyDown = (e) => {
        if ((e.key === 'Enter' || e.key === ',') && inputValue.trim() !== '') {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (!tags.includes(newTag)) { setTags([...tags, newTag]); }
            setInputValue('');
        } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };
    return (
        <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md min-h-[40px]">
            {tags.map(tag => (
                <span key={tag} className="bg-blue-500 text-white px-2 py-1 rounded-full text-sm flex items-center">
                    {tag}
                    <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="ml-2 text-xs text-blue-100 hover:text-white">&times;</button>
                </span>
            ))}
            <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={tags.length === 0 ? placeholder : ""} className="flex-grow p-1 outline-none text-sm"/>
        </div>
    );
};

