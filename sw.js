// Done is great: funziona anche offline (salva solo i file dell'app e i font)
const CACHE = 'done-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const own = url.origin === self.location.origin;
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!own && !font) return; // Gemini, Google Calendar ecc.: mai in cache
  const put = res => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return res; };
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(put).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  if (own) { // file dell'app: prima la rete, così gli aggiornamenti arrivano subito
    e.respondWith(fetch(req).then(put).catch(() => caches.match(req)));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(put)));
});
