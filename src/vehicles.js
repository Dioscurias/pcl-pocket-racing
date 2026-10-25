import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CARS,carById,normalizeCar} from './car-catalog.js';

export const VEHICLE_SCALE=.65;
const templates=new Map();
const successfulAssets=new Set();
let preloaded=false;

function cloneModel(template){
 const clone=template.clone(true);
 clone.traverse(object=>{
  if(!object.isMesh)return;
  object.geometry=object.geometry.clone();
  object.material=Array.isArray(object.material)?object.material.map(material=>material.clone()):object.material.clone();
  const materials=Array.isArray(object.material)?object.material:[object.material];
  for(const material of materials){
   if(material.map)material.map.colorSpace=THREE.SRGBColorSpace;
   if(material.isMeshStandardMaterial){material.roughness=Math.min(material.roughness,.55);material.envMapIntensity=1.35;}
   material.needsUpdate=true;
  }
  object.castShadow=true;object.receiveShadow=true;
 });
 return clone;
}

export const WHEEL_LAYOUTS=Object.freeze({
 apex:{radius:.577,width:.536,positions:[[-.809,.608,-.906],[.809,.608,-.906],[-.809,.649,.937],[.809,.649,.937]]},
 motorcycle:{radius:.421,width:.215,positions:[[0,.43,-.843],[0,.447,.791]]},
 roadster:{radius:.388,width:.291,positions:[[-.694,.398,-.834],[.694,.398,-.834],[-.65,.417,.815],[.65,.417,.815]],widths:[.291,.291,.213,.213]},
 'apex-formula':{radius:.42,width:.294,positions:[[-.903,.462,-.945],[.903,.462,-.945],[-.845,.599,.903],[.845,.599,.903]],radii:[.42,.42,.452,.452],widths:[.294,.294,.189,.189]},
});

function fallbackWheels(parent,car,color){
 const layout=WHEEL_LAYOUTS[car.id],wheels=[],front=[];
 const tireMaterial=new THREE.MeshStandardMaterial({color:0x111419,roughness:.7,metalness:.08,envMapIntensity:1.1});
 const rimMaterial=new THREE.MeshStandardMaterial({color,roughness:.24,metalness:.72,envMapIntensity:1.5});
 const hubMaterial=new THREE.MeshStandardMaterial({color:0xdce5eb,roughness:.22,metalness:.86,envMapIntensity:1.6});
 for(const [index,[x,y,z]] of layout.positions.entries()){
  const steer=new THREE.Group(),roll=new THREE.Group();
  steer.name=`wheel-${index<2?'front':'rear'}-${index%2?'right':'left'}`;steer.position.set(x,y,z);steer.add(roll);steer.userData.roll=roll;steer.userData.radius=(layout.radii?.[index]||layout.radius)*VEHICLE_SCALE;
  const tire=new THREE.Mesh(new THREE.TorusGeometry(layout.radius-layout.width*.28,layout.width*.28,12,24),tireMaterial.clone());
  tire.name='animated-wheel-tire';tire.rotation.y=Math.PI/2;tire.castShadow=true;roll.add(tire);
  const rim=new THREE.Mesh(new THREE.CylinderGeometry(layout.radius*.49,layout.radius*.49,layout.width*1.06,18),rimMaterial.clone());
  rim.name='animated-wheel-rim';rim.rotation.z=Math.PI/2;rim.castShadow=true;roll.add(rim);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(layout.radius*.13,layout.radius*.13,layout.width*1.14,12),hubMaterial.clone());
  hub.rotation.z=Math.PI/2;hub.castShadow=true;roll.add(hub);
  for(let spoke=0;spoke<5;spoke++){
   const bar=new THREE.Mesh(new THREE.BoxGeometry(layout.width*1.16,layout.radius*.68,.045),hubMaterial.clone());
   bar.rotation.x=spoke*Math.PI/5;bar.castShadow=true;roll.add(bar);
  }
  const treadMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(layout.width*1.04,.052,layout.radius*.2),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.68,metalness:.04,envMapIntensity:1.1}),12),treadTransform=new THREE.Object3D();treadMesh.name='animated-wheel-tread';treadMesh.castShadow=true;for(let tread=0;tread<12;tread++){const angle=tread*Math.PI/6;treadTransform.position.set(0,Math.sin(angle)*(layout.radius-.018),Math.cos(angle)*(layout.radius-.018));treadTransform.rotation.set(angle,0,0);treadTransform.updateMatrix();treadMesh.setMatrixAt(tread,treadTransform.matrix);treadMesh.setColorAt(tread,new THREE.Color(tread%4===0?0xbcc5cb:tread%2?0x111418:0x30363d));}treadMesh.instanceMatrix.needsUpdate=true;treadMesh.instanceColor.needsUpdate=true;roll.add(treadMesh);
  parent.add(steer);wheels.push(steer);if(index<2&&car.type!=='motorcycle'||index===0&&car.type==='motorcycle')front.push(steer);
 }
 return {wheels,front};
}

