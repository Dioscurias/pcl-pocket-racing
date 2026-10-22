import {chromium} from '@playwright/test';
import path from 'node:path';

const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:480,height:320},deviceScaleFactor:2});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.goto(process.env.TEST_URL||'http://127.0.0.1:5230');await page.waitForFunction(()=>window.__pcl);
await page.evaluate(async()=>{
 const THREE=await import('/node_modules/.vite/deps/three.js');
 const {CARS}=await import('/src/car-catalog.js');const {GLTFLoader}=await import('/scripts/preview-support.js');
 document.querySelector('#app').style.display='none';document.body.style.margin='0';document.body.style.overflow='hidden';document.body.style.background='#dce8eb';
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(devicePixelRatio);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.14;renderer.outputColorSpace=THREE.SRGBColorSpace;document.body.append(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#dce8eb');scene.add(new THREE.HemisphereLight('#ffffff','#6889a0',3.4));
 const key=new THREE.DirectionalLight('#fff1d4',5);key.position.set(-4,7,-5);scene.add(key);const rim=new THREE.DirectionalLight('#6de2ff',2.4);rim.position.set(4,3,3);scene.add(rim);
 const floor=new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.7,.12,48),new THREE.MeshStandardMaterial({color:'#f7f1dc',roughness:.72}));floor.position.y=-.04;scene.add(floor);
 const camera=new THREE.PerspectiveCamera(34,innerWidth/innerHeight,.1,50);camera.position.set(3.6,2.55,-5.3);camera.lookAt(0,.72,0);
 const loader=new GLTFLoader();window.previewCar=async id=>{if(window.currentCar)scene.remove(window.currentCar);const car=CARS.find(item=>item.id===id),gltf=await loader.loadAsync(car.asset),model=gltf.scene;model.rotation.y=car.modelYaw;model.updateMatrixWorld(true);let bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());model.scale.setScalar(car.modelLength/Math.max(size.x,size.z));model.updateMatrixWorld(true);bounds=new THREE.Box3().setFromObject(model);const center=bounds.getCenter(new THREE.Vector3());model.position.set(-center.x,-bounds.min.y,-center.z);const holder=new THREE.Group();holder.add(model);holder.scale.setScalar(id==='motorcycle'?1.05:1);holder.rotation.y=-.42;window.currentCar=holder;scene.add(holder);renderer.render(scene,camera);};
});
for(const car of ['apex','motorcycle','roadster','apex-formula']){
 await page.evaluate(id=>window.previewCar(id),car);await page.waitForTimeout(80);
 await page.screenshot({path:path.join(process.cwd(),'public','karts',`${car}.png`)});
}
console.log({errors});await browser.close();
