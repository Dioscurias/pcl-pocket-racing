const number=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function hudView(state={},maxSpeed=936){
 const speed=Math.max(0,number(state.speed)),health=clamp(number(state.health,100),0,100),energy=clamp(number(state.energy,100),0,100);
 const speedRatio=clamp(speed/Math.max(1,number(maxSpeed,936)),0,1),degrees=((number(state.heading)*180/Math.PI)%360+360)%360;
 const headingText=`${['N','NE','E','SE','S','SW','W','NW'][Math.round(degrees/45)%8]} ${Math.round(degrees)%360}°`;
 return {...state,speed,health,energy,topSpeed:Math.max(0,number(state.topSpeed)),distance:Math.max(0,number(state.distance)),bolts:Math.max(0,Math.floor(number(state.bolts))),heading:number(state.heading),headingText,speedRatio,energyRatio:energy/100,healthRatio:health/100,nearLimit:speedRatio>=.85,lowHealth:health<25,spinSeconds:24/(1+speedRatio*12)};
}
export function controlHints(parkour=false){
 const basic=[{key:'wasd',display:'W A S D',label:'Move',icon:'move'},{key:'arrows',display:'↑ ← ↓ →',label:'Look',icon:'look'},{key:' ',display:'SPACE',label:'Jump',icon:'jump'}];
 return basic.concat(parkour?[{key:'e',display:'E',label:'Blink',icon:'phase'},{key:'f',display:'F',label:'Hand blast',icon:'blast'}]:[{key:'shift',display:'SHIFT',label:'Boost',icon:'bolt'},{key:'q',display:'Q',label:'Phase',icon:'phase'},{key:'e',display:'E',label:'Slow time',icon:'slow'}]);
}
