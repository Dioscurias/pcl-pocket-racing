export const CARS = Object.freeze([
 {id:'apex',name:'Monster Buggy',type:'kart',description:'Knobby tires / long-travel suspension',asset:'/vehicles/monster.glb',modelYaw:Math.PI/2,modelLength:3,exhaust:[[-.28,.62,1.28],[.28,.62,1.28]],handling:{acceleration:30,brake:47,topSpeed:32,boostSpeed:42,steering:2.55,grip:13,driftGrip:3.8,radius:.56,driftCharge:1}},
 {id:'motorcycle',name:'Velocity Bike',type:'motorcycle',description:'Sport bike / dedicated lean control',asset:'/vehicles/motorcycle.glb',modelYaw:Math.PI,modelLength:2.9,exhaust:[[.38,.5,1.1]],handling:{acceleration:35,brake:51,topSpeed:35,boostSpeed:45,steering:3.15,grip:10.5,driftGrip:3.1,radius:.4,driftCharge:1.25}},
 {id:'roadster',name:'Nova 88',type:'kart',description:'Bubble canopy / wide racing stance',asset:'/vehicles/speed.glb',modelYaw:-Math.PI/2,modelLength:3,exhaust:[[-.26,.43,1.28],[.26,.43,1.28]],handling:{acceleration:31,brake:46,topSpeed:31,boostSpeed:41,steering:2.65,grip:12.5,driftGrip:3.6,radius:.57,driftCharge:1.05}},
 {id:'apex-formula',name:'Apex Formula',type:'kart',description:'Open wheel / high-grip aero',asset:'/vehicles/formula.glb',modelYaw:Math.PI,modelLength:3.05,exhaust:[[0,.45,1.38]],handling:{acceleration:32,brake:52,topSpeed:35,boostSpeed:45,steering:2.7,grip:14.5,driftGrip:4.3,radius:.55,driftCharge:1.02}},
]);
export const DEFAULT_CAR='apex';
export const normalizeCar=value=>CARS.some(car=>car.id===value)?value:DEFAULT_CAR;
export const carById=value=>CARS.find(car=>car.id===normalizeCar(value))||CARS[0];
