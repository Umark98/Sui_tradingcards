"use client";

import { useState } from "react";

interface SearchBarProps {
  search: string;
  setSearch: (value: string) => void;
  onSelectUser: (email: string) => void;
}

export default function SearchBar({ search, setSearch, onSelectUser }: SearchBarProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // fetch suggestions from API
 const fetchSuggestions = async (query: string) => {
  try {
    const response = await fetch(`/api/user_suggestions?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (Array.isArray(data)) {
      setSuggestions(data.map((u: any) => u.user_email)); // <-- fixed here
    } else {
      setSuggestions([]);
    }
  } catch (err) {
    console.error("Error fetching suggestions:", err);
    setSuggestions([]);
  }
};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);

    if (value.length > 1) {
      fetchSuggestions(value);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (value: string) => {
    setSearch(value);
    setSuggestions([]);
    onSelectUser(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim() !== "") {
      setSuggestions([]);
      onSelectUser(search); 
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={search}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Search by email..."
        className="w-full border border-gray-300 rounded px-3 py-2"
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border border-gray-300 rounded mt-1 w-full max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onClick={() => handleSelect(s)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
