import React, { useState } from "react";
import axios from "axios";
import ChatBubble from "./ChatBubble";
import ResponseText from "./ResponseText";

function SearchBar() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && query.trim() !== "") {
      try {
        const currentQuery = query;
        setQuery(""); // Clears input field immediately
        setMessages([...messages, {prompt: currentQuery, answer: "Loading..."}]); // Adds new prompt to history with loading state
        
        const res = await axios.get(`http://localhost:8000/get-answer/${currentQuery}`);
        
        // Updates the last message with the actual answer
        setMessages((messages) => {
          const updatedMessages = [...messages];
          updatedMessages[updatedMessages.length - 1] = {prompt: currentQuery, answer: res.data.answer}; // Update the last message
          return updatedMessages;
        });
      } catch (err) {
        console.error("API error:", err);
      }
    }
  };

  // Added the new query and answer to the message history
  const messageElements = messages.map((msg, index) => (
    <div key={index}>
      <ChatBubble prompt={msg.prompt} />
      <ResponseText answer={msg.answer} />
    </div>
  ));

  return (
    <div style={{ padding: "20px" }}>
      <ChatBubble prompt={prompt}/>
      <ResponseText answer={answer}/>
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
          width: "500px",
          position: "fixed",
          bottom: "30px",      
          left: "50%",         
          transform: "translateX(-50%)", 

        }}
    
      />
      {messageElements}
    </div>
  );
}

export default SearchBar;
