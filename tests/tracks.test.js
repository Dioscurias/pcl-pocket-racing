import test from 'node:test';
import assert from 'node:assert/strict';
import {TRACKS,trackById,pointAtDistance,nearestTrack,surfaceAt,insideFloor,hazardPosition} from '../src/tracks.js';
import {createWorld,addPlayer,startMatch,stepWorld,setInput} from '../src/simulation.js';

test('track catalog contains distinct complete selectable circuits',()=>{
 assert.ok(TRACKS.length>=2);
 assert.deepEqual(TRACKS.slice(0,2).map(track=>track.id),['pcl-lobby-loop','bookstack-blitz']);
 for(const track of TRACKS){
  assert.ok(track.centerline.length>=120,track.id);assert.ok(track.length>200,track.id);
  assert.equal(track.checkpoints.length,8);assert.ok(track.boostPads.length>=2);assert.ok(track.itemBoxes.length>=5);
  assert.ok(track.ramps.length>=1||track.flightRanges?.length>=1);assert.ok(track.shortcuts.length>=1);assert.ok(track.obstacles.length>=3);
  const start=pointAtDistance(track,0),near=nearestTrack(track,start.x,start.z);
  assert.ok(near.distance<.001);assert.equal(surfaceAt(track,start.x,start.z),0);assert.equal(insideFloor(track,start.x,start.z),true);
 }
 assert.notDeepEqual(TRACKS[0].points,TRACKS[1].points);
 assert.equal(trackById('missing').id,'bookstack-blitz');
 const hazards=trackById('pcl-lobby-loop').dynamicObstacles;assert.equal(hazards.length,2);
 assert.notDeepEqual(hazardPosition(hazards[0],0),hazardPosition(hazards[0],1));
});

test('Jester course has real vertical progression and a kite flight sector',()=>{
 const track=trackById('jester-vertical-drop');assert.equal(track.environment,'Jester Center');
 const heights=track.centerline.map(point=>point.y||0);assert.ok(Math.max(...heights)>=20);
 assert.ok(track.flightRanges.length>=1);assert.ok(track.landmarks.some(item=>item.name==='J2 Dining'));assert.ok(track.landmarks.some(item=>item.name==='Jester City Market'));
});

test('Jester launch deploys the kite and lands the kart at market level',()=>{
 const world=createWorld({trackId:'jester-vertical-drop',laps:1,bots:0}),player=addPlayer(world,'pilot','Pilot');startMatch(world);
 for(let i=0;i<400;i++)stepWorld(world,1/60);
 const track=trackById(world.trackId),launch=pointAtDistance(track,track.length*.575);Object.assign(player,{x:launch.x,z:launch.z,y:surfaceAt(track,launch.x,launch.z),heading:launch.heading,vx:Math.sin(launch.heading)*30,vz:-Math.cos(launch.heading)*30,grounded:true});setInput(world,player.id,{throttle:1});
 let kiteDeployed=false;for(let i=0;i<240;i++){stepWorld(world,1/60);kiteDeployed||=player.gliding;}
 assert.equal(kiteDeployed,true);assert.equal(player.grounded,true);assert.equal(player.gliding,false);assert.ok(player.y<1);
});

test('AI can complete the new PCL Lobby Loop using its real checkpoints',()=>{
 const world=createWorld({trackId:'pcl-lobby-loop',laps:1,bots:0});
 addPlayer(world,'lobby-bot','Lobby Bot',{bot:true});startMatch(world);
 for(let i=0;i<60*180&&world.phase!=='finished';i++)stepWorld(world,1/60);
 assert.equal(world.players[0].lap,1);assert.ok(world.players[0].finishTime>0);
});
