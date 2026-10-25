const MinigameInterface = require('./MinigameInterface');

class TraceRace extends MinigameInterface {
  constructor(roomId, players, io) {
    super(roomId, players, io);
    this.duration = 45000;
    this.rules = 'Siga a linha curva com precisão. Quem sair do traço ou chegar por último perde.';
    this.controls = 'Joystick virtual ou acelerômetro para guiar o cursor ao longo da linha';

    this.TRACK_LENGTH = 5000;
    this.TRACK_WIDTH = 30;
    this.PLAYER_SPEED = 200; // forward auto
    this.MAX_DEVIATION = 40;

    this.state = {
      players: {}, // pid -> { progress, deviation, alive, finished }
      track: [], // array of { x, y } points
      timeLeft: this.duration / 1000,
    };

    this._generateTrack();
    this.players.forEach(p => {
      this.state.players[p.id] = { progress: 0, deviation: 0, alive: true, finished: false };
    });
  }

  _generateTrack() {
    const points = [];
    let x = 0, y = 0;
    const segments = 200;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // curved path
      const curve = Math.sin(t * Math.PI * 4) * 200;
      x = t * this.TRACK_LENGTH;
      y = curve;
      points.push({ x, y });
    }
    this.state.track = points;
  }

  onPlayerInput(playerId, data) {
    const p = this.state.players[playerId];
    if (!p || !p.alive || p.finished) return;
    const { action, payload } = data;
    if (action !== 'steer') return;
    const { dir } = payload; // -1 left, 1 right
    p.deviation += dir * 10;
    p.deviation = Math.max(-this.MAX_DEVIATION, Math.min(this.MAX_DEVIATION, p.deviation));
  }

  _updatePhysics(dt) {
    const dtSec = dt / 1000;

    Object.values(this.state.players).forEach(p => {
      if (!p.alive || p.finished) return;
      p.progress += this.PLAYER_SPEED * dtSec;

      // ideal position on track
      const trackIdx = Math.floor((p.progress / this.TRACK_LENGTH) * (this.state.track.length - 1));
      const idealY = this.state.track[trackIdx]?.y ?? 0;
      
      // check if deviation too large
      if (Math.abs(p.deviation - idealY) > this.TRACK_WIDTH) {
        p.alive = false;
      }

      if (p.progress >= this.TRACK_LENGTH) {
        p.finished = true;
        p.alive = false; // stop updating
      }
    });

    this.state.timeLeft = Math.max(0, (this.duration - (Date.now() - this._startTime)) / 1000);
  }

  _setupTimer() {
    this._startTime = Date.now();
    this.timer = setInterval(() => {
      if (!this.isRunning) return;
      this._updatePhysics(16);
      this.emit('state_update', this.getState());

      const active = Object.values(this.state.players).filter(p => p.alive).length;
      const finished = Object.values(this.state.players).filter(p => p.finished).length;
      if (active === 0 || finished >= this.players.length - 1 || this.state.timeLeft <= 0) {
        clearInterval(this.timer);
        this.finish();
      }
    }, 16);
  }

  _calculateRanking() {
    const finished = Object.entries(this.state.players)
      .filter(([_, p]) => p.finished)
      .sort((a, b) => a[1].progress - b[1].progress) // earlier finish = better
      .map(([pid], i) => ({ playerId: pid, score: 10000 - i * 100 }));

    const alive = Object.entries(this.state.players)
      .filter(([_, p]) => p.alive && !p.finished)
      .sort((a, b) => b[1].progress - a[1].progress)
      .map(([pid], i) => ({ playerId: pid, score: 1000 - i * 10 }));

    const dead = Object.entries(this.state.players)
      .filter(([_, p]) => !p.alive && !p.finished)
      .sort((a, b) => b[1].progress - a[1].progress)
      .map(([pid], i) => ({ playerId: pid, score: i }));

    return [...finished, ...alive, ...dead].sort((a, b) => b.score - a.score);
  }

  getState() {
    return {
      trackWidth: this.TRACK_WIDTH,
      track: this.state.track,
      players: this.state.players,
      timeLeft: this.state.timeLeft,
    };
  }
}

module.exports = TraceRace;