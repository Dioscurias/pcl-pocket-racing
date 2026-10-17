export const CARS = Object.freeze([
 {id:'apex',name:'Apex',description:'Pointed nose / open wheels'},
 {id:'club',name:'Club Sport',description:'Rounded nose / twin roll hoops'},
 {id:'formula',name:'Formula',description:'Sculpted nose / wide front wing'},
 {id:'roadster',name:'GT Roadster',description:'Open top / rounded fenders'},
 {id:'coupe',name:'Rally Coupe',description:'Closed cockpit / exposed rear wheels'},
]);
export const DEFAULT_CAR='apex';
export const normalizeCar=value=>CARS.some(car=>car.id===value)?value:DEFAULT_CAR;
