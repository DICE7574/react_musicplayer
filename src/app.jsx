// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Lobby from './pages/Lobby';
import Room from './pages/Room';

function App() {
    return (
        <Router>
            <Routes>
                {/* 기본 경로를 Lobby로 */}
                <Route path="/" element={<Lobby />} />

                <Route path="/room/:roomCode" element={<Room />} />
            </Routes>
        </Router>
    );
}

export default App;
