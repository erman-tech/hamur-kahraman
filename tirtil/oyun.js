/* Hamur Kahraman 2: Uzaylı Tırtıl — tek bölüm. Tek dosya, kütüphane yok.
   Akış: kapak → açılış filmi → kahraman seçimi → oyun → sonuç.
   Oyun: kahramanın çıkışı çakıl taşı yığınıyla kapalı, labirentten uzaylı tırtıl Vıcık geliyor. Yerin altındaki
   şeker tahtasında yan yana duran aynı şekerlere dokununca patlarlar; açılan boşluğa taşlar akar. Tahtanın altına
   kadar yol açılırsa taşlar suya dökülür. Yığın boşalınca kahraman kapıdan kaçar. */
(function () {
  "use strict";
  var G = 1280, Y = 720, POZ = 12; // saniyede 12 poz: stop motion
  var $ = function (id) { return document.getElementById(id); };
  var tuval = $("tuval"), c = tuval.getContext("2d"), film = $("film");

  function olcekle() {
    var k = Math.min(innerWidth / G, innerHeight / Y), s = $("sahne");
    s.style.transform = "scale(" + k + ")";
    s.style.left = (innerWidth - G * k) / 2 + "px";
    s.style.top = (innerHeight - Y * k) / 2 + "px";
  }
  addEventListener("resize", olcekle); olcekle();

  // ---------- varlıklar ----------
  var KAHRAMANLAR = ["e1", "e2", "e3", "e4", "k1", "k2", "k3", "k4"];
  var SEKER = ["j_ayi", "j_kola", "s_lolipop", "j_yumurta", "s_yildiz", "s_mor"];           // jelibonlar ve şekerler
  var SRENK = ["#e23b2e", "#8a5a2b", "#2f8fe0", "#fff3c4", "#f7d514", "#8d4fc4"];
  var R = {};
  function resimYukle(a) { var im = new Image(); im.src = "varlik/" + a + ".png"; R[a] = im; }
  ["bas", "bas_sersem", "top_mor", "top_turuncu", "top_mavi", "top_sari", "ufo", "tas1", "tas2", "kapi", "pb1", "pb2"].concat(SEKER).forEach(resimYukle);
  KAHRAMANLAR.forEach(function (k) { ["dur", "kos1", "kos2", "at"].forEach(function (p) { resimYukle(k + "_" + p); }); });

  var sesAdlari = ["e_pop", "e_ah", "e_zafer", "e_firla", "e_tas", "k_it1", "k_it2", "k_it3", "p_nasil", "p_yakin", "p_sec", "p_kazandin", "p_kaybettin", "t_2", "t_3", "t_4", "t_5", "muzik"];
  var AC = window.AudioContext || window.webkitAudioContext, ac = null, tampon = {}, yedek = {}, muzikDugum = null;
  sesAdlari.forEach(function (a) { var s = new Audio(); s.preload = "auto"; s.src = "ses/" + a + ".mp3"; yedek[a] = s; });
  yedek.muzik.loop = true; yedek.muzik.volume = 0.22;
  function sesAc() {
    if (ac || !AC || location.protocol === "file:") { if (ac && ac.state === "suspended") ac.resume(); return; }
    try {
      ac = new AC(); ac.resume();
      sesAdlari.forEach(function (a) {
        fetch("ses/" + a + ".mp3").then(function (r) { return r.arrayBuffer(); }).then(function (d) {
          ac.decodeAudioData(d, function (t) { tampon[a] = t; }, function () {});
        }).catch(function () {});
      });
    } catch (e) { ac = null; }
  }
  function cal(a, ses) {
    ses = ses == null ? 0.7 : ses;
    try {
      if (ac && tampon[a]) {
        var k = ac.createBufferSource(), g = ac.createGain(); k.buffer = tampon[a]; g.gain.value = ses; k.connect(g); g.connect(ac.destination); k.start(); return;
      }
      var s = yedek[a].cloneNode(); s.volume = Math.min(1, ses); var p = s.play(); if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }
  function muzikBasla() {
    muzikDur();
    try {
      if (ac && tampon.muzik) {
        var k = ac.createBufferSource(), g = ac.createGain(); k.buffer = tampon.muzik; k.loop = true; g.gain.value = 0.2; k.connect(g); g.connect(ac.destination); k.start(); muzikDugum = k; return;
      }
      yedek.muzik.currentTime = 0; yedek.muzik.playbackRate = 1; var p = yedek.muzik.play(); if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }
  function muzikHizi(h) { try { if (muzikDugum) muzikDugum.playbackRate.value = h; else yedek.muzik.playbackRate = h; } catch (e) {} }
  function muzikDur() { try { if (muzikDugum) { muzikDugum.stop(); muzikDugum = null; } yedek.muzik.pause(); } catch (e) {} }
  ["touchstart", "mousedown", "keydown"].forEach(function (o) { addEventListener(o, sesAc, true); });

  // ---------- ekranlar ----------
  var D = { ekran: "kapak", kahraman: "e4", oyun: null };
  function ekranAc(ad) {
    D.ekran = ad;
    ["kapak", "secim", "sonuc"].forEach(function (e) { $(e).classList.toggle("acik", e === ad); });
    film.style.display = ad === "film" ? "block" : "none";
    $("gec").style.display = ad === "film" ? "block" : "none";
    $("karistir").style.display = ad === "oyun" ? "block" : "none";
  }
  var filmBitince = null;
  function filmOynat(ad, bitince) {
    film.src = "video/" + ad + ".mp4"; filmBitince = bitince; ekranAc("film");
    var p = film.play(); if (p && p.catch) p.catch(function () {});
  }
  function filmBitti() { var f = filmBitince; filmBitince = null; film.pause(); if (f) f(); }
  film.addEventListener("ended", filmBitti);
  $("gec").addEventListener("click", filmBitti);
  function secimAc() { muzikDur(); ekranAc("secim"); cal("p_sec", 1); }
  KAHRAMANLAR.forEach(function (k) {
    var d = document.createElement("button"); d.style.backgroundImage = "url(varlik/kart_" + k + ".jpg)"; d.setAttribute("aria-label", "Kahraman " + k);
    d.addEventListener("click", function () { D.kahraman = k; oyunBaslat(); });
    $("kartlar").appendChild(d);
  });
  $("basla").addEventListener("click", function () { filmOynat("giris", secimAc); });
  $("tekrar").addEventListener("click", function () { oyunBaslat(); });
  $("degistir").addEventListener("click", secimAc);

  // ---------- bölüm ölçüleri ----------
  var H = 66, SUT = 16, SAT = 6;                        // şeker hücresi, tahta sütun/satır
  var B = 3, T = H / B;                                 // her hücre 3×3 çakıl; çakıl ızgarası adımı
  var YS0 = 10, YS1 = 13, YIGIN = 3;                    // taş kuyusunun sütunları ve yüksekliği (hücre)
  var BX = (G - SUT * H) / 2, YER = 296, BY = YER;      // tahtanın sol üst köşesi; YER: zemin çizgisi
  var TS = SUT * B, TY = YIGIN * B, TSAT = TY + SAT * B; // çakıl ızgarası: sütun, yığın satırı, toplam satır
  var KUYU0 = YS0 * B, KUYU1 = (YS1 + 1) * B;           // kuyunun çakıl sütunları [KUYU0, KUYU1)
  var YEDEK_TAS = 190;                                  // kuyunun üstünden gelmeye devam eden taş sayısı
  var KX = BX + YS0 * H - 46, KAPI_X = BX + 14 * H + 86; // kahramanın ve kapının yeri
  var SURE = 85;                                        // tırtılın kahramana varma süresi (sn)
  // Labirent: tırtıl üst koridorda sola yürür, dönüp alt koridorda kahramana gelir.
  var LY1 = 76, LY2 = 236, LX0 = 690, LXD = 150, LR = (LY2 - LY1) / 2, KOR = 120;
  var LP1 = LX0 - LXD, LP2 = LP1 + Math.PI * LR, UZ = LP2 + (KX - 78 - LXD);
  function yer(s) { // labirentte s uzaklığındaki nokta; yon: +1 sağa, -1 sola bakar
    if (s <= LP1) return { x: LX0 - s, y: LY1, yon: -1 };
    if (s <= LP2) { var a = -Math.PI / 2 - (s - LP1) / LR; return { x: LXD + LR * Math.cos(a), y: LY1 + LR + LR * Math.sin(a), yon: a > -Math.PI ? -1 : 1 }; }
    return { x: LXD + (s - LP2), y: LY2, yon: 1 };
  }
  var labirent = document.createElement("canvas"); labirent.width = G; labirent.height = YER + 8;
  (function () {
    var y = labirent.getContext("2d"), i, j;
    y.fillStyle = "#eadfc6"; y.fillRect(0, 0, G, YER + 8);          // hamur tuğla duvar
    y.strokeStyle = "rgba(150,120,80,.28)"; y.lineWidth = 2;
    for (j = 0; j < YER + 8; j += 24) { y.beginPath(); y.moveTo(0, j); y.lineTo(G, j); y.stroke(); for (i = (j / 24) % 2 ? 0 : 26; i < G; i += 52) { y.beginPath(); y.moveTo(i, j); y.lineTo(i, j + 24); y.stroke(); } }
    function koridor(kalinlik, renk) {
      y.strokeStyle = renk; y.lineWidth = kalinlik; y.lineCap = "butt"; y.lineJoin = "round"; y.beginPath();
      y.moveTo(LX0 + 60, LY1); y.lineTo(LXD, LY1); y.arc(LXD, LY1 + LR, LR, -Math.PI / 2, Math.PI / 2, true); y.lineTo(BX + YS0 * H, LY2); y.stroke();
    }
    function oda(x0, y0, x1, y1, renk, pay) { y.fillStyle = renk; y.fillRect(x0 - pay, y0 - pay, x1 - x0 + 2 * pay, y1 - y0 + pay); }
    var cerceve = "#b98a34", ic = "#27457f", ic2 = "#2e5192", kx0 = BX + YS0 * H, kx1 = BX + (YS1 + 1) * H;
    koridor(KOR + 14, cerceve); oda(kx0, 0, kx1, YER, cerceve, 7); oda(kx1, 120, 1256, YER, cerceve, 7);
    koridor(KOR, ic); oda(kx0, 0, kx1, YER + 8, ic, 0); oda(kx1, 120, 1256, YER + 8, ic, 0);
    koridor(KOR - 30, ic2);
  })();

  // ---------- oyun ----------
  // o.g[r][s]: şeker tahtası (0 boş, 1..6 şeker). o.tas[r][s]: çakıl ızgarası (0 boş, 1/2 taş).
  function tahtaKur(g) {
    for (var r = 0; r < SAT; r++) for (var s2 = 0; s2 < SUT; s2++) {
      if (g[r][s2] === 0 && g.kuruldu) continue; // karıştırırken patlamış yerler boş kalır
      var sol = s2 > 0 ? g[r][s2 - 1] : 0, ust = r > 0 ? g[r - 1][s2] : 0, t = Math.random();
      g[r][s2] = t < 0.12 && sol ? sol : t < 0.24 && ust ? ust : 1 + Math.floor(Math.random() * SEKER.length);
    }
    g.kuruldu = true;
  }
  function oyunBaslat() {
    var g = [], tas = [], r, s2;
    for (r = 0; r < SAT; r++) { g.push([]); for (s2 = 0; s2 < SUT; s2++) g[r].push(-1); }
    tahtaKur(g);
    for (r = 0; r < TSAT; r++) { tas.push([]); for (s2 = 0; s2 < TS; s2++) tas[r].push(r < TY && s2 >= KUYU0 && s2 < KUYU1 ? 1 + ((r * 7 + s2 * 3) % 2) : 0); }
    D.oyun = { t: 0, g: g, tas: tas, yedek: YEDEK_TAS, durum: "oyna", kum: 0, adim: 0, kirinti: [], yazi: [], dokulen: 0, ipucu: 7, inilti: 4,
      soz: {}, bitis: 0, kx: KX, yildiz: 0, sallan: null, karistir: 0, tasSes: 0, hamle: 0, kalan: 0 };
    ekranAc("oyun"); muzikBasla(); cal("p_nasil", 1);
  }
  function dolu(o, r, s2) { // çakıl hücresi kapalı mı (duvar, şeker ya da taş)
    if (s2 < 0 || s2 >= TS) return true;
    if (r < TY) return !(s2 >= KUYU0 && s2 < KUYU1) || o.tas[r][s2] > 0;
    return o.g[Math.floor((r - TY) / B)][Math.floor(s2 / B)] > 0 || o.tas[r][s2] > 0;
  }
  function kalanTas(o) { var n = o.yedek; for (var r = 0; r < TY; r++) for (var s2 = KUYU0; s2 < KUYU1; s2++) if (o.tas[r][s2]) n++; return n; }
  function grup(o, r, s2) { // yan yana duran aynı şekerler
    var t = o.g[r][s2], gor = {}, sira = [[r, s2]], out = [];
    if (!(t > 0)) return out;
    gor[r + "," + s2] = 1;
    while (sira.length) {
      var h = sira.pop(); out.push(h);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        var a = h[0] + d[0], b = h[1] + d[1], k = a + "," + b;
        if (a >= 0 && a < SAT && b >= 0 && b < SUT && !gor[k] && o.g[a][b] === t) { gor[k] = 1; sira.push([a, b]); }
      });
    }
    return out;
  }
  function hucreYeri(r, s2) { return { x: BX + s2 * H + H / 2, y: BY + r * H + H / 2 }; }
  function dokun(r, s2) {
    var o = D.oyun; if (!o || D.ekran !== "oyun" || o.durum !== "oyna") return 0;
    var gr = grup(o, r, s2); if (!gr.length) return 0;
    var m = hucreYeri(r, s2);
    if (gr.length < 2) { o.sallan = { r: r, s: s2, t: 0.35 }; cal("e_ah", 0.25); o.yazi.push({ x: m.x, y: m.y - 30, m: "Tek şeker patlamaz!", t: 1, renk: "#fff" }); return 0; }
    var renk = SRENK[o.g[r][s2] - 1];
    gr.forEach(function (h) {
      var p = hucreYeri(h[0], h[1]); o.g[h[0]][h[1]] = 0;
      for (var q = 0; q < 5; q++) o.kirinti.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 320, vy: -60 - Math.random() * 260, t: 0.6, renk: renk, b: 4 + Math.random() * 6 });
    });
    o.hamle++; cal("e_pop", 0.7);
    o.yazi.push({ x: m.x, y: m.y - 30, m: gr.length >= 5 ? "Süper! " + gr.length : "" + gr.length, t: 0.8, renk: "#ffd23a" });
    return gr.length;
  }
  function kumAdimi(o) { // çakıllar aşağı, olmazsa çapraza akar; tahtanın altından suya dökülür
    var r, i, s2, oynadi = 0, son = TSAT - 1, tas = o.tas;
    o.adim++;
    for (r = son; r >= 0; r--) {
      for (i = 0; i < TS; i++) {
        s2 = (r + o.adim) % 2 ? i : TS - 1 - i;
        var v = tas[r][s2]; if (!v) continue;
        if (r === son) { tas[r][s2] = 0; o.dokulen++; oynadi++; if (o.dokulen % 3 === 0) o.kirinti.push({ x: BX + s2 * T + T / 2, y: BY + SAT * H + 6, vx: (Math.random() - 0.5) * 90, vy: -90 - Math.random() * 70, t: 0.45, renk: "#bfe3ff", b: 4 }); continue; }
        if (!dolu(o, r + 1, s2)) { tas[r + 1][s2] = v; tas[r][s2] = 0; oynadi++; continue; }
        var ilk = Math.random() < 0.5 ? -1 : 1;
        for (var k = 0; k < 2; k++) {
          var b = s2 + (k ? -ilk : ilk);
          if (!dolu(o, r + 1, b) && !dolu(o, r, b)) { tas[r + 1][b] = v; tas[r][s2] = 0; oynadi++; break; }
        }
      }
    }
    for (s2 = KUYU0; s2 < KUYU1 && o.yedek > 0; s2++) if (!tas[0][s2]) { tas[0][s2] = 1 + ((o.adim + s2) % 2); o.yedek--; oynadi++; } // kuyunun üstünden yeni taşlar
    return oynadi;
  }

  function guncelle(dt) {
    var o = D.oyun;
    o.t += dt;
    if (o.ipucu > 0) o.ipucu -= dt;
    if (o.karistir > 0) o.karistir -= dt;
    if (o.sallan) { o.sallan.t -= dt; if (o.sallan.t <= 0) o.sallan = null; }
    o.kirinti = o.kirinti.filter(function (p) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; return p.t > 0; });
    o.yazi = o.yazi.filter(function (p) { p.t -= dt; p.y -= 36 * dt; return p.t > 0; });
    o.kum += dt;
    while (o.kum >= 0.045) { o.kum -= 0.045; if (kumAdimi(o) > 3 && o.t - o.tasSes > 0.9) { o.tasSes = o.t; cal("e_tas", 0.4); } }
    var oran = Math.min(1, o.t / SURE);
    if (o.durum === "oyna") {
      muzikHizi(oran > 0.7 ? 1.25 : oran > 0.45 ? 1.1 : 1);
      if (oran > 0.3 && !o.soz.a) { o.soz.a = true; cal("t_2", 0.9); }
      if (oran > 0.68 && !o.soz.b) { o.soz.b = true; cal("t_3", 0.9); cal("p_yakin", 1); }
      o.inilti -= dt;
      if (o.inilti <= 0) { o.inilti = 8 + Math.random() * 4; cal("k_it" + (1 + Math.floor(Math.random() * 3)), 0.8); }
      if (!kalanTas(o)) { o.durum = "kacti"; o.bitis = 0; o.kalan = 1 - oran; muzikHizi(1); cal("e_zafer", 0.6); }
      else if (oran >= 1) { o.durum = "yakalandi"; o.bitis = 0; muzikDur(); cal("t_4", 1); }
    } else {
      o.bitis += dt;
      if (o.durum === "kacti") {
        o.kx = Math.min(KAPI_X, KX + o.bitis * 300);
        if (o.bitis > 2.2 && !o.soz.c) { o.soz.c = true; cal("t_5", 1); cal("e_firla", 0.5); }
        if (o.bitis > 4.4) sonucGoster(true);
      }
      if (o.durum === "yakalandi" && o.bitis > 3) sonucGoster(false);
    }
  }
  function sonucGoster(kazandi) {
    var o = D.oyun; if (o.durum === "bitti") return;
    o.yildiz = kazandi ? (o.kalan > 0.4 ? 3 : o.kalan > 0.15 ? 2 : 1) : 0; o.durum = "bitti"; muzikDur();
    $("sonucBaslik").textContent = kazandi ? "Kurtuldun!" : "Vıcık seni yakaladı!";
    $("sonucYazi").textContent = kazandi ? "Önce kendini kurtardın. Şimdi sıra dünyayı kurtarmakta! (Devamı yakında)" : "Gıdıklanmaktan kurtulmak için bir daha dene. Taşlara suya kadar yol aç!";
    $("yildizlar").textContent = kazandi ? "★★★".slice(0, o.yildiz) + "☆☆☆".slice(0, 3 - o.yildiz) : "";
    ekranAc("sonuc"); cal(kazandi ? "p_kazandin" : "p_kaybettin", 1);
  }
  function karistir() { // dokunulacak grup kalmadıysa kalan şekerleri yeniden dizer
    var o = D.oyun; if (!o || o.durum !== "oyna" || o.karistir > 0) return;
    o.karistir = 3; tahtaKur(o.g); cal("e_pop", 0.5);
    o.yazi.push({ x: 640, y: 480, m: "Şekerler karıştı!", t: 1.2, renk: "#fff" });
  }
  $("karistir").addEventListener("click", karistir);

  // ---------- çizim (saniyede 12 poz) ----------
  function resim(im, x, y, yuk, cevir, aci) { // (x,y) alt orta
    if (!im || !im.complete || !im.naturalWidth) return;
    var w = im.naturalWidth * yuk / im.naturalHeight;
    c.save(); c.translate(x, y); if (aci) c.rotate(aci); if (cevir) c.scale(-1, 1);
    c.drawImage(im, -w / 2, -yuk, w, yuk); c.restore();
  }
  function kutuResim(im, x, y, boy) { // (x,y) orta; kareye sığdır
    if (!im || !im.complete || !im.naturalWidth) return;
    var k = boy / Math.max(im.naturalWidth, im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k;
    c.drawImage(im, x - w / 2, y - h / 2, w, h);
  }
  function titre(tohum, poz) { var v = Math.sin(tohum * 91.7 + poz * 13.3) * 43758.5; return (v - Math.floor(v) - 0.5) * 2; }
  function yuvarlak(x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function yazi(m, x, y, boy, renk) {
    c.font = "bold " + boy + "px 'Arial Rounded MT Bold','Trebuchet MS',sans-serif"; c.lineWidth = Math.max(5, boy / 5); c.strokeStyle = "rgba(20,25,60,.85)"; c.lineJoin = "round";
    c.strokeText(m, x, y); c.fillStyle = renk || "#fff"; c.fillText(m, x, y);
  }

  function ciz() {
    var o = D.oyun, poz = Math.floor(o.t * POZ), r, s2, p, i;
    var oran = Math.min(1, o.t / SURE), panik = o.durum === "oyna" && oran > 0.68, kd = D.kahraman;
    c.clearRect(0, 0, G, Y);
    // labirent ve yer altı
    c.drawImage(labirent, 0, 0);
    c.fillStyle = "#6b4528"; c.fillRect(0, YER, G, Y - YER);
    c.fillStyle = "#4f3219"; yuvarlak(BX - 14, BY - 4, SUT * H + 28, SAT * H + 12, 18); c.fill();
    c.fillStyle = "#2d6fb8"; c.fillRect(0, BY + SAT * H + 8, G, Y); // alttaki su
    c.fillStyle = "rgba(255,255,255,.25)"; for (i = 0; i < 14; i++) c.fillRect(((i * 97 + poz * 6) % G), BY + SAT * H + 14 + (i % 2) * 6, 40, 3);
    c.fillStyle = "#b98a34"; c.fillRect(0, YER - 4, BX + YS0 * H, 9); c.fillRect(BX + (YS1 + 1) * H, YER - 4, G, 9); // zemin: kuyunun altı açık
    resim(R.ufo, LX0 + 14 + titre(1, poz), LY1 + 56 + (poz % 4 < 2 ? 0 : 3), 96);
    resim(R.kapi, KAPI_X + 30, YER, 168);

    // şekerler
    for (r = 0; r < SAT; r++) for (s2 = 0; s2 < SUT; s2++) {
      var t = o.g[r][s2]; p = hucreYeri(r, s2);
      if (!t) { c.fillStyle = "rgba(0,0,0,.24)"; yuvarlak(p.x - 31, p.y - 31, 62, 62, 10); c.fill(); continue; }
      c.fillStyle = "rgba(255,240,215,.16)"; yuvarlak(p.x - 30, p.y - 30, 60, 60, 12); c.fill();
      var sal = o.sallan && o.sallan.r === r && o.sallan.s === s2 ? (poz % 2 ? 5 : -5) : 0;
      kutuResim(R[SEKER[t - 1]], p.x + sal, p.y, 54);
    }
    // çakıllar: küçük, sık, üst üste binen hamur taşlar
    for (r = 0; r < TSAT; r++) for (s2 = 0; s2 < TS; s2++) {
      var v = o.tas[r][s2]; if (!v) continue;
      var h = (r * 37 + s2 * 91) % 7;
      kutuResim(v === 1 ? R.tas1 : R.tas2, BX + s2 * T + T / 2 + (h - 3) * 0.9, YER + (r - TY) * T + T / 2 + ((h * 3) % 5 - 2) * 0.9, 27 + (h % 3) * 2);
    }

    // tırtıl Vıcık: labirentte kuyruktan başa
    var ts = 70 + (UZ - 70) * oran, basR = R.bas, baci = 0;
    if (o.durum === "kacti") { ts = Math.min(UZ + (KAPI_X - 130 - (KX - 78)), ts + o.bitis * 260); if (o.bitis > 2.2) { basR = R.bas_sersem; baci = Math.sin(poz) * 0.2; } }
    if (o.durum === "yakalandi") ts = UZ + 34;
    var topR = [R.top_mor, R.top_turuncu, R.top_mavi, R.top_sari], tp;
    for (i = 13; i >= 0; i--) {
      if (ts - 54 - i * 42 < 0) continue;
      tp = yer(ts - 54 - i * 42);
      resim(topR[i % 4], tp.x + titre(i, poz) * 1.5, tp.y + 54 - ((poz + i) % 2 ? 5 : 0), 54, tp.yon < 0);
    }
    tp = yer(ts);
    resim(basR, tp.x + titre(7, poz) * (panik ? 3 : 1), tp.y + 58 - (poz % 2 ? 4 : 0), 92, tp.yon < 0, baci);

    // kahraman ve papağan
    var hx = o.kx, hr = R[kd + "_at"], hoyna = 0;
    if (o.durum === "oyna") hx += (poz % 3 === 0 ? 3 : 0);
    if (o.durum === "kacti") hr = o.kx >= KAPI_X ? null : R[kd + (poz % 2 ? "_kos1" : "_kos2")];
    if (o.durum === "yakalandi") { hr = R[kd + "_dur"]; hoyna = titre(5, poz) * 6; }
    if (hr) resim(hr, hx + hoyna, YER + 2, 112);
    resim(poz % 2 ? R.pb1 : R.pb2, KAPI_X + 30, 122 + (poz % 4 < 2 ? 0 : -8), 60, true);

    // kırıntılar, yazılar
    o.kirinti.forEach(function (q) { c.fillStyle = q.renk; c.beginPath(); c.arc(q.x, q.y, q.b * Math.min(1, q.t * 2), 0, 7); c.fill(); });
    c.textAlign = "center";
    o.yazi.forEach(function (q) { c.globalAlpha = Math.min(1, q.t * 2.5); yazi(q.m, q.x, q.y, 30, q.renk); });
    c.globalAlpha = 1;

    // gösterge
    c.textAlign = "left"; yazi("Kalan taş: " + kalanTas(o), 24, 44, 28);
    c.textAlign = "center";
    if (o.durum === "oyna" && o.ipucu > 0) yazi("Aynı şekerlere dokun, taşlara suya kadar yol aç!", 600, 48, 28);
    else if (panik && poz % 2) yazi("Vıcık çok yaklaştı!", 600, 52, 40, "#ffd23a");
    if (o.durum === "kacti") yazi("Yol açıldı! Koş!", 600, 52, 40, "#ffd23a");
    if (o.durum === "yakalandi") yazi("Gıdı gıdı gıdı!", 600, 52, 44, "#ffd23a");
    if (panik && poz % 4 < 2) { // gerilim: kenarlar kızarır
      var kz = c.createRadialGradient(640, 360, 300, 640, 360, 760); kz.addColorStop(0, "rgba(255,40,30,0)"); kz.addColorStop(1, "rgba(255,40,30,.3)");
      c.fillStyle = kz; c.fillRect(0, 0, G, Y);
    }
  }

  // ---------- girdiler ----------
  function tuvalBas(e) {
    var k = tuval.getBoundingClientRect(), n = e.touches ? e.touches[0] : e, x = (n.clientX - k.left) * G / k.width, y = (n.clientY - k.top) * Y / k.height;
    var s2 = Math.floor((x - BX) / H), r = Math.floor((y - BY) / H);
    if (s2 >= 0 && s2 < SUT && r >= 0 && r < SAT) dokun(r, s2);
  }
  tuval.addEventListener("mousedown", tuvalBas);
  tuval.addEventListener("touchstart", function (e) { e.preventDefault(); tuvalBas(e); }, { passive: false });

  // ---------- döngü ----------
  var once = 0, sonPoz = -1;
  function dongu(z) {
    var dt = Math.min(0.05, (z - once) / 1000 || 0); once = z;
    if (D.oyun && D.ekran === "oyun" && D.oyun.durum !== "bitti") {
      guncelle(dt);
      var poz = Math.floor(D.oyun.t * POZ); if (poz !== sonPoz && D.oyun.durum !== "bitti") { sonPoz = poz; ciz(); }
    }
    requestAnimationFrame(dongu);
  }
  requestAnimationFrame(dongu);

  // deneme kancası
  function durum() { var o = D.oyun; return { t: Math.round(o.t * 10) / 10, kalan: kalanTas(o), dokulen: o.dokulen, durum: o.durum, yildiz: o.yildiz, hamle: o.hamle }; }
  window.__oyun = { D: D, baslat: function (k) { if (k) D.kahraman = k; oyunBaslat(); }, dokun: dokun, karistir: karistir, durum: durum,
    ilerlet: function (sn) { for (var t = 0; t < sn && D.oyun.durum !== "bitti"; t += 1 / 60) guncelle(1 / 60); if (D.oyun.durum !== "bitti") ciz(); return durum(); },
    // deneme oyuncusu: taşların ulaşabildiği boşluğa komşu, en aşağıdaki gruba dokunur; yoksa karıştırır
    otomatik: function () {
      var o = D.oyun, acik = {}, sira = [], r, s2, en = null;
      for (s2 = YS0; s2 <= YS1; s2++) { if (o.g[0][s2] === 0) { acik["0," + s2] = 1; sira.push([0, s2]); } }
      while (sira.length) { var h = sira.pop(); [[1, 0], [0, 1], [0, -1]].forEach(function (d) { var a = h[0] + d[0], b = h[1] + d[1], k = a + "," + b; if (a < SAT && b >= 0 && b < SUT && !acik[k] && o.g[a][b] === 0) { acik[k] = 1; sira.push([a, b]); } }); }
      for (r = 0; r < SAT; r++) for (s2 = 0; s2 < SUT; s2++) {
        var gr = grup(o, r, s2); if (gr.length < 2) continue;
        var komsu = false, derin = 0;
        gr.forEach(function (q) { derin = Math.max(derin, q[0]); if (q[0] === 0 && q[1] >= YS0 && q[1] <= YS1) komsu = true; if (acik[(q[0] - 1) + "," + q[1]] || acik[q[0] + "," + (q[1] - 1)] || acik[q[0] + "," + (q[1] + 1)]) komsu = true; });
        if (komsu && (!en || derin > en.d || (derin === en.d && gr.length > en.n))) en = { r: r, s: s2, n: gr.length, d: derin };
      }
      if (!en) { o.karistir = 0; karistir(); return 0; }
      return dokun(en.r, en.s);
    } };
})();
