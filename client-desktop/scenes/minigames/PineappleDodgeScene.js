class PineappleDodgeScene extends Phaser.Scene {
  constructor() { super('PineappleDodgeScene'); }
  init(data){ this.initialState=data.state; this.playersData=data.players; this.myPlayerId=this.game.myPlayerId; }
  create(){
    const {width,height}=this.scale; this.cx=width/2; this.cy=height/2+100;
    this.groundY=this.cy+150;
    this.playerGraphics=this.add.graphics(); this.obstacleGraphics=this.add.graphics();
    this.playerNames={}; this.playersData.forEach(p=>this.playerNames[p.id]=p.name);
    this.playerSprites={};
    this.timeText=this.add.text(width-30,30,'',{fontSize:'28px',color:'#fff'}).setOrigin(1,0);
    this.updateState(this.initialState);
  }
  updateState(state){ if(!state)return; this.currentState=state; this.render(); }
  render(){
    const s=this.currentState; this.playerGraphics.clear(); this.obstacleGraphics.clear();
    // ground
    this.playerGraphics.lineStyle(4,0x4caf50,1); this.playerGraphics.moveTo(0,this.groundY); this.playerGraphics.lineTo(this.scale.width,this.groundY); this.playerGraphics.strokePath();
    // players
    if(s.players){ Object.entries(s.players).forEach(([pid,p])=>{
      if(!p.alive) return;
      const x=this.cx+p.x, y=this.groundY-p.y;
      const w=p.width, h=p.height;
      this.playerGraphics.fillStyle(0x2196f3,1); this.playerGraphics.fillRect(x-w/2,y-h,w,h);
      this.playerGraphics.lineStyle(2,0xfff,0.8); this.playerGraphics.strokeRect(x-w/2,y-h,w,h);
      if(!this.playerSprites[pid]) this.playerSprites[pid]=this.add.text(x,y-h/2,this.playerNames[pid]?.slice(0,1)||'🏃',{fontSize:'24px'}).setOrigin(0.5);
      else this.playerSprites[pid].setPosition(x,y-h/2);
    });}
    // obstacles
    if(s.obstacles){ s.obstacles.forEach(o=>{
      const x=this.cx+o.x, y=this.groundY-o.y;
      this.obstacleGraphics.fillStyle(0xff5722,1); this.obstacleGraphics.fillRect(x-o.width/2,y-o.height,o.width,o.height);
      this.obstacleGraphics.lineStyle(2,0xfff,0.5); this.obstacleGraphics.strokeRect(x-o.width/2,y-o.height,o.width,o.height);
      // pineapple emoji
      this.obstacleGraphics.fillStyle(0x0,0.3); this.obstacleGraphics.fillCircle(x,y-o.height/2,15);
    });}
    this.timeText.setText(`⏱ ${Math.ceil(s.timeLeft)}s`);
    Object.keys(this.playerSprites).forEach(k=>{ if(!s.players||!s.players[k]||!s.players[k].alive){ this.playerSprites[k].destroy(); delete this.playerSprites[k]; }});
  }
  shutdown(){ Object.values(this.playerSprites).forEach(s=>s.destroy()); this.playerSprites={}; }
}
if (typeof module !== 'undefined') module.exports = PineappleDodgeScene;