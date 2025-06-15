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
    
    // Форсируем обновление
    const event = new Event('storage');
    window.dispatchEvent(event);
    
    setSuccess(true);
    
    // Проверяем старт игры
    const checkGameStart = setInterval(() => {
      const updatedRooms = JSON.parse(localStorage.getItem('rooms')) || {};
      const updatedRoom = updatedRooms[gameCode];
      
      if (updatedRoom && updatedRoom.gameStarted) {
        clearInterval(checkGameStart);
        navigate(`/game?code=${gameCode}&player=${playerName}`);
      }
    }, 1000);
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
        <div style={{
            display: 'flex',
            gap: '15px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
          <input
            type="text"
            placeholder="Ваше имя"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={{ 
              width: '100%',
                  padding: '15px 20px',
                  marginBottom: '30px',
                  borderRadius: '8px',
                  border: '1px solid #aaa',
                  background: 'rgba(255,255,255,0.85)',
                  color: '#222',
                  fontSize: '20px',
                  boxShadow: 'inset 0 0 4px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s ease',
                  outline: 'none'
            }}
          />
          <input
            type="text"
            placeholder="Код игры"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value)}
            style={{ 
              width: '100%',
                  padding: '15px 20px',
                  marginBottom: '30px',
                  borderRadius: '8px',
                  border: '1px solid #aaa',
                  background: 'rgba(255,255,255,0.85)',
                  color: '#222',
                  fontSize: '20px',
                  boxShadow: 'inset 0 0 4px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s ease',
                  outline: 'none'
            }}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              width: '100%',
                  padding: '15px 20px',
                  marginBottom: '30px',
                  borderRadius: '8px',
                  border: '1px solid #aaa',
                  background: 'rgba(255,255,255,0.85)',
                  color: '#222',
                  fontSize: '20px',
                  boxShadow: 'inset 0 0 4px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s ease',
                  outline: 'none'
            }}
          />
          </div>
              <div style={{ width: '100%', textAlign: 'center' }}>
            <button 
              onClick={handleJoinGame}
              style={{
                color: 'white',
                padding: '15px 30px',
                border: '2px solid #999',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                width: '100%',
                maxWidth: '400px',
              }}
            >
              Войти в игру
            </button>
          </div>
          {errorMessage && <div className="notification error">{errorMessage}</div>}
        </>
      )}
    </div>
  );
}

export default JoinGame;


