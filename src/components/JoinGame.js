import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function JoinGame() {
  const [playerName, setPlayerName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleJoinGame = () => {
    const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
    const room = rooms[gameCode];

    if (!room) {
      setErrorMessage("Комната с таким кодом не найдена.");
      return;
    }

    if (room.password !== password) {
      setErrorMessage("Неверный пароль.");
      return;
    }

    if (room.players.includes(playerName)) {
      setErrorMessage("Игрок с таким именем уже в комнате.");
      return;
    }

    if (room.gameStarted) {
      setErrorMessage("Игра уже началась.");
      return;
    }

    // Обновляем список игроков
    room.players.push(playerName);
    localStorage.setItem('rooms', JSON.stringify(rooms));
    
    setSuccess(true);
    
    // Автоматический переход при старте игры
    const checkGameStart = setInterval(() => {
      const updatedRooms = JSON.parse(localStorage.getItem('rooms')) || {};
      const updatedRoom = updatedRooms[gameCode];
      
      if (updatedRoom && updatedRoom.gameStarted) {
        clearInterval(checkGameStart);
        navigate(`/game?code=${gameCode}&player=${playerName}`);
      }
    }, 2000);
  };

  return (
    <div className="welcome-container">
      <h1>Войти в игру</h1>
      
      {success ? (
        <div className="notification success">
          <h2>Успешно!</h2>
          <p><span className="highlight">{playerName}</span>, вы зашли в комнату с кодом: <span className="highlight">{gameCode}</span>.</p>
          <p>Ожидаем остальных игроков. Игра начнется автоматически, когда создатель запустит игру.</p>
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Ваше имя"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Код игры"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value)}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleJoinGame}>Войти в игру</button>
          {errorMessage && <div className="notification error">{errorMessage}</div>}
        </>
      )}
    </div>
  );
}
export default JoinGame;