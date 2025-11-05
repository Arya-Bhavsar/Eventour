import React, { useState } from 'react';
import Datepicker from "react-tailwindcss-datepicker";
import CityAutocomplete from "./CityAutocomplete";
import './UpdateDateLocation.css'

export default function UpdateDateLocation() {
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

        setLoading(true);
        try {
            const response = await fetch(
            `http://localhost:8000/populate-db/?start_time=${dateValue.startDate}T00:00:00&end_time=${dateValue.endDate}T23:59:59&location=${encodeURIComponent(
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
                alert("Date and location updated successfully!");
            } else {
                console.error('API Error:', response.status);
                setResult({ error: `HTTP ${response.status}` });
            }
        } catch (error) {
            console.error("Network error:", error);
            setResult({ error: "Network error" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="updatesearch-container">
            <form className="updatesearch-form" onSubmit={handleSubmit}>
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
                    Update
                </button>
            </form>
        </div>
    );
}