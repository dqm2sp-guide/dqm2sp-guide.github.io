const RANK_ORDER=['SS','S','A','B','C','D','E','F'];
function selectedFacet(kind){const plural={family:'families',rank:'ranks',size:'sizes'}[kind];return state[plural]?.length?state[plural].map(String):state[kind]?[String(state[kind])]:[]}
function facetRow(kind,label,options,counts){const selected=selectedFacet(kind);return `<div class="facet-row"><span class="facet-label">${label}</span><div class="facet-choices" role="group" aria-label="${label}筛选"><button class="facet-choice ${!selected.length?'active':''}" data-facet="${kind}" data-value="" aria-pressed="${!selected.length}">全部</button>${options.map(([value,title])=>`<button class="facet-choice ${selected.includes(String(value))?'active':''}" data-facet="${kind}" data-value="${value}" aria-pressed="${selected.includes(String(value))}" aria-label="${label}：${title}"><span>${title}</span><small>${counts[value]||0}</small></button>`).join('')}</div></div>`}
function renderFacets(){const root=$('#catalog-facets');if(!root)return;const c=C.catalogFacets(D.monsters,state,save);root.innerHTML=facetRow('family','系别',D.families.slice(1).map((x,i)=>[i+1,x]),c.family)+facetRow('rank','阶级',RANK_ORDER.map(x=>[x,x]),c.rank);const advanced=$('#advanced-facets');if(advanced)advanced.innerHTML=facetRow('size','体型',[1,2,3,4].map(x=>[x,x+'格']),c.size)+`<div class="advanced-options"><label><input id="only-owned" type="checkbox" ${state.onlyOwned?'checked':''}> 已拥有</label><label>排序 <select id="sort" aria-label="排序">${[['no','图鉴顺序'],['rank','阶级从高到低'],['atk','攻击从高到低'],['agi','敏捷从高到低']].map(([k,v])=>`<option value="${k}" ${state.sort===k?'selected':''}>${v}</option>`).join('')}</select></label></div>`;renderActiveFilters();}
function renderActiveFilters(){const root=$('#active-filters');if(!root)return;const items=[...selectedFacet('family').map(v=>['family',v,D.families[+v]]),...selectedFacet('rank').map(v=>['rank',v,v+'阶']),...selectedFacet('size').map(v=>['size',v,v+'格'])];root.innerHTML=items.map(([k,v,label])=>`<button class="active-filter" data-facet="${k}" data-value="${v}" aria-label="移除${esc(label)}筛选">${esc(label)} ×</button>`).join('')+(state.onlyOwned?'<span class="active-filter">已拥有</span>':'')+((items.length||state.onlyOwned||state.q)?'<button class="link-button" data-reset-filters>清空筛选</button>':'');}
function renderCatalogScreen(){const v=state.view,pair=v==='breed'&&state.breedMode==='pair';$('#main').innerHTML=`<div class="catalog-heading"><h1>${v==='collection'?'我的收藏':v==='breed'?'配合查询':'怪物图鉴'}</h1><span class="catalog-total">903 种</span>${v!=='breed'?'<button class="link-button" data-pair-open>两只配合</button>':''}</div>${v==='breed'?`<div class="breed-mode" role="group" aria-label="配合查询方式"><button data-breed-mode="target" aria-pressed="${!pair}" class="${!pair?'active':''}">找目标 · 怎么合成</button><button data-breed-mode="pair" aria-pressed="${pair}" class="${pair?'active':''}">选两只 · 查子代</button></div>`:''}${pair?pairLab():''}<div class="catalog-search-row"><label class="search"><span class="glass" aria-hidden="true">⌕</span><input id="search" type="search" autocomplete="off" placeholder="怪物名、技能、特性或编号" aria-label="搜索怪物" value="${esc(state.q)}"></label><button class="filter-toggle ${state.advancedFilters?'active':''}" data-more-filters aria-expanded="${!!state.advancedFilters}">更多筛选</button></div><section class="catalog-filter-panel" aria-label="怪物筛选"><label class="facet-mode"><input type="checkbox" id="combine-facets" ${state.facetMode==='combined'?'checked':''}> 同一栏可多选</label><div id="catalog-facets"></div><div id="advanced-facets" ${!state.advancedFilters?'hidden':''}></div></section><div id="active-filters" class="active-filters"></div><div id="results"></div>`;renderFacets();renderResults();if(pair)renderPairResult();}
function updateCatalog(){renderFacets();renderResults();}
const facetKeys={family:'families',rank:'ranks',size:'sizes'};
function setFacet(kind,values){
 state[facetKeys[kind]]=values;
 state[kind]='';
}
function toggleFacet(kind,value){
 const selected=selectedFacet(kind), removing=selected.includes(value);
 if(kind!=='size' && state.facetMode==='single' && value && !removing){
  setFacet(kind,[value]);
 }else{
  setFacet(kind,value?(removing?selected.filter(x=>x!==value):[...selected,value]):[]);
 }
 state.page=1;
 updateCatalog();
}
document.addEventListener('change',e=>{
 if(e.target.id!=='combine-facets')return;
 state.facetMode=e.target.checked?'combined':'single';
 if(!e.target.checked){
  for(const kind of ['family','rank'])setFacet(kind,selectedFacet(kind).slice(-1));
 }
 state.page=1;
 updateCatalog();
});
function recipeTarget(r,resultId,currentId,showResult=true){currentId=r.anchor||currentId;const {html}=readyLabel(r,currentId),counts=C.needCounts(r.parents);let members=Object.entries(counts).map(([id,n])=>mini(+id,n>1?' ×'+n:''));if(r.type==='family')members=[mini(currentId),`<span class="mini-monster"><strong>${D.families[r.family]}</strong></span>`];return `<article class="recipe ${showResult?'recipe-forward':'recipe-incoming'}"><div class="recipe-top"><span>${r.type==='four'?'四体配合':r.type==='family'?'种族 × 系别':r.type==='normal'?'普通配合':'固定配合'}</span>${html}</div><div class="recipe-role">${r.type==='four'?'祖辈材料':'亲代材料'}</div><div class="recipe-members">${members.join('<span class="operator">＋</span>')}</div><div class="recipe-target"><span>${r.type==='four'?'两代配合后得到':'配合得到'} ↓</span>${showResult?mini(resultId):`<span class="mini-monster target-static">${image(byId.get(resultId))}<span><strong>${esc(name(byId.get(resultId)))}</strong><small>${byId.get(resultId).rank} · ${D.families[byId.get(resultId).family]}</small></span></span>`}</div></article>`}
function circularRoutes(routes,m){const circular=routes.filter(r=>r.parents.includes(m.id));return circular.length?`<details class="secondary-details"><summary>同种培养配方 · ${circular.length}</summary>${applyRecipeFilters(circular,m.id).slice(0,state.normalLimit).map(r=>recipeCard(r,m.id,m.id,false)).join('')}</details>`:''}
function incomingView(m){const familyRecipes=D.monsters.flatMap(p=>p.used.filter(r=>r.type==='family'&&r.result===m.id).map(r=>({...r,anchor:p.id}))),normal=engine.incoming(m.id),fresh=normal.filter(r=>!r.parents.includes(m.id)),fixed=[...m.recipes,...familyRecipes];return `<div class="target-title"><h3>怎么合成 ${esc(name(m))}</h3><button class="link-button" data-tab="obtain">入手位置 →</button></div>${recipeFilters()}${fixed.length?fixedRoutesBlock(fixed,m,false):''}${fresh.length?normalRoutesBlock(fresh,m,false):''}${!fixed.length&&!fresh.length?`<div class="no-new-recipe"><strong>暂无首次合成配方</strong><button class="btn primary" data-tab="obtain">查看入手方式</button></div>`:''}${circularRoutes(normal,m)}<details class="secondary-details"><summary>配合规则与数据说明</summary><p>亲代通常需达到 10 级并满足性别条件。四体配方列出祖辈，需要先两两配合。普通配方按双方 +0 推算，未代入祖谱，以游戏预览为准。</p></details>`}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-facet')){const k=b.dataset.facet;if(['family','rank','size'].includes(k)){toggleFacet(k,b.dataset.value);$(`[data-facet="${k}"][data-value="${b.dataset.value}"]`)?.focus({preventScroll:true});}return;}if(b.hasAttribute('data-more-filters')){state.advancedFilters=!state.advancedFilters;$('#advanced-facets').hidden=!state.advancedFilters;b.setAttribute('aria-expanded',String(state.advancedFilters));b.classList.toggle('active',state.advancedFilters);}if(b.hasAttribute('data-breed-mode')){state.breedMode=b.dataset.breedMode;renderMain();}});

