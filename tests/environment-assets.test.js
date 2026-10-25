import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

test('environment assets are local CC0 files within the transfer budget',async()=>{
 const moduleUrl=new URL('../src/environment-assets.js',import.meta.url);
 assert.ok(existsSync(fileURLToPath(moduleUrl)),'environment asset manifest is missing');
 const {ENVIRONMENT_ASSETS,ENVIRONMENT_BUDGET}=await import(moduleUrl);
 assert.ok(ENVIRONMENT_ASSETS.length>=8,'complete campus material library');
 assert.equal(ENVIRONMENT_BUDGET.maxAddedBytes,24*1024*1024);
 for(const asset of ENVIRONMENT_ASSETS){
  assert.match(asset.path,/^\/assets\/environment\//);
  assert.ok(!/^https?:/.test(asset.path),'runtime assets must never hotlink');
  assert.equal(asset.license,'CC0-1.0');
  assert.ok(asset.source.startsWith('https://ambientcg.com/a/')||asset.source.startsWith('https://polyhaven.com/a/'));
 }
});

test('campus material families preserve realistic PBR response without emissive glow',async()=>{
 const moduleUrl=new URL('../src/environment-assets.js',import.meta.url);
 assert.ok(existsSync(fileURLToPath(moduleUrl)),'environment asset manifest is missing');
 const {CAMPUS_MATERIALS}=await import(moduleUrl);
 for(const key of ['asphalt','grass','brick','limestone','roof','concrete','rubber']){
  const material=CAMPUS_MATERIALS[key];
  assert.ok(material,missingKey(key));
  assert.ok(material.color&&material.normal&&material.roughnessMap);
  assert.match(material.roughnessMap,/^\/assets\/environment\/textures\/.+\.ktx2$/);
  assert.equal(typeof material.roughness,'number');
  assert.equal(material.emissive,undefined);
 }
});

test('every published course declares shared PBR surface roles',async()=>{
 const {CAMPUS_MATERIALS,COURSE_MATERIAL_ROLES}=await import('../src/environment-assets.js');
 for(const id of ['pcl-lobby-loop','bookstack-blitz','jester-vertical-drop','ut-campus-grand-prix']){
  const roles=COURSE_MATERIAL_ROLES[id];
  assert.ok(roles,id+' is missing PBR surface roles');
  for(const role of ['road','floor','wall','trim','prop'])assert.ok(CAMPUS_MATERIALS[roles[role]],`${id} ${role} is not a loaded PBR family`);
 }
});

function missingKey(key){return 'missing campus material '+key;}


test('campus facades expose aligned architectural modules',async()=>{
 const world=await import('../src/course-world.js');
 assert.equal(typeof world.campusBuildingModules,'function','facade module generator is missing');
 const modules=world.campusBuildingModules({id:'mccombs',x:0,z:0,w:52,d:47,height:25});
 assert.ok(modules.windows.length>=24,'hero facade needs repeated inset windows');
 assert.ok(modules.windows.every(window=>window.y>3&&window.y<23));
 assert.ok(modules.cornices.length>=2);
 assert.ok(modules.entrances.length>=1);
});

test('campus vegetation rotates through Austin tree species',async()=>{
 const world=await import('../src/course-world.js');
 assert.equal(typeof world.campusTreeSpecies,'function','tree species selector is missing');
 assert.deepEqual(Array.from({length:6},(_,index)=>world.campusTreeSpecies(index)),[
  'live-oak','cedar-elm','crepe-myrtle','live-oak','cedar-elm','crepe-myrtle',
 ]);
});


test('campus exposes a dedicated clouded sky generator separate from reflection lighting',async()=>{
 const assets=await import('../src/environment-assets.js');
 assert.equal(typeof assets.createCampusSkyTexture,'function','campus sky generator is missing');
 assert.ok(assets.CAMPUS_CLOUD_BANKS.length>=6);
 assert.ok(assets.CAMPUS_CLOUD_BANKS.every(cloud=>cloud.y<.34&&cloud.alpha<=.1&&cloud.puffs>=5),'clouds should stay faint and above the horizon');
 assert.ok(assets.CAMPUS_SKY_STYLE?.cloudBlur>=40,'cloud banks need enough blur to read as continuous forms');
 assert.equal(assets.CAMPUS_SKY_STYLE?.layeredClouds,true);
});

test('race rendering uses filmic contrast instead of the flat neutral override',async()=>{
 const source=await import('node:fs/promises').then(({readFile})=>readFile(new URL('../src/scene.js',import.meta.url),'utf8'));
 assert.match(source,/applyTrackLighting\(track\).*ACESFilmicToneMapping/s);
 assert.doesNotMatch(source,/applyTrackLighting\(track\).*NeutralToneMapping/s);
});
