// Cambia il numero di versione a ogni aggiornamento dei file.
const CACHE = "diario-trading-v6";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// Rete prima, cache se offline: cosi' gli aggiornamenti arrivano subito.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request, {ignoreSearch: true})));
});

// Notifiche: il server manda un segnale vuoto, qui si leggono i messaggi in attesa.
self.addEventListener("push", e => {
  e.waitUntil((async () => {
    let list = [];
    try {
      const c = await caches.open("diario-cfg"); const r = await c.match("/__cfg"); const cfg = r ? await r.json() : {};
      if (cfg.api) list = await (await fetch(cfg.api.replace(/\/+$/, "") + "/msgs?device=" + cfg.device)).json();
    } catch (x) {}
    if (!list.length) list = [{ title: "Diario di Trading", body: "Un titolo ha superato una soglia di guadagno." }];
    for (const m of list) await self.registration.showNotification(m.title, { body: m.body, icon: "icon-192.png", badge: "icon-192.png", tag: m.title });
  })());
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window" }).then(ws => ws.length ? ws[0].focus() : clients.openWindow("./")));
});
