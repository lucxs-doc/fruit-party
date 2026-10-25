// Phaser and scenes are loaded globally by index.html.
const sceneList = [
  LobbyScene,
  MinigameIntroScene,
  FruitBumpScene,
  FruitEscapeScene,
  PineappleDodgeScene,
  FruitShelfScene,
  MelonSledScene,
  FruitKingSaysScene,
  FruitMemoryScene,
  TraceRaceScene,
  FruitKitchenScene,
  HotPineappleScene,
  ScoreboardScene,
  GameOverScene
];

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
  scene: sceneList, 
};

const game = new Phaser.Game(config);
game.socket = null;
game.roomCode = null;
game.myPlayerId = null;
game.players = [];
game.currentMinigame = null;
game.accumulatedScores = [];

const BACKEND_URL = window.BACKEND_URL || (location.hostname === 'localhost' ? '' : `https://${location.hostname.replace(/^[^.]+\\./, '')}`);
const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
game.socket = socket;

socket.on('connect', () => { 
  console.log('Connected to', BACKEND_URL || 'same origin'); 
  game.scene.start('LobbyScene'); 
  socket.emit('create_room');
});

socket.on('connect_error', (err) => { 
  console.error('Socket connection error:', err); 
  alert('Erro de conexão com servidor. Verifique BACKEND_URL.'); 
});

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
