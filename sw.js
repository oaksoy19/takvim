const CACHE = 'takvim-v1';
const ASSETS = [
  '/takvim/',
  '/takvim/index.html',
  '/takvim/manifest.json',
  'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap'
];

// Kurulum: dosyaları önbelleğe al
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Ana dosyaları önbelleğe al, font hataları varsa devam et
      return cache.addAll(['/takvim/', '/takvim/index.html', '/takvim/manifest.json'])
        .catch(() => {});
    })
  );
  self.skipWaiting();
});

// Aktivasyon: eski önbellekleri temizle
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: önce önbellekten sun, yoksa ağdan al ve önbelleğe ekle
self.addEventListener('fetch', e => {
  // POST isteklerini ve chrome-extension'ları atla
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Sadece geçerli yanıtları önbelleğe al
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return response;
      }).catch(() => {
        // Ağ yoksa ve önbellekte de yoksa boş yanıt
        return new Response('', { status: 503 });
      });
    })
  );
});
