const Phaser = require('phaser');

// Scenes
const LobbyScene = require('./scenes/LobbyScene');
const MinigameIntroScene = require('./scenes/MinigameIntroScene');
const ScoreboardScene = require('./scenes/ScoreboardScene');
const GameOverScene = require('./scenes/GameOverScene');
const FruitBumpScene = require('./scenes/minigames/FruitBumpScene');
const FruitEscapeScene = require('./scenes/minigames/FruitEscapeScene');
const PineappleDodgeScene = require('./scenes/minigames/PineappleDodgeScene');
const FruitShelfScene = require('./scenes/minigames/FruitShelfScene');
const MelonSledScene = require('./scenes/minigames/MelonSledScene');
const FruitKingSaysScene = require('./scenes/minigames/FruitKingSaysScene');
const FruitMemoryScene = require('./scenes/minigames/FruitMemoryScene');
const TraceRaceScene = require('./scenes/minigames/TraceRaceScene');
const FruitKitchenScene = require('./scenes/minigames/FruitKitchenScene');
const HotPineappleScene = require('./scenes/minigames/HotPineappleScene');

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [
    LobbyScene, MinigameIntroScene,
    FruitBumpScene, FruitEscapeScene, PineappleDodgeScene, FruitShelfScene,
    MelonSledScene, FruitKingSaysScene, FruitMemoryScene,
    TraceRaceScene, FruitKitchenScene, HotPineappleScene,
    ScoreboardScene, GameOverScene
  ],
};

const game = new Phaser.Game(config);
game.socket = null;
game.roomCode = null;
game.myPlayerId = null;
game.players = [];
game.currentMinigame = null;
game.accumulatedScores = [];

// Configurable backend URL - set via window.BACKEND_URL or auto-detect
const BACKEND_URL = window.BACKEND_URL || (location.hostname === 'localhost' ? '' : `https://${location.hostname.replace(/^[^.]+\./, '')}`);
// If on Netlify/Vercel, backend is on separate domain. Set window.BACKEND_URL in index.html before loading main.js

const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
game.socket = socket;

socket.on('connect', () => { console.log('Connected to', BACKEND_URL || 'same origin'); game.scene.start('LobbyScene'); });
socket.on('connect_error', (err) => { console.error('Socket connection error:', err); alert('Erro de conexão com servidor. Verifique BACKEND_URL.'); });

socket.on('room_created', ({ code }) => { game.roomCode = code; });

socket.on('player_joined', ({ players }) => {
  game.players = players;
  if (game.scene.isActive('LobbyScene')) game.scene.getScene('LobbyScene').updatePlayerList(players);
});

socket.on('minigame_intro', (data) => {
  game.currentMinigame = data;
  game.scene.start('MinigameIntroScene', data);
});

socket.on('minigame_start', ({ state }) => {
  const sceneMap = {
    'FruitBump': 'FruitBumpScene',
    'FruitEscape': 'FruitEscapeScene',
    'PineappleDodge': 'PineappleDodgeScene',
    'FruitShelf': 'FruitShelfScene',
    'MelonSled': 'MelonSledScene',
    'FruitKingSays': 'FruitKingSaysScene',
    'FruitMemory': 'FruitMemoryScene',
    'TraceRace': 'TraceRaceScene',
    'FruitKitchen': 'FruitKitchenScene',
    'HotPineapple': 'HotPineappleScene',
  };
  const sceneName = sceneMap[game.currentMinigame?.name] || 'FruitBumpScene';
  game.scene.start(sceneName, { state, players: game.players });
});

socket.on('game_state_update', ({ state }) => {
  const activeScene = game.scene.getScenes(true).find(s => s.updateState);
  if (activeScene) activeScene.updateState(state);
});

socket.on('minigame_result', ({ ranking, round }) => {
  game.scene.start('ScoreboardScene', { ranking, round, accumulated: game.accumulatedScores, isFinal: false });
});

socket.on('score_update', ({ ranking }) => { game.accumulatedScores = ranking; });

socket.on('game_over', ({ finalRanking, winner }) => {
  game.scene.start('GameOverScene', { finalRanking, winner });
});

socket.on('join_error', ({ message }) => alert(message));