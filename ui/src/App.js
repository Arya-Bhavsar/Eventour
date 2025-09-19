import './App.css';
import DateLocationInput from './components/dateLocationInput';
import React, { useEffect } from "react";
import axios from "axios";
import SearchBar from './components/SearchBar';

function App() {

    useEffect(() => {
    axios.post("/populate-db")
      .then(res => {
        console.log(`Inserted ${res.data.inserted} events`);
      })
      .catch(err => console.error("Error populating events:", err));
  }, []);

  return (
    <div className="App">
      <DateLocationInput />
      <SearchBar />
    </div>
  );
}

export default App;
