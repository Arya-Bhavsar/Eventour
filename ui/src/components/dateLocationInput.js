import React, { useState } from 'react';
import './dateLocationInput.css'

export default function DateLocationInput() {
    // States for location, start date, end date
    const [location, setLocation] = useState('');
    const locationPattern = /^[A-Z][a-zA-Z ]*, [A-Z]{2}$/;
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);  // Add loading state
    const [result, setResult] = useState(null);     // Add result state

    async function handleSubmit(submission){
        submission.preventDefault();
    
        // Test your regex
        if (locationPattern.test(location)) {
            console.log('Location format is valid!');
            
            // Make API call to your FastAPI backend
            setLoading(true);
            try {
                const response = await fetch(
                    `http://localhost:8000/populate-db/?start_time=${startDate}T00:00:00&end_time=${endDate}T23:59:59&location=${encodeURIComponent(location)}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('API Response:', data);
                    setResult(data);
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
            
        } else {
            console.log('Location format is invalid!');
            alert('Please enter location in "City, ST" format');
        }
    }

    return (
        <form method="post" onSubmit={handleSubmit}>
            <label>
                Enter Location in 'City, State Code' Form: 
                <input 
                    name="myLocation" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
            </label>
            <hr />
            <label>
                Start Date: 
                <input 
                    type="date" 
                    name="startDate" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
            </label>
            <br />
            <label>
                End Date: 
                <input 
                    type="date" 
                    name="endDate" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </label>
            <hr />
            
            {/* Show loading state */}
            {loading && <p>Loading...</p>}
            
            {/* Show API result */}
            {result && (
                <div>
                    <h3>Result:</h3>
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}
            
            <button type="reset">Reset form</button>
            <button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit form'}
            </button>
        </form>
    );
}