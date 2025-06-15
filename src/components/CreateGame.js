import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateGame() {
  const [playerName, setPlayerName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [password, setPassword] = useState("");
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
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
      
      const event = new Event('storage');
      window.dispatchEvent(event);
      
      navigate(`/game?code=${gameCode}&player=${playerName}`);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      color: 'white'
    }}>
      {/* Фоновое изображение с затемнением */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url(/public/images/retouch.jpg) no-repeat center center fixed',
        backgroundSize: 'cover',
        zIndex: -2
      }}></div>
      
      {/* Затемнение фона */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(5px)',
        zIndex: -1
      }}></div>

      {/* Основной контейнер */}
      <div style={{
        background: 'rgba(25, 25, 25, 0.7)',
        border: '2px solid #999',
        borderRadius: '12px',
        padding: '30px 40px',
        maxWidth: '700px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
        margin: '20px auto'
      }}>
        <h1 style={{
          marginBottom: '30px',
          fontSize: '28px',
          color: 'white'
        }}>Создание игры</h1>
        
        {!gameCode ? (
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '15px',
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              placeholder="Ваше имя"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={{
                padding: '12px 15px',
                fontSize: '16px',
                width: '200px',
                borderRadius: '8px',
                border: '1px solid #aaa',
                background: 'rgba(255,255,255,0.85)',
                color: '#222',
                outline: 'none'
              }}
            />
            
            <button 
              onClick={handleCreateGame}
              style={{
                backgroundColor: '#444',
                color: 'white',
                padding: '12px 24px',
                border: '2px solid #999',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                minWidth: '180px'
              }}
            >
              Создать комнату
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              background: 'rgba(70, 70, 90, 0.6)',
              borderLeft: '6px solid #90caf9',
              padding: '20px',
              borderRadius: '8px',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 0 12px rgba(144,202,249,0.4)'
            }}>
              <p style={{ margin: '0 0 10px 0', color: '#e3f2fd' }}>Комната создана! Сообщите игрокам:</p>
              <p style={{ 
                margin: '8px 0',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#90caf9'
              }}>Код комнаты: {gameCode}</p>
              <p style={{ 
                margin: '8px 0 0 0',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#90caf9'
              }}>Пароль: {password}</p>
            </div>
            
            <h3 style={{ 
              marginBottom: '15px',
              color: 'white',
              fontSize: '18px'
            }}>Игроки в комнате ({players.length}):</h3>
            
            <ul style={{
              listStyle: 'none',
              padding: '15px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              width: '100%',
              border: '1px solid #888',
              margin: '0 0 20px 0'
            }}>
              {players.map((player, index) => (
                <li key={index} style={{
                  marginBottom: '8px',
                  padding: '8px 12px',
                  background: player === playerName ? 'rgba(30, 80, 100, 0.7)' : 'rgba(50, 50, 50, 0.7)',
                  borderRadius: '6px',
                  border: player === playerName ? '1px solid #4fc3f7' : '1px solid #666'
                }}>
                  {player} {player === playerName && "(Вы)"}
                </li>
              ))}
            </ul>
            
            <button 
              onClick={startGame}
              disabled={players.length < 2}
              style={{
                backgroundColor: players.length < 2 ? '#555' : '#444',
                color: 'white',
                padding: '12px 24px',
                border: '2px solid #999',
                borderRadius: '8px',
                cursor: players.length < 2 ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                width: '100%',
                maxWidth: '300px',
                margin: '0 auto',
                opacity: players.length < 2 ? 0.7 : 1
              }}
            >
              Начать игру
            </button>
            
            <p style={{ 
              color: '#ccc',
              fontSize: '14px',
              marginTop: '10px'
            }}>
              Игроки могут присоединиться, введя код комнаты и пароль на главной странице.
            </p>
          </div>
        )}
      </div>
      
      <footer style={{
        width: '100%',
        background: 'rgba(30, 30, 30, 0.85)',
        color: '#ccc',
        textAlign: 'center',
        padding: '10px 0',
        fontSize: '14px',
        borderTop: '1px solid #777',
        position: 'fixed',
        bottom: '0',
        left: '0'
      }}>
        Разработали топото, 2025
      </footer>
    </div>
  );
}

export default CreateGame;