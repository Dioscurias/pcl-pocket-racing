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
function spring(g,m,a,b,r=.018,turns=9){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),axis=end.clone().sub(start),side=new THREE.Vector3(1,0,0);if(Math.abs(axis.clone().normalize().dot(side))>.9)side.set(0,0,1);const u=side.clone().cross(axis).normalize(),v=axis.clone().cross(u).normalize(),points=Array.from({length:turns*8+1},(_,i)=>{const t=i/(turns*8),angle=t*turns*Math.PI*2;return start.clone().lerp(end,t).addScaledVector(u,Math.cos(angle)*.045).addScaledVector(v,Math.sin(angle)*.045);});return part(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),turns*8,r,6,false),m);}
function wedge(g,m,{z=0,y=.6,length=1,front=.3,rear=.8,bottom=.35,frontTop=.62,rearTop=.9}={}){const f=z-length/2,r=z+length/2,vertices=[-front,bottom,f,front,bottom,f,-front,frontTop,f,front,frontTop,f,-rear,bottom,r,rear,bottom,r,-rear,rearTop,r,rear,rearTop,r],indices=[0,1,2,1,3,2,4,6,5,5,6,7,0,2,4,2,6,4,1,5,3,3,5,7,2,3,6,3,7,6,0,4,1,1,4,5],geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();const mesh=part(g,geo,m);mesh.position.y=y-.6;return mesh;}
function batch(group){group.updateMatrixWorld(true);const buckets=new Map();for(const child of [...group.children]){if(!child.isMesh)continue;const list=buckets.get(child.material)||[];list.push(child);buckets.set(child.material,list);}for(const [paint,meshes] of buckets){if(meshes.length<2)continue;const geometries=meshes.map(mesh=>{let geo=mesh.geometry.clone();if(geo.index)geo=geo.toNonIndexed();geo.deleteAttribute('uv');geo.applyMatrix4(mesh.matrix);return geo;});const geometry=mergeGeometries(geometries);if(!geometry)continue;for(const mesh of meshes){mesh.removeFromParent();mesh.geometry.dispose();}for(const geo of geometries)geo.dispose();part(group,geometry,paint);}}
function detail(parent,name,build){const layer=new THREE.Group();layer.name=`detail:${name}`;parent.add(layer);build(layer);batch(layer);return layer;}

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
function numberMark(g,p,number,{y=1.05,z=-.65,color=p.white,scale=1}={}){const text=String(number);text.split('').forEach((digit,index)=>{const x=(index-(text.length-1)/2)*.27*scale;const segments={0:[1,1,1,1,1,1,0],1:[0,1,1,0,0,0,0],2:[1,1,0,1,1,0,1],4:[0,1,1,0,0,1,1],5:[1,0,1,1,0,1,1],7:[1,1,1,0,0,0,0],8:[1,1,1,1,1,1,1]}[digit]||[1,1,1,1,1,1,1];const defs=[[0,.16,.13,.035],[.09,.08,.035,.13],[.09,-.08,.035,.13],[0,-.16,.13,.035],[-.09,-.08,.035,.13],[-.09,.08,.035,.13],[0,0,.13,.035]];segments.forEach((on,i)=>{if(!on)return;const [dx,dz,w,d]=defs[i];box(g,color,[w*scale,.025,d*scale],[x+dx*scale,y,z+dz*scale],.005);});});}
function finish(model,group,body,p,driver,front,wheels,exhaustGroup,extra={}){group.name=`vehicle-${model}`;group.userData.model=model;group.userData.blueprint=model;group.scale.setScalar(VEHICLE_SCALE);batch(body);return {group,body,paint:p.paint,driver,front,wheels,exhaust:exhaustGroup,model,...extra};}

