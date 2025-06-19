import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import data from '../data.json';
import dataPlayer from '../dataPlayer.json';
import { Trash2 } from 'lucide-react';import { 
  db, 
  doc, 
  onSnapshot, 
  updateDoc,
  getDoc,
  setDoc, 
} from "../firebase";

// Списки для генерации характеристик
const GENDERS = dataPlayer.genders.map(item => item.gender);
const BODY_TYPES = dataPlayer.body_types.map(item => item.body_type);
const TRAITS = dataPlayer.traits.map(item => item.trait);
const PROFESSIONS = dataPlayer.professions.map(item => item.profession);
const HEALTH_STATUSES = dataPlayer.healths.map(item => item.health);
const HOBBIES = dataPlayer.hobbies.map(item => item.hobby);
const BACKPACK_ITEMS = dataPlayer.items.map(item => item.item);
const ADDITIONAL_INFO = dataPlayer.facts.map(item => item.fact);

const traitsList = [
  { key: 'gender', label: 'Биология' },
  { key: 'bodyType', label: 'Телосложение' },
  { key: 'trait', label: 'Человеческая черта' },
  { key: 'profession', label: 'Профессия' },
  { key: 'health', label: 'Здоровье' },
  { key: 'hobby', label: 'Хобби' },
  { key: 'backpack', label: 'Инвентарь' },
  { key: 'additionalInfo', label: 'Дополнительное сведение' },
];

// Helper functions
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

// Генерация характеристик для игрока
export const generatePlayerTraits = () => ({
  gender: getRandomElement(GENDERS),
  bodyType: getRandomElement(BODY_TYPES),
  trait: getRandomElement(TRAITS),
  profession: getRandomElement(PROFESSIONS),
  health: getRandomElement(HEALTH_STATUSES),
  hobby: getRandomElement(HOBBIES),
  backpack: getRandomElement(BACKPACK_ITEMS),
  additionalInfo: getRandomElement(ADDITIONAL_INFO),
});

/*// Данные об апокалипсисе
const DISASTER = {
  title: "Ядерная зима",
  description: "Глобальный ядерный конфликт привел к ядерной зиме. Поверхность Земли покрыта радиоактивными осадками, температура упала до -50°C. Солнечный свет почти не проникает через плотные облака пепла."
};

// Данные о бункере
const BUNKER = {
  size: "150 кв. метров",
  duration: "5 лет",
  foodSupply: "Консервированные продукты на 3 года",
  features: "Система очистки воздуха, гидропонная ферма, генератор на геотермальной энергии"
};*/

export const getRandomDisaster = () => {
  return data.disasters[Math.floor(Math.random() * data.disasters.length)];
};

export const getRandomBunker = () => {
  return data.bunkers[Math.floor(Math.random() * data.bunkers.length)];
};

// Список характеристик для таблицы
const traitsList = [
  { key: 'gender', label: 'Биология' },
  { key: 'bodyType', label: 'Телосложение' },
  { key: 'trait', label: 'Человеческая черта' },
  { key: 'profession', label: 'Профессия' },
  { key: 'health', label: 'Здоровье' },
  { key: 'hobby', label: 'Хобби' },
  { key: 'backpack', label: 'Инвентарь' },
  { key: 'additionalInfo', label: 'Дополнительное сведение' },
];

// Звук таймера
const playTimerSound = () => {
  const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Audio play failed:', e));
};

