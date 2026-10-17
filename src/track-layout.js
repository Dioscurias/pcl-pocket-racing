// PCL Level 3 stack labels and floor organization inform this authored toy circuit.
// Dimensions are gameplay units, not a survey. Furniture clearances accommodate karts.
export const TRACK_POINTS = [[15,35],[15,-48],[28,-68],[70,-64],[90,-35],[90,10],[76,54],[25,78],[-14,65],[-45,38],[-82,5],[-82,-35],[-60,-53],[-32,-60],[-25,-25],[-25,20],[-10,39]].map(([x,z])=>({x,z}));
export const TRACK_WIDTH = 10.2;
const mod=(n,d)=>(n%d+d)%d;
function curve(a,b,c,d,t){return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);}
export const CENTERLINE=[];
let distance=0;
for(let i=0;i<TRACK_POINTS.length;i++)for(let j=0;j<12;j++){
 const a=TRACK_POINTS[mod(i-1,TRACK_POINTS.length)],b=TRACK_POINTS[i],c=TRACK_POINTS[(i+1)%TRACK_POINTS.length],d=TRACK_POINTS[(i+2)%TRACK_POINTS.length],t=j/12;
 const p={x:curve(a.x,b.x,c.x,d.x,t),z:curve(a.z,b.z,c.z,d.z,t)};
 if(CENTERLINE.length){const prev=CENTERLINE.at(-1);distance+=Math.hypot(p.x-prev.x,p.z-prev.z);}
 CENTERLINE.push({...p,s:distance});
}
export const TRACK_LENGTH=distance+Math.hypot(CENTERLINE.at(-1).x-CENTERLINE[0].x,CENTERLINE.at(-1).z-CENTERLINE[0].z);
export function pointAtDistance(s){
 s=mod(s,TRACK_LENGTH);let i=0;
 while(i<CENTERLINE.length-1&&CENTERLINE[i+1].s<=s)i++;
 const a=CENTERLINE[i],b=CENTERLINE[(i+1)%CENTERLINE.length],end=i===CENTERLINE.length-1?TRACK_LENGTH:b.s,t=(s-a.s)/(end-a.s);
 return{x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,heading:Math.atan2(b.x-a.x,a.z-b.z),s,index:i};
}
export function nearestTrack(x,z){
 let best={distance:Infinity};
 for(let i=0;i<CENTERLINE.length;i++){
  const a=CENTERLINE[i],b=CENTERLINE[(i+1)%CENTERLINE.length],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(length*length))),px=a.x+dx*t,pz=a.z+dz*t,d=Math.hypot(x-px,z-pz);
  if(d<best.distance)best={x:px,z:pz,distance:d,s:a.s+t*length,heading:Math.atan2(dx,-dz),index:i};
 }return best;
}
export const CHECKPOINTS=Array.from({length:8},(_,i)=>({...pointAtDistance(TRACK_LENGTH*i/8),index:i}));
export const STACKS=[
 {label:'3L',x:45,z:-50,w:38,d:12},{label:'3M',x:50,z:-32,w:54,d:10},{label:'3N',x:49,z:-14,w:56,d:11},
 {label:'3P',x:49,z:5,w:54,d:12},{label:'3Q',x:43,z:24,w:50,d:13},{label:'3R',x:35,z:43,w:30,d:9},
 {label:'3S',x:45,z:61,w:40,d:10},{label:'3G',x:-58,z:-15,w:16,d:24},{label:'3H',x:-36,z:-15,w:12,d:24},
 {label:'3J',x:-12,z:-61,w:14,d:13},{label:'3K',x:-8,z:-39,w:12,d:13},
];
export const OBSTACLES=[{type:'stairs',label:'Central stair core',x:-3,z:0,w:18,d:46,height:9},...STACKS.map(s=>({...s,type:'stack',height:11})),{type:'admin',label:'Administration',x:-50,z:15,w:20,d:16,height:12}];
export const RAMPS=[{x:90,z:-1,width:8,length:20,height:3.2,heading:Math.PI}];
export const BOOSTS=[{...pointAtDistance(TRACK_LENGTH*.19),width:6,length:8},{...pointAtDistance(TRACK_LENGTH*.69),width:6,length:8}];
export const SHORTCUTS=[{points:[{x:76,z:54},{x:25,z:60},{x:-14,z:65}],width:7,label:'Reading table shortcut'}];
export const FLOOR_OUTLINE=[[-99,-72],[-79,-85],[73,-85],[100,-57],[100,54],[84,85],[8,87],[-32,75],[-67,51],[-100,17],[-100,-49]].map(([x,z])=>({x,z}));
// Number in gameplay units. A ramp rises along its heading; its far edge drops to floor.
export function surfaceAt(x,z){let height=0;for(const r of RAMPS){const dx=x-r.x,dz=z-r.z,f=dx*Math.sin(r.heading)-dz*Math.cos(r.heading),side=dx*Math.cos(r.heading)+dz*Math.sin(r.heading);if(Math.abs(side)<=r.width/2&&f>=-r.length/2&&f<=r.length/2)height=Math.max(height,(f/r.length+.5)*r.height);}return height;}
export function insideFloor(x,z){let inside=false;for(let i=0,j=FLOOR_OUTLINE.length-1;i<FLOOR_OUTLINE.length;j=i++){const a=FLOOR_OUTLINE[i],b=FLOOR_OUTLINE[j];if(((a.z>z)!==(b.z>z))&&(x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x))inside=!inside;}return inside;}
