import React, { useEffect, useRef, useState } from "react";
import "./CityAutocomplete.css";

export default function CityAutocomplete({ value = "", onSelect }) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [results, setResults] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQ(value || "");
  }, [value]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch("/data/us_cities_min.json");
      const data = await res.json();
      setCities(data);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      const term = q.toLowerCase().replace(/[^a-z]/g, "");
      const filtered = cities
        .filter((c) => {
          const combined = (c.city + c.state_code)
            .toLowerCase()
            .replace(/[^a-z]/g, "");
          return combined.includes(term);
        })
        .slice(0, 15);
      setResults(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [q, cities]);

  const handlePick = (item) => {
    const label = `${item.city}, ${item.state_code}`;
    setQ(label);
    onSelect?.(label, item);
    setOpen(false);
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        if (q.trim() === "" && value) {
          onSelect?.("", null);
        }
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [q, value, onSelect]);

  return (
    <div ref={wrapperRef} className="autocomplete-wrapper">
      <input
        type="text"
        autoComplete="off"
        className="autocomplete-input"
        placeholder="Select or type a US city..."
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (q.trim() !== value.trim()) setOpen(true);
        }}
      />

      {open && q.trim() !== value.trim() && (
        <ul className="autocomplete-list">
          {loading && <li className="autocomplete-empty">Loading...</li>}
          {!loading && q.length >= 2 && results.length === 0 && (
            <li className="autocomplete-empty">No results found</li>
          )}
          {results.map((item, i) => (
            <li
              key={`${item.city}-${item.state_code}-${i}`}
              className="autocomplete-item"
              onMouseDown={() => handlePick(item)}
            >
              {item.city}, {item.state_code}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
