/* Hamur Kahraman: Papağanı Kurtar (Ateş sürümü; ates_kosu_kur.py üretir, elle değiştirme). Üç şeritli çatı koşusu (dik, 720×1280), üç seviye.
   22 Kas 2026 (Erman): "dönüşü yolu düzgün şekilde yapalım; oynanabilirlik zorlukları artsın; 3 seviye olsun, gittikçe zorlaşan;
   şu an bitirmek çok kolay ve grafik zayıf". Bu dosya Ateş'in koşu oyunundan (hamur_kahraman_4) AYRI yazıldı; o oyun değişmedi.
   Yol artık gerçekten kıvrılır: yolun eğriliği (kappa) konuma bağlıdır, kamera kahramanın bulunduğu noktadaki yöne bakar,
   ilerideki yol eğrilik iki kez toplanarak yana kayar, arka plan dönüş açısı kadar kayar. Keskin köşede kaydırmak gerekir.
   Görseller ../hamur_kahraman_4/varlik'tan (oyun hamuru); yol kenarı fenerleri, neon tabelalar ve efektler kodla çizilir.
   oyun_kur2.py bu dosyayı oyun/kosu/oyun.js olarak kopyalar ve KOSU_HAZIR listesini doldurur. */
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
  var K = SERI === "iyi" ? "kt" : "st", KYOL = "varlik/"; // Tokyo'ya giden kahraman ninja kostümündedir

  var R = {};
  ["arka.jpg", "zemin.jpg", "bariyer", "kapi", "blok", "dron", "papagan_ag", "onigiri", "kalp", K + "_k1", K + "_k2", K + "_zip", K + "_kay"].forEach(function (a) {
    var im = new Image(); im.dene = 0; im.onerror = function () { var b = this; if (b.dene++ < 4) setTimeout(function () { b.src = b.src.split("?")[0] + "?d=" + b.dene; }, 600 * b.dene); };
    im.src = (a.indexOf(K + "_") === 0 ? KYOL : "varlik/") + (a.indexOf(".") > 0 ? a : a + ".png"); R[a.replace(".jpg", "")] = im;
  });
  var S = {};
  ["muzik", "e_pop", "e_simit", "e_ah", "e_zafer", "a_kosu1", "a_kosu2", "p_kosu3", "a_kosu4"].forEach(function (a) { var s = new Audio("ses/" + a + ".mp3"); s.preload = "auto"; S[a] = s; });
  S.muzik.loop = true; S.muzik.volume = 0.22;
  function cal(a, v) { try { var s = S[a].cloneNode(); s.volume = v == null ? 1 : v; var p = s.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
  function muzik(ac) { try { if (ac) { var p = S.muzik.play(); if (p && p.catch) p.catch(function () {}); } else S.muzik.pause(); } catch (e) {} }

  // ---------- derinlik ----------
  var UFUK = 470, TABAN = 1150, ZK = 430, SERIT = 205, YOL = 345, ZMAX = 3200, ADIM = 40, N = ZMAX / ADIM + 1;
  function oran(z) { return ZK / (ZK + z); }          // 1: kahramanın hizası, 0: ufuk
  function ey(z) { return UFUK + (TABAN - UFUK) * oran(z); }
  var KAYMA = new Float32Array(N);                      // ilerideki yolun yana kayması (dünya birimi), her karede yeniden hesaplanır
  function kayma(z) { if (z <= 0) return 0; var f = z / ADIM, i = Math.floor(f); if (i >= N - 1) return KAYMA[N - 1]; return KAYMA[i] + (KAYMA[i + 1] - KAYMA[i]) * (f - i); }
  function ex(yan, z) { return G / 2 + (yan + kayma(z)) * oran(z); }   // yan: yol ortasından uzaklık (dünya birimi)

  // ---------- seviyeler ----------
  // hiz: başlangıç ve son hız; sure: engelsiz koşuda dronlara yetişme süresi; ara: engel sıraları arası mesafe (baş, son);
  // kose: keskin köşeler arası süre; bosluk/tam/dron/cift: çatı boşluğu, tam sıra, gezen dron ve çift sıra olasılığı.
  var SEVIYE = [
    { ad: "1. Seviye", hiz: [1000, 1400], sure: 50, ara: [1150, 900], kose: [13, 17], bosluk: 0.10, tam: 0.10, dron: 0, cift: 0, bos: 0.40 },
    { ad: "2. Seviye", hiz: [1300, 1750], sure: 60, ara: [1000, 780], kose: [10, 13], bosluk: 0.20, tam: 0.22, dron: 0.14, cift: 0.15, bos: 0.22 },
    { ad: "3. Seviye", hiz: [1550, 2050], sure: 70, ara: [920, 720], kose: [7.5, 10.5], bosluk: 0.26, tam: 0.28, dron: 0.22, cift: 0.28, bos: 0.12 }];
  // Zıplama ve kayma SÜREYE değil YOLA göre: hız artınca zıplama uzarsa kahraman bir sonraki sıranın üstüne iner (ölçüldü: 3. seviyede
  // deneme oyuncusu 20 denemede 0 kazandı, çarpmaların çoğu havadayken gelen sıradandı). Yükseklik sabit, havada kalınan yol sabit.
  var ZIPLA_YOL = 620, ZIPLA_YUK = 237, KAY_YOL = 620;
  var KOSE_BOY = 900, KOSE_K = Math.PI / 2 / (KOSE_BOY * 2 / Math.PI), KOSE_PENCERE = 950;   // köşe: çeyrek dönüş; kaydırma bu mesafeden itibaren dönüş sayılır

  var D = { ekran: "kapak", oyun: null, seviye: 0, vuru: [] };
  // 22 Kas 2026: kayıt noktası yalnız oyun açıkken geçerli. Oyundan çıkılırsa 1. seviyeden başlanır; papağan üç seviye bitmeden kurtulmaz.
  try { localStorage.removeItem("ch_kosu_seviye"); } catch (e) {}
  if (+BAG.get("seviye") >= 1 && +BAG.get("seviye") <= SEVIYE.length) D.seviye = +BAG.get("seviye") - 1;   // deneme: ?seviye=1..3
  function seviyeYaz() {}   // bilerek boş: seviye yalnız bellekte (D.seviye) tutulur
  function ekranAc(ad) { D.ekran = ad; ["kapak", "sonuc"].forEach(function (e) { $(e).classList.toggle("acik", e === ad); }); }

  function yeniOyun(sv, can) {
    var L = SEVIYE[sv];
    return { sv: sv, L: L, t: 0, s: 0, hiz: L.hiz[0], serit: 0, sx: 0, zy: 0, zvy: 0, kay: 0, can: 1, gerisayim: 0, dokunulmaz: 0, onigiri: 0, yakin: 0, durum: "oyna", bitis: 0,
      engeller: [], bosluklar: [], yol: [], koseler: [], susler: [], parcalar: [], sonrakiSira: 1700, sonrakiEgri: 600, sonrakiSus: 300, koseSn: L.kose[0] * 0.8,
      yon: 0, egim: 0, sarsinti: 0, mesaj: "", mesajSn: 0, tohum: 1 + Math.floor(Math.random() * 9999), donen: 0, hiza: 0, toz: 0 };
  }
  function rasgele(o) { o.tohum = (o.tohum * 16807) % 2147483647; return o.tohum / 2147483647; }
  function mesajVer(o, m, sn) { o.mesaj = m; o.mesajSn = sn; }
  function baslat() { D.oyun = yeniOyun(D.seviye); ekranAc("oyun"); muzik(true); if (D.seviye === 0) cal("a_kosu1", 1); mesajVer(D.oyun, D.oyun.L.ad + ": dronlara yetiş!", 2.5); }

  // ---------- yol ----------
  function kappa(o, s) { // yolun s konumundaki eğriliği: parçalar yarım sinüs biçiminde başlar ve biter (ani kırılma yok)
    var k = 0; for (var i = 0; i < o.yol.length; i++) { var p = o.yol[i]; if (s > p.a && s < p.b) k += p.k * Math.sin(Math.PI * (s - p.a) / (p.b - p.a)); } return k;
  }
  function kaymaHesapla(o) { var dx = 0, x = 0; for (var i = 0; i < N; i++) { KAYMA[i] = x; dx += kappa(o, o.s + i * ADIM + ADIM / 2) * ADIM; x += dx * ADIM; } }
  function koseYakin(o, s, pay) { for (var i = 0; i < o.koseler.length; i++) { var k = o.koseler[i]; if (s > k.s - pay && s < k.s + KOSE_BOY + 500) return true; } return false; }
  function boslukta(o, s) { for (var i = 0; i < o.bosluklar.length; i++) { var b = o.bosluklar[i]; if (s > b.a && s < b.b) return b; } return null; }

  // Engel sırası: her sırada en az bir şerit ya boş ya da aşılabilir (zıpla / kay) kalır.
  function siraEkle(o, s) {
    var L = o.L, r = rasgele(o), i;
    if (r < L.bosluk) { var boy = 300 + rasgele(o) * 120; o.bosluklar.push({ a: s, b: s + boy }); for (i = -1; i <= 1; i++) if (rasgele(o) < 0.5) for (var j = 0; j < 3; j++) o.engeller.push({ s: s + j * boy / 2, serit: i, tur: "onigiri", yuk: 150 + (j === 1 ? 90 : 0) }); return boy; }
    r = rasgele(o);
    if (r < L.tam) { var t3 = rasgele(o) < 0.5 ? "bariyer" : "kapi"; for (i = -1; i <= 1; i++) o.engeller.push({ s: s, serit: i, tur: t3 }); return 0; }   // tam sıra: üçü de zıplanır ya da üçünün de altından kayılır
    r = rasgele(o);
    if (r < L.dron) { o.engeller.push({ s: s, serit: rasgele(o) < 0.5 ? -1 : 1, tur: "dron", faz: rasgele(o) * 6 }); o.engeller.push({ s: s, serit: 0, tur: "onigiri", yuk: 0, sabit: true }); return 0; }
    var tip = rasgele(o), bos = Math.floor(rasgele(o) * 3) - 1;
    for (i = -1; i <= 1; i++) {
      if (i === bos) { if (rasgele(o) < 0.75) for (var q = 0; q < 3; q++) o.engeller.push({ s: s + q * 150, serit: i, tur: "onigiri", yuk: 0 }); continue; }
      var e = rasgele(o); if (e < L.bos) continue;
      o.engeller.push({ s: s, serit: i, tur: tip < 0.38 ? "bariyer" : tip < 0.7 ? "kapi" : e < 0.75 ? "blok" : "bariyer" });
    }
    return 0;
  }
  function uret(o) {
    var uzak = o.s + ZMAX + 300, L = o.L, zor = Math.min(1, o.yakin * 1.15);
    while (o.sonrakiSira < uzak) {
      var s = o.sonrakiSira, ek = 0;
      if (!koseYakin(o, s, 1000) && o.yakin < 0.97) { ek = siraEkle(o, s); if (rasgele(o) < L.cift && !ek) { var ca = Math.max(520, o.hiz * 0.46); ek = ca + siraEkle(o, s + ca); } /* çift sıra: ikinci sıra hıza göre uzakta, iki hamleye yetecek kadar */ }
      o.sonrakiSira = s + ek + L.ara[0] + (L.ara[1] - L.ara[0]) * zor + rasgele(o) * 200;
    }
    while (o.sonrakiEgri < uzak) {   // yumuşak kıvrımlar: kaydırma istemez, yolu canlı gösterir
      var boy = 1700 + rasgele(o) * 1500, a = o.sonrakiEgri;
      if (!koseYakin(o, a, 300) && !koseYakin(o, a + boy, 300)) o.yol.push({ a: a, b: a + boy, k: (rasgele(o) < 0.5 ? -1 : 1) * (0.00011 + rasgele(o) * 0.00014) });
      o.sonrakiEgri = a + boy + 300 + rasgele(o) * 1400;
    }
    while (o.sonrakiSus < uzak) { o.susler.push({ s: o.sonrakiSus, yan: rasgele(o) < 0.5 ? -1 : 1, tur: rasgele(o) < 0.62 ? "fener" : "tabela", renk: Math.floor(rasgele(o) * 4), boy: 0.85 + rasgele(o) * 0.4 }); o.sonrakiSus += 260 + rasgele(o) * 240; }
  }
  function koseEkle(o) {
    var s = o.s + 2900, yon = rasgele(o) < 0.5 ? -1 : 1;
    o.koseler.push({ s: s, yon: yon, donuldu: false, carpti: false });
    o.yol = o.yol.filter(function (p) { return p.b < s - 200; });                       // köşeye girerken yol düz olsun
    o.yol.push({ a: s, b: s + KOSE_BOY, k: yon * KOSE_K, kose: true });
    o.engeller = o.engeller.filter(function (e) { return e.s < s - 1000; });
    o.bosluklar = o.bosluklar.filter(function (b) { return b.b < s - 1000; });
    o.sonrakiSira = Math.max(o.sonrakiSira, s + KOSE_BOY + 600); o.sonrakiEgri = Math.max(o.sonrakiEgri, s + KOSE_BOY + 500);
    for (var i = 0; i < 5; i++) o.susler.push({ s: s + 80 + i * 150, yan: -yon, tur: "ok", yon: yon });   // dönülecek yanı gösteren ok tabelaları dış kenarda
  }
  function aktifKose(o) { for (var i = 0; i < o.koseler.length; i++) { var k = o.koseler[i]; if (!k.donuldu && !k.carpti && k.s - o.s < KOSE_PENCERE) return k; } return null; }

  // ---------- hamleler ----------
  var tus = {};
  function hamle(yon) {
    var o = D.oyun; if (!o || o.durum !== "oyna") return;
    var k = aktifKose(o);
    if ((yon === "sol" || yon === "sag") && k) {     // köşe yaklaşırken sağa/sola kaydırmak şerit değiştirmez, köşeyi döndürür
      if ((yon === "sag" ? 1 : -1) === k.yon) { k.donuldu = true; o.donen++; o.egim = k.yon; cal("e_simit", 0.5); mesajVer(o, "Güzel dönüş!", 0.9); }
      else { cal("e_pop", 0.25); mesajVer(o, k.yon > 0 ? "Öbür yana! SAĞA dön!" : "Öbür yana! SOLA dön!", 1); }
      return;
    }
    if (yon === "sol" && o.serit > -1) { o.serit--; cal("e_pop", 0.25); }
    if (yon === "sag" && o.serit < 1) { o.serit++; cal("e_pop", 0.25); }
    if (yon === "yukari" && o.zy === 0) { o.kay = 0; o.zsure = Math.max(0.36, ZIPLA_YOL / o.hiz); o.zvy = 4 * ZIPLA_YUK / o.zsure; cal("e_pop", 0.4); }   // kayarken zıplanabilir: art arda gelen "kay" ve "zıpla" sıraları geçilebilsin
    if (yon === "asagi" && o.kay <= 0) { o.kay = Math.max(0.36, KAY_YOL / o.hiz); if (o.zy > 0) o.zvy = -1400; }
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

  function parca(o, x, y, renk, n, hiz) { for (var i = 0; i < n; i++) o.parcalar.push({ x: x, y: y, vx: (Math.random() - 0.5) * (hiz || 420), vy: -Math.random() * (hiz || 420) * 0.9, r: 5 + Math.random() * 7, renk: renk, sn: 0.5, ilk: 0.5 }); }
  function incit(o, neden, tur) {
    if (o.dokunulmaz > 0 || o.durum !== "oyna") return;
    D.vuru.push(tur || neden);   // deneme için: neye çarpıldı
    o.can--; o.dokunulmaz = 1.3; o.yakin = Math.max(0, o.yakin - 0.06); o.hiz = Math.max(o.L.hiz[0] * 0.7, o.hiz - 320); o.sarsinti = 0.35; cal("e_ah", 0.7);
    parca(o, G / 2 + o.sx * SERIT, TABAN - 120, "#ffd23a", 10);
    mesajVer(o, o.can > 0 ? (neden || "Ah! Dronlar uzaklaştı!") : "", 1.2);
    if (o.can <= 0) bitir(o, false);
  }
  function bitir(o, kazandi) {
    if (o.durum !== "oyna") return;
    if (kazandi && o.sv < SEVIYE.length - 1) {     // ara seviye: dronlar hızlanıp uzaklaşır, sıradaki seviye başlar
      // 22 Kas 2026: koşu KESİLMEZ. Seviye yerinde değişir, 3 sn geri sayım boyunca engel ve köşe gelmez; geçilen seviye kayıt noktasıdır.
      cal("e_zafer", 0.5); o.sv++; o.L = SEVIYE[o.sv]; D.seviye = o.sv; seviyeYaz(); o.yakin = 0; o.gerisayim = 3;
      o.engeller = o.engeller.filter(function (e) { return e.s < o.s; }); o.bosluklar = o.bosluklar.filter(function (b) { return b.b < o.s; });
      o.koseler = o.koseler.filter(function (k) { return k.donuldu || k.carpti || k.s + KOSE_BOY < o.s; });
      o.yol = o.yol.filter(function (p) { return !(p.kose && p.a > o.s); }); o.susler = o.susler.filter(function (u) { return !(u.tur === "ok" && u.s > o.s); });
      o.sonrakiSira = o.s + o.hiz * 3 + 500; o.koseSn = Math.max(5, o.L.kose[0] * 0.8);
      mesajVer(o, SEVIYE[o.sv - 1].ad + " tamam! Kayıt noktası!", 3); return;
    }
    o.durum = kazandi ? "kazandi" : "kayip"; o.bitis = kazandi ? 2.6 : 1.4;
    if (kazandi && window.HK) HK.bitir("kosu");
    if (kazandi) { cal("e_zafer", 0.8); cal("a_kosu2", 1); setTimeout(function () { cal("p_kosu3", 1); }, 2300); mesajVer(o, "Yakaladın! Papağan kurtuldu!", 3); }
    else cal("a_kosu4", 1);
  }
  function sonucAc(o) {
    muzik(false); var kz = o.durum === "kazandi";
    if (kz) { D.seviye = 0; seviyeYaz(); }
    $("sonucBaslik").textContent = kz ? "Papağan kurtuldu!" : "Dronlar kaçtı!";
    $("sonucYazi").textContent = kz ? "Üç seviyeyi de bitirdin, " + o.onigiri + " onigiri topladın. Şimdi papağanla birlikte Tokyo'yu kurtarma zamanı!" : o.L.ad + " içinde bir engele çarptın. Bu seviyeden yeniden başlarsın, bu sefer yetişirsin!";
    $("devam").style.display = kz ? "" : "none"; $("tekrar").style.display = kz ? "none" : ""; $("tekrar").textContent = o.L.ad + ": tekrar dene";
    ekranAc("sonuc");
    if (window.HK) HK.skorGoster("kosu", [["Onigiri", o.onigiri, o.onigiri * 10], ["Dönülen köşe", o.donen, o.donen * 40], ["Geçilen seviye", o.sv + (kz ? 1 : 0), (o.sv + (kz ? 1 : 0)) * 100]].concat(kz ? [["Papağan kurtuldu", "✔", 300]] : []), kz);
  }

  function guncelle(dt) {
    var o = D.oyun; if (!o) return; o.t += dt;
    if (o.mesajSn > 0) o.mesajSn -= dt; if (o.sarsinti > 0) o.sarsinti -= dt;
    for (var p = o.parcalar.length - 1; p >= 0; p--) { var q = o.parcalar[p]; q.sn -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 900 * dt; if (q.sn <= 0) o.parcalar.splice(p, 1); }
    if (o.durum !== "oyna") {
      o.bitis -= dt;
      if (o.durum === "seviye") { o.s += o.hiz * dt; o.yon += kappa(o, o.s) * o.hiz * dt; o.yakin = Math.max(0, o.yakin - dt * 0.33); if (o.bitis <= 0) { D.seviye = o.sv + 1; seviyeYaz(); D.oyun = yeniOyun(D.seviye, Math.min(3, o.can + 1)); mesajVer(D.oyun, D.oyun.L.ad + ": faster!", 2.2); } }
      else { if (o.durum === "kazandi") { o.s += o.hiz * 0.4 * dt; o.yon += kappa(o, o.s) * o.hiz * 0.4 * dt; } if (o.bitis <= 0 && D.ekran === "oyun") sonucAc(o); }
      return;
    }
    if (o.gerisayim > 0) o.gerisayim -= dt;
    var L = o.L, hedef = L.hiz[0] + (L.hiz[1] - L.hiz[0]) * o.yakin; o.hiz += (hedef - o.hiz) * Math.min(1, dt * 0.8);
    // keskin köşe: zamanı gelince ileride belirir
    if (!o.koseler.length || o.koseler[o.koseler.length - 1].s + KOSE_BOY < o.s) { if (o.yakin < 0.93) { o.koseSn -= dt; if (o.koseSn <= 0) { koseEkle(o); o.koseSn = L.kose[0] + rasgele(o) * (L.kose[1] - L.kose[0]); } } }
    uret(o);
    var kNow = kappa(o, o.s); o.s += o.hiz * dt; o.yon += kNow * o.hiz * dt; o.egim += (0 - o.egim) * Math.min(1, dt * 2.5);
    o.yakin = Math.min(1, o.yakin + dt / L.sure);
    if (o.dokunulmaz > 0) o.dokunulmaz -= dt;
    o.sx += (o.serit - o.sx) * Math.min(1, dt * 14);
    if (o.zy > 0 || o.zvy > 0) { o.zvy -= 8 * ZIPLA_YUK / ((o.zsure || 0.76) * (o.zsure || 0.76)) * dt; o.zy += o.zvy * dt; if (o.zy <= 0) { o.zy = 0; o.zvy = 0; parca(o, G / 2 + o.sx * SERIT, TABAN, "rgba(220,210,255,.8)", 5, 220); } }
    if (o.kay > 0) o.kay -= dt;
    // köşe: kaydırılmadıysa kahraman köşenin dış duvarına çarpar
    for (var i = o.koseler.length - 1; i >= 0; i--) {
      var k = o.koseler[i];
      if (!k.donuldu && !k.carpti && o.s > k.s + 160) { k.carpti = true; o.egim = k.yon; incit(o, "Köşeyi kaçırdın! Köşede kaydır!"); }
      if (o.s > k.s + KOSE_BOY + 400) o.koseler.splice(i, 1);
    }
    // çatı boşluğu: üstünden zıplanmazsa düşülür
    var b = boslukta(o, o.s); if (b && !b.dustu && o.zy < 30 && o.s > b.a + 50 && o.s < b.b - 30) { b.dustu = true; o.zsure = 0.6; o.zvy = 1350; o.zy = 1; incit(o, "Boşlukların üstünden zıpla!"); }
    // engeller
    for (i = o.engeller.length - 1; i >= 0; i--) {
      var e = o.engeller[i], z = e.s - o.s, once = z + o.hiz * dt, yer = e.serit;
      if (e.tur === "dron") yer = e.serit * Math.cos(o.t * 2.1 + e.faz);              // gezen dron: şeritler arasında gider gelir
      e.yer = yer;
      if (once > 30 && z <= 30 && Math.abs(yer - o.sx) < 0.5) {       // kahramanın hizasına geldi
        if (e.tur === "onigiri") { if (Math.abs(o.zy - (e.yuk || 0)) < 170) { o.onigiri++; cal("e_simit", 0.4); parca(o, G / 2 + o.sx * SERIT, TABAN - 150 - o.zy * 0.75, "#fff", 6, 300); if (o.onigiri % 20 === 0 && o.can < 1) { o.can++; mesajVer(o, "20 onigiri!", 1.5); } o.engeller.splice(i, 1); continue; } }
        else if (e.tur === "bariyer" ? o.zy < 85 : e.tur === "kapi" ? !(o.kay > 0 && o.zy < 40) : e.tur === "dron" ? !(o.kay > 0 && o.zy < 40) : true) incit(o, null, e.tur);
      }
      if (z < -300) o.engeller.splice(i, 1);
    }
    o.bosluklar = o.bosluklar.filter(function (x) { return x.b > o.s - 400; });
    o.susler = o.susler.filter(function (x) { return x.s > o.s - 300; });
    o.yol = o.yol.filter(function (x) { return x.b > o.s - 100; });
    // koşarken ayak tozu
    o.toz -= dt; if (o.toz <= 0 && o.zy === 0) { o.toz = 0.09; o.parcalar.push({ x: G / 2 + o.sx * SERIT + (Math.random() - 0.5) * 50, y: TABAN + 4, vx: (Math.random() - 0.5) * 80, vy: -60 - Math.random() * 80, r: 7 + Math.random() * 6, renk: "rgba(200,190,235,.55)", sn: 0.32, ilk: 0.32 }); }
    if (o.yakin >= 1) bitir(o, true);
  }

  // ---------- çizim ----------
  function resim(im, x, y, yuk, alfa) { // (x, y): tabanın ortası
    if (!im.complete || !im.naturalWidth) return; var g = yuk * im.width / im.height;
    if (alfa != null) c.globalAlpha = alfa; c.drawImage(im, x - g / 2, y - yuk, g, yuk); c.globalAlpha = 1;
  }
  function yazi(m, x, y, boy, renk, hiza) {
    c.font = "bold " + boy + "px 'Arial Rounded MT Bold','Chalkboard SE','Trebuchet MS',sans-serif"; c.textAlign = hiza || "center";
    c.lineWidth = boy / 5; c.strokeStyle = "rgba(20,25,60,.85)"; c.lineJoin = "round"; c.strokeText(m, x, y); c.fillStyle = renk || "#fff"; c.fillText(m, x, y);
  }
  function golge(x, y, g, alfa) { c.fillStyle = "rgba(20,15,40," + (alfa || 0.32) + ")"; c.beginPath(); c.ellipse(x, y, g, g * 0.22, 0, 0, 7); c.fill(); }
  var BOY = { bariyer: 135, kapi: 400, blok: 330, onigiri: 80, dron: 150 };
  var NEON = ["#39e6ff", "#ff5fd0", "#ffd23a", "#7dff8a"];

  function arkaCiz(o) { // gökyüzü ve şehir: dönüş açısı kadar yana kayar; görsel aynalanarak yan yana dizilir, ek yeri görünmez
    var im = R.arka; if (!im.complete || !im.naturalWidth) { c.fillStyle = "#7a4fb0"; c.fillRect(-80, -80, G + 160, Y + 160); return; }
    var kay = -o.yon * 430, ilk = Math.floor((-80 - kay) / G), x;
    for (var i = ilk; i <= ilk + 2; i++) {
      x = i * G + kay;
      if (((i % 2) + 2) % 2) { c.save(); c.translate(x + G, 0); c.scale(-1, 1); c.drawImage(im, 0, -80, G + 1, Y + 160); c.restore(); } else c.drawImage(im, x, -80, G + 1, Y + 160);
    }
  }
  function yolCiz(o) { // çatı yolu: doku satır satır, derinliğe göre daralır ve eğriliğe göre yana kayar; boşluklarda çizilmez
    var z = R.zemin; if (!z.complete || !z.naturalWidth) return;
    var zh = z.naturalHeight, olc = 0.9, y, t, zz, v, sy, sh, cx, gen, onceBos = false;
    for (y = UFUK + 3; y < Y + 90; y += 3) {
      t = (y - UFUK) / (TABAN - UFUK); zz = ZK * (1 / t - 1); cx = G / 2 + kayma(zz) * t; gen = YOL * t;
      var bos = !!boslukta(o, o.s + zz);
      if (bos) { onceBos = true; continue; }
      // kenar yüzü: yolun iki yanında koyu şerit (çatının kalınlığı)
      c.fillStyle = "#2a1c4a"; c.fillRect(cx - gen - 16 * t, y, 2 * gen + 32 * t, 3.6);
      v = ((zh - ((zz + o.s) * olc) % zh) % zh + zh) % zh; sy = Math.min(zh - 1, Math.floor(v)); sh = Math.max(1, Math.min(zh - sy, Math.ceil(3 * olc / (t * t) * (ZK / (TABAN - UFUK)))));
      c.drawImage(z, 0, sy, z.naturalWidth, sh, cx - gen, y, 2 * gen, 3.6);
      if (y < UFUK + 200) { c.fillStyle = "rgba(150,95,200," + (0.92 * (1 - (y - UFUK) / 200)).toFixed(3) + ")"; c.fillRect(cx - gen - 16 * t, y, 2 * gen + 32 * t, 3.6); } // ufuk sisi: yalnız yolun uzak ucu şehrin rengine karışır
      if (onceBos) { c.fillStyle = "#1b1233"; c.fillRect(cx - gen - 16 * t, y - 26 * t, 2 * gen + 32 * t, 26 * t + 1); c.fillStyle = "rgba(255,95,208,.75)"; c.fillRect(cx - gen, y - 2, 2 * gen, 4 * t + 1); onceBos = false; } // boşluğun ön duvarı ve kenar ışığı
    }
    // kenar neonları: yolun iki yanında parlayan çizgi
    c.save(); c.lineWidth = 5; c.lineCap = "round"; c.shadowBlur = 16;
    [-1, 1].forEach(function (yan) {
      c.strokeStyle = yan < 0 ? "#ff5fd0" : "#39e6ff"; c.shadowColor = c.strokeStyle; var ciziyor = false; c.beginPath();
      for (var zq = -200; zq <= 2600; zq += 80) {
        if (boslukta(o, o.s + zq)) { ciziyor = false; continue; }
        var tq = oran(zq), xq = G / 2 + (yan * (YOL + 6) + kayma(zq)) * tq, yq = ey(zq);
        if (ciziyor) c.lineTo(xq, yq); else { c.moveTo(xq, yq); ciziyor = true; }
      }
      c.globalAlpha = 0.85; c.stroke();
    });
    c.restore();
  }
  function susCiz(o, q, z) { // yol kenarı: fener direği, neon tabela, köşe oku (kodla çizilir, hamur renkleri)
    var t = oran(z); if (z > 2700 || z < -250) return; var alfa = z > 2300 ? (2700 - z) / 400 : 1, x = ex(q.yan * (YOL + 110), z), y = ey(z), b = (q.boy || 1) * t;
    c.save(); c.globalAlpha = alfa;
    if (q.tur === "fener") {
      c.fillStyle = "#3a2a5e"; c.fillRect(x - 7 * b, y - 300 * b, 14 * b, 300 * b);
      c.fillRect(x - (q.yan > 0 ? 70 : 0) * b, y - 300 * b, 70 * b, 10 * b);
      var fx = x - q.yan * 58 * b, fy = y - 250 * b, isik = c.createRadialGradient(fx, fy, 2, fx, fy, 70 * b);
      isik.addColorStop(0, "rgba(255,190,110,.75)"); isik.addColorStop(1, "rgba(255,190,110,0)"); c.fillStyle = isik; c.fillRect(fx - 70 * b, fy - 70 * b, 140 * b, 140 * b);
      c.fillStyle = q.renk % 2 ? "#ffe2a8" : "#e8443a"; c.beginPath(); c.ellipse(fx, fy, 24 * b, 32 * b, 0, 0, 7); c.fill();
      c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.ellipse(fx - 7 * b, fy - 9 * b, 7 * b, 12 * b, 0, 0, 7); c.fill();
      c.fillStyle = "#2a1c4a"; c.fillRect(fx - 12 * b, fy - 38 * b, 24 * b, 8 * b); c.fillRect(fx - 12 * b, fy + 30 * b, 24 * b, 8 * b);
    } else if (q.tur === "tabela") {
      var renk = NEON[q.renk], g2 = 120 * b, h2 = 190 * b, tx = x - g2 / 2, ty = y - 330 * b;
      c.fillStyle = "#3a2a5e"; c.fillRect(x - 8 * b, y - 150 * b, 16 * b, 150 * b);
      c.fillStyle = "#4b3a7c"; c.beginPath(); c.roundRect(tx, ty, g2, h2, 18 * b); c.fill();
      c.shadowColor = renk; c.shadowBlur = 18 * t + 4; c.strokeStyle = renk; c.lineWidth = 7 * b + 1; c.lineCap = "round";
      c.beginPath(); c.roundRect(tx + 12 * b, ty + 12 * b, g2 - 24 * b, h2 - 24 * b, 12 * b); c.stroke();
      c.beginPath(); c.moveTo(tx + 36 * b, ty + 50 * b); c.quadraticCurveTo(tx + 95 * b, ty + 70 * b, tx + 42 * b, ty + 100 * b); c.quadraticCurveTo(tx + 30 * b, ty + 130 * b, tx + 86 * b, ty + 142 * b); c.stroke();
    } else { // köşe oku
      var ob = 150 * t, oy = y - 210 * t;
      c.fillStyle = "#3a2a5e"; c.fillRect(x - 7 * t, y - 150 * t, 14 * t, 150 * t);
      c.fillStyle = "#231640"; c.beginPath(); c.roundRect(x - ob * 0.62, oy - ob * 0.5, ob * 1.24, ob, 16 * t); c.fill();
      c.shadowColor = "#ffd23a"; c.shadowBlur = 14 * t + 3; c.fillStyle = "#ffd23a";
      for (var n = -1; n <= 0; n++) { var ax = x + q.yon * (n * 0.34 + 0.02) * ob; c.beginPath(); c.moveTo(ax - q.yon * ob * 0.14, oy - ob * 0.32); c.lineTo(ax + q.yon * ob * 0.2, oy); c.lineTo(ax - q.yon * ob * 0.14, oy + ob * 0.32); c.lineTo(ax + q.yon * ob * 0.02, oy); c.closePath(); c.fill(); }
    }
    c.restore();
  }
  function engelCiz(o, e, z) {
    if (z > 2700 || z < -290) return; // seviye geçişinde engeller silinmez, kameranın arkasına geçen çizilmez
    var t = oran(z), alfa = z > 2300 ? (2700 - z) / 400 : z < -120 ? Math.max(0, (300 + z) / 180) : 1, yer = e.yer == null ? e.serit : e.yer, x = ex(yer * SERIT, z), y = ey(z);
    if (e.tur === "onigiri") { var yk = (e.yuk || 0) * 0.75 * t + 60 * t + Math.sin(o.t * 5 + e.s * 0.01) * 8 * t; golge(x, y, 30 * t, 0.25 * alfa); resim(R.onigiri, x, y - yk, BOY.onigiri * t, alfa); return; }
    if (e.tur === "dron") { golge(x, y, 60 * t, 0.3 * alfa); resim(R.dron, x, y - 150 * t + Math.sin(o.t * 6 + e.faz) * 10 * t, BOY.dron * t, alfa); return; }
    golge(x, y + 4 * t, (e.tur === "kapi" ? 130 : 105) * t, 0.3 * alfa); resim(R[e.tur], x, y, BOY[e.tur] * t, alfa);
  }
  function kahramanCiz(o, poz) {
    var kx = G / 2 + o.sx * SERIT, ky = TABAN - o.zy * 0.75, kos = o.zy <= 5 && !(o.kay > 0),
      faz = Math.floor(o.s / 150) % 4,   // adım yola bağlı: sol adım, uçuş, sağ adım (ayna), uçuş (ayna)
      ad = o.zy > 5 ? "_zip" : o.kay > 0 ? "_kay" : (faz % 2 ? "_k2" : "_k1"), ayna = kos && faz >= 2;
    if (kos && faz % 2) ky -= 14;
    if (!boslukta(o, o.s)) golge(kx, TABAN + 6, 70 - Math.min(35, o.zy / 8), 0.35);
    if (!(o.dokunulmaz > 0 && poz % 2)) {
      c.save(); c.translate(kx, ky); c.rotate((o.serit - o.sx) * 0.22 + o.egim * 0.2); if (ayna) c.scale(-1, 1);
      resim(R[K + ad], 0, ad === "_kay" ? 10 : 0, ad === "_kay" ? 190 : ad === "_zip" ? 270 : 290); c.restore();
    }
  }
  function hizCizgileri(o) { // hız arttıkça kenarlardan ufka uzanan ince çizgiler
    var g = Math.max(0, (o.hiz - 1050) / 850); if (g <= 0) return;
    c.save(); c.strokeStyle = "rgba(255,255,255," + (0.10 + 0.22 * g) + ")"; c.lineWidth = 3; c.lineCap = "round";
    for (var i = 0; i < 14; i++) {
      var a = (i * 2.399 + Math.floor(o.t * 14) * 0.7) % 6.283, r1 = 520 + ((i * 97 + Math.floor(o.t * 14) * 53) % 260), r2 = r1 + 90 + 160 * g, mx = G / 2, my = UFUK + 120;
      if (Math.abs(Math.cos(a)) < 0.45) continue;
      c.beginPath(); c.moveTo(mx + Math.cos(a) * r1, my + Math.sin(a) * r1 * 1.3); c.lineTo(mx + Math.cos(a) * r2, my + Math.sin(a) * r2 * 1.3); c.stroke();
    }
    c.restore();
  }
  function ciz() {
    var o = D.oyun; if (!o) return;
    var poz = Math.floor(o.t * 12), i;
    kaymaHesapla(o);
    var egim = Math.max(-0.14, Math.min(0.14, -kappa(o, o.s) * o.hiz * 0.036)), sars = o.sarsinti > 0 ? (Math.random() - 0.5) * 22 * (o.sarsinti / 0.35) : 0;
    c.fillStyle = "#3a2466"; c.fillRect(0, 0, G, Y);
    c.save(); c.translate(G / 2 + sars, TABAN); c.rotate(egim); c.scale(1.07, 1.07); c.translate(-G / 2, -TABAN);   // virajda sahne hafifçe yatar
    arkaCiz(o); yolCiz(o);
    // dronlar ve papağan: yaklaştıkça büyür, yolun kıvrımını izler
    var dz = 300 + 2300 * (1 - o.yakin), dt2 = oran(dz), kzn = o.durum === "kazandi";
    var dx = ex(Math.sin(poz * 0.6) * 80, dz), dy = ey(dz) - 250 * dt2 - (kzn ? 0 : 60);
    // uzaktan yakına: süsler, engeller, kahraman
    var liste = [];
    for (i = 0; i < o.susler.length; i++) liste.push({ z: o.susler[i].s - o.s, sus: o.susler[i] });
    for (i = 0; i < o.engeller.length; i++) liste.push({ z: o.engeller[i].s - o.s, engel: o.engeller[i] });
    liste.push({ z: dz, dron: true }); liste.push({ z: 0, kahraman: true });
    liste.sort(function (a, b) { return b.z - a.z; });
    for (i = 0; i < liste.length; i++) {
      var q = liste[i];
      if (q.sus) susCiz(o, q.sus, q.z); else if (q.engel) engelCiz(o, q.engel, q.z); else if (q.kahraman) kahramanCiz(o, poz);
      else if (!kzn) resim(R.papagan_ag, dx, dy, 420 * dt2 + 60);
    }
    hizCizgileri(o);
    for (i = 0; i < o.parcalar.length; i++) { var p = o.parcalar[i]; c.globalAlpha = Math.max(0, p.sn / p.ilk); c.fillStyle = p.renk; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); } c.globalAlpha = 1;
    c.restore();
    // kenar karartması: göz ortada kalsın
    var kar = c.createRadialGradient(G / 2, Y * 0.55, Y * 0.35, G / 2, Y * 0.55, Y * 0.78); kar.addColorStop(0, "rgba(20,10,40,0)"); kar.addColorStop(1, "rgba(20,10,40,.45)"); c.fillStyle = kar; c.fillRect(0, 0, G, Y);
    if (kzn) { var pk = Math.min(1, (2.6 - o.bitis) / 1.2); resim(R.papagan_ag, G / 2 + (o.sx * SERIT + 150) * pk, 500 + (TABAN - 620) * pk, 300); }
    // köşe uyarısı
    var k = aktifKose(o); if (k && o.durum === "oyna" && !(poz % 2 && k.s - o.s < 450)) yazi(k.yon > 0 ? "SAĞA KAYDIR  ➜" : "⬅  SOLA KAYDIR", G / 2, 560, 50, "#ffd23a");
    // gösterge
    resim(R.kalp, 130, 96, 48, o.can > 0 ? 1 : 0.25);
    if (o.gerisayim > 0) { yazi(o.L.ad + " başlıyor", G / 2, 520, 40, "#ffd23a"); yazi("" + Math.ceil(o.gerisayim), G / 2, 640, 150, "#fff"); }
    resim(R.onigiri, 130, 168, 54); yazi("" + o.onigiri, 170, 160, 34, "#ffd23a", "left");
    c.fillStyle = "rgba(20,25,60,.6)"; c.beginPath(); c.roundRect(290, 58, 390, 30, 15); c.fill();
    c.fillStyle = "#39d0e8"; c.beginPath(); c.roundRect(294, 62, Math.max(22, 382 * o.yakin), 22, 11); c.fill();
    yazi("dronlara uzaklık", 440, 118, 22); yazi(o.L.ad + " / " + SEVIYE.length, 640, 118, 22, "#ffd23a");
    if (o.t < 6 && o.sv === 0 && o.durum === "oyna") { yazi("Kaydır: ← → şerit", G / 2, 300, 34, "#ffd23a"); yazi("↑ zıpla   ↓ kay   köşede: dönmek için kaydır", G / 2, 346, 28); }
    if (o.mesajSn > 0 && o.mesaj) yazi(o.mesaj, G / 2, 430, o.mesaj.length > 30 ? 32 : 40);
  }

  $("basla").addEventListener("click", baslat);
  $("tekrar").addEventListener("click", baslat);
  $("yeni").addEventListener("click", function () { muzik(false); location.href = "../istanbul/index.html"; });
  $("devam").addEventListener("click", function () { muzik(false); location.href = "../istanbul/index.html?devam=tokyo&seri=" + SERI; });
  if (D.seviye > 0) $("basla").textContent = "▶ " + SEVIYE[D.seviye].ad;

  var son = 0;
  function dongu(zmn) { var dt = Math.min(0.05, (zmn - son) / 1000 || 0); son = zmn; if (window.__durdu) { requestAnimationFrame(dongu); return; } if (D.ekran === "oyun") { guncelle(dt); ciz(); } requestAnimationFrame(dongu); }
  requestAnimationFrame(dongu);
  // deneme kancası: ilerlet(sn) oyunu kareleri atlayarak ilerletir; otomatik(sn) engelleri görüp kaçan basit bir oyuncuyla oynatır
  function oto(o) {
    var k = aktifKose(o); if (k && k.s - o.s < 700) { hamle(k.yon > 0 ? "sag" : "sol"); return; }
    var b = null, i; for (i = 0; i < o.bosluklar.length; i++) if (o.bosluklar[i].a - o.s > 0 && o.bosluklar[i].a - o.s < 110) b = o.bosluklar[i]; if (b) { hamle("yukari"); return; }
    var yakin = o.engeller.filter(function (e) { var z = e.s - o.s; return e.tur !== "onigiri" && z > 0 && z < Math.max(300, o.hiz * 0.22); });
    if (!yakin.length) return;
    var enYakin = Math.min.apply(null, yakin.map(function (e) { return e.s; })); yakin = yakin.filter(function (e) { return e.s - enYakin < 60; });   // yalnız en yakın sıraya bakar
    function dolu(s) { return yakin.filter(function (e) { return Math.abs((e.yer == null ? e.serit : e.yer) - s) < 0.6; })[0]; }
    var e0 = dolu(o.serit); if (!e0) return;
    var bosS = [-1, 0, 1].filter(function (s) { return !dolu(s) && Math.abs(s - o.serit) === 1; })[0];
    if (e0.tur === "bariyer") hamle("yukari"); else if (e0.tur === "kapi" || e0.tur === "dron") hamle("asagi"); else if (bosS != null) hamle(bosS > o.serit ? "sag" : "sol"); else { var b2 = [-1, 0, 1].filter(function (s) { return !dolu(s); })[0]; if (b2 != null) hamle(b2 > o.serit ? "sag" : "sol"); }
  }
  window.__menu = { ekran: function () { return D.ekran; }, bolumVar: function () { return D.ekran === "oyun"; }, bolumBastan: function () { muzik(false); baslat(); } }; // ⏸ menüsü
  window.__oyun = { D: D, baslat: baslat, hamle: hamle,
    ilerlet: function (sn) { for (var t = 0; t < sn; t += 1 / 60) guncelle(1 / 60); ciz(); var o = D.oyun; return { sv: o.sv + 1, yakin: +o.yakin.toFixed(2), can: o.can, durum: o.durum, onigiri: o.onigiri }; },
    otomatik: function (sn) { for (var t = 0; t < sn && D.ekran === "oyun"; t += 1 / 60) { oto(D.oyun); guncelle(1 / 60); } ciz(); var o = D.oyun; return { sv: o.sv + 1, yakin: +o.yakin.toFixed(2), can: o.can, durum: o.durum, onigiri: o.onigiri, donen: o.donen, t: +o.t.toFixed(1) }; } };
})();
