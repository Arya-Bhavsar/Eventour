import React, { useState } from "react";
import axios from "axios";
import ChatBubble from "./ChatBubble";
import ResponseText from "./ResponseText";
import LoadingDots from "./LoadingDots";
import "./SearchBar.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


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
    </div>
  ));

  const table = messages.length > 0 ? messages[messages.length - 1].answer : null;
  console.log(table)

  // Resizing logic
  React.useEffect(() => {
    const resizer = document.querySelector(".resizer");
    const leftPanel = document.querySelector(".left-panel");
    const container = document.querySelector(".search-page");

    let isResizing = false;

    resizer.addEventListener("mousedown", (e) => {
      isResizing = true;
      document.body.style.cursor = "col-resize";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      const newLeftWidth = ((e.clientX - container.offsetLeft) / container.clientWidth) * 100;
      if (newLeftWidth > 20 && newLeftWidth < 80) { // keep it reasonable
        leftPanel.style.width = `${newLeftWidth}%`;
      }
    });

    document.addEventListener("mouseup", () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = "default";
      }
    });

    return () => {
      document.body.style.cursor = "default";
    };
  }, []);



  return (
    <div className="search-page">
      <div className="left-panel">
        <ResponseText answer={table} />
        <div className="lp-print" aria-hidden="true">🖨️</div>
      </div>

      <div className="resizer" />

      <div className="right-panel">
        <div className="chat-messages">{messageElements}</div>    

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
      </div>
    </div>
  );
}

export default SearchBar;