(() => {

  const SITE = location.protocol + '//' + location.host;
  const openCache = caches.open('geo');
  const any = $ => new Promise((D, E, A, L) => {
    A = [];
    L = $.map(($, i) => Promise
        .resolve($)
        .then(D, O => (((A[i] = O), --L) || E(A)))
    ).length;
  });

  addEventListener('install', e => {
    e.waitUntil(
      openCache.then(cache => cache.addAll([
        '/css/images/host-icon-2x.png',
        '/css/images/host-icon.png',
        '/css/images/marker-icon-2x.png',
        '/css/images/marker-icon.png',
        '/css/images/marker-shadow.png',
        '/css/leaflet.css',
        '/css/main.css',
        '/favicon.ico',
        '/js/3rd/hyperhtml.js',
        '/js/3rd/leaflet.js',
        '/js/3rd/nosleep.js',
        '/js/3rd/pusher.js',
        '/js/3rd/lightdown.js',
        '/dist/min.js',
        decodeURIComponent(location.search.slice(1))
      ]))
    );
  });

  addEventListener('fetch', e => {
    const request = e.request;
    const url = request.url;
    if (request.method === 'POST' || url.indexOf(SITE) !== 0)
      e.respondWith(fetch(request));
    else
      e.respondWith(
        openCache.then(cache => cache.match(request).then(
          response => {
            const remote = fetch(request).then(
              response => {
                if (200 <= response.status && response.status < 400) {
                  cache.put(request, response.clone());
                } else if (navigator.onLine){
                  console.warn(url);
                }
                return response;
              },
              error => { if (navigator.onLine) console.warn(url, error); }
            );
            return any([response || remote, remote]);
          }
        ))
      );
  });

})();
