import React, { useState } from "react";

export const CollapsibleSection = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const toggle = () => setIsOpen(!isOpen);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700">
      <button
        onClick={toggle}
        className="w-full flex justify-between items-center text-left group"
      >
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">{title}</h2>
        <span className="ml-2 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
};
