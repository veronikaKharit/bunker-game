import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, doc, setDoc, onSnapshot, updateDoc } from "../firebase"
import { getRandomDisaster, getRandomBunker, generatePlayerTraits } from './Game.js'; // Предполагается, что эти функции определены в gameUtils.js

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
  
  const handleBack = () => {
    navigate(-1);
  };

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

  const handleCreateGame = async () => {
  if (!playerName) {
    alert('Пожалуйста, введите имя');
    return;
  }

  const code = generateGameCode();
  const pass = generatePassword();
  
  try {
    // Создаем документ комнаты
    const roomRef = doc(db, "rooms", code);
    
    await setDoc(roomRef, {
      creator: playerName,
      players: [playerName],
      password: pass,
      gameStarted: false,
    });
    
    setPlayers([playerName]);
    setGameCode(code);
    setPassword(pass);
    
    // Слушаем изменения комнаты
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      const room = doc.data();
      if (room) {
        setPlayers(room.players || []);
      }
    });
    
    // Сохраняем функцию отписки для очистки
    return () => unsubscribe();
    
  } catch (error) {
    console.error("Ошибка создания комнаты:", error);
    alert(`Ошибка создания комнаты: ${error.message}`);
  }
};

  const startGame = async () => {
  if (players.length < 2) {
    alert("Необходимо хотя бы 2 игрока для начала игры.");
    return;
  }

  try {
    const roomRef = doc(db, "rooms", gameCode);
    
    // Генерируем данные для игры
    const disaster = getRandomDisaster();
    const bunker = getRandomBunker();
    
    const playerTraits = {};
    players.forEach(player => {
      playerTraits[player] = generatePlayerTraits();
    });

    await updateDoc(roomRef, {
      gameStarted: true,
      disaster: disaster,
      bunker: bunker,
      playerTraits: playerTraits,
      revealedTraits: {},
      removedPlayers: []
    });
    
    navigate(`/game?code=${gameCode}&player=${playerName}`);
    
  } catch (error) {
    console.error("Ошибка начала игры:", error);
    alert(`Ошибка начала игры: ${error.message}`);
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
      {/* Кнопка "Назад" */}
      <button className="back-button" onClick={handleBack} aria-label="Назад"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.5)',
          color: 'white',
          border: '1px solid white',
          borderRadius: '5px',
          padding: '8px 15px',
          cursor: 'pointer',
          zIndex: 1
        }}
      >
        ← Назад
      </button>
      
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

      {/* Основной контейнер - теперь он всегда по центру */}
      <div style={{
        background: 'rgba(25, 25, 25, 0.7)',
        border: '2px solid #999',
        borderRadius: '12px',
        padding: '30px 40px',
        width: '90%',
        maxWidth: '700px',
        textAlign: 'center',
        boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
        margin: '20px auto',
        position: 'relative',
        top: '0',
        transform: 'none'
      }}>
        {!gameCode ? (
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px'
          }}>
            <h1 style={{
              marginBottom: '10px',
              fontSize: '28px',
              color: 'white'
            }}>Создание игры</h1>
            
            <input
              type="text"
              placeholder="Ваше имя"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={{
                padding: '12px 15px',
                fontSize: '16px',
                width: '100%',
                maxWidth: '300px',
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
                width: '100%',
                maxWidth: '300px'
              }}
            >
              Создать комнату
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h1 style={{
              marginBottom: '10px',
              fontSize: '28px',
              color: 'white'
            }}>Комната создана</h1>
            
            <div style={{
              background: 'rgba(70, 70, 90, 0.6)',
              borderLeft: '6px solid #90caf9',
              padding: '20px',
              borderRadius: '8px',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 0 12px rgba(144,202,249,0.4)'
            }}>
              <p style={{ margin: '0 0 10px 0', color: '#e3f2fd' }}>Сообщите игрокам:</p>
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
      
        
    </div>
  );
}

export default CreateGame;