function Game() {
  // State
  const [disaster, setDisaster] = useState(null);
  const [bunker, setBunker] = useState(null);
  const [gameCode, setGameCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerTraits, setPlayerTraits] = useState({});
  const [revealedTraits, setRevealedTraits] = useState({});
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerEnded, setTimerEnded] = useState(false);
  const [removedPlayers, setRemovedPlayers] = useState([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [playerWon, setPlayerWon] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const unsubscribeRef = useRef(null);

  // Refs
  const location = useLocation();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const timerRef = useRef(null);
  const soundPlayedRef = useRef(false);

  const fixedPlayers = useRef([]);
  const fixedPlayerTraits = useRef({});

  const scrollUp = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollDown = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    }
  };

  // Проверка на окончание игры (когда осталось <= половины игроков)
  const checkGameOver = async (currentRemovedPlayers) => {
  const totalPlayers = fixedPlayers.current.length;
  const remainingPlayers = totalPlayers - currentRemovedPlayers.length;
  
  if (remainingPlayers <= totalPlayers / 2) {
    setGameOver(true);
    const won = !currentRemovedPlayers.includes(playerName);
    setPlayerWon(won);
    setShowResult(true);
    
    try {
      const roomRef = doc(db, "rooms", gameCode);
      
      // Получаем текущие данные комнаты
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return;
      
      const room = roomSnap.data();
      
      // Создаем объект со всеми раскрытыми характеристиками
      const allRevealed = {};
      fixedPlayers.current.forEach(player => {
        // Если характеристики игрока уже есть в данных - используем их
        if (room.playerTraits && room.playerTraits[player]) {
          allRevealed[player] = room.playerTraits[player];
        }
      });
      
      // Обновляем документ в Firestore
      await updateDoc(roomRef, {
        revealedTraits: allRevealed
      });
      
      // Обновляем локальное состояние
      setRevealedTraits(allRevealed);
      
    } catch (error) {
      console.error("Ошибка при завершении игры:", error);
    }
    
    return true;
  }
  return false;
};

  // Обработчик событий хранилища
  // Функция для запуска интервала таймера
  const startTimerInterval = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    soundPlayedRef.current = false;
    setTimeLeft(initialTime);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimerRunning(false);
          setTimerEnded(true);
          playTimerSound();
          setTimeout(() => setTimerEnded(false), 3000);
          stopTimerForRoom(gameCode);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  const player = params.get("player");
  
  setGameCode(code);
  setPlayerName(player);
  
  if (!code) return;

  const roomRef = doc(db, "rooms", code);
  
  // Слушаем изменения комнаты
  const unsubscribeRoom = onSnapshot(roomRef, (doc) => {
    const room = doc.data();
    if (room) {
      setPlayers(room.players || []);
      setGameStarted(room.gameStarted || false);
      setDisaster(room.disaster || null);
      setBunker(room.bunker || null);
      setRevealedTraits(room.revealedTraits || {});
      setRemovedPlayers(room.removedPlayers || []);
      setPlayerTraits(room.playerTraits || {});

      if (room.gameStarted) {
        fixedPlayers.current = [...room.players];
        fixedPlayerTraits.current = room.playerTraits || {};
        checkGameOver(room.removedPlayers || []);
      }
    }
  });

  // Для таймера создаем отдельную коллекцию
  const timerRef = doc(db, "timers", code);
  const unsubscribeTimer = onSnapshot(timerRef, (doc) => {
    const timerData = doc.data();
    if (timerData) {
      // ... та же логика для таймера ...
    }
  });

  return () => {
    unsubscribeRoom();
    unsubscribeTimer();
    if (timerRef.current) clearInterval(timerRef.current);
  };
}, [location]);



  // Раскрытие характеристики для всех игроков
  const revealTrait = async (player, traitKey) => {
  if (window.confirm('Вы уверены, что хотите раскрыть эту характеристику для всех игроков?')) {
    try {
      const roomRef = doc(db, "rooms", gameCode);
      
      await updateDoc(roomRef, {
        [`revealedTraits.${player}.${traitKey}`]: fixedPlayerTraits.current[player][traitKey]
      });
      
    } catch (error) {
      console.error("Ошибка раскрытия характеристики:", error);
    }
  }
};

  // Удаление игрока
