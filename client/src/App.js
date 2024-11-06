
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Calc from './components/Calc/Calc';
import Update from './components/Update/Update';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Calc />} />
          <Route path='/update' element={<Update />} />
        </Routes>
      </BrowserRouter>

    </div>
  );
}

export default App;
