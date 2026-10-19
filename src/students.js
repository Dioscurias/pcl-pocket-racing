import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export const STUDENT_HEIGHT=18;
const material=(color,options={})=>new THREE.MeshStandardMaterial({color,roughness:.72,...options});
function add(parent,geometry,paint,position=[0,0,0]){const part=new THREE.Mesh(geometry,paint);part.position.set(...position);part.castShadow=true;part.receiveShadow=true;parent.add(part);return part;}

export function buildStudent({shirt=0xbf5700,pants=0x24324a,skin=0xb97857,hair=0x30231d,backpack=false,laptop=false}={}){
 const group=new THREE.Group();
 const skinMat=material(skin),shirtMat=material(shirt,{roughness:.84}),pantsMat=material(pants,{roughness:.88}),shoeMat=material('#f1eee5'),hairMat=material(hair,{roughness:.96}),packMat=material('#23343a'),metal=material('#8ea3ad',{metalness:.55,roughness:.3});
 const hips=new THREE.Group();hips.position.y=8.15;group.add(hips);
 add(hips,new THREE.CapsuleGeometry(2.05,4.1,8,16),shirtMat,[0,2.1,0]);
 add(hips,new THREE.CylinderGeometry(1.75,1.95,2.3,20),pantsMat,[0,-.45,0]);
 const head=new THREE.Group();head.position.set(0,6.2,0);hips.add(head);
 add(head,new THREE.SphereGeometry(1.5,24,18),skinMat);
 const hairCap=add(head,new THREE.SphereGeometry(1.55,24,12,0,Math.PI*2,0,Math.PI*.52),hairMat,[0,.2,0]);hairCap.scale.z=.96;
 add(head,new THREE.TorusGeometry(1.08,.08,8,22,Math.PI),hairMat,[0,.28,-.95]).rotation.z=Math.PI;
 const legs=[];for(const side of [-1,1]){const pivot=new THREE.Group();pivot.position.set(side*.9,-1.1,0);hips.add(pivot);add(pivot,new THREE.CapsuleGeometry(.65,4.7,6,12),pantsMat,[0,-2.35,0]);const shoe=add(pivot,new RoundedBoxGeometry(1.3,.85,2.35,3,.22),shoeMat,[0,-5.15,-.45]);shoe.rotation.x=-.08;legs.push(pivot);}
 const arms=[];for(const side of [-1,1]){const pivot=new THREE.Group();pivot.position.set(side*2.05,4.1,0);hips.add(pivot);add(pivot,new THREE.CapsuleGeometry(.5,3.5,6,12),shirtMat,[0,-1.9,0]);add(pivot,new THREE.SphereGeometry(.56,14,10),skinMat,[0,-4.1,0]);pivot.rotation.z=side*.09;arms.push(pivot);}
 let backpackPart=null;if(backpack){backpackPart=add(hips,new RoundedBoxGeometry(3.25,4.7,1.45,5,.28),packMat,[0,2.2,1.55]);for(const side of [-1,1]){const strap=add(hips,new THREE.TorusGeometry(1.45,.13,8,18,Math.PI),metal,[side*.7,2.4,-.72]);strap.rotation.set(Math.PI/2,0,side?0:0);}}
 let laptopPart=null;if(laptop){laptopPart=new THREE.Group();laptopPart.position.set(0,2.6,-2.2);laptopPart.rotation.x=-.18;hips.add(laptopPart);add(laptopPart,new RoundedBoxGeometry(3.6,.22,2.5,3,.1),metal);const screen=add(laptopPart,new RoundedBoxGeometry(3.6,2.35,.18,3,.1),metal,[0,1.1,1.05]);screen.rotation.x=-.55;}
 group.scale.setScalar(STUDENT_HEIGHT/14.7);
 return {group,hips,head,legs,arms,backpack:backpackPart,laptop:laptopPart};
}
