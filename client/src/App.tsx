import './App.css';
import { FournisseurAuth } from './contexts/AuthContext';
import RoutersPage from './Routers/RoutersPage';

function App() {
  return (
    <FournisseurAuth>
      <RoutersPage />
    </FournisseurAuth>
  );
}

export default App;
