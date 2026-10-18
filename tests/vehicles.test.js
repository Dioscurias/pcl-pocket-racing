import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildVehicle,VEHICLE_SCALE} from '../src/vehicles.js';
import {KART_RADIUS} from '../src/simulation.js';
import {CARS} from '../src/car-catalog.js';

test('kart model and collision footprint use the approved miniature scale',()=>{assert.equal(VEHICLE_SCALE,.65);assert.equal(KART_RADIUS,.56);const {group}=buildVehicle();assert.equal(group.scale.x,.65);assert.equal(group.scale.y,.65);assert.equal(group.scale.z,.65);});

test('five finite, distinct car bodies retain animated steering and wheel roll pivots',()=>{
 const signatures=[];
 for(const car of CARS){const vehicle=buildVehicle({car:car.id,color:0x1859b7});
  assert.equal(vehicle.model,car.id);assert.equal(vehicle.paint.color.getHex(),0x1859b7);
  assert.equal(vehicle.wheels.length,4);assert.equal(vehicle.front.length,2);
  for(const wheel of vehicle.wheels){assert.ok(wheel.userData.roll.isGroup);assert.notEqual(wheel,wheel.userData.roll);}
  const bounds=new THREE.Box3().setFromObject(vehicle.group),size=bounds.getSize(new THREE.Vector3());
  assert.ok(size.x<2.7&&size.z<4&&bounds.min.y>=-.015,JSON.stringify({car:car.id,size,min:bounds.min}));
  let signature=0,meshes=0;vehicle.group.traverse(o=>{if(o.isMesh){meshes++;const positions=o.geometry.getAttribute('position');for(let i=0;i<positions.array.length;i++){const v=positions.array[i];assert.ok(Number.isFinite(v));signature+=v*((i%17)+1);}}});
  assert.ok(meshes<40,`${car.id}: ${meshes} draw calls`);signatures.push(signature);
 }
 assert.equal(new Set(signatures).size,5);
});
