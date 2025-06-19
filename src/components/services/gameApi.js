// Замените API_URL на:
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api'
  : `${window.location.origin}/api`;

// Добавляем обработку CORS в каждый запрос
const fetchWithCors = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    mode: 'cors',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
  
  return response;
};

// Упрощенная версия getRoomData
export const getRoomData = async (roomCode) => {
  try {
    console.log(`Пытаемся получить данные комнаты ${roomCode}`);
    const response = await fetchWithCors(`${API_URL}/rooms/${roomCode}`);
    const data = await response.json();
    console.log('Данные комнаты:', data);
    return data;
  } catch (error) {
    throw new Error('Сервер не отвечает');
  }
};
// Улучшенная функция для обработки ошибок fetch
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 5000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal  
  });
  
  clearTimeout(id);
  
  if (!response.ok) {
    const error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
  
  return response;
}

// Room Management
export const createRoom = async (roomCode, playerName) => {
  try {
    const response = await fetchWithTimeout(`${API_URL}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: roomCode, playerName })
    });
    return await response.json();
  } catch (error) {
    console.error('Ошибка создания комнаты:', error);
    throw new Error(error.response?.status === 400 
      ? 'Комната уже существует' 
      : 'Не удалось создать комнату');
  }
};

export const joinRoom = async (roomCode, playerName) => {
  try {
    const response = await fetchWithTimeout(`${API_URL}/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName })
    });
    return await response.json();
  } catch (error) {
    console.error('Ошибка входа в комнату:', error);
    throw new Error(error.response?.status === 404 
      ? 'Комната не найдена' 
      : 'Не удалось войти в комнату');
  }
};
export const checkServerHealth = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    return response.ok;
  } catch (error) {
    console.error('Сервер недоступен:', error);
    return false;
  }
};




// Улучшенная pingServer
export const pingServer = async () => {
  try {
    // Пробуем оба endpoint'а для надежности
    const [healthRes, networkRes] = await Promise.all([
      fetch(`${API_URL}/health`),
      fetch(`${API_URL}/network`)
    ]);
    
    return healthRes.ok && networkRes.ok;
  } catch (error) {
    console.error('Network check failed:', error);
    return false;
  }
};


export const updateRoomData = async (roomCode, updates) => {
  try {
    const response = await fetchWithTimeout(`${API_URL}/rooms/${roomCode}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return await response.json();
  } catch (error) {
    console.error('Ошибка обновления комнаты:', error);
    throw new Error('Не удалось обновить данные комнаты');
  }
};

export const subscribeToRoomUpdates = (roomCode, callback) => {
  let isActive = true;
  let retryCount = 0;
  const maxRetries = 5;

  const fetchData = async () => {
    if (!isActive) return;

    try {
      const data = await getRoomData(roomCode);
      retryCount = 0; // Сброс счетчика при успехе
      if (isActive) callback(data);
    } catch (error) {
      retryCount++;
      console.error(`Ошибка подписки (попытка ${retryCount}):`, error);
      
      if (retryCount >= maxRetries && isActive) {
        callback(null, new Error('Не удалось подключиться к комнате'));
        return;
      }
    }

    if (isActive) {
      // Увеличиваем интервал при ошибках
      const delay = retryCount > 0 ? Math.min(10000, 2000 * retryCount) : 2000;
      setTimeout(fetchData, delay);
    }
  };

  fetchData();

  return () => {
    isActive = false;
    console.log(`Отписались от обновлений комнаты ${roomCode}`);
  };
};

// Остальные функции (startGame, revealTraitForPlayer и т.д.) остаются аналогичными
// но используют fetchWithTimeout вместо обычного fetch



// Исправленная функция startGame
export const startGame = async (roomCode, gameData) => {
  const response = await fetch(`${API_URL}/rooms/${roomCode}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameData })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
  
};

// Player Actions
export const revealTraitForPlayer = async (roomCode, player, traitKey, value) => {
  const response = await fetch(`${API_URL}/rooms/${roomCode}/reveal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player, traitKey, value })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
};

export const removePlayerFromGame = async (roomCode, playerToRemove, masterPlayer) => {
  // Проверяем права на удаление
  const room = await getRoomData(roomCode);
  if (room.players[0] !== masterPlayer) {
    throw new Error('Только мастер комнаты может удалять игроков');
  }

  const response = await fetch(`${API_URL}/rooms/${roomCode}/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerToRemove })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
};

// Timer Management
export const startTimerForRoom = async (roomCode, durationSeconds, masterPlayer) => {
  // Проверяем права на управление таймером
  const room = await getRoomData(roomCode);
  if (room.players[0] !== masterPlayer) {
    throw new Error('Только мастер комнаты может управлять таймером');
  }

  const endTime = Date.now() + durationSeconds * 1000;
  const response = await fetch(`${API_URL}/rooms/${roomCode}/timer/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endTime })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
};

export const stopTimerForRoom = async (roomCode, masterPlayer) => {
  // Проверяем права на управление таймером
  const room = await getRoomData(roomCode);
  if (room.players[0] !== masterPlayer) {
    throw new Error('Только мастер комнаты может управлять таймером');
  }

  const response = await fetch(`${API_URL}/rooms/${roomCode}/timer/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
};

// Helper Functions
function getRandomDisaster() {
  const disasters = [
    { title: "Ядерная война", description: "Массовые ядерные удары по всем крупным городам" },
    { title: "Пандемия", description: "Смертельный вирус с 90% летальностью" }
  ];
  return disasters[Math.floor(Math.random() * disasters.length)];
}

function getRandomBunker() {
  const bunkers = [
    { size: "На 10 человек", time: "5 лет", food: "Консервы на 3 года", features: "Солнечные батареи, система очистки воды" },
    { size: "На 20 человек", time: "10 лет", food: "Гидропонные фермы", features: "Ядерный реактор, медицинский блок" }
  ];
  return bunkers[Math.floor(Math.random() * bunkers.length)];
}

function generateAllPlayerTraits(players) {
  const traits = {};
  players.forEach(player => {
    traits[player] = generatePlayerTraits();
  });
  return traits;
}

function initializeRevealedTraits(players) {
  const revealed = {};
  players.forEach(player => {
    revealed[player] = {};
  });
  return revealed;
}

function generatePlayerTraits() {
  return {
    gender: ["Мужской", "Женский"][Math.floor(Math.random() * 2)],
    bodyType: ["Худощавое", "Спортивное", "Полное"][Math.floor(Math.random() * 3)],
    profession: ["Врач", "Инженер", "Учитель"][Math.floor(Math.random() * 3)],
    health: ["Здоров", "Хроническое заболевание", "Инвалидность"][Math.floor(Math.random() * 3)]
  };
}
