import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CARS,carById,normalizeCar} from './car-catalog.js';

export const VEHICLE_SCALE=.65;
const templates=new Map();
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
   material.needsUpdate=true;
  }
  object.castShadow=true;object.receiveShadow=true;
 });
 return clone;
}

function normalizeTemplate(scene,car){
 const source=scene.clone(true),template=new THREE.Group();
 source.rotation.y=car.modelYaw;template.add(source);template.updateMatrixWorld(true);
 let bounds=new THREE.Box3().setFromObject(template),size=bounds.getSize(new THREE.Vector3());
 const scale=car.modelLength/Math.max(size.x,size.z);template.scale.setScalar(scale);template.updateMatrixWorld(true);
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

export async function preloadVehicleAssets(loader=new GLTFLoader()){
 const results=await Promise.all(CARS.map(async car=>{
  try{const gltf=await loader.loadAsync(car.asset);templates.set(car.id,normalizeTemplate(gltf.scene,car));return {id:car.id,loaded:true};}
  catch(error){templates.set(car.id,fallbackTemplate(car));return {id:car.id,loaded:false,error};}
 }));
 preloaded=true;return results;
}

export const vehicleAssetsReady=()=>preloaded&&CARS.every(car=>templates.has(car.id));

function glowMarker(group,color){
 const paint=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.74,depthWrite:false,blending:THREE.AdditiveBlending});
 const glow=new THREE.Mesh(new THREE.RingGeometry(.52,1.08,36),paint);glow.rotation.x=-Math.PI/2;glow.position.y=.035;glow.name='player-color-underglow';glow.renderOrder=2;group.add(glow);
 const lamps=new THREE.Group();lamps.name='player-color-markers';for(const x of [-.7,.7]){const lamp=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),paint);lamp.position.set(x,.45,-1.15);lamps.add(lamp);}group.add(lamps);return paint;
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
 const template=templates.get(model)||fallbackTemplate(meta);body.add(cloneModel(template));body.name='vehicle-body';driver.name='driver-animation';body.add(driver);
 const paint=glowMarker(group,color),exhaust=exhaustEffect(body,meta);
 group.name=`vehicle-${model}`;group.userData.model=model;group.userData.asset=meta.asset;group.userData.blueprint='supplied-glb';group.scale.setScalar(VEHICLE_SCALE);
 return {group,body,paint,driver,front:[],wheels:[],exhaust,model,...(lean?{lean}:{})};
}
