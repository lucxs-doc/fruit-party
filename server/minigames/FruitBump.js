const MinigameInterface = require('./MinigameInterface');

const ARENA_RADIUS = 300;
const FRUIT_RADIUS = 40;
const MAX_SPEED = 6;
const BOOST_SPEED = 18;
const BOOST_COOLDOWN = 1500;
const FRICTION = 0.95;

class FruitBump extends MinigameInterface {
  constructor(roomId, players, io) {
    super(roomId, players, io);
    this.duration = 60000;
    this.rules = 'Empurre os adversários para fora da arena! O último dentro vence.';
    this.controls = 'Joystick para mover • Botão "IMPULSO" para dash (cooldown 1.5s)';

    // fruit types for visual variety
    this.fruitTypes = ['🍉', '🍊', '🍇', '🍎', '🍐', '🍑', '🥭', '🍍'];
    
    this.state = {
      arenaRadius: ARENA_RADIUS,
      fruits: {}, // playerId -> { x, y, vx, vy, radius, type, alive, boostReady, boostCooldown }
      eliminated: [],
      timeLeft: this.duration / 1000,
    };

    // initialize fruits
    players.forEach((p, i) => {
      const angle = (i / players.length) * Math.PI * 2;
      const r = ARENA_RADIUS * 0.5;
      this.state.fruits[p.id] = {
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        vx: 0,
        vy: 0,
        radius: FRUIT_RADIUS,
        type: this.fruitTypes[i % this.fruitTypes.length],
        alive: true,
        boostReady: true,
        boostCooldown: 0,
      };
    });
  }

  start() {
    super.start();
    // send initial positions
    this._broadcastState();
  }

  onPlayerInput(playerId, data) {
    const fruit = this.state.fruits[playerId];
    if (!fruit || !fruit.alive) return;

    const { action, payload } = data;

    if (action === 'move') {
      // payload: { x: -1..1, y: -1..1 } joystick direction
      const { x, y } = payload;
      const len = Math.hypot(x, y);
      if (len > 0) {
        fruit.vx += (x / len) * MAX_SPEED * 0.3;
        fruit.vy += (y / len) * MAX_SPEED * 0.3;
      }
    } else if (action === 'boost') {
      if (fruit.boostReady) {
        const { x, y } = payload; // direction of boost
        const len = Math.hypot(x, y);
        if (len > 0) {
          fruit.vx = (x / len) * BOOST_SPEED;
          fruit.vy = (y / len) * BOOST_SPEED;
          fruit.boostReady = false;
          fruit.boostCooldown = BOOST_COOLDOWN;
        }
      }
    }
  }

  _updatePhysics(dt) {
    // dt in ms
    const dtSec = dt / 1000;

    // update boost cooldowns
    Object.values(this.state.fruits).forEach(f => {
      if (!f.boostReady) {
        f.boostCooldown -= dt;
        if (f.boostCooldown <= 0) {
          f.boostReady = true;
          f.boostCooldown = 0;
        }
      }
    });

    // apply velocity and friction
    Object.values(this.state.fruits).forEach(f => {
      if (!f.alive) return;
      f.x += f.vx * dtSec * 60;
      f.y += f.vy * dtSec * 60;
      f.vx *= FRICTION;
      f.vy *= FRICTION;
    });

    // collision between fruits
    const ids = Object.keys(this.state.fruits);
    for (let i = 0; i < ids.length; i++) {
      const a = this.state.fruits[ids[i]];
      if (!a.alive) continue;
      for (let j = i + 1; j < ids.length; j++) {
        const b = this.state.fruits[ids[j]];
        if (!b.alive) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.radius + b.radius;
        if (dist < minDist && dist > 0.001) {
          // elastic collision with mass = 1
          const nx = dx / dist;
          const ny = dy / dist;
          const dvx = b.vx - a.vx;
          const dvy = b.vy - a.vy;
          const dot = dvx * nx + dvy * ny;
          if (dot > 0) {
            const impulse = dot / 2;
            a.vx += impulse * nx;
            a.vy += impulse * ny;
            b.vx -= impulse * nx;
            b.vy -= impulse * ny;
          }
          // separate slightly
          const overlap = minDist - dist;
          a.x -= nx * overlap * 0.5;
          a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.y += ny * overlap * 0.5;
        }
      }
    }

    // arena boundary - eliminate if outside
    Object.values(this.state.fruits).forEach(f => {
      if (!f.alive) return;
      const dist = Math.hypot(f.x, f.y);
      if (dist > ARENA_RADIUS - f.radius) {
        f.alive = false;
        this.state.eliminated.push(f);
      }
    });

    // update time left
    this.state.timeLeft = Math.max(0, (this.duration - (Date.now() - this._startTime)) / 1000);
  }

  _broadcastState() {
    this.emit('state_update', this.getState());
  }

  // override the timer to use game loop
  _setupTimer() {
    this._startTime = Date.now();
    this.timer = setInterval(() => {
      if (!this.isRunning) return;
      this._updatePhysics(16); // ~60fps
      this._broadcastState();

      // check end condition: only 1 alive or time up
      const alive = Object.values(this.state.fruits).filter(f => f.alive);
      if (alive.length <= 1 || this.state.timeLeft <= 0) {
        clearInterval(this.timer);
        this.finish();
      }
    }, 16);
  }

  _calculateRanking() {
    // ranking: survivors first (by time survived), then eliminated (by elimination order)
    const alive = Object.entries(this.state.fruits)
      .filter(([_, f]) => f.alive)
      .map(([pid]) => ({ playerId: pid, score: 1000 + this.state.timeLeft }));
    
    const eliminated = this.state.eliminated
      .map((f, idx) => ({ playerId: Object.keys(this.state.fruits).find(k => this.state.fruits[k] === f), score: idx }));

    // combine: alive first (higher score), then eliminated in order
    const ranking = [...alive, ...eliminated]
      .sort((a, b) => b.score - a.score);
    
    return ranking;
  }

  getState() {
    return {
      arenaRadius: this.state.arenaRadius,
      fruits: Object.fromEntries(
        Object.entries(this.state.fruits).map(([pid, f]) => [
          pid, {
            x: f.x, y: f.y, vx: f.vy, vy: f.vy,
            radius: f.radius, type: f.type, alive: f.alive,
            boostReady: f.boostReady, boostCooldown: f.boostCooldown
          }
        ])
      ),
      eliminated: this.state.eliminated.map(f => Object.keys(this.state.fruits).find(k => this.state.fruits[k] === f)),
      timeLeft: this.state.timeLeft,
    };
  }
}

module.exports = FruitBump;