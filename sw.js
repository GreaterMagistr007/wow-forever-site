// Оффлайн-кэш справочника: всё кэшируется при установке, версия меняется при каждой правке.
const CACHE = 'wowf-fe902c8475';
const FILES = ["./", "addons-01.html", "addons-02.html", "addons-03.html", "addons-04.html", "addons-05.html", "addons.html", "app.js", "dungeons-01.html", "dungeons-02.html", "dungeons-03.html", "dungeons-04.html", "dungeons-05.html", "dungeons-06.html", "dungeons.html", "gold-01.html", "gold-02.html", "gold-03.html", "gold-04.html", "gold-05.html", "gold-06.html", "gold-07.html", "gold-08.html", "gold.html", "guide-auctionator.html", "guide-first-gold.html", "guide-first-hour.html", "guide-level-60.html", "guide-leveling-route.html", "guide-professions.html", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "index.html", "leveling-01.html", "leveling-02.html", "leveling-03.html", "leveling-04.html", "leveling-05.html", "leveling-06.html", "leveling-07.html", "leveling-08.html", "leveling-09.html", "leveling-10.html", "leveling-11.html", "leveling.html", "linux-01.html", "linux-02.html", "linux-03.html", "linux-04.html", "linux-05.html", "linux-06.html", "linux.html", "manifest.json", "payment-01.html", "payment-02.html", "payment-03.html", "payment-04.html", "payment-05.html", "payment-06.html", "payment.html", "professions-01.html", "professions-02.html", "professions-03.html", "professions-04.html", "professions-05.html", "professions-06.html", "professions-07.html", "professions-08.html", "professions-09.html", "professions-10.html", "professions-11.html", "professions.html", "routes-01.html", "routes-02.html", "routes-03.html", "routes-04.html", "routes-05.html", "routes-06.html", "routes-07.html", "routes-08.html", "routes-09.html", "routes-10.html", "routes-11.html", "routes-12.html", "routes-13.html", "routes-14.html", "routes.html", "search-index.js", "start-01.html", "start-02.html", "start-03.html", "start-04.html", "start-05.html", "start-06.html", "start-07.html", "start-08.html", "start.html", "style.css", "travel-01.html", "travel-02.html", "travel-03.html", "travel-04.html", "travel-05.html", "travel.html"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('wowf-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Страницы и поисковый индекс: сначала сеть (чтобы правки были видны сразу), без сети — кэш.
// Стили, скрипт, иконки: сначала кэш. Ищем только в своём кэше: на том же адресе могут
// жить кэши других сайтов, и caches.match() по всем отдал бы их страницы.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const fresh = e.request.mode === 'navigate' || /\.html$|\/$|search-index\.js$/.test(url.pathname);
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (fresh) {
      try {
        const r = await fetch(e.request);
        if (r.ok) cache.put(e.request, r.clone());
        return r;
      } catch (err) {
        return (await cache.match(e.request, { ignoreSearch: true })) || Response.error();
      }
    }
    return (await cache.match(e.request, { ignoreSearch: true })) || fetch(e.request);
  })());
});