const removePlayer = async (playerToRemove) => {
  if (!window.confirm(`Вы точно хотите удалить ${playerToRemove} из игры?`)) {
    return;
  }

  try {
    const roomDocRef = doc(db, "rooms", gameCode);
    const roomDoc = await getDoc(roomDocRef);

    if (!roomDoc.exists()) {
      alert("Комната не найдена!");
      return;
    }

    const roomData = roomDoc.data();
    const currentRemovedPlayers = roomData.removedPlayers || [];
    const currentRevealedTraits = roomData.revealedTraits || {};

    // Если игрок уже удален - ничего не делаем
    if (currentRemovedPlayers.includes(playerToRemove)) {
      return;
    }

    // Проверяем наличие характеристик игрока
    if (!roomData.playerTraits || !roomData.playerTraits[playerToRemove]) {
      throw new Error(`Характеристики игрока ${playerToRemove} не найдены`);
    }

    // Создаем обновленные данные
    const updatedRemovedPlayers = [...currentRemovedPlayers, playerToRemove];
    const updatedRevealedTraits = {
      ...currentRevealedTraits,
      [playerToRemove]: { ...roomData.playerTraits[playerToRemove] }
    };

    // Обновляем документ в Firestore
    await updateDoc(roomDocRef, {
      removedPlayers: updatedRemovedPlayers,
      revealedTraits: updatedRevealedTraits
    });

    // Обновляем локальное состояние
    setRemovedPlayers(updatedRemovedPlayers);
    setRevealedTraits(updatedRevealedTraits);

    // Проверяем, завершена ли игра
    const isGameOver = checkGameOver(updatedRemovedPlayers, roomData.players);
    
    if (isGameOver) {
      // Определяем, является ли текущий игрок победителем
      const isWinner = !updatedRemovedPlayers.includes(playerName);
      setPlayerWon(isWinner);
      setShowResult(true);
      
      // Для проигравших скрываем сообщение через 10 секунд
      if (!isWinner) {
        setTimeout(() => setShowResult(false), 10000);
      }
    } else {
      // Если игра продолжается, показываем проигрыш только удаленному игроку
      if (playerToRemove === playerName) {
        setPlayerWon(false);
        setShowResult(true);
        setTimeout(() => setShowResult(false), 10000);
      }
    }

  } catch (error) {
    console.error("Ошибка при удалении игрока:", error);
    alert(`Ошибка: ${error.message}`);
  }
};

  // Управление таймером
  const startTimer = async () => {
  const totalSeconds = timerMinutes * 60 + timerSeconds;
  setTimeLeft(totalSeconds);
  setTimerRunning(true);
  setTimerEnded(false);
  
  const endTime = Date.now() + totalSeconds * 1000;
  
  try {
    const timerRef = doc(db, "timers", gameCode);
    await setDoc(timerRef, {
      endTime,
      running: true
    });
    
    startTimerInterval();
    
  } catch (error) {
    console.error("Ошибка запуска таймера:", error);
  }
};

const stopTimer = async () => {
  try {
    const timerRef = doc(db, "timers", gameCode);
    await updateDoc(timerRef, { running: false });
    
    clearInterval(timerRef.current);
    setTimerRunning(false);
    
  } catch (error) {
    console.error("Ошибка остановки таймера:", error);
  }
};

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isMaster = players[0] === playerName;

  // Render
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Загрузка данных игры...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Вернуться на главную</button>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <GameLobby 
        gameCode={gameCode}
        playerName={playerName}
        players={players}
        isMaster={isMaster}
        navigate={navigate}
        scrollUp={scrollUp}
        scrollDown={scrollDown}
        scrollContainerRef={scrollContainerRef}
        onStartGame={async () => {
          try {
            const traits = {};
            players.forEach(player => {
              traits[player] = generatePlayerTraits();
            });
            
            await startGame(gameCode, {
              playerTraits: traits,
              disaster: getRandomDisaster(),
              bunker: getRandomBunker(),
              revealedTraits: Object.keys(traits).reduce((acc, player) => {
                acc[player] = {};
                return acc;
              }, {})
            });
            
            fixedPlayers.current = [...players];
            fixedPlayerTraits.current = traits;
            setPlayerTraits(traits);
          } catch (err) {
            console.error('Ошибка начала игры:', err);
            alert('Не удалось начать игру');
          }
        }}
      />
    );
  }

  return (
    <GamePlayingScreen
      gameOver={gameOver}
      playerWon={playerWon}
      showResult={showResult}
      setShowResult={setShowResult}
      disaster={disaster}
      bunker={bunker}
      playerName={playerName}
      isMaster={isMaster}
      navigate={navigate}
      scrollUp={scrollUp}
      scrollDown={scrollDown}
      scrollContainerRef={scrollContainerRef}
      timerEnded={timerEnded}
      timeLeft={timeLeft}
      formatTime={formatTime}
      timerMinutes={timerMinutes}
      timerSeconds={timerSeconds}
      setTimerMinutes={setTimerMinutes}
      setTimerSeconds={setTimerSeconds}
      timerRunning={timerRunning}
      startTimer={startTimer}
      stopTimer={stopTimer}
      fixedPlayerTraits={fixedPlayerTraits}
      revealedTraits={revealedTraits}
      revealTrait={revealTrait}
      traitsList={traitsList}
      fixedPlayers={fixedPlayers}
      removedPlayers={removedPlayers}
      removePlayer={removePlayer}
      showRules={showRules}
    setShowRules={setShowRules}
    />
  );
}

