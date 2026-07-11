//  Service worker: the offline half of the PWA.
//
//  Strategy (simple on purpose):
//  - Page loads (navigations): network first, cached copy as the offline
//    fallback — so a deploy's page is picked up on the next online visit.
//  - Vite-hashed bundles (assets/*-<hash>.js/.css): cache first — the
//    hash in the name makes them immutable.
//  - Everything else (the game PNGs, audio, manifest — UN-hashed names):
//    stale-while-revalidate — serve the cached copy for instant startup,
//    refresh it in the background, so a deploy lands on the NEXT launch.
//    (The old cache-first rule pinned un-hashed assets forever: a phone
//    that cached the placeholder hiker could never receive the real one.)
const CACHE = 'wandern-gehen-v2';   // v2: purge caches poisoned by that rule

const HASHED = /-[A-Za-z0-9_-]{8,}\.(?:js|css)$/;

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

    //  Store-and-pass-through. The put is AWAITED — a floating put gets
    //  abandoned when the worker idles, and large files lose that race
    //  (the original code cached small PNGs but dropped the walk sheet).
    const putThrough = async (response, key) => {
        if (response.ok)
        {
            const cache = await caches.open(CACHE);
            await cache.put(key || request, response.clone());
        }
        return response;
    };

    if (request.mode === 'navigate')
    {
        event.respondWith(
            fetch(request)
                .then(response => putThrough(response, './'))
                .catch(() => caches.match('./'))
        );
        return;
    }

    if (HASHED.test(new URL(request.url).pathname))
    {
        event.respondWith(
            caches.match(request).then(hit => hit || fetch(request).then(r => putThrough(r)))
        );
        return;
    }

    //  Stale-while-revalidate for un-hashed assets. The refresh starts
    //  immediately (waitUntil must be called synchronously) and doubles
    //  as the cache-miss response. cache:'no-cache' forces revalidation
    //  with the server — the browser's own HTTP/memory cache would
    //  otherwise happily hand back the stale copy we're trying to shed.
    const refresh = fetch(new Request(request.url, { cache: 'no-cache' })).then(r => putThrough(r));
    event.waitUntil(refresh.catch(() => {}));
    event.respondWith(
        caches.match(request).then(hit => hit || refresh)
    );
});
