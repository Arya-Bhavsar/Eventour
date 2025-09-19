import React, { useEffect } from "react";
import axios from "axios";
import SearchBar from "./components/SearchBar";

function App() {

    useEffect(() => {
    axios.post("/populate-db")
      .then(res => {
        console.log(`Inserted ${res.data.inserted} events`);
      })
      .catch(err => console.error("Error populating events:", err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <SearchBar/>
    </div>
  );
}

export default App;
