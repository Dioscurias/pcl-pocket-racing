import * as THREE from 'three';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';

const ROOT='/assets/environment';
const ambient=(id,slug)=>({
 id,
 path:`${ROOT}/textures/${slug}/${slug}-color.ktx2`,
 source:`https://ambientcg.com/a/${id}`,
 license:'CC0-1.0',
});
export const ENVIRONMENT_BUDGET=Object.freeze({maxAddedBytes:24*1024*1024,maxTextureSize:2048,maxVisibleTriangles:450000,maxDrawCalls:170});
export const ENVIRONMENT_ASSETS=Object.freeze([
 ambient('Asphalt033','asphalt'),
 ambient('Grass005','grass'),
 ambient('Bricks097','brick'),
 ambient('Tiles139','limestone'),
 ambient('RoofingTiles013A','roof'),
 ambient('Concrete034','concrete'),
 ambient('Rubber004','rubber'),
 ambient('Bark014','bark'),
 {id:'sunflowers_puresky',path:`${ROOT}/hdri/sunflowers_puresky_1k.hdr`,source:'https://polyhaven.com/a/sunflowers_puresky',license:'CC0-1.0'},
]);
export const CREDITS_PATH=`${ROOT}/CREDITS.md`;
const family=(slug,{repeat=[4,4],roughness=.72,metalness=0,color='#ffffff',normalScale=1,ao=true}={})=>Object.freeze({
 color:`${ROOT}/textures/${slug}/${slug}-color.ktx2`,
 normal:`${ROOT}/textures/${slug}/${slug}-normal.ktx2`,
 roughnessMap:`${ROOT}/textures/${slug}/${slug}-roughness.ktx2`,
 ao:ao?`${ROOT}/textures/${slug}/${slug}-ao.ktx2`:null,
 repeat,roughness,metalness,color,normalScale,
});
export const CAMPUS_MATERIALS=Object.freeze({
 asphalt:family('asphalt',{repeat:[1.7,7],roughness:.78,color:'#3b4650',normalScale:.7}),
 grass:family('grass',{repeat:[34,34],roughness:.94,color:'#3f9b42',normalScale:.8}),
 brick:family('brick',{repeat:[5,3],roughness:.8,color:'#d55b26',normalScale:.7}),
 limestone:family('limestone',{repeat:[5,4],roughness:.74,color:'#cba96f',normalScale:.55,ao:false}),
 roof:family('roof',{repeat:[5,5],roughness:.72,color:'#bf3f27',normalScale:.75}),
 concrete:family('concrete',{repeat:[12,12],roughness:.88,color:'#a69a84',normalScale:.5,ao:false}),
 rubber:family('rubber',{repeat:[2,2],roughness:.72,color:'#17191e',normalScale:.8,ao:false}),
 bark:family('bark',{repeat:[2,5],roughness:.92,color:'#603518',normalScale:.7}),
});
export const COURSE_MATERIAL_ROLES=Object.freeze({
 'pcl-lobby-loop':Object.freeze({road:'asphalt',floor:'limestone',wall:'brick',trim:'concrete',prop:'roof'}),
 'bookstack-blitz':Object.freeze({road:'asphalt',floor:'limestone',wall:'brick',trim:'concrete',prop:'roof'}),
 'jester-vertical-drop':Object.freeze({road:'asphalt',floor:'limestone',wall:'brick',trim:'concrete',prop:'roof'}),
 'ut-campus-grand-prix':Object.freeze({road:'asphalt',floor:'grass',wall:'brick',trim:'limestone',prop:'concrete'}),
});

const materialCache=new Map();
let materialLoading;
let skyTexture;
const environmentCache=new WeakMap();
export const CAMPUS_CLOUD_BANKS=Object.freeze([]);
export const CAMPUS_SKY_STYLE=Object.freeze({clouds:false});
function configured(texture,{srgb=false,repeat=[1,1],anisotropy=4}={}){
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.repeat.set(...repeat);
 texture.anisotropy=anisotropy;
 if(srgb)texture.colorSpace=THREE.SRGBColorSpace;
 texture.needsUpdate=true;
 return texture;
}
export function createCampusMaterialLibrary(){
 if(materialCache.size)return Object.fromEntries(materialCache);
 for(const [name,spec] of Object.entries(CAMPUS_MATERIALS)){
  materialCache.set(name,new THREE.MeshStandardMaterial({
   name:`campus-${name}`,color:spec.color,roughness:spec.roughness,metalness:spec.metalness,
  }));
 }
 return Object.fromEntries(materialCache);
}
export function loadCampusMaterialLibrary(renderer){
 const materials=createCampusMaterialLibrary();
 if(materialLoading)return materialLoading.then(()=>materials);
 const loader=new KTX2Loader().setTranscoderPath('/assets/basis/').detectSupport(renderer);
 const anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const load=async(path,options)=>path?configured(await loader.loadAsync(path),{...options,anisotropy}):null;
 materialLoading=Promise.all(Object.entries(CAMPUS_MATERIALS).map(async([name,spec])=>{
  const [map,normalMap,roughnessMap,aoMap]=await Promise.all([
   load(spec.color,{srgb:true,repeat:spec.repeat}),load(spec.normal,{repeat:spec.repeat}),
   load(spec.roughnessMap,{repeat:spec.repeat}),load(spec.ao,{repeat:spec.repeat}),
  ]);
  const material=materials[name];
  if(aoMap)aoMap.channel=0;
  Object.assign(material,{map,normalMap,roughnessMap,aoMap});
  material.normalScale.setScalar(spec.normalScale);
  material.needsUpdate=true;
 })).then(()=>{loader.dispose();return materials;}).catch(error=>{loader.dispose();console.warn('Campus PBR textures unavailable',error);return materials;});
 return materialLoading;
}
export function loadCampusEnvironment(renderer){
 if(environmentCache.has(renderer))return environmentCache.get(renderer);
 const promise=new RGBELoader().loadAsync(`${ROOT}/hdri/sunflowers_puresky_1k.hdr`).then(background=>{
  background.mapping=THREE.EquirectangularReflectionMapping;
  const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromEquirectangular(background).texture;
  pmrem.dispose();
  return {background,environment};
 });
 environmentCache.set(renderer,promise);
 return promise;
}
export function createCampusSkyTexture(){
 if(skyTexture)return skyTexture;
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;const ctx=canvas.getContext('2d'),sky=ctx.createLinearGradient(0,0,0,1024);sky.addColorStop(0,'#075b99');sky.addColorStop(.38,'#159bd2');sky.addColorStop(.72,'#65cceb');sky.addColorStop(1,'#def6fb');ctx.fillStyle=sky;ctx.fillRect(0,0,canvas.width,canvas.height);
 const haze=ctx.createLinearGradient(0,610,0,1024);haze.addColorStop(0,'rgba(255,255,255,0)');haze.addColorStop(1,'rgba(255,248,226,.24)');ctx.fillStyle=haze;ctx.fillRect(0,610,canvas.width,414);
 skyTexture=new THREE.CanvasTexture(canvas);skyTexture.colorSpace=THREE.SRGBColorSpace;return skyTexture;
}