function treeRoutes(id){const m=byId.get(id);return [...m.recipes,...D.monsters.flatMap(p=>p.used.filter(r=>r.type==='family'&&r.result===id).map(r=>({...r,anchor:p.id}))),...engine.incoming(id).sort((a,b)=>Math.max(...a.parents.map(p=>byId.get(p).no))-Math.max(...b.parents.map(p=>byId.get(p).no)))].filter(r=>!r.parents.includes(id));}
function treeNode(id,path=[]){const m=byId.get(id);if(!m)return '';const trail=[...path,id];return '<li class="synthesis-node"><div class="tree-card">'+image(m)+'<button data-monster="'+id+'">'+esc(name(m))+'<small>'+m.rank+' · '+D.families[m.family]+'</small></button></div>'+(path.includes(id)?'<small class="tree-stop">循环材料 · 到此为止</small>':path.length>=5?'<small class="tree-stop">点击名字，继续查看此材料</small>':'<details class="tree-expand" data-tree-id="'+id+'" data-tree-path="'+trail.join(',')+'"><summary>展开材料</summary><div class="tree-branch"></div></details>')+'</li>';}
function synthesisTree(m){return '<details class="synthesis-tree"><summary>合成树</summary><ul class="tree-root">'+treeNode(m.id)+'</ul></details>';}
function treeBranch(id,path,index=0){const routes=treeRoutes(id),r=routes[index];if(!r)return '<div class="tree-stop">没有首次合成配方 <button data-monster="'+id+'" class="link-button">查看怪物</button></div>';const label=r=>r.type==='four'?'四体祖辈':r.type==='family'?'系别配合':r.type==='normal'?'普通配合 · +0':'固定配合';return '<label class="tree-route-label">配方 <select aria-label="选择合成树配方" data-tree-route="'+id+'" data-tree-path="'+path.join(',')+'">'+routes.map((r,i)=>'<option value="'+i+'" '+(i===index?'selected':'')+'>'+label(r)+'：'+(r.type==='family'?name(byId.get(r.anchor))+' + '+D.families[r.family]:r.parents.map(p=>name(byId.get(p))).join(' + '))+'</option>').join('')+'</select></label>'+(r.type==='four'?'<small class="tree-stop">以下是四只祖辈，需先两两配合</small>':'')+'<ul class="tree-children">'+(r.type==='family'?treeNode(r.anchor,path)+'<li class="synthesis-node tree-family">'+D.families[r.family]+' · 任意一只</li>':r.parents.map(p=>treeNode(p,path)).join(''))+'</ul>';}
document.addEventListener('toggle',e=>{const el=e.target;if(el.matches?.('.synthesis-tree')&&el.open){el.querySelector('.tree-expand').open=true;return;}if(!el.matches?.('.tree-expand')||!el.open||el.dataset.loaded)return;el.dataset.loaded='true';el.querySelector('.tree-branch').innerHTML=treeBranch(+el.dataset.treeId,el.dataset.treePath.split(',').map(Number));},true);
document.addEventListener('change',e=>{if(!e.target.matches('[data-tree-route]'))return;const el=e.target,root=el.closest('.tree-branch');root.innerHTML=treeBranch(+el.dataset.treeRoute,el.dataset.treePath.split(',').map(Number),+el.value);});

