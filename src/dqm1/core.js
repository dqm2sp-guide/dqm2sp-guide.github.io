(function(root){
const norm=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[\s·・]/g,'');
function filter(monsters,{q='',family='',rank='',favorites=false}={},save={}){const words=norm(q).split(/[,，]/).filter(Boolean);return monsters.filter(m=>(!family||m.family===family)&&(!rank||m.rank===rank)&&(!favorites||(save.favorites||[]).includes(m.id))&&words.every(w=>norm([m.name,m.id,String(m.number).padStart(3,'0'),save.aliases?.[m.id],...(m.aliases||[]),...(m.traits||[]).map(t=>t.name)].join(' ')).includes(w)));}
function safeSave(raw,ids){let s;try{s=JSON.parse(raw||'{}')}catch{s={}}if(!s||typeof s!=='object')s={};return {favorites:Array.isArray(s.favorites)?s.favorites.filter(x=>ids.has(x)):[],aliases:Object.fromEntries(Object.entries(s.aliases&&typeof s.aliases==='object'?s.aliases:{}).filter(([k,v])=>ids.has(k)&&typeof v==='string'&&v.length<=40))};}
function tree(id,byId,path=[],budget={left:80}){if(path.includes(id))return {id,cycle:true};if(budget.left--<=0||path.length>=4)return {id,limited:true};const m=byId.get(id);if(!m)return {id,missing:true};return {id,name:m.name,limitedRecipes:(m.recipes||[]).length>2,recipes:(m.recipes||[]).slice(0,2).map(r=>({...r,children:r.parents.map(p=>tree(p,byId,[...path,id],budget))}))};}
function pairResults(monsters,a,b){const wanted=[a,b].sort().join('|');return monsters.filter(m=>(m.recipes||[]).some(r=>r.type==='pair'&&r.parents.length===2&&[...r.parents].sort().join('|')===wanted));}
function breedingEngine(rules){
 const species=new Map(rules.species.map(s=>[s.number,s])),excluded=new Set(rules.excluded);
 const ordinary=Array.from({length:7},(_,family)=>rules.species.filter(s=>s.family===family&&s.ordinary).map(s=>s.number).sort((a,b)=>a-b));
 function threshold(s,plus){
  if(plus>=100&&s.rank<7)return rules.rankStarts[7]-.5;
  if(plus>=50&&s.rank<5)return rules.rankStarts[5]-.5;
  if(plus>=25&&s.rank<3)return rules.rankStarts[3]-.5;
  return s.number;
 }
 function matches(token,s){
  if(typeof token==='number')return token===s.number;
  if(token==='g')return excluded.has(s.number);
  const group=/^f([0-7])(S?)$/.exec(token);
  return !!group&&s.family===Number(group[1])&&!excluded.has(s.number)&&(!group[2]||s.rank>=6);
 }
 function calculate(a,b,plusA=0,plusB=0,includeSpecial=true){
  const x=species.get(a),y=species.get(b);if(!x||!y)return {ordinary:[],special:[]};
  const special=includeSpecial?Object.entries(rules.special).filter(([,recipes])=>recipes.some(r=>r[0]==='p'&&((matches(r[1],x)&&matches(r[2],y))||(matches(r[1],y)&&matches(r[2],x))))).map(([n])=>Number(n)):[];
  let result=[];
  if(a===b)result=[a];
  else if(!excluded.has(a)&&!excluded.has(b)&&x.family>=0&&y.family>=0){
   if(x.family===7||y.family===7)result=[x,y].filter(s=>s.family===7).map(s=>s.number);
   else{
    const high=Math.max(threshold(x,plusA),threshold(y,plusB)),low=Math.min(threshold(x,plusA),threshold(y,plusB));
    const targets=x.family===y.family?[[x.family,high]]:[[x.family,high],[y.family,high],[rules.crossFamily[x.family][y.family],low]];
    result=targets.map(([family,min])=>ordinary[family]?.find(n=>n>min)).filter(Boolean);
   }
  }
  return {ordinary:[...new Set(result)],special:[...new Set(special)]};
 }
 const reverseCache=new Map();
 function parentsFor(target,limit=3){
  if(!species.get(target)?.ordinary)return [];
  const key=target+':'+limit;if(reverseCache.has(key))return reverseCache.get(key);
  const pool=rules.species.filter(s=>s.number!==target&&s.family>=0&&s.family<7&&!excluded.has(s.number)).map(s=>s.number).sort((a,b)=>a-b),found=[];
  for(let high=1;high<pool.length&&found.length<limit;high++)for(let low=0;low<high&&found.length<limit;low++)if(calculate(pool[low],pool[high],0,0,false).ordinary.includes(target))found.push([pool[low],pool[high]]);
  reverseCache.set(key,found);return found;
 }
 return {calculate,parentsFor};
}
const api={norm,filter,safeSave,tree,pairResults,breedingEngine};if(typeof module!=='undefined')module.exports=api;else root.DQM1Core=api;
})(typeof window!=='undefined'?window:globalThis);

