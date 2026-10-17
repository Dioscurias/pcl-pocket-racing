export class HudFeed{
 constructor(){this.entries=[];this.sequence=0;}
 push(message,now,key){
  this.read(now);const existing=this.entries.find(entry=>(key!==undefined&&entry.key===key)||entry.message===message);
  if(existing){existing.message=message;existing.time=now;existing.key=key??existing.key;}
  else this.entries.push({id:++this.sequence,message,key,time:now});
  this.entries=this.entries.slice(-4);
 }
 read(now){this.entries=this.entries.filter(entry=>now-entry.time<4500);return this.entries.map(entry=>({...entry,opacity:Math.min(1,(4500-now+entry.time)/1000)}));}
 clear(){this.entries=[];}
}

// Speed/topSpeed are km/h, distance is meters, heading is radians clockwise from north.
export function createSpeedsterHUD(element,{drawRadar,now=()=>performance.now()}={}){
 const get=name=>element.querySelector(`[data-hud-${name}]`),feed=new HudFeed(),eventNodes=new Map();
 const refs=Object.fromEntries(['health','health-row','health-fill','health-meter','energy','energy-row','energy-fill','energy-meter','speed','top-speed','distance','distance-unit','bolts','events','hint','radar'].map(name=>[name,get(name)]));
 let previous=null,reportedPeak=0,recordTime=-Infinity,hintUntil=0;
 const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
 const percent=value=>Math.min(100,Math.max(0,finite(value,100)));
 function tick(){
  const time=now(),entries=feed.read(time),ids=new Set(entries.map(entry=>entry.id));
  for(const [id,node] of eventNodes)if(!ids.has(id)){node.remove();eventNodes.delete(id);}
  for(const entry of entries){let node=eventNodes.get(entry.id);if(!node){node=document.createElement('li');eventNodes.set(entry.id,node);refs.events.append(node);}if(node.textContent!==entry.message)node.textContent=entry.message;node.style.opacity=String(entry.opacity);}
  refs.hint.hidden=time>=hintUntil;refs.hint.style.opacity=String(Math.min(1,Math.max(0,(hintUntil-time)/800)));
 }
 const timer=setInterval(tick,100);
 return {
  element,
  update(values){
   const time=now(),state={status:'running',health:100,energy:100,speed:0,topSpeed:0,distance:0,bolts:0,heading:0,boosting:false,...previous,...values};
   state.health=percent(state.health);state.energy=percent(state.energy);state.speed=Math.max(0,finite(state.speed));state.topSpeed=Math.max(0,finite(state.topSpeed));state.distance=Math.max(0,finite(state.distance));state.bolts=Math.max(0,Math.floor(finite(state.bolts)));state.heading=finite(state.heading);
   if(state.status==='running'&&(!previous||previous.status==='ready'))hintUntil=time+3800;
   if(previous&&state.bolts>previous.bolts)feed.push(`Bolt collected +${state.bolts-previous.bolts}`,time,'bolts');
   if(previous&&state.topSpeed<previous.topSpeed)reportedPeak=0;
   if(state.status==='running'&&state.topSpeed>=50&&state.topSpeed>reportedPeak+1&&time-recordTime>=1200){feed.push(`New top speed · ${Math.round(state.topSpeed)} KM/H`,time,'speed');reportedPeak=state.topSpeed;recordTime=time;}
   for(const name of ['health','energy']){
    refs[name].textContent=String(Math.round(state[name]));refs[`${name}-fill`].style.width=`${state[name]}%`;refs[`${name}-meter`].setAttribute('aria-valuenow',String(Math.round(state[name])));
   }
   refs['health-row'].classList.toggle('is-low',state.health<25);refs['energy-row'].classList.toggle('is-full',state.energy>=100);
   element.classList.toggle('is-boosting',!!state.boosting);element.classList.toggle('is-fast',state.speed>=300);
   element.style.setProperty('--hud-speed-scale',String(state.speed<300?1:1.02+Math.min(.06,(state.speed-300)/600*.06)));
   element.style.setProperty('--hud-radar-angle',`${-state.heading}rad`);
   refs.speed.textContent=String(Math.round(state.speed));refs['top-speed'].textContent=String(Math.round(state.topSpeed));
   refs.distance.textContent=state.distance>=1000?(state.distance/1000).toFixed(1):String(Math.floor(state.distance));refs['distance-unit'].textContent=state.distance>=1000?'km':'m';refs.bolts.textContent=String(state.bolts);
   element.hidden=state.status==='ready';drawRadar?.(refs.radar,state);previous=state;tick();
  },
  event(message,key){feed.push(String(message),now(),key);tick();},
  reset(){previous=null;reportedPeak=0;recordTime=-Infinity;hintUntil=0;feed.clear();tick();},
  destroy(){clearInterval(timer);eventNodes.forEach(node=>node.remove());eventNodes.clear();}
 };
}
