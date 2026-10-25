require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const RoomManager = require('./RoomManager');
const ScoreManager = require('./ScoreManager');
const RoundRouter = require('./RoomRouter');
const FruitBump = require('./minigames/FruitBump');
const FruitEscape = require('./minigames/FruitEscape');
const PineappleDodge = require('./minigames/PineappleDodge');
const FruitShelf = require('./minigames/FruitShelf');
const MelonSled = require('./minigames/MelonSled');
const FruitKingSays = require('./minigames/FruitKingSays');
const FruitMemory = require('./minigames/FruitMemory');
const TraceRace = require('./minigames/TraceRace');
const FruitKitchen = require('./minigames/FruitKitchen');
const HotPineapple = require('./minigames/HotPineapple');

const app = express();
const server = http.createServer(app);

// CORS origins from env (comma-separated) or default to localhost
const corsOrigins = (process.env.FRONTEND_URLS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const roomMgr = new RoomManager();
const scoreMgr = new ScoreManager(roomMgr);
const roundRouter = new RoundRouter(io, roomMgr, scoreMgr, [
  FruitBump,
  FruitEscape,
  PineappleDodge,
  FruitShelf,
  MelonSled,
  FruitKingSays,
  FruitMemory,
  TraceRace,
  FruitKitchen,
  HotPineapple,
]);

app.use(express.static(path.join(__dirname, '../client-desktop')));
app.use('/mobile', express.static(path.join(__dirname, '../client-mobile')));

io.on('connection', socket => {
  console.log('socket connected', socket.id);

  socket.on('create_room', () => {
    const code = roomMgr.createRoom(socket.id);
    socket.join(code);
    roundRouter.startGame(code);
  });

  socket.on('join_room', ({ code, name }) => {
    const playerId = socket.id;
    const success = roomMgr.joinRoom(code, playerId, name, socket.id);
    if (success) {
      socket.join(code);
      const players = roomMgr.getPlayers(code);
      io.to(code).emit('player_joined', { players });
    } else {
      socket.emit('join_error', { message: 'Sala não encontrada' });
    }
  });

  socket.on('player_input', data => {
    const { roomCode, playerId, ...payload } = data;
    roundRouter.handlePlayerInput(roomCode, playerId, payload);
  });

  socket.on('ready_state', ({ roomCode, playerId, ready }) => {
    // could be used for synchronization
  });

  socket.on('disconnect', () => {
    // handle cleanup if needed
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});