function buildMonsterBuggy(color){
 const model='apex',group=new THREE.Group(),body=new THREE.Group(),p=palette(color);group.add(body);
 box(body,p.carbon,[1.38,.16,2.48],[0,.43,0]);wedge(body,p.lime,{z:-.22,length:2.15,front:.38,rear:.72,bottom:.45,frontTop:.57,rearTop:.98});
 box(body,p.cyan,[1.18,.2,.74],[0,.61,-.79],.08);box(body,p.glass,[.82,.46,.48],[0,1.06,-.22],.08);box(body,p.black,[.92,.08,.1],[0,1.27,-.2],.012);
 box(body,p.lime,[1.05,.16,.48],[0,1.3,.08],.07);box(body,p.cyan,[.44,.18,.4],[0,1.47,-.24],.055);box(body,p.paint,[.18,.07,1.62],[0,1.03,-.13],.02);
 for(const x of [-1,1]){box(body,p.cyan,[.22,.31,.84],[x*.66,.73,.2],.06);box(body,p.lime,[.13,.16,.54],[x*.56,1.05,-.22],.03);for(const z of [-.93,.93]){rod(body,p.alloy,[x*.44,.69,z-.2],[x*.94,.58,z],.035);rod(body,p.alloy,[x*.44,.51,z+.2],[x*.94,.58,z],.035);rod(body,p.lime,[x*.59,.9,z],[x*.9,.58,z],.05);}}
 box(body,p.black,[1.28,.23,.2],[0,.49,-1.36],.025);for(const x of [-.42,0,.42])box(body,p.alloy,[.08,.16,.07],[x,.49,-1.46],.012);spoiler(body,p.lime,p,{wide:1.78,height:1.39,z:1.08});
 detail(body,'enclosed-cabin',g=>{box(g,p.lime,[1.22,.54,.92],[0,1,.05],.14);for(const x of [-1,1]){box(g,p.glass,[.025,.31,.45],[x*.615,1.11,-.06],.012);box(g,p.cyan,[.1,.3,.78],[x*.58,.91,.08],.035);rod(g,p.black,[x*.5,.86,-.49],[x*.5,1.35,-.3],.03);rod(g,p.black,[x*.5,.86,.29],[x*.5,1.35,.2],.03);}box(g,p.black,[1.08,.055,.76],[0,1.37,-.03],.018);box(g,p.glass,[.91,.36,.035],[0,1.12,-.49],.012);});
 detail(body,'roof-scoop',g=>{wedge(g,p.cyan,{z:-.23,y:1.5,length:.42,front:.14,rear:.25,bottom:.5,frontTop:.63,rearTop:.72});box(g,p.black,[.26,.08,.2],[0,1.53,-.37],.018);});
 detail(body,'exposed-suspension',g=>{for(const x of [-1,1])for(const z of [-.93,.93]){rod(g,p.carbon,[x*.42,.63,z-.24],[x*.96,.57,z],.028);rod(g,p.carbon,[x*.42,.48,z+.22],[x*.96,.57,z],.028);}});
 detail(body,'knobby-tires',g=>{for(const x of [-1,1])for(const z of [-.93,.93])spring(g,p.lime,[x*.63,.89,z],[x*.87,.6,z],.016,8);});
 detail(body,'rear-wing',g=>{for(const x of [-.84,.84])box(g,p.cyan,[.06,.28,.4],[x,1.4,1.08],.02);box(g,p.black,[1.5,.035,.09],[0,1.34,1.18],.01);});
 detail(body,'front-bumper',g=>{rod(g,p.alloy,[-.62,.45,-1.46],[.62,.45,-1.46],.04);for(const x of [-.52,.52]){rod(g,p.alloy,[x,.45,-1.46],[x*.84,.62,-1.28],.032);box(g,p.light,[.2,.08,.035],[x*.72,.69,-1.34],.018);}box(g,p.carbon,[.72,.08,.25],[0,.39,-1.35],.02);for(const x of [-.3,-.15,0,.15,.3])box(g,p.black,[.04,.14,.025],[x,.57,-1.37],.006);});
 detail(body,'number-55',g=>{numberMark(g,p,55,{y:1.48,z:.05,scale:1.45});for(const x of [-1,1])box(g,p.white,[.035,.28,.36],[x*.7,.93,.12],.01);});
 const {wheels,front}=addWheels(group,p,{x:1.02,z:.94,radius:.58,width:.4,rim:p.lime});const driver=dummyDriver(group);return finish(model,group,body,p,driver,front,wheels,exhaust(group,[[-.32,.48,1.48],[.32,.48,1.48]]));
}

