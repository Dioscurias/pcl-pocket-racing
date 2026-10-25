import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {buildVehicle,preloadVehicleAssets,vehicleAssetsReady,VEHICLE_SCALE,rollVehicleWheels,rigOriginalWheels} from '../src/vehicles.js';
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
 assert.deepEqual(CARS.map(car=>car.visualScale),[1.03,.86,.97,1.05]);
 assert.ok(CARS.find(car=>car.type==='motorcycle').visualScale<Math.min(...CARS.filter(car=>car.type!=='motorcycle').map(car=>car.visualScale)));
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
  assert.ok(vehicle.exhaust.isGroup);
  assert.equal(vehicle.wheels.length,car.type==='motorcycle'?2:4,`${car.id} needs visible rolling wheels`);
  assert.equal(vehicle.front.length,car.type==='motorcycle'?1:2,`${car.id} needs steerable front wheels`);
  assert.ok(vehicle.wheels.every(wheel=>wheel.userData.roll?.isGroup));
  assert.ok(vehicle.wheels.every(wheel=>wheel.getObjectByName('animated-wheel-tire')));
  assert.ok(vehicle.wheels.every(wheel=>wheel.getObjectByName('animated-wheel-rim').material.color.getHex()===0x28ccff));
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

test('wheel rotation advances from signed travel and exposes readable tread',()=>{
 const vehicle=buildVehicle({car:'apex',color:0xf04fa3}),before=vehicle.wheels.map(wheel=>wheel.userData.roll.rotation.x);
 rollVehicleWheels(vehicle.wheels,2.3);
 assert.ok(vehicle.wheels.every((wheel,index)=>wheel.userData.roll.rotation.x!==before[index]));
 assert.ok(vehicle.wheels.every(wheel=>wheel.userData.radius>0));
 assert.ok(Math.abs(vehicle.wheels[0].userData.roll.rotation.x+2.3/vehicle.wheels[0].userData.radius)<1e-8);
 assert.ok(vehicle.wheels.every(wheel=>wheel.userData.roll.getObjectByName('animated-wheel-tread')?.count===12));
});

test('every supplied vehicle exposes proportional wheel dimensions',async()=>{
 const {WHEEL_LAYOUTS}=await import('../src/vehicles.js');
 for(const car of CARS){
  const layout=WHEEL_LAYOUTS[car.id],count=car.type==='motorcycle'?2:4;
  assert.equal(layout.positions.length,count);
  assert.ok(layout.positions.every((_,index)=>(layout.radii?.[index]||layout.radius)>.3));
  assert.ok(layout.positions.every((_,index)=>(layout.widths?.[index]||layout.width)<(layout.radii?.[index]||layout.radius)));
 }
});

test('baked vehicle triangles are extracted into original-material wheel pivots',()=>{
 const centers=[[-.83,.57,-.94],[.83,.57,-.94],[-.83,.57,.9],[.83,.57,.9]],positions=[];
 for(const [x,y,z] of centers)for(let triangle=0;triangle<90;triangle++){const angle=triangle/90*Math.PI*2,r=.44;positions.push(x,y+Math.sin(angle)*r,z+Math.cos(angle)*r,x+.02,y+Math.sin(angle+.03)*r,z+Math.cos(angle+.03)*r,x-.02,y+Math.sin(angle+.06)*r,z+Math.cos(angle+.06)*r);}
 positions.push(-.2,.7,0,.2,.7,0,0,1,0);const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();const material=new THREE.MeshStandardMaterial({map:new THREE.Texture()}),model=new THREE.Group(),mesh=new THREE.Mesh(geometry,material),body=new THREE.Group();model.add(mesh);body.add(model);
 const rig=rigOriginalWheels(body,model,CARS[0]);assert.ok(rig);assert.equal(body.userData.wheelRig,'original-asset');assert.equal(rig.wheels.length,4);assert.ok(rig.wheels.every(wheel=>wheel.getObjectByName('asset-wheel-rubber')?.material===material));assert.equal(body.getObjectByName('animated-wheel-tread'),undefined);
});

test('supplied PBR car materials keep texture contrast and environment reflections',()=>{
 const {group}=buildVehicle({car:'roadster'}),materials=[];
 group.traverse(object=>{if(object.isMesh&&object.name.startsWith('source:'))materials.push(object.material);});
 assert.ok(materials.length);
 assert.ok(materials.every(material=>material.roughness<=.58));
 assert.ok(materials.every(material=>material.envMapIntensity>=1.25));
});

test('failed asset requests retry and never report the supplied roster as ready',async()=>{
 let attempts=0;const results=await preloadVehicleAssets({loadAsync:async()=>{attempts++;throw new Error('offline');}},{retries:1});
 assert.equal(attempts,CARS.length*2);assert.equal(results.every(result=>result.loaded===false),true);assert.equal(vehicleAssetsReady(),false);
});
