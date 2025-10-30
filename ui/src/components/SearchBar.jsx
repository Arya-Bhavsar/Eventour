import React, { useState } from "react";
import axios from "axios";
import ChatBubble from "./ChatBubble";
import ResponseText from "./ResponseText";
import LoadingDots from "./LoadingDots";
import AttendanceButton from "./AttendanceButton";
import "./SearchBar.css";
import { isNaughtyString } from "../utils/validation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

var chat_history = "User: \""

function SearchBar() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = async (e) => {
  if (e.key === "Enter" && query.trim() !== "") {
    
    // Add naughty string validation here
    if (isNaughtyString(query)) {
      alert("⚠️ Invalid input detected. Please check your query.");
      setQuery(""); // Clear the input
      return; // Stop execution
    }
    
    try {
      chat_history += query + "\"\nAssistant: \"";
      const currentQuery = query; // Fix: use query, not chat_history
      setQuery("");
      setMessages([...messages, {prompt: currentQuery, answer: <LoadingDots />}]);

      // Reset selected table to be null when a new query is made
      setSelectedTable(null);
      
      const res = await axios.get(`http://localhost:8000/get-answer/${encodeURIComponent(currentQuery)}`);
      
      setMessages((messages) => {
        const updatedMessages = [...messages];
        updatedMessages[updatedMessages.length - 1] = {prompt: currentQuery, answer: res.data.answer};
        
        chat_history += res.data.answer + "\"\nUser: \"";
        if (chat_history.length > 15000){
          const response = axios.get(`http://localhost:8000/condense-context/${encodeURIComponent(chat_history)}`);
          chat_history = response.data.condensed_context + "\"\nUser: \"";
        }
        
        return updatedMessages;
      });
    } catch (err) {
      console.error("API error:", err);
    }
  }
};

  // New function to handle ChatBubble click to display events related to that prompt
  const handleChatBubbleClick = (answer) => {
    setSelectedTable(answer);
  }

  // Added the new query and answer to the message history
  const messageElements = messages.map((msg, index) => (
    <div key={index}>
      <ChatBubble prompt={msg.prompt} onChatBubbleClick={() => handleChatBubbleClick(msg.answer)} />
    </div>
  ));

  const table = messages.length > 0 ? messages[messages.length - 1].answer : null;

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

const handleDownload = () => {
  const doc = new jsPDF();
  const table = document.getElementById("my-table");
  if (!table) return;


  autoTable(doc, { html: table }); // pass doc explicitly
  doc.save("table.pdf");
};


  return (
    <div className="search-page">
      <div className="left-panel">
        <ResponseText answer={selectedTable ? selectedTable : table} />
        <button className="lp-print" aria-hidden="true" onClick={handleDownload}>⬇️</button>
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
        
        <AttendanceButton />
      </div>
    </div>
  );
}

export default SearchBar;