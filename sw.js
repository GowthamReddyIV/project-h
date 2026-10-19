// Service worker: offline shell. index.html (encrypted page) is network-first so updates appear; static assets cache-first.
// /api/* (personal entries, token-authenticated) is never cached here; the app keeps its own offline queue in localStorage.
const CACHE = 'health-v9';
const B = new URL('./', self.location).pathname;   // '/' or '/project-h/' on GitHub Pages
const SHELL = ['', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-32.png'].map(f => B + f);
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  if (u.pathname.startsWith('/api/')) return;   // network only
  const isPage = r.mode === 'navigate' || u.pathname === B || u.pathname.endsWith('.html');
  if (isPage) {
    e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(B, c)); } return res; })
      .catch(() => caches.match(B)));
  } else {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); } return res; })));
  }
});
