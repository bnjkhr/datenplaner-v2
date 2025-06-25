import React, { useState } from "react";

export const CollapsibleSection = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const toggle = () => setIsOpen(!isOpen);

  return (
    <div className="p-6 bg-white shadow-lg rounded-xl">
      <button
        onClick={toggle}
        className="w-full flex justify-between items-center text-left"
      >
        <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
        <span className="ml-2">{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
};
