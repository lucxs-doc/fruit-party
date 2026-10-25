class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.finalRanking = data.finalRanking;
    this.winner = data.winner;
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

    // Winner celebration
    const winnerEntry = this.finalRanking.find(p => p.playerId === this.winner);
    const winnerName = winnerEntry ? (winnerEntry.name || this.winner.slice(0,4)) : 'Jogador';

    this.add.text(width/2, 100, '🎉 FIM DE JOGO 🎉', {
      fontSize: '64px', fontFamily: 'Arial Black', color: '#ffeb3b',
      stroke: '#e91e63', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(width/2, 180, `VENCEDOR: ${winnerName}`, {
      fontSize: '48px', fontFamily: 'Arial Black', color: '#00e676',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Final ranking
    this.add.text(width/2, 280, 'RANKING FINAL', {
      fontSize: '32px', fontFamily: 'Arial', color: '#fff'
    }).setOrigin(0.5);

    this.finalRanking.forEach((entry, i) => {
      const y = 340 + i * 50;
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}º`;
      const name = entry.name || entry.playerId.slice(0,4);
      const total = entry.total ?? 0;
      const firsts = entry.firstPlaces ?? 0;
      
      this.add.text(width/2 - 250, y, `${medal} ${name}`, {
        fontSize: '26px', fontFamily: 'Arial', color: i === 0 ? '#ffeb3b' : '#fff'
      }).setOrigin(0, 0.5);
      this.add.text(width/2 + 50, y, `Total: ${total} pts`, {
        fontSize: '24px', fontFamily: 'Arial', color: '#ffeb3b'
      }).setOrigin(0, 0.5);
      this.add.text(width/2 + 250, y, `${firsts} vitórias`, {
        fontSize: '22px', fontFamily: 'Arial', color: '#888'
      }).setOrigin(1, 0.5);
    });

    // Restart hint
    this.add.text(width/2, height - 80, 'Recarregue a página para nova partida', {
      fontSize: '20px', fontFamily: 'Arial', color: '#888'
    }).setOrigin(0.5);
  }
}

if (typeof module !== 'undefined') module.exports = GameOverScene;