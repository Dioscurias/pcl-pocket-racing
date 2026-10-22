import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {normalizeCar} from './car-catalog.js';

export const VEHICLE_SCALE=.65;
const material=(color,options={})=>new THREE.MeshStandardMaterial({color,roughness:.34,...options});
function part(parent,geometry,paint,x=0,y=0,z=0){const mesh=new THREE.Mesh(geometry,paint);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
const box=(g,m,size,pos,r=.035)=>part(g,r<=.015?new THREE.BoxGeometry(...size):new RoundedBoxGeometry(...size,1,r),m,...pos);
function oval(g,m,pos,scale){const mesh=part(g,new THREE.SphereGeometry(1,20,14),m,...pos);mesh.scale.set(...scale);return mesh;}
function rod(g,m,a,b,r=.025){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),mesh=part(g,new THREE.CylinderGeometry(r,r,start.distanceTo(end),8),m);mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());return mesh;}
function wedge(g,m,{z=0,y=.6,length=1,front=.3,rear=.8,bottom=.35,frontTop=.62,rearTop=.9}={}){const f=z-length/2,r=z+length/2,vertices=[-front,bottom,f,front,bottom,f,-front,frontTop,f,front,frontTop,f,-rear,bottom,r,rear,bottom,r,-rear,rearTop,r,rear,rearTop,r],indices=[0,1,2,1,3,2,4,6,5,5,6,7,0,2,4,2,6,4,1,5,3,3,5,7,2,3,6,3,7,6,0,4,1,1,4,5],geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();const mesh=part(g,geo,m);mesh.position.y=y-.6;return mesh;}
function batch(group){group.updateMatrixWorld(true);const buckets=new Map();for(const child of [...group.children]){if(!child.isMesh)continue;const list=buckets.get(child.material)||[];list.push(child);buckets.set(child.material,list);}for(const [paint,meshes] of buckets){if(meshes.length<2)continue;const geometries=meshes.map(mesh=>{let geo=mesh.geometry.clone();if(geo.index)geo=geo.toNonIndexed();geo.deleteAttribute('uv');geo.applyMatrix4(mesh.matrix);return geo;});const geometry=mergeGeometries(geometries);if(!geometry)continue;for(const mesh of meshes){mesh.removeFromParent();mesh.geometry.dispose();}for(const geo of geometries)geo.dispose();part(group,geometry,paint);}}

function palette(color){return {
 paint:material(color,{metalness:.58,roughness:.22}),black:material('#10131a',{roughness:.45}),rubber:material('#14171c',{roughness:.94}),carbon:material('#242832',{metalness:.25,roughness:.52}),
 alloy:material('#bfc9d0',{metalness:.84,roughness:.2}),glass:material('#111827',{metalness:.4,roughness:.09,transparent:true,opacity:.92}),light:material('#e8fbff',{emissive:'#a7ecff',emissiveIntensity:1.2,roughness:.14}),
 lime:material('#cfff16',{metalness:.42,roughness:.2}),cyan:material('#14cbe0',{metalness:.42,roughness:.2}),coral:material('#ff5c52',{metalness:.4,roughness:.22}),violet:material('#7024cf',{metalness:.44,roughness:.2}),
 magenta:material('#f31592',{metalness:.48,roughness:.18}),navy:material('#101e55',{metalness:.5,roughness:.2}),yellow:material('#ffc915',{metalness:.42,roughness:.2}),white:material('#fff8ee',{metalness:.25,roughness:.24}),red:material('#ed201d',{metalness:.5,roughness:.19}),
};}

