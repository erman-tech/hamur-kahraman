/* Hamur Kahraman: Papağanı Kurtar. Üç şeritli çatı koşusu (dik, 720×1280).
   Dronlar papağanı ağla kaçırır; kahraman arkadan görünür, engellerden kaçarak dronlara yetişir.
   Stop motion hissi: zemin ve pozlar saniyede 12 adımla ilerler. Bütün görseller oyun hamuru. */
(function () {
  "use strict";
  var G = 720, Y = 1280, $ = function (i) { return document.getElementById(i); };
  var tuval = $("tuval"), c = tuval.getContext("2d"), sahne = $("sahne");
  function olcekle() {
    var o = Math.min(innerWidth / G, innerHeight / Y);
    sahne.style.transform = "translate(" + Math.round((innerWidth - G * o) / 2) + "px," + Math.round((innerHeight - Y * o) / 2) + "px) scale(" + o + ")";
    $("dondur").style.display = innerWidth > innerHeight * 1.15 && innerHeight < 620 ? "flex" : "none";
  }
  addEventListener("resize", olcekle); olcekle();

  var BAG = new URLSearchParams(location.search), SERI = BAG.get("seri") === "kotu" ? "kotu" : "iyi";
  try { var tf = localStorage.getItem("hk_taraf"); if (!BAG.get("seri") && (tf === "iyi" || tf === "kotu")) SERI = tf; } catch (e) {}
  var K = SERI === "iyi" ? "kt" : "st"; // Tokyo'ya giden kahraman ninja kostümündedir

  var R = {};
  ["arka.jpg", "zemin.jpg", "bariyer", "kapi", "blok", "dron", "papagan_ag", "onigiri", "kalp", K + "_k1", K + "_k2", K + "_zip", K + "_kay"].forEach(function (a) {
    var im = new Image(); im.src = "varlik/" + (a.indexOf(".") > 0 ? a : a + ".png"); R[a.replace(".jpg", "")] = im;
  });
  var S = {};
  ["muzik", "e_pop", "e_simit", "e_ah", "e_zafer", "a_kosu1", "a_kosu2", "p_kosu3", "a_kosu4"].forEach(function (a) { var s = new Audio("ses/" + a + ".mp3"); s.preload = "auto"; S[a] = s; });
  S.muzik.loop = true; S.muzik.volume = 0.22;
  function cal(a, v) { try { var s = S[a].cloneNode(); s.volume = v == null ? 1 : v; var p = s.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
  function muzik(ac) { try { if (ac) { var p = S.muzik.play(); if (p && p.catch) p.catch(function () {}); } else S.muzik.pause(); } catch (e) {} }

  // ---------- sahte derinlik ----------
  var UFUK = 470, TABAN = 1150, ZK = 430, SERIT = 205, YOL = 345;
  function oran(z) { return ZK / (ZK + z); }          // 1: kahramanın hizası, 0: ufuk
  function ey(z) { return UFUK + (TABAN - UFUK) * oran(z); }
  function ex(serit, z) { return G / 2 + serit * SERIT * oran(z); }

  var D = { ekran: "kapak", oyun: null };
  function ekranAc(ad) { D.ekran = ad; ["kapak", "sonuc"].forEach(function (e) { $(e).classList.toggle("acik", e === ad); }); }
  var SURE = 46; // engelsiz koşuda dronlara yetişme süresi (sn)

  function yeniOyun() {
    return { t: 0, yol: 0, hiz: 820, serit: 0, sx: 0, zy: 0, zvy: 0, kay: 0, can: 3, dokunulmaz: 0, onigiri: 0, yakin: 0, durum: "oyna", bitis: 0,
      engeller: [], sonraki: 1500, mesaj: "", mesajSn: 0, tohum: 1 + Math.floor(Math.random() * 9999), parcalar: [] };
  }
  function rasgele(o) { o.tohum = (o.tohum * 16807) % 2147483647; return o.tohum / 2147483647; }
  function mesajVer(o, m, sn) { o.mesaj = m; o.mesajSn = sn; }
  function baslat() { D.oyun = yeniOyun(); ekranAc("oyun"); muzik(true); cal("a_kosu1", 1); mesajVer(D.oyun, "Dronlara yetiş!", 2.5); }

  // Engel sırası: her sırada en az bir şerit ya boş ya da aşılabilir (zıpla/kay) kalır.
  function siraEkle(o, z) {
    var zor = Math.min(1, o.t / 45), tip = rasgele(o), bos = Math.floor(rasgele(o) * 3) - 1, i;
    for (i = -1; i <= 1; i++) {
      if (i === bos) { if (rasgele(o) < 0.75) for (var j = 0; j < 3; j++) o.engeller.push({ z: z + j * 150, serit: i, tur: "onigiri" }); continue; }
      var r = rasgele(o);
      if (r < 0.5 - zor * 0.15) continue;                                   // bu şerit de boş
      o.engeller.push({ z: z, serit: i, tur: tip < 0.38 ? "bariyer" : tip < 0.7 ? "kapi" : r < 0.75 ? "blok" : "bariyer" });
    }
  }

  var tus = {};
  function hamle(yon) {
    var o = D.oyun; if (!o || o.durum !== "oyna") return;
    if (yon === "sol" && o.serit > -1) { o.serit--; cal("e_pop", 0.25); }
    if (yon === "sag" && o.serit < 1) { o.serit++; cal("e_pop", 0.25); }
    if (yon === "yukari" && o.zy === 0 && o.kay <= 0) { o.zvy = 1250; cal("e_pop", 0.4); }
    if (yon === "asagi" && o.kay <= 0) { o.kay = 0.75; if (o.zy > 0) o.zvy = -1400; }
  }
  addEventListener("keydown", function (e) {
    var y = { ArrowLeft: "sol", ArrowRight: "sag", ArrowUp: "yukari", ArrowDown: "asagi", a: "sol", d: "sag", w: "yukari", s: "asagi", " ": "yukari" }[e.key];
    if (y) { e.preventDefault(); if (!tus[e.key]) hamle(y); tus[e.key] = true; }
  });
  addEventListener("keyup", function (e) { tus[e.key] = false; });
  var dok = null;
  sahne.addEventListener("touchstart", function (e) { var t = e.changedTouches[0]; dok = { x: t.clientX, y: t.clientY, oldu: false }; }, { passive: true });
  sahne.addEventListener("touchmove", function (e) {
    if (!dok || dok.oldu) return; var t = e.changedTouches[0], dx = t.clientX - dok.x, dy = t.clientY - dok.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
    dok.oldu = true; hamle(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "sag" : "sol") : (dy > 0 ? "asagi" : "yukari"));
  }, { passive: true });
  sahne.addEventListener("touchend", function () { dok = null; }, { passive: true });

  function incit(o) {
    if (o.dokunulmaz > 0) return;
    o.can--; o.dokunulmaz = 1.3; o.yakin = Math.max(0, o.yakin - 0.05); o.hiz = Math.max(650, o.hiz - 250); cal("e_ah", 0.7);
    mesajVer(o, o.can > 0 ? "Ah! Dronlar uzaklaştı!" : "", 1.2);
    if (o.can <= 0) bitir(o, false);
  }
  function bitir(o, kazandi) {
    if (o.durum !== "oyna") return; o.durum = kazandi ? "kazandi" : "kayip"; o.bitis = kazandi ? 2.6 : 1.4;
    if (kazandi) { cal("e_zafer", 0.8); cal("a_kosu2", 1); setTimeout(function () { cal("p_kosu3", 1); }, 2300); mesajVer(o, "Yakaladın! Papağan kurtuldu!", 3); }
    else cal("a_kosu4", 1);
  }
  function sonucAc(o) {
    muzik(false); var kz = o.durum === "kazandi";
    $("sonucBaslik").textContent = kz ? "Papağan kurtuldu!" : "Dronlar kaçtı!";
    $("sonucYazi").textContent = kz ? o.onigiri + " onigiri topladın. Şimdi papağanla birlikte Tokyo'yu kurtarma zamanı!" : "Engellere üç kez çarptın. Bir daha dene, bu sefer yetişirsin!";
    $("devam").style.display = kz ? "" : "none"; $("tekrar").style.display = kz ? "none" : "";
    ekranAc("sonuc");
  }

  function guncelle(dt) {
    var o = D.oyun; if (!o) return; o.t += dt;
    if (o.mesajSn > 0) o.mesajSn -= dt;
    if (o.durum !== "oyna") { o.bitis -= dt; if (o.durum === "kazandi") o.yol += o.hiz * 0.4 * dt; if (o.bitis <= 0 && D.ekran === "oyun") sonucAc(o); return; }
    var hedef = 820 + 380 * o.yakin; o.hiz += (hedef - o.hiz) * Math.min(1, dt * 0.8);
    o.yol += o.hiz * dt; o.yakin = Math.min(1, o.yakin + dt / SURE);
    if (o.dokunulmaz > 0) o.dokunulmaz -= dt;
    o.sx += (o.serit - o.sx) * Math.min(1, dt * 14);
    if (o.zy > 0 || o.zvy > 0) { o.zvy -= 3300 * dt; o.zy += o.zvy * dt; if (o.zy <= 0) { o.zy = 0; o.zvy = 0; } }
    if (o.kay > 0) o.kay -= dt;
    // engeller yaklaşır
    o.sonraki -= o.hiz * dt;
    if (o.sonraki <= 0 && o.yakin < 0.97) { siraEkle(o, 2700); o.sonraki = 1150 - 250 * Math.min(1, o.t / 40) + rasgele(o) * 250; }
    for (var i = o.engeller.length - 1; i >= 0; i--) {
      var e = o.engeller[i], once = e.z; e.z -= o.hiz * dt;
      if (once > 30 && e.z <= 30 && Math.abs(e.serit - o.sx) < 0.5) {       // kahramanın hizasına geldi
        if (e.tur === "onigiri") { if (o.zy < 150) { o.onigiri++; cal("e_simit", 0.4); if (o.onigiri % 10 === 0 && o.can < 3) { o.can++; mesajVer(o, "10 onigiri: bir can geri geldi!", 1.5); } o.engeller.splice(i, 1); continue; } }
        else if (e.tur === "bariyer" ? o.zy < 85 : e.tur === "kapi" ? !(o.kay > 0 && o.zy < 40) : true) incit(o);
      }
      if (e.z < -260) o.engeller.splice(i, 1);
    }
    if (o.yakin >= 1) bitir(o, true);
  }

  function resim(im, x, y, yuk, alfa) { // (x, y): tabanın ortası
    if (!im.complete || !im.naturalWidth) return; var g = yuk * im.width / im.height;
    if (alfa != null) c.globalAlpha = alfa; c.drawImage(im, x - g / 2, y - yuk, g, yuk); c.globalAlpha = 1;
  }
  function yazi(m, x, y, boy, renk, hiza) {
    c.font = "bold " + boy + "px 'Arial Rounded MT Bold','Chalkboard SE','Trebuchet MS',sans-serif"; c.textAlign = hiza || "center";
    c.lineWidth = boy / 5; c.strokeStyle = "rgba(20,25,60,.85)"; c.lineJoin = "round"; c.strokeText(m, x, y); c.fillStyle = renk || "#fff"; c.fillText(m, x, y);
  }
  var BOY = { bariyer: 135, kapi: 400, blok: 330, onigiri: 80 };
  function ciz() {
    var o = D.oyun; if (!o) return;
    var poz = Math.floor(o.t * 12), yolAdim = Math.floor(o.yol / 40) * 40, i;
    c.drawImage(R.arka, 0, 0, G, Y);
    // zemin: hamur çatı dokusu satır satır, derinliğe göre daralarak
    var z = R.zemin;
    if (z.complete && z.naturalWidth) {
      var zh = z.naturalHeight, olc = 0.9;
      for (var y = UFUK + 4; y < Y; y += 4) {
        var t = (y - UFUK) / (TABAN - UFUK), zz = ZK * (1 / t - 1), v = ((zh - ((zz + yolAdim) * olc) % zh) % zh + zh) % zh;
        var sy = Math.min(zh - 1, Math.floor(v)), sh = Math.max(1, Math.min(zh - sy, Math.ceil(4 * olc / (t * t) * (ZK / (TABAN - UFUK)))));
        c.drawImage(z, 0, sy, z.naturalWidth, sh, G / 2 - YOL * t, y, 2 * YOL * t, 4.5);
      }
    }
    // dronlar ve papağan: yaklaştıkça büyür
    var dz = 300 + 2300 * (1 - o.yakin), dt2 = oran(dz), dsal = Math.sin(poz * 0.6) * 20;
    var dy = ey(dz) - 250 * dt2 - (o.durum === "kazandi" ? 0 : 60), kzn = o.durum === "kazandi";
    if (!kzn) resim(R.papagan_ag, G / 2 + dsal * dt2 * 4, dy, 420 * dt2 + 60);
    // engeller: uzaktan yakına
    var sirali = o.engeller.slice().sort(function (a, b) { return b.z - a.z; }), kahCizildi = false;
    function kahraman() {
      var kx = G / 2 + o.sx * SERIT, ky = TABAN - o.zy * 0.75, kos = o.zy <= 5 && !(o.kay > 0),
        faz = Math.floor(o.yol / 150) % 4,   // adım yola bağlı (hız artınca adım da hızlanır): sol adım, uçuş, sağ adım (ayna), uçuş (ayna)
        ad = o.zy > 5 ? "_zip" : o.kay > 0 ? "_kay" : (faz % 2 ? "_k2" : "_k1"), ayna = kos && faz >= 2;
      if (kos && faz % 2) ky -= 14;          // uçuş karesinde gövde yükselir, ayak yerden kesilir
      c.fillStyle = "rgba(20,15,40,.35)"; c.beginPath(); c.ellipse(kx, TABAN + 6, 70 - Math.min(35, o.zy / 8), 16, 0, 0, 7); c.fill();
      if (!(o.dokunulmaz > 0 && poz % 2)) {
        c.save(); c.translate(kx, 0); if (ayna) c.scale(-1, 1);
        resim(R[K + ad], 0, ky + (ad === "_kay" ? 10 : 0), ad === "_kay" ? 190 : ad === "_zip" ? 270 : 290); c.restore();
      }
    }
    for (i = 0; i < sirali.length; i++) {
      var e = sirali[i];
      if (!kahCizildi && e.z < 0) { kahraman(); kahCizildi = true; }
      var et = oran(e.z); if (e.z > 2600) continue;
      var alfa = e.z > 2200 ? (2600 - e.z) / 400 : e.z < -120 ? Math.max(0, (260 + e.z) / 140) : 1;
      resim(R[e.tur], ex(e.serit, e.z), ey(e.z) - (e.tur === "onigiri" ? 60 * et : 0), BOY[e.tur] * et, alfa);
    }
    if (!kahCizildi) kahraman();
    if (kzn) { // papağan ağdan çıktı: kahramanın yanına iner
      var pk = Math.min(1, (2.6 - o.bitis) / 1.2);
      resim(R.papagan_ag, G / 2 + (o.sx * SERIT + 150 - 0) * pk, 500 + (TABAN - 620) * pk, 300);
    }
    // gösterge
    for (i = 0; i < 3; i++) resim(R.kalp, 60 + i * 62, 96, 54, i < o.can ? 1 : 0.25);
    resim(R.onigiri, 60, 168, 54); yazi("" + o.onigiri, 100, 160, 34, "#ffd23a", "left");
    c.fillStyle = "rgba(20,25,60,.6)"; c.fillRect(250, 60, 420, 26);
    c.fillStyle = "#39d0e8"; c.fillRect(254, 64, 412 * o.yakin, 18);
    yazi("dronlara uzaklık", 460, 116, 22);
    if (o.t < 6 && o.durum === "oyna") { yazi("Kaydır: ← → şerit", G / 2, 300, 34, "#ffd23a"); yazi("↑ zıpla   ↓ kay", G / 2, 346, 30); }
    if (o.mesajSn > 0 && o.mesaj) yazi(o.mesaj, G / 2, 420, 40);
  }

  $("basla").addEventListener("click", baslat);
  $("tekrar").addEventListener("click", baslat);
  $("yeni").addEventListener("click", function () { muzik(false); location.href = "../index.html"; });
  $("devam").addEventListener("click", function () { muzik(false); location.href = "../istanbul/index.html?devam=tokyo&seri=" + SERI; });

  var son = 0;
  function dongu(zmn) { var dt = Math.min(0.05, (zmn - son) / 1000 || 0); son = zmn; if (D.ekran === "oyun") { guncelle(dt); ciz(); } requestAnimationFrame(dongu); }
  requestAnimationFrame(dongu);
  // deneme kancası
  window.__oyun = { D: D, baslat: baslat, hamle: hamle, ilerlet: function (sn) { for (var t = 0; t < sn; t += 1 / 60) guncelle(1 / 60); ciz(); var o = D.oyun; return { yakin: +o.yakin.toFixed(2), can: o.can, durum: o.durum, onigiri: o.onigiri }; } };
})();
