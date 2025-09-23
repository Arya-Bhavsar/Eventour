import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import DateLocationInput from './components/DateLocationInput';
import SearchBar from './components/SearchBar';



function App() {
  useEffect(() => {
  const handleBeforeUnload = () => {
    // More reliable for page unload - no CORS preflight needed
    const data = JSON.stringify({ action: 'clear' });
    navigator.sendBeacon('http://localhost:8000/clear-db/', data);
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, []);
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<DateLocationInput />}/>
          <Route path="/search" element={<SearchBar />}/>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