function wheel(p,side,{radius=.46,width=.32,rim=p.alloy,slick=false}={}){const pivot=new THREE.Group(),roll=new THREE.Group();pivot.add(roll);const tire=part(roll,new THREE.CylinderGeometry(radius,radius,width,32),p.rubber);tire.rotation.z=Math.PI/2;for(const face of [-1,1]){const ring=part(roll,new THREE.TorusGeometry(radius*.66,radius*.075,8,28),rim,face*width*.51,0,0);ring.rotation.y=Math.PI/2;const hub=part(roll,new THREE.CylinderGeometry(radius*.2,radius*.2,.035,16),p.black,face*width*.56,0,0);hub.rotation.z=Math.PI/2;}if(!slick)for(let i=0;i<18;i++){const a=i/18*Math.PI*2,tread=box(roll,p.rubber,[width*.75,.035,radius*.16],[0,Math.sin(a)*radius,Math.cos(a)*radius],.008);tread.rotation.x=-a;}batch(roll);pivot.userData.roll=roll;return pivot;}
function addWheels(group,p,{x=.98,z=.98,radius=.46,width=.32,rim=p.alloy,slick=false}={}){const wheels=[],front=[];for(const side of [-1,1])for(const axle of [-1,1]){const pivot=wheel(p,side,{radius,width,rim,slick});pivot.position.set(side*x,radius+.03,axle*z);group.add(pivot);wheels.push(pivot);if(axle<0)front.push(pivot);}return {wheels,front};}
function exhaust(group,positions){const flames=new THREE.Group();group.add(flames);for(const [x,y,z] of positions){const flame=part(flames,new THREE.ConeGeometry(.1,.58,10),new THREE.MeshBasicMaterial({color:'#dcf8ff',transparent:true,opacity:.82}),x,y,z);flame.rotation.x=Math.PI/2;flame.castShadow=false;}flames.visible=false;return flames;}
function dummyDriver(group){const driver=new THREE.Group();group.add(driver);return driver;}
function helmet(group,p,pos=[0,1,.15]){const driver=new THREE.Group();driver.position.set(...pos);group.add(driver);oval(driver,p.black,[0,.18,0],[.22,.26,.23]);oval(driver,p.glass,[0,.21,-.2],[.19,.09,.07]);return driver;}
function spoiler(g,paint,p,{wide=1.9,height=1.35,z=1.28}={}){for(const x of [-.55,.55])box(g,p.carbon,[.055,height-.55,.08],[x,(height+.55)/2,z],.015);box(g,paint,[wide,.09,.36],[0,height,z],.035);}
function numberMark(g,p,number,{y=1.05,z=-.65,color=p.white}={}){const text=String(number);text.split('').forEach((digit,index)=>{const x=(index-(text.length-1)/2)*.27;const segments={0:[1,1,1,1,1,1,0],1:[0,1,1,0,0,0,0],2:[1,1,0,1,1,0,1],4:[0,1,1,0,0,1,1],5:[1,0,1,1,0,1,1],7:[1,1,1,0,0,0,0],8:[1,1,1,1,1,1,1]}[digit]||[1,1,1,1,1,1,1];const defs=[[0,.16,.13,.035],[.09,.08,.035,.13],[.09,-.08,.035,.13],[0,-.16,.13,.035],[-.09,-.08,.035,.13],[-.09,.08,.035,.13],[0,0,.13,.035]];segments.forEach((on,i)=>{if(!on)return;const [dx,dz,w,d]=defs[i];box(g,color,[w,.025,d],[x+dx,y,z+dz],.005);});});}
function finish(model,group,body,p,driver,front,wheels,exhaustGroup,extra={}){group.name=`vehicle-${model}`;group.userData.model=model;group.userData.blueprint=model;group.scale.setScalar(VEHICLE_SCALE);batch(body);return {group,body,paint:p.paint,driver,front,wheels,exhaust:exhaustGroup,model,...extra};}

function buildMonsterBuggy(color){
 const model='apex',group=new THREE.Group(),body=new THREE.Group(),p=palette(color);group.add(body);
 box(body,p.carbon,[1.38,.16,2.48],[0,.43,0]);wedge(body,p.lime,{z:-.22,length:2.15,front:.38,rear:.72,bottom:.45,frontTop:.57,rearTop:.98});
 box(body,p.cyan,[1.18,.2,.74],[0,.61,-.79],.08);box(body,p.glass,[.82,.46,.48],[0,1.06,-.22],.08);box(body,p.black,[.92,.08,.1],[0,1.27,-.2],.012);
 box(body,p.lime,[1.05,.16,.48],[0,1.3,.08],.07);box(body,p.cyan,[.44,.18,.4],[0,1.47,-.24],.055);box(body,p.paint,[.18,.07,1.62],[0,1.03,-.13],.02);
 for(const x of [-1,1]){box(body,p.cyan,[.22,.31,.84],[x*.66,.73,.2],.06);box(body,p.lime,[.13,.16,.54],[x*.56,1.05,-.22],.03);for(const z of [-.93,.93]){rod(body,p.alloy,[x*.44,.69,z-.2],[x*.94,.58,z],.035);rod(body,p.alloy,[x*.44,.51,z+.2],[x*.94,.58,z],.035);rod(body,p.lime,[x*.59,.9,z],[x*.9,.58,z],.05);}}
 box(body,p.black,[1.28,.23,.2],[0,.49,-1.36],.025);for(const x of [-.42,0,.42])box(body,p.alloy,[.08,.16,.07],[x,.49,-1.46],.012);spoiler(body,p.lime,p,{wide:1.78,height:1.39,z:1.08});
 numberMark(body,p,55,{y:1.4,z:.05});const {wheels,front}=addWheels(group,p,{x:1.02,z:.94,radius:.58,width:.4,rim:p.lime});const driver=dummyDriver(group);return finish(model,group,body,p,driver,front,wheels,exhaust(group,[[-.32,.48,1.48],[.32,.48,1.48]]));
}

