const CACHE='dqm2sp-handbook-20261107-v7';
const FILES=['./','index.html','style.css','data.js','core.js','app.js','manifest.webmanifest','icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('dqm2sp-handbook-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(e.request);try{const r=await fetch(e.request);if(r.ok)await cache.put(e.request,r.clone());return r}catch{return cached||Response.error()}}))});
