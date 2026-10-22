import test from 'node:test';
import assert from 'node:assert/strict';
import {TRACKS,trackById,pointAtDistance,nearestTrack,surfaceAt,insideFloor,hazardPosition} from '../src/tracks.js';
import {createWorld,addPlayer,startMatch,stepWorld,setInput} from '../src/simulation.js';
import {CARS} from '../src/car-catalog.js';

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

test('UT Grand Prix connects PCL, central campus and Jester in landmark order',()=>{
 const track=TRACKS.find(item=>item.id==='ut-campus-grand-prix');
 assert.ok(track,'UT Grand Prix must be selectable');assert.equal(track.environment,'UT Austin campus');
 assert.deepEqual(track.zones.map(zone=>zone.id),['pcl','campus','jester']);
 assert.deepEqual(track.landmarks.map(item=>item.name),['PCL Level 2','PCL Main Entry','Speedway','UT Tower','Main Mall','Gregory Gym','Jester Circle','JCL','J2 Dining','Kite Launch','Jester City Market']);
 assert.ok(track.length>1200,'grand tour must be substantially larger than the indoor courses');
 assert.ok(track.flightRanges.length===1);assert.ok(track.platforms.length>=1);
 for(const point of track.centerline)assert.equal(insideFloor(track,point.x,point.z),true,'the connected route must remain inside the authored campus bounds');
});

test('an AI racer completes UT Grand Prix without reset penalties',()=>{
 const world=createWorld({trackId:'ut-campus-grand-prix',laps:1,bots:0}),racer=addPlayer(world,'campus-bot','Campus Bot',{bot:true});startMatch(world);
 assert.equal(world.trackId,'ut-campus-grand-prix');
 for(let i=0;i<60*240&&racer.lap<1;i++)stepWorld(world,1/60);
 assert.equal(racer.lap,1);assert.equal(racer.penalty,0);
});

test('UT Grand Prix shortcuts clear solids and landmark ratios match the visible campus',()=>{
 const track=trackById('ut-campus-grand-prix');
 for(const shortcut of track.shortcuts)for(let segment=1;segment<shortcut.points.length;segment++)for(let step=0;step<=20;step++){
  const t=step/20,a=shortcut.points[segment-1],b=shortcut.points[segment],x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
  for(const obstacle of track.obstacles.filter(item=>Math.abs((item.y||0)-(a.y||0))<3)){
   const dx=Math.max(Math.abs(x-obstacle.x)-obstacle.w/2,0),dz=Math.max(Math.abs(z-obstacle.z)-obstacle.d/2,0);
   assert.ok(Math.hypot(dx,dz)>shortcut.width/2,`${shortcut.label} clips ${obstacle.label}`);
  }
 }
 const targets={Speedway:[-140,-25],'UT Tower':[5,-286],'Main Mall':[38,-245],'Gregory Gym':[183,-5],'Jester Circle':[151,92]};
 for(const [name,[x,z]] of Object.entries(targets)){const landmark=track.landmarks.find(item=>item.name===name),point=pointAtDistance(track,track.length*landmark.ratio);assert.ok(Math.hypot(point.x-x,point.z-z)<55,`${name} announcement is detached from its landmark`);}
 assert.ok(track.obstacles.some(item=>item.id==='tower-solid'));assert.ok(track.obstacles.some(item=>item.id==='gregory-solid'));
});

test('Jester course has real vertical progression and a kite flight sector',()=>{
 const track=trackById('jester-vertical-drop');assert.equal(track.environment,'Jester Center');
 const heights=track.centerline.map(point=>point.y||0);assert.ok(Math.max(...heights)>=20);
 assert.ok(track.flightRanges.length>=1);assert.ok(track.landmarks.some(item=>item.name==='J2 Dining'));assert.ok(track.landmarks.some(item=>item.name==='Jester City Market'));
});

