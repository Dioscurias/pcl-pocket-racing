import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildVehicle,VEHICLE_SCALE} from '../src/vehicles.js';
import {KART_RADIUS} from '../src/simulation.js';
import {CARS} from '../src/car-catalog.js';

test('kart model and collision footprint use the approved miniature scale',()=>{assert.equal(VEHICLE_SCALE,.65);assert.equal(KART_RADIUS,.56);const {group}=buildVehicle();assert.equal(group.scale.x,.65);assert.equal(group.scale.y,.65);assert.equal(group.scale.z,.65);});

test('catalog contains only the six approved blueprint vehicles',()=>{
 assert.deepEqual(CARS.map(car=>[car.id,car.name]),[
  ['apex','Monster Buggy'],
  ['motorcycle','Velocity Bike'],
  ['roadster','Nova 88'],
  ['apex-formula','Solar Formula'],
  ['formula-x','Volt Formula'],
  ['muscle-gt','Muscle GT'],
 ]);
 assert.equal(CARS.some(car=>car.id==='coupe'),false);
});

test('six finite, distinct vehicle bodies follow their blueprint contracts',()=>{
 const signatures=[];
 for(const car of CARS){const vehicle=buildVehicle({car:car.id,color:0x1859b7});
  assert.equal(vehicle.model,car.id);assert.equal(vehicle.paint.color.getHex(),0x1859b7);
   assert.equal(vehicle.group.userData.blueprint,car.id);
  assert.equal(vehicle.wheels.length,car.type==='motorcycle'?2:4);assert.equal(vehicle.front.length,car.type==='motorcycle'?1:2);
  for(const wheel of vehicle.wheels){assert.ok(wheel.userData.roll.isGroup);assert.notEqual(wheel,wheel.userData.roll);}
  const bounds=new THREE.Box3().setFromObject(vehicle.group),size=bounds.getSize(new THREE.Vector3());
  assert.ok(size.x<2.7&&size.z<4&&bounds.min.y>=-.015,JSON.stringify({car:car.id,size,min:bounds.min}));
  let signature=0,meshes=0;vehicle.group.traverse(o=>{if(o.isMesh){meshes++;const positions=o.geometry.getAttribute('position');for(let i=0;i<positions.array.length;i++){const v=positions.array[i];assert.ok(Number.isFinite(v));signature+=v*((i%17)+1);}}});
  assert.ok(meshes<40,`${car.id}: ${meshes} draw calls`);signatures.push(signature);
 }
 assert.equal(new Set(signatures).size,6);
});

test('motorcycle has its own agile handling profile and lean pivot',()=>{
 const bike=CARS.find(car=>car.type==='motorcycle'),kart=CARS.find(car=>car.id==='apex');
 assert.ok(bike.handling.acceleration>kart.handling.acceleration);
 assert.ok(bike.handling.steering>kart.handling.steering);
 assert.ok(bike.handling.radius<kart.handling.radius);
 const vehicle=buildVehicle({car:bike.id});assert.ok(vehicle.lean?.isGroup);
});
