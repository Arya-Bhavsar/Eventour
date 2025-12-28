import React, { useState } from "react";
import axios from "axios";
import ChatBubble from "./ChatBubble";
import ResponseText from "./ResponseText";
import LoadingDots from "./LoadingDots";
import "./SearchBar.css";

var chat_history = "User: \""

function SearchBar() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && query.trim() !== "") {
      try {
        chat_history += query + "\"\nAssistant: \"";
        const currentQuery = chat_history; // Changed: use query, not chat_history
        setQuery("");
        setMessages([...messages, {prompt: query, answer: <LoadingDots />}]);
        
        const res = await axios.get(`http://localhost:8000/get-answer/${currentQuery}`);
        
        setMessages((messages) => {
          const updatedMessages = [...messages];
          updatedMessages[updatedMessages.length - 1] = {prompt: query, answer: res.data.answer};
          
          // Fix the syntax error and check length
          chat_history += res.data.answer + "\"\nUser: \"";
          if (chat_history.length > 15000){
            const response = axios.get(`http://localhost:8000/condense-context/${chat_history}`)
            chat_history = response.data.condensed_context + "\"\nUser: \"";
          }
          
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
    <div className="search-page">
      {messageElements}

      <div className="page-footer">
        <input
          className="search-input"
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
        />
      </div>

      <div className="footer-guard" aria-hidden="true" />
    </div>
  );


}

export default SearchBar;
