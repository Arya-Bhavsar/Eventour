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

var chat_history = "User: \""

function SearchBar() {
  const [query, setQuery] = useState("");
  const [summary, setSummary] = useState("");
  const [messages, setMessages] = useState([]);
  const [isDisabled, setIsDisabled] = useState(false); // to disable input when fetching response
  const [selectedTable, setSelectedTable] = useState(null);

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  // Get the summary of changes made to the new table of events
  useEffect(() => {
    if (messages.length > 1 && !React.isValidElement(messages[messages.length - 1].answer)) {
    const table1 = messages[messages.length - 2].answer;
    const table2 = messages[messages.length - 1].answer;
    // Compare the two tables and get summary
    const fetchSummary = async () => {
      try {
        const summaryResponse = await axios.get(`http://localhost:8000/compare-differences/?table_1=${encodeURIComponent(JSON.stringify(table1))}&table_2=${encodeURIComponent(JSON.stringify(table2))}`);
        setSummary(summaryResponse.data);
        console.log("Summary Response:", summaryResponse.data);
      } catch (errSummary) {
        console.error('Summary API error:', errSummary);
      }
    };
    fetchSummary();
  }
  }, [messages]);

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && query.trim() !== "") {

      // Disable input while fetching response
      setIsDisabled(true);
      setTimeout(() => setIsDisabled(false), 60000); // re-enable after 60 seconds to avoid permanent disable
      
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
        setMessages([...messages, { prompt: currentQuery, answer: <LoadingDots /> }]);

        // Reset selected table to be null when a new query is made
        setSelectedTable(null);

        const res = await axios.get(`http://localhost:8000/get-answer/${encodeURIComponent(currentQuery)}`);

        // Update the last message to have the actual response as the answer (functional updater)
        let updatedMessages = [];
        setMessages((prev) => {
          updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1] = { prompt: currentQuery, answer: res.data.answer };
          return updatedMessages;
        });

        // Update chat history with the new answer (condense if too long )
        chat_history += res.data.answer + "\"\nUser: \"";
        if (chat_history.length > 15000) {
          try {
            const response = await axios.get(`http://localhost:8000/condense-context/${encodeURIComponent(chat_history)}`);
            chat_history = response.data.condensed_context + "\"\nUser: \"";
          } catch (errCondense) {
            console.error('Condense-context API error:', errCondense);
          }
        }
      } catch (err) {
        console.error("API error:", err);
      }

      setIsDisabled(false); // Re-enable input after response is received
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

  const STATIC_SRC = "/data/download.png";   
  const GIF_SRC    = "/data/download.gif";

  const [iconSrc, setIconSrc] = useState(STATIC_SRC);

  const startGif = () => setIconSrc(`${GIF_SRC}#t=${Date.now()}`);
  const stopGif  = () => setIconSrc(STATIC_SRC);

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
        <div>{messages.length > 1 && !React.isValidElement(messages[messages.length - 1].answer) && <p>{summary}</p>}</div>
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
        <UpdateDateLocation />
        <div className="chat-messages">{messageElements}</div>    

        <div className="page-footer">
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
        <div className="tips">Click on chat bubbles to see the previous list</div>
      </div>
    </div>
  );
}

export default SearchBar;