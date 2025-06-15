import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Списки для генерации характеристик
const GENDERS = ['Мужской', 'Женский'];
const BODY_TYPES = ['Худощавое', 'Спортивное', 'Полное', 'Мускулистое', 'Хрупкое'];
const TRAITS = ['Добрый', 'Хитрый', 'Честный', 'Эгоистичный', 'Альтруист', 'Лидер', 'Оптимист', 'Пессимист'];
const PROFESSIONS = ['Врач', 'Инженер', 'Учитель', 'Военный', 'Фермер', 'Программист', 'Ученый', 'Повар'];
const HEALTH_STATUSES = ['Здоров', 'Астма', 'Диабет', 'Аллергия', 'Сердечное заболевание', 'Инвалидность'];
const HOBBIES = ['Чтение', 'Садоводство', 'Кулинария', 'Охота', 'Рыбалка', 'Спорт', 'Музыка', 'Рисование'];
const PHOBIAS = ['Арахнофобия', 'Клаустрофобия', 'Акрофобия', 'Агорафобия', 'Авиафобия', 'Никтофобия'];
const INVENTORY_ITEMS = ['Генератор', 'Аптечка', 'Запас воды', 'Семена растений', 'Оружейный набор', 'Научное оборудование'];
const BACKPACK_ITEMS = ['Фонарик', 'Нож', 'Рация', 'Компас', 'Карта', 'Книга выживания'];
const ADDITIONAL_INFO = ['Бывший заключенный', 'Экстрасенс', 'Ученый-вирусолог', 'Бывший военный', 'Выживальщик'];
const SPECIAL_ABILITIES = ['Медицинские знания', 'Боевая подготовка', 'Сельскохозяйственные навыки', 'Технические навыки', 'Лидерские качества'];

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
  phobia: getRandomElement(PHOBIAS),
  inventory: getRandomElement(INVENTORY_ITEMS),
  backpack: getRandomElement(BACKPACK_ITEMS),
  additionalInfo: getRandomElement(ADDITIONAL_INFO),
  specialAbility: getRandomElement(SPECIAL_ABILITIES),
});

// Данные об апокалипсисе
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
};

// Список характеристик для таблицы
const traitsList = [
  { key: 'gender', label: 'Пол' },
  { key: 'bodyType', label: 'Телосложение' },
  { key: 'trait', label: 'Человеческая черта' },
  { key: 'profession', label: 'Профессия' },
  { key: 'health', label: 'Здоровье' },
  { key: 'hobby', label: 'Хобби / Увлечение' },
  { key: 'phobia', label: 'Фобия / Страх' },
  { key: 'inventory', label: 'Крупный инвентарь' },
  { key: 'backpack', label: 'Рюкзак' },
  { key: 'additionalInfo', label: 'Дополнительное сведение' },
  { key: 'specialAbility', label: 'Спец. возможность' }
];