function buildMotorcycle(color){
 const model='motorcycle',group=new THREE.Group(),lean=new THREE.Group(),body=new THREE.Group(),p=palette(color);group.add(lean);lean.add(body);
 box(body,p.black,[.18,.16,1.78],[0,.5,.03],.07);wedge(body,p.cyan,{z:-.38,length:1.18,front:.16,rear:.38,bottom:.46,frontTop:.65,rearTop:.94});oval(body,p.coral,[0,.69,.27],[.32,.25,.66]);
 box(body,p.yellow,[.15,.07,1.26],[0,.85,-.1],.025);oval(body,p.glass,[0,.99,-.72],[.25,.2,.065]);box(body,p.cyan,[.32,.12,.44],[0,.6,-1.02],.06);box(body,p.black,[.4,.16,.56],[0,.75,.69],.07);
 for(const side of [-1,1]){box(body,p.paint,[.065,.24,.72],[side*.26,.69,-.08],.035);rod(body,p.alloy,[0,.53,-.82],[side*.16,.5,-1.06],.032);rod(body,p.black,[side*.08,.98,-.57],[side*.38,.99,-.71],.024);}
 detail(body,'full-fairing',g=>{wedge(g,p.cyan,{z:-.45,y:.7,length:1.45,front:.2,rear:.42,bottom:.4,frontTop:.63,rearTop:.94});box(g,p.coral,[.7,.22,.48],[0,.69,-.58],.1);for(const side of [-1,1]){const fairing=wedge(g,p.cyan,{z:-.18,y:.69,length:1.22,front:.12,rear:.31,bottom:.42,frontTop:.72,rearTop:.88});fairing.position.x=side*.29;box(g,p.coral,[.07,.3,.78],[side*.39,.7,-.08],.035);for(let i=0;i<3;i++)box(g,p.black,[.03,.055,.3],[side*.43,.66+i*.08,-.26],.008);}for(const x of [-1,1])box(g,p.light,[.18,.055,.035],[x*.2,.7,-1.05],.015);});
 detail(body,'windscreen',g=>{const screen=box(g,p.glass,[.42,.26,.04],[0,.99,-.74],.02);screen.rotation.x=-.95;box(g,p.cyan,[.51,.11,.18],[0,.82,-.88],.03);});
 detail(body,'disc-brakes',g=>{for(const z of [-1.06,1.06]){const disc=part(g,new THREE.CylinderGeometry(.25,.25,.018,28),p.alloy,.13,.42,z);disc.rotation.z=Math.PI/2;for(let i=0;i<6;i++){const a=i/6*Math.PI*2;oval(g,p.black,[.145,.42+Math.sin(a)*.14,z+Math.cos(a)*.14],[.015,.018,.018]);}}});
 detail(body,'exhaust',g=>{const pipe=part(g,new THREE.CylinderGeometry(.055,.075,.78,14),p.alloy,.26,.52,.73);pipe.rotation.x=Math.PI/2;part(g,new THREE.CylinderGeometry(.075,.075,.04,14),p.black,.26,.52,1.13).rotation.x=Math.PI/2;});
 detail(body,'mirrors',g=>{for(const side of [-1,1]){rod(g,p.black,[side*.18,.94,-.58],[side*.47,1.02,-.7],.02);oval(g,p.coral,[side*.5,1.04,-.72],[.13,.065,.08]);}});
 detail(body,'yellow-trim',g=>{for(const side of [-1,1]){box(g,p.yellow,[.035,.06,.92],[side*.39,.83,-.18],.012);box(g,p.yellow,[.035,.06,.36],[side*.3,.66,.66],.012);}});
 const wheels=[],front=[];for(const z of [-1.06,1.06]){const pivot=wheel(p,1,{radius:.39,width:.22,rim:p.yellow,slick:true});pivot.position.set(0,.42,z);lean.add(pivot);wheels.push(pivot);if(z<0)front.push(pivot);}
 const rider=new THREE.Group();rider.name='detail:rider';lean.add(rider);oval(rider,p.black,[0,1.02,.25],[.2,.34,.2]);oval(rider,p.cyan,[0,1.36,-.12],[.19,.21,.19]);oval(rider,p.glass,[0,1.38,-.29],[.16,.065,.055]);box(rider,p.yellow,[.05,.21,.022],[0,1.37,-.3],.008);for(const side of [-1,1]){oval(rider,p.yellow,[side*.16,1.16,-.02],[.08,.09,.08]);rod(rider,p.coral,[side*.12,1.13,.05],[side*.25,.9,-.55],.052);rod(rider,p.cyan,[side*.11,.88,.39],[side*.18,.61,.76],.058);}rider.rotation.x=-.2;batch(rider);
 group.userData.model=model;group.userData.blueprint=model;group.name=`vehicle-${model}`;group.scale.setScalar(VEHICLE_SCALE);batch(body);return {group,body,paint:p.paint,driver:rider,front,wheels,exhaust:exhaust(lean,[[0,.46,1.55]]),model,lean};
}