test('J2 deck and furniture share one collision model while the concourse remains below',()=>{
 const track=trackById('jester-vertical-drop');
 assert.equal(surfaceAt(track,30,0),20.7);assert.equal(surfaceAt(track,30,0,0),0);
 for(const obstacle of track.obstacles.filter(item=>(item.y||0)>10)){
  const clearance=Math.min(...track.centerline.filter(point=>(point.y||0)>18).map(point=>Math.hypot(point.x-obstacle.x,point.z-obstacle.z)));
  assert.ok(clearance>Math.max(obstacle.w,obstacle.d)/2+track.trackWidth/2,`${obstacle.label} blocks the upper racing line`);
 }
});

test('lobby shortcut clears the checkout desk',()=>{
 const track=trackById('pcl-lobby-loop'),desk=track.obstacles.find(item=>item.type==='reception'),shortcut=track.shortcuts[0];
 for(let segment=1;segment<shortcut.points.length;segment++)for(let step=0;step<=20;step++){
  const t=step/20,a=shortcut.points[segment-1],b=shortcut.points[segment],x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
  const dx=Math.max(Math.abs(x-desk.x)-desk.w/2,0),dz=Math.max(Math.abs(z-desk.z)-desk.d/2,0);
  assert.ok(Math.hypot(dx,dz)>shortcut.width/2,`shortcut clips checkout desk at ${x},${z}`);
 }
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


test('every published track can finish a clean AI lap without checkpoint resets',()=>{
 for(const track of TRACKS){
  const world=createWorld({trackId:track.id,laps:1,bots:0}),racer=addPlayer(world,'driver','Driver',{bot:true});startMatch(world);
  let flew=false;for(let i=0;i<60*150&&racer.lap<1;i++){stepWorld(world,1/60);flew||=racer.gliding;}
  assert.equal(racer.lap,1,track.id+' must be a finishable circuit');assert.equal(racer.penalty,0,track.id+' must not need resets');
  if(track.flightRanges?.length)assert.equal(flew,true,'the upper route must launch into a real glide');
 }
});

test('all published track surfaces stay above the floor and inside the building',()=>{
 for(const track of TRACKS)for(const point of track.centerline){assert.ok((point.y||0)>=0,track.id+' dips through floor');assert.ok(insideFloor(track,point.x,point.z),track.id+' leaves the building');}
});

test('soft edge rails keep a moving racer near every ordinary racing surface',()=>{
 for(const track of TRACKS){
  const world=createWorld({trackId:track.id,laps:1,bots:0}),racer=addPlayer(world,'edge','Edge');startMatch(world);
  for(let i=0;i<190;i++)stepWorld(world,1/60);
  const start=pointAtDistance(track,track.length*.2),sideX=Math.cos(start.heading),sideZ=Math.sin(start.heading);
  Object.assign(racer,{x:start.x+sideX*track.trackWidth*.9,z:start.z+sideZ*track.trackWidth*.9,y:start.y||0,heading:start.heading,vx:sideX*30,vz:sideZ*30,grounded:true});
  stepWorld(world,.1);const near=nearestTrack(track,racer.x,racer.z);
  assert.ok(near.distance<=track.trackWidth*.76,`${track.id} escaped at ${near.distance}`);
 }
});

test('every vehicle finishes every track without falling through or requiring a reset',()=>{
 for(const track of TRACKS)for(const car of CARS){
  const world=createWorld({trackId:track.id,laps:1,bots:0}),racer=addPlayer(world,car.id,car.name,{bot:true,car:car.id});startMatch(world);
  for(let i=0;i<60*180&&racer.lap<1;i++)stepWorld(world,1/60);
  assert.equal(racer.lap,1,`${car.name} did not finish ${track.name}`);assert.equal(racer.penalty,0,`${car.name} reset on ${track.name}`);assert.ok(racer.y>=0&&Number.isFinite(racer.x+racer.y+racer.z));
 }
});
