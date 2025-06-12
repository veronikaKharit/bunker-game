import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function Game() {
  const [gameCode, setGameCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    const player = params.get("player");
    
    setGameCode(code);
    setPlayerName(player);

    const loadRoomData = () => {
      const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
      const room = rooms[code];
      
      if (room) {
        setPlayers(room.players);
        
        // Если игра не начата, перенаправляем
        if (!room.gameStarted) {
          navigate('/join-game');
        }
      }
    };

    loadRoomData();
    
    // Обновляем данные каждые 3 секунды
    const interval = setInterval(loadRoomData, 3000);
    
    return () => clearInterval(interval);
  }, [location, navigate]);

  return (
    <div className="game-container">
      <h1>Игра "Бункер"</h1>
      <div className="game-info">
        <p>Код комнаты: <span className="highlight">{gameCode}</span></p>
        <p>Ваше имя: <span className="highlight">{playerName}</span></p>
      </div>
      
      <div className="players-section">
        <h2>Игроки ({players.length})</h2>
        <ul className="players-list">
          {players.map((player, index) => (
            <li key={index} className={player === playerName ? "current-player" : ""}>
              {player} {player === playerName && "(Вы)"}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="game-status">
        <p>Ожидаем начала раунда...</p>
      </div>
    </div>
  );
}
export default Game;