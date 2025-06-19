const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const os = require('os');
const app = express();

// Middleware
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));
app.use(bodyParser.json());

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// In-memory база данных
const rooms = {};

// Вспомогательные функции
function getIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Network diagnostics
app.get('/api/network', (req, res) => {
  res.json({
    hostname: os.hostname(),
    interfaces: os.networkInterfaces(),
    nodeVersion: process.version
  });
});

// Create room
app.post('/api/rooms', (req, res) => {
  const { code, playerName } = req.body;
  
  if (!code || !playerName) {
    return res.status(400).json({ error: 'Не указан код комнаты или имя игрока' });
  }
  
  if (rooms[code]) {
    return res.status(400).json({ error: 'Комната уже существует' });
  }
  
  rooms[code] = {
    players: [playerName],
    gameStarted: false,
    playerTraits: {},
    revealedTraits: {},
    removedPlayers: [],
    timer: null,
    createdAt: Date.now(),
    lastActive: Date.now()
  };
  
  console.log(`Создана комната ${code}`);
  res.json({ success: true, room: rooms[code] });
});

// Join room
app.post('/api/rooms/:code/join', (req, res) => {
  const { code } = req.params;
  const { playerName } = req.body;
  
  if (!rooms[code]) {
    return res.status(404).json({ error: 'Комната не найдена' });
  }
  
  if (rooms[code].players.includes(playerName)) {
    return res.status(400).json({ error: 'Игрок с таким именем уже в комнате' });
  }
  
  rooms[code].players.push(playerName);
  rooms[code].lastActive = Date.now();
  
  res.json({ success: true, room: rooms[code] });
});

// Get room data
app.get('/api/rooms/:code', (req, res) => {
  const { code } = req.params;
  
  if (!rooms[code]) {
    return res.status(404).json({ error: 'Комната не найдена' });
  }
  
  res.json(rooms[code]);
});

// Start game
app.post('/api/rooms/:code/start', (req, res) => {
  const { code } = req.params;
  const { gameData } = req.body;
  
  if (!rooms[code]) {
    return res.status(404).json({ error: 'Комната не найдена' });
  }
  
  rooms[code] = {
    ...rooms[code],
    ...gameData,
    gameStarted: true,
    lastActive: Date.now()
  };
  
  res.json({ success: true, room: rooms[code] });
});

// Reveal trait
app.post('/api/rooms/:code/reveal', (req, res) => {
  const { code } = req.params;
  const { player, traitKey, value } = req.body;
  
  if (!rooms[code]) {
    return res.status(404).json({ error: 'Комната не найдена' });
  }
  
  if (!rooms[code].revealedTraits[player]) {
    rooms[code].revealedTraits[player] = {};
  }
  
  rooms[code].revealedTraits[player][traitKey] = value;
  rooms[code].lastActive = Date.now();
  
  res.json({ success: true, room: rooms[code] });
});

// Remove player
app.post('/api/rooms/:code/remove', (req, res) => {
  const { code } = req.params;
  const { playerToRemove } = req.body;
  
  if (!rooms[code]) {
    return res.status(404).json({ error: 'Комната не найдена' });
  }
  
  if (!rooms[code].removedPlayers.includes(playerToRemove)) {
    rooms[code].removedPlayers.push(playerToRemove);
  }
  
  rooms[code].lastActive = Date.now();
  
  res.json({ success: true, room: rooms[code] });
});

// Update room
app.patch('/api/rooms/:code', (req, res) => {
  const { code } = req.params;
  const updates = req.body;
  
  if (!rooms[code]) {
    return res.status(404).json({ error: 'Комната не найдена' });
  }
  
  rooms[code] = { ...rooms[code], ...updates, lastActive: Date.now() };
  res.json({ success: true, room: rooms[code] });
});

// Timer endpoints
app.post('/api/rooms/:code/timer/start', (req, res) => {
  const { code } = req.params;
  const { endTime } = req.body;
  
  if (!rooms[code]) {
    return res.status(404).json({ error: 'Комната не найдена' });
  }
  
  rooms[code].timer = {
    endTime,
    running: true
  };
  rooms[code].lastActive = Date.now();
  
  res.json({ success: true, room: rooms[code] });
});

app.post('/api/rooms/:code/timer/stop', (req, res) => {
  const { code } = req.params;
  
  if (!rooms[code]) {
    return res.status(404).json({ error: 'Комната не найдена' });
  }
  
  if (rooms[code].timer) {
    rooms[code].timer.running = false;
  }
  rooms[code].lastActive = Date.now();
  
  res.json({ success: true, room: rooms[code] });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`
  Сервер API запущен:
  - Локальный URL: http://localhost:${PORT}
  - Сетевой URL: http://${getIpAddress()}:${PORT}
  `);
});

// Очистка старых комнат
setInterval(() => {
  const now = Date.now();
  const hours24 = 24 * 60 * 60 * 1000;
  
  for (const code in rooms) {
    if (now - (rooms[code].lastActive || rooms[code].createdAt) > hours24) {
      delete rooms[code];
    }
  }
}, 60 * 60 * 1000);