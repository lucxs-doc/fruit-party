class FruitShelfScene extends Phaser.Scene {
  constructor() { super('FruitShelfScene'); }
  init(data){ this.initialState=data.state; this.playersData=data.players; this.myPlayerId=this.game.myPlayerId; }
  create(){
    const {width,height}=this.scale; this.cx=width/2; this.cy=height/2;
    this.shelfGraphics=this.add.graphics(); this.playerGraphics=this.add.graphics();
    this.playerNames={}; this.playersData.forEach(p=>this.playerNames[p.id]=p.name);
    this.playerSprites={};
    this.timeText=this.add.text(width-30,30,'',{fontSize:'28px',color:'#fff'}).setOrigin(1,0);
    this.updateState(this.initialState);
  }
  updateState(state){ if(!state)return; this.currentState=state; this.render(); }
  render(){
    const s=this.currentState; this.shelfGraphics.clear(); this.playerGraphics.clear();
    const arenaW=s.arenaW, arenaH=s.arenaH; const offsetX=this.cx-arenaW/2, offsetY=this.cy-arenaH/2;
    // shelves
    if(s.shelves){ s.shelves.forEach(sh=>{
      const y=offsetY+sh.y; const gapX=offsetX+sh.gapX;
      // left part
      this.shelfGraphics.fillStyle(0x8d6e63,1); this.shelfGraphics.fillRect(offsetX,y,gapX-offsetX,s.shelfH);
      // right part
      const rightX=gapX+sh.gapW; this.shelfGraphics.fillRect(rightX,y,offsetX+arenaW-rightX,s.shelfH);
      // highlight gap
      this.shelfGraphics.lineStyle(3,0x00e676,0.8); this.shelfGraphics.strokeRect(gapX,y,sh.gapW,s.shelfH);
    });}
    // players
    if(s.players){ Object.entries(s.players).forEach(([pid,p])=>{
      if(!p.alive) return;
      const x=offsetX+p.x, y=offsetY+p.y;
      const w=s.playerW, h=s.playerH;
      this.playerGraphics.fillStyle(0xe91e63,1); this.playerGraphics.fillRect(x-w/2,y-h/2,w,h);
      this.playerGraphics.lineStyle(2,0xfff,0.8); this.playerGraphics.strokeRect(x-w/2,y-h/2,w,h);
      if(!this.playerSprites[pid]) this.playerSprites[pid]=this.add.text(x,y-30,this.playerNames[pid]||pid.slice(0,4),{fontSize:'16px',color:'#fff'}).setOrigin(0.5);
      else this.playerSprites[pid].setPosition(x,y-30);
    });}
    this.timeText.setText(`⏱ ${Math.ceil(s.timeLeft)}s`);
    Object.keys(this.playerSprites).forEach(k=>{ if(!s.players||!s.players[k]||!s.players[k].alive){ this.playerSprites[k].destroy(); delete this.playerSprites[k]; }});
  }
  shutdown(){ Object.values(this.playerSprites).forEach(s=>s.destroy()); this.playerSprites={}; }
}
module.exports = FruitShelfScene;