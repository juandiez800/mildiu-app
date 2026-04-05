self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("mildiu-cache").then(cache =>
      cache.addAll(["/", "/index.html", "/app.js", "/style.css"])
    )
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});