import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import data from '../data.json';
import dataPlayer from '../dataPlayer.json';
import { Trash2 } from 'lucide-react';
import { API_URL } from '../config'; 

// API service
import { 
  createRoom, 
  joinRoom, 
  startGame, 
  getRoomData, 
  updateRoomData, 
  revealTraitForPlayer, 
  removePlayerFromGame,
  startTimerForRoom,
  stopTimerForRoom,
   checkServerHealth,
   pingServer,
  subscribeToRoomUpdates
} from '../components/services/gameApi.js'; 

// Constants
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

const generatePlayerTraits = () => ({
  gender: getRandomElement(GENDERS),
  bodyType: getRandomElement(BODY_TYPES),
  trait: getRandomElement(TRAITS),
  profession: getRandomElement(PROFESSIONS),
  health: getRandomElement(HEALTH_STATUSES),
  hobby: getRandomElement(HOBBIES),
  backpack: getRandomElement(BACKPACK_ITEMS),
  additionalInfo: getRandomElement(ADDITIONAL_INFO),
});

const getRandomDisaster = () => data.disasters[Math.floor(Math.random() * data.disasters.length)];
const getRandomBunker = () => data.bunkers[Math.floor(Math.random() * data.bunkers.length)];

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

  // Effects
  useEffect(() => {
    loadRoomData();
    
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [location]);

  // Functions
  const scrollUp = () => scrollContainerRef.current?.scrollBy({ top: -100, behavior: 'smooth' });
  const scrollDown = () => scrollContainerRef.current?.scrollBy({ top: 100, behavior: 'smooth' });

  const checkGameOver = (currentRemovedPlayers) => {
    const totalPlayers = fixedPlayers.current.length;
    const remainingPlayers = totalPlayers - currentRemovedPlayers.length;
    
    if (remainingPlayers <= totalPlayers / 2) {
      setGameOver(true);
      const won = !currentRemovedPlayers.includes(playerName);
      setPlayerWon(won);
      setShowResult(true);
      
      const allRevealed = {};
      fixedPlayers.current.forEach(player => {
        allRevealed[player] = { ...fixedPlayerTraits.current[player] };
      });
      
      updateRoomData(gameCode, { 
        revealedTraits: allRevealed,
        gameOver: true
      });
      
      setRevealedTraits(allRevealed);
      return true;
    }
    return false;
  };

  const startTimerInterval = (initialTime) => {
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





const loadRoomData = async (retryCount = 0) => {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 1000;
  
  try {
    setLoading(true);
    setError(null);

    // 1. Проверка сети
    const networkCheck = await checkNetwork();
    if (!networkCheck.available) {
      throw new Error(formatNetworkError(networkCheck));
    }


    // 2. Получение параметров из URL
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    const player = params.get("player");

    if (!code || !player) {
      navigate('/');
      return;
    }

    // 3. Загрузка данных комнаты
    console.log(`Загрузка данных комнаты ${code}...`);
    const roomData = await getRoomData(code);
    
    if (!roomData) {
      throw new Error(`Комната ${code} не найдена`);
    }

    // 4. Обновление состояния
    setGameCode(code);
    setPlayerName(player);
    setPlayers(roomData.players || []);
    setGameStarted(roomData.gameStarted || false);
    setDisaster(roomData.disaster || null);
    setBunker(roomData.bunker || null);
    setRevealedTraits(roomData.revealedTraits || {});
    setRemovedPlayers(roomData.removedPlayers || []);

    if (roomData.gameStarted) {
      fixedPlayers.current = [...roomData.players];
      fixedPlayerTraits.current = roomData.playerTraits || {};
      setPlayerTraits(roomData.playerTraits || {});
    }

    // 5. Настройка подписки на обновления
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    unsubscribeRef.current = subscribeToRoomUpdates(code, (data) => {
      if (!data) return;
      
      setPlayers(data.players || []);
      setGameStarted(data.gameStarted || false);
      setDisaster(data.disaster || null);
      setBunker(data.bunker || null);
      setRevealedTraits(data.revealedTraits || {});
      setRemovedPlayers(data.removedPlayers || []);
    });

    setLoading(false);

  } catch (err) {
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return loadRoomData(retryCount + 1);
    }
    setError(err.message);
    setLoading(false);
  }
};

async function checkNetwork() {
  try {
    console.log(`Проверяем соединение с ${API_URL}/health`);
    const response = await fetch(`${API_URL}/health`, {
      signal: AbortSignal.timeout(3000)
    });
    
    if (!response.ok) {
      throw new Error(`Сервер ответил ${response.status}`);
    }
    
    return { available: true };
  } catch (error) {
    console.error(`Ошибка подключения к ${API_URL}:`, error);
    return { 
      available: false,
      error: error.message
    };
  }
}

function formatNetworkError(check) {
  const messages = {
    connection_failed: `
      Не удалось установить соединение с сервером.
      Проверьте:
      1. Сервер запущен? (команда: node server.js)
      2. Брандмауэр разрешает подключения на порту 3000?
      3. Вы используете правильный URL? (${API_URL})
    `,
    server_error: `
      Сервер ответил с ошибкой.
      Проверьте консоль сервера для деталей.
    `
  };
  
  return messages[check.reason] || 'Неизвестная сетевая ошибка';
}







// В рендере добавьте отображение статуса подключения:
if (connectionStatus === 'disconnected') {
  return (
    <div className="error-screen">
      <h2>Ошибка подключения</h2>
      <p>{error || 'Нет соединения с сервером'}</p>
      <button onClick={loadRoomData}>Повторить попытку</button>
      <button onClick={() => navigate('/')}>Вернуться на главную</button>
    </div>
  );
}

// Вспомогательная функция для сравнения массивов
function arraysEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  
  return true;
}

  const revealTrait = async (player, traitKey) => {
    if (window.confirm('Вы уверены, что хотите раскрыть эту характеристику для всех игроков?')) {
      try {
        await revealTraitForPlayer(
          gameCode, 
          player, 
          traitKey, 
          fixedPlayerTraits.current[player][traitKey]
        );
      } catch (err) {
        console.error('Ошибка раскрытия характеристики:', err);
        alert('Не удалось раскрыть характеристику');
      }
    }
  };

  const removePlayer = async (playerToRemove) => {
    if (window.confirm(`Вы точно хотите удалить ${playerToRemove} из игры?`)) {
      try {
        await removePlayerFromGame(
          gameCode, 
          playerToRemove, 
          fixedPlayerTraits.current[playerToRemove]
        );
        
        if (playerToRemove === playerName && playerName !== players[0]) {
          setPlayerWon(false);
          setShowResult(true);
          setTimeout(() => setShowResult(false), 10000);
        }
      } catch (err) {
        console.error('Ошибка удаления игрока:', err);
        alert('Не удалось удалить игрока');
      }
    }
  };

  const startTimer = async () => {
    const totalSeconds = timerMinutes * 60 + timerSeconds;
    setTimerRunning(true);
    setTimerEnded(false);
    
    try {
      await startTimerForRoom(gameCode, totalSeconds);
      startTimerInterval(totalSeconds);
    } catch (err) {
      console.error('Ошибка запуска таймера:', err);
      alert('Не удалось запустить таймер');
    }
  };

  const stopTimer = async () => {
    clearInterval(timerRef.current);
    setTimerRunning(false);
    
    try {
      await stopTimerForRoom(gameCode);
    } catch (err) {
      console.error('Ошибка остановки таймера:', err);
      alert('Не удалось остановить таймер');
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
      className="game-content"
    >
      <h1>Ожидание начала игры</h1>
      
      <div className="info-box">
        <p>Комната: <span className="highlight">{gameCode}</span></p>
        <p>Ваше имя: <span className="highlight">{playerName}</span></p>
      </div>
      
      <h2>Игроки в комнате ({players.length})</h2>
      
      <div className="players-grid">
        {players.map((player, index) => (
          <div 
            key={index} 
            className={`player-card ${player === playerName ? 'you' : ''}`}
          >
            {player} {player === playerName && "(Вы)"}
          </div>
        ))}
      </div>
      
      {isMaster && (
        <button 
          onClick={onStartGame}
          className="start-game-button"
        >
          Начать игру
        </button>
      )}
      
      {!isMaster && (
        <p className="waiting-message">
          Ожидаем, когда создатель начнет игру...
        </p>
      )}
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
      
      .back-button {
        position: absolute;
        top: 20px;
        left: 20px;
        background-color: #444;
        color: white;
        padding: 10px 20px;
        border: 2px solid #999;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        z-index: 100;
      }
      
      .scroll-buttons {
        position: fixed;
        right: 20px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
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
      
      .game-content {
        background: rgba(25, 25, 25, 0.7);
        border: 2px solid #999;
        border-radius: 12px;
        padding: 40px;
        width: 100%;
        max-width: 600px;
        max-height: 80vh;
        overflow: auto;
        text-align: center;
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        scrollbar-width: none;
      }
      
      .game-content h1 {
        margin-bottom: 30px;
        font-size: 32px;
        color: white;
      }
      
      .info-box {
        background: rgba(70, 70, 90, 0.6);
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 30px;
      }
      
      .highlight {
        font-weight: bold;
        color: #ffcc55;
      }
      
      .players-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 30px;
      }
      
      .player-card {
        background: rgba(70, 70, 90, 0.6);
        padding: 15px;
        border-radius: 8px;
        border: 2px solid #666;
      }
      
      .player-card.you {
        background: rgba(255, 204, 85, 0.3);
        border: 2px solid #ffcc55;
      }
      
      .start-game-button {
        background-color: #55ff55;
        color: #333;
        padding: 15px 30px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
        margin-top: 20px;
        transition: all 0.3s ease;
      }
      
      .start-game-button:hover {
        background-color: #44ee44;
        transform: scale(1.05);
      }
      
      .waiting-message {
        font-size: 18px;
        color: #ffcc55;
        margin-top: 20px;
      }
    `}</style>
  </div>
);

// Компонент игрового экрана
const GamePlayingScreen = ({
  gameOver,
  playerWon,
  showResult,
  setShowResult,
  disaster,
  bunker,
  playerName,
  isMaster,
  navigate,
  scrollUp,
  scrollDown,
  scrollContainerRef,
  timerEnded,
  timeLeft,
  formatTime,
  timerMinutes,
  timerSeconds,
  setTimerMinutes,
  setTimerSeconds,
  timerRunning,
  startTimer,
  stopTimer,
  fixedPlayerTraits,
  revealedTraits,
  revealTrait,
  traitsList,
  fixedPlayers,
  showRules,
  setShowRules,
  removedPlayers,
  removePlayer
}) => (
  <div className={`game-container ${timerEnded ? 'shake' : ''}`}>
    {/* Сообщение о победе */}
    {showResult && (
      <div 
        onClick={() => {
          setShowResult(false);
        }}
        className="result-overlay"
        style={{
          background: playerWon 
            ? 'rgba(0, 255, 255, 0.3)' 
            : 'rgba(255, 0, 0, 0.3)',
        }}
      >
        <div className="result-box" style={{
          border: `4px solid ${playerWon ? '#00ffff' : '#ff0000'}`,
          boxShadow: `0 0 30px ${playerWon ? '#00ffff' : '#ff0000'}`
        }}>
          <h1 style={{ color: playerWon ? '#00ffff' : '#ff0000' }}>
            {playerWon ? 'Вы выиграли!' : 'Вас выгнали!'}
          </h1>
          <p>
            {playerWon 
              ? 'Вы будете спасать человечество!!!' 
              : 'Кажется, ваша жизнь закончится в ближайшее время вне бункера...'
            }
          </p>
        </div>
      </div>
    )}

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

