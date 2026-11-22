import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { BatesStampingPage } from './pages/BatesStampingPage';
import { RedactionPage } from './pages/RedactionPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/bates" element={<BatesStampingPage />} />
      <Route path="/redact" element={<RedactionPage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}

export default App;