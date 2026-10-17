import {icon} from './icons.js';
export {icon} from './icons.js';
export function button(label,{id='',href='',ghost=false,attrs=''}={}){
 const tag=href?'a':'button';return `<${tag} ${id?`id="${id}"`:''} ${href?`href="${href}"`:'type="button"'} class="mr-btn${ghost?' mr-btn--ghost':''}" ${attrs}><span>${label}</span><span class="mr-arrow" aria-hidden="true">${icon('arrow')}</span></${tag}>`;
}
export function segmented(label,id,{active=false,disabled=false}={}){return `<button type="button" id="${id}" class="mr-segmented" role="switch" aria-label="${label}" aria-checked="${active}" ${disabled?'disabled':''}><span>${label}</span><i aria-hidden="true"></i></button>`;}
export function keycap(key,display){return `<kbd class="mr-keycap" data-key-hint="${key}">${display}</kbd>`;}
export function dialog(id,label,content,className=''){return `<dialog id="${id}" class="mr-dialog ${className}" aria-labelledby="${id}-title"><button class="mr-icon-btn mr-dialog-close" data-close-dialog aria-label="Close ${label}">${icon('close')}</button>${content}</dialog>`;}
export function wireDialog(node){
 node.querySelector('[data-close-dialog]')?.addEventListener('click',()=>node.close());
 node.addEventListener('click',event=>{if(event.target===node){const r=node.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)node.close();}});
}
export function speedRing(label='SPEEDSTER / VELOCITY'){return `<section class="hud-speed" data-hud-region="speed" aria-label="Speed and energy">
 <svg class="speed-ring" viewBox="0 0 240 240" aria-hidden="true"><defs><path id="ring-text" d="M120 120m-101 0a101 101 0 1 1 202 0a101 101 0 1 1-202 0"/></defs>
 <g class="ring-dots"><circle cx="120" cy="120" r="116" pathLength="100" stroke-dasharray=".3 1.7"/></g>
 <g class="ring-dashes"><circle cx="120" cy="120" r="108" pathLength="100" stroke-dasharray="3 12"/></g>
 <circle class="ring-hairline" cx="120" cy="120" r="92"/>
 <circle class="ring-track" cx="120" cy="120" r="83" pathLength="100" stroke-dasharray="75 25" transform="rotate(135 120 120)"/>
 <circle class="ring-speed" cx="120" cy="120" r="83" pathLength="100" transform="rotate(135 120 120)"/>
 <circle class="ring-energy-track" cx="120" cy="120" r="99" pathLength="100" stroke-dasharray="25 75" transform="rotate(45 120 120)"/>
 <circle class="ring-energy" data-hud-energy-fill cx="120" cy="120" r="99" pathLength="100" transform="rotate(45 120 120)"/>
 <text class="ring-text"><textPath href="#ring-text" startOffset="2%">${label}</textPath></text>
 </svg><div class="speed-center"><div class="speed-numerals"><strong data-hud-speed>0</strong><span>km/h</span></div><p class="hud-top-speed">TOP <b data-hud-top-speed>0</b> km/h</p></div>
 <div class="hud-energy" data-hud-energy-row><span>Energy</span><b data-hud-energy>100</b><span>%</span><span class="sr-only" data-hud-energy-meter role="progressbar" aria-label="Energy" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"></span></div>
 </section>`;}
export function minimap(marker=headingMarker()){return `<div class="hud-radar-region" data-hud-region="radar"><div class="hud-radar-shell"><button class="hud-radar" type="button" aria-label="Expand map"><canvas data-hud-radar width="480" height="480" aria-label="Nearby streets and players"></canvas><span class="radar-player">${marker}</span></button><div class="radar-ticks" aria-hidden="true"></div><span class="radar-north-orbit" aria-hidden="true"><span class="radar-north">N</span></span><span class="hud-heading" data-hud-heading>N 0°</span></div><div class="hud-tools"></div></div>`;}

export function headingMarker(){return '<svg class="heading-marker" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 3 27 27 16 22 5 27Z"/></svg>';}
