import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DateLocationInput.css'
import Datepicker from "react-tailwindcss-datepicker";
import CityAutocomplete from "./CityAutocomplete";

export default function DateLocationInput() {
    // States for location, start date, end date
    const navigate = useNavigate();
    const [location, setLocation] = useState('');
    const [dateValue, setDateValue] = useState({
        startDate: null,
        endDate: null,
    });
    const [loading, setLoading] = useState(false);  // Add loading state
    const [result, setResult] = useState(null);     // Add result state

    const handleDateChange = (newValue) => {
        setDateValue(newValue);
    };


    async function handleSubmit(submission) {
        submission.preventDefault();

        if (!location || !dateValue.startDate || !dateValue.endDate) {
            alert("Please select location and date range");
            return;
        }

        const formattedStart = dateValue.startDate;
        const formattedEnd = dateValue.endDate;

        setLoading(true);
        try {
            const response = await fetch(
            `http://localhost:8000/populate-db/?start_time=${formattedStart}T00:00:00&end_time=${formattedEnd}T23:59:59&location=${encodeURIComponent(
                location
            )}`,
            {
                method: "GET",
                headers: {
                "Content-Type": "application/json",
                },
            }
            );
         
            if (response.ok) {
                const data = await response.json();
                console.log('API Response:', data);
                setResult(data);

                // Navigate to SearchBar page after successful submission
                setTimeout(() => {
                     navigate('/search');
                }, 2000);
            } else {
                console.error('API Error:', response.status);
                setResult({ error: `HTTP ${response.status}` });
            }
        } catch (error) {
            console.error('Network Error:', error);
            setResult({ error: 'Network error occurred' });
        } finally {
            setLoading(false);
        }
            
    }


    return (
      <div className="search-container">
        <h2>Looking for exciting events and places</h2>
        <form className="search-form" onSubmit={handleSubmit}>
            {/* Location Dropdown */}
            <label>
                Location:
                <CityAutocomplete
                    value={location}
                    onSelect={(val, meta) => {
                    setLocation(val); // e.g. "Columbus, OH"
                    }}
                />
            </label>

            {/* Date Range Picker */}
            <label>
                Date Range:
                <Datepicker
                    primaryColor={"indigo"}
                    value={dateValue}
                    onChange={handleDateChange}
                    separator="to"
                    placeholder="Select date range"
                    inputClassName="date-picker-input"

                />
            </label>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className={loading ? "is-loading" : ""}
                aria-busy={loading}
                aria-live="polite"
            >
                Search
            </button>
        </form>

        {/* API Result */}
        {result && (
            <div className="result">
                <h3>Result:</h3>
                <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
        )}
        </div>
    );
}