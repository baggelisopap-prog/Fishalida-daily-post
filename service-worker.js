const CACHE_NAME = 'fishalida-cache-v1';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app.js',
    './style.css',
    './config.js',
    './manifest.json',
    './icons/icon-192.svg',
    './icons/icon-512.svg'
];

// Εγκατάσταση και αποθήκευση στο Cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Ενεργοποίηση και καθαρισμός παλιών Cache
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch events: Stale-While-Revalidate (εξαιρείται το API της Supabase)
self.addEventListener('fetch', (event) => {
    // Αγνοούμε requests που πάνε στη βάση (Supabase) ή δεν είναι GET
    if (event.request.method !== 'GET' || event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Ανανέωση του cache με την πιο πρόσφατη έκδοση από το δίκτυο
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            }).catch(() => {
                // Fallback αν δεν υπάρχει δίκτυο
                return cachedResponse;
            });
            
            // Επιστρέφουμε την cached έκδοση αν υπάρχει, αλλιώς περιμένουμε το δίκτυο
            return cachedResponse || fetchPromise;
        })
    );
});