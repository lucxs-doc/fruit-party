class FruitEscapeScene extends Phaser.Scene {
  constructor() { super('FruitEscapeScene'); }
  init(data) { this.initialState = data.state; this.playersData = data.players; this.myPlayerId = this.game.myPlayerId; }
  create() {
    const { width, height } = this.scale;
    this.cx = width/2; this.cy = height/2;
    this.platformGraphics = this.add.graphics();
    this.playerGraphics = this.add.graphics();
    this.playerNames = {}; this.playersData.forEach(p=>this.playerNames[p.id]=p.name);
    this.playerSprites = {};
    this.timeText = this.add.text(width-30,30,'',{fontSize:'28px',color:'#fff'}).setOrigin(1,0);
    this.updateState(this.initialState);
  }
  updateState(state){ if(!state)return; this.currentState=state; this.render(); }
  render(){
    const s=this.currentState; this.platformGraphics.clear(); this.playerGraphics.clear();
    // platforms
    if(s.platforms){ s.platforms.forEach(p=>{
      if(!p.alive) return;
      const x=this.cx+p.x, y=this.cy-p.y;
      this.platformGraphics.fillStyle(p.sinking?0xff5252:0x4caf50, p.sinking?0.7:1);
      this.platformGraphics.fillCircle(x,y,p.radius);
      this.platformGraphics.lineStyle(3,0xfff,0.8); this.platformGraphics.strokeCircle(x,y,p.radius);
      if(p.sinking){ this.platformGraphics.fillStyle(0xffeb3b,0.5); this.platformGraphics.fillCircle(x,y,p.radius*0.5); }
    });}
    // players
    if(s.players){ Object.entries(s.players).forEach(([pid,p])=>{
      if(!p.alive) return;
      const x=this.cx+p.x, y=this.cy-p.y;
      if(!this.playerSprites[pid]) this.playerSprites[pid]=this.add.text(x,y,this.playerNames[pid]?.slice(0,1)||'🍓',{fontSize:'28px'}).setOrigin(0.5);
      else this.playerSprites[pid].setPosition(x,y);
      this.playerGraphics.fillStyle(0x000,0.7); const n=this.playerNames[pid]||pid.slice(0,4); const tw=n.length*10+10;
      this.playerGraphics.fillRoundedRect(x-tw/2,y-35,tw,24,12);
      if(!this.playerSprites[pid+'_name']) this.playerSprites[pid+'_name']=this.add.text(x,y-23,n,{fontSize:'14px',color:'#fff'}).setOrigin(0.5);
      else this.playerSprites[pid+'_name'].setPosition(x,y-23);
    });}
    this.timeText.setText(`⏱ ${Math.ceil(s.timeLeft)}s`);
    Object.keys(this.playerSprites).forEach(k=>{ const pid=k.replace('_name',''); if(!s.players||!s.players[pid]||!s.players[pid].alive){ this.playerSprites[k].destroy(); delete this.playerSprites[k]; }});
  }
  shutdown(){ Object.values(this.playerSprites).forEach(s=>s.destroy()); this.playerSprites={}; }
}
module.exports = FruitEscapeScene;