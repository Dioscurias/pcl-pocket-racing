import {DEFAULT_TRACK,trackById,nearestTrack,pointAtDistance,surfaceAt,insideFloor,hazardPosition} from './tracks.js';
import {CARS,normalizeCar} from './car-catalog.js';
export const KART_RADIUS = .56;
export const PLAYER_COLORS = [0x1677ff,0xffbf3f,0xff5a4d,0x18c7b5,0xa970ff,0xfff0c7,0x83d63f,0xf04fa3];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),finite=(v,f=0)=>Number.isFinite(v)?v:f,angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
const emptyInput=()=>({throttle:0,steer:0,drift:false,boost:false,item:false,reset:false});
const course=w=>trackById(w.trackId||w.settings?.trackId||DEFAULT_TRACK);
export const ITEMS=Object.freeze(['sprint','shield','books','ink','cart']);
export function createWorld(options={}){
 const o=options.settings||options,mode=o.mode==='time-trial'?'time-trial':'race';
 const trackId=trackById(o.trackId).id;
 return{phase:'lobby',time:0,countdown:0,trackId,players:[],effects:[],effectSerial:0,hazards:[],projectiles:[],itemSerial:0,settings:{mode,trackId,laps:mode==='time-trial'?1:clamp(Math.floor(finite(o.laps,3)),1,9),bots:mode==='time-trial'?0:clamp(Math.floor(finite(o.bots,3)),0,7)},winner:null,round:0,raceStart:0,finishDeadline:null,remaining:null,_inputs:{}};
}
function emit(w,type,p){w.effects.push({id:++w.effectSerial,type,x:p.x,y:p.y,z:p.z,time:w.time,playerId:p.id,tier:p.tier||0,item:p.item||null});if(w.effects.length>70)w.effects.shift();}
function spawn(w,p,index=w.players.indexOf(p)){
 const track=course(w),origin=pointAtDistance(track,-3-Math.floor(index/2)*4),side=index%2?1.8:-1.8;
 Object.assign(p,{x:origin.x+Math.cos(origin.heading)*side,z:origin.z+Math.sin(origin.heading)*side,y:0,vx:0,vz:0,vy:0,heading:origin.heading,speed:0,energy:100,drift:0,driftTier:0,turboUntil:0,item:null,shieldUntil:0,stunnedUntil:0,lap:0,nextCheckpoint:1,lastCheckpoint:0,position:index+1,bestLap:null,lapTimes:[],lapStartedAt:w.time,finishedAt:null,finishTime:null,checkpointTimes:[],grounded:true,penalty:0,hazardHits:0,_lapPenalty:0,_wasDrifting:false,_resetHeld:false,_lastBoost:-5,_lastPickup:-5,_lastDynamic:-5,_itemHeld:false,_driftHeld:false,_stuck:0});
 p.y=surfaceAt(track,p.x,p.z);p.input=emptyInput();w._inputs[p.id]=p.input;
}
export function addPlayer(w,id,name,{bot=false,car,color}={}){
 const existing=w.players.find(p=>p.id===id);if(existing)return existing;
 if(w.players.length>=8)return null;
 const p={id:String(id).slice(0,100),name:String(name||'Racer').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,20)||'Racer',color:PLAYER_COLORS.includes(Number(color))?Number(color):(PLAYER_COLORS.find(value=>!w.players.some(p=>p.color===value))??PLAYER_COLORS[w.players.length%PLAYER_COLORS.length]),bot:!!bot,car:normalizeCar(car??(bot?CARS[w.players.length%CARS.length].id:undefined))};
 w.players.push(p);spawn(w,p);return p;
}
export function removePlayer(w,id){w.players=w.players.filter(p=>p.id!==id);delete w._inputs[id];rank(w);}
export function setInput(w,id,input={}){if(!input||typeof input!=='object'||Array.isArray(input))input={};const p=w.players.find(p=>p.id===id);if(!p)return;p.input={throttle:clamp(finite(input.throttle),-1,1),steer:clamp(finite(input.steer),-1,1),drift:input.drift===true,boost:input.boost===true,item:input.item===true,reset:input.reset===true};w._inputs[id]=p.input;}
export function startMatch(w){
 if(w.phase==='playing'||w.phase==='countdown')return;
 if(w.settings.mode==='time-trial')w.players=w.players.filter(p=>!p.bot);
 else {const names=['Stacks','Index','Dewey','Folio','Atlas','Quill','Spine'];while(w.players.filter(p=>p.bot).length<w.settings.bots&&w.players.length<8){const i=w.players.filter(p=>p.bot).length;addPlayer(w,`bot-${i}`,names[i],{bot:true});}}
 w.round++;w.phase='countdown';w.countdown=3;w.winner=null;w.effects=[];w.finishDeadline=null;w.remaining=null;
 for(const p of w.players)spawn(w,p);
}
export function resetMatch(w){w.phase='lobby';w.countdown=0;w.winner=null;w.finishDeadline=null;w.remaining=null;w.effects=[];for(const p of w.players)spawn(w,p);}
function resetKart(w,p){const track=course(w),gate=track.checkpoints[p.lastCheckpoint];p.x=gate.x+Math.sin(gate.heading)*2;p.z=gate.z-Math.cos(gate.heading)*2;p.y=surfaceAt(track,p.x,p.z);p.heading=gate.heading;p.vx=p.vz=p.vy=p.speed=0;p.grounded=true;p.drift=0;p.penalty+=2;p._lapPenalty+=2;p._stuck=0;emit(w,'reset',p);}
function distanceToSegment(x,z,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(x-a.x-dx*t,z-a.z-dz*t);}
function onShortcut(track,p){return track.shortcuts.some(s=>s.points.some((point,i)=>i&&distanceToSegment(p.x,p.z,s.points[i-1],point)<s.width/2));}
function wallContacts(w,p){
 for(const box of course(w).obstacles){
  if(p.y>(box.height||10))continue;
  const cx=clamp(p.x,box.x-box.w/2,box.x+box.w/2),cz=clamp(p.z,box.z-box.d/2,box.z+box.d/2),dx=p.x-cx,dz=p.z-cz,d=Math.hypot(dx,dz);
  if(d>=KART_RADIUS)continue;
  let nx,nz,depth;
  if(d>.0001){nx=dx/d;nz=dz/d;depth=KART_RADIUS-d;}
  else{const sides=[{d:Math.abs(p.x-(box.x-box.w/2)),x:-1,z:0},{d:Math.abs(p.x-(box.x+box.w/2)),x:1,z:0},{d:Math.abs(p.z-(box.z-box.d/2)),x:0,z:-1},{d:Math.abs(p.z-(box.z+box.d/2)),x:0,z:1}].sort((a,b)=>a.d-b.d);nx=sides[0].x;nz=sides[0].z;depth=sides[0].d+KART_RADIUS;}
  p.x+=nx*(depth+.01);p.z+=nz*(depth+.01);const inward=p.vx*nx+p.vz*nz;if(inward<0){p.vx-=nx*inward*1.25;p.vz-=nz*inward*1.25;if(w.time-(p._lastImpact||0)>.35&&Math.abs(inward)>4){emit(w,'bump',p);p._lastImpact=w.time;}}
 }
}
function gateProgress(w,p,oldX,oldZ){
 if(p.finishedAt!==null)return;
 const track=course(w),gate=track.checkpoints[p.nextCheckpoint],fx=Math.sin(gate.heading),fz=-Math.cos(gate.heading),before=(oldX-gate.x)*fx+(oldZ-gate.z)*fz,after=(p.x-gate.x)*fx+(p.z-gate.z)*fz;
 if(before>0||after<0||after-before<.001)return;
 const t=-before/(after-before),x=oldX+(p.x-oldX)*t,z=oldZ+(p.z-oldZ)*t,lateral=Math.abs((x-gate.x)*Math.cos(gate.heading)+(z-gate.z)*Math.sin(gate.heading));
 if(lateral>track.trackWidth*.85||p.vx*fx+p.vz*fz<1)return;
 p.checkpointTimes.push({checkpoint:p.nextCheckpoint,lap:p.lap,time:w.time});if(p.checkpointTimes.length>80)p.checkpointTimes.shift();p.lastCheckpoint=p.nextCheckpoint;
 if(p.nextCheckpoint===0){
  const duration=w.time-p.lapStartedAt+p._lapPenalty;p.lapTimes.push(duration);p.bestLap=p.bestLap===null?duration:Math.min(p.bestLap,duration);p.lap++;p.lapStartedAt=w.time;p._lapPenalty=0;emit(w,'lap',p);
  if(p.lap>=w.settings.laps){p.finishedAt=w.time;p.finishTime=w.time-w.raceStart+p.penalty;p.turboUntil=0;emit(w,'finish',p);if(!w.winner){w.winner=p.id;w.finishDeadline=w.time+30;}}
 }
 p.nextCheckpoint=(p.nextCheckpoint+1)%track.checkpoints.length;
}
function rank(w){
 const track=course(w),progress=p=>{const near=nearestTrack(track,p.x,p.z),count=track.checkpoints.length,start=((p.nextCheckpoint+count-1)%count)/count*track.length,end=(p.nextCheckpoint||count)/count*track.length,s=p.nextCheckpoint===1&&near.s>track.length*.85?0:near.s;return p.lap*track.length+clamp(s,start,end);};
 const ranked=[...w.players].sort((a,b)=>{if(a.finishedAt!==null&&b.finishedAt!==null)return (a.finishTime??a.finishedAt)-(b.finishTime??b.finishedAt);if(a.finishedAt!==null)return-1;if(b.finishedAt!==null)return 1;return progress(b)-progress(a);});ranked.forEach((p,i)=>p.position=i+1);
}
export function botInput(w,p){
 if(p.finishedAt!==null)return emptyInput();
 const track=course(w),near=nearestTrack(track,p.x,p.z),look=clamp(7+p.speed*.27,7,15),target=pointAtDistance(track,near.s+look),desired=Math.atan2(target.x-p.x,p.z-target.z),error=angle(desired-p.heading),future=pointAtDistance(track,near.s+25),bend=Math.abs(angle(future.heading-near.heading));
 const desiredSpeed=bend>.9?15:bend>.5?20:28,throttle=p.speed>desiredSpeed?-.25:Math.abs(error)>1.2?.25:1;
 return{throttle,steer:clamp(error*1.65,-1,1),drift:Math.abs(error)>.22&&Math.abs(error)<.55&&p.speed>16&&near.distance<3,boost:bend<.22&&Math.abs(error)<.12&&p.energy>30,reset:false};
}
function driftTier(charge){return charge>=90?3:charge>=60?2:charge>=30?1:0;}
function disrupt(w,p,type){
 if(p.shieldUntil>w.time){p.shieldUntil=w.time;emit(w,'shield-break',p);return false;}
 p.stunnedUntil=Math.max(p.stunnedUntil,w.time+(type==='ink'?1.1:1.45));p.vx*=.35;p.vz*=.35;emit(w,type==='ink'?'ink-hit':'item-hit',p);return true;
}
export function grantItem(w,p){
 if(!p||p.item)return p?.item||null;
 const pool=p.position>Math.ceil(w.players.length/2)?['sprint','sprint','shield','cart','ink']:['books','ink','shield','cart','sprint'];
 p.item=pool[(w.itemSerial++ + p.lap + p.position)%pool.length];emit(w,'item',p);return p.item;
}
export function useItem(w,p){
 const item=p?.item;if(!item)return false;p.item=null;
 if(item==='sprint')p.turboUntil=Math.max(p.turboUntil,w.time+2.2);
 else if(item==='shield')p.shieldUntil=w.time+6;
 else if(item==='books'||item==='ink'){const back=2.3;w.hazards.push({id:`hazard-${++w.itemSerial}`,type:item,x:p.x-Math.sin(p.heading)*back,z:p.z+Math.cos(p.heading)*back,owner:p.id,expires:w.time+18});}
 else if(item==='cart'){w.projectiles.push({id:`cart-${++w.itemSerial}`,type:'cart',x:p.x+Math.sin(p.heading)*2,z:p.z-Math.cos(p.heading)*2,vx:Math.sin(p.heading)*24,vz:-Math.cos(p.heading)*24,owner:p.id,expires:w.time+8});}
 emit(w,'item-use',{...p,item});return true;
}
function updateItems(w,dt){
 w.hazards=w.hazards.filter(h=>h.expires>w.time);
 w.projectiles=w.projectiles.filter(q=>q.expires>w.time);
 for(const q of w.projectiles){const candidates=w.players.filter(p=>p.id!==q.owner&&p.finishedAt===null),target=candidates.sort((a,b)=>Math.hypot(a.x-q.x,a.z-q.z)-Math.hypot(b.x-q.x,b.z-q.z))[0];if(target){const dx=target.x-q.x,dz=target.z-q.z,d=Math.max(.001,Math.hypot(dx,dz));q.vx+=(dx/d*28-q.vx)*Math.min(1,dt*1.8);q.vz+=(dz/d*28-q.vz)*Math.min(1,dt*1.8);}q.x+=q.vx*dt;q.z+=q.vz*dt;}
 for(const p of w.players){
  if(p.finishedAt!==null)continue;
  for(const box of course(w).itemBoxes)if(!p.item&&w.time-p._lastPickup>2&&Math.hypot(p.x-box.x,p.z-box.z)<2.5){p._lastPickup=w.time;grantItem(w,p);break;}
  for(let i=w.hazards.length-1;i>=0;i--){const h=w.hazards[i];if(h.owner!==p.id&&Math.hypot(p.x-h.x,p.z-h.z)<1.55){disrupt(w,p,h.type);w.hazards.splice(i,1);}}
  for(let i=w.projectiles.length-1;i>=0;i--){const q=w.projectiles[i];if(q.owner!==p.id&&Math.hypot(p.x-q.x,p.z-q.z)<1.7){disrupt(w,p,'cart');w.projectiles.splice(i,1);}}
 }
}
function move(w,p,dt){
 if(p.bot)setInput(w,p.id,botInput(w,p));const input=p.input||emptyInput();p.steerVisual=input.steer;
 if(input.reset&&!p._resetHeld)resetKart(w,p);p._resetHeld=input.reset;if(input.item&&!p._itemHeld)useItem(w,p);p._itemHeld=input.item;
 const finished=p.finishedAt!==null,fx=Math.sin(p.heading),fz=-Math.cos(p.heading),rx=Math.cos(p.heading),rz=Math.sin(p.heading);
 let forward=p.vx*fx+p.vz*fz,side=p.vx*rx+p.vz*rz;
 const drifting=!finished&&input.drift&&Math.abs(input.steer)>.15&&Math.abs(forward)>8&&p.grounded;
 if(drifting){p.drift=clamp(p.drift+(38+Math.abs(input.steer)*20)*dt,0,100);p.driftTier=driftTier(p.drift);}
 if(p._wasDrifting&&!input.drift){const tier=driftTier(p.drift);if(tier){p.turboUntil=Math.max(p.turboUntil,w.time+[0,.85,1.3,1.8][tier]);emit(w,'drift-boost',{...p,tier});}p.drift=0;p.driftTier=0;}
 if(!input.drift&&!p._wasDrifting){p.drift=0;p.driftTier=0;}p._wasDrifting=drifting;
 const stunned=p.stunnedUntil>w.time;if(stunned){input.throttle=0;input.steer*=.25;}
 const boosting=!finished&&!stunned&&input.boost&&p.energy>0&&input.throttle>0&&p.grounded;
 p.boosting=boosting;p.energy=clamp(p.energy+(boosting?-35:8)*dt,0,100);
 const turbo=p.turboUntil>w.time;
 if(finished)forward*=Math.exp(-2*dt);
 else if(input.throttle<0){forward-=47*Math.abs(input.throttle)*dt;forward=Math.max(-9,forward);}
 else forward+=input.throttle*(boosting||turbo?43:30)*dt;
 forward*=Math.exp(-(Math.abs(input.throttle)>.01?.35:1.6)*dt);
 const track=course(w),near=nearestTrack(track,p.x,p.z),carpet=near.distance>track.trackWidth/2&&!onShortcut(track,p),cap=(boosting||turbo?42:32)*(carpet?.65:1);
 forward=clamp(forward,-9,cap);side*=Math.exp(-(drifting?3.8:13)*dt);
 const turnRate=2.55*clamp(Math.abs(forward)/10,0,1)*(drifting?1.12:1)*(forward<0?-1:1)*(p.grounded?1:.35);
 if(!finished)p.heading=angle(p.heading+input.steer*turnRate*dt);
 // Preserve world momentum during steering, then dissipate lateral slip on the next frame.
 p.vx=fx*forward+rx*side;p.vz=fz*forward+rz*side;
 const ox=p.x,oz=p.z,oldSurface=surfaceAt(track,p.x,p.z);p.x+=p.vx*dt;p.z+=p.vz*dt;
 const surface=surfaceAt(track,p.x,p.z);
 if(p.grounded){
  if(oldSurface>1&&surface<oldSurface-.5&&forward>10){p.grounded=false;p.vy=6+Math.min(5,forward*.13);emit(w,'jump',p);}
  else if(surface-p.y<1){p.y=surface;}
  else{p.x=ox;p.z=oz;p.vx*=.1;p.vz*=.1;}
 }
 if(!p.grounded){p.vy-=27*dt;p.y+=p.vy*dt;if(p.y<=surface){p.y=surface;p.vy=0;p.grounded=true;emit(w,'land',p);}}
 wallContacts(w,p);
 for(const hazard of track.dynamicObstacles||[]){const position=hazardPosition(hazard,w.time),dx=p.x-position.x,dz=p.z-position.z,d=Math.hypot(dx,dz),limit=KART_RADIUS+hazard.radius;if(d>=limit||w.time-p._lastDynamic<.75)continue;const nx=d>.001?dx/d:1,nz=d>.001?dz/d:0;p.x=position.x+nx*(limit+.05);p.z=position.z+nz*(limit+.05);p.vx=nx*Math.max(4,p.speed*.38);p.vz=nz*Math.max(4,p.speed*.38);p.hazardHits++;p._lastDynamic=w.time;emit(w,'bump',p);}
 if(!insideFloor(track,p.x,p.z)||p.y< -5||!Number.isFinite(p.x+p.z+p.y))resetKart(w,p);
 p.speed=Math.hypot(p.vx,p.vz);
 for(const pad of track.boostPads){const dx=p.x-pad.x,dz=p.z-pad.z,f=dx*Math.sin(pad.heading)-dz*Math.cos(pad.heading),r=dx*Math.cos(pad.heading)+dz*Math.sin(pad.heading);if(Math.abs(f)<pad.length/2&&Math.abs(r)<pad.width/2&&p.grounded&&w.time-p._lastBoost>2){p.turboUntil=w.time+1.5;p._lastBoost=w.time;emit(w,'boost',p);}}
 gateProgress(w,p,ox,oz);
 if(p.bot){p._stuck=p.speed<2?p._stuck+dt:0;if(p._stuck>3)resetKart(w,p);}
}
function advance(w,dt){
 w.time+=dt;w.effects=w.effects.filter(e=>w.time-e.time<2);
 if(w.phase==='countdown'){w.countdown=Math.max(0,w.countdown-dt);if(w.countdown<1e-6){w.phase='playing';w.raceStart=w.time;for(const p of w.players)p.lapStartedAt=w.time;}return;}
 if(w.phase!=='playing')return;
 for(const p of w.players)move(w,p,dt);
 for(let i=0;i<w.players.length;i++)for(let j=i+1;j<w.players.length;j++){
  const a=w.players[i],b=w.players[j];if(Math.abs(a.y-b.y)>1.8)continue;const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),over=KART_RADIUS*2-d;if(over<=0)continue;const nx=d>.001?dx/d:1,nz=d>.001?dz/d:0;
  a.x-=nx*over*.51;a.z-=nz*over*.51;b.x+=nx*over*.51;b.z+=nz*over*.51;const closing=(b.vx-a.vx)*nx+(b.vz-a.vz)*nz;if(closing<0){a.vx+=nx*closing*.6;a.vz+=nz*closing*.6;b.vx-=nx*closing*.6;b.vz-=nz*closing*.6;}
 }
 updateItems(w,dt);rank(w);if(w.finishDeadline!==null){w.remaining=Math.max(0,w.finishDeadline-w.time);if(w.remaining===0||w.players.every(p=>p.finishedAt!==null)){w.phase='finished';w.countdown=0;w.winner=[...w.players].filter(p=>p.finishedAt!==null).sort((a,b)=>a.finishTime-b.finishTime)[0]?.id||null;}}
}
export function stepWorld(w,dt){dt=clamp(finite(dt),0,.1);while(dt>1e-8){const h=Math.min(dt,1/120);advance(w,h);dt-=h;}}
export function snapshot(w){const{_inputs,...visible}=w;return JSON.parse(JSON.stringify({...visible,players:w.players.map(p=>Object.fromEntries(Object.entries(p).filter(([key])=>!key.startsWith('_')&&key!=='input')))}));}
