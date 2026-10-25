class TraceRaceScene extends Phaser.Scene {
  constructor() { super('TraceRaceScene'); }
  init(data){ this.initialState=data.state; this.playersData=data.players; this.myPlayerId=this.game.myPlayerId; }
  create(){
    const {width,height}=this.scale; this.cx=width/2; this.cy=height/2;
    this.trackGraphics=this.add.graphics(); this.playerGraphics=this.add.graphics(); this.uiGraphics=this.add.graphics();
    this.playerNames={}; this.playersData.forEach(p=>this.playerNames[p.id]=p.name);
    this.playerSprites={};
    this.timeText=this.add.text(width-30,30,'',{fontSize:'28px',color:'#fff'}).setOrigin(1,0);
    this.updateState(this.initialState);
  }
  updateState(state){ if(!state)return; this.currentState=state; this.render(); }
  render(){
    const s=this.currentState; this.trackGraphics.clear(); this.playerGraphics.clear(); this.uiGraphics.clear();
    // draw track path
    if(s.track && s.track.length>1){
      this.trackGraphics.lineStyle(s.trackWidth*2,0x5d4037,0.3); this.trackGraphics.beginPath();
      s.track.forEach((pt,i)=>{ const x=this.cx+pt.x/20, y=this.cy-pt.y/2; if(i===0) this.trackGraphics.moveTo(x,y); else this.trackGraphics.lineTo(x,y); });
      this.trackGraphics.strokePath();
      // center line
      this.trackGraphics.lineStyle(2,0xffeb3b,0.8); this.trackGraphics.beginPath();
      s.track.forEach((pt,i)=>{ const x=this.cx+pt.x/20, y=this.cy-pt.y/2; if(i===0) this.trackGraphics.moveTo(x,y); else this.trackGraphics.lineTo(x,y); });
      this.trackGraphics.strokePath();
    }
    // players
    if(s.players){ Object.entries(s.players).forEach(([pid,p])=>{
      if(!p.alive && !p.finished) return;
      const trackIdx=Math.floor((p.progress/s.track[s.track.length-1]?.x||1)*(s.track.length-1));
      const pt=s.track[trackIdx]||{x:0,y:0};
      const x=this.cx+pt.x/20 + p.deviation/20, y=this.cy-pt.y/2;
      const color=p.finished?0x4caf50:p.alive?0x2196f3:0xff5252;
      this.playerGraphics.fillStyle(color,1); this.playerGraphics.fillCircle(x,y,15);
      this.playerGraphics.lineStyle(2,0xfff,0.8); this.playerGraphics.strokeCircle(x,y,15);
      if(!this.playerSprites[pid]) this.playerSprites[pid]=this.add.text(x,y-30,this.playerNames[pid]||pid.slice(0,4),{fontSize:'16px',color}).setOrigin(0.5); else this.playerSprites[pid].setPosition(x,y-30).setColor(color);
      if(p.finished && !this.playerSprites[pid+'_done']){ this.playerSprites[pid+'_done']=this.add.text(x,y+30,'🏁',{fontSize:'24px'}).setOrigin(0.5); }
    });}
    this.timeText.setText(`⏱ ${Math.ceil(s.timeLeft)}s`);
    Object.keys(this.playerSprites).forEach(k=>{ if(!s.players||(!s.players[k]?.alive && !s.players[k]?.finished)){ this.playerSprites[k].destroy(); delete this.playerSprites[k]; }});
  }
  shutdown(){ Object.values(this.playerSprites).forEach(s=>s.destroy()); this.playerSprites={}; }
}
module.exports = TraceRaceScene;