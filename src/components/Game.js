import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import data from '../data.json';
import dataPlayer from '../dataPlayer.json';

// Списки для генерации характеристик
const GENDERS = dataPlayer.genders.map(item => item.gender);
const BODY_TYPES = dataPlayer.body_types.map(item => item.body_type);
const TRAITS = dataPlayer.traits.map(item => item.trait);
const PROFESSIONS = dataPlayer.professions.map(item => item.profession);
const HEALTH_STATUSES = dataPlayer.healths.map(item => item.health);
const HOBBIES = dataPlayer.hobbies.map(item => item.hobby);
const BACKPACK_ITEMS = dataPlayer.items.map(item => item.item);
const ADDITIONAL_INFO = dataPlayer.facts.map(item => item.fact);

// Генератор случайных элементов из массива
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

// Генерация характеристик для игрока
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

const getRandomDisaster = () => {
  return data.disasters[Math.floor(Math.random() * data.disasters.length)];
};

const getRandomBunker = () => {
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
  const location = useLocation();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const scrollAmount = 100;
  const timerRef = useRef(null);
  const soundPlayedRef = useRef(false);
  const [showRules, setShowRules] = useState(false);

  // Фиксированные данные после начала игры
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
  const checkGameOver = (currentRemovedPlayers) => {
  const totalPlayers = fixedPlayers.current.length;
  const remainingPlayers = totalPlayers - currentRemovedPlayers.length;
  
  if (remainingPlayers <= totalPlayers / 2) {
    setGameOver(true);
    const won = !currentRemovedPlayers.includes(playerName);
    setPlayerWon(won);
    setShowResult(true);
    
    const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
    const room = rooms[gameCode];
    
    if (room) {
      // Инициализируем revealedTraits если их нет
      if (!room.revealedTraits) {
        room.revealedTraits = {};
      }
      
      // Раскрываем ВСЕХ игроков 
      fixedPlayers.current.forEach(player => {
        if (!room.revealedTraits[player]) {
          room.revealedTraits[player] = {};
        }
        
        // Раскрываем все характеристики для каждого игрока
        Object.keys(room.playerTraits[player]).forEach(key => {
          room.revealedTraits[player][key] = room.playerTraits[player][key];
        });
      });
      
      localStorage.setItem('rooms', JSON.stringify(rooms));
      setRevealedTraits(room.revealedTraits);
    }
    
    /*
    setTimeout(() => {
      setShowResult(false);
    }, 10000);
    */
    
    return true;
  }
  return false;
};

  // Обработчик событий хранилища
  const handleStorageChange = (e) => {
    if (e.key === 'rooms') {
      loadRoomData();
    }
    if (e.key === `timer-${gameCode}`) {
      const timerData = JSON.parse(localStorage.getItem(`timer-${gameCode}`)) || {};
      if (timerData.endTime) {
        const remaining = Math.max(0, Math.floor((timerData.endTime - Date.now()) / 1000));
        setTimeLeft(remaining);
        
        if (timerData.running && !timerRunning) {
          setTimerRunning(true);
          startTimerInterval();
        } else if (!timerData.running && timerRunning) {
          clearInterval(timerRef.current);
          setTimerRunning(false);
        }
        
        // Проверка на завершение таймера
        if (remaining <= 0 && timerData.running) {
          setTimerEnded(true);
          if (!soundPlayedRef.current) {
            playTimerSound();
            soundPlayedRef.current = true;
          }
          setTimeout(() => {
            setTimerEnded(false);
            soundPlayedRef.current = false;
          }, 3000);
        }
      }
    }
  };

  // Функция для запуска интервала таймера
  const startTimerInterval = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    soundPlayedRef.current = false;
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimerRunning(false);
          setTimerEnded(true);
          playTimerSound();
          setTimeout(() => setTimerEnded(false), 3000);
          
          // Обновляем состояние таймера в localStorage
          const timerData = JSON.parse(localStorage.getItem(`timer-${gameCode}`)) || {};
          timerData.running = false;
          localStorage.setItem(`timer-${gameCode}`, JSON.stringify(timerData));
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const loadRoomData = () => {
  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  const player = params.get("player");
  
  setGameCode(code);
  setPlayerName(player);

  const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
  const room = rooms[code];
  
  if (room) {
    setPlayers(room.players);
    setGameStarted(room.gameStarted);
    
    // Загружаем катастрофу и бункер (если уже есть)
    if (room.disaster) {
      setDisaster(room.disaster);
    }
    if (room.bunker) {
      setBunker(room.bunker);
    }
    
    // Если игра начата, но нет катастрофы/бункера — создаем (только мастер)
    if (room.gameStarted && !room.disaster && room.players[0] === player) {
      room.disaster = getRandomDisaster();
      room.bunker = getRandomBunker();
      localStorage.setItem('rooms', JSON.stringify(rooms));
      setDisaster(room.disaster);
      setBunker(room.bunker);
    }


    if (room.revealedTraits) {
      setRevealedTraits(room.revealedTraits);
    }
    
    if (room.removedPlayers) {
      setRemovedPlayers(room.removedPlayers);
      checkGameOver(room.removedPlayers);
    }
    
    // Проверяем, является ли текущий игрок мастером (первым в списке)
    const isMaster = room.players[0] === player;
    
    if (room.gameStarted) {
      // Фиксируем список игроков
      fixedPlayers.current = [...room.players];
      
      // Если данные игроков уже есть в комнате - используем их
      if (room.playerTraits) {
        fixedPlayerTraits.current = room.playerTraits;
        setPlayerTraits({...room.playerTraits});
      } 
      // Если данных нет и мы мастер - генерируем их для всех
      else if (isMaster) {
        const traits = {};
        fixedPlayers.current.forEach(player => {
          traits[player] = generatePlayerTraits();
        });
        
        fixedPlayerTraits.current = traits;
        setPlayerTraits({...traits});
        
        // Сохраняем сгенерированные данные в комнату
        room.playerTraits = traits;
        localStorage.setItem('rooms', JSON.stringify(rooms));
      }
      
      // Инициализируем revealedTraits если их нет
      if (!room.revealedTraits) {
        const initialRevealed = {};
        fixedPlayers.current.forEach(player => {
          initialRevealed[player] = {};
        });
        
        room.revealedTraits = initialRevealed;
        localStorage.setItem('rooms', JSON.stringify(rooms));
        setRevealedTraits(initialRevealed);
      }

      // Загружаем катастрофу и бункер из комнаты или инициализируем новые
      if (room.disaster) {
        setDisaster(room.disaster);
      } else if (isMaster) {
        room.disaster = getRandomDisaster();
        setDisaster(room.disaster);
      }
      
      if (room.bunker) {
        setBunker(room.bunker);
      } else if (isMaster) {
        room.bunker = getRandomBunker();
        setBunker(room.bunker);
      }
      
      localStorage.setItem('rooms', JSON.stringify(rooms));
    }
  }

  // Загружаем состояние таймера из localStorage
  const timerData = JSON.parse(localStorage.getItem(`timer-${code}`)) || {};
  if (timerData.endTime) {
    const remaining = Math.max(0, Math.floor((timerData.endTime - Date.now()) / 1000));
    setTimeLeft(remaining);
    if (timerData.running && remaining > 0) {
      setTimerRunning(true);
      startTimerInterval();
    }
  }
};

  useEffect(() => {
  loadRoomData();
  
    // Загружаем состояние таймера
    const timerData = JSON.parse(localStorage.getItem(`timer-${gameCode}`)) || {};
    if (timerData.endTime) {
      const remaining = Math.max(0, Math.floor((timerData.endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (timerData.running && remaining > 0) {
        setTimerRunning(true);
        startTimerInterval();
      }
    }
    
    window.addEventListener('storage', handleStorageChange);
    
    if (!gameStarted) {
      const interval = setInterval(loadRoomData, 1000);
      return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [location, navigate, gameStarted]); 

  // Раскрытие характеристики для всех игроков
  const revealTrait = (player, traitKey) => {
    if (window.confirm('Вы уверены, что хотите раскрыть эту характеристику для всех игроков?')) {
      const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
      const room = rooms[gameCode];
      
      if (room) {

        if (!room.revealedTraits) {
          room.revealedTraits = {};
        }
        
        if (!room.revealedTraits[player]) {
          room.revealedTraits[player] = {};
          console.log(1);
        }
        else {
          console.log(room.revealedTraits[player]);
          console.log(room.revealedTraits['ggg']);
        }
        
        room.revealedTraits[player][traitKey] = fixedPlayerTraits.current[player][traitKey];
        localStorage.setItem('rooms', JSON.stringify(rooms));
        
        setRevealedTraits(prev => ({
          ...prev,
          [player]: {
            ...prev[player],
            [traitKey]: fixedPlayerTraits.current[player][traitKey]
          }
        }));
      }
    }
  };

  // Удаление игрока
const removePlayer = (playerToRemove) => {
  if (window.confirm(`Вы точно хотите удалить ${playerToRemove} из игры?`)) {
    const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
    const room = rooms[gameCode];
    
    if (room) {
      if (!room.removedPlayers) {
        room.removedPlayers = [];
      }
      
      if (!room.removedPlayers.includes(playerToRemove)) {
        room.removedPlayers.push(playerToRemove);
      }
      
      if (!room.revealedTraits) {
        room.revealedTraits = {};
      }
      
      if (!room.revealedTraits[playerToRemove]) {
        room.revealedTraits[playerToRemove] = {};
      }
      
      // Берем данные из сохраненных в комнате
      const playerTraits = room.playerTraits[playerToRemove];
      
      if (!playerTraits) {
        console.error(`Данные игрока ${playerToRemove} не найдены`);
        return;
      }
      
      // Раскрываем все характеристики
      Object.keys(playerTraits).forEach(key => {
        room.revealedTraits[playerToRemove][key] = playerTraits[key];
      });
      
      localStorage.setItem('rooms', JSON.stringify(rooms));
      
      setRemovedPlayers([...room.removedPlayers]);
      setRevealedTraits({...room.revealedTraits});
      
      if (!checkGameOver(room.removedPlayers)) {
        if (playerToRemove === playerName && playerName !== players[0]) {
          setPlayerWon(false);
          setShowResult(true);
          setTimeout(() => setShowResult(false), 10000);
        }
      }
    }
  }
};

  // Управление таймером
  const startTimer = () => {
    const totalSeconds = timerMinutes * 60 + timerSeconds;
    setTimeLeft(totalSeconds);
    setTimerRunning(true);
    setTimerEnded(false);
    
    const endTime = Date.now() + totalSeconds * 1000;
    const timerData = { endTime, running: true };
    localStorage.setItem(`timer-${gameCode}`, JSON.stringify(timerData));
    
    startTimerInterval();
    
    const event = new Event('storage');
    window.dispatchEvent(event);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    setTimerRunning(false);
    
    const timerData = JSON.parse(localStorage.getItem(`timer-${gameCode}`)) || {};
    timerData.running = false;
    localStorage.setItem(`timer-${gameCode}`, JSON.stringify(timerData));
    
    const event = new Event('storage');
    window.dispatchEvent(event);
  };

  // Форматирование времени
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Проверка, является ли текущий игрок мастером (первым в списке)
  const isMaster = players[0] === playerName;

  // Если игра еще не начата
  if (!gameStarted) {
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
        overflow: 'auto'
      }}>
        
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
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            backgroundColor: '#444',
            color: 'white',
            padding: '10px 20px',
            border: '2px solid #999',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            zIndex: 100
          }}
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
            background: playerWon 
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
            border: `4px solid ${playerWon ? '#00ffff' : '#ff0000'}`,
            boxShadow: `0 0 30px ${playerWon ? '#00ffff' : '#ff0000'}`
          }}>
            <h1 style={{
              fontSize: '48px',
              color: playerWon ? '#00ffff' : '#ff0000',
              marginBottom: '20px'
            }}>
              {playerWon ? 'Вы выиграли!' : 'Вас выгнали!'}
            </h1>
            <p style={{
              fontSize: '32px',
              color: 'white'
            }}>
              {playerWon 
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
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          backgroundColor: '#444',
          color: 'white',
          padding: '10px 20px',
          border: '2px solid #999',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          zIndex: 100
        }}
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
          maxWidth: '900px',
          maxHeight: '80vh',
          overflow: 'auto',
          textAlign: 'center',
          boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
          margin: '20px auto',
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
          color: 'white',
          textShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
        }}>
          {gameOver ? 'Игра окончена!' : 'Игра началась!'}
        </h1>

        <div style={{
          background: 'rgba(70, 70, 90, 0.6)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          borderLeft: '6px solid #ff5555'
        }}>
          <h2 style={{
            fontSize: '24px',
            color: '#ff5555',
            marginBottom: '15px'
          }}>
            Катаклизм: {disaster.title}
          </h2>
          <p style={{ fontSize: '18px' }}>{disaster.description}</p>
        </div>

        <div style={{
          background: 'rgba(70, 70, 90, 0.6)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          borderLeft: '6px solid #55aaff'
        }}>
          <h2 style={{
            fontSize: '24px',
            color: '#55aaff',
            marginBottom: '15px'
          }}>
            Ваше убежище
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            textAlign: 'left'
          }}>
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

        <div style={{
          background: 'rgba(70, 70, 90, 0.6)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          borderLeft: '6px solid #55ff55'
        }}>
          <h2 style={{
            fontSize: '24px',
            color: '#55ff55',
            marginBottom: '15px'
          }}>
            Таймер
          </h2>
          
          <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '15px 0' }}>
            {formatTime(timeLeft)}
          </div>
          
          {isMaster && !gameOver && (
            <>
              {!timerRunning && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '10px',
                  marginBottom: '15px'
                }}>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    style={{
                      width: '60px',
                      padding: '8px',
                      fontSize: '18px',
                      textAlign: 'center',
                      borderRadius: '4px',
                      border: '1px solid #666'
                    }}
                  />
                  <span style={{ fontSize: '24px', lineHeight: '40px' }}>:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={timerSeconds}
                    onChange={(e) => setTimerSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    style={{
                      width: '60px',
                      padding: '8px',
                      fontSize: '18px',
                      textAlign: 'center',
                      borderRadius: '4px',
                      border: '1px solid #666'
                    }}
                  />
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                {!timerRunning ? (
                  <button
                    onClick={startTimer}
                    style={{
                      backgroundColor: '#55ff55',
                      color: '#333',
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    Старт
                  </button>
                ) : (
                  <button
                    onClick={stopTimer}
                    style={{
                      backgroundColor: '#ff5555',
                      color: '#fff',
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    Стоп
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {fixedPlayerTraits.current[playerName] && (
          <div style={{
            background: 'rgba(70, 70, 90, 0.6)',
            borderRadius: '12px',
            padding: '25px',
            marginBottom: '30px',
            borderLeft: '6px solid #ffcc55'
          }}>
            <h2 style={{
              fontSize: '24px',
              color: '#ffcc55',
              marginBottom: '20px'
            }}>
              Ваши характеристики
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px',
              textAlign: 'left'
            }}>
              {Object.entries(fixedPlayerTraits.current[playerName]).map(([key, value]) => (
                <div key={key} style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '15px',
                  borderRadius: '8px',
                  position: 'relative'
                }}>
                  <strong style={{ color: '#ffcc55' }}>
                    {traitsList.find(t => t.key === key)?.label || key}:
                  </strong>
                  <p>{value}</p>
                  {!revealedTraits[playerName]?.[key] && !gameOver && (
                    <button
                      onClick={() => revealTrait(playerName, key)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '10px',
                        background: '#ffcc55',
                        color: '#333',
                        border: 'none',
                        borderRadius: '20%',
                        width: '25px',
                        height: '40px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
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

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: '24px',
            color: 'white',
            marginBottom: '20px'
          }}>
            Таблица характеристик
          </h2>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              background: 'rgba(70, 70, 90, 0.6)',
              borderRadius: '8px',
              borderCollapse: 'separate',
              borderSpacing: '0'
            }}>
              <thead>
                <tr style={{
                  background: 'rgba(90, 90, 110, 0.8)'
                }}>
                  <th style={{
                    padding: '15px',
                    textAlign: 'center',
                    borderBottom: '2px solid #999'
                  }}>Характеристика</th>
                  {[...fixedPlayers.current]
                    .sort((a, b) => {
                      const aRemoved = removedPlayers.includes(a);
                      const bRemoved = removedPlayers.includes(b);
                      if (aRemoved && !bRemoved) return 1;
                      if (!aRemoved && bRemoved) return -1;
                      return 0;
                    })
                    .map(player => (
                    <th key={player} style={{
                      padding: '20px',
                      textAlign: 'center',
                      borderBottom: '2px solid #999',
                      color: player === playerName ? '#ffcc55' : 'white',
                      background: removedPlayers.includes(player) 
                        ? 'rgba(50, 50, 50, 0.8)' 
                        : gameOver && !removedPlayers.includes(player)
                          ? 'rgba(0, 200, 255, 0.3)'
                          : 'transparent',
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          {player} {player === playerName && "(Вы)"}
                        </span>
                        {isMaster && !gameOver && (
                          <button
                            onClick={() => removePlayer(player)}
                            style={{
                              background: '#ff5555',
                              color: 'white',
                              border: 'none',
                              borderRadius: '20%',
                              width: '10px',
                              height: '30px',
                              cursor: 'pointer',
                              fontSize: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginLeft: '-15px',
                              boxShadow: '0 0 5px rgba(255, 0, 0, 0.7)',
                              transition: 'all 0.3s ease'
                            }}
                            title="Удалить игрока"
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {traitsList.map(trait => (
                  <tr key={trait.key} style={{
                    background: 'rgba(60, 60, 80, 0.6)'
                  }}>
                    <td style={{
                      padding: '12px 15px',
                      borderBottom: '1px solid #666'
                    }}>{trait.label}</td>
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
                        <td key={`${player}-${trait.key}`} style={{
                          padding: '12px 15px',
                          textAlign: 'center',
                          borderBottom: '1px solid #666',
                          background: player === playerName 
                            ? 'rgba(255, 204, 85, 0.1)' 
                            : isRemoved 
                              ? 'rgba(50, 50, 50, 0.8)' 
                              : gameOver && !isRemoved
                                ? 'rgba(0, 200, 255, 0.3)'
                                : 'transparent',
                          color: gameOver && !isRemoved ? '#00ffff' : 'inherit'
                        }}>
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
          .rules-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.85);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px 0;
  }
    .close-rules {
          position: absolute;
          top: 5px;
          right: 5px;
          background-color: #ff5555;
          color: white;
          border: none;
  border-radius: 20%; /* Круглая форма */
  width: 10px; /* Фиксированная ширина */
  height: 30px; /* Фиксированная высота */
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0; /* Убираем внутренние отступы */
  line-height: 1; /* Нормализуем межстрочное расстояние */
  transition: all 0.2s ease; /* Плавные анимации */
        }
           .rules-content h2 {
    color: #788ca0;
    font-size: 28px;
    margin: 30px 0 20px;
    border-bottom: 1px solid rgba(120, 140, 160, 0.4);
  }
  
  .rules-content {
    background: rgba(30, 35, 40, 0.95); /* Темно-серый фон */
    border: 1px solid #444;
    border-radius: 12px;
    padding: 40px;
    width: 70%;
    max-width: 1200px;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  }
  
  /* Кастомный скроллбар */
  .rules-content::-webkit-scrollbar {
    width: 8px;
  }
  
  .rules-content::-webkit-scrollbar-track {
    background: rgba(50, 50, 50, 0.5);
    border-radius: 4px;
  }
  
  .rules-content::-webkit-scrollbar-thumb {
    background: rgba(100, 120, 140, 0.7); /* Серо-голубой ползунок */
    border-radius: 4px;
  }
  
  .rules-content::-webkit-scrollbar-thumb:hover {
    background: #788ca0;
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
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
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
}

export default Game;