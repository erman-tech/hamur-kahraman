/* Hamur Kahraman — İstanbul bölümü. Tek dosya, kütüphane yok.
   Akış: kapak → giriş filmi (meteorlar + kahraman + oyun adı) → seçim → dönüşüm filmi → oyun → dünya haritası. */
(function () {
  "use strict";
  var G = 1280, Y = 720, ZEMIN = 672, UZUNLUK = 9000;
  var $ = function (id) { return document.getElementById(id); };
  var tuval = $("tuval"), c = tuval.getContext("2d"), film = $("film");

  // ---------- ölçekleme ----------
  function olcekle() {
    var k = Math.min(innerWidth / G, innerHeight / Y), s = $("sahne");
    s.style.transform = "scale(" + k + ")";
    s.style.left = (innerWidth - G * k) / 2 + "px";
    s.style.top = (innerHeight - Y * k) / 2 + "px";
  }
  addEventListener("resize", olcekle); olcekle();

  // ---------- varlıklar ----------
  var R = {}, resimAdlari = ["bariyer", "arka_p.jpg", "arka_p_gri.jpg", "kp_dur", "kp_kos1", "kp_kos2", "kp_uc", "kp_at", "sp_dur", "sp_kos1", "sp_kos2", "sp_uc", "sp_at", "p_yur1", "p_yur2", "p_uc1", "p_uc2", "p_yuv", "boya", "p_platform", "dalga", "p_top", "ressam", "sis1", "sis2", "sis3", "shuriken", "simsek", "arka.jpg", "arka_l.jpg", "kl_dur", "kl_kos1", "kl_kos2", "kl_kos3", "kl_kos4", "l_yur1", "l_yur2", "l_uc1", "l_uc2", "l_yuv", "arka_t.jpg", "kt_dur", "kt_kos1", "kt_kos2", "kt_uc", "kt_at", "st_dur", "st_kos1", "st_kos2", "st_uc", "st_at", "t_platform", "onigiri", "t_yuv", "t_yur1", "t_yur2", "t_uc1", "t_uc2", "ejder", "kl_uc", "kl_at", "sl_dur", "sl_kos1", "sl_kos2", "sl_uc", "sl_at", "kont", "cay", "otobus", "k_dur", "k_kos1", "k_kos2", "k_uc", "k_at", "s_dur", "s_kos1", "s_kos2", "s_uc", "s_at",
    "pb1", "pb2", "ps1", "ps2", "yur1", "yur2", "uc1", "uc2", "kral", "platform", "simit", "meteor", "kalp", "sandik", "yildiz"];
  resimAdlari.forEach(function (a) {
    var im = new Image(); im.src = "varlik/" + (a.indexOf(".") > 0 ? a : a + ".png"); R[a.replace(".jpg", "")] = im;
  });
  // Sesler: Web Audio (tablette de çalsın diye); olmazsa düz <audio>.
  var sesAdlari = ["e_ag", "e_elektrik", "e_pop", "e_simit", "e_ah", "e_zafer", "e_meteor", "p_soru", "p_basla", "p_kral", "p_tekrar", "p_gorev", "a_kazandin_c", "a_kazandin_u", "p_londra", "p_kont", "a_londra", "p_tokyo", "p_ejder", "a_tokyo", "p_paris", "p_ressam", "a_paris", "muzik"];
  var AC = window.AudioContext || window.webkitAudioContext, ac = null, tampon = {}, yedek = {}, muzikDugum = null;
  sesAdlari.forEach(function (a) { var s = new Audio(); s.preload = "auto"; s.src = "ses/" + a + ".mp3"; yedek[a] = s; });
  yedek.muzik.loop = true; yedek.muzik.volume = 0.22;
  function sesAc() { // ilk dokunuşta çağrılır
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
        var k = ac.createBufferSource(), g = ac.createGain(); k.buffer = tampon.muzik; k.loop = true; g.gain.value = 0.22; k.connect(g); g.connect(ac.destination); k.start(); muzikDugum = k; return;
      }
      yedek.muzik.currentTime = 0; var p = yedek.muzik.play(); if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }
  function muzikDur() { try { if (muzikDugum) { muzikDugum.stop(); muzikDugum = null; } yedek.muzik.pause(); } catch (e) {} }
  ["touchstart", "mousedown", "keydown"].forEach(function (o) { addEventListener(o, sesAc, true); });

  // ---------- durum ----------
  var D = { ekran: "kapak", secim: null, oyun: null, sehir: "istanbul", kurtarilan: {} };
  // Şehirler: her şehrin arka planı, kostümü (kırmızı seri / siyah seri), toplanacak şeyi ve baş kötüsü ayrı.
  var SEHIRLER = {
    istanbul: { ad: "İstanbul", eki: "İstanbul'u", arka: "arka", on: { iyi: "k_", kotu: "s_" }, topla: "simit", toplaAd: "Simit", platform: "platform", kral: "kral", kralAd: "Meteor Kralı", kralEki: "Meteor Kralı'nı", pBasla: "p_basla", pKral: "p_kral", zafer: null, kralOlcek: 1.15, kotu: { yur: ["yur1", "yur2"], uc: ["uc1", "uc2"], yuv: "meteor", yurOlcek: 0.6, ucOlcek: 0.62 }, toplaOlcek: 0.62,
      bolum: { uz: 10000, simit: 22, kotu: 12, kralAra: 2.1, meteorAra: 3.5, yurAra: 640, yurHiz: 75, ucAra: 1050, ucHiz: 115, kralCan: 6, yuvar: 12, dal: 9 } },
    londra: { ad: "Londra", eki: "Londra'yı", arka: "arka_l", on: { iyi: "kl_", kotu: "sl_" }, topla: "cay", toplaAd: "Çay fincanı", platform: "otobus", kral: "kont", kralAd: "Sis Kontu", kralEki: "Sis Kontu'nu", pBasla: "p_londra", pKral: "p_kont", zafer: "a_londra", kralOlcek: 0.9, kotu: { yur: ["l_yur1", "l_yur2"], uc: ["l_uc1", "l_uc2"], yuv: "l_yuv", yurOlcek: 0.95, ucOlcek: 0.85 }, guc: "zaman", gucBekle: 14, toplaOlcek: 0.8, gecis: { iyi: "us_kirmizi", kotu: "us_siyah" },
      bolum: { uz: 14000, simit: 32, kotu: 18, kralAra: 1.4, meteorAra: 2.2, yurAra: 430, yurHiz: 105, ucAra: 700, ucHiz: 150, kralCan: 12, yuvar: 7, dal: 5 } }, // guc: bu şehrin kostümüne özel güç
    tokyo: { ad: "Tokyo", eki: "Tokyo'yu", arka: "arka_t", on: { iyi: "kt_", kotu: "st_" }, topla: "onigiri", toplaAd: "Onigiri", platform: "t_platform", kral: "ejder", kralAd: "Neon Ejder", kralEki: "Neon Ejder'i", pBasla: "p_tokyo", pKral: "p_ejder", zafer: "a_tokyo", kralOlcek: 0.85,
      kotu: { yur: ["t_yur1", "t_yur2"], uc: ["t_uc1", "t_uc2"], yuv: "t_yuv", yurOlcek: 0.95, ucOlcek: 0.9 }, guc: "ninja", gucBekle: 12, toplaOlcek: 0.75, gecis: { iyi: "tokyo_kirmizi", kotu: "tokyo_siyah" },
      bolum: { uz: 17000, simit: 40, kotu: 24, kralAra: 1.25, meteorAra: 2.0, yurAra: 390, yurHiz: 120, ucAra: 620, ucHiz: 165, kralCan: 16, yuvar: 6, dal: 4 } },
    // Paris: şehir gri başlar, ilerledikçe renklenir (arkaGri üstüne renkli arka plan poz poz açılır). Güç: renk dalgası.
    paris: { ad: "Paris", eki: "Paris'i", yon: "Paris'e", arka: "arka_p", arkaGri: "arka_p_gri", on: { iyi: "kp_", kotu: "sp_" }, topla: "boya", toplaAd: "Boya tüpü", platform: "p_platform", kral: "ressam", kralAd: "Gölge Ressam", kralEki: "Gölge Ressam'ı", pBasla: "p_paris", pKral: "p_ressam", zafer: "a_paris", kralOlcek: 0.9, mermi: "p_top",
      kotu: { yur: ["p_yur1", "p_yur2"], uc: ["p_uc1", "p_uc2"], yuv: "p_yuv", yurOlcek: 0.95, ucOlcek: 0.9 }, guc: "renk", gucBekle: 12, toplaOlcek: 0.75, gecis: { iyi: "paris_kirmizi", kotu: "paris_siyah" },
      bolum: { uz: 19000, simit: 46, kotu: 28, kralAra: 1.15, meteorAra: 1.9, yurAra: 370, yurHiz: 128, ucAra: 590, ucHiz: 172, kralCan: 18, yuvar: 6, dal: 4 } }
  };
  var SIRA = ["istanbul", "londra", "tokyo", "paris"];
  function yonAd(s) { return SEHIRLER[s].yon || SEHIRLER[s].ad + "'ya"; }
  function siradaki() { for (var i = 0; i < SIRA.length; i++) if (!D.kurtarilan[SIRA[i]]) return SIRA[i]; return null; }
  function sehir() { return SEHIRLER[D.sehir]; }
  function kostumAc(on) { try { var l = JSON.parse(localStorage.getItem("hk_kostum") || "[]"); if (l.indexOf(on) < 0) l.push(on); localStorage.setItem("hk_kostum", JSON.stringify(l)); } catch (e) {} }
  function ekranAc(ad) {
    D.ekran = ad;
    ["kapak", "secim", "harita"].forEach(function (e) { $(e).classList.toggle("acik", e === ad); });
    film.style.display = ad === "film" ? "block" : "none";
    $("gec").style.display = ad === "film" ? "block" : "none";
    $("sehirler").style.display = ad === "film" && film.dataset.ad === "giris" ? "flex" : "none";
    $("dokunma").style.display = ad === "oyun" && ("ontouchstart" in window) ? "block" : "none";
  }

  // ---------- filmler ----------
  var SEHIR_SN = [4.3, 5.4, 6.3, 7.3, 8.3], filmBitince = null;
  function filmOynat(ad, bitince) {
    film.dataset.ad = ad; film.src = "video/" + ad + ".mp4"; filmBitince = bitince;
    Array.prototype.forEach.call($("sehirler").children, function (s) { s.classList.remove("gor"); });
    ekranAc("film");
    var p = film.play(); if (p && p.catch) p.catch(function () {});
  }
  function filmBitti() { var f = filmBitince; filmBitince = null; film.pause(); if (f) f(); }
  film.addEventListener("ended", filmBitti);
  $("gec").addEventListener("click", filmBitti);
  film.addEventListener("timeupdate", function () {
    if (film.dataset.ad !== "giris") return;
    var t = film.currentTime, ss = $("sehirler").children;
    for (var i = 0; i < ss.length; i++) ss[i].classList.toggle("gor", t >= SEHIR_SN[i] && t < 10.3);
  });

  function secimEkrani() {
    $("secim").style.backgroundImage = "url(varlik/secim.jpg)";
    ekranAc("secim"); cal("p_soru", 1);
  }
  function tarafOku() { try { var t = localStorage.getItem("hk_taraf"); return t === "iyi" || t === "kotu" ? t : null; } catch (e) { return null; } }
  function sec(deger) {
    deger = tarafOku() || deger; // bir kez seçilen taraf değişmez: siyahı seçen kırmızıya geçemez
    try { localStorage.setItem("hk_taraf", deger); } catch (e) {}
    D.secim = deger; D.sehir = "istanbul";
    kostumAc(deger === "iyi" ? "k" : "s");
    filmOynat(deger === "iyi" ? "donusum_kirmizi" : "donusum_siyah", oyunBaslat);
  }
  var TEST = new URLSearchParams(location.search).get("test"); // test: ?test=<şehir>&seri=iyi|kotu → o bölüm doğrudan açılır, taraf kilidine dokunmaz
  $("basla").addEventListener("click", function () {
    var DEVAM = new URLSearchParams(location.search).get("devam"); // koşu oyunundan dönüş: o şehir filmsiz başlar
    if (SEHIRLER[DEVAM]) {
      D.secim = tarafOku() || (new URLSearchParams(location.search).get("seri") === "kotu" ? "kotu" : "iyi");
      for (var dv = 0; dv < SIRA.indexOf(DEVAM); dv++) D.kurtarilan[SIRA[dv]] = true;
      D.sehir = DEVAM; oyunBaslat(); return;
    }
    if (SEHIRLER[TEST]) { // test: önce o şehrin geçiş filmi, sonra bölüm
      D.secim = new URLSearchParams(location.search).get("seri") === "kotu" ? "kotu" : "iyi";
      var tg = SEHIRLER[TEST].gecis, tb = function () { D.sehir = TEST; oyunBaslat(); };
      if (tg) filmOynat(tg[D.secim], tb); else tb(); return;
    }
    filmOynat("giris", function () { var t = tarafOku(); if (t) sec(t); else secimEkrani(); }); });
  if (SEHIRLER[TEST]) $("basla").textContent = "▶ TEST: " + SEHIRLER[TEST].ad;
  if (SEHIRLER[new URLSearchParams(location.search).get("devam")]) $("basla").textContent = "▶ " + SEHIRLER[new URLSearchParams(location.search).get("devam")].eki + " kurtar!";
  $("evet").addEventListener("click", function () { sec("iyi"); });
  $("hayir").addEventListener("click", function () { sec("kotu"); });
  $("tekrar").addEventListener("click", function () { oyunBaslat(); });
  // Karar: İstanbul'da kalırsa uzaylı tırtıl Ateş için gelir (2. oyun); orada kazanınca yine Londra sorulur.
  $("kal").addEventListener("click", function () {
    if (siradaki() === "tokyo") { // Londra'dan sonra eve dönmek isterse: Zorgo'nun UFO'su jeti yakalar, kötüler gezegenine ışınlar → Gezegenden Kaçış; kaçarsa Tokyo görevi yine sorulur
      muzikDur(); var kst = SEHIRLER.londra.on[D.secim].replace("_", "");
      filmOynat(D.secim === "iyi" ? "ufo_kirmizi" : "ufo_siyah", function () { location.href = "../kacis/index.html?sonra=tokyo&k=" + kst + "&seri=" + (D.secim === "iyi" ? "iyi" : "kotu"); });
      return;
    }
    muzikDur(); location.href = "../tirtil/index.html?baglanti=1&seri=" + (D.secim === "iyi" ? "iyi" : "kotu"); });
  // İstanbul'dan sonra: gizli üs, yeni kostüm, hamur jet ve Londra
  $("londra").addEventListener("click", function () { // sıradaki şehre: geçiş filmi (yeni kostüm) → bölüm
    if (!siradaki()) { muzikDur(); location.href = "../final/index.html?seri=" + (D.secim === "iyi" ? "iyi" : "kotu"); return; } // dört şehir bitti: final (Kuleyi Yık)
    var h = siradaki() || "londra", sh = SEHIRLER[h]; muzikDur();
    filmOynat(sh.gecis[D.secim], function () {
      if (h === "tokyo") { location.href = "../kosu/index.html?seri=" + (D.secim === "iyi" ? "iyi" : "kotu"); return; } // önce papağanı kurtar (koşu), sonra Tokyo bölümü
      D.sehir = h; oyunBaslat();
    });
  });
  $("diger").style.display = "none"; // taraf değişmez

  // ---------- tuşlar ----------
  var T = { sol: false, sag: false, yukari: false, ates: false, zaman: false }, yukariYeni = false, zamanYeni = false;
  var HARITA = { ArrowLeft: "sol", KeyA: "sol", ArrowRight: "sag", KeyD: "sag", ArrowUp: "yukari", KeyW: "yukari", Space: "yukari",
    KeyX: "ates", KeyF: "ates", Enter: "ates", KeyZ: "zaman", KeyC: "zaman" };
  function tus(ad, basili) { if (ad === "yukari" && basili && !T.yukari) yukariYeni = true; if (ad === "zaman" && basili && !T.zaman) zamanYeni = true; T[ad] = basili; }
  addEventListener("keydown", function (e) { var a = HARITA[e.code]; if (a) { tus(a, true); e.preventDefault(); } });
  addEventListener("keyup", function (e) { var a = HARITA[e.code]; if (a) { tus(a, false); e.preventDefault(); } });
  Array.prototype.forEach.call(document.querySelectorAll("#dokunma button"), function (b) {
    var ad = b.dataset.tus;
    b.addEventListener("touchstart", function (e) { tus(ad, true); e.preventDefault(); });
    b.addEventListener("touchend", function (e) { tus(ad, false); e.preventDefault(); });
    b.addEventListener("touchcancel", function () { tus(ad, false); });
  });

  // ---------- bölüm ----------
  var GOREV_SIMIT = 20, GOREV_KOTU = 10; // bölüm kurulurken şehre göre değişir
  function bolumKur() {
    var o = {
      t: 0, kam: 0, bitti: false, bitisSayac: 0, mesaj: "", mesajSn: 0, gorevSes: {},
      k: { x: 200, y: ZEMIN, vx: 0, vy: 0, yon: 1, yerde: true, yakit: 1, atSn: 0, bekleme: 0, can: 3, dokunulmaz: 0 },
      p: { x: 120, y: 480 },
      platformlar: [], simitler: [], kotuler: [], sandiklar: [], mermiler: [], meteorlar: [], parcalar: [], esyalar: [],
      simit: 0, yakalanan: 0, meteorSn: 5, kral: null, kralGeldi: false, dalgalar: [], yildizlar: [], duman: null
    };
    [[900, 500], [1150, 420], [1900, 480], [2150, 400], [2400, 480], [3300, 470], [3600, 390], [4500, 500], [4750, 420], [5000, 340],
      [5900, 470], [6200, 400], [6900, 480], [7200, 420]].forEach(function (a) {
      o.platformlar.push({ x: a[0], y: a[1], g: 174 });
      o.simitler.push({ x: a[0] + 87, y: a[1] - 48 });
    });
    [500, 580, 660, 1500, 1580, 1660, 2800, 2880, 2960, 4000, 4080, 5400, 5480, 5560, 6500, 6580, 7500, 7580, 7660].forEach(function (x) {
      o.simitler.push({ x: x, y: ZEMIN - 60 });
    });
    [[1300, 300], [3000, 260], [4300, 250], [5650, 230], [6700, 260]].forEach(function (a) { o.simitler.push({ x: a[0], y: a[1] }); });
    [1300, 2000, 2700, 3500, 4200, 4900, 5600, 6400, 7000, 7600].forEach(function (x, i) {
      o.kotuler.push({ tur: "yur", x: x, y: ZEMIN, x0: x - 160, x1: x + 160, yon: i % 2 ? 1 : -1, hiz: 70, g: 60, y_: 75 });
    });
    [[1700, 380], [3100, 300], [4400, 350], [5300, 280], [6100, 330], [7300, 300]].forEach(function (a, i) {
      o.kotuler.push({ tur: "uc", x: a[0], y: a[1], y0: a[1], x0: a[0] - 220, x1: a[0] + 220, yon: i % 2 ? 1 : -1, hiz: 110, faz: i, g: 80, y_: 70 });
    });
    [2300, 4600, 6800, 7850].forEach(function (x) { o.sandiklar.push({ x: x, y: ZEMIN, g: 70 }); });
    // Bölüm tasarımı iki şehirde aynı kalıpla dizilir; sayılar şehre göre (İstanbul öğretir, Londra zorlar).
    var A = sehir().bolum;
    UZUNLUK = A.uz; GOREV_SIMIT = A.simit; GOREV_KOTU = A.kotu; o.kralAra = A.kralAra; o.meteorAra = A.meteorAra; o.meteorSn = 5;
    o.yuvarAra = A.yuvar; o.yuvarSn = A.yuvar; o.dalAra = A.dal;
    o.platformlar = []; o.simitler = []; o.kotuler = []; o.sandiklar = [];
    var yk = [500, 410, 330, 440, 360, 480], n = 0, x;
    for (x = 850; x < UZUNLUK - 1700; x += 300 + (n % 3) * 110, n++) { o.platformlar.push({ x: x, y: yk[n % 6], g: 174 }); o.simitler.push({ x: x + 87, y: yk[n % 6] - 48 }); }
    for (x = 500; x < UZUNLUK - 1500; x += 520) { o.simitler.push({ x: x, y: ZEMIN - 60 }); o.simitler.push({ x: x + 80, y: ZEMIN - 60 }); }
    for (x = 1500, n = 0; x < UZUNLUK - 1500; x += 1300, n++) o.simitler.push({ x: x, y: 230 + (n % 2) * 40 });
    for (x = 1100, n = 0; x < UZUNLUK - 1500; x += A.yurAra, n++) o.kotuler.push({ tur: "yur", x: x, y: ZEMIN, x0: x - 170, x1: x + 170, yon: n % 2 ? 1 : -1, hiz: A.yurHiz, g: 60, y_: 75 });
    for (x = 1500, n = 0; x < UZUNLUK - 1500; x += A.ucAra, n++) { var yy = 260 + (n % 3) * 50; o.kotuler.push({ tur: "uc", x: x, y: yy, y0: yy, x0: x - 240, x1: x + 240, yon: n % 2 ? 1 : -1, hiz: A.ucHiz, faz: n, g: 80, y_: 70, dalSn: 3 + n % 4 }); }
    for (x = 2200; x < UZUNLUK - 900; x += 2300) o.sandiklar.push({ x: x, y: ZEMIN, g: 70 });
    // bariyerler: yürüyerek geçilmez, zıplamak gerekir. Şehir ilerledikçe sıklaşır; yüksek olanı atışı da keser (üstünden uçulur ya da platformdan geçilir)
    var zor = Math.max(0, SIRA.indexOf(D.sehir)); o.duvarlar = [];
    for (x = 1250, n = 0; x < UZUNLUK - 1500; x += 1150 - zor * 110 + (n % 3) * 140, n++) o.duvarlar.push({ x: x, g: 124, y_: (n % 3 === 2 && zor > 0) || (zor > 1 && n % 2) ? 150 : 75 });
    o.kral = { x: UZUNLUK - 350, y: ZEMIN, can: A.kralCan, canMax: A.kralCan, yon: -1, atSn: 2, vurSn: 0, yenildi: false, g: 200, y_: 255, ozelSn: 7, sis: 0, yaylim: 0 };
    return o;
  }

  function oyunBaslat() {
    $("zamanD").style.display = sehir().guc ? "" : "none"; $("zamanD").textContent = sehir().guc === "renk" ? "🎨" : sehir().guc === "ninja" ? "⚡" : "⏱";
    D.oyun = bolumKur(); ekranAc("oyun");
    muzikBasla();
    cal(sehir().pBasla, 1);
    mesajVer("Yürü: ← →   Zıpla ve uç: ↑ ya da Boşluk   " + (D.secim === "iyi" ? "Ağ at: X" : "Elektrik at: X"), 7);
  }
  function ad() { return D.secim === "iyi" ? "Cesur" : "Ürkek"; }
  function mesajVer(m, sn) { D.oyun.mesaj = m; D.oyun.mesajSn = sn; }

  function parca(o, x, y, renk, n) {
    for (var i = 0; i < n; i++) o.parcalar.push({ x: x, y: y, vx: (Math.random() - 0.5) * 420, vy: -Math.random() * 380, sn: 0.6, renk: renk, r: 4 + Math.random() * 6 });
  }
  function kutuCakis(ax, ay, ag, ay_, bx, by, bg, by_) { // x: merkez, y: alt kenar
    return Math.abs(ax - bx) < (ag + bg) / 2 && ay > by - by_ && ay - ay_ < by;
  }

  function incit(o) {
    var k = o.k; if (k.dokunulmaz > 0 || o.bitti) return;
    k.can--; k.dokunulmaz = 1.6; k.vy = -380; k.vx = -k.yon * 200; cal("e_ah");
    if (k.can <= 0) { o.bitti = "kayip"; o.bitisSayac = 2.6; cal("p_tekrar", 1); mesajVer("Üzülme, tekrar deneyelim!", 3); }
  }
  function kotuYakala(o, e) {
    e.yakalandi = D.secim === "iyi" ? "ag" : "elektrik"; e.sn = 0.9; e.vy = -260; o.yakalanan++;
    cal("e_pop"); parca(o, e.x, e.y - 40, D.secim === "iyi" ? "#ffffff" : "#ff3030", 10);
  }

  function guncelle(dt) {
    var o = D.oyun; if (!o) return;
    o.t += dt; if (o.mesajSn > 0) o.mesajSn -= dt;
    var k = o.k, i, e, m;

    if (o.bitti) {
      o.bitisSayac -= dt;
      if (o.bitisSayac <= 0) { if (o.bitti === "kayip") oyunBaslat(); else haritaAc(); return; }
    }

    // --- kahraman ---
    var canli = o.bitti !== "kayip";
    var hedef = canli ? ((T.sag ? 1 : 0) - (T.sol ? 1 : 0)) * 310 : 0;
    k.vx += (hedef - k.vx) * Math.min(1, dt * (hedef ? 12 : 22)); if (!hedef && Math.abs(k.vx) < 25) k.vx = 0;
    if (hedef) k.yon = hedef > 0 ? 1 : -1;
    if (canli && yukariYeni && k.yerde) { k.vy = -640; k.yerde = false; }
    else if (canli && T.yukari && !k.yerde && k.yakit > 0) { k.vy += (-300 - k.vy) * Math.min(1, dt * 7); k.yakit -= dt / 3.5; k.ucuyor = true; }
    else k.ucuyor = false;
    yukariYeni = false;
    k.vy += 1700 * dt; if (k.vy > 900) k.vy = 900;
    var eskiY = k.y;
    k.x += k.vx * dt; k.y += k.vy * dt; k.adim = (k.adim || 0) + Math.abs(k.vx) * dt;
    k.x = Math.max(40, Math.min(UZUNLUK - 40, k.x));
    var eskiX = k.x - k.vx * dt, dv2;
    for (i = 0; i < o.duvarlar.length; i++) { // bariyer: üstüne basılır, yandan geçilmez
      dv2 = o.duvarlar[i]; var dtop = ZEMIN - dv2.y_, dyar = dv2.g / 2 + 24;
      if (Math.abs(k.x - dv2.x) >= dyar) continue;
      if (k.vy >= 0 && eskiY <= dtop + 2 && k.y >= dtop) { k.y = dtop; k.vy = 0; dv2.ustunde = true; }
      else if (k.y > dtop + 4) { k.x = dv2.x + (eskiX < dv2.x ? -dyar : dyar); k.vx = 0; }
    }
    if (k.y < 70) { k.y = 70; if (k.vy < 0) k.vy = 0; }
    k.yerde = false;
    if (k.y >= ZEMIN) { k.y = ZEMIN; k.vy = 0; k.yerde = true; }
    for (i = 0; i < o.duvarlar.length; i++) { dv2 = o.duvarlar[i]; if (Math.abs(k.x - dv2.x) < dv2.g / 2 + 24 && Math.abs(k.y - (ZEMIN - dv2.y_)) < 1 && k.vy === 0) k.yerde = true; }
    if (k.vy >= 0) for (i = 0; i < o.platformlar.length; i++) {
      m = o.platformlar[i];
      if (k.x > m.x - 20 && k.x < m.x + m.g + 20 && eskiY <= m.y + 2 && k.y >= m.y) { k.y = m.y; k.vy = 0; k.yerde = true; }
    }
    if (k.yerde) k.yakit = Math.min(1, k.yakit + dt * 1.2);
    if (k.dokunulmaz > 0) k.dokunulmaz -= dt;
    if (k.atSn > 0) k.atSn -= dt;
    if (k.bekleme > 0) k.bekleme -= dt;
    k.mermi = Math.min(5, (k.mermi == null ? 5 : k.mermi) + dt / 0.8); // atış gücü: beş atış, 0,8 sn'de bir dolar (sürekli ateş edilemez)
    if (canli && T.ates && k.bekleme <= 0 && k.mermi < 1 && !o.mermiUyari) { o.mermiUyari = true; mesajVer("Atış gücü bitti! Biraz bekle ya da zıpla.", 1.6); }
    if (canli && T.ates && k.bekleme <= 0 && k.mermi >= 1) {
      k.mermi -= 1; o.mermiUyari = false;
      k.bekleme = 0.38; k.atSn = 0.25;
      o.mermiler.push({ x: k.x + k.yon * 50, y: k.y - 95, vx: k.yon * 760, yol: 0, tur: D.secim === "iyi" ? "ag" : "elektrik", tohum: Math.random() * 99 });
      cal(D.secim === "iyi" ? "e_ag" : "e_elektrik", 0.5);
    }

    // --- papağan ---
    var px = k.x - k.yon * 70, py = k.y - 190 + Math.sin(o.t * 3) * 12;
    o.p.x += (px - o.p.x) * Math.min(1, dt * 4); o.p.y += (py - o.p.y) * Math.min(1, dt * 4);

    // --- simit / eşya ---
    for (i = o.simitler.length - 1; i >= 0; i--) {
      m = o.simitler[i];
      if (Math.abs(m.x - k.x) < 55 && m.y < k.y + 10 && m.y > k.y - 150) { o.simitler.splice(i, 1); o.simit++; cal("e_simit", 0.5); parca(o, m.x, m.y, "#f2c14e", 5); }
    }
    for (i = o.esyalar.length - 1; i >= 0; i--) {
      m = o.esyalar[i]; m.vy += 1200 * dt; m.y += m.vy * dt; if (m.y > ZEMIN - 30) { m.y = ZEMIN - 30; m.vy = 0; }
      if (Math.abs(m.x - k.x) < 55 && m.y > k.y - 150 && m.y < k.y + 10) { o.esyalar.splice(i, 1); k.can = Math.min(3, k.can + 1); cal("e_simit", 0.6); }
    }

    // --- kostüm gücü: zamanı durdur (Londra kostümü). Kötüler, baş kötü ve meteorlar donar; kahraman hareket eder ---
    if (o.durBekle > 0) o.durBekle -= dt;
    if (zamanYeni && sehir().guc === "zaman" && !(o.durBekle > 0) && !o.bitti) { o.durSn = 3.5; o.durBekle = sehir().gucBekle; mesajVer("Zaman durdu!", 1.5); cal("e_simit", 0.8); }
    if (zamanYeni && sehir().guc === "ninja" && !(o.durBekle > 0) && !o.bitti) { // Tokyo kostümü: sis bombası → sisin içinden her yöne ninja yıldızları
      o.durBekle = sehir().gucBekle; k.dokunulmaz = Math.max(k.dokunulmaz, 1.6); o.duman = { sn: 1.25 }; o.ninjaSay = 0;
      var ni;
      for (ni = 0; ni < 12; ni++) o.yildizlar.push({ x: k.x, y: k.y - 70, hx: k.x + Math.cos(ni * Math.PI / 6) * 640, hy: k.y - 70 + Math.sin(ni * Math.PI / 6) * 420, t: 0, sure: 0.5, bekle: 0.32 + ni * 0.01 });
      o.kotuler.forEach(function (q) { if (!q.yakalandi && Math.abs(q.x - k.x) < 720) o.yildizlar.push({ x: k.x, y: k.y - 70, hx: q.x, hy: q.y - 40, t: 0, sure: 0.4, bekle: 0.36, hedef: q }); });
      var kq = o.kral; if (kq && o.kralGeldi && !kq.yenildi && Math.abs(kq.x - k.x) < 800) o.yildizlar.push({ x: k.x, y: k.y - 70, hx: kq.x, hy: kq.y - 120, t: 0, sure: 0.4, bekle: 0.4, kral: true });
      mesajVer("Sis bombası!", 1.2); cal("e_pop", 0.9);
    }
    if (zamanYeni && sehir().guc === "renk" && !(o.durBekle > 0) && !o.bitti) { // Paris kostümü: iki yana yayılan boya dalgası
      o.durBekle = sehir().gucBekle; k.dokunulmaz = Math.max(k.dokunulmaz, 1.2); o.boyaDalga = { x: k.x, sn: 0, kral: false }; o.ninjaSay = 0; o.renk = Math.min(1, (o.renk || 0) + 0.15);
      mesajVer("Renk dalgası!", 1.2); cal("e_pop", 0.9);
    }
    if (o.boyaDalga) {
      var bd = o.boyaDalga, bu; bd.sn += dt; bu = bd.sn * 950;
      o.kotuler.forEach(function (q) { if (!q.yakalandi && Math.abs(q.x - bd.x) < Math.min(bu, 760)) { kotuYakala(o, q); o.ninjaSay++; mesajVer("Renk dalgası! " + o.ninjaSay + " kötü boyandı!", 1.6); } });
      var kb = o.kral; if (!bd.kral && kb && o.kralGeldi && !kb.yenildi && Math.abs(kb.x - bd.x) < Math.min(bu, 800)) { bd.kral = true; if (kb.can > 2) { kb.can -= 2; kb.vurSn = 0.4; cal("e_pop", 0.8); parca(o, kb.x, kb.y - 120, "#ffd23a", 10); } }
      if (bd.sn > 0.85) o.boyaDalga = null;
    }
    if (sehir().arkaGri) o.renk = Math.max(o.renk || 0, Math.min(1, k.x / (UZUNLUK - 1100)) * 0.85, o.kral && o.kral.yenildi ? 1 : 0); // şehir ilerledikçe renklenir
    if (o.leke > 0) o.leke -= dt;
    if (o.duman) { o.duman.sn -= dt; if (o.duman.sn <= 0) o.duman = null; }
    for (i = o.yildizlar.length - 1; i >= 0; i--) { // ninja yıldızları: hedefe varınca kötüyü yakalar
      m = o.yildizlar[i]; if (m.bekle > 0) { m.bekle -= dt; if (m.bekle <= 0) cal("e_ag", 0.25); continue; }
      m.t += dt; if (m.t < m.sure) continue;
      if (m.hedef && !m.hedef.yakalandi) { kotuYakala(o, m.hedef); o.ninjaSay++; mesajVer("Ninja yıldızları! " + o.ninjaSay + " kötü yakalandı!", 1.6); }
      if (m.kral && o.kral && !o.kral.yenildi && o.kral.can > 2) { o.kral.can -= 2; o.kral.vurSn = 0.4; cal("e_pop", 0.8); parca(o, o.kral.x, o.kral.y - 120, "#ffd23a", 10); }
      o.yildizlar.splice(i, 1);
    }
    zamanYeni = false;
    var dtGercek = dt; if (o.durSn > 0) { o.durSn -= dt; dt = 0; }
    // --- kötüler ---
    for (i = o.kotuler.length - 1; i >= 0; i--) {
      e = o.kotuler[i];
      if (e.yakalandi) { e.sn -= dt; e.vy += 1500 * dt; e.y += e.vy * dt; if (e.sn <= 0) o.kotuler.splice(i, 1); continue; }
      if (e.tur === "yuv") { e.x -= e.hiz * dt; e.aci -= e.hiz * dt / 34; if (e.x < o.kam - 200) { o.kotuler.splice(i, 1); continue; } }
      else { e.x += e.yon * e.hiz * dt; if (e.x < e.x0) e.yon = 1; if (e.x > e.x1) e.yon = -1; }
      if (e.tur === "uc") { // arada bir kahramana dalış yapar, sonra yerine döner
        if (o.durSn > 0) {} else if (e.dal > 0) { e.dal -= dt; e.y = e.y0 + Math.sin(Math.PI * (1 - e.dal / 1.3)) * (e.dalY - e.y0); }
        else {
          e.y = e.y0 + Math.sin(o.t * 2 + e.faz) * 60; e.dalSn -= dt;
          if (e.dalSn <= 0 && Math.abs(e.x - k.x) < 380 && !o.bitti) { e.dalSn = o.dalAra + Math.random() * 3; e.dal = 1.3; e.dalY = Math.min(ZEMIN - 20, k.y - 20); cal("e_meteor", 0.2); }
        }
      }
      if (kutuCakis(k.x, k.y, 44, 116, e.x, e.y, e.g, e.y_)) incit(o);
    }

    // --- aniden yuvarlanarak gelen düşman ---
    o.yuvarSn -= dt;
    if (o.yuvarSn <= 0 && !o.bitti && k.x > 700 && k.x < UZUNLUK - 1300) {
      o.yuvarSn = o.yuvarAra + Math.random() * 4;
      o.kotuler.push({ tur: "yuv", x: o.kam + G + 120, y: ZEMIN, hiz: 360, aci: 0, g: 64, y_: 64 });
      mesajVer("Dikkat! Yuvarlanan geliyor, zıpla!", 1.6); cal("e_meteor", 0.3);
    }

    // --- Meteor Kralı ---
    var kr = o.kral;
    if (!o.kralGeldi && k.x > UZUNLUK - 1050) { o.kralGeldi = true; cal(sehir().pKral, 1); mesajVer("Dikkat! " + sehir().kralAd + " geldi!", 3); }
    if (kr && !kr.yenildi && o.kralGeldi) {
      kr.x += kr.yon * 90 * dt; if (kr.x < UZUNLUK - 650) kr.yon = 1; if (kr.x > UZUNLUK - 150) kr.yon = -1;
      kr.y = ZEMIN - Math.abs(Math.sin(o.t * 2.2)) * 40;
      if (kr.vurSn > 0) kr.vurSn -= dt;
      kr.atSn -= dt;
      if (kr.atSn <= 0) { kr.atSn = o.kralAra; var uz = k.x - kr.x; o.meteorlar.push({ x: kr.x, y: kr.y - 200, vx: uz / 1.2, vy: -520, yer: 1500, kral: true }); cal("e_meteor", 0.35); }
      // Sis Kontu'nun kendine has saldırısı: sise karışıp görünmez olur ve art arda meteor yağdırır
      if (D.sehir === "londra") {
        if (kr.sis > 0) {
          kr.sis -= dt; kr.yaylim -= dt;
          if (kr.yaylim <= 0) { kr.yaylim = 0.45; o.meteorlar.push({ x: k.x - 260 + Math.random() * 520, y: -60, vx: 0, vy: 420, yer: 0 }); cal("e_meteor", 0.25); }
        } else { kr.ozelSn -= dt; if (kr.ozelSn <= 0) { kr.ozelSn = 9 + Math.random() * 3; kr.sis = 3.2; kr.yaylim = 0.6; mesajVer("Sis saldırısı! Sis Kontu görünmez oldu!", 2.2); } }
      }
      if (D.sehir === "paris") { // Gölge Ressam: üç boya topunu birden fırlatır, ekranı gri lekeler kaplar
        kr.ozelSn -= dt;
        if (kr.ozelSn <= 0) {
          kr.ozelSn = 6 + Math.random() * 2; o.leke = 2.6;
          for (var pj = -1; pj <= 1; pj++) o.meteorlar.push({ x: kr.x, y: kr.y - 200, vx: (k.x - kr.x) / 1.2 + pj * 170, vy: -560 - Math.abs(pj) * 40, yer: 1500, kral: true });
          mesajVer("Boya yağmuru! Ekran lekelendi!", 1.8); cal("e_meteor", 0.4);
        }
      }
      if (D.sehir === "tokyo") { // Neon Ejder: yerden şimşek dalgası yollar (zıplanır), arada ışınlanır
        kr.ozelSn -= dt;
        if (kr.ozelSn <= 0) {
          kr.ozelSn = 3.2 + Math.random() * 1.5; kr.dalgaSay = (kr.dalgaSay || 0) + 1;
          if (kr.dalgaSay % 3 === 0) { kr.x = Math.max(UZUNLUK - 650, Math.min(UZUNLUK - 150, 2 * (UZUNLUK - 400) - kr.x + (k.x > kr.x ? 120 : -120))); kr.isin = 0.5; mesajVer("Neon Ejder ışınlandı!", 1.4); cal("e_elektrik", 0.5); }
          else { o.dalgalar.push({ x: kr.x, yon: k.x < kr.x ? -1 : 1, yol: 0 }); mesajVer("Yer şimşeği! Zıpla!", 1.2); cal("e_elektrik", 0.5); }
        }
        if (kr.isin > 0) kr.isin -= dt;
      }
      if (kutuCakis(k.x, k.y, 44, 116, kr.x, kr.y, kr.g - 40, kr.y_ - 40)) incit(o);
    }

    for (i = o.dalgalar.length - 1; i >= 0; i--) { // yer şimşekleri
      m = o.dalgalar[i]; m.x += m.yon * 430 * dt; m.yol += 430 * dt;
      if (Math.abs(m.x - k.x) < 34 && k.y > ZEMIN - 46) { incit(o); o.dalgalar.splice(i, 1); continue; }
      if (m.yol > 1300) o.dalgalar.splice(i, 1);
    }
    // --- gökten meteorlar ---
    o.meteorSn -= dt;
    if (o.meteorSn <= 0 && !o.bitti && k.x < UZUNLUK - 1300) {
      o.meteorSn = o.meteorAra + Math.random() * 3;
      o.meteorlar.push({ x: k.x + 250 + Math.random() * 500, y: -60, vx: -70, vy: 330, yer: 0 }); cal("e_meteor", 0.3);
    }
    for (i = o.meteorlar.length - 1; i >= 0; i--) {
      m = o.meteorlar[i]; m.vy += m.yer * dt; m.x += m.vx * dt; m.y += m.vy * dt;
      if (kutuCakis(k.x, k.y, 44, 116, m.x, m.y + 30, 50, 60)) { incit(o); parca(o, m.x, m.y, "#ff8a2a", 8); o.meteorlar.splice(i, 1); continue; }
      if (m.y > ZEMIN - 20) { parca(o, m.x, ZEMIN - 10, "#ff8a2a", 8); o.meteorlar.splice(i, 1); }
    }

    dt = dtGercek;
    // --- mermiler ---
    for (i = o.mermiler.length - 1; i >= 0; i--) {
      m = o.mermiler[i]; m.x += m.vx * dt; m.yol += Math.abs(m.vx) * dt;
      var vurdu = false, j;
      for (j = 0; j < o.kotuler.length && !vurdu; j++) {
        e = o.kotuler[j];
        if (!e.yakalandi && Math.abs(m.x - e.x) < e.g / 2 + 18 && m.y > e.y - e.y_ - 25 && m.y < e.y + 25) { kotuYakala(o, e); vurdu = true; }
      }
      for (j = o.sandiklar.length - 1; j >= 0 && !vurdu; j--) {
        e = o.sandiklar[j];
        if (Math.abs(m.x - e.x) < 50 && m.y > e.y - 110) { o.sandiklar.splice(j, 1); o.esyalar.push({ x: e.x, y: e.y - 60, vy: -350 }); parca(o, e.x, e.y - 40, "#a8743a", 10); cal("e_pop"); vurdu = true; }
      }
      for (j = o.meteorlar.length - 1; j >= 0 && !vurdu; j--) {
        e = o.meteorlar[j];
        if (Math.abs(m.x - e.x) < 45 && Math.abs(m.y - e.y) < 55) { o.meteorlar.splice(j, 1); parca(o, e.x, e.y, "#ff8a2a", 10); cal("e_pop", 0.5); vurdu = true; }
      }
      if (!vurdu && kr && !kr.yenildi && o.kralGeldi && Math.abs(m.x - kr.x) < kr.g / 2 && m.y > kr.y - kr.y_) {
        vurdu = true; kr.can--; kr.vurSn = 0.3; cal("e_pop"); parca(o, m.x, m.y, D.secim === "iyi" ? "#ffffff" : "#ff3030", 8);
        if (kr.can <= 0) {
          kr.yenildi = true; if (!SEHIRLER[TEST]) kostumAc(sehir().on[D.secim].replace("_", "")); o.bitti = "zafer"; // kostüm, şehri bitirince açılır
           o.bitisSayac = 3.4; o.meteorlar.length = 0;
          cal("e_zafer", 0.8); setTimeout(function () { cal(sehir().zafer || (D.secim === "iyi" ? "a_kazandin_c" : "a_kazandin_u"), 1); }, 900); mesajVer("Tebrikler! " + ad() + ", " + sehir().eki + " kurtardı!" + (sehir().papaganKayip ? " Papağan da özgür!" : ""), 4);
          if (sehir().papaganKayip) { o.p.x = kr.x; o.p.y = kr.y - 220; } // papağan ejderin yanından kahramana uçar
          parca(o, kr.x, kr.y - 100, "#ffd23a", 40);
        }
      }
      for (j = 0; j < o.duvarlar.length && !vurdu; j++) if (o.duvarlar[j].y_ > 100 && Math.abs(m.x - o.duvarlar[j].x) < o.duvarlar[j].g / 2) { vurdu = true; parca(o, m.x, m.y, "#ff5ad0", 5); }
      if (vurdu || m.yol > 640) o.mermiler.splice(i, 1);
    }

    // --- parçacıklar ---
    for (i = o.parcalar.length - 1; i >= 0; i--) {
      m = o.parcalar[i]; m.sn -= dt; m.vy += 900 * dt; m.x += m.vx * dt; m.y += m.vy * dt; if (m.sn <= 0) o.parcalar.splice(i, 1);
    }

    // --- görev sesleri ---
    if (o.simit >= GOREV_SIMIT && !o.gorevSes.s) { o.gorevSes.s = 1; cal("p_gorev", 1); mesajVer("Harika! " + sehir().toplaAd + " görevi tamamlandı!", 3); }
    if (o.yakalanan >= GOREV_KOTU && !o.gorevSes.k) { o.gorevSes.k = 1; cal("p_gorev", 1); mesajVer("Harika! Kötüleri yakalama görevi tamamlandı!", 3); }

    o.kam += (Math.max(0, Math.min(UZUNLUK - G, k.x - 420)) - o.kam) * Math.min(1, dt * 6);
  }

  // ---------- çizim ----------
  function kare(sn) { return Math.floor(D.oyun.t * 8 + (sn || 0)); }        // stop motion: saniyede 8 poz
  function titre(tohum) { var n = Math.sin((kare() + tohum) * 12.9898) * 43758.5453; return ((n - Math.floor(n)) - 0.5) * 2.4; }
  function ciz(im, x, y, olcek, cevir, alfa) { // x: merkez, y: alt kenar
    if (!im || !im.complete || !im.naturalWidth) return;
    var g = im.naturalWidth * olcek, yk = im.naturalHeight * olcek;
    c.save(); c.translate(Math.round(x), Math.round(y)); if (cevir) c.scale(-1, 1); if (alfa != null) c.globalAlpha = alfa;
    c.drawImage(im, -g / 2, -yk, g, yk); c.restore();
  }
  function yazi(m, x, y, boy, renk, hiza) {
    c.font = "bold " + boy + "px 'Arial Rounded MT Bold','Chalkboard SE','Trebuchet MS',sans-serif"; c.textAlign = hiza || "left";
    c.lineWidth = boy / 5; c.strokeStyle = "rgba(20,25,60,.85)"; c.lineJoin = "round"; c.strokeText(m, x, y); c.fillStyle = renk || "#fff"; c.fillText(m, x, y);
  }

  function cizOyun() {
    var o = D.oyun; if (!o) return;
    var k = o.k, kam = Math.round(o.kam), i, e, m, on = sehir().on[D.secim];
    // arka plan: aynalı döşeme (dikiş görünmesin)
    var a = R[sehir().arka];
    if (a.complete && a.naturalWidth) {
      var ag = a.naturalWidth * (Y / a.naturalHeight), ilk = Math.floor(kam / ag);
      for (i = ilk; i <= ilk + Math.ceil(G / ag) + 1; i++) {
        c.save(); c.translate(i * ag - kam, 0);
        if (i % 2) { c.translate(ag, 0); c.scale(-1, 1); }
        var gri = sehir().arkaGri && R[sehir().arkaGri];
        if (gri && gri.complete && gri.naturalWidth) { c.drawImage(gri, 0, 0, ag + 1, Y); c.globalAlpha = Math.round((o.renk || 0) * 10) / 10; }
        c.drawImage(a, 0, 0, ag + 1, Y); c.globalAlpha = 1; c.restore();
      }
    } else { c.fillStyle = "#f3c9c0"; c.fillRect(0, 0, G, Y); }
    c.save(); c.translate(-kam, 0);

    for (i = 0; i < o.platformlar.length; i++) { // platform arka plandan ayrılsın: canlı renkli hamur + altında yumuşak gölge
      m = o.platformlar[i]; var pim = R[sehir().platform], ph = pim.width ? m.g * pim.height / pim.width : m.g * 56 / 174;
      c.save(); c.shadowColor = "rgba(20,15,40,.5)"; c.shadowBlur = 14; c.shadowOffsetY = 9; c.drawImage(pim, m.x, m.y - 8, m.g, ph); c.restore();
    }
    for (i = 0; i < o.sandiklar.length; i++) ciz(R.sandik, o.sandiklar[i].x, o.sandiklar[i].y, 0.9);
    for (i = 0; i < o.duvarlar.length; i++) { // hamur bariyer; yüksek olan iki kat
      var dw = o.duvarlar[i], dh = dw.g * R.bariyer.height / R.bariyer.width; if (dw.x < kam - 200 || dw.x > kam + G + 200) continue;
      if (dw.y_ > 100) c.drawImage(R.bariyer, dw.x - dw.g / 2, ZEMIN - 150, dw.g, dh);
      c.drawImage(R.bariyer, dw.x - dw.g / 2, ZEMIN - dh, dw.g, dh);
    }
    for (i = 0; i < o.simitler.length; i++) { m = o.simitler[i]; ciz(R[sehir().topla], m.x, m.y + 28 + (kare(i) % 2 ? 3 : -3), sehir().toplaOlcek); }
    for (i = 0; i < o.esyalar.length; i++) ciz(R.kalp, o.esyalar[i].x, o.esyalar[i].y + 30, 0.7);

    for (i = 0; i < o.kotuler.length; i++) {
      e = o.kotuler[i]; var kr2 = kare(i) % 2;
      if (e.tur === "yuv") { c.save(); c.globalAlpha = e.yakalandi ? Math.max(0, e.sn / 0.9) : 1; c.translate(e.x, e.y - 34); c.rotate(Math.round(e.aci * 3) / 3); var yim = R[sehir().kotu.yuv], yg = 78, yy = yim.width ? yg * yim.height / yim.width : yg; c.drawImage(yim, -yg / 2, -yy / 2, yg, yy); c.restore(); continue; }
      var kt = sehir().kotu, im = R[(e.tur === "yur" ? kt.yur : kt.uc)[kr2 ? 0 : 1]];
      var olcek = e.tur === "yur" ? kt.yurOlcek : kt.ucOlcek;
      ciz(im, e.x + titre(i), e.y, olcek, e.yon < 0, e.yakalandi ? Math.max(0, e.sn / 0.9) : 1);
      if (e.yakalandi === "ag") { c.fillStyle = "rgba(255,255,255,.85)"; c.beginPath(); c.ellipse(e.x, e.y - 45, 50, 52, 0, 0, 7); c.fill(); c.strokeStyle = "#cfd6e4"; c.lineWidth = 3; for (var q = 0; q < 4; q++) { c.beginPath(); c.ellipse(e.x, e.y - 45, 50 - q * 11, 52, 0, 0, 7); c.stroke(); } }
      if (e.yakalandi === "elektrik") simsek(e.x - 50, e.y - 90, e.x + 50, e.y - 10, i);
    }

    var kr = o.kral;
    if (kr && o.kralGeldi) {
      ciz(R[sehir().kral], kr.x + titre(7), kr.y, sehir().kralOlcek, kr.yon > 0, kr.yenildi ? Math.max(0, o.bitisSayac / 3.4) : kr.sis > 0 ? 0.22 : kr.isin > 0 && kare() % 2 ? 0.25 : 1);
      if (kr.vurSn > 0) { c.fillStyle = "rgba(255,255,255,.5)"; c.beginPath(); c.arc(kr.x, kr.y - 120, 120, 0, 7); c.fill(); }
      if (!kr.yenildi) for (i = 0; i < kr.canMax; i++) { c.fillStyle = i < kr.can ? "#b04ad8" : "rgba(40,30,60,.5)"; c.beginPath(); c.arc(kr.x - (kr.canMax - 1) * 12 + i * 24, kr.y - 285, 9, 0, 7); c.fill(); }
    }
    for (i = 0; i < o.meteorlar.length; i++) {
      m = o.meteorlar[i];
      if (!m.kral) { c.fillStyle = "rgba(60,30,20,.25)"; c.beginPath(); c.ellipse(m.x + (ZEMIN - m.y) * m.vx / m.vy, ZEMIN - 4, 34, 9, 0, 0, 7); c.fill(); }
      ciz(R[sehir().mermi || "meteor"], m.x, m.y + 30, 0.75, kare(i) % 2);
    }

    for (i = 0; i < o.dalgalar.length; i++) { // yer şimşeği: zikzak
      m = o.dalgalar[i]; c.save(); c.translate(m.x, ZEMIN); c.scale(kare(i) % 2 ? 1 : -1, 1); c.drawImage(R.simsek, -32, -92, 64, 92); c.restore(); // hamur şimşek, poz poz ters döner
    }
    // kahraman
    c.fillStyle = 'rgba(40,30,30,.22)'; c.beginPath(); c.ellipse(k.x, ZEMIN + 2, 38 - Math.min(20, (ZEMIN - k.y) / 20), 8, 0, 0, 7); c.fill();
    var poz = k.atSn > 0 ? "at" : !k.yerde ? "uc" : Math.abs(k.vx) > 25 ? (R[on + "kos4"] ? "kos" + (1 + Math.floor(k.adim / 46) % 4) : Math.floor(k.adim / 62) % 2 ? "kos1" : "kos2") : "dur";
    if (!(k.dokunulmaz > 0 && kare() % 2 && Math.floor(o.t * 16) % 2) && !(o.duman && o.duman.sn > 0.4))
      ciz(R[on + poz], k.x + (poz === "dur" ? titre(1) * 0.6 : 0), k.y + (poz === "uc" ? -20 : 0), 0.55, k.yon < 0);
    if (o.duman) { // sis bombası: hamur topaklarından büyüyen duman (poz poz)
      var dq = Math.floor((1.25 - o.duman.sn) * 12) / 12, dr = Math.min(1, dq / 0.3), da = o.duman.sn < 0.4 ? o.duman.sn / 0.4 : 1, dj;
      c.save(); c.globalAlpha = da;
      for (dj = 0; dj < 7; dj++) { // hamur sis topakları: ortadan dışa büyür, her pozda biraz kıpırdar
        var sim = R["sis" + (dj % 3 + 1)], sg = (150 + (dj % 3) * 40) * (0.45 + 0.75 * dr), sy = sg * sim.height / sim.width;
        var dax = Math.cos(dj * 2.4) * 150 * dr * (dj ? 1 : 0), day = Math.sin(dj * 1.7) * 70 * dr - 80 + (kare(dj) % 2 ? 4 : -4);
        c.save(); c.translate(k.x + dax, k.y + day); c.scale((dj + kare()) % 2 ? 1 : -1, 1); c.drawImage(sim, -sg / 2, -sy / 2, sg, sy); c.restore();
      }
      c.restore();
    }
    if (o.boyaDalga) { // renk dalgası: hamur boya dalgası iki yana poz poz ilerler
      var bq = Math.floor(o.boyaDalga.sn * 12) / 12, bx = bq * 950, ba = o.boyaDalga.sn > 0.65 ? Math.max(0, (0.85 - o.boyaDalga.sn) / 0.2) : 1, by = 150 + 70 * Math.min(1, bq / 0.3), bg2 = by * R.dalga.width / R.dalga.height;
      c.save(); c.globalAlpha = ba;
      c.save(); c.translate(o.boyaDalga.x + bx, ZEMIN + 6); c.scale(-1, 1); c.drawImage(R.dalga, -bg2 / 2, -by, bg2, by); c.restore();
      c.drawImage(R.dalga, o.boyaDalga.x - bx - bg2 / 2, ZEMIN + 6 - by, bg2, by);
      c.restore();
    }
    for (i = 0; i < o.yildizlar.length; i++) { // ninja yıldızı: dört köşeli, dönerek uçar
      m = o.yildizlar[i]; if (m.bekle > 0) continue;
      var yt = Math.min(1, m.t / m.sure), yx = m.x + (m.hx - m.x) * yt, yy2 = m.y + (m.hy - m.y) * yt, ya = Math.floor(o.t * 12) * 0.9 + i, yk;
      c.save(); c.translate(yx, yy2); c.rotate(ya); c.drawImage(R.shuriken, -24, -24, 48, 48); c.restore(); // hamur ninja yıldızı
    }
    // papağan
    if (!(sehir().papaganKayip && !(o.kral && o.kral.yenildi))) ciz(R[(D.secim === "iyi" ? "pb" : "ps") + (kare() % 2 + 1)], o.p.x, o.p.y, 0.62, k.yon < 0);

    for (i = 0; i < o.mermiler.length; i++) {
      m = o.mermiler[i]; var yon = m.vx > 0 ? 1 : -1;
      if (m.tur === "ag") {
        c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = 4; c.beginPath(); c.moveTo(m.x - yon * Math.min(m.yol, 150), m.y); c.lineTo(m.x, m.y); c.stroke();
        c.fillStyle = "#fff"; c.strokeStyle = "#cfd6e4"; c.lineWidth = 3;
        for (var w = 0; w < 6; w++) { c.beginPath(); c.moveTo(m.x, m.y); c.lineTo(m.x + Math.cos(w * 1.047 + kare()) * 24, m.y + Math.sin(w * 1.047 + kare()) * 24); c.stroke(); }
        c.beginPath(); c.arc(m.x, m.y, 12, 0, 7); c.fill();
      } else simsek(m.x - yon * 130, m.y, m.x, m.y, m.tohum);
    }
    for (i = 0; i < o.parcalar.length; i++) { m = o.parcalar[i]; c.globalAlpha = Math.max(0, m.sn / 0.6); c.fillStyle = m.renk; c.beginPath(); c.arc(m.x, m.y, m.r, 0, 7); c.fill(); }
    c.globalAlpha = 1;
    if (k.x > UZUNLUK - 1400 && !o.kralGeldi) yazi(sehir().kralAd + " ➜", UZUNLUK - 1300, 300, 40, "#ffd23a");
    c.restore();

    // --- gösterge ---
    for (i = 0; i < 3; i++) ciz(R.kalp, 46 + i * 62, 78, 0.68, false, i < k.can ? 1 : 0.22);
    c.fillStyle = "rgba(20,25,60,.55)"; yuvarlak(22, 92, 190, 22, 11); c.fill();
    c.fillStyle = D.secim === "iyi" ? "#ff5a4a" : "#ff3030"; yuvarlak(25, 95, Math.max(0, 184 * k.yakit), 16, 8); c.fill();
    yazi("uçuş gücü", 222, 110, 18, "#fff");
    yazi("atış " + "●".repeat(Math.floor(k.mermi == null ? 5 : k.mermi)) + "○".repeat(5 - Math.floor(k.mermi == null ? 5 : k.mermi)), 330, 110, 18, "#ffd23a");
    if (sehir().guc) { // kostüm gücü göstergesi: dolunca düğme (Z tuşu) ile kullanılır
      var ninja = sehir().guc !== "zaman", renkG = sehir().guc === "renk", zh = o.durSn > 0 ? o.durSn / 3.5 : 1 - Math.max(0, o.durBekle || 0) / sehir().gucBekle;
      c.fillStyle = "rgba(20,25,60,.55)"; yuvarlak(22, 122, 190, 22, 11); c.fill();
      c.fillStyle = o.durSn > 0 ? "#7fe9ff" : zh >= 1 ? (ninja ? "#ffd23a" : "#39d0e8") : "#5b7f99"; yuvarlak(25, 125, Math.max(0, 184 * zh), 16, 8); c.fill();
      yazi(o.durSn > 0 ? "zaman durdu!" : zh >= 1 ? (renkG ? "🎨 renk dalgası (Z)" : ninja ? "⚡ ninja saldırısı (Z)" : "⏱ zamanı durdur (Z)") : (renkG ? "renk gücü doluyor" : ninja ? "ninja gücü doluyor" : "zaman gücü doluyor"), 222, 140, 18, "#fff");
      if (o.durSn > 0) { c.fillStyle = "rgba(120,220,255,.16)"; c.fillRect(0, 0, G, Y); }
    }
    yazi(ad(), 232, 62, 34, D.secim === "iyi" ? "#ff6a5a" : "#d8d8e0");
    var gx = G - 330;
    c.fillStyle = "rgba(20,25,60,.55)"; yuvarlak(gx - 16, 14, 330, 132, 22); c.fill();
    yazi("GÖREVLER", gx, 44, 22, "#ffd23a");
    gorevSatir(gx, 74, sehir().toplaAd + " topla", o.simit, GOREV_SIMIT);
    gorevSatir(gx, 102, "Kötü yakala", o.yakalanan, GOREV_KOTU);
    yazi((kr.yenildi ? "✔ " : "• ") + sehir().kralEki + " yen", gx, 130, 22, kr.yenildi ? "#8dff9a" : "#fff");
    if (o.kral && o.kral.sis > 0 && !o.kral.yenildi) { // sis saldırısı: ekran sisle kaplanır
      var sa = Math.min(1, o.kral.sis / 0.5, (3.2 - o.kral.sis) / 0.5) * 0.5;
      c.save(); c.globalAlpha = Math.min(1, sa * 1.7);
      for (var sb = 0; sb < 12; sb++) { // hamur sis bulutları ekrandan poz poz geçer
        var sbm = R["sis" + (sb % 3 + 1)], sbg = 430 + (sb % 4) * 70, sby = sbg * sbm.height / sbm.width;
        c.drawImage(sbm, (sb * 173 + kare() * 16) % (G + 600) - 400, 40 + (sb * 97) % 520, sbg, sby);
      }
      c.restore();
    }
    if (o.leke > 0) { // Gölge Ressam'ın boya lekeleri: hamur lekeler ekranda poz poz titrer
      c.save(); c.globalAlpha = Math.min(1, o.leke / 0.4) * 0.92;
      for (var lk = 0; lk < 4; lk++) { var lg = 150 + (lk % 3) * 50, ly2 = lg * R.p_top.height / R.p_top.width; c.drawImage(R.p_top, 140 + lk * 290 + (kare(lk) % 2 ? 6 : -6), 150 + (lk * 137) % 260, lg, ly2); }
      c.restore();
    }
    if (o.mesajSn > 0) yazi(o.mesaj, G / 2, 200, 34, "#fff", "center");
  }
  function gorevSatir(x, y, ad, n, hedef) { var t = n >= hedef; yazi((t ? "✔ " : "• ") + ad + "  " + Math.min(n, hedef) + "/" + hedef, x, y, 22, t ? "#8dff9a" : "#fff"); }
  function yuvarlak(x, y, g, yk, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + g, y, x + g, y + yk, r); c.arcTo(x + g, y + yk, x, y + yk, r); c.arcTo(x, y + yk, x, y, r); c.arcTo(x, y, x + g, y, r); c.closePath(); }
  function simsek(x0, y0, x1, y1, tohum) {
    var n = 6, i, kr2 = kare();
    for (var gecis = 0; gecis < 2; gecis++) {
      c.strokeStyle = gecis ? "#fff3f0" : "#ff2a2a"; c.lineWidth = gecis ? 3 : 9; c.lineJoin = "round"; c.beginPath(); c.moveTo(x0, y0);
      for (i = 1; i < n; i++) { var s = Math.sin((i + tohum + kr2) * 78.233) * 43758.5; s = (s - Math.floor(s) - 0.5) * 34; c.lineTo(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n + s); }
      c.lineTo(x1, y1); c.stroke();
    }
  }

  // ---------- harita ----------
  function haritaAc() {
    var o = D.oyun, yildiz = 1 + (o.simit >= GOREV_SIMIT ? 1 : 0) + (o.yakalanan >= GOREV_KOTU ? 1 : 0);
    $("harita").style.backgroundImage = "linear-gradient(rgba(16,26,58,.55),rgba(16,26,58,.55)),url(varlik/dunya.jpg)";
    for (var si = 0; si <= SIRA.indexOf(D.sehir); si++) D.kurtarilan[SIRA[si]] = true; // önceki şehirler de kurtulmuş sayılır
    $("sonuc").textContent = "Görevler: " + "★".repeat(yildiz) + "☆".repeat(3 - yildiz) + "   " + sehir().toplaAd + " " + o.simit + "   Yakalanan kötü " + o.yakalanan;
    var sr = siradaki();
    $("kartlar").innerHTML = [["istanbul", "İstanbul"], ["londra", "Londra"], ["tokyo", "Tokyo"], ["paris", "Paris"], ["", "Los Angeles"]].map(function (q) {
      var t = D.kurtarilan[q[0]], sira = q[0] && q[0] === sr;
      return '<div class="kart' + (t ? " tamam" : "") + '">' + q[1] + "<small>" + (t ? "✔ Kurtarıldı" : sira ? "✈ Sıradaki görev" : "🔒 Yakında") + "</small></div>";
    }).join("");
    $("zaferBaslik").textContent = ad() + ", " + sehir().eki + " kurtardı!";
    $("londra").style.display = ""; $("kal").style.display = sr === "londra" || sr === "tokyo" ? "" : "none";
    $("londra").textContent = sr ? "✈ " + yonAd(sr) + " hazırım!" : "🏠 İstanbul'a dönüyorum!";
    $("kal").textContent = sr === "tokyo" ? "🏠 Eve dönmek istiyorum" : "İstanbul'da kalacağım";
    $("karar").textContent = sr ? SEHIRLER[sr].eki + " kurtarmaya hazır mısın?" : "Dört şehir kurtuldu! Ama İstanbul'dan kötü haber var…";
    $("tekrar").style.display = "";
    D.sonYildiz = yildiz; ekranAc("harita");
  }

  // 2. oyundan dönüş: "Londra'ya hazırım" denmişse karar ekranı Londra düğmesiyle açılır (film için bir dokunuş gerekir)
  (function () {
    var q = new URLSearchParams(location.search);
    if (q.get("londra") !== "1") return;
    D.secim = q.get("seri") === "kotu" ? "kotu" : "iyi";
    var don = SIRA.indexOf(q.get("don")) > 0 ? q.get("don") : "londra", di; // don: sıradaki şehir (varsayılan Londra); öncekiler kurtulmuş sayılır
    for (di = 0; di < SIRA.indexOf(don); di++) D.kurtarilan[SIRA[di]] = true;
    D.sehir = SIRA[SIRA.indexOf(don) - 1];
    $("harita").style.backgroundImage = "linear-gradient(rgba(16,26,58,.55),rgba(16,26,58,.55)),url(varlik/dunya.jpg)";
    $("zaferBaslik").textContent = "Zorgo'dan kurtuldun!"; $("sonuc").textContent = ""; $("karar").textContent = SEHIRLER[don].ad + " seni bekliyor. Hazır mısın?";
    $("londra").textContent = "✈ " + yonAd(don) + " hazırım!";
    $("kartlar").innerHTML = SIRA.slice(0, SIRA.indexOf(don) + 1).map(function (sn2) { return '<div class="kart' + (sn2 === don ? "" : " tamam") + '">' + SEHIRLER[sn2].ad + "<small>" + (sn2 === don ? "✈ Sıradaki görev" : "✔ Kurtarıldı") + "</small></div>"; }).join("");
    $("kal").style.display = "none"; $("tekrar").style.display = "none"; $("diger").style.display = "none";
    ekranAc("harita");
  })();

  // ---------- döngü ----------
  var son = 0;
  function dongu(z) {
    var dt = Math.min(0.05, (z - son) / 1000 || 0); son = z;
    if (D.ekran === "oyun") { guncelle(dt); cizOyun(); }
    requestAnimationFrame(dongu);
  }
  requestAnimationFrame(dongu);

  // deneme kancası: arka plandaki sekmede kareler durduğu için elle ilerletilir
  window.__oyun = {
    D: D, T: T, tus: tus, sec: sec, baslat: function (s, sh) { D.secim = s; D.sehir = sh || "istanbul"; oyunBaslat(); },
    ilerlet: function (sn) { for (var t = 0; t < sn; t += 1 / 60) guncelle(1 / 60); cizOyun(); return D.oyun && { x: Math.round(D.oyun.k.x), can: D.oyun.k.can, simit: D.oyun.simit, yakalanan: D.oyun.yakalanan, bitti: D.oyun.bitti }; }
  };
})();
