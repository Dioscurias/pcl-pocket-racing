export const CARS = Object.freeze([
 {id:'apex',name:'Apex',type:'kart',description:'Balanced open-wheel racer',handling:{acceleration:30,brake:47,topSpeed:32,boostSpeed:42,steering:2.55,grip:13,driftGrip:3.8,radius:.56,driftCharge:1}},
 {id:'apex-formula',name:'Apex Formula',type:'kart',description:'Fast open-wheel racer',handling:{acceleration:29,brake:49,topSpeed:34,boostSpeed:44,steering:2.38,grip:14,driftGrip:4.1,radius:.56,driftCharge:.95}},
 {id:'roadster',name:'GT Roadster',type:'kart',description:'Open top / rounded fenders',handling:{acceleration:31,brake:46,topSpeed:31,boostSpeed:41,steering:2.65,grip:12.5,driftGrip:3.6,radius:.57,driftCharge:1.05}},
 {id:'coupe',name:'Rally Coupe',type:'kart',description:'Stable all-surface coupe',handling:{acceleration:28,brake:45,topSpeed:31,boostSpeed:41,steering:2.45,grip:15,driftGrip:4.4,radius:.58,driftCharge:.9}},
 {id:'motorcycle',name:'Motorcycle',type:'motorcycle',description:'Agile bike / quick lean',handling:{acceleration:35,brake:51,topSpeed:35,boostSpeed:45,steering:3.15,grip:10.5,driftGrip:3.1,radius:.4,driftCharge:1.25}},
]);
export const DEFAULT_CAR='apex';
export const normalizeCar=value=>CARS.some(car=>car.id===value)?value:DEFAULT_CAR;
export const carById=value=>CARS.find(car=>car.id===normalizeCar(value))||CARS[0];
