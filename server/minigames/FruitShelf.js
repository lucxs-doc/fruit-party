const MinigameInterface = require('./MinigameInterface');

class FruitShelf extends MinigameInterface {
  constructor(roomId, players, io) {
    super(roomId, players, io);
    this.duration = 40000;
    this.rules = 'Estantes de frutas gigantes descem! Encontre o vão e passe por ele. Quem for esmagado perde.';
    this.controls = 'Botões ← → para mover, timing preciso';

    this.ARENA_W = 800;
    this.ARENA_H = 600;
    this.PLAYER_W = 40;
    this.PLAYER_H = 40;
    this.SHELF_H = 80;
    this.GAP_W = 120;
    this.SPEED = 150;
    this.SPAWN_INTERVAL = 2000;

    this.state = {
      players: {}, // pid -> { x, y, alive }
      shelves: [], // { y, gapX, gapW, passed }
      timeLeft: this.duration / 1000,
    };

    this.players.forEach((p, i) => {
      this.state.players[p.id] = {
        x: (i - (this.players.length-1)/2) * 100,
        y: this.ARENA_H / 2,
        alive: true,
      };
    });
    this._nextSpawn = 0;
  }

  onPlayerInput(playerId, data) {
    const p = this.state.players[playerId];
    if (!p || !p.alive) return;
    const { action, payload } = data;
    if (action !== 'move') return;
    const { dir } = payload; // -1 left, 1 right
    p.x += dir * 8;
    p.x = Math.max(this.PLAYER_W/2, Math.min(this.ARENA_W - this.PLAYER_W/2, p.x));
  }

  _updatePhysics(dt) {
    const dtSec = dt / 1000;

    // move shelves down
    this.state.shelves.forEach(s => {
      s.y += this.SPEED * dtSec;
    });
    // remove passed
    this.state.shelves = this.state.shelves.filter(s => s.y < this.ARENA_H + this.SHELF_H);

    // spawn
    this._nextSpawn -= dt;
    if (this._nextSpawn <= 0) {
      const gapX = Math.random() * (this.ARENA_W - this.GAP_W);
      this.state.shelves.push({ y: -this.SHELF_H, gapX, gapW: this.GAP_W, passed: false });
      this._nextSpawn = this.SPAWN_INTERVAL;
    }

    // collision
    this.state.shelves.forEach(s => {
      const shelfTop = s.y;
      const shelfBottom = s.y + this.SHELF_H;
      Object.values(this.state.players).forEach(p => {
        if (!p.alive) return;
        const px = p.x - this.PLAYER_W/2;
        const py = p.y - this.PLAYER_H/2;
        // check if player overlaps shelf vertically
        if (py < shelfBottom && py + this.PLAYER_H > shelfTop) {
          // check if in gap
          const inGap = px + this.PLAYER_W > s.gapX && px < s.gapX + s.gapW;
          if (!inGap) {
            p.alive = false;
          }
        }
      });
    });

    this.state.timeLeft = Math.max(0, (this.duration - (Date.now() - this._startTime)) / 1000);
  }

  _setupTimer() {
    this._startTime = Date.now();
    this.timer = setInterval(() => {
      if (!this.isRunning) return;
      this._updatePhysics(16);
      this.emit('state_update', this.getState());

      const alive = Object.values(this.state.players).filter(p => p.alive).length;
      if (alive <= 1 || this.state.timeLeft <= 0) {
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
      arenaW: this.ARENA_W,
      arenaH: this.ARENA_H,
      playerW: this.PLAYER_W,
      playerH: this.PLAYER_H,
      shelfH: this.SHELF_H,
      players: this.state.players,
      shelves: this.state.shelves,
      timeLeft: this.state.timeLeft,
    };
  }
}

module.exports = FruitShelf;