function subsetGeometry(source,triangles,matrix=null,center=null){
 const geometry=new THREE.BufferGeometry(),normalMatrix=matrix?new THREE.Matrix3().getNormalMatrix(matrix):null,point=new THREE.Vector3(),normal=new THREE.Vector3();
 for(const [name,attribute] of Object.entries(source.attributes)){
  if(attribute.itemSize>4)continue;const values=[];
  for(const triangle of triangles)for(let corner=0;corner<3;corner++){const index=triangle*3+corner;if(name==='position'&&matrix){point.fromBufferAttribute(attribute,index).applyMatrix4(matrix);if(center)point.sub(center);values.push(point.x,point.y,point.z);continue;}if(name==='normal'&&normalMatrix){normal.fromBufferAttribute(attribute,index).applyNormalMatrix(normalMatrix);values.push(normal.x,normal.y,normal.z);continue;}for(let component=0;component<attribute.itemSize;component++)values.push(component===0?attribute.getX(index):component===1?attribute.getY(index):component===2?attribute.getZ(index):attribute.getW(index));}
  geometry.setAttribute(name,new THREE.BufferAttribute(new attribute.array.constructor(values),attribute.itemSize,attribute.normalized));
 }
 geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}

export function rigOriginalWheels(body,model,car){
 const layout=WHEEL_LAYOUTS[car.id],wheels=[],front=[],centers=layout.positions.map(position=>new THREE.Vector3(...position)),rolls=[];
 for(const [index,center] of centers.entries()){const steer=new THREE.Group(),roll=new THREE.Group();steer.name=`wheel-${index<2?'front':'rear'}-${index%2?'right':'left'}`;steer.position.copy(center);steer.add(roll);steer.userData.roll=roll;steer.userData.radius=(layout.radii?.[index]||layout.radius)*VEHICLE_SCALE;wheels.push(steer);rolls.push(roll);if(index<2&&car.type!=='motorcycle'||index===0&&car.type==='motorcycle')front.push(steer);}
 body.updateMatrixWorld(true);const inverseBody=new THREE.Matrix4().copy(body.matrixWorld).invert(),candidates=[],counts=centers.map(()=>0);
 model.traverse(mesh=>{if(!mesh.isMesh||!mesh.geometry?.attributes?.position)return;const source=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone(),toBody=new THREE.Matrix4().multiplyMatrices(inverseBody,mesh.matrixWorld),position=source.attributes.position,uv=source.attributes.uv,sample=textureSampler(Array.isArray(mesh.material)?mesh.material[0]:mesh.material),point=new THREE.Vector3(),triangles=Array.from({length:centers.length},()=>[]),bodyTriangles=[];
  for(let triangle=0;triangle<position.count/3;triangle++){point.set(0,0,0);let u=0,v=0;for(let corner=0;corner<3;corner++){const vertex=triangle*3+corner,p=new THREE.Vector3().fromBufferAttribute(position,vertex).applyMatrix4(toBody);point.add(p);if(uv){u+=uv.getX(vertex);v+=uv.getY(vertex);}}point.multiplyScalar(1/3);u/=3;v/=3;const dark=sample?sample(u,v)<.3:true;let wheel=-1,best=Infinity;for(let index=0;index<centers.length;index++){const center=centers[index],radius=layout.radii?.[index]||layout.radius,width=layout.widths?.[index]||layout.width,axle=Math.abs(point.x-center.x),radial=Math.hypot(point.y-center.y,point.z-center.z),score=axle/width+radial/radius,isTire=radial>=radius*.52;if(axle<=width*.57&&radial<=radius*1.06&&(isTire||dark)&&score<best){wheel=index;best=score;}}if(wheel<0)bodyTriangles.push(triangle);else{triangles[wheel].push(triangle);counts[wheel]++;}}
  candidates.push({mesh,source,toBody,bodyTriangles,triangles});
 });
 if(counts.some(count=>count<80))return null;
 for(const {mesh,source,toBody,bodyTriangles,triangles} of candidates){mesh.geometry=subsetGeometry(source,bodyTriangles);for(let index=0;index<triangles.length;index++){if(!triangles[index].length)continue;const wheelMesh=new THREE.Mesh(subsetGeometry(source,triangles[index],toBody,centers[index]),mesh.material);wheelMesh.name='asset-wheel-rubber';wheelMesh.castShadow=true;wheelMesh.receiveShadow=true;rolls[index].add(wheelMesh);}}
 for(const wheel of wheels)body.add(wheel);body.userData.wheelRig='original-asset';body.userData.wheelTriangles=counts;return{wheels,front};
}

