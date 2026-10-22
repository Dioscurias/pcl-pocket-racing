import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {buildVehicle,preloadVehicleAssets,vehicleAssetsReady,VEHICLE_SCALE} from '../src/vehicles.js';
import {KART_RADIUS} from '../src/simulation.js';
import {CARS} from '../src/car-catalog.js';

test('catalog contains only the four unique supplied designs',()=>{
 assert.deepEqual(CARS.map(car=>[car.id,car.name,car.asset]),[
  ['apex','Monster Buggy','/vehicles/monster.glb'],
  ['motorcycle','Velocity Bike','/vehicles/motorcycle.glb'],
  ['roadster','Nova 88','/vehicles/speed.glb'],
  ['apex-formula','Apex Formula','/vehicles/formula.glb'],
 ]);
 assert.equal(new Set(CARS.map(car=>car.asset)).size,CARS.length);
});

test('every selected model is a real embedded GLB asset',async()=>{
 for(const car of CARS){
  const bytes=await readFile(new URL(`../public${car.asset}`,import.meta.url));
  assert.equal(bytes.subarray(0,4).toString(),'glTF');
  assert.ok(bytes.length>5_000_000,`${car.id} should use the supplied detailed model`);
 }
});

test('supplied meshes preload, normalize, clone and preserve the scene animation contract',async()=>{
 const sizes={apex:[1,.7,.7],motorcycle:[.5,.9,1],roadster:[1,.47,.58],'apex-formula':[.66,.46,1]};
 const loader={loadAsync:async url=>{
  const id=CARS.find(car=>car.asset===url).id,group=new THREE.Group();
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(...sizes[id]),new THREE.MeshStandardMaterial());
  mesh.name=`source:${id}`;group.add(mesh);return {scene:group};
 }};
 await preloadVehicleAssets(loader);
 assert.equal(vehicleAssetsReady(),true);
 const instances=[];
 for(const car of CARS){
  const vehicle=buildVehicle({car:car.id,color:0x28ccff});instances.push(vehicle);
  assert.equal(vehicle.model,car.id);assert.equal(vehicle.group.userData.asset,car.asset);
  assert.equal(vehicle.group.scale.x,VEHICLE_SCALE);assert.ok(vehicle.body.isGroup);assert.ok(vehicle.driver.isGroup);
  assert.ok(vehicle.exhaust.isGroup);assert.deepEqual(vehicle.wheels,[]);assert.deepEqual(vehicle.front,[]);
  assert.ok(vehicle.group.getObjectByName(`source:${car.id}`));
  const flag=vehicle.group.getObjectByName('player-color-flag');assert.ok(flag?.isGroup);assert.equal(vehicle.paint.color.getHex(),0x28ccff);
  const bounds=new THREE.Box3().setFromObject(vehicle.group);
  assert.ok(bounds.min.y>=-.02,`${car.id} should sit on the ground`);
  assert.ok(bounds.max.y<2.5,`${car.id} should remain toy sized`);
 }
 assert.notEqual(instances[0].group.getObjectByName('source:apex'),instances[1].group.getObjectByName('source:motorcycle'));
});

test('kart model and collision footprint keep the approved miniature scale',()=>{
 assert.equal(VEHICLE_SCALE,.65);assert.equal(KART_RADIUS,.56);
 const {group}=buildVehicle();assert.deepEqual(group.scale.toArray(),[.65,.65,.65]);
});

test('motorcycle keeps its dedicated handling and lean mechanism',()=>{
 const bike=CARS.find(car=>car.type==='motorcycle'),kart=CARS.find(car=>car.id==='apex');
 assert.ok(bike.handling.acceleration>kart.handling.acceleration);
 assert.ok(bike.handling.steering>kart.handling.steering);
 assert.ok(bike.handling.radius<kart.handling.radius);
 assert.ok(buildVehicle({car:bike.id}).lean?.isGroup);
});

test('failed asset requests retry and never report the supplied roster as ready',async()=>{
 let attempts=0;const results=await preloadVehicleAssets({loadAsync:async()=>{attempts++;throw new Error('offline');}},{retries:1});
 assert.equal(attempts,CARS.length*2);assert.equal(results.every(result=>result.loaded===false),true);assert.equal(vehicleAssetsReady(),false);
});
