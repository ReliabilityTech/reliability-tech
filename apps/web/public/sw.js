// Service worker do papel RESPONSAVEL (roadmap 6.3). Só dois casos tratados:
// 1) asset estático do build (`/_next/static/...`, nome com hash — nunca fica
//    velho) entra em cache-first; 2) navegação que falha por estar offline cai
//    pro offline.html. Tudo mais (página, API, RSC payload) passa direto pra
//    rede sem interceptar — é isso que evita servir dado velho ou de outro
//    tenant a partir do cache.
const CACHE_VERSION = 'arbora-pwa-v1';
const PRECACHE_URLS = ['/offline.html', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(
          chaves.filter((chave) => chave !== CACHE_VERSION).map((chave) => caches.delete(chave)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cacheada = await cache.match(request);
        if (cacheada) {
          return cacheada;
        }
        const resposta = await fetch(request);
        if (resposta.ok) {
          cache.put(request, resposta.clone());
        }
        return resposta;
      }),
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline.html')));
  }
});
