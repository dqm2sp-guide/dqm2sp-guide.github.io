import fs from 'node:fs/promises';
import path from 'node:path';
export async function buildDqm1({sourceDir,outputDir,dqm2DataPath}){
 const read=f=>fs.readFile(path.join(sourceDir,f),'utf8');
 const data=JSON.parse(await read('data.json')),mapping=JSON.parse(await read('image-map.json'));
 delete data.battle;
 data.story=JSON.parse(await read('story.json'));
 data.breeding=JSON.parse(await read('breeding-rules.json'));
 const ids=new Set(data.monsters.map(m=>m.id));
 if(ids.size!==data.monsters.length)throw Error('Duplicate DQM1 monster identity');
 for(const m of data.monsters)for(const r of m.recipes||[])for(const id of r.parents)if(!ids.has(id))throw Error('Unknown DQM1 recipe parent: '+id);
 for(const c of data.story.chapters||[])for(const id of c.monsters||[])if(!ids.has(id))throw Error('Unknown DQM1 story monster: '+id);
 const two=JSON.parse(await fs.readFile(dqm2DataPath,'utf8')),images=new Map(two.monsters.map(m=>[m.id,m.image]));
 for(const m of data.monsters){const link=mapping.monsters.find(x=>x.dqm1Id===m.id);m.image=link?images.get(link.dqm2Id):null;}
 let html=await read('index.html');
 html=html.replace('href="../index.html"','href="__DQM2__"').replaceAll('href="index.html"','href="dqm1.html"').replace('href="__DQM2__"','href="index.html"');
 const css=await read('preview.css'),core=await read('core.js'),app=await read('preview.js');new Function(core);new Function(app);
 html=html.replace('<link rel="stylesheet" href="preview.css">',()=>'<style>'+css+'</style>')
 .replace('<script src="data.js"></script>',()=>'<script>window.DQM1_DATA='+JSON.stringify(data).replaceAll('<','\\u003c')+';</script>')
 .replace('<script src="core.js"></script>',()=>'<script>'+core+'</script>')
 .replace('<script src="preview.js"></script>',()=>'<script>'+app+'</script>');
 await fs.mkdir(outputDir,{recursive:true});await fs.writeFile(path.join(outputDir,'dqm1.html'),html);return {count:data.monsters.length,bytes:Buffer.byteLength(html)};
}
