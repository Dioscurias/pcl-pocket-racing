import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,addPlayer,startMatch,resetMatch,snapshot} from '../src/simulation.js';

test('selected car survives host snapshots and rematches with the same shared paint',()=>{
 const world=createWorld({bots:0});
 const host=addPlayer(world,'host','Nico',{car:'roadster',color:0xf04fa3});
 const guest=addPlayer(world,'guest','Maya',{car:'apex-formula'});
 assert.equal(host.car,'roadster');assert.equal(guest.car,'apex-formula');
 assert.equal(host.color,0xf04fa3);assert.notEqual(host.color,guest.color);
 startMatch(world);resetMatch(world);
 assert.deepEqual(snapshot(world).players.map(p=>[p.car,p.color]),[['roadster',host.color],['apex-formula',guest.color]]);
});
test('invalid car selections fall back safely and AI racers use the full collection',()=>{
 const world=createWorld({bots:7});
 const host=addPlayer(world,'host','Nico',{car:{bad:true},color:0x123456});assert.equal(host.car,'apex');assert.equal(host.color,0x1677ff);
 startMatch(world);
 const cars=world.players.map(p=>p.car);
 assert.ok(cars.every(c=>['apex','motorcycle','roadster','apex-formula'].includes(c)));
 assert.equal(new Set(cars).size,4);
});
