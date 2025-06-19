import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase'; // Импортируйте инициализированный экземпляр Firestore
import { doc, getDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';

function JoinGame() {
  const [playerName, setPlayerName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState(null);
  const navigate = useNavigate();
  
  // Очистка подписки при размонтировании компонента
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleJoinGame = async () => {
    try {
      const roomDocRef = doc(db, 'rooms', gameCode);
      const roomDoc = await getDoc(roomDocRef);

      if (!roomDoc.exists()) {
        setErrorMessage("Комната с таким кодом не найдена.");
        return;
      }

      const room = roomDoc.data();

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

      // Обновляем список игроков в Firestore
      await updateDoc(roomDocRef, {
        players: arrayUnion(playerName)
      });

      setSuccess(true);
      setErrorMessage("");

      // Слушаем изменения комнаты в реальном времени
      const unsub = onSnapshot(roomDocRef, (doc) => {
        const updatedRoom = doc.data();
        if (updatedRoom && updatedRoom.gameStarted) {
          navigate(`/game?code=${gameCode}&player=${playerName}`);
        }
      });

      setUnsubscribe(() => unsub);

    } catch (error) {
      console.error("Ошибка при присоединении к игре:", error);
      setErrorMessage("Произошла ошибка. Попробуйте снова.");
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
      <button className="back-button" onClick={handleBack} aria-label="Назад">
        ← Назад
      </button>
      
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

      {/* Основной контейнер с измененными размерами */}
      <div style={{
        background: 'rgba(25, 25, 25, 0.7)',
        border: '2px solid #999',
        borderRadius: '12px',
        padding: '25px 30px',
        width: '400px', // Уменьшенная ширина
        textAlign: 'center',
        boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
        margin: '20px auto',
        transform: 'translateY(-10%)' // Сдвиг вверх для центрирования
      }}>
        <h1 style={{
          marginBottom: '25px',
          fontSize: '26px',
          color: 'white'
        }}>Войти в игру</h1>
        
        {success ? (
          <div style={{
            background: 'rgba(70, 70, 90, 0.6)',
            borderLeft: '6px solid #90caf9',
            padding: '15px',
            borderRadius: '8px',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 0 12px rgba(144,202,249,0.4)',
            textAlign: 'left',
            marginBottom: '20px'
          }}>
            <h2 style={{ 
              margin: '0 0 10px 0',
              color: '#e3f2fd',
              fontSize: '20px'
            }}>Успешно!</h2>
            <p style={{ 
              margin: '6px 0',
              fontSize: '15px',
              color: '#e3f2fd'
            }}>
              <span style={{ 
                fontWeight: 'bold',
                color: '#90caf9'
              }}>{playerName}</span>, вы зашли в комнату с кодом: 
              <span style={{ 
                fontWeight: 'bold',
                color: '#90caf9'
              }}> {gameCode}</span>.
            </p>
            <p style={{ 
              margin: '6px 0 0 0',
              fontSize: '15px',
              color: '#e3f2fd'
            }}>
              Ожидаем остальных игроков.
            </p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '20px'
            }}>
              {/* Поле имени (шире) */}
              <input
                type="text"
                placeholder="Ваше имя"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={{
                  padding: '10px 12px',
                  fontSize: '15px',
                  width: '94%',
                  borderRadius: '6px',
                  border: '1px solid #aaa',
                  background: 'rgba(255,255,255,0.85)',
                  color: '#222',
                  outline: 'none'
                }}
              />
              
              <div style={{
                display: 'flex',
                gap: '10px'
              }}>
                {/* Поля кода и пароля (в 2 раза короче) */}
                <input
                  type="text"
                  placeholder="Код игры"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    fontSize: '15px',
                    width: '50%',
                    borderRadius: '6px',
                    border: '1px solid #aaa',
                    background: 'rgba(255,255,255,0.85)',
                    color: '#222',
                    outline: 'none'
                  }}
                />
                
                <input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    fontSize: '15px',
                    width: '50%',
                    borderRadius: '6px',
                    border: '1px solid #aaa',
                    background: 'rgba(255,255,255,0.85)',
                    color: '#222',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
            
            <button 
              onClick={handleJoinGame}
              style={{
                backgroundColor: '#444',
                color: 'white',
                padding: '10px 20px',
                border: '2px solid #999',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '15px',
                transition: 'all 0.3s ease',
                width: '100%',
                margin: '0 auto 15px'
              }}
            >
              Войти в игру
            </button>
            
            {errorMessage && (
              <div style={{
                background: 'rgba(120, 40, 40, 0.6)',
                borderLeft: '6px solid #f44336',
                padding: '12px',
                borderRadius: '6px',
                backdropFilter: 'blur(6px)',
                boxShadow: '0 0 12px rgba(244,67,54,0.3)',
                textAlign: 'left',
                marginBottom: '12px'
              }}>
                <p style={{ 
                  margin: '0',
                  color: '#ffcdd2',
                  fontSize: '14px'
                }}>{errorMessage}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default JoinGame;