function buildMotorcycle(color){
 const model='motorcycle',group=new THREE.Group(),lean=new THREE.Group(),body=new THREE.Group(),p=palette(color);group.add(lean);lean.add(body);
 box(body,p.black,[.18,.16,1.78],[0,.5,.03],.07);wedge(body,p.cyan,{z:-.38,length:1.18,front:.16,rear:.38,bottom:.46,frontTop:.65,rearTop:.94});oval(body,p.coral,[0,.69,.27],[.32,.25,.66]);
 box(body,p.yellow,[.15,.07,1.26],[0,.85,-.1],.025);box(body,p.glass,[.42,.3,.09],[0,1.06,-.72],.035);box(body,p.cyan,[.32,.12,.44],[0,.6,-1.02],.06);box(body,p.black,[.4,.16,.56],[0,.75,.69],.07);
 for(const side of [-1,1]){box(body,p.paint,[.065,.24,.72],[side*.26,.69,-.08],.035);rod(body,p.alloy,[0,.53,-.82],[side*.16,.5,-1.06],.032);rod(body,p.black,[side*.08,.98,-.57],[side*.38,.99,-.71],.024);}
 const wheels=[],front=[];for(const z of [-1.06,1.06]){const pivot=wheel(p,1,{radius:.39,width:.22,rim:p.yellow,slick:true});pivot.position.set(0,.42,z);lean.add(pivot);wheels.push(pivot);if(z<0)front.push(pivot);}
 const rider=new THREE.Group();lean.add(rider);oval(rider,p.black,[0,1.02,.25],[.22,.38,.22]);oval(rider,p.cyan,[0,1.42,-.12],[.21,.23,.21]);oval(rider,p.glass,[0,1.44,-.31],[.18,.075,.06]);for(const side of [-1,1]){rod(rider,p.coral,[side*.13,1.17,.05],[side*.27,.92,-.55],.055);rod(rider,p.cyan,[side*.12,.9,.39],[side*.19,.61,.76],.062);}batch(rider);
 group.userData.model=model;group.userData.blueprint=model;group.name=`vehicle-${model}`;group.scale.setScalar(VEHICLE_SCALE);batch(body);return {group,body,paint:p.paint,driver:rider,front,wheels,exhaust:exhaust(lean,[[0,.46,1.55]]),model,lean};
}

function buildNova88(color){
 const model='roadster',group=new THREE.Group(),body=new THREE.Group(),p=palette(color);group.add(body);
 box(body,p.carbon,[1.56,.13,2.7],[0,.38,0]);wedge(body,p.navy,{z:-.18,length:2.48,front:.28,rear:.76,bottom:.39,frontTop:.58,rearTop:.91});
 wedge(body,p.magenta,{z:-.52,length:1.55,front:.23,rear:.7,bottom:.46,frontTop:.67,rearTop:.86});oval(body,p.glass,[0,1.02,.06],[.57,.39,.68]);box(body,p.navy,[.88,.09,.36],[0,1.28,.44],.045);
 box(body,p.magenta,[.24,.11,2.12],[0,.92,-.25],.04);for(const x of [-1,1]){oval(body,p.magenta,[x*.72,.62,-.88],[.38,.34,.58]);oval(body,p.navy,[x*.72,.62,.82],[.35,.32,.48]);box(body,p.paint,[.12,.07,1.36],[x*.6,.88,-.03],.025);oval(body,p.light,[x*.46,.66,-1.4],[.2,.075,.038]);}
 box(body,p.navy,[1.62,.1,.24],[0,.39,-1.41],.025);spoiler(body,p.magenta,p,{wide:1.8,height:1.43,z:1.17});numberMark(body,p,88,{y:1.31,z:-.38});
 const {wheels,front}=addWheels(group,p,{x:.94,z:.95,radius:.56,width:.41,rim:p.magenta,slick:true});const driver=dummyDriver(group);return finish(model,group,body,p,driver,front,wheels,exhaust(group,[[-.27,.46,1.48],[.27,.46,1.48]]));
}

