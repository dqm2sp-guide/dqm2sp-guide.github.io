(function(root){
'use strict';
function locations(atlas,maps,monster){
 const zones=new Map(atlas.zones.map(z=>[z.id,z]));
 return maps.filter(m=>m.world===atlas.world).flatMap(m=>m.entries.filter(e=>e.monster===Number(monster)).map(e=>{
  const p=atlas.placements.find(p=>p.monster===e.monster&&p.map===m.id),fallback=atlas.zones.find(z=>z.map===m.id);
  const ids=p?p.zones:fallback?[fallback.id]:[];
  return {...e,map:m.id,mapName:m.name,zones:ids,precision:p?'direction':fallback?.precision||'unknown',description:p?.description||e.position||fallback?.description||(m.id===atlas.fieldMap?atlas.world+'野外，具体范围未核实':m.name+'内，具体楼层与点位未核实'),positionSource:p?.source||e.positionSource||null};
 }));
}
function zoneMonsters(atlas,maps,zone){
 const ids=[...new Set(maps.filter(m=>m.world===atlas.world).flatMap(m=>m.entries.map(e=>e.monster)))];
 return ids.filter(id=>!zone||locations(atlas,maps,id).some(l=>l.zones.includes(zone)));
}
function clampView(atlas,view){const w=Math.max(atlas.width/4,Math.min(atlas.width,view.w));const h=w*atlas.height/atlas.width;return {x:Math.max(0,Math.min(atlas.width-w,view.x)),y:Math.max(0,Math.min(atlas.height-h,view.y)),w,h};}
function fitZones(atlas,ids){const b=atlas.zones.filter(z=>ids.includes(z.id)).map(z=>z.bounds);if(!b.length||ids.includes('field'))return {x:0,y:0,w:atlas.width,h:atlas.height};const x=Math.min(...b.map(v=>v[0])),y=Math.min(...b.map(v=>v[1])),right=Math.max(...b.map(v=>v[0]+v[2])),bottom=Math.max(...b.map(v=>v[1]+v[3]));const w=Math.max(360,right-x+130,(bottom-y+130)*atlas.width/atlas.height),h=w*atlas.height/atlas.width;return clampView(atlas,{x:(x+right-w)/2,y:(y+bottom-h)/2,w});}
function findAtlas(book,world){return (book.worlds||[book]).find(a=>a.world===world)||null;}
function monsterWorlds(book,maps,monster){return (book.worlds||[book]).filter(a=>locations(a,maps,monster).length).map(a=>a.world);}
function resolveTarget(book,maps,mapId,monster){const map=maps.find(m=>m.id===mapId);if(!map)return null;const atlas=findAtlas(book,map.world);if(!atlas)return null;const id=Number(monster),hits=Number.isFinite(id)?locations(atlas,maps,id):[];return {atlas,monster:hits.length?id:null,zone:atlas.zones.find(z=>z.map===mapId)?.id||'',zones:hits.length?hits.filter(h=>h.map===mapId).flatMap(h=>h.zones):[atlas.zones.find(z=>z.map===mapId)?.id].filter(Boolean)};}
const api={locations,zoneMonsters,clampView,fitZones,findAtlas,monsterWorlds,resolveTarget};if(typeof module!=='undefined')module.exports=api;else root.DQM_ATLAS=api;
})(typeof window!=='undefined'?window:globalThis);
