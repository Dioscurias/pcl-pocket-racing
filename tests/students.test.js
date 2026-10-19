import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildStudent,STUDENT_HEIGHT} from '../src/students.js';

test('giant library students have articulated silhouettes and oversized scale',()=>{
 const student=buildStudent({shirt:0xbf5700,skin:0x9a6647,backpack:true,laptop:true});
 assert.ok(student.group.isGroup);
 assert.ok(student.head.isObject3D);
 assert.equal(student.legs.length,2);
 assert.equal(student.arms.length,2);
 assert.ok(student.backpack?.isObject3D);
 assert.ok(student.laptop?.isObject3D);
 const bounds=new THREE.Box3().setFromObject(student.group),size=bounds.getSize(new THREE.Vector3());
 assert.ok(size.y>=STUDENT_HEIGHT*.9,`height ${size.y}`);
 assert.ok(size.y>10,'students should tower over toy karts');
});
