class FruitKitchenScene extends Phaser.Scene {
  constructor() { super('FruitKitchenScene'); }
  init(data){ this.initialState=data.state; this.playersData=data.players; this.myPlayerId=this.game.myPlayerId; }
  create(){
    const {width,height}=this.scale; this.cx=width/2; this.cy=height/2;
    this.arenaGraphics=this.add.graphics(); this.playerGraphics=this.add.graphics(); this.fruitGraphics=this.add.graphics(); this.uiGraphics=this.add.graphics();
    this.playerNames={}; this.playersData.forEach(p=>this.playerNames[p.id]=p.name);
    this.playerSprites={}; this.fruitSprites={};
    this.timeText=this.add.text(width-30,30,'',{fontSize:'28px',color:'#fff'}).setOrigin(1,0);
    this.updateState(this.initialState);
  }
  updateState(state){ if(!state)return; this.currentState=state; this.render(); }
  render(){
    const s=this.currentState; this.arenaGraphics.clear(); this.playerGraphics.clear(); this.fruitGraphics.clear(); this.uiGraphics.clear();
    const arenaW=s.arenaW, arenaH=s.arenaH; const offsetX=this.cx-arenaW/2, offsetY=this.cy-arenaH/2;
    // arena border
    this.arenaGraphics.lineStyle(4,0xffeb3b,1); this.arenaGraphics.strokeRect(offsetX,offsetY,arenaW,arenaH);
    // bowl
    this.arenaGraphics.fillStyle(0xff9800,1); this.arenaGraphics.fillCircle(offsetX+s.bowl.x,offsetY+s.bowl.y,s.bowl.r);
    this.arenaGraphics.lineStyle(3,0xffb300,1); this.arenaGraphics.strokeCircle(offsetX+s.bowl.x,offsetY+s.bowl.y,s.bowl.r);
    // fruits on ground
    if(s.fruits){ s.fruits.forEach((f,i)=>{
      const x=offsetX+f.x, y=offsetY+f.y;
      this.fruitGraphics.fillStyle(0x0,0.3); this.fruitGraphics.fillCircle(x,y,20);
      if(!this.fruitSprites[i]) this.fruitSprites[i]=this.add.text(x,y,f.type,{fontSize:'28px'}).setOrigin(0.5); else this.fruitSprites[i].setPosition(x,y).setText(f.type);
    });}
    // pairs
    if(s.pairs){ Object.entries(s.pairs).forEach(([pairId,pair])=>{
      if(!pair.playerPos) return;
      Object.entries(pair.playerPos).forEach(([pid,pos])=>{
        const x=offsetX+pos.x, y=offsetY+pos.y;
        const held=pair.fruitsHeld[pid];
        this.playerGraphics.fillStyle(0xe91e63,1); this.playerGraphics.fillCircle(x,y,25);
        this.playerGraphics.lineStyle(2,0xfff,0.8); this.playerGraphics.strokeCircle(x,y,25);
        if(held){ this.playerGraphics.fillStyle(0x0,0.3); this.playerGraphics.fillCircle(x,y-35,15); if(!this.playerSprites[pid+'_fruit']) this.playerSprites[pid+'_fruit']=this.add.text(x,y-35,held,{fontSize:'24px'}).setOrigin(0.5); else this.playerSprites[pid+'_fruit'].setPosition(x,y-35).setText(held); }
        if(!this.playerSprites[pid]) this.playerSprites[pid]=this.add.text(x,y-55,this.playerNames[pid]||pid.slice(0,4),{fontSize:'16px',color:'#fff'}).setOrigin(0.5); else this.playerSprites[pid].setPosition(x,y-55);
      });
      // score
      this.uiGraphics.fillStyle(0x0,0.7); this.uiGraphics.fillRoundedRect(this.cx-100,30,200,40,10);
      if(!this.playerSprites[pairId+'_score']) this.playerSprites[pairId+'_score']=this.add.text(this.cx,50,`Dupla ${pairId}: ${pair.score} pts`,{fontSize:'22px',color:'#ffeb3b',fontStyle:'bold'}).setOrigin(0.5); else this.playerSprites[pairId+'_score'].setText(`Dupla ${pairId}: ${pair.score} pts`);
    });}
    this.timeText.setText(`⏱ ${Math.ceil(s.timeLeft)}s`);
    Object.keys(this.fruitSprites).forEach(k=>{ const idx=parseInt(k); if(!s.fruits||!s.fruits[idx]){ this.fruitSprites[k].destroy(); delete this.fruitSprites[k]; }});
  }
  shutdown(){ Object.values(this.playerSprites).forEach(s=>s.destroy()); Object.values(this.fruitSprites).forEach(s=>s.destroy()); this.playerSprites={}; this.fruitSprites={}; }
}
module.exports = FruitKitchenScene;