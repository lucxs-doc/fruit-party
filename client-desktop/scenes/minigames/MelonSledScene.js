class MelonSledScene extends Phaser.Scene {
  constructor() { super('MelonSledScene'); }
  init(data){ this.initialState=data.state; this.playersData=data.players; this.myPlayerId=this.game.myPlayerId; }
  create(){
    const {width,height}=this.scale; this.cx=width/2; this.cy=height/2;
    this.trackGraphics=this.add.graphics(); this.sledGraphics=this.add.graphics(); this.uiGraphics=this.add.graphics();
    this.playerNames={}; this.playersData.forEach(p=>this.playerNames[p.id]=p.name);
    this.sledSprites={};
    this.timeText=this.add.text(width-30,30,'',{fontSize:'28px',color:'#fff'}).setOrigin(1,0);
    this.distanceText=this.add.text(30,30,'',{fontSize:'24px',color:'#ffeb3b'}).setOrigin(0,0);
    this.updateState(this.initialState);
  }
  updateState(state){ if(!state)return; this.currentState=state; this.render(); }
  render(){
    const s=this.currentState; this.trackGraphics.clear(); this.sledGraphics.clear(); this.uiGraphics.clear();
    // track (simple visualization)
    this.trackGraphics.lineStyle(4,0x8d6e63,1); this.trackGraphics.moveTo(0,this.cy-s.trackW/2); this.trackGraphics.lineTo(this.scale.width,this.cy-s.trackW/2); this.trackGraphics.strokePath();
    this.trackGraphics.moveTo(0,this.cy+s.trackW/2); this.trackGraphics.lineTo(this.scale.width,this.cy+s.trackW/2); this.trackGraphics.strokePath();
    // sleds
    if(s.pairs){ Object.entries(s.pairs).forEach(([pairId,pair])=>{
      if(pair.crashed) return;
      const x=this.cx+pair.x*2, y=this.cy; // scale x for visibility
      // sled body
      this.sledGraphics.fillStyle(0xff9800,1); this.sledGraphics.fillRect(x-s.sledW/2,y-s.sledH/2,s.sledW,s.sledH);
      this.sledGraphics.lineStyle(2,0xfff,0.8); this.sledGraphics.strokeRect(x-s.sledW/2,y-s.sledH/2,s.sledW,s.sledH);
      // players on sled
      pair.players.forEach((pid,i)=>{ if(!pid) return; if(!this.sledSprites[pid]) this.sledSprites[pid]=this.add.text(x+(i-0.5)*30,y-40,this.playerNames[pid]?.slice(0,1)||'🧍',{fontSize:'20px'}).setOrigin(0.5); else this.sledSprites[pid].setPosition(x+(i-0.5)*30,y-40); });
      // distance
      this.uiGraphics.fillStyle(0x0,0.7); this.uiGraphics.fillRoundedRect(x-50,y+50,100,30,15);
      if(!this.sledSprites[pairId+'_dist']) this.sledSprites[pairId+'_dist']=this.add.text(x,y+65,`${Math.floor(pair.distance)}m`,{fontSize:'18px',color:'#ffeb3b',fontStyle:'bold'}).setOrigin(0.5); else this.sledSprites[pairId+'_dist'].setPosition(x,y+65).setText(`${Math.floor(pair.distance)}m`);
      if(pair.crashed){ this.uiGraphics.fillStyle(0xff5252,0.8); this.uiGraphics.fillRect(x-60,y-80,120,40); if(!this.sledSprites[pairId+'_crash']) this.sledSprites[pairId+'_crash']=this.add.text(x,y-60,'💥 BATEU!',{fontSize:'18px',color:'#fff',fontStyle:'bold'}).setOrigin(0.5); else this.sledSprites[pairId+'_crash'].setPosition(x,y-60); }
    });}
    this.timeText.setText(`⏱ ${Math.ceil(s.timeLeft)}s`);
    this.distanceText.setText(`Distância: ${Math.max(...Object.values(s.pairs).map(p=>p.distance))}m`);
    Object.keys(this.sledSprites).forEach(k=>{ const pid=k.replace('_dist','').replace('_crash',''); if(!s.pairs||!s.pairs[pid]){ this.sledSprites[k].destroy(); delete this.sledSprites[k]; }});
  }
  shutdown(){ Object.values(this.sledSprites).forEach(s=>s.destroy()); this.sledSprites={}; }
}
if (typeof module !== 'undefined') module.exports = MelonSledScene;