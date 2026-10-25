const MinigameInterface = require('./MinigameInterface');

class FruitEscape extends MinigameInterface {
  constructor(roomId, players, io) {
    super(roomId, players, io);
    this.duration = 45000;
    this.rules = 'Plataformas afundam! Pule entre elas para não cair na água. Último vivo vence.';
    this.controls = 'Botões ← ↑ → para pular entre plataformas adjacentes';

    this.platforms = []; // { x, y, radius, sinking, sinkTimer, alive }
    this.playerPlatform = {}; // playerId -> platform index
    this.PLATFORM_RADIUS = 60;
    this.GAP = 180;
    this.ROWS = 4;
    this.COLS = 5;
    this.SINK_TIME = 3000;
    this.WATER_LEVEL = -400;

    this.state = {
      platforms: [],
      players: {},
      waterLevel: this.WATER_LEVEL,
      timeLeft: this.duration / 1000,
    };

    this._generatePlatforms();
    this._assignInitialPlatforms();
  }

  _generatePlatforms() {
    this.platforms = [];
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const x = (c - (this.COLS - 1) / 2) * this.GAP;
        const y = (r - (this.ROWS - 1) / 2) * this.GAP - 100;
        this.platforms.push({
          x, y,
          radius: this.PLATFORM_RADIUS,
          sinking: false,
          sinkTimer: 0,
          alive: true,
          row: r, col: c,
        });
      }
    }
    this.state.platforms = this.platforms.map(p => ({
      x: p.x, y: p.y, radius: p.radius, alive: p.alive, sinking: p.sinking
    }));
  }

  _assignInitialPlatforms() {
    const alivePlatforms = this.platforms.filter(p => p.alive);
    this.players.forEach((p, i) => {
      const plat = alivePlatforms[i % alivePlatforms.length];
      this.playerPlatform[p.id] = this.platforms.indexOf(plat);
      this.state.players[p.id] = { x: plat.x, y: plat.y, alive: true };
    });
  }

  onPlayerInput(playerId, data) {
    if (this.state.players[playerId]?.alive === false) return;
    const { action, payload } = data;
    if (action !== 'jump') return;

    const currentIdx = this.playerPlatform[playerId];
    if (currentIdx === undefined) return;
    const current = this.platforms[currentIdx];
    if (!current.alive) return;

    const { dir } = payload; // 'up', 'down', 'left', 'right'
    let targetIdx = -1;
    if (dir === 'up') targetIdx = this._findPlatform(current.row - 1, current.col);
    else if (dir === 'down') targetIdx = this._findPlatform(current.row + 1, current.col);
    else if (dir === 'left') targetIdx = this._findPlatform(current.row, current.col - 1);
    else if (dir === 'right') targetIdx = this._findPlatform(current.row, current.col + 1);

    if (targetIdx !== -1 && this.platforms[targetIdx].alive) {
      this.playerPlatform[playerId] = targetIdx;
      const target = this.platforms[targetIdx];
      this.state.players[playerId] = { x: target.x, y: target.y, alive: true };
      
      // trigger sink on old platform after delay
      if (!current.sinking) {
        current.sinking = true;
        current.sinkTimer = this.SINK_TIME;
      }
    }
  }

  _findPlatform(row, col) {
    if (row < 0 || row >= this.ROWS || col < 0 || col >= this.COLS) return -1;
    return row * this.COLS + col;
  }

  _updatePhysics(dt) {
    // sink platforms
    this.platforms.forEach(p => {
      if (p.sinking && p.alive) {
        p.sinkTimer -= dt;
        if (p.sinkTimer <= 0) {
          p.alive = false;
          p.sinking = false;
          // eliminate players on it
          Object.entries(this.playerPlatform).forEach(([pid, idx]) => {
            if (idx === this.platforms.indexOf(p)) {
              this.state.players[pid] = { ...this.state.players[pid], alive: false };
            }
          });
        }
      }
    });

    // randomly sink a new platform every few seconds
    if (Math.random() < 0.02) {
      const alive = this.platforms.filter(p => p.alive && !p.sinking);
      if (alive.length > this.players.length) {
        const p = alive[Math.floor(Math.random() * alive.length)];
        p.sinking = true;
        p.sinkTimer = this.SINK_TIME;
      }
    }

    // update state
    this.state.platforms = this.platforms.map(p => ({
      x: p.x, y: p.y, radius: p.radius, alive: p.alive, sinking: p.sinking
    }));
    this.state.timeLeft = Math.max(0, (this.duration - (Date.now() - this._startTime)) / 1000);
  }

  _setupTimer() {
    this._startTime = Date.now();
    this.timer = setInterval(() => {
      if (!this.isRunning) return;
      this._updatePhysics(16);
      this.emit('state_update', this.getState());

      const alivePlayers = Object.values(this.state.players).filter(p => p.alive).length;
      if (alivePlayers <= 1 || this.state.timeLeft <= 0) {
        clearInterval(this.timer);
        this.finish();
      }
    }, 16);
  }

  _calculateRanking() {
    const alive = Object.entries(this.state.players)
      .filter(([_, p]) => p.alive)
      .map(([pid]) => ({ playerId: pid, score: 1000 + this.state.timeLeft }));
    const dead = Object.entries(this.state.players)
      .filter(([_, p]) => !p.alive)
      .map(([pid], i) => ({ playerId: pid, score: i }));
    return [...alive, ...dead].sort((a, b) => b.score - a.score);
  }

  getState() {
    return {
      platforms: this.state.platforms,
      players: this.state.players,
      waterLevel: this.state.waterLevel,
      timeLeft: this.state.timeLeft,
    };
  }
}

module.exports = FruitEscape;