function textureSampler(material){
 const image=material?.map?.image;if(typeof document==='undefined'||!image)return null;try{const size=512,canvas=document.createElement('canvas');canvas.width=canvas.height=size;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0,size,size);const pixels=context.getImageData(0,0,size,size).data;return(u,v)=>{const x=Math.min(size-1,Math.max(0,Math.floor((u-Math.floor(u))*size))),y=Math.min(size-1,Math.max(0,Math.floor((1-(v-Math.floor(v)))*size))),offset=(y*size+x)*4;return(pixels[offset]*.2126+pixels[offset+1]*.7152+pixels[offset+2]*.0722)/255;};}catch{return null;}
}

export function rollVehicleWheels(wheels,distance,radius=.46){for(const wheel of wheels)wheel.userData.roll.rotation.x-=distance/(wheel.userData.radius||radius);}

function normalizeTemplate(scene,car){
 const source=scene.clone(true),template=new THREE.Group();
 source.rotation.y=car.modelYaw;template.add(source);template.updateMatrixWorld(true);
 let bounds=new THREE.Box3().setFromObject(template),size=bounds.getSize(new THREE.Vector3());
 const scale=car.modelLength*(car.visualScale||1)/Math.max(size.x,size.z);template.scale.setScalar(scale);template.updateMatrixWorld(true);
 bounds=new THREE.Box3().setFromObject(template);const center=bounds.getCenter(new THREE.Vector3());
 template.position.set(-center.x,-bounds.min.y,-center.z);template.updateMatrixWorld(true);
 template.name=`asset:${car.id}`;template.userData.source=car.asset;
 template.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
 return template;
}

function fallbackTemplate(car){
 const group=new THREE.Group(),material=new THREE.MeshStandardMaterial({color:0x272d38,roughness:.35,metalness:.4});
 const size=car.type==='motorcycle'?[.65,1.05,2.5]:[1.55,.8,2.65];
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);mesh.position.y=size[1]/2;mesh.name=`fallback:${car.id}`;mesh.castShadow=true;group.add(mesh);group.name=`asset:${car.id}`;return group;
}

