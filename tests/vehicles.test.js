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
 const requiredDetails={
  apex:['enclosed-cabin','roof-scoop','exposed-suspension','knobby-tires','rear-wing','front-bumper','number-55'],
  motorcycle:['full-fairing','windscreen','rider','disc-brakes','exhaust','mirrors','yellow-trim'],
  roadster:['bubble-canopy','covered-fenders','loop-wing','led-lights','side-intakes','diffuser','number-88'],
  'apex-formula':['open-cockpit','front-wing','rear-wing','sidepods','suspension','purple-rims','number-7'],
  'formula-x':['halo','front-wing','rear-wing','sidepods','suspension','airbox','number-01'],
  'muscle-gt':['enclosed-cabin','hood-scoop','twin-stripes','wide-fenders','front-grille','rear-wing','number-24'],
 };
 const signatures=[];
 for(const car of CARS){const vehicle=buildVehicle({car:car.id,color:0x1859b7});
  assert.equal(vehicle.model,car.id);assert.equal(vehicle.paint.color.getHex(),0x1859b7);
   assert.equal(vehicle.group.userData.blueprint,car.id);
  assert.equal(vehicle.wheels.length,car.type==='motorcycle'?2:4);assert.equal(vehicle.front.length,car.type==='motorcycle'?1:2);
  for(const wheel of vehicle.wheels){assert.ok(wheel.userData.roll.isGroup);assert.notEqual(wheel,wheel.userData.roll);}
  const bounds=new THREE.Box3().setFromObject(vehicle.group),size=bounds.getSize(new THREE.Vector3());
  assert.ok(size.x<2.7&&size.z<4&&bounds.min.y>=-.015,JSON.stringify({car:car.id,size,min:bounds.min}));
  let signature=0,meshes=0,vertices=0;const detailNames=[];vehicle.group.traverse(o=>{if(o.name.startsWith('detail:'))detailNames.push(o.name.slice(7));if(o.isMesh){meshes++;const positions=o.geometry.getAttribute('position');vertices+=positions.count;for(let i=0;i<positions.array.length;i++){const v=positions.array[i];assert.ok(Number.isFinite(v));signature+=v*((i%17)+1);}}});
  assert.deepEqual(detailNames.sort(),requiredDetails[car.id].toSorted());
  assert.ok(vertices>15000||car.type==='motorcycle'&&vertices>12000,`${car.id}: ${vertices} vertices`);
  assert.ok(meshes<70,`${car.id}: ${meshes} draw calls`);signatures.push(signature);
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
