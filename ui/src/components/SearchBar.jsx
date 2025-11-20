import React, { useEffect, useState } from "react";
import axios from "axios";
import ChatBubble from "./ChatBubble";
import ResponseText from "./ResponseText";
import LoadingDots from "./LoadingDots";
import AttendanceButton from "./AttendanceButton";
import UpdateDateLocation from "./UpdateDateLocation";
import "./SearchBar.css";
import { isNaughtyString } from "../utils/validation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

var chat_history = 'User: "';

function SearchBar() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isDisabled, setIsDisabled] = useState(false); // to disable input when fetching response
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedSummary, setSelectedSummary] = useState("");
  const [currentCity, setCurrentCity] = useState(null);
  const [currentDateRange, setCurrentDateRange] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  // Format date range for the display
  const formatDateRange = (dateRange) => {
    if (!dateRange || !dateRange.startDate || !dateRange.endDate) return "None";
    
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    
    const formatDate = (date) => {
      const month = date.toLocaleString('en-US', { month: 'short' });
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month} ${day}, ${year}`;
    };
    
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  // Helper function to generate summary for a table
  const generateSummary = async (userQuery, currentTable, chatContext = "") => {
    try {
      // Generate a natural language summary of the response to the user's query with chat history context
      const summaryResponse = await axios.get(`http://localhost:8000/generate-summary/?user_query=${encodeURIComponent(userQuery)}&events=${encodeURIComponent(JSON.stringify(currentTable))}&chat_history=${encodeURIComponent(chatContext)}`);
      return summaryResponse.data;
    } catch (err) {
      console.error('Summary API error:', err);
      return "Summary unavailable";
    }
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && query.trim() !== "") {

      // Check if city and date range are set
      if (!currentCity || !currentDateRange) {
        setErrorMessage("⚠️ Please set both location and date range before searching.");
        setTimeout(() => setErrorMessage(""), 4000);
        return;
      }
      // Disable input while fetching response
      setIsDisabled(true);
      setTimeout(() => setIsDisabled(false), 60000); // re-enable after 60 seconds to avoid permanent disable

      // Add naughty string validation here
      if (isNaughtyString(query)) {
        setErrorMessage("⚠️ Invalid input detected. Please check your query.");
        setTimeout(() => setErrorMessage(""), 4000);
        setQuery(""); // Clear the input
        return; // Stop execution
      }

      try {
        chat_history += query + '"\nAssistant: "';
        const currentQuery = query; // Fix: use query, not chat_history
        setQuery("");
        setMessages([
          ...messages,
          { prompt: currentQuery, answer: <LoadingDots /> },
        ]);

        // Reset selected table to be null when a new query is made
        setSelectedTable(null);

        const res = await axios.get(`http://localhost:8000/get-answer/${encodeURIComponent(currentQuery)}`);

        // Generate summary for this response with chat history context
        const currentSummary = await generateSummary(currentQuery, res.data.answer, chat_history);

        // Update the last message to have the actual response as the answer (functional updater)
        let updatedMessages = [];
        setMessages((prev) => {
          updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1] = {
            
            prompt: currentQuery, 
           
            answer: res.data.answer,
            summary: currentSummary 
         ,
          };
          return updatedMessages;
        });

        // Update selected summary to show the latest one
        setSelectedSummary(currentSummary);

        // Update chat history with the new answer (condense if too long )
        chat_history += res.data.answer + '"\nUser: "';
        if (chat_history.length > 15000) {
          try {
            const response = await axios.get(
              `http://localhost:8000/condense-context/${encodeURIComponent(
                chat_history
              )}`
            );
            chat_history = response.data.condensed_context + '"\nUser: "';
          } catch (errCondense) {
            console.error("Condense-context API error:", errCondense);
          }
        }
      } catch (err) {
        console.error("API error:", err);
      }

      setIsDisabled(false); // Re-enable input after response is received
    }
  };

  // New function to handle ChatBubble click to display events related to that prompt
  const handleChatBubbleClick = (table, summary, summary) => {
    setSelectedTable(table);
    setSelectedSummary(summary);
    setSelectedSummary(summary || "");
  };

  // Added the new query and answer to the message history
  const messageElements = messages.map((msg, index) => (
    <div key={index}>
      <ChatBubble prompt={msg.prompt} onChatBubbleClick={() => handleChatBubbleClick(msg.answer, msg.summary)} />
    </div>
  ));

  const table =
    messages.length > 0 ? messages[messages.length - 1].answer : null;

  const STATIC_SRC = "/data/download.png";
  const GIF_SRC = "/data/download.gif";

  const [iconSrc, setIconSrc] = useState(STATIC_SRC);

  const startGif = () => setIconSrc(`${GIF_SRC}#t=${Date.now()}`);
  const stopGif = () => setIconSrc(STATIC_SRC);

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
      const newLeftWidth =
        ((e.clientX - container.offsetLeft) / container.clientWidth) * 100;
      if (newLeftWidth > 20 && newLeftWidth < 80) {
        // keep it reasonable
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
        <div>{selectedSummary && <p className="summary-text">{selectedSummary}</p>}</div>
        <ResponseText answer={selectedTable ? selectedTable : table} />
        <button
          className="lp-print"
          type="button"
          onClick={handleDownload}
          aria-label="Download"
          onMouseEnter={startGif}
          onMouseLeave={stopGif}
          onFocus={startGif}
          onBlur={stopGif}
        >
          <img src={iconSrc} alt="" className="download-icon" />
        </button>
      </div>

      <div className="resizer" />

      <div className="right-panel">
        <UpdateDateLocation 
          onUpdate={(city, dateRange) => {
            setCurrentCity(city);
            setCurrentDateRange(dateRange);
          }}
        />
        <div className="current-context">
          <span className="context-label">Location:</span>
          <span className="context-value">{currentCity || "None"}</span>
          <span className="context-separator">•</span>
          <span className="context-label">Date Range:</span>
          <span className="context-value">{formatDateRange(currentDateRange)}</span>
        </div>
        <div className="chat-messages">{messageElements}</div>    

        <div className="page-footer">
          {errorMessage && (
            <div className="error-message">{errorMessage}</div>
          )}
          <input
            className="search-input"
            type="text"
            value={query}
            disabled={isDisabled}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
          />
        </div>

        <AttendanceButton />
        <div className="tips">
          Click on chat bubbles to see the previous list
        </div>
      </div>
    </div>
  );
}

export default SearchBar;
