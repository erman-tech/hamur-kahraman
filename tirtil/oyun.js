/* Hamur Kahraman 2: Uzaylı Tırtıl — tek bölüm. Tek dosya, kütüphane yok.
   Akış: kapak → açılış filmi → kahraman seçimi → oyun → sonuç.
   Oyun: uzaylı tırtıl Zorgo labirentten gelip hamur lavı iter; lav aradaki kapıyı, kapı da kahramanı sağdaki tuzağa
   (kodda lav topakları eski adıyla "tas" diye geçer)
   (yerde bekleyen uzay gemisine) doğru sürükler. Yerin altındaki şeker tahtasında bir şeker komşusuyla yer değiştirir (kaydırarak); en az üç aynı şeker
   yan yana ya da alt alta gelince patlarlar; açılan boşluğa taşlar akar, tahtanın altına kadar yol açılırsa suya dökülür. Taş azaldıkça itme
   zayıflar; taş kalmayınca kahraman kurtulur. Kahraman tuzağa varırsa oyun kaybedilir. */
(function () {
  "use strict";
  var G = 720, Y = 1280, POZ = 12; // dikey ekran (telefon) // saniyede 12 poz: stop motion
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
  var KAHRAMANLAR = ["e1", "e2", "e3", "e4", "k1", "k2", "k3", "k4"], ACIK = [];
  try { ACIK = JSON.parse(localStorage.getItem("hk_kostum") || "[]").filter(function (x) { return ["k", "s", "kl", "sl", "kt", "st", "kp", "sp", "ka", "sa"].indexOf(x) >= 0; });
    var TARAF = localStorage.getItem("hk_taraf"); // seçilen taraf değişmez: yalnız kendi renginin kostümleri görünür
    if (TARAF === "iyi" || TARAF === "kotu") ACIK = ACIK.filter(function (x) { return (x.charAt(0) === "k") === (TARAF === "iyi"); });
  } catch (e) { ACIK = []; }
  if (ACIK.length) KAHRAMANLAR = ACIK; // 1. oyunda açılan kostümler varsa yalnız onlar seçilir
  var SEKER = ["j_ayi", "j_kola", "s_lolipop", "j_yumurta", "s_yildiz"];   // beş çeşit: eşleşme bulmak kolay olsun (s_mor sonraki bölümlere)           // jelibonlar ve şekerler
  var SRENK = ["#e23b2e", "#8a5a2b", "#2f8fe0", "#fff3c4", "#f7d514", "#8d4fc4"];
  var R = {};
  function resimYukle(a) { var im = new Image(); im.dene = 0; im.onerror = function () { var b = this; if (b.dene++ < 4) setTimeout(function () { b.src = b.src.split("?")[0] + "?d=" + b.dene; }, 600 * b.dene); }; // yavaş ağda yüklenemeyen görsel yeniden denenir
    im.src = "varlik/" + a + ".png"; R[a] = im; }
  ["bas", "bas_sersem", "top_mor", "top_turuncu", "top_mavi", "top_sari", "ufo", "lav1", "lav2", "kapi", "pb1", "pb2"].concat(SEKER).forEach(resimYukle);
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
  var D = { ekran: "kapak", kahraman: ACIK.length ? ACIK[ACIK.length - 1] : "e4", oyun: null };
  function ekranAc(ad) {
    D.ekran = ad;
    ["kapak", "secim", "sonuc"].forEach(function (e) { $(e).classList.toggle("acik", e === ad); });
    film.style.display = ad === "film" ? "block" : "none";
    $("gec").style.display = ad === "film" ? "block" : "none";
    $("karistir").style.display = "none"; // düğme yok: hamle biterse tahta kendiliğinden yenilenir
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
    var d = document.createElement("button"); d.style.backgroundImage = "url(varlik/kart_" + k + ".jpg)";
    if (ACIK.length) { d.style.backgroundImage = "url(varlik/" + k + "_dur.png)"; d.style.backgroundSize = "auto 88%"; d.style.backgroundColor = "#2c3f8f"; } d.setAttribute("aria-label", "Kahraman " + k);
    d.addEventListener("click", function () { D.kahraman = k; oyunBaslat(); });
    $("kartlar").appendChild(d);
  });
  $("basla").addEventListener("click", function () { filmOynat("giris", secimAc); });
  $("tekrar").addEventListener("click", function () { if (D.sonraki) D.bolum = (D.bolum || 1) + 1; D.sonraki = false; oyunBaslat(); });
  $("yeni").addEventListener("click", function () { muzikDur(); location.href = "../index.html"; });
  $("degistir").addEventListener("click", secimAc);
  var BAG = new URLSearchParams(location.search); if (+BAG.get("bolum")) D.bolum = +BAG.get("bolum"); // test: ?bolum=1..5 // 1. oyundan "İstanbul'da kalacağım" ile gelindiyse seri taşınır
  $("londraGit").addEventListener("click", function () { muzikDur(); location.href = "../istanbul/index.html?londra=1&seri=" + (BAG.get("seri") === "kotu" ? "kotu" : "iyi"); });
  if (BAG.get("baglanti") === "1") setTimeout(function () { // film kendiliğinden başlasın; tarayıcı sesi engellerse kapak kalır
    film.src = "video/giris.mp4"; var p = film.play();
    if (p && p.then) p.then(function () { filmBitince = secimAc; ekranAc("film"); }).catch(function () {});
  }, 200);
  $("kacis").addEventListener("click", function () { muzikDur(); location.href = "../kacis/index.html?k=" + D.kahraman + "&seri=" + (BAG.get("seri") === "kotu" ? "kotu" : "iyi"); });

  // ---------- bölüm ölçüleri ----------
  var H = 78, SUT = 8, SAT = 11;                        // şeker hücresi, tahta sütun/satır
  var B = 3, T = H / B;                                 // her hücre 3×3 çakıl; çakıl ızgarası adımı
  var YS0 = 2, YS1 = 4, YIGIN = 2;                     // taş kuyusunun sütunları ve yüksekliği (hücre)
  var BX = (G - SUT * H) / 2, YER = 340, BY = YER;      // tahtanın sol üst köşesi; YER: zemin çizgisi
  var TS = SUT * B, TY = YIGIN * B, TSAT = TY + SAT * B; // çakıl ızgarası: sütun, yığın satırı, toplam satır
  var KUYU0 = YS0 * B, KUYU1 = (YS1 + 1) * B;           // kuyunun çakıl sütunları [KUYU0, KUYU1)
  var YEDEK_TAS = 300, PUSKURT = 16;                    // tırtılın püskürteceği toplam lav ve saniyedeki topak sayısı                                  // kuyunun üstünden gelmeye devam eden taş sayısı
  var HX0 = BX + (YS1 + 1) * H + 40, HX1 = 612;       // kahramanın başladığı yer ve tuzak (uzay gemisinin ışığı)
  var BOLUM_SAYISI = 5, ITME_B = [28, 26, 24, 22, 20], LAV_B = [300, 325, 350, 375, 400]; /* bölüm bölüm: kapıyı itme süresi (sn) ve püskürtülen lav */
  var YURU = 9, ITME = 28, GERI = 0.02, IPUCU_SN = 6, ERIME = 22; // ERIME: lav altındaki şekeri bu kadar saniyede kendisi eritir (çıkmaz olmasın) // GERI: lavın altında patlayan her şeker kapıyı bu kadar geri iter                             // tırtılın yığına varma süresi; dolu yığınla tuzağa itme süresi (sn)
  var TOPLAM = YEDEK_TAS;
  // Yer altı labirenti: tırtıl sağ üstteki delikten çıkar, üç kez kıvrılıp lav kuyusuna soldan gelir. Kuyruğunun ucu delikten hiç çıkmaz.
  var KOR = 46, TUNEL = 70, ODA = 126;                  // koridor kalınlığı; tünelde kuyudan önce yığılı lavın boyu; kahramanın odasının yüksekliği
  var LY = [34, 92, 150, 296], LSAG = 650, LSOL = 70, LSOL2 = 112, LY2 = LY[3];
  var YOL = [];                                         // yol üzerindeki noktalar, 2 pikselde bir
  (function () {
    function duz(x0, x1, y) { var d = x1 > x0 ? 1 : -1; for (var x = x0; d * (x1 - x) > 0; x += 2 * d) YOL.push({ x: x, y: y, yon: d }); }
    function don(cx, y0, y1, sol) { // yarım çember: y0 satırından y1 satırına, solda ya da sağda
      var r = (y1 - y0) / 2, n = Math.ceil(Math.PI * r / 2);
      for (var k = 0; k < n; k++) { var a = -Math.PI / 2 + Math.PI * k / n; YOL.push({ x: cx + (sol ? -1 : 1) * r * Math.cos(a), y: y0 + r + r * Math.sin(a), yon: (a < 0) === sol ? -1 : 1 }); }
    }
    duz(LSAG + 40, LSOL, LY[0]); don(LSOL, LY[0], LY[1], true);
    duz(LSOL, LSAG, LY[1]); don(LSAG, LY[1], LY[2], false);
    duz(LSAG, LSOL2, LY[2]); don(LSOL2, LY[2], LY[3], true);
    duz(LSOL2, BX + (YS1 + 1) * H, LY[3]);
  })();
  var UZ = 0; while (UZ < YOL.length && !(YOL[UZ].y === LY2 && YOL[UZ].yon === 1 && YOL[UZ].x >= BX + YS0 * H - 40)) UZ++; UZ *= 2;
  function yer(s) { return YOL[Math.max(0, Math.min(YOL.length - 1, Math.round(s / 2)))]; }
  var labirent = document.createElement("canvas"); labirent.width = G; labirent.height = YER + 8;
  (function () {
    var y = labirent.getContext("2d"), i;
    y.fillStyle = "#3b2a1e"; y.fillRect(0, 0, G, YER + 8);          // toprak
    for (i = 0; i < 260; i++) { // toprağın içinde taşlar ve kökler
      var rx = (i * 197.3) % G, ry = (i * 89.7) % (YER + 8), rb = 4 + (i * 7) % 13;
      y.fillStyle = ["#4a3626", "#2e2017", "#5a4532", "#33251a"][i % 4]; y.beginPath(); y.ellipse(rx, ry, rb, rb * 0.7, (i % 5) * 0.6, 0, 7); y.fill();
    }
    function koridor(kalinlik, renk) {
      y.strokeStyle = renk; y.lineWidth = kalinlik; y.lineCap = "round"; y.lineJoin = "round"; y.beginPath();
      YOL.forEach(function (q, k) { if (k) y.lineTo(q.x, q.y); else y.moveTo(q.x, q.y); }); y.stroke();
    }
    function oda(x0, y0, x1, y1, renk, pay) { y.fillStyle = renk; y.fillRect(x0 - pay, y0 - pay, x1 - x0 + 2 * pay, y1 - y0 + pay); }
    var cerceve = "#6e5238", ic = "#17100c", ic2 = "#221812", kx0 = BX + YS0 * H, kx1 = BX + (YS1 + 1) * H;
    koridor(KOR + 12, cerceve); oda(kx0, YER - YIGIN * H, kx1, YER, cerceve, 6); oda(kx1, YER - ODA, G - 12, YER, cerceve, 6);
    koridor(KOR, ic); oda(kx0, YER - YIGIN * H, kx1, YER + 8, ic, 0); oda(kx1, YER - ODA, G - 12, YER + 8, ic, 0);
    koridor(KOR - 16, ic2);
    y.fillStyle = "#000"; y.beginPath(); y.ellipse(LSAG + 34, LY[0], 13, 21, 0, 0, 7); y.fill(); // tırtılın çıktığı delik
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
    D.bolum = Math.max(1, Math.min(BOLUM_SAYISI, D.bolum || 1)); ITME = ITME_B[D.bolum - 1];
    var g = [], tas = [], r, s2;
    for (r = 0; r < SAT; r++) { g.push([]); for (s2 = 0; s2 < SUT; s2++) g[r].push(-1); }
    tahtaKur(g);
    for (r = 0; r < TSAT; r++) { tas.push([]); for (s2 = 0; s2 < TS; s2++) tas[r].push(0); }
    D.oyun = { t: 0, g: g, tas: tas, yedek: LAV_B[D.bolum - 1], durum: "oyna", kum: 0, adim: 0, kirinti: [], yazi: [], dokulen: 0, ipucu: 7, inilti: 4,
      secili: null, bekle: 0, zincir: 0, kay: g.map(function (x) { return x.map(function () { return 0; }); }), soz: {}, bitis: 0, itme: 0, tik: 1, surt: 0, yildiz: 0, sallan: null, karistir: 0, damla: [], pus: 0, dolu: false, bos: 0, oner: null, erime: {}, tasSes: 0, hamle: 0, kalan: 0 };
    ekranAc("oyun"); muzikBasla(); cal("p_nasil", 1);
  }
  function dolu(o, r, s2) { // çakıl hücresi kapalı mı (duvar, şeker ya da taş)
    if (s2 < 0 || s2 >= TS) return true;
    if (r < TY) return !(s2 >= KUYU0 && s2 < KUYU1) || o.tas[r][s2] > 0;
    if (s2 < KUYU0 || s2 >= KUYU1) return true; // lav yalnız kuyunun altındaki sütunlardan iner
    return o.g[Math.floor((r - TY) / B)][Math.floor(s2 / B)] > 0 || o.tas[r][s2] > 0;
  }
  function kalanTas(o) { var n = o.yedek; for (var r = 0; r < TY; r++) for (var s2 = KUYU0; s2 < KUYU1; s2++) if (o.tas[r][s2]) n++; return n; }
  function hucreYeri(r, s2) { return { x: BX + s2 * H + H / 2, y: BY + r * H + H / 2 }; }
  function tasVar(o, r, s2) { for (var a = 0; a < B; a++) for (var b = 0; b < B; b++) if (o.tas[TY + r * B + a][s2 * B + b]) return true; return false; }
  function takasOlur(o, r1, s1, r2, s2) { // iki komşu hücre yer değiştirirse patlayacak hücreler (olmazsa boş liste)
    var g = o.g;
    if (r2 < 0 || r2 >= SAT || s2 < 0 || s2 >= SUT || Math.abs(r1 - r2) + Math.abs(s1 - s2) !== 1) return [];
    var a = g[r1][s1], b = g[r2][s2];
    if (!(a > 0) || !(b > 0)) return []; // boş (lavlı) hücreyle yer değişmez
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
  var LAV_KUYU = 5, LAV_YAN = 1; // patlayan her şeker için akan lav: kuyunun altındaki sütunlarda çok, yanlarda az
  function lavDok(o, n, x) { // yığından n topak eksilir, x hizasından suya damlar
    for (var i = 0; i < n; i++) {
      var v = 0;
      if (o.yedek > 0) { o.yedek--; v = 1 + (i % 2); }
      else for (var r = 0; r < TY && !v; r++) for (var s2 = KUYU0; s2 < KUYU1 && !v; s2++) if (o.tas[r][s2]) { v = o.tas[r][s2]; o.tas[r][s2] = 0; }
      if (!v) return;
      o.damla.push({ x: x + (Math.random() - 0.5) * 40, y: YER - 10 - i * 26, vy: 380 + Math.random() * 120, v: v });
    }
  }
  function patlat(o, m, yr, ys, zincir) { // eşleşen şekerleri patlatır; sonra şekerler düşer (bekle)
    var g = o.g;
    m.forEach(function (h) {
      var p = hucreYeri(h[0], h[1]), renk = SRENK[g[h[0]][h[1]] - 1]; g[h[0]][h[1]] = 0;
      if (h[1] >= YS0 && h[1] <= YS1) o.itme = Math.max(0, o.itme - GERI);
      for (var q = 0; q < 5; q++) o.kirinti.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 320, vy: -60 - Math.random() * 260, t: 0.6, renk: renk, b: 4 + Math.random() * 6 });
    });
    cal("e_pop", 0.7);
    var y = hucreYeri(yr, ys); o.yazi.push({ x: y.x, y: y.y - 30, m: zincir > 1 ? "Zincir! x" + zincir : m.length >= 5 ? "Süper! " + m.length : m.length >= 4 ? "Harika! 4" : "3", t: 0.8, renk: "#ffd23a" });
    if (m.length >= 5) { // ödül: beşli ve üstünde lav en az şekeri kalan sütunda bir şekeri daha eritir
      var enS = -1, enN = 99;
      for (var ks = YS0; ks <= YS1; ks++) { var n = 0; for (var kr = 0; kr < SAT; kr++) if (g[kr][ks] > 0) n++; if (n > 0 && n < enN) { enN = n; enS = ks; } }
      if (enS >= 0) for (var er = 0; er < SAT; er++) if (g[er][enS] > 0) {
        var ep = hucreYeri(er, enS); g[er][enS] = 0; o.yazi.push({ x: ep.x, y: ep.y, m: "Lav eritti!", t: 0.9, renk: "#ff9a3a" });
        for (var eq = 0; eq < 6; eq++) o.kirinti.push({ x: ep.x, y: ep.y, vx: (Math.random() - 0.5) * 260, vy: -80 - Math.random() * 200, t: 0.6, renk: "#ff7a1a", b: 5 + Math.random() * 5 });
        break;
      }
    }
    o.bekle = 0.3; o.zincir = zincir;
  }
  function yercekimi(o) { // şekerler aşağı düşer. Yan sütunlara üstten yeni şeker gelir; lavın altındaki sütunlara şeker değil LAV iner
    var g = o.g, r, s2;
    for (s2 = 0; s2 < SUT; s2++) {
      var kuyu = s2 >= YS0 && s2 <= YS1, yaz = SAT - 1;
      for (r = SAT - 1; r >= 0; r--) if (g[r][s2] > 0) {
        var v = g[r][s2]; g[r][s2] = 0; g[yaz][s2] = v; o.kay[yaz][s2] = (r - yaz) * H;
        if (kuyu && yaz !== r) for (var a = 0; a < B; a++) for (var b = 0; b < B; b++) if (o.tas[TY + yaz * B + a][s2 * B + b]) { o.tas[TY + yaz * B + a][s2 * B + b] = 0; o.yedek++; } // şekerin indiği yerdeki lav yukarıdan yeniden gelir
        yaz--;
      }
      if (!kuyu) for (var k = yaz; k >= 0; k--) { g[k][s2] = 1 + Math.floor(Math.random() * SEKER.length); o.kay[k][s2] = -(yaz + 1) * H; }
    }
    var m = eslesmeler(g);
    if (m.length) patlat(o, m, m[0][0], m[0][1], (o.zincir || 1) + 1);
    else { o.zincir = 0; if (!hamleler(o).length) { o.karistir = 0; karistir(true); } }
  }
  function enIyiHamle(o) { // lavın altında, en az şekeri kalan sütuna dokunan hamle (ipucu ve deneme oyuncusu için)
    var en = null;
    hamleler(o).forEach(function (hm) {
      var puan = hm.m.length + Math.random();
      hm.m.forEach(function (q) { if (q[1] >= YS0 && q[1] <= YS1) { var say = 0; for (var rr = 0; rr < SAT; rr++) if (o.g[rr][q[1]] > 0) say++; puan += 10 + (SAT - say) * 4; } });
      if (!en || puan > en.puan) en = { hm: hm, puan: puan };
    });
    return en ? en.hm : null;
  }
  function takas(r1, s1, r2, s2) { // oyuncunun hamlesi: yer değiştir, üçlü olduysa patlat
    var o = D.oyun; if (!o || D.ekran !== "oyun" || o.durum !== "oyna" || o.bekle > 0) return 0;
    if (r2 < 0 || r2 >= SAT || s2 < 0 || s2 >= SUT) return 0;
    var m = takasOlur(o, r1, s1, r2, s2), g = o.g;
    if (!m.length) { o.sallan = { h: [[r1, s1], [r2, s2]], t: 0.35 }; cal("e_ah", 0.25); return 0; }
    var a = g[r1][s1]; g[r1][s1] = g[r2][s2]; g[r2][s2] = a;
    o.hamle++; o.bos = 0; o.oner = null; patlat(o, m, r2, s2, 1);
    return m.length;
  }
  function kumAdimi(o) { // çakıllar aşağı, olmazsa çapraza akar; tahtanın altından suya dökülür
    var r, i, s2, oynadi = 0, son = TSAT - 1, tas = o.tas;
    o.adim++;
    for (r = son; r >= 0; r--) {
      for (i = 0; i < TS; i++) {
        s2 = (r + o.adim) % 2 ? i : TS - 1 - i;
        var v = tas[r][s2]; if (!v) continue;
        if (r === son) { tas[r][s2] = 0; o.dokulen++; oynadi++; if (o.dokulen % 3 === 0) o.kirinti.push({ x: BX + s2 * T + T / 2, y: BY + SAT * H + 6, vx: (Math.random() - 0.5) * 90, vy: -90 - Math.random() * 70, t: 0.45, renk: "#eef6ff", b: 6 }); continue; }
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
    return oynadi;
  }

  function guncelle(dt) {
    var o = D.oyun;
    o.t += dt;
    if (o.ipucu > 0) o.ipucu -= dt;
    if (o.karistir > 0) o.karistir -= dt;
    if (o.durum === "oyna" && !o.bekle) for (var es = YS0; es <= YS1; es++) { // lav, altındaki ilk şekeri yavaşça eritir
      var er = 0; while (er < SAT && !(o.g[er][es] > 0)) er++;
      var e = o.erime[es] || (o.erime[es] = { r: -1, t: 0 });
      if (er >= SAT || !(er === 0 ? kalanTas(o) > 0 : tasVar(o, er - 1, es))) { e.t = 0; e.r = -1; continue; }
      if (e.r !== er) { e.r = er; e.t = 0; }
      e.t += dt;
      if (e.t >= ERIME) {
        var ep = hucreYeri(er, es); o.g[er][es] = 0; e.t = 0; e.r = -1; cal("e_pop", 0.4);
        o.yazi.push({ x: ep.x, y: ep.y, m: "Lav eritti!", t: 0.9, renk: "#ff9a3a" });
        for (var eq = 0; eq < 6; eq++) o.kirinti.push({ x: ep.x, y: ep.y, vx: (Math.random() - 0.5) * 260, vy: -80 - Math.random() * 200, t: 0.6, renk: "#ff7a1a", b: 5 + Math.random() * 5 });
        if (!hamleler(o).length) { o.karistir = 0; karistir(true); }
      }
    }
    if (o.durum === "oyna" && !o.bekle) { o.bos += dt; if (o.bos > IPUCU_SN && !o.oner) o.oner = enIyiHamle(o); }
    if (o.bekle > 0) { o.bekle -= dt; if (o.bekle <= 0) { o.bekle = 0; yercekimi(o); } }
    for (var kr = 0; kr < SAT; kr++) for (var ks = 0; ks < SUT; ks++) if (o.kay[kr][ks] < 0) o.kay[kr][ks] = Math.min(0, o.kay[kr][ks] + 900 * dt);
    if (o.sallan) { o.sallan.t -= dt; if (o.sallan.t <= 0) o.sallan = null; }
    o.kirinti = o.kirinti.filter(function (p) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; return p.t > 0; });
    o.yazi = o.yazi.filter(function (p) { p.t -= dt; p.y -= 36 * dt; return p.t > 0; });
    o.damla = o.damla.filter(function (q) {
      q.y += q.vy * dt;
      if (q.y < BY + SAT * H) return true;
      o.dokulen++; if (o.dokulen % 3 === 0) o.kirinti.push({ x: q.x, y: BY + SAT * H + 6, vx: (Math.random() - 0.5) * 90, vy: -90 - Math.random() * 70, t: 0.45, renk: "#eef6ff", b: 6 });
      if (o.t - o.tasSes > 0.6) { o.tasSes = o.t; cal("e_tas", 0.4); }
      return false;
    });
    o.kum += dt;
    while (o.kum >= 0.075) { o.kum -= 0.075; if (kumAdimi(o) > 3 && o.t - o.tasSes > 0.9) { o.tasSes = o.t; cal("e_tas", 0.4); } }
    if (o.durum === "oyna") {
      var kalan = kalanTas(o);
      // tırtıl ağzından lav püskürtür: kuyuda yer varsa lav oraya dolar; kuyu ağzına kadar doluysa lav taşar ve kapıyı iter
      o.dolu = true; for (var ds = KUYU0; ds < KUYU1; ds++) if (!o.tas[0][ds] || !o.tas[1][ds]) o.dolu = false;
      if (o.t >= YURU) {
        o.pus += PUSKURT * dt;
        while (o.pus >= 1) { o.pus -= 1; if (o.yedek <= 0) break; var bos = []; for (var ps = KUYU0; ps < KUYU1; ps++) if (!o.tas[0][ps]) bos.push(ps); if (!bos.length) break; var pc = bos[Math.min(bos.length - 1, Math.floor(Math.random() * 2))]; o.tas[0][pc] = 1 + (o.adim % 2); o.yedek--; }
        if (o.dolu) o.itme = Math.min(1, o.itme + dt / ITME);
      }
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
      if (kalan <= 3) { o.durum = "kacti"; /* son bir iki topak kenarda kalabilir */ o.bitis = 0; o.kalan = 1 - o.itme; muzikHizi(1); cal("e_zafer", 0.6); cal("t_5", 1); cal("e_firla", 0.5); }
      else if (o.itme >= 1) { o.durum = "yakalandi"; o.bitis = 0; muzikDur(); cal("t_4", 1); cal("e_firla", 0.4); }
    } else {
      o.bitis += dt;
      if (o.durum === "kacti" && o.bitis > 3.2) sonucGoster(true);
      if (o.durum === "yakalandi" && o.bitis > 2.2 && !o.filmde) { o.filmde = true; muzikDur(); filmOynat("portal", function () { sonucGoster(false); }); } // portaldan geçiş filmi, sonra seçenekler
    }
  }
  function sonucGoster(kazandi) {
    var o = D.oyun; if (o.durum === "bitti") return;
    o.yildiz = kazandi ? (o.kalan > 0.4 ? 3 : o.kalan > 0.15 ? 2 : 1) : 0; o.durum = "bitti"; muzikDur();
    var son = D.bolum >= BOLUM_SAYISI; D.sonraki = kazandi && !son;
    $("sonucBaslik").textContent = !kazandi ? "Portal seni Zorgo'nun gezegenine götürdü!" : son ? "Zorgo'yu beş kez yendin!" : "Bölüm " + D.bolum + " tamam!";
    $("sonucYazi").textContent = !kazandi ? "Gezegenden kaçmayı dene ya da yeni bir oyuna başla." : son ? (BAG.get("final") === "1" ? "Tırtıl istilası da bitti! Macera burada duruyor; devamı yakında." : "Kendini kurtardın. Londra'yı kurtarmaya şimdi hazır mısın?") : "Zorgo sudan çıktı, daha hızlı geliyor! Sıradaki bölüm: " + (D.bolum + 1) + " / " + BOLUM_SAYISI;
    $("kacis").style.display = kazandi ? "none" : ""; $("yeni").style.display = kazandi ? "none" : "";
    var finalden = BAG.get("final") === "1";      // finalden (Kuleyi Yık) gelindiyse Londra sorulmaz
    $("londraGit").style.display = kazandi && son && !finalden ? "" : "none"; if (kazandi && son && finalden) $("yeni").style.display = "";
    $("tekrar").style.display = D.sonraki ? "" : "none"; $("tekrar").textContent = "Sıradaki bölüm ▶";
    $("degistir").style.display = kazandi ? "" : "none";
    if (!kazandi || son) D.bolum = 1;
    $("yildizlar").textContent = kazandi ? "★★★".slice(0, o.yildiz) + "☆☆☆".slice(0, 3 - o.yildiz) : "";
    ekranAc("sonuc"); cal(kazandi ? "p_kazandin" : "p_kaybettin", 1);
  }
  function karistir(kendiliginden) { // kalan şekerleri yeniden dizer: hazır üçlü olmasın, en az bir hamle kalsın
    var o = D.oyun; if (!o || o.durum !== "oyna" || o.karistir > 0 || o.bekle > 0) return;
    o.karistir = 3; o.secili = null;
    for (var d = 0; d < 40; d++) { tahtaKur(o.g); if (hamleler(o).length) break; }
    cal("e_pop", 0.5);
    o.yazi.push({ x: G / 2, y: YER + 150, m: "Yeni şekerler geldi!", t: 1.4, renk: "#fff" });
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
    c.fillStyle = "#6e5238"; c.fillRect(0, YER - 4, BX + YS0 * H, 9); c.fillRect(BX + (YS1 + 1) * H, YER - 4, G, 9); // zemin: kuyunun altı açık
    // tuzak: uzay gemisi ve ışığı
    // tuzak: uzay gemisi yerde bekler; kahramanı yakalarsa alıp kaçar (aşağıda, kahramandan sonra çizilir)
    var ux = HX1 + 34, uy = YER + 2, kac = o.durum === "yakalandi" ? Math.floor(Math.max(0, Math.min(1, (o.bitis - 0.9) / 1.9)) * 14) / 14 : 0;

    // tuzak: tehlikeli bir yere açılan portal (hamur halkalar döner)
    var pcx = ux, pcy = YER - 58, pb = 1 + (panik ? 0.12 : 0) + (o.durum === "yakalandi" ? 0.25 : 0);
    ["#2a0f3d", "#6a1fa0", "#b23ae0", "#ff5ad0", "#ffe36a"].forEach(function (renk, hi) {
      c.save(); c.translate(pcx, pcy); c.rotate((poz * (hi % 2 ? -0.5 : 0.4)) + hi); c.fillStyle = renk;
      c.beginPath(); c.ellipse(0, 0, (34 - hi * 6) * pb, (56 - hi * 10) * pb, 0, 0, 7); c.fill();
      if (hi < 4) { c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.arc((30 - hi * 6) * pb * 0.7, 0, 3, 0, 7); c.fill(); }
      c.restore();
    });

    // şekerler
    for (r = 0; r < SAT; r++) for (s2 = 0; s2 < SUT; s2++) {
      var t = o.g[r][s2]; p = hucreYeri(r, s2);
      if (!t) { c.fillStyle = "rgba(0,0,0,.24)"; yuvarlak(p.x - 37, p.y - 37, 74, 74, 12); c.fill(); continue; }
      c.fillStyle = "rgba(255,240,215,.16)"; yuvarlak(p.x - 36, p.y - 36, 72, 72, 14); c.fill();
      var eri = o.erime[s2] && o.erime[s2].r === r ? o.erime[s2].t / ERIME : 0;
      if (eri > 0.15) { c.fillStyle = "rgba(255,90,20," + (0.15 + 0.5 * eri) + ")"; yuvarlak(p.x - 36, p.y - 36, 72, 72, 14); c.fill(); }
      var sal = o.sallan && o.sallan.h.some(function (q) { return q[0] === r && q[1] === s2; }) ? (poz % 2 ? 5 : -5) : (eri > 0.6 ? (poz % 2 ? 2 : -2) : 0);
      if (o.oner && poz % 4 < 2 && ((o.oner.r1 === r && o.oner.s1 === s2) || (o.oner.r2 === r && o.oner.s2 === s2))) { c.strokeStyle = "#ffd23a"; c.lineWidth = 6; yuvarlak(p.x - 36, p.y - 36, 72, 72, 14); c.stroke(); }
      if (o.secili && o.secili.r === r && o.secili.s === s2) { c.strokeStyle = "#fff"; c.lineWidth = 5; yuvarlak(p.x - 36, p.y - 36, 72, 72, 14); c.stroke(); }
      if (p.y + o.kay[r][s2] > BY - 10) kutuResim(R[SEKER[t - 1]], p.x + sal, p.y + Math.round(o.kay[r][s2] / 26) * 26, 64);
    }
    // çakıllar: küçük, sık, üst üste binen hamur taşlar
    for (r = 0; r < TSAT; r++) for (s2 = 0; s2 < TS; s2++) {
      var v = o.tas[r][s2]; if (!v) continue;
      var h = (r * 37 + s2 * 91) % 7;
      kutuResim(v === 1 ? R.lav1 : R.lav2, BX + s2 * T + T / 2 + (h - 3) * 0.9 + (itiyor && r < TY && poz % 2 ? 3 : 0), YER + (r - TY) * T + T / 2 + ((h * 3) % 5 - 2) * 0.9, 46 + (h % 3) * 3);
    }

    o.damla.forEach(function (q) { if (q.y > YER - 30) kutuResim(q.v === 1 ? R.lav1 : R.lav2, q.x, Math.round(q.y / 18) * 18, 34); }); // suya damlayan lav
    // itilen taş cephesi: kuyudan kahramana kadar taşar, kahramanın önündeki boş alan daralır
    if (o.durum === "oyna") {
      var cx0 = BX + (YS1 + 1) * H, cx1 = HX0 + (HX1 - HX0) * o.itme - 52, n = 0;
      for (var cx = cx0; cx < cx1; cx += 19, n++) for (var kat = 0; kat < 6; kat++) // oda tavana kadar taşla dolar
        kutuResim((n + kat) % 2 ? R.lav1 : R.lav2, cx + ((n * 7 + kat * 3) % 5) + (poz % 2 ? 3 : 0), YER - 16 - kat * 20 + ((n * 3 + kat) % 4), 39 + ((n + kat) % 3) * 3);
    }
    // lav ile kahraman arasındaki kapı: lav kapıyı, kapı kahramanı iter
    if (o.durum === "oyna" && R.kapi.width) c.drawImage(R.kapi, HX0 + (HX1 - HX0) * o.itme - 62 + (itiyor && poz % 2 ? 3 : 0), YER - ODA + 4, 40, ODA - 4);
    // tırtılın ağzından kuyuya püsküren lav
    if (itiyor && o.yedek > 0) for (var pk = 0; pk < 5; pk++) {
      var pf = ((poz * 0.37 + pk * 0.2) % 1), px0 = BX + YS0 * H - 26;
      kutuResim((pk + poz) % 2 ? R.lav1 : R.lav2, px0 + pf * 70, LY2 - 6 - Math.sin(pf * Math.PI) * 26 + (pk % 2) * 6, 22 + pf * 16);
    }
    // tırtıl Zorgo: labirentte kuyruktan başa; taşlara varınca iter
    var ts = UZ * yuru + (itiyor && poz % 3 === 0 ? 5 : 0), basR = R.bas, baci = 0, bdy = 0, topR = [R.top_mor, R.top_turuncu, R.top_mavi, R.top_sari], tp;
    if (o.durum === "kacti") { basR = R.bas_sersem; ts = UZ - TUNEL * 0.3 + Math.floor(o.bitis * POZ) / POZ * 520; }
    var kenar = BX + YS0 * H + 36, kyer = function (u) { var q = yer(u); return o.durum === "kacti" && q.x > kenar ? { x: kenar + 20, y: LY2 + (q.x - kenar), yon: 1 } : q; };
    for (i = Math.min(120, Math.floor((ts - 35) / 25)); i >= 0; i--) { // kuyruk deliğe kadar uzanır
      if (ts - 35 - i * 25 < 0) continue;
      tp = kyer(ts - 35 - i * 25); if (tp.y > BY + SAT * H) continue;
      resim(topR[i % 4], tp.x + titre(i, poz) * 1.5, tp.y + 25 - ((poz + i) % 2 ? 3 : 0), 31, tp.yon < 0);
    }
    tp = kyer(Math.max(0, ts));
    if (tp.y <= BY + SAT * H) resim(basR, tp.x + titre(7, poz) * (panik ? 3 : 1), tp.y + 27 - (poz % 2 ? 3 : 0) + bdy, 50, tp.yon < 0 && o.durum !== "kacti", baci);

    // kahraman (taşlara karşı iter, sağa sürüklenir) ve papağan
    var hx = HX0 + (HX1 - HX0) * o.itme, hy = YER + 2, hboy = 114, hr = R[kd + "_at"], hcevir = true;
    if (itiyor) hx += (poz % 3 === 0 ? -3 : 0);
    if (o.durum === "kacti") { hr = R[kd + "_dur"]; hcevir = false; hy -= (poz % 4 < 2 ? 14 : 0); }
    if (o.durum === "yakalandi") { hr = R[kd + "_dur"]; var yq = Math.floor(Math.min(1, o.bitis / 0.9) * 8) / 8; hx = HX1 + (ux - HX1) * yq; hy = uy - 20 - yq * 30; hboy = 114 * (1 - yq * 0.95); }
    resim(hr, hx, hy, hboy, hcevir);
    resim(poz % 2 ? R.pb1 : R.pb2, Math.min(hx + 56, HX1 - 30), YER - 62 + (poz % 4 < 2 ? 0 : -6), 40, true);

    // kırıntılar, yazılar
    o.kirinti.forEach(function (q) { c.fillStyle = q.renk; c.beginPath(); c.arc(q.x, q.y, q.b * Math.min(1, q.t * 2), 0, 7); c.fill(); });
    c.textAlign = "center";
    o.yazi.forEach(function (q) { c.globalAlpha = Math.min(1, q.t * 2.5); yazi(q.m, q.x, q.y, 30, q.renk); });
    c.globalAlpha = 1;

    // gösterge: kahraman tuzağa ne kadar yakın
    var gy = BY + SAT * H + 34;
    c.textAlign = "left"; yazi("Tuzağa uzaklık", 20, gy, 18);
    c.fillStyle = "rgba(20,25,60,.75)"; yuvarlak(20, gy + 8, 300, 18, 9); c.fill();
    c.fillStyle = o.itme > 0.62 ? "#ff5a4a" : o.itme > 0.35 ? "#f7b21e" : "#5fd16a"; yuvarlak(20, gy + 8, Math.max(18, 300 * (1 - o.itme)), 18, 9); c.fill();
    yazi("Kalan lav: " + kalanTas(o), 360, gy + 22, 20); yazi("Bölüm " + D.bolum + " / " + BOLUM_SAYISI, 580, gy + 22, 20, "#ffd23a");
    c.textAlign = "center";
    if (o.durum === "oyna" && o.ipucu > 0) { yazi("Zorgo lav püskürtüyor! Kuyu dolarsa lav seni portala iter!", G / 2, YER + 34, 23, "#ffd23a"); yazi("Lavın altındaki şekerleri patlat: lav suya dökülsün!", G / 2, YER + 68, 22); }
    else if (panik && poz % 2) yazi("Tuzağa çok yaklaştın!", G / 2, YER + 40, 36, "#ffd23a");
    if (o.durum === "kacti") yazi("Zorgo suya düştü! Kurtuldun!", G / 2, YER + 40, 36, "#ffd23a");
    if (o.durum === "yakalandi") yazi("Eyvah! Portal seni içine çekti!", G / 2, YER + 40, 32, "#ffd23a");
    if (panik && poz % 4 < 2) { // gerilim: kenarlar kızarır
      var kz = c.createRadialGradient(G / 2, Y / 2, 320, G / 2, Y / 2, 820); kz.addColorStop(0, "rgba(255,40,30,0)"); kz.addColorStop(1, "rgba(255,40,30,.3)");
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
      var o = D.oyun, hm = enIyiHamle(o);
      if (!hm) { o.karistir = 0; karistir(true); return 0; }
      return takas(hm.r1, hm.s1, hm.r2, hm.s2);
    } };
})();
