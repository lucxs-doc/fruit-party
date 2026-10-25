const MinigameInterface = require('./MinigameInterface');

class MelonSled extends MinigameInterface {
  constructor(roomId, players, io) {
    super(roomId, players, io);
    this.duration = 60000;
    this.rules = 'Duplas! Cada jogador controla um lado do trenó. Sincronizem para curvar sem bater nas paredes.';
    this.controls = 'Dois botões ◀ ▶ por jogador. Jogador 1 = lado esquerdo, Jogador 2 = lado direito';

    this.TRACK_W = 200;
    this.SLED_W = 80;
    this.SLED_H = 60;
    this.SPEED = 200;
    this.TURN_SPEED = 120;

    // pair players: 0&1, 2&3, etc.
    this.pairs = [];
    for (let i = 0; i < players.length; i += 2) {
      if (i + 1 < players.length) {
        this.pairs.push([players[i].id, players[i+1].id]);
      } else {
        // odd player gets AI partner? for now solo
        this.pairs.push([players[i].id, null]);
      }
    }

    this.state = {
      pairs: {}, // pairId -> { x, angle, leftInput, rightInput, crashed, distance }
      timeLeft: this.duration / 1000,
    };

    this.pairs.forEach((pair, i) => {
      const pid = `pair_${i}`;
      this.state.pairs[pid] = {
        x: 0, angle: 0, leftInput: 0, rightInput: 0,
        crashed: false, distance: 0,
        players: pair,
      };
    });

    this._trackSegments = this._generateTrack();
    this._segmentIdx = 0;
  }

  _generateTrack() {
    const segments = [];
    let x = 0;
    for (let i = 0; i < 100; i++) {
      const curvature = (Math.random() - 0.5) * 0.02;
      segments.push({ x, curvature, width: this.TRACK_W });
      x += 100;
    }
    return segments;
  }

  onPlayerInput(playerId, data) {
    const { action, payload } = data;
    if (action !== 'turn') return;
    const { dir } = payload; // -1 left, 1 right

    // find which pair and side this player is
    Object.entries(this.state.pairs).forEach(([pairId, pair]) => {
      if (pair.crashed) return;
      if (pair.players[0] === playerId) {
        pair.leftInput = dir;
      } else if (pair.players[1] === playerId) {
        pair.rightInput = dir;
      }
    });
  }

  _updatePhysics(dt) {
    const dtSec = dt / 1000;

    Object.entries(this.state.pairs).forEach(([pairId, pair]) => {
      if (pair.crashed) return;

      // net turn = left - right (players push opposite sides to turn)
      const turn = (pair.leftInput - pair.rightInput) * this.TURN_SPEED * dtSec;
      pair.angle += turn;
      pair.angle = Math.max(-0.5, Math.min(0.5, pair.angle));

      // move forward
      pair.distance += this.SPEED * dtSec;

      // lateral position based on angle
      pair.x += Math.sin(pair.angle) * this.SPEED * dtSec * 2;

      // check track boundaries
      const segment = this._trackSegments[Math.floor(pair.distance / 100)] || this._trackSegments[this._trackSegments.length - 1];
      const centerX = segment.x; // track center follows segment curvature
      // Actually track center shifts with curvature
      // Simplified: track center is at 0, but curvature pushes sled
      // For simplicity, just check if sled leaves [-TRACK_W/2, TRACK_W/2]
      if (Math.abs(pair.x) > this.TRACK_W / 2 - this.SLED_W / 2) {
        pair.crashed = true;
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

      const active = Object.values(this.state.pairs).filter(p => !p.crashed).length;
      if (active <= 1 || this.state.timeLeft <= 0) {
        clearInterval(this.timer);
        this.finish();
      }
    }, 16);
  }

  _calculateRanking() {
    const entries = Object.entries(this.state.pairs)
      .map(([pairId, p]) => ({
        pairId,
        players: p.players,
        distance: p.distance,
        crashed: p.crashed,
      }))
      .sort((a, b) => b.distance - a.distance);

    const ranking = [];
    entries.forEach((e, i) => {
      e.players.forEach(pid => {
        if (pid) ranking.push({ playerId: pid, score: e.distance - (e.crashed ? 1000 : 0) });
      });
    });
    return ranking;
  }

  getState() {
    return {
      trackW: this.TRACK_W,
      sledW: this.SLED_W,
      sledH: this.SLED_H,
      pairs: this.state.pairs,
      trackSegments: this._trackSegments.slice(0, 20), // send first 20 for rendering
      timeLeft: this.state.timeLeft,
    };
  }
}

module.exports = MelonSled;