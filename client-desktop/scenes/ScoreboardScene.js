class ScoreboardScene extends Phaser.Scene {
  constructor() {
    super('ScoreboardScene');
  }

  init(data) {
    this.ranking = data.ranking;
    this.round = data.round;
    this.accumulated = data.accumulated || [];
    this.isFinal = data.isFinal;
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

    const title = this.isFinal ? '🏆 RESULTADO FINAL' : `RODADA ${this.round} - RESULTADO`;
    this.add.text(width/2, 80, title, {
      fontSize: '48px', fontFamily: 'Arial Black', color: '#ffeb3b',
      stroke: '#e91e63', strokeThickness: 4,
    }).setOrigin(0.5);

    // Round ranking
    this.add.text(width/2, 160, 'CLASSIFICAÇÃO DA RODADA', {
      fontSize: '28px', fontFamily: 'Arial', color: '#fff'
    }).setOrigin(0.5);

    this.ranking.forEach((entry, i) => {
      const y = 210 + i * 50;
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}º`;
      const name = entry.name || entry.playerId.slice(0,4);
      const points = entry.points ?? entry.score ?? 0;
      
      this.add.text(width/2 - 200, y, `${medal} ${name}`, {
        fontSize: '24px', fontFamily: 'Arial', color: '#fff'
      }).setOrigin(0, 0.5);
      this.add.text(width/2 + 200, y, `${points} pts`, {
        fontSize: '24px', fontFamily: 'Arial', color: '#ffeb3b'
      }).setOrigin(1, 0.5);
    });

    // Accumulated scoreboard
    if (this.accumulated.length) {
      this.add.text(width/2, 210 + this.ranking.length * 50 + 30, 'PLACAR ACUMULADO', {
        fontSize: '28px', fontFamily: 'Arial', color: '#ffeb3b'
      }).setOrigin(0.5);

      this.accumulated.forEach((entry, i) => {
        const y = 210 + this.ranking.length * 50 + 80 + i * 40;
        const medal = i === 0 ? '👑' : `${i+1}º`;
        const name = entry.name || entry.playerId.slice(0,4);
        const total = entry.total ?? 0;
        
        this.add.text(width/2 - 200, y, `${medal} ${name}`, {
          fontSize: '22px', fontFamily: 'Arial', color: '#fff'
        }).setOrigin(0, 0.5);
        this.add.text(width/2 + 200, y, `${total} pts`, {
          fontSize: '22px', fontFamily: 'Arial', color: '#ffeb3b'
        }).setOrigin(1, 0.5);
      });
    }

    if (!this.isFinal) {
      this.add.text(width/2, height - 80, 'Próxima rodada em breve...', {
        fontSize: '24px', fontFamily: 'Arial', color: '#888'
      }).setOrigin(0.5);
    }
  }
}

if (typeof module !== 'undefined') module.exports = ScoreboardScene;