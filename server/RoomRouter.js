const { EventEmitter } = require('events');

class RoundRouter extends EventEmitter {
  constructor(io, roomMgr, scoreMgr, minigameClasses) {
    super();
    this.io = io;
    this.roomMgr = roomMgr;
    this.scoreMgr = scoreMgr;
    this.minigameClasses = minigameClasses; // array of classes
    this.currentRoom = null;
    this.currentMinigame = null;
    this.phase = 'LOBBY';
    this.roundNumber = 0;
    this.totalRounds = 5;
    this.availableMinigames = [...minigameClasses]; // shuffle per game
  }

  async startGame(roomCode) {
    this.currentRoom = roomCode;
    this.roundNumber = 0;
    this.phase = 'LOBBY';
    this.currentMinigame = null;
    this.availableMinigames = this._shuffle([...this.minigameClasses]);

    this.scoreMgr.initRoom(roomCode);
    this.emitToRoom('room_created', { code: roomCode });

    await this._waitForPlayers(2);
    this._nextRound();
  }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async _waitForPlayers(minPlayers) {
    return new Promise(resolve => {
      const check = () => {
        if (this.roomMgr.getPlayers(this.currentRoom).length >= minPlayers) resolve();
        else setTimeout(check, 500);
      };
      check();
    });
  }

  _nextRound() {
    if (this.roundNumber >= this.totalRounds) {
      this._endGame();
      return;
    }

    this.roundNumber++;
    this.phase = 'MINIGAME_INTRO';

    const MinigameClass = this.availableMinigames[(this.roundNumber - 1) % this.availableMinigames.length];
    const players = this.roomMgr.getPlayers(this.currentRoom);
    this.currentMinigame = new MinigameClass(this.currentRoom, players, this.io);

    // listen to minigame events
    this.currentMinigame.on('state_update', (state) => {
      this.emitToRoom('game_state_update', { roomCode: this.currentRoom, state });
    });
    this.currentMinigame.on('finished', (ranking) => {
      this._onMinigameFinished(ranking);
    });

    // send intro
    this.emitToRoom('minigame_intro', {
      round: this.roundNumber,
      totalRounds: this.totalRounds,
      name: this.currentMinigame.constructor.name,
      rules: this.currentMinigame.rules,
      controls: this.currentMinigame.controls,
      duration: this.currentMinigame.duration,
    });

    // after a short delay, start the minigame
    setTimeout(() => {
      this.phase = 'MINIGAME_RUNNING';
      this.currentMinigame.start();
      this.emitToRoom('minigame_start', { state: this.currentMinigame.getState() });
    }, 3000);
  }

  _onMinigameFinished(ranking) {
    this.phase = 'MINIGAME_RESULT';
    this.scoreMgr.updateScore(this.currentRoom, ranking);

    this.emitToRoom('minigame_result', { ranking, round: this.roundNumber });
    this.emitToRoom('score_update', { ranking: this.scoreMgr.getAccumulated(this.currentRoom) });

    // show scoreboard for a few seconds then next round
    setTimeout(() => {
      this.phase = 'SCOREBOARD';
      setTimeout(() => this._nextRound(), 4000);
    }, 2000);
  }

  _endGame() {
    this.phase = 'GAME_OVER';
    const finalRanking = this.scoreMgr.getFinalRanking(this.currentRoom);
    const winner = this.scoreMgr.getWinner(this.currentRoom);
    this.emitToRoom('game_over', { finalRanking, winner });
  }

  handlePlayerInput(roomCode, playerId, data) {
    if (!this.currentMinigame || this.phase !== 'MINIGAME_RUNNING') return;
    this.currentMinigame.onPlayerInput(playerId, data);
  }

  emitToRoom(event, payload) {
    const roomSocketIds = this.roomMgr.getSocketIds(this.currentRoom);
    roomSocketIds.forEach(id => this.io.to(id).emit(event, payload));
  }
}

module.exports = RoundRouter;