const { EventEmitter } = require('events');

class MinigameInterface extends EventEmitter {
  constructor(roomId, players, io) {
    super();
    this.roomId = roomId;
    this.players = players; // [{ id, name, socketId }]
    this.io = io;
    this.state = {};
    this.isRunning = false;
    this.timer = null;
    this.duration = 60000; // 60s default
    this.rules = 'Regras do minijogo';
    this.controls = 'Controles no celular';
  }

  start() {
    this.isRunning = true;
    this._setupTimer();
    this.emit('state_update', this.getState());
  }

  _setupTimer() {
    this.timer = setTimeout(() => {
      this.finish();
    }, this.duration);
  }

  onPlayerInput(playerId, data) {
    // override in subclass
  }

  getState() {
    return { ...this.state };
  }

  finish() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearTimeout(this.timer);
    const ranking = this._calculateRanking();
    this.emit('finished', ranking);
    return ranking;
  }

  _calculateRanking() {
    // return [{ playerId, score }, ...] sorted desc
    return [];
  }
}

module.exports = MinigameInterface;