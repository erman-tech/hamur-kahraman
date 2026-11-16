/* Hamur Kahraman 2: Uzaylı Tırtıl — tek bölüm. Tek dosya, kütüphane yok.
   Akış: kapak → açılış filmi → kahraman seçimi → oyun → sonuç.
   Oyun: uzaylı tırtıl Vıcık labirentten gelip çakıl taşı yığınını iter; taşlar da kahramanı sağdaki tuzağa
   (uzay gemisinin ışığına) doğru sürükler. Yerin altındaki şeker tahtasında bir şeker komşusuyla yer değiştirir (kaydırarak); en az üç aynı şeker
   yan yana ya da alt alta gelince patlarlar; açılan boşluğa taşlar akar, tahtanın altına kadar yol açılırsa suya dökülür. Taş azaldıkça itme
   zayıflar; taş kalmayınca kahraman kurtulur. Kahraman tuzağa varırsa oyun kaybedilir. */
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
  ["bas", "bas_sersem", "top_mor", "top_turuncu", "top_mavi", "top_sari", "ufo", "tas1", "tas2", "pb1", "pb2"].concat(SEKER).forEach(resimYukle);
  KAHRAMANLAR.forEach(function (k) { ["dur", "kos1", "kos2", "at"].forEach(function (p) { resimYukle(k + "_" + p); }); });

  var sesAdlari = ["e_pop", "e_ah", "e_zafer", "e_firla", "e_tas", "e_tik", "e_surt", "e_kalp", "k_it1", "k_it2", "k_it3", "p_nasil", "p_yakin", "p_sec", "p_kazandin", "p_kaybettin", "t_2", "t_3", "t_4", "t_5", "muzik"];
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
  var H = 66, SUT = 16, SAT = 7;                        // şeker hücresi, tahta sütun/satır
  var B = 3, T = H / B;                                 // her hücre 3×3 çakıl; çakıl ızgarası adımı
  var YS0 = 7, YS1 = 10, YIGIN = 3;                     // taş kuyusunun sütunları ve yüksekliği (hücre)
  var BX = (G - SUT * H) / 2, YER = 216, BY = YER;      // tahtanın sol üst köşesi; YER: zemin çizgisi
  var TS = SUT * B, TY = YIGIN * B, TSAT = TY + SAT * B; // çakıl ızgarası: sütun, yığın satırı, toplam satır
  var KUYU0 = YS0 * B, KUYU1 = (YS1 + 1) * B;           // kuyunun çakıl sütunları [KUYU0, KUYU1)
  var YEDEK_TAS = 190;                                  // kuyunun üstünden gelmeye devam eden taş sayısı
  var HX0 = BX + (YS1 + 1) * H + 40, HX1 = 1168;       // kahramanın başladığı yer ve tuzak (uzay gemisinin ışığı)
  var YURU = 12, ITME = 80;                             // tırtılın yığına varma süresi; dolu yığınla tuzağa itme süresi (sn)
  var TOPLAM = (YS1 - YS0 + 1) * B * YIGIN * B + YEDEK_TAS;
  // Labirent: tırtıl üst koridorda sola yürür, dönüp alt koridorda kahramana gelir.
  var LY1 = 56, LY2 = 172, LX0 = 470, LXD = 110, LR = (LY2 - LY1) / 2, KOR = 62, TUNEL = 230; // TUNEL: tünelde kuyudan önce yığılı taşların boyu
  var LP1 = LX0 - LXD, LP2 = LP1 + Math.PI * LR, UZ = LP2 + (BX + YS0 * H - 40 - LXD);
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
    koridor(KOR + 14, cerceve); oda(kx0, 0, kx1, YER, cerceve, 7); oda(kx1, 44, 1256, YER, cerceve, 7);
    koridor(KOR, ic); oda(kx0, 0, kx1, YER + 8, ic, 0); oda(kx1, 44, 1256, YER + 8, ic, 0);
    koridor(KOR - 18, ic2);
    y.fillStyle = "#0d1730"; y.beginPath(); y.ellipse(LX0 + 40, LY1, 16, 27, 0, 0, 7); y.fill(); // tırtılın çıktığı tünel
  })();

  // ---------- oyun ----------
  // o.g[r][s]: şeker tahtası (0 boş, 1..6 şeker). o.tas[r][s]: çakıl ızgarası (0 boş, 1/2 taş).
  function eslesmeler(g) { // yan yana ya da alt alta en az üç aynı şeker: patlayacak hücreler
    var bul = {}, r, s2, n;
    for (r = 0; r < SAT; r++) for (s2 = 0; s2 < SUT; s2 += n) {
      n = 1; if (!(g[r][s2] > 0)) continue;
      while (s2 + n < SUT && g[r][s2 + n] === g[r][s2]) n++;
      if (n >= 3) for (var i = 0; i < n; i++) bul[r + "," + (s2 + i)] = [r, s2 + i];
    }
    for (s2 = 0; s2 < SUT; s2++) for (r = 0; r < SAT; r += n) {
      n = 1; if (!(g[r][s2] > 0)) continue;
      while (r + n < SAT && g[r + n][s2] === g[r][s2]) n++;
      if (n >= 3) for (var j = 0; j < n; j++) bul[(r + j) + "," + s2] = [r + j, s2];
    }
    return Object.keys(bul).map(function (k) { return bul[k]; });
  }
  function tahtaKur(g) { // hazır üçlü olmayan rastgele tahta; patlamış (0) hücreler boş kalır
    for (var r = 0; r < SAT; r++) for (var s2 = 0; s2 < SUT; s2++) {
      if (g[r][s2] === 0) continue;
      var t;
      do { t = 1 + Math.floor(Math.random() * SEKER.length); }
      while ((s2 > 1 && g[r][s2 - 1] === t && g[r][s2 - 2] === t) || (r > 1 && g[r - 1][s2] === t && g[r - 2][s2] === t));
      g[r][s2] = t;
    }
  }
  function oyunBaslat() {
    var g = [], tas = [], r, s2;
    for (r = 0; r < SAT; r++) { g.push([]); for (s2 = 0; s2 < SUT; s2++) g[r].push(-1); }
    tahtaKur(g);
    for (r = 0; r < TSAT; r++) { tas.push([]); for (s2 = 0; s2 < TS; s2++) tas[r].push(r < TY && s2 >= KUYU0 && s2 < KUYU1 ? 1 + ((r * 7 + s2 * 3) % 2) : 0); }
    D.oyun = { t: 0, g: g, tas: tas, yedek: YEDEK_TAS, durum: "oyna", kum: 0, adim: 0, kirinti: [], yazi: [], dokulen: 0, ipucu: 7, inilti: 4,
      secili: null, soz: {}, bitis: 0, itme: 0, tik: 1, surt: 0, yildiz: 0, sallan: null, karistir: 0, tasSes: 0, hamle: 0, kalan: 0 };
    ekranAc("oyun"); muzikBasla(); cal("p_nasil", 1);
  }
  function dolu(o, r, s2) { // çakıl hücresi kapalı mı (duvar, şeker ya da taş)
    if (s2 < 0 || s2 >= TS) return true;
    if (r < TY) return !(s2 >= KUYU0 && s2 < KUYU1) || o.tas[r][s2] > 0;
    return o.g[Math.floor((r - TY) / B)][Math.floor(s2 / B)] > 0 || o.tas[r][s2] > 0;
  }
  function kalanTas(o) { var n = o.yedek; for (var r = 0; r < TY; r++) for (var s2 = KUYU0; s2 < KUYU1; s2++) if (o.tas[r][s2]) n++; return n; }
  function hucreYeri(r, s2) { return { x: BX + s2 * H + H / 2, y: BY + r * H + H / 2 }; }
  function tasVar(o, r, s2) { for (var a = 0; a < B; a++) for (var b = 0; b < B; b++) if (o.tas[TY + r * B + a][s2 * B + b]) return true; return false; }
  function takasOlur(o, r1, s1, r2, s2) { // iki komşu hücre yer değiştirirse patlayacak hücreler (olmazsa boş liste)
    var g = o.g;
    if (r2 < 0 || r2 >= SAT || s2 < 0 || s2 >= SUT || Math.abs(r1 - r2) + Math.abs(s1 - s2) !== 1) return [];
    var a = g[r1][s1], b = g[r2][s2];
    if (!(a > 0) && !(b > 0)) return [];
    if ((a === 0 && tasVar(o, r1, s1)) || (b === 0 && tasVar(o, r2, s2))) return []; // taş dolu boşluğa şeker girmez
    g[r1][s1] = b; g[r2][s2] = a;
    var m = eslesmeler(g);
    g[r1][s1] = a; g[r2][s2] = b;
    return m;
  }
  function hamleler(o) { // tahtadaki bütün geçerli hamleler
    var out = [], r, s2, m;
    for (r = 0; r < SAT; r++) for (s2 = 0; s2 < SUT; s2++) {
      m = takasOlur(o, r, s2, r, s2 + 1); if (m.length) out.push({ r1: r, s1: s2, r2: r, s2: s2 + 1, m: m });
      m = takasOlur(o, r, s2, r + 1, s2); if (m.length) out.push({ r1: r, s1: s2, r2: r + 1, s2: s2, m: m });
    }
    return out;
  }
  function takas(r1, s1, r2, s2) { // oyuncunun hamlesi: yer değiştir, üçlü olduysa patlat
    var o = D.oyun; if (!o || D.ekran !== "oyun" || o.durum !== "oyna") return 0;
    if (r2 < 0 || r2 >= SAT || s2 < 0 || s2 >= SUT) return 0;
    var m = takasOlur(o, r1, s1, r2, s2), g = o.g;
    if (!m.length) { o.sallan = { h: [[r1, s1], [r2, s2]], t: 0.35 }; cal("e_ah", 0.25); return 0; }
    var a = g[r1][s1]; g[r1][s1] = g[r2][s2]; g[r2][s2] = a;
    m.forEach(function (h) {
      var p = hucreYeri(h[0], h[1]), renk = SRENK[g[h[0]][h[1]] - 1]; g[h[0]][h[1]] = 0;
      for (var q = 0; q < 5; q++) o.kirinti.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 320, vy: -60 - Math.random() * 260, t: 0.6, renk: renk, b: 4 + Math.random() * 6 });
    });
    o.hamle++; cal("e_pop", 0.7);
    var y = hucreYeri(r2, s2); o.yazi.push({ x: y.x, y: y.y - 30, m: m.length >= 5 ? "Süper! " + m.length : m.length >= 4 ? "Harika! 4" : "3", t: 0.8, renk: "#ffd23a" });
    if (!hamleler(o).length) { o.karistir = 0; karistir(true); }
    return m.length;
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
        if (tas[r][s2] && (r < TY ? Math.random() < 0.5 : (tas[r - 1][s2] && Math.random() < 0.35))) { // kuyuda son taşlar da deliği bulsun // üstünde yük varsa yana da yayılır (akışkan)
          var yan = s2 + ilk; if (!dolu(o, r, yan)) { tas[r][yan] = v; tas[r][s2] = 0; oynadi++; }
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
    while (o.kum >= 0.075) { o.kum -= 0.075; if (kumAdimi(o) > 3 && o.t - o.tasSes > 0.9) { o.tasSes = o.t; cal("e_tas", 0.4); } }
    if (o.durum === "oyna") {
      var kalan = kalanTas(o);
      if (o.t >= YURU) o.itme = Math.min(1, o.itme + dt / ITME * (0.3 + 0.7 * kalan / TOPLAM)); // taş azaldıkça itme zayıflar
      muzikHizi(o.itme > 0.65 ? 1.25 : o.itme > 0.35 ? 1.1 : 1);
      // gerilim sesleri: tırtıl iterken taşlar sürtünür; tuzağa yaklaştıkça tik taklar sıklaşır, sonunda kalp atışı
      if (o.t >= YURU) {
        o.surt -= dt; if (o.surt <= 0) { o.surt = 2.6; cal("e_surt", 0.28 + 0.3 * o.itme); }
        o.tik -= dt; if (o.tik <= 0) { o.tik = 1.1 - 0.85 * o.itme; cal(o.itme > 0.62 ? "e_kalp" : "e_tik", o.itme > 0.62 ? 0.8 : 0.35 + 0.3 * o.itme); }
      }
      if (o.t > YURU - 2.5 && !o.soz.a) { o.soz.a = true; cal("t_2", 0.9); }
      if (o.itme > 0.62 && !o.soz.b) { o.soz.b = true; cal("t_3", 0.9); cal("p_yakin", 1); }
      o.inilti -= dt;
      if (o.inilti <= 0 && o.t > YURU) { o.inilti = 8 + Math.random() * 4; cal("k_it" + (1 + Math.floor(Math.random() * 3)), 0.8); }
      if (!kalan) { o.durum = "kacti"; o.bitis = 0; o.kalan = 1 - o.itme; muzikHizi(1); cal("e_zafer", 0.6); cal("t_5", 1); cal("e_firla", 0.5); }
      else if (o.itme >= 1) { o.durum = "yakalandi"; o.bitis = 0; muzikDur(); cal("t_4", 1); cal("e_firla", 0.4); }
    } else {
      o.bitis += dt;
      if (o.durum === "kacti" && o.bitis > 3.2) sonucGoster(true);
      if (o.durum === "yakalandi" && o.bitis > 3) sonucGoster(false);
    }
  }
  function sonucGoster(kazandi) {
    var o = D.oyun; if (o.durum === "bitti") return;
    o.yildiz = kazandi ? (o.kalan > 0.4 ? 3 : o.kalan > 0.15 ? 2 : 1) : 0; o.durum = "bitti"; muzikDur();
    $("sonucBaslik").textContent = kazandi ? "Kurtuldun!" : "Vıcık seni tuzağa itti!";
    $("sonucYazi").textContent = kazandi ? "Önce kendini kurtardın. Şimdi sıra dünyayı kurtarmakta! (Devamı yakında)" : "Üzülme, bir daha dene. Şekerleri kaydır, üçlü yap, taşlara suya kadar yol aç!";
    $("yildizlar").textContent = kazandi ? "★★★".slice(0, o.yildiz) + "☆☆☆".slice(0, 3 - o.yildiz) : "";
    ekranAc("sonuc"); cal(kazandi ? "p_kazandin" : "p_kaybettin", 1);
  }
  function karistir(kendiliginden) { // kalan şekerleri yeniden dizer: hazır üçlü olmasın, en az bir hamle kalsın
    var o = D.oyun; if (!o || o.durum !== "oyna" || o.karistir > 0) return;
    o.karistir = 3; o.secili = null;
    for (var d = 0; d < 40; d++) { tahtaKur(o.g); if (hamleler(o).length) break; }
    cal("e_pop", 0.5);
    o.yazi.push({ x: 640, y: YER + 150, m: kendiliginden === true ? "Hamle kalmadı, şekerler karıştı!" : "Şekerler karıştı!", t: 1.4, renk: "#fff" });
  }
  $("karistir").addEventListener("click", function () { karistir(false); });

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
    var yuru = Math.min(1, o.t / YURU), itiyor = o.durum === "oyna" && yuru >= 1, panik = o.durum === "oyna" && o.itme > 0.62, kd = D.kahraman;
    c.clearRect(0, 0, G, Y);
    // labirent ve yer altı
    c.drawImage(labirent, 0, 0);
    c.fillStyle = "#6b4528"; c.fillRect(0, YER, G, Y - YER);
    c.fillStyle = "#4f3219"; yuvarlak(BX - 14, BY - 4, SUT * H + 28, SAT * H + 12, 18); c.fill();
    c.fillStyle = "#2d6fb8"; c.fillRect(0, BY + SAT * H + 8, G, Y); // alttaki su
    c.fillStyle = "rgba(255,255,255,.25)"; for (i = 0; i < 14; i++) c.fillRect(((i * 97 + poz * 6) % G), BY + SAT * H + 14 + (i % 2) * 6, 40, 3);
    c.fillStyle = "#b98a34"; c.fillRect(0, YER - 4, BX + YS0 * H, 9); c.fillRect(BX + (YS1 + 1) * H, YER - 4, G, 9); // zemin: kuyunun altı açık
    // tuzak: uzay gemisi ve ışığı
    var ux = HX1 + 26, uy = 112 + (poz % 4 < 2 ? 0 : 4);
    c.fillStyle = poz % 2 ? "rgba(190,255,170,.34)" : "rgba(190,255,170,.26)"; c.beginPath(); c.moveTo(ux - 26, uy - 10); c.lineTo(ux + 26, uy - 10); c.lineTo(ux + 62, YER); c.lineTo(ux - 62, YER); c.closePath(); c.fill();
    resim(R.ufo, ux + titre(1, poz), uy, 72);

    // şekerler
    for (r = 0; r < SAT; r++) for (s2 = 0; s2 < SUT; s2++) {
      var t = o.g[r][s2]; p = hucreYeri(r, s2);
      if (!t) { c.fillStyle = "rgba(0,0,0,.24)"; yuvarlak(p.x - 31, p.y - 31, 62, 62, 10); c.fill(); continue; }
      c.fillStyle = "rgba(255,240,215,.16)"; yuvarlak(p.x - 30, p.y - 30, 60, 60, 12); c.fill();
      var sal = o.sallan && o.sallan.h.some(function (q) { return q[0] === r && q[1] === s2; }) ? (poz % 2 ? 5 : -5) : 0;
      if (o.secili && o.secili.r === r && o.secili.s === s2) { c.strokeStyle = "#fff"; c.lineWidth = 5; yuvarlak(p.x - 30, p.y - 30, 60, 60, 12); c.stroke(); }
      kutuResim(R[SEKER[t - 1]], p.x + sal, p.y, 54);
    }
    // çakıllar: küçük, sık, üst üste binen hamur taşlar
    for (r = 0; r < TSAT; r++) for (s2 = 0; s2 < TS; s2++) {
      var v = o.tas[r][s2]; if (!v) continue;
      var h = (r * 37 + s2 * 91) % 7;
      kutuResim(v === 1 ? R.tas1 : R.tas2, BX + s2 * T + T / 2 + (h - 3) * 0.9 + (itiyor && r < TY && poz % 2 ? 3 : 0), YER + (r - TY) * T + T / 2 + ((h * 3) % 5 - 2) * 0.9, 33 + (h % 3) * 2);
    }

    // itilen taş cephesi: kuyudan kahramana kadar taşar, kahramanın önündeki boş alan daralır
    if (o.durum === "oyna" && o.itme > 0.01) {
      var cx0 = BX + (YS1 + 1) * H, cx1 = HX0 + (HX1 - HX0) * o.itme - 24, n = 0;
      for (var cx = cx0; cx < cx1; cx += 17, n++) for (var kat = 0; kat < 3 + (n % 2); kat++)
        kutuResim((n + kat) % 2 ? R.tas1 : R.tas2, cx + ((n * 7 + kat * 3) % 5) + (poz % 2 ? 3 : 0), YER - 14 - kat * 19 + ((n * 3 + kat) % 4), 33 + ((n + kat) % 3) * 2);
    }
    // tünelde yığılı taşlar: tırtıl bunlara dayanır, ittikçe sıkışıp kuyuya dolar
    if (o.durum === "oyna") {
      var tx0 = yer(Math.max(0, (UZ - TUNEL) * yuru + TUNEL * 0.8 * o.itme)).x + 30, tx1 = BX + YS0 * H, tn = 0;
      if (yuru < 1) tx0 = Math.max(tx0, tx1 - TUNEL + 30);
      for (var tx = tx1 - 10; tx > tx0; tx -= 16, tn++) for (var tk = 0; tk < 3; tk++)
        kutuResim((tn + tk) % 2 ? R.tas1 : R.tas2, tx + ((tn * 5 + tk * 3) % 5) + (itiyor && poz % 2 ? 3 : 0), LY2 + 22 - tk * 17 + ((tn * 3 + tk) % 4), 31 + ((tn + tk) % 3) * 2);
    }
    // tırtıl Vıcık: labirentte kuyruktan başa; taşlara varınca iter
    var ts = (UZ - TUNEL) * yuru + TUNEL * 0.8 * (o.durum === "oyna" ? o.itme : 0) + (itiyor && poz % 2 ? 7 : 0), basR = R.bas, baci = 0, bdy = 0, topR = [R.top_mor, R.top_turuncu, R.top_mavi, R.top_sari], tp;
    if (o.durum === "kacti") { basR = R.bas_sersem; var uq = Math.floor(Math.min(1, o.bitis / 2) * 14) / 14; baci = uq * 9; bdy = -uq * uq * 420; ts = UZ - uq * 160; }
    for (i = 13; i >= 0; i--) {
      if (ts - 40 - i * 29 < 0) continue;
      tp = yer(ts - 40 - i * 29);
      resim(topR[i % 4], tp.x + titre(i, poz) * 1.5, tp.y + 30 - ((poz + i) % 2 ? 3 : 0), 36, tp.yon < 0);
    }
    tp = yer(Math.max(0, ts));
    resim(basR, tp.x + titre(7, poz) * (panik ? 3 : 1), tp.y + 31 - (poz % 2 ? 3 : 0) + bdy, 58, tp.yon < 0 && o.durum !== "kacti", baci);

    // kahraman (taşlara karşı iter, sağa sürüklenir) ve papağan
    var hx = HX0 + (HX1 - HX0) * o.itme, hy = YER + 2, hboy = 104, hr = R[kd + "_at"], hcevir = true;
    if (itiyor) hx += (poz % 3 === 0 ? -3 : 0);
    if (o.durum === "kacti") { hr = R[kd + "_dur"]; hcevir = false; hy -= (poz % 4 < 2 ? 14 : 0); }
    if (o.durum === "yakalandi") { hr = R[kd + "_dur"]; hx = HX1 + 26; var yq = Math.floor(Math.min(1, o.bitis / 2.2) * 12) / 12; hy -= yq * 80; hboy = 104 - yq * 56; }
    resim(hr, hx, hy, hboy, hcevir);
    resim(poz % 2 ? R.pb1 : R.pb2, Math.min(hx + 20, HX1 - 70), 98 + (poz % 4 < 2 ? 0 : -6), 46, true);

    // kırıntılar, yazılar
    o.kirinti.forEach(function (q) { c.fillStyle = q.renk; c.beginPath(); c.arc(q.x, q.y, q.b * Math.min(1, q.t * 2), 0, 7); c.fill(); });
    c.textAlign = "center";
    o.yazi.forEach(function (q) { c.globalAlpha = Math.min(1, q.t * 2.5); yazi(q.m, q.x, q.y, 30, q.renk); });
    c.globalAlpha = 1;

    // gösterge: kahraman tuzağa ne kadar yakın
    c.textAlign = "left"; yazi("Tuzağa uzaklık", 24, 30, 20);
    c.fillStyle = "rgba(20,25,60,.75)"; yuvarlak(24, 38, 220, 18, 9); c.fill();
    c.fillStyle = o.itme > 0.62 ? "#ff5a4a" : o.itme > 0.35 ? "#f7b21e" : "#5fd16a"; yuvarlak(24, 38, Math.max(18, 220 * (1 - o.itme)), 18, 9); c.fill();
    yazi("Kalan taş: " + kalanTas(o), 24, 80, 18);
    c.textAlign = "center";
    if (o.durum === "oyna" && o.ipucu > 0) { yazi("Vıcık taşları itiyor, taşlar da seni tuzağa!", 640, YER + 34, 32, "#ffd23a"); yazi("Şekeri komşusuna kaydır: üç aynı şeker yan yana gelince patlar!", 640, YER + 68, 24); }
    else if (panik && poz % 2) yazi("Tuzağa çok yaklaştın!", 640, YER + 36, 38, "#ffd23a");
    if (o.durum === "kacti") yazi("Taşlar bitti! Kurtuldun!", 640, YER + 36, 38, "#ffd23a");
    if (o.durum === "yakalandi") yazi("Eyvah! Uzay gemisinin ışığı!", 640, YER + 36, 38, "#ffd23a");
    if (panik && poz % 4 < 2) { // gerilim: kenarlar kızarır
      var kz = c.createRadialGradient(640, 360, 300, 640, 360, 760); kz.addColorStop(0, "rgba(255,40,30,0)"); kz.addColorStop(1, "rgba(255,40,30,.3)");
      c.fillStyle = kz; c.fillRect(0, 0, G, Y);
    }
  }

  // ---------- girdiler: kaydır ya da iki şekere sırayla dokun ----------
  var basili = null;
  function nokta(e) {
    var k = tuval.getBoundingClientRect(), n = e.touches && e.touches.length ? e.touches[0] : e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e;
    var x = (n.clientX - k.left) * G / k.width, y = (n.clientY - k.top) * Y / k.height;
    return { x: x, y: y, s: Math.floor((x - BX) / H), r: Math.floor((y - BY) / H) };
  }
  function basBasla(e) {
    var o = D.oyun, n = nokta(e); basili = null;
    if (!o || D.ekran !== "oyun" || o.durum !== "oyna" || n.s < 0 || n.s >= SUT || n.r < 0 || n.r >= SAT) return;
    basili = { r: n.r, s: n.s, x: n.x, y: n.y };
  }
  function basOynat(e) {
    if (!basili) return;
    var n = nokta(e), dx = n.x - basili.x, dy = n.y - basili.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 26) return;
    var yatay = Math.abs(dx) > Math.abs(dy), b = basili; basili = null; D.oyun.secili = null;
    takas(b.r, b.s, b.r + (yatay ? 0 : dy > 0 ? 1 : -1), b.s + (yatay ? (dx > 0 ? 1 : -1) : 0));
  }
  function basBitir() {
    var o = D.oyun, b = basili; basili = null;
    if (!b || !o) return;
    if (o.secili && Math.abs(o.secili.r - b.r) + Math.abs(o.secili.s - b.s) === 1) { var a = o.secili; o.secili = null; takas(a.r, a.s, b.r, b.s); }
    else o.secili = o.secili && o.secili.r === b.r && o.secili.s === b.s ? null : (o.g[b.r][b.s] > 0 ? { r: b.r, s: b.s } : null);
  }
  tuval.addEventListener("mousedown", basBasla); addEventListener("mousemove", basOynat); addEventListener("mouseup", basBitir);
  tuval.addEventListener("touchstart", function (e) { e.preventDefault(); basBasla(e); }, { passive: false });
  tuval.addEventListener("touchmove", function (e) { e.preventDefault(); basOynat(e); }, { passive: false });
  tuval.addEventListener("touchend", function (e) { e.preventDefault(); basBitir(); }, { passive: false });

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
  window.__oyun = { D: D, baslat: function (k) { if (k) D.kahraman = k; oyunBaslat(); }, takas: takas, hamleler: function () { return hamleler(D.oyun).length; }, karistir: karistir, durum: durum,
    ilerlet: function (sn) { for (var t = 0; t < sn && D.oyun.durum !== "bitti"; t += 1 / 60) guncelle(1 / 60); if (D.oyun.durum !== "bitti") ciz(); return durum(); },
    // deneme oyuncusu: taşların ulaşabildiği boşluğa değen, en aşağı inen hamleyi seçer
    otomatik: function () {
      var o = D.oyun, acik = {}, sira = [], s2, en = null;
      for (s2 = YS0; s2 <= YS1; s2++) { if (o.g[0][s2] === 0) { acik["0," + s2] = 1; sira.push([0, s2]); } }
      while (sira.length) { var h = sira.pop(); [[1, 0], [0, 1], [0, -1]].forEach(function (d) { var a = h[0] + d[0], b = h[1] + d[1], k = a + "," + b; if (a < SAT && b >= 0 && b < SUT && !acik[k] && o.g[a][b] === 0) { acik[k] = 1; sira.push([a, b]); } }); }
      hamleler(o).forEach(function (hm) {
        var komsu = false, derin = 0;
        hm.m.forEach(function (q) { derin = Math.max(derin, q[0]); if (q[0] === 0 && q[1] >= YS0 && q[1] <= YS1) komsu = true; if (acik[(q[0] - 1) + "," + q[1]] || acik[q[0] + "," + (q[1] - 1)] || acik[q[0] + "," + (q[1] + 1)]) komsu = true; });
        var puan = (komsu ? 100 : 0) + derin * 3 + hm.m.length - Math.abs(hm.m[0][1] - (YS0 + YS1) / 2);
        if (!en || puan > en.puan) en = { hm: hm, puan: puan };
      });
      if (!en) { o.karistir = 0; karistir(true); return 0; }
      return takas(en.hm.r1, en.hm.s1, en.hm.r2, en.hm.s2);
    } };
})();