export async function preloadVehicleAssets(loader=new GLTFLoader(),{retries=1,onProgress=()=>{}}={}){
 templates.clear();successfulAssets.clear();preloaded=false;let completed=0;
 const results=await Promise.all(CARS.map(async car=>{
  let error;
  for(let attempt=0;attempt<=retries;attempt++)try{const gltf=await loader.loadAsync(car.asset);templates.set(car.id,normalizeTemplate(gltf.scene,car));successfulAssets.add(car.id);onProgress(++completed,CARS.length,car.id);return {id:car.id,loaded:true};}catch(cause){error=cause;}
  onProgress(++completed,CARS.length,car.id);return {id:car.id,loaded:false,error};
 }));
 preloaded=true;return results;
}

export const vehicleAssetsReady=()=>preloaded&&successfulAssets.size===CARS.length;

function glowMarker(group,color,car){
 const paint=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.28,roughness:.3,metalness:.15,side:THREE.DoubleSide}),glowPaint=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.68,depthWrite:false,blending:THREE.AdditiveBlending});
 const glow=new THREE.Mesh(new THREE.RingGeometry(.52,1.08,36),glowPaint);glow.rotation.x=-Math.PI/2;glow.position.y=.035;glow.name='player-color-underglow';glow.renderOrder=2;group.add(glow);
 const lamps=new THREE.Group();lamps.name='player-color-markers';for(const x of [-.7,.7]){const lamp=new THREE.Mesh(new THREE.SphereGeometry(.075,10,8),paint);lamp.position.set(x,.45,-1.15);lamps.add(lamp);}group.add(lamps);
 const marker=new THREE.Group(),height=car.type==='motorcycle'?2.72:car.id==='apex'?2.25:1.92,x=car.type==='motorcycle'?.42:.78,z=.72;
 marker.name='player-color-flag';const pole=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,height-.38,8),new THREE.MeshStandardMaterial({color:0xf4f5f1,metalness:.55,roughness:.3}));pole.position.set(x,(height+.38)/2,z);marker.add(pole);
 const flagShape=new THREE.Shape();flagShape.moveTo(0,0);flagShape.lineTo(-.56,-.11);flagShape.lineTo(0,-.3);flagShape.closePath();const flag=new THREE.Mesh(new THREE.ShapeGeometry(flagShape),paint);flag.position.set(x,height,z);marker.add(flag);const beacon=new THREE.Mesh(new THREE.SphereGeometry(.09,12,10),paint);beacon.position.set(x,height+.055,z);marker.add(beacon);group.add(marker);return paint;
}

function exhaustEffect(parent,car){
 const exhaust=new THREE.Group();exhaust.name='boost-exhaust';parent.add(exhaust);
 for(const [x,y,z] of car.exhaust){
  const flame=new THREE.Mesh(new THREE.ConeGeometry(.1,.62,12),new THREE.MeshBasicMaterial({color:0xaeefff,transparent:true,opacity:.88,depthWrite:false,blending:THREE.AdditiveBlending}));
  flame.position.set(x,y,z);flame.rotation.x=Math.PI/2;exhaust.add(flame);
 }
 exhaust.visible=false;return exhaust;
}

export function buildVehicle({car='apex',color=0x1859b7}={}){
 const model=normalizeCar(car),meta=carById(model),group=new THREE.Group(),body=new THREE.Group(),driver=new THREE.Group();
 const lean=meta.type==='motorcycle'?new THREE.Group():null,root=lean||body;
 if(lean){group.add(lean);lean.add(body);}else group.add(body);
 const template=templates.get(model)||fallbackTemplate(meta),asset=cloneModel(template);body.add(asset);body.name='vehicle-body';driver.name='driver-animation';body.add(driver);
 const rig=successfulAssets.has(model)?rigOriginalWheels(body,asset,meta):null,{wheels,front}=rig||fallbackWheels(body,meta,color),paint=glowMarker(group,color,meta),exhaust=exhaustEffect(body,meta);
 group.name=`vehicle-${model}`;group.userData.model=model;group.userData.asset=meta.asset;group.userData.blueprint='supplied-glb';group.scale.setScalar(VEHICLE_SCALE);
 return {group,body,paint,driver,front,wheels,exhaust,model,...(lean?{lean}:{})};
}
