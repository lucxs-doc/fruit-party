const MinigameInterface = require('./MinigameInterface');

class FruitKitchen extends MinigameInterface {
  constructor(roomId, players, io) {
    super(roomId, players, io);
    this.duration = 50000;
    this.rules = 'Duplas! Coletem frutas (ingredientes) e levem à tigela. Cada fruta entregue = pontos. Comunicação é chave!';
    this.controls = 'Joystick para mover + botão PEGAR/ENTREGAR. Dois jogadores por dupla.';

    this.ARENA_W = 800;
    this.ARENA_H = 600;
    this.PLAYER_R = 20;
    this.FRUIT_R = 15;
    this.BOWL_R = 50;
    this.FRUIT_TYPES = ['🍓','🍌','🍇','🍊','🍍','🥝'];
    this.MAX_FRUITS = 15;
    this.SPAWN_INTERVAL = 3000;

    // pairs
    this.pairs = [];
    for (let i = 0; i < players.length; i += 2) {
      if (i + 1 < players.length) {
        this.pairs.push([players[i].id, players[i+1].id]);
      } else {
        this.pairs.push([players[i].id, null]);
      }
    }

    this.state = {
      pairs: {}, // pairId -> { players: [pid1,pid2], score, fruitsHeld: {pid: type|null} }
      fruits: [], // { x, y, type, collectedBy: null }
      bowl: { x: this.ARENA_W/2, y: this.ARENA_H/2, r: this.BOWL_R },
      timeLeft: this.duration / 1000,
    };

    this.pairs.forEach((pair, i) => {
      const pid = `pair_${i}`;
      this.state.pairs[pid] = {
        players: pair,
        score: 0,
        fruitsHeld: { [pair[0]]: null, [pair[1]]: null },
      };
    });

    this._spawnFruits(5);
    this._nextSpawn = 0;
  }

  _spawnFruits(count) {
    for (let i = 0; i < count && this.state.fruits.length < this.MAX_FRUITS; i++) {
      this.state.fruits.push({
        x: Math.random() * (this.ARENA_W - 100) + 50,
        y: Math.random() * (this.ARENA_H - 100) + 50,
        type: this.FRUIT_TYPES[Math.floor(Math.random() * this.FRUIT_TYPES.length)],
        collectedBy: null,
      });
    }
  }

  onPlayerInput(playerId, data) {
    const { action, payload } = data;
    // find pair
    let foundPair = null;
    Object.entries(this.state.pairs).forEach(([pairId, pair]) => {
      if (pair.players.includes(playerId)) foundPair = { pairId, pair };
    });
    if (!foundPair) return;

    const { pairId, pair } = foundPair;
    const partnerId = pair.players.find(p => p !== playerId);
    
    if (action === 'move') {
      // simple: move player toward direction
      // we'll track player positions in pair state
      if (!pair.playerPos) pair.playerPos = {};
      if (!pair.playerPos[playerId]) pair.playerPos[playerId] = { x: 100, y: 100 };
      const pos = pair.playerPos[playerId];
      const { x, y } = payload; // -1..1
      pos.x += x * 10;
      pos.y += y * 10;
      pos.x = Math.max(this.PLAYER_R, Math.min(this.ARENA_W - this.PLAYER_R, pos.x));
      pos.y = Math.max(this.PLAYER_R, Math.min(this.ARENA_H - this.PLAYER_R, pos.y));
    } else if (action === 'interact') {
      // try pick up or deliver
      const pos = pair.playerPos?.[playerId];
      if (!pos) return;
      const held = pair.fruitsHeld[playerId];
      
      if (held) {
        // try deliver to bowl
        const dx = pos.x - this.state.bowl.x;
        const dy = pos.y - this.state.bowl.y;
        if (Math.hypot(dx, dy) < this.BOWL_R + this.PLAYER_R) {
          pair.score += 1;
          pair.fruitsHeld[playerId] = null;
        }
      } else {
        // try pick up fruit
        this.state.fruits.forEach((f, i) => {
          if (f.collectedBy) return;
          const dx = pos.x - f.x;
          const dy = pos.y - f.y;
          if (Math.hypot(dx, dy) < this.PLAYER_R + this.FRUIT_R) {
            f.collectedBy = playerId;
            pair.fruitsHeld[playerId] = f.type;
            this.state.fruits.splice(i, 1);
          }
        });
      }
    }
  }

  _updatePhysics(dt) {
    this._nextSpawn -= dt;
    if (this._nextSpawn <= 0) {
      this._spawnFruits(1);
      this._nextSpawn = this.SPAWN_INTERVAL;
    }

    // move collected fruits with player
    Object.entries(this.state.pairs).forEach(([pairId, pair]) => {
      if (!pair.playerPos) return;
      Object.entries(pair.fruitsHeld).forEach(([pid, held]) => {
        if (held && pair.playerPos[pid]) {
          // fruit follows player visually (server doesn't need to track fruit pos separately)
        }
      });
    });

    this.state.timeLeft = Math.max(0, (this.duration - (Date.now() - this._startTime)) / 1000);
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
    return Object.entries(this.state.pairs)
      .flatMap(([pairId, pair]) => 
        pair.players.filter(p => p).map(pid => ({ playerId: pid, score: pair.score }))
      )
      .sort((a, b) => b.score - a.score);
  }

  getState() {
    return {
      arenaW: this.ARENA_W,
      arenaH: this.ARENA_H,
      bowl: this.state.bowl,
      fruits: this.state.fruits,
      pairs: this.state.pairs,
      timeLeft: this.state.timeLeft,
    };
  }
}

module.exports = FruitKitchen;