function routeMaterial(m){
 const {methods,encounters}=m.acquisition;
 const story=methods.find(x=>x.type==='story');
 if(story)return {score:1,label:story.label};
 if(encounters.length){
  const place=mapById.get(encounters[0].map);
  return {score:2,label:'出没记录 · '+(place?.name||'查看入手位置')+'（侦察条件见入手页）'};
 }
 const other=['master','bonus','egg','holy','online'].map(t=>methods.find(x=>x.type===t)).find(Boolean);
 return other?{score:other.type==='online'?10000:30,label:other.label}:{score:1000000,label:'入手方式待核实'};
}

let fullRouteGraph;
function breedingRouteGraph(){
 if(fullRouteGraph)return fullRouteGraph;
 const routes=new Map(),best=new Map();
 const add=(id,type,parents)=>{
  if(parents?.length&&(type==='four'?parents.length===4:parents.length===2)&&parents.every(p=>p!==id&&byId.has(p)))
   routes.get(id).push({type,parents});
 };
 for(const m of D.monsters){
  routes.set(m.id,[]);
  best.set(m.id,routeMaterial(m));
  for(const r of m.recipes)add(m.id,r.type,r.parents);
  for(const r of m.acquisition.methods)if(r.type==='breed')add(m.id,'normal',r.parents);
 }
 for(const m of D.monsters)for(const rule of m.used.filter(r=>r.type==='family')){
  for(const other of D.monsters)if(other.family===rule.family&&engine.calculate(m.id,other.id).some(r=>r.id===rule.result&&r.type==='family'))
   add(rule.result,'family',[m.id,other.id]);
 }
 const cost=r=>1+r.parents.reduce((sum,id)=>sum+best.get(id).score,0);
 // Positive costs guarantee that a selected parent is cheaper than its result.
 let changed=true;
 while(changed){
  changed=false;
  for(const [id,choices] of routes)for(const r of choices){
   const score=cost(r);
   if(score<best.get(id).score){best.set(id,{score,recipe:r});changed=true;}
  }
 }
 fullRouteGraph={routes,best,cost};
 return fullRouteGraph;
}

