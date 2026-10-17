import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, addPlayer, setInput, startMatch, stepWorld, resetMatch, snapshot, botInput } from '../src/simulation.js';
import { CHECKPOINTS, TRACK_LENGTH, pointAtDistance, surfaceAt } from '../src/track-layout.js';
const advance = (w, seconds) => { for (let t = 0; t < seconds; t += 1 / 60) stepWorld(w, 1 / 60); };
const active = options => { const w = createWorld({ bots: 0, ...options }); addPlayer(w, 'a', 'Ada'); startMatch(w); advance(w, 3.1); return w; };

test('countdown, bounded inputs, responsive acceleration, boost and rematch', () => {
 const w = createWorld({ bots: 0 }); const p = addPlayer(w, 'a', ' Ada ');
 startMatch(w); setInput(w, 'a', { throttle: 99, steer: NaN, boost: true }); advance(w, 2);
 assert.equal(w.phase, 'countdown'); assert.equal(p.speed, 0);
 advance(w, 1.1); advance(w, 1); assert.ok(p.speed > 15); assert.ok(p.energy < 100);
 assert.equal(p.input.steer, 0); assert.equal(p.input.throttle, 1);
 const before = w.time; stepWorld(w, Infinity); stepWorld(w, -4); assert.equal(w.time, before);
 resetMatch(w); assert.equal(w.phase, 'lobby'); assert.equal(p.lap, 0); assert.equal(p.energy, 100);
 assert.doesNotThrow(() => JSON.stringify(snapshot(w)));
});

test('drift charges through a turn and release grants free mini turbo', () => {
 const w = active(); const p = w.players.find(p => p.id === 'a');
 p.x = -82; p.z = -25; p.heading = 0; p.vz = -20; p.speed = 20;
 setInput(w, p.id, { throttle: 1, steer: 0.22, drift: true }); advance(w, 1.3);
 assert.ok(p.drift >= 35, `charge ${p.drift}`);
 setInput(w, p.id, { throttle: 1, steer: 0, drift: false }); stepWorld(w, 1 / 60);
 assert.ok(p.turboUntil > w.time); assert.equal(p.drift, 0);
});

test('ramp surface rises, launches the kart and gravity lands it', () => {
 assert.ok(surfaceAt(90, 6) > surfaceAt(90, -6));
 const w = active(); const p = w.players.find(p => p.id === 'a');
 Object.assign(p, { x: 90, z: -10, heading: Math.PI, vz: 24, speed: 24 });
 setInput(w, 'a', { throttle: 1 });
 let airborne = false, landed = false;
 for (let i = 0; i < 180; i++) { stepWorld(w, 1 / 60); if (!p.grounded && p.y > 0.4) airborne = true; if (airborne && p.grounded) { landed = true; break; } }
 assert.ok(airborne); assert.ok(landed); assert.ok(Number.isFinite(p.y));
});

test('ordered checkpoints reject skipped gates and reverse crossings', () => {
 const w = active({ laps: 1 }); const p = w.players.find(p => p.id === 'a');
 const gate = CHECKPOINTS[2]; Object.assign(p, { x: gate.x, z: gate.z, vx: 0, vz: 0 }); stepWorld(w, 1 / 60);
 assert.equal(p.nextCheckpoint, 1); assert.equal(p.lap, 0);
 const next = CHECKPOINTS[1]; const dx = -Math.sin(next.heading), dz = -Math.cos(next.heading);
 Object.assign(p, { x: next.x + dx * 2, z: next.z + dz * 2, vx: -dx * 25, vz: -dz * 25, heading: next.heading + Math.PI });
 stepWorld(w, 0.1); assert.equal(p.nextCheckpoint, 1);
});

test('world boundaries reset to an earned checkpoint with a time penalty, kart bumps remain finite', () => {
 const w = active(); const p = w.players.find(p => p.id === 'a'); const b = addPlayer(w, 'b', 'Bee');
 Object.assign(p, { x: 300, z: 300 }); stepWorld(w, 1 / 60);
 assert.ok(Math.abs(p.x) < 100); assert.ok(p.penalty >= 2);
 Object.assign(b, { x: p.x, z: p.z }); stepWorld(w, 1 / 60);
 assert.ok(Math.hypot(p.x - b.x, p.z - b.z) > 0.2); assert.ok(Number.isFinite(b.vx));
});

test('time trial uses one lap and no bots; bots complete a full three-lap race and record real lap times', () => {
 const trial = createWorld({ mode: 'time-trial', bots: 6, laps: 7 }); addPlayer(trial, 'a', 'Ada'); startMatch(trial);
 assert.equal(trial.players.length, 1); assert.equal(trial.settings.laps, 1);
 const w = createWorld({ bots: 3 }); startMatch(w);
 for (let i = 0; i < 60 * 400 && w.phase !== 'finished'; i++) stepWorld(w, 1 / 60);
 assert.equal(w.phase, 'finished', JSON.stringify(w.players.map(p => ({ id: p.id, lap: p.lap, cp: p.nextCheckpoint, x: p.x, z: p.z }))));
 const finishers = w.players.filter(p => p.finishedAt !== null);
 assert.ok(finishers.length >= 1); assert.equal(finishers[0].lapTimes.length, 3);
 assert.ok(finishers[0].bestLap > 10); assert.equal(new Set(w.players.map(p => p.position)).size, 3);
 assert.ok(TRACK_LENGTH > 500); assert.ok(pointAtDistance(TRACK_LENGTH + 3).x === pointAtDistance(3).x);
 assert.ok(botInput(w, finishers[0]).throttle === 0);
});

test('all eight forward gates record a lap, the next crossing alone cannot finish another', () => {
 const w = active({ laps: 2 }); const p = w.players[0];
 for (const i of [1,2,3,4,5,6,7,0]) {
  const g = CHECKPOINTS[i], fx = Math.sin(g.heading), fz = -Math.cos(g.heading);
  Object.assign(p, { x: g.x - fx * .3, z: g.z - fz * .3, heading: g.heading, vx: fx * 20, vz: fz * 20, y: 0, grounded: true });
  setInput(w, p.id, { throttle: 1 }); stepWorld(w, .05);
 }
 assert.equal(p.lap, 1); assert.equal(p.lapTimes.length, 1); assert.equal(p.nextCheckpoint, 1);
 const first = CHECKPOINTS[0]; Object.assign(p, { x: first.x, z: first.z }); stepWorld(w, .05);
 assert.equal(p.lap, 1); assert.equal(w.winner, null);
});

test('stack and stair collisions push a kart outside solid furniture without health damage', () => {
 const w = active(); const p = w.players[0];
 Object.assign(p, { x: -3, z: 0, vx: 15, vz: 0 }); stepWorld(w, 1 / 60);
 assert.ok(p.x <= -12.8 || p.x >= 6.8 || Math.abs(p.z) >= 23.8);
 assert.equal('health' in p, false);
});