// Компонент лобби игры
const GameLobby = ({
  gameCode,
  playerName,
  players,
  isMaster,
  navigate,
  scrollUp,
  scrollDown,
  scrollContainerRef,
  onStartGame
}) => (
  <div className="game-container">
    <button 
      onClick={() => navigate('/')}
      className="back-button"
    >
      ← Назад
    </button>
    
    <div className="scroll-buttons">
      <button onClick={scrollUp}>↑</button>
      <button onClick={scrollDown}>↓</button>
    </div>

        <div 
          ref={scrollContainerRef}
          style={{
            background: 'rgba(25, 25, 25, 0.7)',
            border: '2px solid #999',
            borderRadius: '12px',
            padding: '40px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            textAlign: 'center',
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': {
              display: 'none'
            }
          }}
        >
          <h1 style={{
            marginBottom: '30px',
            fontSize: '32px',
            color: 'white'
          }}>
            Ожидание начала игры
          </h1>
          
          <div style={{
            background: 'rgba(70, 70, 90, 0.6)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px'
          }}>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>
              Комната: <span style={{ fontWeight: 'bold', color: '#ffcc55' }}>{gameCode}</span>
            </p>
            <p style={{ fontSize: '18px' }}>
              Ваше имя: <span style={{ fontWeight: 'bold', color: '#ffcc55' }}>{playerName}</span>
            </p>
          </div>
          
          <h2 style={{
            fontSize: '24px',
            marginBottom: '20px'
          }}>
            Игроки в комнате ({players.length})
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            marginBottom: '30px'
          }}>
            {players.map((player, index) => (
              <div key={index} style={{
                background: player === playerName 
                  ? 'rgba(255, 204, 85, 0.3)' 
                  : 'rgba(70, 70, 90, 0.6)',
                padding: '15px',
                borderRadius: '8px',
                border: player === playerName 
                  ? '2px solid #ffcc55' 
                  : '2px solid #666'
              }}>
                {player} {player === playerName && "(Вы)"}
              </div>
            ))}
          </div>
          
          <p style={{ fontSize: '18px', color: '#ffcc55' }}>
            Ожидаем, когда создатель начнет игру...
          </p>
        </div>
        
        <style jsx>{`
          .scroll-buttons {
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            flexDirection: column;
            gap: 10px;
            z-index: 100;
          }
          .scroll-buttons button {
            background-color: rgba(40, 40, 40, 0.85);
            color: #FFFFFF;
            border: 1px solid #FFFFFF;
            width: 40px;
            height: 40px;
            border-radius: 6px;
            font-size: 24px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          }
          .scroll-buttons button:hover {
            background-color: rgba(60, 60, 60, 0.9);
            transform: scale(1.1);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
          }
        `}</style>
      </div>
    );
  }

  // Страница с начатой игрой
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      color: 'white',
      background: 'url(/public/images/retouch.jpg) no-repeat center center fixed',
      backgroundSize: 'cover',
      overflow: 'auto',
      animation: timerEnded ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'none'
    }}>
      {/* Сообщение о победе */}
      {showResult && (
        <div 
          onClick={() => {
            setShowResult(false);
            setGameOver(true); // Убедимся, что игра остаётся завершённой
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: !removedPlayers.includes(playerName) 
              ? 'rgba(0, 255, 255, 0.3)' 
              : 'rgba(255, 0, 0, 0.3)',
            zIndex: 999, // Убедимся, что поверх всего
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            animation: 'fadeIn 0.3s ease-in-out'
          }}
        >
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '40px',
            borderRadius: '20px',
            textAlign: 'center',
            maxWidth: '80%',
             border: `4px solid ${!removedPlayers.includes(playerName) ? '#00ffff' : '#ff0000'}`,
            boxShadow: `0 0 30px ${!removedPlayers.includes(playerName) ? '#00ffff' : '#ff0000'}`
          }}>
            <h1 style={{
              fontSize: '48px',
              color: !removedPlayers.includes(playerName) ? '#00ffff' : '#ff0000',
              marginBottom: '20px'
            }}>
              {!removedPlayers.includes(playerName) ? 'Вы выиграли!' : 'Вас выгнали!'}
            </h1>
            <p style={{
              fontSize: '32px',
              color: 'white'
            }}>
              {!removedPlayers.includes(playerName) 
                ? 'Вы будете спасать человечество!!!' 
                : 'Кажется, ваша жизнь закончится в ближайшее время вне бункера...'
              }
            </p>
          </div>
        </div>
      )}

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

    <button 
      onClick={() => navigate('/')}
      className="back-button"
    >
      ← Назад
    </button>

    <div className="scroll-buttons">
      <button onClick={scrollUp}>↑</button>
      <button onClick={scrollDown}>↓</button>
    </div>

    <div 
      ref={scrollContainerRef}
      className="game-content"
    >
      <h1>{gameOver ? 'Игра окончена!' : 'Игра началась!'}</h1>

      <div className="disaster-box">
        <h2>Катаклизм: {disaster.title}</h2>
        <p>{disaster.description}</p>
      </div>

      <div className="bunker-box">
        <h2>Ваше убежище</h2>
        <div className="bunker-details">
          <div>
            <p><strong>Размер:</strong> {bunker.size}</p>
            <p><strong>Время нахождения:</strong> {bunker.time}</p>
          </div>
          <div>
            <p><strong>Запасы еды:</strong> {bunker.food}</p>
            <p><strong>Особенности:</strong> {bunker.features}</p>
          </div>
        </div>
      </div>

      <div className="timer-box">
        <h2>Таймер</h2>
        <div className="timer-display">{formatTime(timeLeft)}</div>
        
        {isMaster && !gameOver && (
          <>
            {!timerRunning && (
              <div className="timer-inputs">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                />
                <span>:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={timerSeconds}
                  onChange={(e) => setTimerSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                />
              </div>
            )}
            
            <div className="timer-controls">
              {!timerRunning ? (
                <button onClick={startTimer} className="timer-start">
                  Старт
                </button>
              ) : (
                <button onClick={stopTimer} className="timer-stop">
                  Стоп
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {fixedPlayerTraits.current[playerName] && (
        <div className="traits-box">
          <h2>Ваши характеристики</h2>
          
          <div className="traits-grid">
            {Object.entries(fixedPlayerTraits.current[playerName]).map(([key, value]) => (
              <div key={key} className="trait-card">
                <strong>{traitsList.find(t => t.key === key)?.label || key}:</strong>
                <p>{value}</p>
                {!revealedTraits[playerName]?.[key] && !gameOver && (
                  <button
                    onClick={() => revealTrait(playerName, key)}
                    className="reveal-button"
                    title="Раскрыть для всех"
                  >
                    Раскрыть
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="players-table-container">
        <h2>Таблица характеристик</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Характеристика</th>
                {[...fixedPlayers.current]
                  .sort((a, b) => {
                    const aRemoved = removedPlayers.includes(a);
                    const bRemoved = removedPlayers.includes(b);
                    if (aRemoved && !bRemoved) return 1;
                    if (!aRemoved && bRemoved) return -1;
                    return 0;
                  })
                  .map(player => (
                  <th 
                    key={player} 
                    className={`
                      ${player === playerName ? 'you' : ''}
                      ${removedPlayers.includes(player) ? 'removed' : ''}
                      ${gameOver && !removedPlayers.includes(player) ? 'winner' : ''}
                    `}
                  >
                    <div className="player-header">
                      <span>{player} {player === playerName && "(Вы)"}</span>
                      {isMaster && !gameOver && (
                        <button
                          onClick={() => removePlayer(player)}
                          className="remove-player-button"
                          title="Удалить игрока"
                        >
                          <Trash2 size={20} color="white" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {traitsList.map(trait => (
                <tr key={trait.key}>
                  <td>{trait.label}</td>
                  {[...fixedPlayers.current]
                    .sort((a, b) => {
                      const aRemoved = removedPlayers.includes(a);
                      const bRemoved = removedPlayers.includes(b);
                      if (aRemoved && !bRemoved) return 1;
                      if (!aRemoved && bRemoved) return -1;
                      return 0;
                    })
                    .map(player => {
                    const isRevealed = revealedTraits[player] && revealedTraits[player][trait.key];
                    const isRemoved = removedPlayers.includes(player);
                    return (
                      <td 
                        key={`${player}-${trait.key}`}
                        className={`
                          ${player === playerName ? 'you' : ''}
                          ${isRemoved ? 'removed' : ''}
                          ${gameOver && !isRemoved ? 'winner' : ''}
                        `}
                      >
                        {revealedTraits[player]?.[trait.key] || '❓'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <style jsx>{`
      .game-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        position: relative;
        color: white;
        background: url(/public/images/retouch.jpg) no-repeat center center fixed;
        background-size: cover;
        overflow: auto;
      }
      
      .result-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        animation: fadeIn 0.3s ease-in-out;
      }
      
      .result-box {
        background: rgba(0, 0, 0, 0.8);
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        max-width: 80%;
      }
      
      .result-box h1 {
        font-size: 48px;
        margin-bottom: 20px;
      }
      
      .result-box p {
        font-size: 32px;
        color: white;
      }
      
      .game-content {
        background: rgba(25, 25, 25, 0.7);
        border: 2px solid #999;
        border-radius: 12px;
        padding: 40px;
        width: 100%;
        max-width: 900px;
        max-height: 80vh;
        overflow: auto;
        text-align: center;
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        margin: 20px auto;
      }
      
      .game-content h1 {
        margin-bottom: 30px;
        font-size: 32px;
        color: white;
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
      }
      
      .disaster-box, .bunker-box, .timer-box, .traits-box {
        background: rgba(70, 70, 90, 0.6);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 30px;
        text-align: left;
      }
      
      .disaster-box {
        border-left: 6px solid #ff5555;
      }
      
      .bunker-box {
        border-left: 6px solid #55aaff;
      }
      
      .timer-box {
        border-left: 6px solid #55ff55;
      }
      
      .traits-box {
        border-left: 6px solid #ffcc55;
      }
      
      .disaster-box h2 {
        color: #ff5555;
      }
      
      .bunker-box h2 {
        color: #55aaff;
      }
      
      .timer-box h2 {
        color: #55ff55;
      }
      
      .traits-box h2 {
        color: #ffcc55;
      }
      
      .bunker-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      
      .timer-display {
        font-size: 48px;
        font-weight: bold;
        margin: 15px 0;
      }
      
      .timer-inputs {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 15px;
      }
      
      .timer-inputs input {
        width: 60px;
        padding: 8px;
        font-size: 18px;
        text-align: center;
        border-radius: 4px;
        border: 1px solid #666;
      }
      
      .timer-controls {
        display: flex;
        justify-content: center;
        gap: 10px;
      }
      
      .timer-start {
        background-color: #55ff55;
        color: #333;
      }
      
      .timer-stop {
        background-color: #ff5555;
        color: #fff;
      }
      
      .timer-start, .timer-stop {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
      }
      
      .traits-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }
      
      .trait-card {
        background: rgba(0, 0, 0, 0.3);
        padding: 15px;
        border-radius: 8px;
        position: relative;
      }
      
      .reveal-button {
        position: absolute;
        right: 10px;
        top: 10px;
        background: #ffcc55;
        color: #333;
        border: none;
        border-radius: 20%;
        width: 25px;
        height: 40px;
        cursor: pointer;
        font-weight: bold;
      }
      
      .players-table-container {
        margin-bottom: 30px;
      }
      
      .table-wrapper {
        overflow-x: auto;
      }
      
      table {
        width: 100%;
        background: rgba(70, 70, 90, 0.6);
        border-radius: 8px;
        border-collapse: separate;
        border-spacing: 0;
      }
      
      thead tr {
        background: rgba(90, 90, 110, 0.8);
      }
      
      th, td {
        padding: 12px 15px;
        text-align: center;
        border-bottom: 1px solid #666;
      }
      
      th.you {
        color: #ffcc55;
      }
      
      th.removed {
        background: rgba(50, 50, 50, 0.8);
      }
      
      th.winner {
        background: rgba(0, 200, 255, 0.3);
      }
      
      .player-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }
          `}</style>
      
       {/* Кнопка "Правила игры" */}
        <button 
          onClick={() => setShowRules(true)}
          style={{
            position: 'absolute',
            top: '15%',
            left: '20px',
            transform: 'translateY(-50%)',
            backgroundColor: '#444',
            color: 'white',
            padding: '10px 5px',
            border: '2px solid #999',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            zIndex: 100,
            writingMode: 'horizontal-tb',
            textOrientation: 'mixed',
            height: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          Правила
        </button>
             {/* Модальное окно с правилами */}
        {showRules && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            overflow: 'auto'
          }}>
            <div style={{
              backgroundColor: 'rgba(30, 30, 30, 0.9)',
              border: '2px solid #666',
              borderRadius: '10px',
              padding: '30px',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}>
               <div className="rules-modal">
          <div className="rules-content">
            <button 
              className="close-rules"
              onClick={() => setShowRules(false)}
            >
              ×
            </button>
              
              <h1 style={{ color: '#ffffff', textAlign: 'center', marginBottom: '20px' }}>Правила игры "Бункер"</h1>
              
              <section>
                <h2>Введение</h2>
                <p>Можете ли вы представить, каково это — пережить глобальную катастрофу? Думаю, что нет... Именно для этого был создан «Бункер Онлайн», чтобы вы могли почувствовать, каково это. Наша игра очень проста, и на изучение правил вам не понадобится много времени! Уже после первой игры вы будете полностью понимать, как играть. Также перед началом игры советуем вам приготовить вкусный чай или кофе, взять печенье и с головой погрузиться в игру!</p>
              </section>

              <section>
                <h2>История</h2>
                <p>На Земле вот-вот произойдёт катастрофа, а может, она уже началась! Я, как и большинство людей, в панике пытаюсь выжить и найти укрытие, чтобы спасти свою жизнь...</p>
                <p>...Тех, кто не попадёт, ждёт верная смерть. Так началась моя история выживания...</p>
              </section>

              <section>
                <h2>Обзор</h2>

                <h3>Катаклизм</h3>
                <p>Описание текущего для игры катаклизма. Как это произошло, что случилось и чёткое понимание того, с чем связаны проблемы, что даст вам понять в процессе игры, кто из людей вам подходит, а кого нужно выгнать (см. Катастрофы).</p>

                <h3>Бункер</h3>
                <p>Описание найденного бункера. Единственный шанс выжить в случае катаклизма — попасть в бункер. У вас есть информация о времени его постройки, местонахождении и данные о спальных комнатах.</p>
                <ul>
                  <li>Размер бункера — общая площадь убежища.</li>
                  <li>Время нахождения — сколько времени вам потребуется, чтобы пережить катастрофу.</li>
                  <li>Количество еды — запас продуктов, которого хватит на время пребывания.</li>
                  <li>В бункере есть — вещи, полезные для выживания.</li>
                </ul>
                <p>В зависимости от содержимого бункера вам предстоит определить, кто из выживших будет более полезен (см. Информацию о бункере).</p>

                <h3>Описание персонажа</h3>
                <p>Ваш герой обладает следующими характеристиками:</p>
                <ul>
                  <li>Пол</li>
                  <li>Телосложение</li>
                  <li>Человеческая черта</li>
                  <li>Профессия</li>
                  <li>Здоровье</li>
                  <li>Хобби / Увлечение</li>
                  <li>Фобия / Страх</li>
                  <li>Крупный инвентарь</li>
                  <li>Рюкзак</li>
                  <li>Дополнительное сведение</li>
                  <li>Спец. возможность</li>
                </ul>

                <h3>Заметки</h3>
                <p>Место для заметок, которые можно делать во время игры.</p>

                <h3>Панель ведущего</h3>
                <p>Набор функций для использования специальных возможностей игроков и управления лагерем и таймером.</p>
              </section>

              <section>
                <h2>Процесс игры</h2>
                <p>В первом игровом раунде все начинается с представления друг другу (см. Раунд игры)...</p>
                <p>...В конце игры игроки, попавшие в бункер, раскрывают свои характеристики. Ведущий подводит итог (см. «Победа в игре»).</p>
              </section>

              <section>
                <h2>Количество игроков</h2>
                <h3>Характеристики для открытия</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#444' }}>
                      <th style={{ padding: '10px', border: '1px solid #666' }}>Игроки</th>
                      <th style={{ padding: '10px', border: '1px solid #666' }}>1-й раунд</th>
                      <th style={{ padding: '10px', border: '1px solid #666' }}>2-й раунд</th>
                      <th style={{ padding: '10px', border: '1px solid #666' }}>3-й раунд</th>
                      <th style={{ padding: '10px', border: '1px solid #666' }}>С 4-го по 7-й</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td style={{ padding: '10px', border: '1px solid #666' }}>6</td><td style={{ padding: '10px', border: '1px solid #666' }}>3</td><td style={{ padding: '10px', border: '1px solid #666' }}>3</td><td style={{ padding: '10px', border: '1px solid #666' }}>2</td><td style={{ padding: '10px', border: '1px solid #666' }}>—</td></tr>
                    <tr><td style={{ padding: '10px', border: '1px solid #666' }}>7-8</td><td style={{ padding: '10px', border: '1px solid #666' }}>3</td><td style={{ padding: '10px', border: '1px solid #666' }}>3</td><td style={{ padding: '10px', border: '1px solid #666' }}>1</td><td style={{ padding: '10px', border: '1px solid #666' }}>по 1</td></tr>
                    <tr><td style={{ padding: '10px', border: '1px solid #666' }}>9-10</td><td style={{ padding: '10px', border: '1px solid #666' }}>3</td><td style={{ padding: '10px', border: '1px solid #666' }}>2</td><td style={{ padding: '10px', border: '1px solid #666' }}>1</td><td style={{ padding: '10px', border: '1px solid #666' }}>по 1</td></tr>
                    <tr><td style={{ padding: '10px', border: '1px solid #666' }}>11-12</td><td style={{ padding: '10px', border: '1px solid #666' }}>2</td><td style={{ padding: '10px', border: '1px solid #666' }}>2</td><td style={{ padding: '10px', border: '1px solid #666' }}>1</td><td style={{ padding: '10px', border: '1px solid #666' }}>по 1</td></tr>
                    <tr><td style={{ padding: '10px', border: '1px solid #666' }}>13-15</td><td style={{ padding: '10px', border: '1px solid #666' }}>2</td><td style={{ padding: '10px', border: '1px solid #666' }}>1</td><td style={{ padding: '10px', border: '1px solid #666' }}>1</td><td style={{ padding: '10px', border: '1px solid #666' }}>по 1</td></tr>
                  </tbody>
                </table>

                <h3>Мест в бункере</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#444' }}>
                      <th style={{ padding: '10px', border: '1px solid #666' }}>Выживших</th>
                      <th style={{ padding: '10px', border: '1px solid #666' }}>6-7</th>
                      <th style={{ padding: '10px', border: '1px solid #666' }}>8-9</th>
                      <th style={{ padding: '10px', border: '1px solid #666' }}>10-11</th>
                      <th style={{ padding: '10px', border: '1px solid #666' }}>12-13</th>
                      <th style={{ padding: '10px', border: '1px solid #666' }}>14-15</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '10px', border: '1px solid #666' }}>Мест в бункере</td>
                      <td style={{ padding: '10px', border: '1px solid #666' }}>3</td>
                      <td style={{ padding: '10px', border: '1px solid #666' }}>4</td>
                      <td style={{ padding: '10px', border: '1px solid #666' }}>5</td>
                      <td style={{ padding: '10px', border: '1px solid #666' }}>6</td>
                      <td style={{ padding: '10px', border: '1px solid #666' }}>7</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section>
                <h2>Раунд игры</h2>
                <p>Первый раунд игроки начинают по часовой стрелке, начиная с первого игрока, который нашёл бункер...</p>
              </section>

              <section>
                <h2>Ваш ход</h2>
                <p>Ваш ход — самое время блеснуть! Расскажите свою историю ярко и эмоционально...</p>
              </section>

              <section>
                <h2>Коллективное обсуждение</h2>
                <p>Общее обсуждение длится 1 минуту. Каждый может высказаться.</p>
              </section>

              <section>
                <h2>Голосование</h2>
                <h3>Основные правила</h3>
                <p>Голосование за исключение игрока из временного лагеря проводит ведущий.</p>

                <h3>Пропуск голосования</h3>
                <p>Пропускать голосование можно только в первом раунде...</p>

                <h3>Проведение голосования</h3>
                <p>Каждому игроку даётся 30 секунд на высказывание перед голосованием...</p>

                <h3>Результаты голосования</h3>
                <ul>
                  <li>Игрок с 70% и более голосов — исключается без объяснений.</li>
                  <li>Игрок с наибольшим числом голосов менее 70% — 30 секунд на оправдание.</li>
                  <li>Равенство голосов — дополнительные объяснения и повторное голосование.</li>
                </ul>

                <h3>Завершение голосования</h3>
                <p>После голосования игроки, покидающие лагерь, произносят прощальную речь...</p>
              </section>

              <section>
                <h2>Победа в игре</h2>
                <p>Игра завершается, когда необходимое количество игроков попало в бункер...</p>
              </section>

              <section>
                <h2>Важно!</h2>
                <p>Данный свод правил относится к основному (базовому) паку. Правила расширенных паков могут отличаться.</p>
              </section>
            </div>
          </div>
           </div>
            </div>
        )}
    </div>
  );


export default Game;

