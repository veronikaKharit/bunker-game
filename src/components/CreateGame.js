import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateGame() {
  const [playerName, setPlayerName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [password, setPassword] = useState("");
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем наличие комнаты каждые 2 секунды
    if (!gameCode) return;
    
    const interval = setInterval(() => {
      const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
      const room = rooms[gameCode];
      
      if (room) {
        setPlayers(room.players);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [gameCode]);

  const generateGameCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return code;
  };

  const generatePassword = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleCreateGame = () => {
    if (!playerName) {
      alert('Пожалуйста, введите имя');
      return;
    }

    const code = generateGameCode();
    const pass = generatePassword();
    
    const rooms = JSON.parse(localStorage.getItem('rooms')) || {};

    rooms[code] = {
      creator: playerName,
      players: [playerName],
      password: pass,
      gameStarted: false,
    };

    localStorage.setItem('rooms', JSON.stringify(rooms));
    setPlayers([playerName]);
    setGameCode(code);
    setPassword(pass);
  };

  const startGame = () => {
    if (players.length < 2) {
      alert("Необходимо хотя бы 2 игрока для начала игры.");
      return;
    }

    const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
    const room = rooms[gameCode];
    
    if (room) {
      room.gameStarted = true;
      localStorage.setItem('rooms', JSON.stringify(rooms));
      
      // Перенаправляем всех игроков
      navigate(`/game?code=${gameCode}&player=${playerName}`);
    }
  };

  return (
    <div className="create-game-container">
      <h1>Создание игры</h1>
      
      {!gameCode ? (
        <>
          <input
            type="text"
            placeholder="Ваше имя"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button onClick={handleCreateGame}>Создать комнату</button>
        </>
      ) : (
        <div className="room-info">
          <div className="notification success">
            <p>Комната создана! Сообщите игрокам:</p>
            <p className="highlight">Код комнаты: {gameCode}</p>
            <p className="highlight">Пароль: {password}</p>
          </div>
          
          <h3>Игроки в комнате ({players.length}):</h3>
          <ul className="players-list">
            {players.map((player, index) => (
              <li key={index}>{player} {player === playerName && "(Вы)"}</li>
            ))}
          </ul>
          
          <button 
            onClick={startGame} 
            className="start-button"
            disabled={players.length < 2}
          >
            Начать игру
          </button>
          
          <p className="info-note">
            Игроки могут присоединиться, введя код комнаты и пароль на главной странице.
          </p>
        </div>
      )}
    </div>
  );
}
export default CreateGame;