function buildNova88(color){
 const model='roadster',group=new THREE.Group(),body=new THREE.Group(),p=palette(color);group.add(body);
 box(body,p.carbon,[1.56,.13,2.7],[0,.38,0]);wedge(body,p.navy,{z:-.18,length:2.48,front:.28,rear:.76,bottom:.39,frontTop:.58,rearTop:.91});
 wedge(body,p.magenta,{z:-.52,length:1.55,front:.23,rear:.7,bottom:.46,frontTop:.67,rearTop:.86});oval(body,p.glass,[0,1.02,.06],[.57,.39,.68]);box(body,p.navy,[.88,.09,.36],[0,1.28,.44],.045);
 box(body,p.magenta,[.24,.11,2.12],[0,.92,-.25],.04);for(const x of [-1,1]){oval(body,p.magenta,[x*.72,.62,-.88],[.38,.34,.58]);oval(body,p.navy,[x*.72,.62,.82],[.35,.32,.48]);box(body,p.paint,[.12,.07,1.36],[x*.6,.88,-.03],.025);oval(body,p.light,[x*.46,.66,-1.4],[.2,.075,.038]);}
 box(body,p.navy,[1.62,.1,.24],[0,.39,-1.41],.025);spoiler(body,p.magenta,p,{wide:1.8,height:1.43,z:1.17});numberMark(body,p,88,{y:1.31,z:-.38});
 detail(body,'bubble-canopy',g=>{for(const x of [-1,1])rod(g,p.magenta,[x*.48,.86,-.52],[x*.45,1.31,.45],.025);rod(g,p.magenta,[-.46,1.31,.45],[.46,1.31,.45],.025);box(g,p.glass,[.76,.025,.05],[0,1.33,.2],.008);});
 detail(body,'covered-fenders',g=>{box(g,p.navy,[1.72,.24,1.86],[0,.5,-.04],.09);wedge(g,p.magenta,{z:-.16,y:.68,length:2.3,front:.74,rear:.86,bottom:.42,frontTop:.68,rearTop:.82});for(const x of [-1,1])for(const z of [-.94,.94]){oval(g,p.magenta,[x*.76,.7,z],[.43,.37,.58]);box(g,p.navy,[.06,.19,.7],[x*.92,.67,z],.018);}});
 detail(body,'loop-wing',g=>{for(const x of [-1,1]){rod(g,p.magenta,[x*.7,.93,.82],[x*.82,1.5,1.16],.045);rod(g,p.magenta,[x*.82,1.5,1.16],[x*.38,1.57,1.18],.045);}box(g,p.navy,[.76,.07,.12],[0,1.57,1.18],.02);});
 detail(body,'led-lights',g=>{for(const x of [-1,1]){box(g,p.light,[.34,.055,.035],[x*.43,.65,-1.47],.015);box(g,p.light,[.045,.18,.035],[x*.63,.56,-1.43],.012);}});
 detail(body,'side-intakes',g=>{for(const x of [-1,1]){box(g,p.black,[.04,.22,.38],[x*.76,.66,.26],.025);for(let i=0;i<3;i++)box(g,p.navy,[.018,.025,.32],[x*.785,.61+i*.065,.26],.005);}});
 detail(body,'diffuser',g=>{box(g,p.carbon,[1.3,.07,.38],[0,.4,1.34],.018);for(const x of [-.5,-.25,0,.25,.5])box(g,p.black,[.035,.16,.31],[x,.45,1.37],.008);});
 detail(body,'number-88',g=>{numberMark(g,p,88,{y:1.38,z:-.37,scale:1.5});for(const x of [-1,1])box(g,p.white,[.03,.26,.32],[x*.73,.85,.18],.008);});
 const {wheels,front}=addWheels(group,p,{x:.87,z:.95,radius:.56,width:.41,rim:p.magenta,slick:true});const driver=dummyDriver(group);return finish(model,group,body,p,driver,front,wheels,exhaust(group,[[-.27,.46,1.48],[.27,.46,1.48]]));
}

