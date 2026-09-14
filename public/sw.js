const CACHE = "swasthya-setu-v3";
const CORE = ["/manifest.webmanifest", "/icon.svg", "/rural-health-hero.png"];

self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())));

self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => { 
          const clonedResponse = response.clone();
          caches.open(CACHE).then(cache => cache.put("/offline", clonedResponse)); 
          return response; 
        })
        .catch(() => caches.match("/offline").then(res => res || new Response("You are completely offline and the page is not cached.", { status: 503 })))
    );
    return;
  }
  
  // For JS/CSS assets, always try network first to get latest code
  const url = new URL(event.request.url);
  if (url.pathname.includes("/_next/")) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, clonedResponse));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(cached => 
      cached || fetch(event.request).then(response => {
        if (response.ok && new URL(event.request.url).origin === location.origin) {
          const clonedResponse = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clonedResponse));
        }
        return response;
      }).catch(() => caches.match("/").then(res => res || new Response("Offline", { status: 503 })))
    )
  );
});
