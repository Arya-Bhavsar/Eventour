import React, { useState } from "react";
import axios from "axios";
import "./AttendanceButton.css";

function AttendanceButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [attendanceChance, setAttendanceChance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAttendanceChance = async () => {
    if (isVisible) {
      setIsVisible(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:8000/chance-of-attendance");
      setAttendanceChance(response.data.chance_percentage);
      setIsVisible(true);
    } catch (error) {
      console.error("Error fetching attendance chance:", error);
      setAttendanceChance(null);
    }
    setIsLoading(false);
  };

  const attendanceMessage = `There is a ${attendanceChance}% chance Avian shows up to class today.`;

  return (
    <div className="attendance-button-container">
      {isVisible && attendanceChance && (
        <div className="attendance-tooltip">
          <div className="attendance-message">
            {attendanceMessage}
          </div>
          <div className="tooltip-arrow"></div>
        </div>
      )}
      
      <button 
        className="attendance-button"
        onClick={fetchAttendanceChance}
        disabled={isLoading}
        title="Get attendance chance"
      >
        {isLoading ? "..." : "?"}
      </button>
    </div>
  );
}

export default AttendanceButton;