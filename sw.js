const CACHE="pomoshchnik";
const CORE=["./","./index.html","./manifest.json","./rates.json",
            "./icon-192.png","./icon-512.png","./apple-touch-icon.png"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys()
    .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});

/* страница и данные — всегда из сети, если она есть; кэш только как запас */
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const p=new URL(e.request.url).pathname;
  const live = e.request.mode==="navigate" || p.endsWith("/") ||
               p.endsWith("index.html") || p.endsWith("rates.json") || p.endsWith("manifest.json");
  if(live){
    e.respondWith(fetch(e.request).then(res=>{
      if(res&&res.status===200){const c=res.clone();caches.open(CACHE).then(x=>x.put(e.request,c));}
      return res;
    }).catch(()=>caches.match(e.request).then(h=>h||caches.match("./index.html"))));
    return;
  }
  e.respondWith(caches.match(e.request).then(h=>h||fetch(e.request).then(res=>{
    if(res&&res.status===200&&res.type==="basic"){const c=res.clone();caches.open(CACHE).then(x=>x.put(e.request,c));}
    return res;
  }).catch(()=>caches.match("./index.html"))));
});
