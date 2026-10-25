const MinigameInterface = require('./MinigameInterface');

class HotPineapple extends MinigameInterface {
  constructor(roomId, players, io) {
    super(roomId, players, io);
    this.duration = 40000;
    this.rules = 'O Abacaxi Quente passa entre os jogadores! Quando o timer zerar, quem estiver com ele PERDE pontos. Os outros GANHAM.';
    this.controls = 'Botão "PASSAR" para passar o abacaxi ao próximo jogador (sentido horário). Cooldown curto!';

    this.PASS_COOLDOWN = 500;
    this.EXPLOSION_MIN = 8000;
    this.EXPLOSION_MAX = 25000;

    this.state = {
      players: {}, // pid -> { hasPineapple, alive, score, passReady, passCooldown }
      currentHolder: null,
      explosionTime: 0,
      timeLeft: this.duration / 1000,
      phase: 'playing', // playing, exploded, roundEnd
    };

    this.players.forEach((p, i) => {
      this.state.players[p.id] = { hasPineapple: false, alive: true, score: 0, passReady: true, passCooldown: 0 };
    });
    // random first holder
    this.state.currentHolder = this.players[0].id;
    this.state.players[this.state.currentHolder].hasPineapple = true;
    this._scheduleExplosion();
  }

  _scheduleExplosion() {
    const delay = this.EXPLOSION_MIN + Math.random() * (this.EXPLOSION_MAX - this.EXPLOSION_MIN);
    this.state.explosionTime = Date.now() + delay;
  }

  onPlayerInput(playerId, data) {
    if (this.state.phase !== 'playing') return;
    const p = this.state.players[playerId];
    if (!p || !p.alive) return;
    const { action } = data;
    if (action !== 'pass') return;
    if (!p.passReady) return;
    if (!p.hasPineapple) return;

    // pass to next alive player clockwise
    const playerIds = this.players.map(p => p.id).filter(id => this.state.players[id].alive);
    const currentIdx = playerIds.indexOf(playerId);
    const nextIdx = (currentIdx + 1) % playerIds.length;
    const nextId = playerIds[nextIdx];

    p.hasPineapple = false;
    p.passReady = false;
    p.passCooldown = this.PASS_COOLDOWN;

    const nextPlayer = this.state.players[nextId];
    nextPlayer.hasPineapple = true;
    this.state.currentHolder = nextId;

    this.emit('state_update', this.getState());

    // reset cooldown
    setTimeout(() => {
      p.passReady = true;
      p.passCooldown = 0;
      this.emit('state_update', this.getState());
    }, this.PASS_COOLDOWN);
  }

  _updatePhysics(dt) {
    // update cooldowns
    Object.values(this.state.players).forEach(p => {
      if (!p.passReady) {
        p.passCooldown -= dt;
        if (p.passCooldown <= 0) {
          p.passReady = true;
          p.passCooldown = 0;
        }
      }
    });

    // check explosion
    if (this.state.phase === 'playing' && Date.now() >= this.state.explosionTime) {
      this._explode();
    }

    this.state.timeLeft = Math.max(0, (this.duration - (Date.now() - this._startTime)) / 1000);
  }

  _explode() {
    this.state.phase = 'exploded';
    const holder = this.state.currentHolder;
    const holderPlayer = this.state.players[holder];
    
    // holder loses points, others gain
    Object.entries(this.state.players).forEach(([pid, p]) => {
      if (pid === holder) {
        p.score -= 3;
        p.alive = false; // eliminated for this round
      } else {
        p.score += 1;
      }
    });

    this.emit('state_update', { ...this.getState(), phase: 'exploded', loser: holder });

    // if more than 1 alive, start new round after delay
    const aliveCount = Object.values(this.state.players).filter(p => p.alive).length;
    if (aliveCount > 1) {
      setTimeout(() => {
        // reset for next round
        this.state.phase = 'playing';
        // new random holder among alive
        const aliveIds = Object.entries(this.state.players).filter(([_,p])=>p.alive).map(([pid])=>pid);
        this.state.currentHolder = aliveIds[Math.floor(Math.random() * aliveIds.length)];
        Object.values(this.state.players).forEach(p => { p.hasPineapple = false; });
        this.state.players[this.state.currentHolder].hasPineapple = true;
        this._scheduleExplosion();
        this.emit('state_update', this.getState());
      }, 3000);
    } else {
      // round over
      setTimeout(() => this.finish(), 2000);
    }
  }

  _setupTimer() {
    this._startTime = Date.now();
    this.timer = setInterval(() => {
      if (!this.isRunning) return;
      this._updatePhysics(16);
      this.emit('state_update', this.getState());
      if (this.state.timeLeft <= 0) {
        clearInterval(this.timer);
        this.finish();
      }
    }, 16);
  }

  _calculateRanking() {
    return Object.entries(this.state.players)
      .map(([pid, p]) => ({ playerId: pid, score: p.score }))
      .sort((a, b) => b.score - a.score);
  }

  getState() {
    return {
      players: this.state.players,
      currentHolder: this.state.currentHolder,
      explosionTime: this.state.explosionTime,
      timeLeft: this.state.timeLeft,
      phase: this.state.phase,
    };
  }
}

module.exports = HotPineapple;