import test from 'node:test';
import assert from 'node:assert/strict';
import {ribbonGeometry,roadSections} from '../src/course-world.js';
import {TRACKS,inFlightRange} from '../src/tracks.js';
test('road has shared edges and upward-facing triangles instead of overlapping segment wedges',()=>{
 for(const t of TRACKS)for(const section of roadSections(t)){
  const geo=ribbonGeometry(section,t.trackWidth),positions=geo.attributes.position,normals=geo.attributes.normal;
  assert.equal(positions.count,section.length*2);assert.ok(geo.index.count>0);
  for(let i=0;i<normals.count;i++)assert.ok(normals.getY(i)>0,'road faces up');
  for(let i=0;i<section.length;i++)assert.ok(Math.abs(positions.getY(i*2)-(section[i].y||0)-.04)<.00001);
  geo.dispose();
 }
});
test('visible roads stop before flight sectors and reconnect at market level',()=>{
 const t=TRACKS.find(t=>t.flightRanges?.length),sections=roadSections(t);assert.equal(sections.length,2);
 for(const section of sections)for(const p of section)assert.equal(inFlightRange(t,p.s),false);
 assert.ok(sections[0].at(-1).y>20);assert.ok(sections[1][0].y<1);
});

test('UT Grand Prix road spans one connected campus with authored landmarks',()=>{
 const track=TRACKS.find(item=>item.id==='ut-campus-grand-prix'),sections=roadSections(track);
 assert.equal(sections.length,2,'the only break in the racing ribbon is the kite flight');
 assert.deepEqual(track.structures.map(item=>item.id),['pcl','tower','gregory','jester']);
 for(const structure of track.structures)assert.ok(Number.isFinite(structure.x+structure.z+structure.w+structure.d),structure.id);
 assert.ok(sections.flat().some(point=>point.z<-240),'course must reach the Main Mall and Tower');
 assert.ok(track.centerline.some(point=>point.z>200),'course must reach the Jester market side');
});
