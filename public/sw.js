//  Service worker: the offline half of the PWA.
//
//  Strategy (simple on purpose):
//  - Page loads (navigations): network first, cached copy as the offline
//    fallback — so a deploy is picked up on the next online visit.
//  - Everything else (JS, images, fonts): cache first, fill the cache as
//    things are fetched. Vite hashes asset filenames, so a stale file can
//    never be served against a fresh page.
const CACHE = 'wandern-gehen-v1';

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE)
            .then(cache => cache.addAll(['./', 'manifest.webmanifest']))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

    if (request.mode === 'navigate')
    {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const copy = response.clone();
                    caches.open(CACHE).then(cache => cache.put('./', copy));
                    return response;
                })
                .catch(() => caches.match('./'))
        );
        return;
    }

    event.respondWith(
        caches.match(request).then(hit => hit || fetch(request).then(response => {
            if (response.ok)
            {
                const copy = response.clone();
                caches.open(CACHE).then(cache => cache.put(request, copy));
            }
            return response;
        }))
    );
});
