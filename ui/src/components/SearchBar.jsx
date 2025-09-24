import React, { useState } from "react";
import axios from "axios";
import ChatBubble from "./ChatBubble";
import ResponseText from "./ResponseText";

function SearchBar() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [prompt, setPrompt] = useState("");

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && query.trim() !== "") {
      try {
        const currentQuery = query;
        setQuery(""); // Clears input field immediately
        setPrompt(currentQuery);
        const res = await axios.get(`http://localhost:8000/get-answer/${currentQuery}`);
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
      <ChatBubble prompt={prompt}/>
      <ResponseText answer={answer}/>
    </div>
  );
}

export default SearchBar;
