class LobbyScene extends Phaser.Scene {
  constructor() {
    super('LobbyScene');
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);
    
    // Title
    this.add.text(width/2, 100, 'FRUIT PARTY 🍓🍌🍉', {
      fontSize: '64px',
      fontFamily: 'Arial Black',
      color: '#fff',
      stroke: '#e91e63',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Room code
    this.codeText = this.add.text(width/2, 200, 'Criando sala...', {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#ffeb3b',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // QR placeholder
    this.qrText = this.add.text(width/2, 320, '', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#fff',
    }).setOrigin(0.5);

    // Player list
    this.playerListText = this.add.text(width/2, 420, 'Aguardando jogadores...', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#fff',
    }).setOrigin(0.5);

    // Instructions
    this.add.text(width/2, height - 80, 'Compartilhe o código acima para os celulares entrarem', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#888',
    }).setOrigin(0.5);

    // Listen for room code
    this.game.socket.on('room_created', ({ code }) => {
      this.codeText.setText(`CÓDIGO: ${code}`);
      this.qrText.setText(`Acesse no celular: ${window.location.origin}/mobile?code=${code}`);
    });
  }

  updatePlayerList(players) {
    const names = players.map(p => p.name).join(', ');
    this.playerListText.setText(`Jogadores (${players.length}): ${names}`);
  }
}

module.exports = LobbyScene;