function Game() {
  const [gameCode, setGameCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerTraits, setPlayerTraits] = useState({});
  const [revealedTraits, setRevealedTraits] = useState({});
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerEnded, setTimerEnded] = useState(false);
  const [removedPlayers, setRemovedPlayers] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const scrollAmount = 100;
  const timerRef = useRef(null);

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

  // Обработчик событий хранилища
  const handleStorageChange = (e) => {
    if (e.key === 'rooms') {
      loadRoomData();
    }
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
      
      // Загрузка раскрытых характеристик
      if (room.revealedTraits) {
        setRevealedTraits(room.revealedTraits);
      }
      
      // Загрузка удаленных игроков
      if (room.removedPlayers) {
        setRemovedPlayers(room.removedPlayers);
      }
      
      // Если игра начата, фиксируем данные
      if (room.gameStarted && !gameStarted) {
        setGameStarted(true);
        // Фиксируем игроков и характеристики
        fixedPlayers.current = [...room.players];
        const traits = {};
        fixedPlayers.current.forEach(player => {
          traits[player] = generatePlayerTraits();
        });
        fixedPlayerTraits.current = traits;
        setPlayerTraits(traits);
        
        // Инициализация раскрытых характеристик
        const initialRevealed = {};
        fixedPlayers.current.forEach(player => {
          initialRevealed[player] = {};
        });
        
        if (!room.revealedTraits) {
          room.revealedTraits = initialRevealed;
          localStorage.setItem('rooms', JSON.stringify(rooms));
          setRevealedTraits(initialRevealed);
        }
      }
    }
  };

  useEffect(() => {
    loadRoomData();
    
    window.addEventListener('storage', handleStorageChange);
    
    // Проверяем обновления только до начала игры
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
        }
        
        room.revealedTraits[player][traitKey] = true;
        localStorage.setItem('rooms', JSON.stringify(rooms));
        
        // Обновляем состояние
        setRevealedTraits(room.revealedTraits);
        
        // Форсируем обновление для всех игроков
        const event = new Event('storage');
        window.dispatchEvent(event);
      }
    }
  };

  // Удаление игрока
  const removePlayer = (playerToRemove) => {
    if (window.confirm(`Вы точно хотите удалить ${playerToRemove} из игры?`)) {
      const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
      const room = rooms[gameCode];
      
      if (room) {
        // Добавляем игрока в список удаленных
        if (!room.removedPlayers) {
          room.removedPlayers = [];
        }
        
        if (!room.removedPlayers.includes(playerToRemove)) {
          room.removedPlayers.push(playerToRemove);
        }
        
        // Раскрываем все характеристики удаленного игрока
        if (!room.revealedTraits) {
          room.revealedTraits = {};
        }
        
        if (!room.revealedTraits[playerToRemove]) {
          room.revealedTraits[playerToRemove] = {};
        }
        
        // Раскрываем все характеристики
        Object.keys(fixedPlayerTraits.current[playerToRemove]).forEach(key => {
          room.revealedTraits[playerToRemove][key] = true;
        });
        
        localStorage.setItem('rooms', JSON.stringify(rooms));
        
        // Обновляем состояние
        setRemovedPlayers(room.removedPlayers);
        setRevealedTraits(room.revealedTraits);
        
        // Форсируем обновление для всех игроков
        const event = new Event('storage');
        window.dispatchEvent(event);
      }
    }
  };

  // Управление таймером
  const startTimer = () => {
    const totalSeconds = timerMinutes * 60 + timerSeconds;
    setTimeLeft(totalSeconds);
    setTimerActive(true);
    setTimerEnded(false);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimerActive(false);
          setTimerEnded(true);
          setTimeout(() => setTimerEnded(false), 3000); // Сбросить эффект через 3 секунды
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    setTimerActive(false);
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
        overflow: 'hidden'
      }}>
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

        {/* Кнопка назад */}
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

        {/* Кнопки прокрутки */}
        <div className="scroll-buttons">
          <button onClick={scrollUp}>↑</button>
          <button onClick={scrollDown}>↓</button>
        </div>

        {/* Основной контейнер */}
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
            overflow: 'hidden',
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
      overflow: 'hidden',
      animation: timerEnded ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'none'
    }}>
      {/* Эффект красного свечения при завершении таймера */}
      {timerEnded && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 0, 0, 0.3)',
          zIndex: 98,
          animation: 'fadeOut 3s forwards'
        }}></div>
      )}

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

      {/* Кнопка назад */}
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

      {/* Кнопки прокрутки */}
      <div className="scroll-buttons">
        <button onClick={scrollUp}>↑</button>
        <button onClick={scrollDown}>↓</button>
      </div>

      {/* Основной контейнер */}
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
          overflow: 'hidden',
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
        {/* Заголовок */}
        <h1 style={{
          marginBottom: '30px',
          fontSize: '32px',
          color: 'white',
          textShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
        }}>
          Игра началась!
        </h1>

        {/* Блок с катаклизмом */}
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
            Катаклизм: {DISASTER.title}
          </h2>
          <p style={{ fontSize: '18px' }}>{DISASTER.description}</p>
        </div>

        {/* Блок с бункером */}
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
              <p><strong>Размер:</strong> {BUNKER.size}</p>
              <p><strong>Время нахождения:</strong> {BUNKER.duration}</p>
            </div>
            <div>
              <p><strong>Запасы еды:</strong> {BUNKER.foodSupply}</p>
              <p><strong>Особенности:</strong> {BUNKER.features}</p>
            </div>
          </div>
        </div>

        {/* Таймер для мастера */}
        {isMaster && (
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
            
            {timerActive ? (
              <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '15px 0' }}>
                {formatTime(timeLeft)}
              </div>
            ) : (
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
              {!timerActive ? (
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
          </div>
        )}

        {/* Персональные характеристики */}
        {playerTraits[playerName] && (
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
              {Object.entries(playerTraits[playerName]).map(([key, value]) => (
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
                  {!revealedTraits[playerName]?.[key] && (
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

        {/* Таблица характеристик всех игроков */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: '24px',
            color: 'white',
            marginBottom: '20px'
          }}>
            Раскрытые характеристики
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
                    textAlign: 'left',
                    borderBottom: '2px solid #999'
                  }}>Характеристика</th>
                  {[...fixedPlayers.current]
                    .sort((a, b) => {
                      // Удаленные игроки в конец
                      const aRemoved = removedPlayers.includes(a);
                      const bRemoved = removedPlayers.includes(b);
                      if (aRemoved && !bRemoved) return 1;
                      if (!aRemoved && bRemoved) return -1;
                      return 0;
                    })
                    .map(player => (
                    <th key={player} style={{
                      padding: '15px',
                      textAlign: 'center',
                      borderBottom: '2px solid #999',
                      color: player === playerName ? '#ffcc55' : 'white',
                      background: removedPlayers.includes(player) ? 'rgba(50, 50, 50, 0.8)' : 'transparent',
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          {player} {player === playerName && "(Вы)"}
                        </span>
                        {isMaster && (
                          <button
                            onClick={() => removePlayer(player)}
                            style={{
                              background: '#ff5555',
                              color: 'white',
                              border: 'none',
                              borderRadius: '20%',
                              width: '30px',
                              height: '30px',
                              cursor: 'pointer',
                              fontSize: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginLeft: '15px',
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
                        // Удаленные игроки в конец
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
                              : 'transparent'
                        }}>
                          {isRevealed || isRemoved ? fixedPlayerTraits.current[player][trait.key] : '❓'}
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
    </div>
  );
}

export default Game;