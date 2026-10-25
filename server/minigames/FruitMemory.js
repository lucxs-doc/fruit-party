const MinigameInterface = require('./MinigameInterface');

class FruitMemory extends MinigameInterface {
  constructor(roomId, players, io) {
    super(roomId, players, io);
    this.duration = 60000;
    this.rules = 'Memorize as posições dos pares de frutas. Vire duas cartas por vez. Quem achar mais pares vence.';
    this.controls = 'Grade 4x4. Toque no número da carta para virar.';

    this.GRID_SIZE = 4;
    this.CARD_TYPES = ['🍉','🍊','🍇','🍎','🍐','🍑','🥭','🍍'];
    this.REVEAL_TIME = 1500;

    this._initGame();
  }

  _initGame() {
    // create pairs
    const pairs = [...this.CARD_TYPES, ...this.CARD_TYPES].slice(0, this.GRID_SIZE * this.GRID_SIZE / 2 * 2);
    // shuffle
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    // grid
    this.grid = [];
    for (let i = 0; i < this.GRID_SIZE * this.GRID_SIZE; i++) {
      this.grid.push({ type: pairs[i], revealed: false, matched: false });
    }

    this.state = {
      grid: this.grid.map(c => ({ revealed: false, matched: false })),
      players: {}, // pid -> { score, currentSelection: [], turn }
      currentPlayerIdx: 0,
      timeLeft: this.duration / 1000,
      phase: 'play', // play, reveal, end
    };

    this.players.forEach((p, i) => {
      this.state.players[p.id] = { score: 0, currentSelection: [], turn: i === 0 };
    });
  }

  onPlayerInput(playerId, data) {
    const p = this.state.players[playerId];
    if (!p || this.state.phase !== 'play' || !p.turn) return;
    const { action, payload } = data;
    if (action !== 'flip') return;
    const { index } = payload;
    if (index < 0 || index >= this.grid.length) return;
    const card = this.grid[index];
    if (card.revealed || card.matched) return;

    card.revealed = true;
    p.currentSelection.push(index);

    this.emit('state_update', this.getState());

    if (p.currentSelection.length === 2) {
      this.state.phase = 'reveal';
      const [i1, i2] = p.currentSelection;
      const match = this.grid[i1].type === this.grid[i2].type;
      
      setTimeout(() => {
        if (match) {
          this.grid[i1].matched = true;
          this.grid[i2].matched = true;
          p.score += 1;
          p.currentSelection = [];
          // extra turn
          this._checkEnd();
          if (this.isRunning) {
            this.state.phase = 'play';
            this.emit('state_update', this.getState());
          }
        } else {
          this.grid[i1].revealed = false;
          this.grid[i2].revealed = false;
          p.currentSelection = [];
          this._nextTurn();
        }
      }, this.REVEAL_TIME);
    }
  }

  _nextTurn() {
    const alive = this.players.filter(p => this.state.players[p.id]);
    this.state.currentPlayerIdx = (this.state.currentPlayerIdx + 1) % alive.length;
    alive.forEach((p, i) => {
      this.state.players[p.id].turn = i === this.state.currentPlayerIdx;
    });
    this.state.phase = 'play';
    this.emit('state_update', this.getState());
  }

  _checkEnd() {
    const allMatched = this.grid.every(c => c.matched);
    if (allMatched) {
      this.finish();
    }
  }

  _setupTimer() {
    this._startTime = Date.now();
    this.timer = setInterval(() => {
      if (!this.isRunning) return;
      this.state.timeLeft = Math.max(0, (this.duration - (Date.now() - this._startTime)) / 1000);
      this.emit('state_update', this.getState());
      if (this.state.timeLeft <= 0) {
        clearInterval(this.timer);
        this.finish();
      }
    }, 1000);
  }

  _calculateRanking() {
    return Object.entries(this.state.players)
      .map(([pid, p]) => ({ playerId: pid, score: p.score }))
      .sort((a, b) => b.score - a.score);
  }

  getState() {
    return {
      gridSize: this.GRID_SIZE,
      grid: this.grid.map((c, i) => ({
        type: this.state.grid[i]?.revealed ? c.type : (c.matched ? c.type : null),
        revealed: this.state.grid[i]?.revealed ?? false,
        matched: c.matched,
      })),
      players: this.state.players,
      timeLeft: this.state.timeLeft,
    };
  }
}

module.exports = FruitMemory;