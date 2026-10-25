class FruitMemoryScene extends Phaser.Scene {
  constructor() { super('FruitMemoryScene'); }
  init(data){ this.initialState=data.state; this.playersData=data.players; this.myPlayerId=this.game.myPlayerId; }
  create(){
    const {width,height}=this.scale; this.cx=width/2; this.cy=height/2;
    this.cardGraphics=this.add.graphics(); this.uiGraphics=this.add.graphics();
    this.playerNames={}; this.playersData.forEach(p=>this.playerNames[p.id]=p.name);
    this.cardSprites={};
    this.timeText=this.add.text(width-30,30,'',{fontSize:'28px',color:'#fff'}).setOrigin(1,0);
    this.turnText=this.add.text(this.cx,50,'',{fontSize:'24px',color:'#ffeb3b'}).setOrigin(0.5);
    this.updateState(this.initialState);
  }
  updateState(state){ if(!state)return; this.currentState=state; this.render(); }
  render(){
    const s=this.currentState; this.cardGraphics.clear(); this.uiGraphics.clear();
    const gridSize=s.gridSize; const cardW=120, cardH=120, gap=10;
    const startX=this.cx-(gridSize*(cardW+gap)-gap)/2; const startY=this.cy-(gridSize*(cardH+gap)-gap)/2;
    if(s.grid){ s.grid.forEach((card,i)=>{
      const col=i%gridSize, row=Math.floor(i/gridSize);
      const x=startX+col*(cardW+gap)+cardW/2; const y=startY+row*(cardH+gap)+cardH/2;
      if(card.matched){
        this.cardGraphics.fillStyle(0x4caf50,1); this.cardGraphics.fillRoundedRect(x-cardW/2,y-cardH/2,cardW,cardH,10);
        this.cardGraphics.fillStyle(0x0,0.3); this.cardGraphics.fillCircle(x,y,40);
      }else if(card.revealed){
        this.cardGraphics.fillStyle(0xffeb3b,1); this.cardGraphics.fillRoundedRect(x-cardW/2,y-cardH/2,cardW,cardH,10);
        if(!this.cardSprites[i]) this.cardSprites[i]=this.add.text(x,y,card.type,{fontSize:'56px'}).setOrigin(0.5); else this.cardSprites[i].setPosition(x,y).setText(card.type);
      }else{
        this.cardGraphics.fillStyle(0x795548,1); this.cardGraphics.fillRoundedRect(x-cardW/2,y-cardH/2,cardW,cardH,10);
        this.cardGraphics.lineStyle(3,0x5d4037,1); this.cardGraphics.strokeRoundedRect(x-cardW/2,y-cardH/2,cardW,cardH,10);
        if(this.cardSprites[i]){ this.cardSprites[i].destroy(); delete this.cardSprites[i]; }
      }
    });}
    // players scores
    if(s.players){ let y=30; Object.entries(s.players).forEach(([pid,p])=>{
      const color=p.turn?'#ffeb3b':'#fff';
      this.uiGraphics.fillStyle(p.turn?0xffeb3b:0x0, p.turn?0.3:0.5); this.uiGraphics.fillRoundedRect(20,y-5,250,30,8);
      if(!this.playerSprites['score_'+pid]) this.playerSprites['score_'+pid]=this.add.text(30,y,`${this.playerNames[pid]||pid.slice(0,4)}: ${p.score} pares ${p.turn?'👉':''}`,{fontSize:'18px',color}).setOrigin(0,0.5); else this.playerSprites['score_'+pid].setPosition(30,y).setText(`${this.playerNames[pid]||pid.slice(0,4)}: ${p.score} pares ${p.turn?'👉':''}`).setColor(color);
      y+=35;
    });}
    this.timeText.setText(`⏱ ${Math.ceil(s.timeLeft)}s`);
  }
  shutdown(){ Object.values(this.cardSprites).forEach(s=>s.destroy()); this.cardSprites={}; }
}
module.exports = FruitMemoryScene;