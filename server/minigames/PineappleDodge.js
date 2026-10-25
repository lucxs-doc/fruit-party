const MinigameInterface = require('./MinigameInterface');

class PineappleDodge extends MinigameInterface {
  constructor(roomId, players, io) {
    super(roomId, players, io);
    this.duration = 50000;
    this.rules = 'Abacaxis rolam da direita para a esquerda. Desvie! Quem sobreviver mais tempo vence.';
    this.controls = 'Swipe ↑ para pular, Swipe ↓ para agachar';

    this.PLAYER_W = 40;
    this.PLAYER_H = 80;
    this.GROUND_Y = 0;
    this.OBSTACLE_SPEED = 300;
    this.SPAWN_INTERVAL = 1500;
    this.JUMP_VELOCITY = -550;
    this.GRAVITY = 1800;

    this.state = {
      players: {}, // pid -> { x, y, vy, state: 'ground'|'air'|'duck', alive, width, height }
      obstacles: [], // { x, y, width, height, type: 'low'|'high'|'both' }
      timeLeft: this.duration / 1000,
    };

    this.players.forEach(p => {
      this.state.players[p.id] = {
        x: -400, y: this.GROUND_Y, vy: 0,
        state: 'ground', alive: true,
        width: this.PLAYER_W, height: this.PLAYER_H,
      };
    });
    this._nextSpawn = 0;
  }

  onPlayerInput(playerId, data) {
    const p = this.state.players[playerId];
    if (!p || !p.alive) return;
    const { action, payload } = data;
    if (action !== 'swipe') return;

    const { dir } = payload; // 'up' or 'down'
    if (dir === 'up' && p.state === 'ground') {
      p.vy = this.JUMP_VELOCITY;
      p.state = 'air';
      p.height = this.PLAYER_H;
    } else if (dir === 'down') {
      if (p.state === 'air') {
        // fast fall
        p.vy = Math.abs(p.vy) * 1.5;
      } else if (p.state === 'ground') {
        p.state = 'duck';
        p.height = this.PLAYER_H * 0.5;
        p.y = this.GROUND_Y - p.height / 2;
      }
    }
  }

  _updatePhysics(dt) {
    const dtSec = dt / 1000;

    // players
    Object.values(this.state.players).forEach(p => {
      if (!p.alive) return;
      if (p.state === 'air') {
        p.vy += this.GRAVITY * dtSec;
        p.y += p.vy * dtSec;
        if (p.y >= this.GROUND_Y) {
          p.y = this.GROUND_Y;
          p.vy = 0;
          p.state = 'ground';
          p.height = this.PLAYER_H;
        }
      } else if (p.state === 'duck') {
        // stay ducked until swipe up? for simplicity, auto-stand after 0.5s
        // we'll handle via a timer in a real impl; here just allow stand on next up
      }
    });

    // obstacles
    this.state.obstacles.forEach(o => {
      o.x -= this.OBSTACLE_SPEED * dtSec;
    });
    // remove off-screen
    this.state.obstacles = this.state.obstacles.filter(o => o.x > -100);

    // spawn
    this._nextSpawn -= dt;
    if (this._nextSpawn <= 0) {
      this._spawnObstacle();
      this._nextSpawn = this.SPAWN_INTERVAL + Math.random() * 1000;
    }

    // collision
    this.state.obstacles.forEach(o => {
      Object.values(this.state.players).forEach(p => {
        if (!p.alive) return;
        const px = p.x, py = p.y - p.height/2;
        const pw = p.width, ph = p.height;
        if (px < o.x + o.width && px + pw > o.x &&
            py < o.y + o.height && py + ph > o.y) {
          p.alive = false;
        }
      });
    });

    this.state.timeLeft = Math.max(0, (this.duration - (Date.now() - this._startTime)) / 1000);
  }

  _spawnObstacle() {
    const types = ['low', 'high', 'both'];
    const type = types[Math.floor(Math.random() * types.length)];
    let y, height;
    if (type === 'low') { y = this.GROUND_Y - 40; height = 40; }
    else if (type === 'high') { y = this.GROUND_Y - 120; height = 60; }
    else { y = this.GROUND_Y - 120; height = 120; }
    this.state.obstacles.push({
      x: 800, y, width: 50, height, type
    });
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
    // rank by survival time (we don't track individually, use timeLeft as proxy)
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
      players: this.state.players,
      obstacles: this.state.obstacles,
      groundY: this.GROUND_Y,
      timeLeft: this.state.timeLeft,
    };
  }
}

module.exports = PineappleDodge;