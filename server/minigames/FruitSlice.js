const MinigameInterface = require('./MinigameInterface');

class FruitSlice extends MinigameInterface {
  constructor(roomId, players) {
    super(roomId, players);
    this.state = {
      fruits: [],
      timeLeft: 60,
      scored: false,
    };
    this._generateFruits();
  }

  _generateFruits() {
    this.state.fruits = [];
    for (let i = 0; i < 10; i++) {
      this.state.fruits.push({
        id: `f${Date.now() + i}`,
        x: Math.random() * 800,
        y: Math.random() * 600,
        radius: 20,
        collected: false,
        collectedBy: null,
      });
    }
  }

  start() {
    this.isRunning = true;
    this.state.timeLeft = 60;
    this.state.scored = false;
    this._emitState();
  }

  onPlayerInput(playerId, data) {
    // data: { action, payload: { start, end } }
    if (!data || !data.payload || !data.payload.end) return;
    const { end } = data.payload;
    for (const fruit of this.state.fruits) {
      if (fruit.collected) continue;
      const dx = end.x - fruit.x;
      const dy = end.y - fruit.y;
      const dist = Math.hypot(dx, dy);
      if (dist < fruit.radius) {
        fruit.collected = true;
        fruit.collectedBy = playerId;
        this._emitState();
      }
    }
  }

  getState() {
    return {
      ...this.state,
      timeLeft: Math.max(0, this.state.timeLeft),
    };
  }

  _calculateRanking() {
    const scores = {};
    this.players.forEach(p => { scores[p.id] = 0; });
    this.state.fruits.forEach(f => {
      if (f.collected && f.collectedBy) {
        scores[f.collectedBy] = (scores[f.collectedBy] || 0) + 1;
      }
    });
    // convert to ranking array sorted by points desc
    return Object.entries(scores)
      .map(([playerId, points]) => ({ playerId, points }))
      .sort((a, b) => b.points - a.points);
  }

  finish() {
    this.isRunning = false;
    clearTimeout(this.timer);
    const ranking = this._calculateRanking();
    this.emit('finished', ranking);
    return ranking;
  }
}

module.exports = FruitSlice;