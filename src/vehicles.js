import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {normalizeCar} from './car-catalog.js';

export const VEHICLE_SCALE=.65;
const material=(color,options={})=>new THREE.MeshStandardMaterial({color,roughness:.38,...options});
function part(parent,geometry,paint,x=0,y=0,z=0){const mesh=new THREE.Mesh(geometry,paint);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
const box=(g,m,size,pos,r=.035)=>part(g,r<=.015?new THREE.BoxGeometry(...size):new RoundedBoxGeometry(...size,1,r),m,...pos);
function rod(g,m,a,b,r=.025){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),mesh=part(g,new THREE.CylinderGeometry(r,r,start.distanceTo(end),8),m);mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());return mesh;}
function tube(g,m,points,r=.035){return part(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),28,r,8,false),m);}
function oval(g,m,pos,scale){const mesh=part(g,new THREE.SphereGeometry(1,24,16),m,...pos);mesh.scale.set(...scale);return mesh;}

// Smooth closed cross-sections give the body continuous reflections, without box-shaped panels.
function shell(g,m,stations,x=0){const vertices=[],indices=[],rings=40,sides=32,curve=new THREE.CatmullRomCurve3(stations.map(s=>new THREE.Vector3(s[1],s[2],s[3])));
 for(let i=0;i<=rings;i++){const t=i/rings*(stations.length-1),n=Math.min(stations.length-2,Math.floor(t)),u=t-n,a=stations[n],b=stations[n+1];const z=THREE.MathUtils.lerp(a[0],b[0],u),profile=curve.getPoint(i/rings),w=Math.max(.01,profile.x),cy=profile.y,h=Math.max(.01,profile.z);
  for(let j=0;j<=sides;j++){const angle=j/sides*Math.PI*2;vertices.push(x+Math.cos(angle)*w,cy+Math.sin(angle)*h,z);}
 }
 for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,a+1,b,b,a+1,b+1);}
 for(const [i,reverse] of [[0,true],[rings,false]]){const base=vertices.length/3,station=stations[i===0?0:stations.length-1];vertices.push(x,station[2],station[0]);for(let j=0;j<sides;j++){const a=i*(sides+1)+j;indices.push(base,reverse?a+1:a,reverse?a:a+1);}}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();return part(g,geometry,m);
}
function pane(g,m,width,bottom,top){const positions=[],indices=[],segments=20;for(let row=0;row<2;row++)for(let i=0;i<=segments;i++){const u=i/segments*2-1,p=row?top:bottom;positions.push(u*width*(row?.82:1),p[0]+(1-u*u)*.055,p[1]+u*u*.07);}for(let i=0;i<segments;i++){const a=i,b=i+segments+1;indices.push(a,a+1,b,b,a+1,b+1);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();return part(g,geo,m);}
function batch(group){group.updateMatrixWorld(true);const buckets=new Map();for(const child of [...group.children]){if(!child.isMesh)continue;const list=buckets.get(child.material)||[];list.push(child);buckets.set(child.material,list);}
 for(const [paint,meshes] of buckets){if(meshes.length<2)continue;const geometries=meshes.map(mesh=>{let geo=mesh.geometry.clone();if(geo.index)geo=geo.toNonIndexed();geo.deleteAttribute('uv');geo.applyMatrix4(mesh.matrix);return geo;});const geometry=mergeGeometries(geometries);if(!geometry)throw new Error('Incompatible vehicle geometry');for(const mesh of meshes){mesh.removeFromParent();mesh.geometry.dispose();}for(const geo of geometries)geo.dispose();part(group,geometry,paint);}
}
function wheel(paints,side){const pivot=new THREE.Group(),roll=new THREE.Group();pivot.add(roll);const {rubber,alloy,black,brake}=paints;
 const tire=part(roll,new THREE.CylinderGeometry(.455,.455,.31,32),rubber);tire.rotation.z=Math.PI/2;
 for(const face of [-1,1]){const sidewall=part(roll,new THREE.TorusGeometry(.37,.08,8,32),rubber,face*.145,0,0);sidewall.rotation.y=Math.PI/2;const rim=part(roll,new THREE.TorusGeometry(.287,.025,8,24),alloy,face*.17,0,0);rim.rotation.y=Math.PI/2;}
 const disc=part(roll,new THREE.CylinderGeometry(.255,.255,.025,24),brake,side*.115,0,0);disc.rotation.z=Math.PI/2;
 for(let i=0;i<10;i++){const angle=i/10*Math.PI*2,spoke=box(roll,alloy,[.025,.045,.25],[side*.18,Math.sin(angle)*.145,Math.cos(angle)*.145],.008);spoke.rotation.x=-angle;}
 const hub=part(roll,new THREE.CylinderGeometry(.085,.085,.045,12),alloy,side*.2,0,0);hub.rotation.z=Math.PI/2;
 for(let i=0;i<32;i++)for(const shoulder of [-1,1]){const a=i/32*Math.PI*2;const tread=box(roll,rubber,[.12,.009,.028],[shoulder*.078,Math.sin(a)*.455,Math.cos(a)*.455],.005);tread.rotation.x=-a;tread.rotation.z=shoulder*.15;}
 for(let i=0;i<5;i++){const a=i/5*Math.PI*2;oval(roll,black,[side*.226,Math.sin(a)*.055,Math.cos(a)*.055],[.009,.012,.012]);}
 batch(roll);pivot.userData.roll=roll;return pivot;
}
function spoiler(g,paint,carbon,alloy,{wide=1.95,height=1.24,z=1.25}={}){for(const side of [-1,1]){box(g,alloy,[.035,height-.6,.08],[side*.57,(height+.6)/2,z]);box(g,paint,[.055,.24,.48],[side*wide/2,height+.05,z],.025);}const foil=box(g,paint,[wide,.075,.43],[0,height,z],.035);foil.rotation.x=-.12;box(g,carbon,[wide,.025,.08],[0,height-.05,z+.17],.01);}
function driver(g,paints,{lower=false}={}){const {paint,black,alloy,suit,glass}=paints,driver=new THREE.Group();driver.position.set(0,lower?.67:.72,.32);g.add(driver);
 const torso=part(driver,new THREE.CapsuleGeometry(.18,.3,5,10),suit,0,.23,.04);torso.rotation.x=-.2;
 oval(driver,paint,[0,.68,-.04],[.235,.26,.25]);oval(driver,glass,[0,.71,-.215],[.207,.1,.084]);
 for(const side of [-1,1]){rod(driver,suit,[side*.16,.34,-.02],[side*.25,.22,-.3],.065);rod(driver,suit,[side*.25,.22,-.3],[side*.18,.27,-.5],.055);oval(driver,black,[side*.18,.27,-.5],[.075,.065,.07]);}
 const steering=part(g,new THREE.TorusGeometry(.205,.025,8,20),black,0,.99,-.28);steering.rotation.x=.7;rod(g,alloy,[0,.8,-.12],[0,.98,-.28],.018);batch(driver);return driver;
}

export function buildVehicle({car='apex',color=0x1859b7}={}){
 const model=normalizeCar(car),group=new THREE.Group(),body=new THREE.Group();group.add(body);
 group.name=`vehicle-${model}`;group.userData.model=model;group.scale.setScalar(VEHICLE_SCALE);
 const paint=material(color,{metalness:.62,roughness:.22}),black=material('#11151c',{roughness:.42}),rubber=material('#181b20',{roughness:.94}),alloy=material('#c2c9cc',{metalness:.85,roughness:.24}),carbon=material('#242831',{metalness:.25,roughness:.53}),glass=material('#16212d',{metalness:.48,roughness:.1,side:THREE.DoubleSide}),brake=material('#6a6d70',{metalness:.7,roughness:.45}),suit=material('#d1d5dd',{roughness:.75}),light=material('#e6edf2',{metalness:.3,roughness:.16}),red=material('#9b1920',{emissive:'#5c080b',emissiveIntensity:.35});
 const paints={paint,black,rubber,alloy,carbon,glass,brake,suit};
 box(body,carbon,[1.48,.12,2.8],[0,.35,0]);
 const sports=model==='roadster'||model==='coupe';
 if(!sports){
  const club=model==='club',formula=model==='formula';
  shell(body,paint,club?[[-1.5,.12,.53,.07],[-1.3,.37,.62,.18],[-.7,.44,.75,.23],[-.15,.41,.81,.24]]:[[-1.66,.08,.43,.06],[-1.25,.23,.56,.13],[-.65,.39,.72,.21],[-.12,.4,.79,.24]]);
  for(const side of [-1,1]){
   shell(body,paint,[[-.38,.11,.58,.12],[0,.18,.68,.24],[.65,.18,.7,.3],[1.12,.12,.66,.23]],side*.56);
   box(body,carbon,[.055,.28,.48],[side*.747,.64,.1],.015);
   for(const z of [-1.02,1.02]){for(const h of [.43,.66]){rod(body,alloy,[side*.32,h,z-.24],[side*.94,.46,z],.021);rod(body,alloy,[side*.32,h,z+.22],[side*.94,.46,z],.021);}rod(body,carbon,[side*.42,.79,z+.1],[side*.89,.46,z],.044);const spring=tube(body,alloy,Array.from({length:65},(_,i)=>{const t=i/64,a=t*Math.PI*16;return [side*(.48+t*.28)+Math.cos(a)*.048,.76-t*.25+Math.sin(a)*.048,z+.08];}),.011);spring.castShadow=false;}

  }
  tube(body,paint,[[-.27,.75,.7],[-.28,1.32,.64],[-.2,1.6,.68],[0,1.64,.7],[.2,1.6,.68],[.28,1.32,.64],[.27,.75,.7]],.038);
  shell(body,paint,[[.7,.3,.73,.16],[1.05,.39,.73,.18],[1.4,.18,.65,.1]]);
  box(body,black,[.64,.12,.8],[0,.74,.32]);box(body,black,[.55,.51,.13],[0,1.01,.7],.06);
  spoiler(body,paint,carbon,alloy,{wide:club?1.8:2.08,height:formula?1.32:1.24});
  const wing=box(body,paint,[formula?1.95:1.8,.07,.38],[0,.25,-1.43],.035);wing.rotation.x=.05;
  for(const side of [-1,1])box(body,paint,[.045,.17,.4],[side*(formula?.95:.88),.31,-1.43],.02);
  pane(body,glass,club?.43:.36,[.91,-.4],[club?1.26:1.12,-.17]);
  tube(body,paint,[[-.39,.89,-.35],[-.28,club?1.3:1.17,-.18],[0,club?1.34:1.2,-.17],[.28,club?1.3:1.17,-.18],[.39,.89,-.35]],.022);
  for(const side of [-1,1]){rod(body,alloy,[side*.39,.95,-.22],[side*.64,1.03,-.32],.015);oval(body,paint,[side*.65,1.04,-.32],[.105,.055,.07]);}
  if(club){oval(body,black,[0,.56,-1.48],[.23,.1,.04]);for(const side of [-1,1])oval(body,light,[side*.43,.68,-1.1],[.075,.075,.04]);}
 }else{
  // Separated fenders and side sills preserve the open cockpit and oversized toy tires.
  shell(body,paint,[[-1.62,.47,.57,.11],[-1.4,.65,.63,.22],[-.9,.64,.74,.23],[-.42,.54,.83,.17]]);
  shell(body,paint,[[.67,.5,.75,.15],[1.12,.67,.7,.24],[1.53,.55,.58,.17]]);
  for(const side of [-1,1]){
   shell(body,paint,[[-1.15,.13,.65,.21],[-.65,.16,.77,.31],[0,.14,.75,.31],[.6,.17,.72,.28],[1.16,.13,.65,.2]],side*.63);
   box(body,carbon,[.13,.08,2.45],[side*.75,.36,0]);
   if(model==='roadster')for(const z of [-1,1]){shell(body,paint,[[z-.57,.1,.62,.1],[z-.3,.23,.83,.16],[z+.18,.25,.84,.18],[z+.51,.14,.64,.14]],side*.84);}
   else {oval(body,paint,[side*.73,.78,-.96],[.25,.24,.58]);box(body,black,[.025,.23,.4],[side*.79,.71,.67],.03);}
   box(body,black,[.5,.2,.12],[side*.38,.51,-1.48],.04);
   oval(body,light,[side*.53,.84,-1.32],[model==='roadster'?.135:.22,.09,.045]);
   box(body,red,[.31,.065,.04],[side*.43,.78,1.49],.015);
   rod(body,alloy,[side*.57,1.1,-.43],[side*.81,1.14,-.51],.018);oval(body,paint,[side*.84,1.14,-.5],[.12,.065,.07]);
   box(body,alloy,[.035,.025,.11],[side*.785,.89,.3],.008);
   // Door shut line and lower side intake.
   tube(body,black,[[side*.775,1.01,-.3],[side*.786,.6,-.25],[side*.786,.5,.4]],.008);
  }
  oval(body,alloy,[0,.924,-1.12],[.028,.012,.04]);
  box(body,black,[.72,.12,.05],[0,.52,-1.62],.025);
  for(let i=-3;i<=3;i++)box(body,alloy,[.01,.09,.008],[i*.085,.52,-1.653],.001);
  box(body,carbon,[1.57,.055,.3],[0,.31,-1.47]);
  pane(body,glass,.55,[1.01,-.65],[1.5,-.21]);
  tube(body,paint,[[-.55,1.01,-.6],[-.47,1.5,-.18],[0,1.55,-.17],[.47,1.5,-.18],[.55,1.01,-.6]],.035);
  if(model==='coupe'){
   shell(body,paint,[[-.22,.46,1.46,.05],[0,.54,1.49,.11],[.45,.5,1.46,.08],[.65,.4,1.38,.05]]);
   pane(body,glass,.54,[.96,.98],[1.46,.57]);
   for(const side of [-1,1]){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([side*.535,1.43,-.18,side*.535,1.43,.53,side*.535,1.03,.86,side*.535,1.03,-.55],3));geo.setIndex([0,1,2,0,2,3]);geo.computeVertexNormals();part(body,geo,glass);rod(body,paint,[side*.53,1.03,.43],[side*.48,1.46,.4],.027);tube(body,paint,[[side*.48,1.48,-.18],[side*.55,1.04,-.6]],.035);}
  }else for(const side of [-1,1])tube(body,paint,[[side*.1,.88,.6],[side*.1,1.42,.59],[side*.34,1.44,.59],[side*.37,.87,.67]],.045);
  spoiler(body,paint,carbon,alloy,{wide:1.91,height:1.25,z:1.28});
 }
 const driverGroup=driver(group,paints,{lower:sports});
 const front=[],wheels=[];
 for(const side of [-1,1])for(const z of [-1.02,1.02]){const pivot=wheel(paints,side);pivot.position.set(side*.98,.47,z);group.add(pivot);wheels.push(pivot);if(z<0)front.push(pivot);}
 for(const side of [-1,1]){const pipe=part(body,new THREE.CylinderGeometry(.065,.065,.23,12),alloy,side*.34,.43,1.47);pipe.rotation.x=Math.PI/2;part(body,new THREE.CircleGeometry(.05,12),black,side*.34,.43,1.59);}
 batch(body);
 const exhaust=new THREE.Group();group.add(exhaust);for(const side of [-1,1]){const flame=part(exhaust,new THREE.ConeGeometry(.1,.65,10),new THREE.MeshBasicMaterial({color:'#d9ecff',transparent:true,opacity:.8}),side*.34,.43,1.88);flame.rotation.x=Math.PI/2;flame.castShadow=false;}exhaust.visible=false;
 return {group,body,paint,driver:driverGroup,front,wheels,exhaust,model};
}
