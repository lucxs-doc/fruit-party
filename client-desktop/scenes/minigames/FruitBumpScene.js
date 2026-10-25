class FruitBumpScene extends Phaser.Scene {
  constructor() {
    super('FruitBumpScene');
  }

  init(data) {
    this.initialState = data.state;
    this.playersData = data.players;
    this.myPlayerId = this.game.myPlayerId;
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // Arena graphics
    this.arenaGraphics = this.add.graphics();
    this.fruitGraphics = this.add.graphics();
    this.uiGraphics = this.add.graphics();

    // Arena boundary
    this.arenaRadius = this.initialState.arenaRadius;

    // Player name map
    this.playerNames = {};
    this.playersData.forEach(p => { this.playerNames[p.id] = p.name; });

    // Fruit sprites container
    this.fruitSprites = {};

    // Time text
    this.timeText = this.add.text(width - 30, 30, '', {
      fontSize: '28px', fontFamily: 'Arial', color: '#fff'
    }).setOrigin(1, 0);

    // Eliminated text
    this.eliminatedText = this.add.text(30, 30, '', {
      fontSize: '24px', fontFamily: 'Arial', color: '#ff5252'
    }).setOrigin(0, 0);

    // Apply initial state
    this.updateState(this.initialState);
  }

  updateState(state) {
    if (!state) return;
    this.currentState = state;
    this.arenaRadius = state.arenaRadius;
    this.render();
  }

  render() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    const s = this.currentState;

    // Clear graphics
    this.arenaGraphics.clear();
    this.fruitGraphics.clear();
    this.uiGraphics.clear();

    // Draw arena
    this.arenaGraphics.lineStyle(6, 0xffeb3b, 1);
    this.arenaGraphics.strokeCircle(cx, cy, this.arenaRadius);
    // Inner warning zone
    this.arenaGraphics.lineStyle(2, 0xff5252, 0.5);
    this.arenaGraphics.strokeCircle(cx, cy, this.arenaRadius - 20);

    // Draw fruits
    if (s.fruits) {
      Object.entries(s.fruits).forEach(([pid, f]) => {
        if (!f.alive) return;
        const x = cx + f.x;
        const y = cy + f.y;
        const r = f.radius;

        // Fruit body
        const colors = { '🍉': 0x4caf50, '🍊': 0xff9800, '🍇': 0x9c27b0, '🍎': 0xf44336, '🍐': 0x8bc34a, '🍑': 0xff7043, '🥭': 0xffb300, '🍍': 0xffc107 };
        const color = colors[f.type] || 0xffeb3b;
        
        this.fruitGraphics.fillStyle(color, 1);
        this.fruitGraphics.fillCircle(x, y, r);
        this.fruitGraphics.lineStyle(3, 0xfff, 0.8);
        this.fruitGraphics.strokeCircle(x, y, r);

        // Fruit emoji as text
        if (!this.fruitSprites[pid]) {
          this.fruitSprites[pid] = this.add.text(x, y, f.type, { fontSize: `${r * 1.2}px` }).setOrigin(0.5);
        } else {
          this.fruitSprites[pid].setPosition(x, y);
        }

        // Player name
        const name = this.playerNames[pid] || pid.slice(0,4);
        this.fruitGraphics.fillStyle(0x000, 0.7);
        const tw = name.length * 10 + 10;
        this.fruitGraphics.fillRoundedRect(x - tw/2, y - r - 30, tw, 24, 12);
        this.fruitGraphics.fillStyle(0xfff, 1);
        // Use a separate text for name
        if (!this.fruitSprites[`${pid}_name`]) {
          this.fruitSprites[`${pid}_name`] = this.add.text(x, y - r - 18, name, { fontSize: '16px', fontFamily: 'Arial', color: '#fff' }).setOrigin(0.5);
        } else {
          this.fruitSprites[`${pid}_name`].setPosition(x, y - r - 18);
        }

        // Boost indicator
        if (f.boostReady) {
          this.uiGraphics.fillStyle(0x00e676, 1);
          this.uiGraphics.fillCircle(x + r - 10, y - r + 10, 10);
        } else {
          this.uiGraphics.fillStyle(0xff5252, 0.5);
          this.uiGraphics.fillCircle(x + r - 10, y - r + 10, 10);
          // cooldown arc
          const pct = 1 - f.boostCooldown / 1500;
          this.uiGraphics.lineStyle(4, 0x00e676, 1);
          this.uiGraphics.arc(x + r - 10, y - r + 10, 14, -Math.PI/2, -Math.PI/2 + Math.PI*2*pct, false);
          this.uiGraphics.strokePath();
        }
      });
    }

    // Remove sprites for dead fruits
    Object.keys(this.fruitSprites).forEach(key => {
      const pid = key.replace('_name', '');
      if (!s.fruits || !s.fruits[pid] || !s.fruits[pid].alive) {
        this.fruitSprites[key].destroy();
        delete this.fruitSprites[key];
      }
    });

    // Time
    this.timeText.setText(`⏱ ${Math.ceil(s.timeLeft)}s`);

    // Eliminated
    if (s.eliminated && s.eliminated.length) {
      const names = s.eliminated.map(pid => this.playerNames[pid] || pid.slice(0,4)).join(', ');
      this.eliminatedText.setText(`💀 Eliminados: ${names}`);
    }
  }

  update() {
    // render loop handled by state updates
  }

  shutdown() {
    // cleanup sprites
    Object.values(this.fruitSprites).forEach(s => s.destroy());
    this.fruitSprites = {};
  }
}

if (typeof module !== 'undefined') module.exports = FruitBumpScene;