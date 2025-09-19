import React, { useState } from "react";
import axios from "axios";

function SearchBar() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && query.trim() !== "") {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/get-answer/${query}`);
        setAnswer(res.data.answer); 
      } catch (err) {
        console.error("API error:", err);
      }
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Search..."
        style={{
          padding: "8px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          width: "250px",
        }}
      />
      <p>
        {answer}
      </p>
    </div>
  );
}

export default SearchBar;
