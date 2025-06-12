// bunker-game-rooms.js

// Генерация случайного кода комнаты (6 заглавных букв/цифр)
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Создание новой комнаты с указанием имени создателя
function createRoom(creatorName) {
  const code = generateCode();
  const rooms = JSON.parse(localStorage.getItem('rooms') || '{}');

  rooms[code] = {
    creator: creatorName,
    players: [creatorName],
    gameStarted: false
  };

  localStorage.setItem('rooms', JSON.stringify(rooms));
  return code;
}

// Подключение игрока к существующей комнате по коду
function joinRoom(code, playerName) {
  const rooms = JSON.parse(localStorage.getItem('rooms') || '{}');

  if (!rooms[code]) return { success: false, message: 'Комната не найдена' };
  if (rooms[code].players.includes(playerName)) return { success: false, message: 'Имя уже используется в этой комнате' };

  rooms[code].players.push(playerName);
  localStorage.setItem('rooms', JSON.stringify(rooms));

  return { success: true };
}

// Получение данных по комнате
function getRoom(code) {
  const rooms = JSON.parse(localStorage.getItem('rooms') || '{}');
  return rooms[code];
}

// Старт игры в комнате
function startGame(code) {
  const rooms = JSON.parse(localStorage.getItem('rooms') || '{}');

  if (rooms[code]) {
    rooms[code].gameStarted = true;
    localStorage.setItem('rooms', JSON.stringify(rooms));
  }
}

export {
  createRoom,
  joinRoom,
  getRoom,
  startGame
};
