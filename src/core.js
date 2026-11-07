(function(root){
 'use strict';
 const needCounts=ids=>ids.reduce((a,id)=>(a[id]=(a[id]||0)+1,a),{});
 function readiness(recipe,owned,byId,currentId){
   const need=needCounts(recipe.parents||[]);let missing=Object.entries(need).reduce((n,[id,count])=>n+Math.max(0,count-(owned[id]||0)),0);
   if(recipe.type==='family'){
     const current=byId.get(currentId);const haveCurrent=owned[currentId]||0;
     const otherAvailable=[...byId.values()].filter(m=>m.family===recipe.family).reduce((n,m)=>n+(owned[m.id]||0)-(m.id===currentId&&haveCurrent>0?1:0),0);
     missing=(haveCurrent>0?0:1)+(otherAvailable>0?0:1);
   }
   return {missing,ready:missing===0,need};
 }
 function validateSave(value,validIds){
   if(!value||value.format!=='dqm2sp-save'||value.version!==1)throw Error('这不是本手册的备份文件');
   const data=value.data;if(!data||typeof data!=='object')throw Error('备份内容不完整');
   const owned={};for(const [id,n]of Object.entries(data.owned||{})){if(!validIds.has(Number(id))||!Number.isInteger(n)||n<0||n>999)throw Error('拥有数量无效');if(n)owned[id]=n}
   if(!Array.isArray(data.favorites)||data.favorites.some(id=>!validIds.has(id)))throw Error('收藏记录无效');
   const aliases={};for(const [id,n]of Object.entries(data.aliases||{})){if(!validIds.has(Number(id))||typeof n!=='string'||n.length>40)throw Error('别名记录无效');if(n.trim())aliases[id]=n.trim()}
   return {owned,favorites:[...new Set(data.favorites)],aliases};
 }
 function mergeSaves(a,b){return {owned:Object.fromEntries([...new Set([...Object.keys(a.owned),...Object.keys(b.owned)])].map(id=>[id,Math.max(a.owned[id]||0,b.owned[id]||0)])),favorites:[...new Set([...a.favorites,...b.favorites])],aliases:{...a.aliases,...b.aliases}}}
 // Family matrix and rank rules are for the SP version. Fixed species recipes
 // override rank breeding; species x family recipes coexist with rank options.
 const matrix=[[],[0,0,5,2,7,6,7,4],[0,5,0,4,5,6,7,1],[0,2,4,0,2,4,1,6],[0,7,5,2,0,3,2,5],[0,6,6,4,3,0,3,1],[0,7,7,1,2,3,0,3],[0,4,1,6,5,1,3,0]];
 function createBreedingEngine(monsters){
   const byId=new Map(monsters.map(m=>[m.id,m])),sorted=[...monsters].sort((a,b)=>a.no-b.no),tops=new Map(sorted.filter(m=>m.rankTop).map(m=>[m.family,m]));
   const pools=new Map([1,2,3,4,5,6,7].map(f=>[f,sorted.filter(m=>m.family===f&&m.canRankBreed&&m.no<=(tops.get(f)?.no||0))]));
   const exact=new Map(),familyRules=[];
   for(const m of sorted)for(const r of m.recipes)if(r.type==='pair'){const key=[...r.parents].sort((a,b)=>a-b).join(':');if(!exact.has(key))exact.set(key,[]);exact.get(key).push(m.id)}
   for(const m of sorted)for(const r of m.used)if(r.type==='family')familyRules.push({parent:m.id,family:r.family,result:r.result});
   const familyByParent=new Map();for(const r of familyRules){if(!familyByParent.has(r.parent))familyByParent.set(r.parent,[]);familyByParent.get(r.parent).push(r)}
   const nextTable=new Map();for(const [f,pool]of pools){const table=[];for(let n=0;n<=903;n++)table[n]=pool.find(m=>m.no>n)||tops.get(f);nextTable.set(f,table)}
   const effectiveNo=(m,plus)=>Math.max(m.no,plus>=100?776:plus>=50?562:plus>=25?332:0);
   function calculate(aId,bId,plusA=0,plusB=0){
     const a=byId.get(aId),b=byId.get(bId);if(!a||!b)return [];
     const fixed=exact.get([aId,bId].sort((x,y)=>x-y).join(':'));if(fixed)return fixed.map(id=>({id,type:'pair',reason:'双亲固定配合'}));
     if([705,706].includes(aId)||[705,706].includes(bId))return [{id:[705,706].includes(aId)?aId:bId,type:'special',reason:'蒙特纳保留种族'}];
     if(a.holyBeast||b.holyBeast){const other=a.holyBeast?b:a,rank=Math.max(a.baseRank,b.baseRank);const result=sorted.find(m=>m.holy.some(r=>r.family===other.family&&r.rankNumber===rank));return result?[{id:result.id,type:'special',reason:'神兽系别配合'}]:[]}
     if(aId===bId)return [{id:aId,type:'same',reason:'同种族配合'}];
     const high=Math.max(effectiveNo(a,plusA),effectiveNo(b,plusB)),low=Math.min(effectiveNo(a,plusA),effectiveNo(b,plusB)),out=[];
     const next=(f,n)=>nextTable.get(f)?.[n]||tops.get(f);
     const add=(m,reason)=>{if(m&&!out.some(r=>r.id===m.id))out.push({id:m.id,type:'normal',reason})};
     if(a.family===b.family){if(a.family===8){add(a,'未知系亲代保留种族');add(b,'未知系亲代保留种族')}else add(next(a.family,high),'同系别位阶配合')}
     else {for(const p of [a,b])p.family===8?add(p,'未知系亲代保留种族'):add(next(p.family,high),'亲代系别位阶候选');const f=matrix[a.family]?.[b.family];if(f)add(next(f,low),'第三系别位阶候选')}
     for(const r of [...(familyByParent.get(aId)||[]),...(familyByParent.get(bId)||[])])if((r.parent===aId&&r.family===b.family)||(r.parent===bId&&r.family===a.family)){const i=out.findIndex(x=>x.id===r.result);const item={id:r.result,type:'family',reason:'指定怪物 × 系别配合'};if(i>=0)out[i]=item;else out.push(item)}
     return out.filter((r,i)=>out.findIndex(x=>x.id===r.id)===i);
   }
   const incomingCache=new Map(),outgoingCache=new Map();
   function incoming(id){if(incomingCache.has(id))return incomingCache.get(id);const target=byId.get(id);if(!target)return [];const routes=[];for(let i=0;i<sorted.length;i++)for(let j=i;j<sorted.length;j++){const a=sorted[i],b=sorted[j];if(a.id===b.id){if(a.id!==id)continue;}else{const direct=(a.family===target.family||b.family===target.family)&&(target.family===8?(a.id===id||b.id===id):(target.rankTop||Math.max(a.no,b.no)<target.no));const third=a.family!==b.family&&matrix[a.family]?.[b.family]===target.family&&(target.rankTop||Math.min(a.no,b.no)<target.no);if(!direct&&!third)continue;}for(const r of calculate(a.id,b.id))if(r.id===id&&['normal','same'].includes(r.type))routes.push({type:'normal',parents:[a.id,b.id],result:id,reason:r.reason});}if(incomingCache.size>=16)incomingCache.delete(incomingCache.keys().next().value);incomingCache.set(id,routes);return routes}
   function outgoing(id){if(outgoingCache.has(id))return outgoingCache.get(id);const routes=[];for(const b of sorted)for(const r of calculate(id,b.id))if(['normal','same'].includes(r.type))routes.push({type:'normal',parents:[id,b.id],result:r.id,reason:r.reason});if(outgoingCache.size>=20)outgoingCache.delete(outgoingCache.keys().next().value);outgoingCache.set(id,routes);return routes}
   return {calculate,effectiveNo,incoming,outgoing};
 }
 function filterCatalog(monsters,filters,save,omit=''){
   const families=filters.families?.length?filters.families.map(Number):filters.family?[Number(filters.family)]:[],ranks=filters.ranks?.length?filters.ranks:filters.rank?[filters.rank]:[],sizes=filters.sizes?.length?filters.sizes.map(Number):filters.size?[Number(filters.size)]:[];
   const query=(filters.q||'').normalize('NFKC').trim().toLowerCase().replace(/^(?:#|no\.?\s*)/,'');
   return monsters.filter(m=>(filters.view!=='collection'||save.favorites.includes(m.id))&&(!filters.onlyOwned||save.owned[m.id]>0)&&(omit==='family'||!families.length||families.includes(m.family))&&(omit==='rank'||!ranks.length||ranks.includes(m.rank))&&(omit==='size'||!sizes.length||sizes.includes(m.size))&&(!query||m.name.toLowerCase().includes(query)||(save.aliases[m.id]||'').toLowerCase().includes(query)||String(m.no)===String(Number(query))));
 }
 function catalogFacets(monsters,filters,save){const counts={family:{},rank:{},size:{}};for(const facet of Object.keys(counts))for(const m of filterCatalog(monsters,filters,save,facet))counts[facet][m[facet]]=(counts[facet][m[facet]]||0)+1;return counts;}
 const api={needCounts,readiness,validateSave,mergeSaves,createBreedingEngine,filterCatalog,catalogFacets};if(typeof module!=='undefined')module.exports=api;else root.DQM_CORE=api;
})(typeof window!=='undefined'?window:globalThis);
