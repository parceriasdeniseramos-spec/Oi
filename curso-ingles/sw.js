/* Fala Fácil · service worker: guarda o aplicativo para abrir sem internet.
   Ao mudar qualquer arquivo do app, aumente a VERSAO para os alunos receberem a atualização. */
var VERSAO = 'falafacil-v3.0';
var ARQUIVOS = ['app.html', 'src/vocabulario.js', 'src/pedagogia.js', 'src/exemplos.js', 'src/app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(VERSAO).then(function (c) { return c.addAll(ARQUIVOS); })); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VERSAO; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('message', function (e) { if (e.data === 'pular') self.skipWaiting(); });
self.addEventListener('fetch', function (e) {
  var req = e.request; if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  /* páginas: tenta a internet primeiro (pega atualizações) e usa a cópia guardada se estiver offline */
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (r) { var c = r.clone(); caches.open(VERSAO).then(function (ca) { ca.put(req, c); }); return r; })
      .catch(function () { return caches.match(req).then(function (r) { return r || caches.match('app.html'); }); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (r) { return r || fetch(req).then(function (resp) { if (resp.ok) { var c = resp.clone(); caches.open(VERSAO).then(function (ca) { ca.put(req, c); }); } return resp; }); }));
});
self.addEventListener('notificationclick', function (e) { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: 'window' }).then(function (cs) { if (cs.length) return cs[0].focus(); return self.clients.openWindow('app.html'); })); });
