// Hamur Kahraman: çevrimdışı kip (uçakta, internetsiz oynamak için).
// 17 Kasım 2026: indirme kaldırıldı, yeni cihaz bu dosyayı kaydetmez. Önceden indirmiş cihaz (Ateş'in iPad'i) çalışmaya devam etsin diye dosya yerinde.
// Kural: sayfa ve kod önce internetten (güncel kalsın), olmazsa kayıttan; görsel, ses ve film önce kayıttan.
var KAYIT = "hamur-kahraman";
var MEDYA = /\.(png|jpg|jpeg|mp3|mp4|webmanifest)$/i;

self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });

function kayittan(istek) {
  var u = new URL(istek.url);
  if (u.pathname.slice(-1) === "/") u.pathname += "index.html"; // klasör adresi → index.html
  return caches.open(KAYIT).then(function (c) { return c.match(u.pathname, { ignoreSearch: true }); });
}

// Film: Safari videoyu parça parça ister (Range). Kayıttaki tam dosyadan istenen parça kesilip 206 ile verilir.
function parca(yanit, aralik) {
  return yanit.blob().then(function (b) {
    var m = /bytes=(\d*)-(\d*)/.exec(aralik) || [], boy = b.size, bas, son;
    if (m[1] === "" && m[2]) { bas = Math.max(0, boy - +m[2]); son = boy - 1; }
    else { bas = +(m[1] || 0); son = m[2] ? Math.min(+m[2], boy - 1) : boy - 1; }
    if (bas > son || bas >= boy) return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + boy } });
    return new Response(b.slice(bas, son + 1), { status: 206, statusText: "Partial Content", headers: {
      "Content-Type": yanit.headers.get("Content-Type") || "video/mp4", "Accept-Ranges": "bytes",
      "Content-Range": "bytes " + bas + "-" + son + "/" + boy, "Content-Length": String(son - bas + 1) } });
  });
}

self.addEventListener("fetch", function (e) {
  var istek = e.request, u = new URL(istek.url);
  if (istek.method !== "GET" || u.origin !== location.origin) return;
  var aralik = istek.headers.get("range");
  if (MEDYA.test(u.pathname)) {
    e.respondWith(kayittan(istek).then(function (y) {
      if (y) return aralik ? parca(y, aralik) : y;
      return fetch(istek);
    }));
    return;
  }
  // sayfa, kod, dosya listesi: önce internet; internet yoksa kayıt
  e.respondWith(fetch(istek).then(function (y) {
    if (y && y.ok) {
      var kopya = y.clone();
      caches.open(KAYIT).then(function (c) {
        var yol = u.pathname.slice(-1) === "/" ? u.pathname + "index.html" : u.pathname;
        c.match(yol).then(function (var_) { if (var_ || /\/menu\.js$/.test(yol)) c.put(yol, kopya); }); // indirilmiş olanı tazele; sonradan eklenen ⏸ menüsü de kaydedilir
      });
    }
    return y;
  }).catch(function () {
    return kayittan(istek).then(function (y) {
      return y || new Response("İnternet yok ve bu sayfa indirilmemiş. İnternete bağlanınca yeniden dene.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    });
  }));
});