function formulaBase(model,color,{primary,secondary,third,number,halo=false}){
 const group=new THREE.Group(),body=new THREE.Group(),p=palette(color);group.add(body);const main=p[primary],accent=p[secondary],stripe=p[third];
 box(body,p.carbon,[1.34,.12,2.72],[0,.35,0]);wedge(body,main,{z:-.43,length:2.05,front:.13,rear:.43,bottom:.4,frontTop:.53,rearTop:.82});box(body,main,[.28,.24,1.46],[0,.63,-.37],.065);
 for(const x of [-1,1]){wedge(body,main,{z:.26,length:1.48,front:.28,rear:.36,bottom:.41,frontTop:.66,rearTop:.72});const pod=body.children.at(-1);pod.position.x=x*.52;box(body,accent,[.13,.08,1.58],[x*.49,.79,-.2],.022);for(const z of [-.97,.97]){rod(body,p.carbon,[x*.31,.5,z-.17],[x*.91,.47,z],.033);rod(body,p.carbon,[x*.31,.68,z+.15],[x*.91,.47,z],.033);}}
 box(body,accent,[1.91,.09,.39],[0,.28,-1.4],.025);for(const x of [-.91,.91])box(body,stripe,[.085,.2,.4],[x,.35,-1.4],.018);spoiler(body,accent,p,{wide:1.9,height:1.32,z:1.24});box(body,stripe,[.18,.11,1.84],[0,.84,-.31],.03);
 oval(body,p.black,[0,.75,.18],[.29,.16,.43]);const driver=helmet(group,p,[0,.73,.14]);if(halo){for(const x of [-1,1])rod(body,p.black,[x*.3,.78,-.03],[x*.28,1.2,.04],.034);rod(body,p.black,[-.28,1.2,.04],[.28,1.2,.04],.034);rod(body,p.black,[0,1.2,.04],[0,1.08,-.45],.034);}for(const x of [-1,1])oval(body,p.light,[x*.27,.66,-1.19],[.065,.055,.03]);
 numberMark(body,p,number,{y:1,z:-.63});const {wheels,front}=addWheels(group,p,{x:.92,z:.98,radius:.48,width:.35,rim:halo?p.lime:p.violet,slick:true});return finish(model,group,body,p,driver,front,wheels,exhaust(group,[[-.23,.44,1.5],[.23,.44,1.5]]));
}
function buildSolarFormula(color){return formulaBase('apex-formula',color,{primary:'yellow',secondary:'cyan',third:'coral',number:7});}
function buildVoltFormula(color){return formulaBase('formula-x',color,{primary:'lime',secondary:'violet',third:'paint',number:1,halo:true});}

function buildMuscleGT(color){
 const model='muscle-gt',group=new THREE.Group(),body=new THREE.Group(),p=palette(color);group.add(body);
 box(body,p.carbon,[1.58,.13,2.68],[0,.36,0]);wedge(body,p.red,{z:-.22,length:2.46,front:.63,rear:.78,bottom:.4,frontTop:.69,rearTop:.84});box(body,p.red,[1.42,.46,1.14],[0,.76,.04],.14);
 wedge(body,p.glass,{z:.25,length:.74,front:.49,rear:.52,bottom:.88,frontTop:1.18,rearTop:1.22});box(body,p.red,[1.12,.16,.28],[0,1.22,.59],.07);box(body,p.black,[.6,.22,.48],[0,1.08,-.62],.055);
 for(const x of [-1,1]){oval(body,p.red,[x*.7,.61,-.92],[.38,.36,.58]);oval(body,p.red,[x*.7,.61,.91],[.38,.36,.54]);oval(body,p.light,[x*.47,.67,-1.43],[.2,.08,.035]);box(body,p.paint,[.075,.075,1.78],[x*.56,.84,-.03],.018);}
 box(body,p.white,[.17,.05,2.42],[-.16,1.015,-.1],.01);box(body,p.white,[.17,.05,2.42],[.16,1.015,-.1],.01);box(body,p.black,[1.15,.23,.08],[0,.55,-1.51],.016);spoiler(body,p.red,p,{wide:1.76,height:1.25,z:1.27});numberMark(body,p,24,{y:1.01,z:-.36});
 const {wheels,front}=addWheels(group,p,{x:.95,z:.95,radius:.53,width:.4,rim:p.red,slick:true});const driver=dummyDriver(group);return finish(model,group,body,p,driver,front,wheels,exhaust(group,[[-.36,.45,1.49],[.36,.45,1.49]]));
}

const BUILDERS={apex:buildMonsterBuggy,motorcycle:buildMotorcycle,roadster:buildNova88,'apex-formula':buildSolarFormula,'formula-x':buildVoltFormula,'muscle-gt':buildMuscleGT};
export function buildVehicle({car='apex',color=0x1859b7}={}){const model=normalizeCar(car);return BUILDERS[model](color);}
