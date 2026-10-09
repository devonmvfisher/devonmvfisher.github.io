/* Vesper service worker — shell + planet textures (offline friendly) */
importScripts("./js/version.js");
const CACHE_PREFIX = "vesper-next-";
const CACHE = CACHE_PREFIX + self.VesperVersion;
const ROOT = new URL("./", self.location.href);
const ASSETS = [
  "./css/polish.css",
  "./css/controls.css",
  "./js/vesper-polish-ui.js",
  "./js/vesper-polish-core.js",
  "./css/opening.css",
  "./vendor/three.module.mjs",
  "./js/vesper-opening.js",
  './',
  "./index.html",
  "./js/boot.mjs",
  './css/styles.css',
  './js/version.js',
  './js/vesper-perf.js',
  './js/vesper-messages.js',
  './js/vesper-travel.js',
  './js/vesper-input.js',
  './js/main.js',
  './js/vesper-deep-sky.js',
  './js/vesper-proc-paint.js',
  './js/vesper-proc-worker.js',
  './js/vesper-proc-textures.js',
  './js/vesper-layers.js',
  './js/vesper-radio.js',
  './js/vesper-tours.js',
  './js/vesper-hypothetics.js',
  './js/vesper-catalog.js',
  './js/vesper-surfaces.js',
  './js/vesper-walk-fx.js',
  './js/vesper-walk-audio.js',
  './js/vesper-physics-hud.js',
  './js/vesper-science.js',
  './js/vesper-hope.js',
  './js/vesper-transfer.js',
  './js/vesper-integrity.js',
  './js/vesper-milestones.js',
  './js/vesper-notebook.js',
  './js/vesper-body-notes.js',
  './js/vesper-companion-brain.js',
  './js/vesper-ship.js',
  './js/vesper-life.js',
  './js/vesper-places.js',
  './js/vesper-suit.js',
  './js/agent-overlay.js',
  './vendor/three.LICENSE.txt',
  './CREDITS.txt',
  './assets/textures/ATTRIBUTION.txt',
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png'
];

const TEXTURES = [
  './assets/textures/2k_sun.jpg',
  './assets/textures/2k_mercury.jpg',
  './assets/textures/2k_venus_atmosphere.jpg',
  './assets/textures/2k_earth_daymap.jpg',
  './assets/textures/2k_earth_clouds.jpg',
  './assets/textures/2k_moon.jpg',
  './assets/textures/2k_mars.jpg',
  './assets/textures/2k_jupiter.jpg',
  './assets/textures/2k_saturn.jpg',
  './assets/textures/2k_saturn_ring_alpha.png',
  './assets/textures/2k_uranus.jpg',
  './assets/textures/2k_neptune.jpg',
  './assets/textures/2k_stars_milky_way.jpg'
];

self.addEventListener('install', (event) => {
  // Synchronous. skipWaiting() inside waitUntil deadlocks: it waits for
  // install to finish, and install waits for skipWaiting. The worker then
  // sits in "waiting" and a reload never claims the new CACHE.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(async (c) => {
      // cache:reload so a new CACHE cannot store a stale HTTP copy of a script.
      await Promise.all(ASSETS.map(async (u) => {
        const res = await fetch(u, { cache: "reload" });
        if (!res.ok) throw new Error("vesper cache " + u);
        await c.put(u, res);
      }));
      await Promise.all(TEXTURES.map(async (u) => {
        try {
          const res = await fetch(u, { cache: "reload" });
          if (res && res.ok) await c.put(u, res);
        } catch (_) {}
      }));
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'vesper-skip-wait') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Never cache credentialed / API-key responses
  if (req.headers && req.headers.get('authorization')) return;
  const url = new URL(req.url);
  if (url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  // Never cache-first our own script. Update check must see new bytes. A stale sw.js would freeze CACHE updates.
  if (url.pathname.endsWith("/sw.js")) {
    event.respondWith(fetch(req));
    return;
  }

  // Navigations / HTML: network-first so reloads get a fresh shell
  const isNav = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html') ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/' ||
    url.pathname.endsWith('/');

  if (isNav) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.open(CACHE).then(async (c) => (await c.match(req)) || c.match('./index.html')))
    );
    return;
  }

  // Assets: cache-first, refresh in background
  event.respondWith(
    caches.open(CACHE).then((c) => c.match(req)).then((cached) => {
      const net = fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
