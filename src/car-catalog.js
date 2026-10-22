export const CARS = Object.freeze([
 {id:'apex',name:'Monster Buggy',type:'kart',description:'Big tires / exposed suspension',handling:{acceleration:30,brake:47,topSpeed:32,boostSpeed:42,steering:2.55,grip:13,driftGrip:3.8,radius:.56,driftCharge:1}},
 {id:'motorcycle',name:'Velocity Bike',type:'motorcycle',description:'Full fairing / quick lean',handling:{acceleration:35,brake:51,topSpeed:35,boostSpeed:45,steering:3.15,grip:10.5,driftGrip:3.1,radius:.4,driftCharge:1.25}},
 {id:'roadster',name:'Nova 88',type:'kart',description:'Enclosed canopy / huge wheels',handling:{acceleration:31,brake:46,topSpeed:31,boostSpeed:41,steering:2.65,grip:12.5,driftGrip:3.6,radius:.57,driftCharge:1.05}},
 {id:'apex-formula',name:'Solar Formula',type:'kart',description:'Open wheel / bright aero',handling:{acceleration:29,brake:49,topSpeed:34,boostSpeed:44,steering:2.38,grip:14,driftGrip:4.1,radius:.56,driftCharge:.95}},
 {id:'formula-x',name:'Volt Formula',type:'kart',description:'Halo cockpit / full downforce',handling:{acceleration:32,brake:52,topSpeed:35,boostSpeed:45,steering:2.7,grip:14.5,driftGrip:4.3,radius:.55,driftCharge:1.02}},
 {id:'muscle-gt',name:'Muscle GT',type:'kart',description:'Wide-body GT / heavy launch',handling:{acceleration:34,brake:48,topSpeed:33,boostSpeed:43,steering:2.35,grip:13.5,driftGrip:3.9,radius:.6,driftCharge:.92}},
]);
export const DEFAULT_CAR='apex';
export const normalizeCar=value=>CARS.some(car=>car.id===value)?value:DEFAULT_CAR;
export const carById=value=>CARS.find(car=>car.id===normalizeCar(value))||CARS[0];
