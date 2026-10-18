export class GameAudio{
 constructor(){this.enabled=true;this.ctx=null;this.last=0;}
 start(){if(!this.ctx){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;this.ctx=new Audio();this.engine=this.ctx.createOscillator();this.engine.type='triangle';this.gain=this.ctx.createGain();this.gain.gain.value=0;this.engine.connect(this.gain).connect(this.ctx.destination);this.engine.start();}this.ctx.resume().catch(()=>{});}
 setEnabled(value){this.enabled=value;if(!value&&this.gain)this.gain.gain.value=0;}
 update(speed,active){if(!this.ctx||!this.gain)return;const t=this.ctx.currentTime;this.engine.frequency.setTargetAtTime(35+Math.min(30,speed)*5,t,.1);this.gain.gain.setTargetAtTime(this.enabled&&active?.014+Math.min(speed,20)*.0005:0,t,.1);}
 effect(type){if(!this.enabled||!this.ctx||!['shot','hit','sink','dash','item'].includes(type))return;const c=this.ctx,t=c.currentTime,osc=c.createOscillator(),g=c.createGain();osc.type=type==='shot'?'triangle':'sine';osc.frequency.setValueAtTime(type==='shot'?180:type==='item'?520:type==='hit'?110:70,t);osc.frequency.exponentialRampToValueAtTime(22,t+.16);g.gain.setValueAtTime(type==='sink'?.09:.04,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);osc.connect(g).connect(c.destination);osc.start(t);osc.stop(t+.23);}
}
