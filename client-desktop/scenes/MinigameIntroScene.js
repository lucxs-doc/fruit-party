class MinigameIntroScene extends Phaser.Scene {
  constructor() {
    super('MinigameIntroScene');
  }

  init(data) {
    this.data = data;
  }

  create() {
    const { width, height } = this.scale;
    const { name, rules, controls, duration, round, totalRounds } = this.data;

    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

    // Round indicator
    this.add.text(width/2, 80, `RODADA ${round} / ${totalRounds}`, {
      fontSize: '32px', fontFamily: 'Arial', color: '#ffeb3b'
    }).setOrigin(0.5);

    // Minigame name
    this.add.text(width/2, 160, name.replace(/([A-Z])/g, ' $1').trim(), {
      fontSize: '56px', fontFamily: 'Arial Black', color: '#fff',
      stroke: '#e91e63', strokeThickness: 4,
    }).setOrigin(0.5);

    // Rules
    this.add.text(width/2, 280, rules, {
      fontSize: '28px', fontFamily: 'Arial', color: '#fff', wordWrap: { width: 1000 }, align: 'center'
    }).setOrigin(0.5);

    // Controls
    this.add.text(width/2, 420, `📱 Controles: ${controls}`, {
      fontSize: '24px', fontFamily: 'Arial', color: '#ffeb3b', wordWrap: { width: 1000 }, align: 'center'
    }).setOrigin(0.5);

    // Timer
    this.timerText = this.add.text(width/2, 540, `Iniciando em ${duration/1000}s...`, {
      fontSize: '32px', fontFamily: 'Arial', color: '#ff5252'
    }).setOrigin(0.5);

    let count = duration / 1000;
    this.time.addEvent({
      delay: 1000,
      repeat: count - 1,
      callback: () => {
        count--;
        this.timerText.setText(`Iniciando em ${count}s...`);
      }
    });
  }
}

module.exports = MinigameIntroScene;