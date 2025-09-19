import logo from './logo.svg';
import './App.css';
import DateLocationInput from './components/dateLocationInput';

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
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <DateLocationInput />
    </div>
  );
}

export default App;
