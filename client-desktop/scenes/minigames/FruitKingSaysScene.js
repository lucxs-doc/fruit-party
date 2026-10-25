class FruitKingSaysScene extends Phaser.Scene {
  constructor() { super('FruitKingSaysScene'); }
  init(data){ this.initialState=data.state; this.playersData=data.players; this.myPlayerId=this.game.myPlayerId; }
  create(){
    const {width,height}=this.scale; this.cx=width/2; this.cy=height/2;
    this.kingGraphics=this.add.graphics(); this.uiGraphics=this.add.graphics();
    this.playerNames={}; this.playersData.forEach(p=>this.playerNames[p.id]=p.name);
    this.playerSprites={};
    this.timeText=this.add.text(width-30,30,'',{fontSize:'28px',color:'#fff'}).setOrigin(1,0);
    this.phaseText=this.add.text(this.cx,100,'',{fontSize:'32px',color:'#ffeb3b',fontStyle:'bold'}).setOrigin(0.5);
    this.sequenceText=this.add.text(this.cx,200,'',{fontSize:'64px',color:'#fff'}).setOrigin(0.5);
    this.updateState(this.initialState);
  }
  updateState(state){ if(!state)return; this.currentState=state; this.render(); }
  render(){
    const s=this.currentState; this.kingGraphics.clear(); this.uiGraphics.clear();
    // King pineapple
    this.kingGraphics.fillStyle(0xffb300,1); this.kingGraphics.fillCircle(this.cx,this.cy-150,80);
    this.kingGraphics.lineStyle(4,0xff8f00,1); this.kingGraphics.strokeCircle(this.cx,this.cy-150,80);
    // crown
    this.kingGraphics.fillStyle(0xffd700,1); this.kingGraphics.beginPath(); this.kingGraphics.moveTo(this.cx-60,this.cx-150-60); this.kingGraphics.lineTo(this.cx,this.cx-150-120); this.kingGraphics.lineTo(this.cx+60,this.cx-150-60); this.kingGraphics.closePath(); this.kingGraphics.fillPath();
    // phase text
    if(s.step===0) this.phaseText.setText('👑 REI MOSTRA A SEQUÊNCIA');
    else if(s.step===1) this.phaseText.setText('📱 SUA VEZ! REPITA');
    else this.phaseText.setText('⏳ AGUARDANDO RESULTADO');
    // sequence display
    if(s.sequence && s.sequence.length){
      const fruits=['🍍','🍉','🍊','🍇'];
      const display=s.sequence.map((idx,i)=>`<span style="color:${i<s.players?.[this.myPlayerId]?.currentInput?.length? '#00e676':'#fff'}">${fruits[idx]}</span>`).join('  ');
      this.sequenceText.setText(display);
    }
    // players status
    let y=350; if(s.players){ Object.entries(s.players).forEach(([pid,p])=>{
      if(!p.alive){ this.uiGraphics.fillStyle(0xff5252,0.5); this.uiGraphics.fillRect(this.cx-150,y-15,300,30); }
      this.uiGraphics.fillStyle(p.alive?0x4caf50:0xff5252,0.8); this.uiGraphics.fillCircle(this.cx-180,y,10);
      if(!this.playerSprites[pid]) this.playerSprites[pid]=this.add.text(this.cx-150,y,`${this.playerNames[pid]||pid.slice(0,4)}: ${p.score} pts`,{fontSize:'18px',color:p.alive?'#fff':'#ff5252'}).setOrigin(0,0.5); else this.playerSprites[pid].setPosition(this.cx-150,y).setText(`${this.playerNames[pid]||pid.slice(0,4)}: ${p.score} pts`).setColor(p.alive?'#fff':'#ff5252');
      y+=35;
    });}
    this.timeText.setText(`⏱ ${Math.ceil(s.timeLeft)}s`);
  }
  shutdown(){ Object.values(this.playerSprites).forEach(s=>s.destroy()); this.playerSprites={}; }
}
if (typeof module !== 'undefined') module.exports = FruitKingSaysScene;