function formulaBase(model,color,{primary,secondary,third,number,halo=false}){
 const group=new THREE.Group(),body=new THREE.Group(),p=palette(color);group.add(body);const main=p[primary],accent=p[secondary],stripe=p[third];
 box(body,p.carbon,[1.34,.12,2.72],[0,.35,0]);wedge(body,main,{z:-.43,length:2.05,front:.13,rear:.43,bottom:.4,frontTop:.53,rearTop:.82});box(body,main,[.28,.24,1.46],[0,.63,-.37],.065);
 for(const x of [-1,1]){wedge(body,main,{z:.26,length:1.48,front:.28,rear:.36,bottom:.41,frontTop:.66,rearTop:.72});const pod=body.children.at(-1);pod.position.x=x*.52;box(body,accent,[.13,.08,1.58],[x*.49,.79,-.2],.022);for(const z of [-.97,.97]){rod(body,p.carbon,[x*.31,.5,z-.17],[x*.91,.47,z],.033);rod(body,p.carbon,[x*.31,.68,z+.15],[x*.91,.47,z],.033);}}
 box(body,accent,[1.91,.09,.39],[0,.28,-1.4],.025);for(const x of [-.91,.91])box(body,stripe,[.085,.2,.4],[x,.35,-1.4],.018);spoiler(body,accent,p,{wide:1.9,height:1.32,z:1.24});box(body,stripe,[.18,.11,1.84],[0,.84,-.31],.03);
 oval(body,p.black,[0,.75,.18],[.29,.16,.43]);const driver=helmet(group,p,[0,.73,.14]);if(halo){for(const x of [-1,1])rod(body,p.black,[x*.3,.78,-.03],[x*.28,1.2,.04],.034);rod(body,p.black,[-.28,1.2,.04],[.28,1.2,.04],.034);rod(body,p.black,[0,1.2,.04],[0,1.08,-.45],.034);}for(const x of [-1,1])oval(body,p.light,[x*.27,.66,-1.19],[.065,.055,.03]);
 detail(body,'front-wing',g=>{box(g,accent,[1.88,.035,.18],[0,.24,-1.5],.01);for(const x of [-.87,.87]){box(g,stripe,[.07,.3,.43],[x,.35,-1.42],.018);box(g,p.carbon,[.38,.025,.08],[x*.72,.31,-1.28],.006);}});
 detail(body,'rear-wing',g=>{box(g,p.carbon,[1.66,.035,.11],[0,1.22,1.37],.01);for(const x of [-.88,.88])box(g,stripe,[.07,.31,.38],[x,1.34,1.25],.018);});
 detail(body,'sidepods',g=>{for(const x of [-1,1]){box(g,accent,[.18,.24,.92],[x*.56,.62,.26],.045);box(g,p.black,[.035,.14,.42],[x*.66,.64,-.03],.015);for(let i=0;i<3;i++)box(g,stripe,[.02,.025,.34],[x*.68,.6+i*.055,-.03],.004);}});
 detail(body,'suspension',g=>{for(const x of [-1,1])for(const z of [-.98,.98]){rod(g,p.carbon,[x*.35,.48,z-.18],[x*.88,.49,z],.025);rod(g,p.carbon,[x*.36,.69,z+.16],[x*.88,.49,z],.025);spring(g,p.alloy,[x*.58,.72,z],[x*.81,.5,z],.012,7);}});
 if(halo){
  detail(body,'halo',g=>{for(const x of [-1,1])rod(g,p.black,[x*.31,.77,-.03],[x*.29,1.24,.05],.042);rod(g,p.black,[-.29,1.24,.05],[.29,1.24,.05],.042);rod(g,p.black,[0,1.24,.05],[0,1.08,-.47],.042);});
  detail(body,'airbox',g=>{wedge(g,accent,{z:.68,y:1.05,length:.45,front:.13,rear:.22,bottom:.54,frontTop:.73,rearTop:.84});box(g,p.black,[.26,.08,.18],[0,1.12,.48],.018);});
  detail(body,'number-01',g=>{numberMark(g,p,1,{y:1.04,z:-.63,scale:1.5});box(g,p.white,[.15,.025,.48],[-.27,1.04,-.63],.006);});
 }else{
  detail(body,'open-cockpit',g=>{for(const x of [-1,1])rod(g,p.yellow,[x*.3,.77,-.16],[x*.31,.91,.45],.035);box(g,p.black,[.5,.07,.15],[0,.81,.53],.02);});
  detail(body,'purple-rims',g=>{for(const x of [-1,1])for(const z of [-.98,.98]){const cap=part(g,new THREE.CylinderGeometry(.21,.21,.025,18),p.violet,x*.94,.5,z);cap.rotation.z=Math.PI/2;}});
  detail(body,'number-7',g=>numberMark(g,p,7,{y:1.04,z:-.63,scale:1.55}));
 }
 const {wheels,front}=addWheels(group,p,{x:.92,z:.98,radius:.48,width:.35,rim:halo?p.lime:p.violet,slick:true});return finish(model,group,body,p,driver,front,wheels,exhaust(group,[[-.23,.44,1.5],[.23,.44,1.5]]));
}
function buildSolarFormula(color){return formulaBase('apex-formula',color,{primary:'yellow',secondary:'cyan',third:'coral',number:7});}
function buildVoltFormula(color){return formulaBase('formula-x',color,{primary:'lime',secondary:'violet',third:'paint',number:1,halo:true});}

