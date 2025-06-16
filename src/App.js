import React, { useEffect, useState } from 'react';
import { Howl } from 'howler';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa'; // Импортируем иконки
import Home from './components/Home';
import CreateGame from './components/CreateGame';
import JoinGame from './components/JoinGame';
import Game from './components/Game';
import Rules from './components/Rules';
import NotFound from './components/NotFound';

function App() {
  const [isSoundReady, setIsSoundReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sound, setSound] = useState(null);

  useEffect(() => {
    const soundInstance = new Howl({
      src: ['/music.mp3'],
      loop: true,
      volume: 0.5,
      onload: () => {
        console.log("Музыка готова к воспроизведению!");
        setIsSoundReady(true);
      },
      onloaderror: (id, err) => {
        console.error("Ошибка загрузки:", err);
      },
    });

    setSound(soundInstance);

    const handleFirstClick = () => {
      if (isSoundReady && !isMuted) {
        soundInstance.play();
        document.removeEventListener('click', handleFirstClick);
      }
    };
    document.addEventListener('click', handleFirstClick);

    return () => {
      soundInstance.unload();
      document.removeEventListener('click', handleFirstClick);
    };
  }, [isSoundReady]);

  const toggleMute = () => {
    if (sound) {
      sound.mute(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  return (
    <Router>
      <div className="App">
        {/* Кнопка включения/выключения звука */}
        <button 
          onClick={toggleMute}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '48px', // Увеличенный размер в 2 раза
            color: isMuted ? '#ff0000' : '#4CAF50',
            zIndex: 1000,
            padding: '10px',
            borderRadius: '50%',
            transition: 'all 0.3s ease',
            transform: isMuted ? 'scale(0.9)' : 'scale(1)',
            ':hover': {
              transform: 'scale(1.1)'}
          }}
        >
          {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>

        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-game" element={<CreateGame />} />
          <Route path="/join-game" element={<JoinGame />} />
          <Route path="/game" element={<Game />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        <footer>
          <p>Разработали Анучина Алена, Белослудцева Ксения и Харитонова Вероника, 2025</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;