import './App.css';
import DateLocationInput from './components/dateLocationInput';
import SearchBar from './components/SearchBar';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import './App.css';
import React from 'react';



function App() {
  return (
    <Router>
      <div classname="App">
        <Routes>
          <Route path="/" element={<DateLocationInput />}/>
          <Route path="/search" element={<SearchBar />}/>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