function buildMuscleGT(color){
 const model='muscle-gt',group=new THREE.Group(),body=new THREE.Group(),p=palette(color);group.add(body);
 box(body,p.carbon,[1.58,.13,2.68],[0,.36,0]);wedge(body,p.red,{z:-.22,length:2.46,front:.63,rear:.78,bottom:.4,frontTop:.69,rearTop:.84});box(body,p.red,[1.42,.46,1.14],[0,.76,.04],.14);
 wedge(body,p.glass,{z:.25,length:.74,front:.49,rear:.52,bottom:.88,frontTop:1.18,rearTop:1.22});box(body,p.red,[1.12,.16,.28],[0,1.22,.59],.07);box(body,p.black,[.6,.22,.48],[0,1.08,-.62],.055);
 for(const x of [-1,1]){box(body,p.red,[.55,.38,.82],[x*.7,.62,-.92],.12);box(body,p.red,[.55,.38,.78],[x*.7,.62,.91],.12);oval(body,p.light,[x*.47,.67,-1.43],[.2,.08,.035]);box(body,p.paint,[.075,.075,1.78],[x*.56,.84,-.03],.018);}
 box(body,p.white,[.17,.05,2.42],[-.16,1.015,-.1],.01);box(body,p.white,[.17,.05,2.42],[.16,1.015,-.1],.01);box(body,p.black,[1.15,.23,.08],[0,.55,-1.51],.016);spoiler(body,p.red,p,{wide:1.76,height:1.25,z:1.27});numberMark(body,p,24,{y:1.01,z:-.36});
 detail(body,'enclosed-cabin',g=>{box(g,p.red,[1.7,.32,1.36],[0,.76,.22],.13);for(const x of [-1,1]){rod(g,p.red,[x*.58,.86,-.23],[x*.52,1.3,.08],.04);rod(g,p.red,[x*.52,1.3,.08],[x*.58,1.28,.65],.04);box(g,p.glass,[.035,.32,.48],[x*.56,1.08,.35],.012);}box(g,p.glass,[1.04,.36,.055],[0,1.08,-.23],.018);box(g,p.red,[1.14,.08,.76],[0,1.32,.34],.025);});
 detail(body,'hood-scoop',g=>{wedge(g,p.red,{z:-.67,y:1.08,length:.48,front:.25,rear:.34,bottom:.53,frontTop:.68,rearTop:.73});box(g,p.black,[.55,.09,.2],[0,1.12,-.83],.02);});
 detail(body,'twin-stripes',g=>{for(const x of [-.16,.16]){box(g,p.white,[.16,.028,.72],[x,1.08,-.64],.006);box(g,p.white,[.16,.028,.56],[x,1.29,.34],.006);box(g,p.white,[.16,.028,.55],[x,.95,.91],.006);}});
 detail(body,'wide-fenders',g=>{box(g,p.red,[1.9,.34,2.25],[0,.59,-.03],.14);wedge(g,p.red,{z:-.15,y:.72,length:2.45,front:.82,rear:.91,bottom:.4,frontTop:.72,rearTop:.88});for(const x of [-1,1])for(const z of [-.95,.95]){box(g,p.red,[.58,.44,.88],[x*.78,.69,z],.14);box(g,p.red,[.22,.25,.72],[x*.88,.58,z],.05);}});
 detail(body,'front-grille',g=>{box(g,p.black,[1.12,.25,.045],[0,.57,-1.53],.015);for(const x of [-.45,-.3,-.15,0,.15,.3,.45])box(g,p.alloy,[.025,.17,.018],[x,.57,-1.56],.004);for(const x of [-1,1])for(let i=0;i<3;i++)box(g,p.light,[.11,.035,.02],[x*.47+i*x*.1,.68,-1.55],.006);});
 detail(body,'rear-wing',g=>{for(const x of [-.72,.72])box(g,p.black,[.055,.31,.11],[x,1.2,1.27],.015);box(g,p.red,[1.84,.08,.31],[0,1.34,1.27],.025);for(const x of [-.9,.9])box(g,p.white,[.05,.08,.31],[x,1.34,1.27],.01);});
 detail(body,'number-24',g=>{numberMark(g,p,24,{y:1.38,z:.28,scale:1.5});for(const x of [-1,1])box(g,p.white,[.03,.3,.38],[x*.72,.87,.15],.008);});
 const {wheels,front}=addWheels(group,p,{x:.87,z:.95,radius:.53,width:.4,rim:p.red,slick:true});const driver=dummyDriver(group);return finish(model,group,body,p,driver,front,wheels,exhaust(group,[[-.36,.45,1.49],[.36,.45,1.49]]));
}

const BUILDERS={apex:buildMonsterBuggy,motorcycle:buildMotorcycle,roadster:buildNova88,'apex-formula':buildSolarFormula,'formula-x':buildVoltFormula,'muscle-gt':buildMuscleGT};
export function buildVehicle({car='apex',color=0x1859b7}={}){const model=normalizeCar(car);return BUILDERS[model](color);}
