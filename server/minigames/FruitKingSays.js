const MinigameInterface = require('./MinigameInterface');

class FruitKingSays extends MinigameInterface {
  constructor(roomId, players, io) {
    super(roomId, players, io);
    this.duration = 60000;
    this.rules = 'O Rei Abacaxi mostra uma sequência de frutas. Repita sem errar! Quem errar sai da rodada.';
    this.controls = 'Botões 1-4 correspondentes às frutas mostradas';

    this.FRUITS = ['🍍', '🍉', '🍊', '🍇', '🍎', '🍐', '🥭', '🍑'];
    this.SEQUENCE_LEN_START = 3;
    this.SEQUENCE_MAX = 12;
    this.SHOW_TIME = 800;
    this.INPUT_TIME = 3000;

    this.state = {
      sequence: [],
      step: 0, // 0=showing, 1=player input, 2=round end
      currentPlayerIdx: 0,
      players: {}, // pid -> { alive, currentInput: [], score }
      timeLeft: this.duration / 1000,
      showTimer: 0,
      inputTimer: 0,
    };

    this.players.forEach(p => {
      this.state.players[p.id] = { alive: true, currentInput: [], score: 0 };
    });
  }

  start() {
    super.start();
    this._nextRoundSequence();
  }

  _nextRoundSequence() {
    const aliveCount = Object.values(this.state.players).filter(p => p.alive).length;
    if (aliveCount <= 1) {
      this.finish();
      return;
    }
    // increase sequence length gradually
    const len = Math.min(this.SEQUENCE_LEN_START + Math.floor(this.state.players[Object.keys(this.state.players)[0]]?.score / 2), this.SEQUENCE_MAX);
    this.state.sequence = [];
    for (let i = 0; i < len; i++) {
      this.state.sequence.push(Math.floor(Math.random() * 4)); // 0-3
    }
    this.state.step = 0; // showing
    this.state.currentPlayerIdx = 0;
    this.state.showTimer = this.SHOW_TIME * this.state.sequence.length;
    this._showSequence();
  }

  _showSequence() {
    // send sequence to clients via state_update
    this.emit('state_update', { ...this.getState(), phase: 'show', sequence: this.state.sequence });
    
    setTimeout(() => {
      this.state.step = 1; // player input
      this.state.inputTimer = this.INPUT_TIME;
      this.emit('state_update', { ...this.getState(), phase: 'input' });
      this._inputCountdown();
    }, this.SHOW_TIME * this.state.sequence.length);
  }

  _inputCountdown() {
    const interval = setInterval(() => {
      this.state.inputTimer -= 100;
      if (this.state.inputTimer <= 0) {
        clearInterval(interval);
        this._checkInputs();
      }
    }, 100);
  }

  _checkInputs() {
    const alivePlayers = Object.entries(this.state.players).filter(([_, p]) => p.alive);
    let anyWrong = false;
    alivePlayers.forEach(([pid, p]) => {
      const input = p.currentInput;
      let correct = true;
      for (let i = 0; i < input.length; i++) {
        if (input[i] !== this.state.sequence[i]) { correct = false; break; }
      }
      if (!correct || input.length < this.state.sequence.length) {
        p.alive = false;
        anyWrong = true;
      } else {
        p.score += 1;
      }
      p.currentInput = [];
    });

    if (anyWrong) {
      this.emit('state_update', { ...this.getState(), phase: 'result', eliminated: alivePlayers.filter(([_,p])=>!p.alive).map(([pid])=>pid) });
      setTimeout(() => this._nextRoundSequence(), 2000);
    } else {
      // all correct, next round with longer sequence
      setTimeout(() => this._nextRoundSequence(), 1000);
    }
  }

  onPlayerInput(playerId, data) {
    if (this.state.step !== 1) return;
    const p = this.state.players[playerId];
    if (!p || !p.alive) return;
    const { action, payload } = data;
    if (action !== 'press') return;
    const { btn } = payload; // 0-3
    if (p.currentInput.length < this.state.sequence.length) {
      p.currentInput.push(btn);
    }
  }

  _setupTimer() {
    this._startTime = Date.now();
    this.timer = setInterval(() => {
      if (!this.isRunning) return;
      this.state.timeLeft = Math.max(0, (this.duration - (Date.now() - this._startTime)) / 1000);
      this.emit('state_update', this.getState());

      const alive = Object.values(this.state.players).filter(p => p.alive).length;
      if (alive <= 1 || this.state.timeLeft <= 0) {
        clearInterval(this.timer);
        this.finish();
      }
    }, 100);
  }

  _calculateRanking() {
    const entries = Object.entries(this.state.players)
      .map(([pid, p]) => ({ playerId: pid, score: p.score * 100 + (p.alive ? 1000 : 0) }))
      .sort((a, b) => b.score - a.score);
    return entries;
  }

  getState() {
    return {
      fruits: this.FRUITS.slice(0,4),
      sequence: this.state.sequence,
      step: this.state.step,
      players: this.state.players,
      timeLeft: this.state.timeLeft,
    };
  }
}

module.exports = FruitKingSays;