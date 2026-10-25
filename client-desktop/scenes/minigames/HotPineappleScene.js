class HotPineappleScene extends Phaser.Scene {
  constructor() { super('HotPineappleScene'); }
  init(data){ this.initialState=data.state; this.playersData=data.players; this.myPlayerId=this.game.myPlayerId; }
  create(){
    const {width,height}=this.scale; this.cx=width/2; this.cy=height/2;
    this.pineappleGraphics=this.add.graphics(); this.playerGraphics=this.add.graphics(); this.uiGraphics=this.add.graphics();
    this.playerNames={}; this.playersData.forEach(p=>this.playerNames[p.id]=p.name);
    this.playerSprites={};
    this.timeText=this.add.text(width-30,30,'',{fontSize:'28px',color:'#fff'}).setOrigin(1,0);
    this.statusText=this.add.text(this.cx,100,'',{fontSize:'28px',color:'#ffeb3b'}).setOrigin(0.5);
    this.updateState(this.initialState);
  }
  updateState(state){ if(!state)return; this.currentState=state; this.render(); }
  render(){
    const s=this.currentState; this.pineappleGraphics.clear(); this.playerGraphics.clear(); this.uiGraphics.clear();
    // pineapple in center if someone has it
    if(s.currentHolder && s.phase==='playing'){
      const holder=s.players[s.currentHolder];
      if(holder){
        this.pineappleGraphics.fillStyle(0xffb300,1); this.pineappleGraphics.fillCircle(this.cx,this.cy,60);
        this.pineappleGraphics.fillStyle(0x8bc34a,1); this.pineappleGraphics.fillRect(this.cx-5,this.cy-60-30,10,30);
        this.pineappleGraphics.lineStyle(3,0xff8f00,1); this.pineappleGraphics.strokeCircle(this.cx,this.cy,60);
        // timer ring
        const pct=1-(Date.now()-s.explosionTime+ (s.explosionTime-Date.now()))/ (s.explosionTime-Date.now()) || 0;
        this.pineappleGraphics.lineStyle(6,0xff5252,1); this.pineappleGraphics.arc(this.cx,this.cy,70,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-pct),false); this.pineappleGraphics.strokePath();
      }
    }
    // players in circle
    const alivePlayers=Object.entries(s.players).filter(([_,p])=>p.alive);
    alivePlayers.forEach(([pid,p],i)=>{
      const angle=(i/alivePlayers.length)*Math.PI*2 - Math.PI/2;
      const r=250; const x=this.cx+Math.cos(angle)*r, y=this.cy+Math.sin(angle)*r;
      const hasPineapple=p.hasPineapple;
      this.playerGraphics.fillStyle(hasPineapple?0xff5252:0x4caf50,1); this.playerGraphics.fillCircle(x,y,40);
      this.playerGraphics.lineStyle(3,0xfff,0.8); this.playerGraphics.strokeCircle(x,y,40);
      if(!this.playerSprites[pid]) this.playerSprites[pid]=this.add.text(x,y-60,this.playerNames[pid]||pid.slice(0,4),{fontSize:'18px',color:'#fff'}).setOrigin(0.5); else this.playerSprites[pid].setPosition(x,y-60);
      // score
      this.uiGraphics.fillStyle(0x0,0.5); this.uiGraphics.fillRoundedRect(x-40,y+50,80,25,10);
      if(!this.playerSprites[pid+'_score']) this.playerSprites[pid+'_score']=this.add.text(x,y+62,`${p.score} pts`,{fontSize:'16px',color:'#ffeb3b'}).setOrigin(0.5); else this.playerSprites[pid+'_score'].setPosition(x,y+62).setText(`${p.score} pts`);
    });
    // phase text
    if(s.phase==='exploded') this.statusText.setText(`💥 ${this.playerNames[s.loser]||s.loser.slice(0,4)} EXPLODIU! -3 pts`);
    else if(s.phase==='playing') this.statusText.setText(`🍍 Abacaxi com: ${this.playerNames[s.currentHolder]||s.currentHolder.slice(0,4)}`);
    this.timeText.setText(`⏱ ${Math.ceil(s.timeLeft)}s`);
    Object.keys(this.playerSprites).forEach(k=>{ if(!s.players||!s.players[k]){ this.playerSprites[k].destroy(); delete this.playerSprites[k]; }});
  }
  shutdown(){ Object.values(this.playerSprites).forEach(s=>s.destroy()); this.playerSprites={}; }
}
module.exports = HotPineappleScene;