function fullBreedingRoute(m){
 const {routes,best,cost}=breedingRouteGraph(),allowed=new Map([[m.id,false]]);
 function excludesTarget(id){
  if(!allowed.has(id))allowed.set(id,best.get(id).recipe?.parents.every(excludesTarget)??true);
  return allowed.get(id);
 }
 let selected,score=Infinity;
 function consider(r){
  const value=cost(r);
  if(value<score&&r.parents.every(excludesTarget)){selected=r;score=value;}
 }
 routes.get(m.id).forEach(consider);
 for(const r of engine.incoming(m.id))consider(r);
 if(!selected)return '<p>未找到可从其他材料开始的配方。</p><button class="btn small" data-tab="obtain">查看入手方式</button>';
 const order=[],visited=new Set();
 const recipe=id=>id===m.id?selected:best.get(id).recipe;
 function visit(id){
  if(visited.has(id))return;
  visited.add(id);
  recipe(id)?.parents.forEach(visit);
  order.push(id);
 }
 visit(m.id);
 const amounts=new Map([[m.id,1]]);
 for(const id of [...order].reverse())for(const parent of recipe(id)?.parents||[])
  amounts.set(parent,(amounts.get(parent)||0)+amounts.get(id));
 const quantity=id=>amounts.get(id)>1?' ×'+amounts.get(id):'';
 const leaves=order.filter(id=>!recipe(id)),steps=order.filter(id=>recipe(id));
 function step(id){
  const r=recipe(id),label={four:'四体祖辈',family:'系别配合',normal:'普通配合（+0 推算）',pair:'固定配合'}[r.type]||'配合';
  const parentNames=r.parents.map(p=>esc(name(byId.get(p))));
  const inputs=r.type==='four'?'先配（'+parentNames.slice(0,2).join(' ＋ ')+'）和（'+parentNames.slice(2).join(' ＋ ')+'），再配两只子代':parentNames.join(' ＋ ');
  return '<li>'+mini(id,quantity(id))+'<small>'+label+'</small><div>'+inputs+'</div></li>';
 }
 return '<h4>基础材料 · 共 '+leaves.reduce((n,id)=>n+amounts.get(id),0)+' 只</h4><ul class="route-materials">'+leaves.map(id=>'<li>'+mini(id,quantity(id))+'<small>'+esc(best.get(id).label)+'</small></li>').join('')+'</ul><h4>配合顺序</h4><ol class="route-steps">'+steps.map(step).join('')+'</ol><p class="muted">按从零准备估算数量，每步列出配一只所需的亲代。普通配合以游戏预览为准。</p>';
}
document.addEventListener('toggle',e=>{
 const el=e.target;
 if(!el.matches?.('[data-full-route]')||!el.open||el.dataset.loaded)return;
 el.querySelector('.full-route-body').innerHTML=fullBreedingRoute(byId.get(+el.dataset.fullRoute));
 el.dataset.loaded='true';
},true);
function synthesisTreePanel(m){return '<details class="secondary-details" data-full-route="'+m.id+'"><summary>终极配合路线图</summary><div class="full-route-body"></div></details><ul class="tree-root">'+treeNode(m.id).replace('class="tree-expand"','open class="tree-expand"')+'</ul>';}
