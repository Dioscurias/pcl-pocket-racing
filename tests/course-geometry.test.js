import test from 'node:test';
import assert from 'node:assert/strict';
import {campusRaceDecor,curbSegments,ribbonGeometry,roadSections} from '../src/course-world.js';
import * as courseWorld from '../src/course-world.js';
import {TRACKS,inFlightRange} from '../src/tracks.js';
test('road has shared edges and upward-facing triangles instead of overlapping segment wedges',()=>{
 for(const t of TRACKS)for(const section of roadSections(t)){
  const geo=ribbonGeometry(section,t.trackWidth),positions=geo.attributes.position,normals=geo.attributes.normal;
  assert.equal(positions.count,section.length*2);assert.equal(geo.attributes.uv?.count,positions.count,"road UVs match shared vertices");assert.ok(geo.index.count>0);
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

test('UT Grand Prix road is a continuous outdoor loop with campus landmarks',()=>{
 const track=TRACKS.find(item=>item.id==='ut-campus-grand-prix'),sections=roadSections(track);
 assert.equal(sections.length,1,'the outdoor route has no airborne break');
 assert.deepEqual(track.structures.map(item=>item.id),['tower','pcl','dkr','lbj','mccombs','gregory','waller']);
 for(const structure of track.structures)assert.ok(Number.isFinite(structure.x+structure.z+structure.w+structure.d),structure.id);
 assert.equal(track.structures.find(item=>item.id==='waller').water,true);
 assert.ok(sections.flat().some(point=>point.z<-150),'course must reach the 21st Street and DKR side');
 assert.ok(track.centerline.some(point=>point.z>200),'course must reach Dean Keeton');
});

test('UT Grand Prix curbs are flat, alternating, and do not stack edge outlines',()=>{
 const track=TRACKS.find(item=>item.id==='ut-campus-grand-prix'),curbs=curbSegments(track);
 assert.ok(curbs.length>100);
 assert.ok(curbs.every(curb=>curb.height<=.03));
 assert.ok(curbs.every(curb=>curb.length===3&&curb.gap===0));
 for(const side of [-1,1]){
  const sideCurbs=curbs.filter(curb=>curb.side===side);
  for(let index=1;index<sideCurbs.length;index++)assert.notEqual(sideCurbs[index].color,sideCurbs[index-1].color);
 }
});

test('UT Grand Prix trims curbs beside nonadjacent road sections',()=>{
 const track=TRACKS.find(item=>item.id==='ut-campus-grand-prix'),curbs=curbSegments(track);
 for(const curb of curbs)for(const point of track.centerline){
  const delta=Math.abs(point.s-curb.s),cyclic=Math.min(delta,track.length-delta);
  if(cyclic<24)continue;
  assert.ok(Math.hypot(point.x-curb.x,point.z-curb.z)>track.trackWidth*.88,'curb is too close to a second road section');
 }
});

test('UT Grand Prix race furniture stays clear of racers and item boxes',()=>{
 const track=TRACKS.find(item=>item.id==='ut-campus-grand-prix'),decor=campusRaceDecor(track);
 assert.ok(decor.length>=24,'campus circuit needs a complete race-furniture pass');
 for(const prop of decor){
  assert.ok(prop.clearance>=track.trackWidth/2+3,'race furniture intrudes on the drivable width');
  for(const box of track.itemBoxes)assert.ok(Math.hypot(prop.x-box.x,prop.z-box.z)>=10,'race furniture blocks an item box');
 }
});

test('pickup boxes use a layered arcade power-box assembly',()=>{
 assert.equal(courseWorld.ITEM_BOX_STYLE?.shell,'translucent');
 assert.ok(courseWorld.ITEM_BOX_STYLE?.rings>=2);
 assert.ok(courseWorld.ITEM_BOX_STYLE?.cornerLights>=8);
 assert.ok(courseWorld.ITEM_BOX_STYLE?.layers.includes('core'));
});

test('UT campus is enclosed by a readable race-venue perimeter',()=>{
 const style=courseWorld.CAMPUS_PERIMETER_STYLE;
 assert.ok(style?.wallHeight>=2&&style?.fenceHeight>=5);
 assert.ok(style?.bannerSpacing<=48);
 assert.ok(style?.lightSpacing<=90);
});
