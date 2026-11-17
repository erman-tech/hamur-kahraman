/* Hamur Kahraman: Gezegenden Kaçış. Tek dosya, kütüphane yok. Dik ekran (720×1280).
   Tırtıl oyununda portala yakalanan kahraman Zorgo'nun gezegenine düşer. Oyun: kahraman platformlara kendiliğinden zıplar,
   oyuncu yalnız sağa sola yönlendirir (parmağı kaydırarak ya da ok tuşlarıyla). Alttan lav yükselir; en üstteki portala
   ulaşan eve döner. Lav yakalarsa ya da üç can biterse kaybedilir.
   Platformlar: mor (sağlam), turuncu (bir kez basınca dağılır), pembe (çok yükseğe fırlatır). */
(function () {
  "use strict";
  var G = 720, Y = 1280, POZ = 12;
  var $ = function (id) { return document.getElementById(id); };
  var tuval = $("tuval"), c = tuval.getContext("2d");
  var BAG = new URLSearchParams(location.search);

  function olcekle() {
    var k = Math.min(innerWidth / G, innerHeight / Y), s = $("sahne");
    s.style.transform = "scale(" + k + ")";
    s.style.left = (innerWidth - G * k) / 2 + "px";
    s.style.top = (innerHeight - Y * k) / 2 + "px";
    // dokunmatik cihaz yan tutuluyorsa "dik tut" işareti
    $("dondur").style.display = ("ontouchstart" in window) && innerWidth > innerHeight * 1.15 && !(window.__film) ? "flex" : "none"; // film yatay izlenir, oyun dik oynanır
  }
  addEventListener("resize", olcekle); olcekle();

  // ---------- kahraman: tırtıl oyunundan gelen (k=) ya da 1. oyunda açılan son kostüm ----------
  var GECERLI = ["e1", "e2", "e3", "e4", "k1", "k2", "k3", "k4", "k", "s", "kl", "sl", "kt", "st", "kp", "sp", "ka", "sa"], KAHRAMAN = "e4";
  try { var acik = JSON.parse(localStorage.getItem("hk_kostum") || "[]"), taraf = localStorage.getItem("hk_taraf");
    if (taraf === "iyi" || taraf === "kotu") acik = acik.filter(function (x) { return (x.charAt(0) === "k") === (taraf === "iyi"); }); if (acik.length && GECERLI.indexOf(acik[acik.length - 1]) >= 0) KAHRAMAN = acik[acik.length - 1]; } catch (e) {}
  if (GECERLI.indexOf(BAG.get("k")) >= 0) KAHRAMAN = BAG.get("k");

  // ---------- varlıklar ----------
  var R = {};
  ["kalp", "lav", "p_mor", "p_turuncu", "p_pembe", "u_goz", "u_kanat", "kristal", "portal", KAHRAMAN + "_dur", KAHRAMAN + "_uc"].forEach(function (a) {
    var im = new Image(); im.dene = 0; im.onerror = function () { var b = this; if (b.dene++ < 4) setTimeout(function () { b.src = b.src.split("?")[0] + "?d=" + b.dene; }, 600 * b.dene); }; // yavaş ağda yüklenemeyen görsel yeniden denenir
    im.src = "varlik/" + a + ".png"; R[a] = im;
  });
  R.arka = new Image(); R.arka.src = "varlik/arka.jpg";

  var sesAdlari = ["e_pop", "e_ah", "e_zafer", "e_firla", "e_kalp", "p_basla", "p_yakin", "p_yari", "p_kazandin", "p_kaybettin", "muzik"];
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
      if (ac && tampon[a]) { var k = ac.createBufferSource(), g = ac.createGain(); k.buffer = tampon[a]; g.gain.value = ses; k.connect(g); g.connect(ac.destination); k.start(); return; }
      var s = yedek[a].cloneNode(); s.volume = Math.min(1, ses); var p = s.play(); if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }
  function muzikBasla() {
    muzikDur();
    try {
      if (ac && tampon.muzik) { var k = ac.createBufferSource(), g = ac.createGain(); k.buffer = tampon.muzik; k.loop = true; g.gain.value = 0.2; k.connect(g); g.connect(ac.destination); k.start(); muzikDugum = k; return; }
      yedek.muzik.currentTime = 0; var p = yedek.muzik.play(); if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }
  function muzikDur() { try { if (muzikDugum) { muzikDugum.stop(); muzikDugum = null; } yedek.muzik.pause(); } catch (e) {} }
  ["touchstart", "mousedown", "keydown"].forEach(function (o) { addEventListener(o, sesAc, true); });

  // ---------- ekranlar ----------
  var D = { ekran: "kapak", oyun: null };
  function ekranAc(ad) { D.ekran = ad; ["kapak", "sonuc"].forEach(function (e) { $(e).classList.toggle("acik", e === ad); }); }
  var SERI = BAG.get("seri") === "kotu" ? "kotu" : "iyi";
  // giriş filmi (yatay). Bitince ya da "Geç" denince oyun başlar; telefon yansa "dik tut" işareti çıkar.
  var film = $("film");
  function filmBitti() { if (!window.__film) return; window.__film = false; film.pause(); film.style.display = "none"; $("gec").style.display = "none"; olcekle(); oyunBaslat(); }
  film.addEventListener("ended", filmBitti); film.addEventListener("error", filmBitti); $("gec").addEventListener("click", filmBitti);
  $("basla").addEventListener("click", function () {
    window.__film = true; film.src = "video/giris.mp4"; film.style.display = "block"; $("gec").style.display = "block"; olcekle();
    var p = film.play(); if (p && p.catch) p.catch(function () { filmBitti(); });
  });
  $("tekrar").addEventListener("click", function () { oyunBaslat(); });
  $("yeni").addEventListener("click", function () { muzikDur(); location.href = "../istanbul/index.html"; });
  $("londraGit").addEventListener("click", function () { muzikDur(); location.href = FINALDEN ? "../tirtil/index.html?baglanti=1&final=1&seri=" + SERI : "../istanbul/index.html?londra=1&seri=" + SERI + (SONRA ? "&don=" + SONRA : ""); });
  var FINALDEN = BAG.get("final") === "1"; if (FINALDEN) $("londraGit").textContent = "▶ Tırtıl görevine dön"; // şehirler bittikten sonra portala düşüldüyse: kaçınca Londra değil, tırtıl görevi sürer
  var SONRA = BAG.get("sonra") === "tokyo" ? "tokyo" : ""; if (SONRA) $("londraGit").textContent = "✈ Tokyo'ya hazırım!"; if (SONRA) document.querySelector("#kapak h2").textContent = "Zorgo'nun UFO'su seni gezegenine ışınladı. Platformlara zıpla, yukarıdaki portala ulaş. Lav yükseliyor!"; // Londra'dan eve dönerken kaçırıldıysa: kaçınca Tokyo görevi sorulur

  // ---------- bölüm ----------
  // Dünya koordinatı: y yukarı doğru AZALIR (ekranla aynı yön). Başlangıç zemini y = 0, portal y = -YUKSEKLIK.
  var YUKSEKLIK = 9000, CEKIM = 2200, ZIPLA = 1060, FIRLA = 1650, HIZ = 520;
  var LAV_HIZ0 = 55, LAV_HIZ1 = 110, LAV_UZAK = 1330; // lav hızı (başta/sonda, px/sn); kameranın bu kadar altından geri kalmaz
  var PG = 170; // platformun çarpışma genişliği
  function rasgele(o) { o.tohum = (o.tohum * 9301 + 49297) % 233280; return o.tohum / 233280; }

  function oyunBaslat() {
    var o = { t: 0, tohum: 7 + Math.floor(Math.random() * 1000), durum: "oyna", bitis: 0, kam: -Y + 260, lav: 420, can: 3, kristal: 0, ezilen: 0,
      k: { x: G / 2, y: 0, vx: 0, vy: -ZIPLA, yon: 1, dokunulmaz: 0 }, hedefX: null, sol: false, sag: false,
      platformlar: [], uzaylilar: [], kristaller: [], parcalar: [], soz: {}, mesaj: "", mesajSn: 0 };
    // başlangıç zemini: geniş, sağlam
    o.platformlar.push({ x: G / 2, y: 0, tur: "mor", g: 700, zemin: true });
    var y = -150, x = G / 2, n = 0;
    while (y > -YUKSEKLIK + 220) {
      var ilerleme = -y / YUKSEKLIK, r = rasgele(o);
      x = Math.max(110, Math.min(G - 110, x + (rasgele(o) - 0.5) * (360 + 160 * ilerleme)));
      var tur = n % 9 === 5 ? "pembe" : r < 0.12 + 0.28 * ilerleme ? "turuncu" : "mor";
      var p = { x: x, y: y, tur: tur, g: PG, vx: ilerleme > 0.45 && rasgele(o) < 0.3 ? (rasgele(o) < 0.5 ? -1 : 1) * (60 + 60 * ilerleme) : 0 };
      o.platformlar.push(p);
      // dağılan platformun yanına mutlaka sağlam bir yedek: çıkmaz olmasın
      if (tur === "turuncu") o.platformlar.push({ x: x < G / 2 ? x + 250 : x - 250, y: y - 20, tur: "mor", g: PG, vx: 0 });
      if (tur === "mor" && !p.vx && n > 4 && rasgele(o) < 0.05 + 0.06 * ilerleme) o.uzaylilar.push({ tur: "goz", x: x, y: y - 14, p: p, yon: 1 });
      else if (rasgele(o) < 0.5) o.kristaller.push({ x: x + (rasgele(o) - 0.5) * 80, y: y - 120 });
      if (n > 10 && n % 12 === 3) o.uzaylilar.push({ tur: "kanat", x: rasgele(o) * G, y: y - 90, yon: rasgele(o) < 0.5 ? -1 : 1, hiz: 110 + 90 * ilerleme });
      y -= 150 + rasgele(o) * (30 + 25 * ilerleme); n++;
    }
    o.platformlar.push({ x: G / 2, y: -YUKSEKLIK + 120, tur: "mor", g: 320, son: true });
    D.oyun = o; ekranAc("oyun"); muzikBasla(); cal("p_basla", 1);
  }

  function mesajVer(m, sn) { D.oyun.mesaj = m; D.oyun.mesajSn = sn; }
  function parca(o, x, y, renk, n) { for (var i = 0; i < n; i++) o.parcalar.push({ x: x, y: y, vx: (Math.random() - 0.5) * 420, vy: -Math.random() * 380, r: 6 + Math.random() * 8, renk: renk, sn: 0.6 }); }
  function incit(o) {
    var k = o.k; if (k.dokunulmaz > 0 || o.durum !== "oyna") return;
    o.can--; k.dokunulmaz = 1.5; k.vy = -ZIPLA * 0.8; cal("e_ah", 0.8);
    if (o.can <= 0) bitir(o, false, "Canın bitti!");
  }
  function bitir(o, kazandi, neden) {
    if (o.durum !== "oyna") return;
    o.durum = kazandi ? "kazandi" : "kayip"; o.bitis = 0; o.neden = neden; muzikDur();
    cal(kazandi ? "e_zafer" : "e_ah", 0.8);
  }
  function sonucGoster() {
    var o = D.oyun, kazandi = o.durum === "kazandi"; o.durum = "bitti";
    $("sonucBaslik").textContent = kazandi ? "Portaldan geçtin, eve döndün!" : (o.neden || "Lav seni yakaladı!");
    $("sonucYazi").textContent = kazandi ? "Zorgo'nun gezegeninden kaçtın. " + o.kristal + " kristal topladın. " + (FINALDEN ? "Tırtıl görevine devam etmeye hazır mısın?" : (SONRA ? "Tokyo'yu" : "Londra'yı") + " kurtarmaya şimdi hazır mısın?") : "Portala " + Math.max(0, Math.round((YUKSEKLIK + o.k.y) / 100)) + " adım kalmıştı. Bir daha dene!";
    $("londraGit").style.display = kazandi ? "" : "none"; $("tekrar").style.display = kazandi ? "none" : "";
    ekranAc("sonuc"); cal(kazandi ? "p_kazandin" : "p_kaybettin", 1);
  }

  // ---------- yönlendirme ----------
  function sahneX(e) { var r = tuval.getBoundingClientRect(), t = e.touches ? e.touches[0] : e; return (t.clientX - r.left) / r.width * G; }
  var basili = false;
  function dokun(e) { if (D.ekran !== "oyun") return; basili = true; D.oyun.hedefX = sahneX(e); e.preventDefault(); }
  function suruk(e) { if (D.ekran !== "oyun" || !basili) return; D.oyun.hedefX = sahneX(e); e.preventDefault(); }
  function birak() { basili = false; if (D.oyun) D.oyun.hedefX = null; }
  tuval.addEventListener("touchstart", dokun, { passive: false }); tuval.addEventListener("touchmove", suruk, { passive: false }); tuval.addEventListener("touchend", birak);
  tuval.addEventListener("mousedown", dokun); addEventListener("mousemove", suruk); addEventListener("mouseup", birak);
  var TUS = { ArrowLeft: "sol", KeyA: "sol", ArrowRight: "sag", KeyD: "sag" };
  addEventListener("keydown", function (e) { if (TUS[e.code] && D.oyun) { D.oyun[TUS[e.code]] = true; e.preventDefault(); } });
  addEventListener("keyup", function (e) { if (TUS[e.code] && D.oyun) { D.oyun[TUS[e.code]] = false; e.preventDefault(); } });

  // ---------- güncelleme ----------
  function guncelle(dt) {
    var o = D.oyun; if (!o || o.durum === "bitti") return;
    o.t += dt; if (o.mesajSn > 0) o.mesajSn -= dt;
    var k = o.k, i, p, e, m;
    for (i = o.parcalar.length - 1; i >= 0; i--) { m = o.parcalar[i]; m.vy += 1400 * dt; m.x += m.vx * dt; m.y += m.vy * dt; m.sn -= dt; if (m.sn <= 0) o.parcalar.splice(i, 1); }
    if (o.durum !== "oyna") {
      o.bitis += dt;
      if (o.durum === "kazandi") { k.x += (G / 2 - k.x) * Math.min(1, dt * 5); k.y += (-YUKSEKLIK - 60 - k.y) * Math.min(1, dt * 3); }
      else { k.vy += CEKIM * dt; k.y += k.vy * dt; o.lav -= 200 * dt; }
      if (o.bitis > (o.durum === "kazandi" ? 2.2 : 1.6)) sonucGoster();
      return;
    }
    // yatay: parmak hedefi ya da tuşlar
    var hedef = 0;
    if (o.hedefX != null) { var fark = o.hedefX - k.x; hedef = Math.abs(fark) < 12 ? 0 : Math.max(-1, Math.min(1, fark / 90)) * HIZ; }
    else hedef = ((o.sag ? 1 : 0) - (o.sol ? 1 : 0)) * HIZ;
    k.vx += (hedef - k.vx) * Math.min(1, dt * 14); if (Math.abs(k.vx) > 20) k.yon = k.vx > 0 ? 1 : -1;
    k.x += k.vx * dt; if (k.x < -30) k.x = G + 30; if (k.x > G + 30) k.x = -30; // kenardan öbür kenara geçer
    var oncekiY = k.y;
    k.vy += CEKIM * dt; if (k.vy > 1500) k.vy = 1500; k.y += k.vy * dt;
    if (k.dokunulmaz > 0) k.dokunulmaz -= dt;

    // platformlar: yalnız düşerken, ayak üstünden geçtiyse basılır
    for (i = o.platformlar.length - 1; i >= 0; i--) {
      p = o.platformlar[i];
      if (p.vx) { p.x += p.vx * dt; if (p.x < 100) p.vx = Math.abs(p.vx); if (p.x > G - 100) p.vx = -Math.abs(p.vx); }
      if (p.dagil > 0) { p.dagil -= dt; if (p.dagil <= 0) { o.platformlar.splice(i, 1); } continue; }
      if (k.vy > 0 && oncekiY <= p.y && k.y >= p.y && Math.abs(k.x - p.x) < p.g / 2 + 22) {
        k.y = p.y;
        if (p.tur === "pembe") { k.vy = -FIRLA; cal("e_firla", 0.5); parca(o, p.x, p.y, "#ff8fc0", 6); }
        else { k.vy = -ZIPLA; cal("e_pop", 0.35); }
        if (p.tur === "turuncu") { p.dagil = 0.25; parca(o, p.x, p.y, "#e8853a", 9); }
        p.ez = 0.18;
      }
      if (p.ez > 0) p.ez -= dt;
    }
    // uzaylılar
    for (i = o.uzaylilar.length - 1; i >= 0; i--) {
      e = o.uzaylilar[i];
      if (e.ezildi) { e.sn -= dt; e.y += 500 * dt; if (e.sn <= 0) o.uzaylilar.splice(i, 1); continue; }
      if (e.tur === "kanat") { e.x += e.yon * e.hiz * dt; if (e.x < 50) e.yon = 1; if (e.x > G - 50) e.yon = -1; }
      else if (e.p) { if (o.platformlar.indexOf(e.p) < 0) { o.uzaylilar.splice(i, 1); continue; } e.x = e.p.x + Math.sin(o.t * 1.5 + i) * 40; }
      var dx = Math.abs(k.x - e.x), ust = e.y - 78;
      if (dx < 48 && k.y > ust - 10 && k.y - 110 < e.y) {
        if (k.vy > 0 && oncekiY <= ust + 30) { e.ezildi = true; e.sn = 0.6; k.vy = -ZIPLA; o.ezilen++; cal("e_pop", 0.6); parca(o, e.x, e.y - 40, e.tur === "goz" ? "#2fb5b0" : "#9a62d0", 8); } // üstüne basınca ezilir
        else incit(o);
      }
    }
    // kristaller
    for (i = o.kristaller.length - 1; i >= 0; i--) {
      m = o.kristaller[i];
      if (Math.abs(m.x - k.x) < 60 && m.y < k.y + 20 && m.y > k.y - 140) { o.kristaller.splice(i, 1); o.kristal++; if (o.kristal % 6 === 0 && o.can < 3) { o.can++; mesajVer("+1 can!", 1.2); } cal("e_kalp", 0.4); parca(o, m.x, m.y, "#ffd23a", 5); }
    }
    // kamera: yalnız yukarı
    var hedefKam = k.y - Y * 0.55; if (hedefKam < o.kam) o.kam += (hedefKam - o.kam) * Math.min(1, dt * 6);
    if (o.kam < -YUKSEKLIK - 420) o.kam = -YUKSEKLIK - 420;
    // lav: yükselir, kameradan çok geride kalmaz
    var ilerleme = Math.min(1, -k.y / YUKSEKLIK);
    if (o.t > 3) o.lav -= (LAV_HIZ0 + (LAV_HIZ1 - LAV_HIZ0) * ilerleme) * dt; // ilk üç saniye lav bekler
    if (o.lav > o.kam + LAV_UZAK) o.lav = o.kam + LAV_UZAK;
    var lavUzak = o.lav - k.y;
    if (lavUzak < 330 && o.t > 6 && !o.soz.yakin) { o.soz.yakin = true; cal("p_yakin", 1); mesajVer("Lav çok yakın!", 1.6); }
    if (lavUzak > 700) o.soz.yakin = false;
    if (ilerleme > 0.8 && !o.soz.yari) { o.soz.yari = true; cal("p_yari", 1); mesajVer("Portal göründü!", 2); }
    if (k.y > o.lav + 10) { parca(o, k.x, o.lav, "#ff8a2a", 14); o.can = 0; bitir(o, false, "Lav seni yakaladı!"); } // lav tek dokunuşta bitirir; canlar yalnız canavarlar için
    // portal
    if (k.y < -YUKSEKLIK + 60 && Math.abs(k.x - G / 2) < 150) bitir(o, true);
  }

  // ---------- çizim ----------
  function yazi(m, x, y, boy, renk) {
    c.font = "bold " + boy + "px 'Arial Rounded MT Bold','Trebuchet MS',sans-serif"; c.lineWidth = Math.max(4, boy / 5); c.strokeStyle = "rgba(20,20,50,.8)"; c.lineJoin = "round";
    c.strokeText(m, x, y); c.fillStyle = renk || "#fff"; c.fillText(m, x, y);
  }
  function resim(im, x, y, yuk, cevir, alfa) { // x: merkez, y: alt kenar, yuk: çizim yüksekliği
    if (!im || !im.width) return;
    var g = im.width * yuk / im.height;
    c.save(); c.globalAlpha = alfa == null ? 1 : alfa; c.translate(x, y); if (cevir) c.scale(-1, 1); c.drawImage(im, -g / 2, -yuk, g, yuk); c.restore();
  }
  function ciz() {
    var o = D.oyun, poz = Math.floor(performance.now() / 1000 * POZ), i, p, e, m;
    c.fillStyle = "#3a4a8a"; c.fillRect(0, 0, G, Y);
    var ilerleme = o ? Math.max(0, Math.min(1, (-o.kam - Y + 260) / YUKSEKLIK + 0.02)) : 0;
    if (R.arka.width) { var ag = 1152, ay = 2064; c.drawImage(R.arka, (G - ag) / 2, -(ay - Y) * (1 - ilerleme), ag, ay); }
    if (!o) return;
    var k = o.k;
    c.save(); c.translate(0, -Math.round(o.kam));
    // portal
    var py = -YUKSEKLIK - 10;
    if (py > o.kam - 300) {
      c.save(); c.translate(G / 2, py - 110); c.rotate(Math.floor(o.t * POZ) / POZ * 2.2); var ps = 1 + (poz % 2 ? 0.04 : 0);
      if (R.portal.width) c.drawImage(R.portal, -130 * ps, -130 * ps, 260 * ps, 260 * ps); c.restore();
      c.textAlign = "center"; yazi("EVE DÖNÜŞ", G / 2, py - 260, 34, "#ffd23a");
    }
    for (i = 0; i < o.platformlar.length; i++) {
      p = o.platformlar[i]; if (p.y < o.kam - 80 || p.y > o.kam + Y + 120) continue;
      var im = R["p_" + p.tur], yuk = p.tur === "pembe" ? 86 : 70, gen = p.zemin ? 720 : p.son ? 340 : PG + 40;
      if (!im.width) continue;
      c.save(); c.globalAlpha = p.dagil > 0 ? Math.max(0, p.dagil / 0.25) : 1;
      c.drawImage(im, p.x - gen / 2 + (p.dagil > 0 && poz % 2 ? 4 : 0), p.y - 14 + (p.ez > 0 ? 6 : 0), gen, yuk); c.restore();
    }
    for (i = 0; i < o.kristaller.length; i++) { m = o.kristaller[i]; if (m.y > o.kam - 60 && m.y < o.kam + Y + 60) resim(R.kristal, m.x, m.y + 30 + ((poz + i) % 2 ? 3 : -3), 56); }
    for (i = 0; i < o.uzaylilar.length; i++) {
      e = o.uzaylilar[i]; if (e.y < o.kam - 100 || e.y > o.kam + Y + 100) continue;
      resim(e.tur === "goz" ? R.u_goz : R.u_kanat, e.x + ((poz + i) % 2 ? 2 : -2), e.y + (e.tur === "kanat" ? ((poz + i) % 2 ? 6 : -6) : 0), 82, e.yon < 0, e.ezildi ? Math.max(0, e.sn / 0.6) : 1);
    }
    // kahraman
    if (!(k.dokunulmaz > 0 && poz % 2)) {
      var kazan = o.durum === "kazandi", olc = kazan ? Math.max(0.1, 1 - o.bitis / 2.2) : 1;
      resim(R[KAHRAMAN + (k.vy < -150 ? "_uc" : "_dur")], k.x, k.y + 4, 128 * olc, k.yon < 0);
    }
    for (i = 0; i < o.parcalar.length; i++) { m = o.parcalar[i]; c.globalAlpha = Math.max(0, m.sn / 0.6); c.fillStyle = m.renk; c.beginPath(); c.arc(m.x, m.y, m.r, 0, 7); c.fill(); }
    c.globalAlpha = 1;
    // lav: hamur kıvamında dalgalı üst kenar
    var ly = o.lav, alt = o.kam + Y + 40;
    if (ly < alt) {
      // hamur lav şeridi: poz poz sağa sola kayar, altı düz hamur rengiyle dolar
      var lk = Math.round(Math.sin(poz * 0.45) * 5) * 60, lyy = ly - 34 + (poz % 2 ? 3 : -3);
      c.drawImage(R.lav, -360 + lk, lyy, 1440, 320);
      if (lyy + 300 < alt) { c.fillStyle = "#e2501c"; c.fillRect(0, lyy + 300, G, alt - lyy - 300); }
    }
    c.restore();
    // gösterge
    c.textAlign = "left";
    for (i = 0; i < 3; i++) resim(R.kalp, 140 + i * 52, 70, 46, false, i < o.can ? 1 : 0.25); // sol üst köşe ⏸ düğmesine ayrıldı
    yazi("✦ " + o.kristal, 286, 58, 32, "#ffd23a");
    // yükseklik çubuğu (sağda): kahraman ve lav
    var cy0 = 120, cb = 700, cx = G - 34, oran = function (yy) { return Math.max(0, Math.min(1, -yy / YUKSEKLIK)); };
    c.fillStyle = "rgba(20,25,60,.6)"; c.fillRect(cx - 8, cy0, 16, cb);
    c.fillStyle = "#ff6a1a"; var lh = cb * oran(o.lav); c.fillRect(cx - 8, cy0 + cb - lh, 16, lh);
    c.fillStyle = "#7fd3ff"; c.beginPath(); c.arc(cx, cy0 - 14, 14, 0, 7); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(cx, cy0 + cb - cb * oran(k.y), 11, 0, 7); c.fill();
    c.textAlign = "center";
    if (o.t < 5 && o.durum === "oyna") { yazi("Parmağını sağa sola kaydır!", G / 2, 200, 34, "#ffd23a"); yazi("Yukarıdaki portala ulaş, lavdan kaç!", G / 2, 246, 26); }
    if (o.mesajSn > 0) yazi(o.mesaj, G / 2, 320, 40, "#ffd23a");
    if (o.durum === "kazandi") yazi("Başardın!", G / 2, Y / 2, 64, "#ffd23a");
    if (o.durum === "kayip") yazi(o.neden || "Eyvah!", G / 2, Y / 2, 52, "#ffd23a");
  }

  var son = performance.now();
  function dongu(simdi) {
    var dt = Math.min(0.05, (simdi - son) / 1000); son = simdi;
    if (window.__durdu) { requestAnimationFrame(dongu); return; } // ⏸ menüsü açık
    if (D.ekran === "oyun") { var n = Math.max(1, Math.ceil(dt / 0.017)); for (var i = 0; i < n; i++) guncelle(dt / n); }
    ciz(); requestAnimationFrame(dongu);
  }
  requestAnimationFrame(dongu);

  window.__menu = { ekran: function () { return D.ekran; }, bolumVar: function () { return D.ekran === "oyun"; }, bolumBastan: function () { oyunBaslat(); } }; // ⏸ menüsü
  window.__oyun = { D: D, baslat: oyunBaslat, ilerlet: function (sn) { for (var t = 0; t < sn; t += 1 / 60) guncelle(1 / 60); }, sabit: { YUKSEKLIK: YUKSEKLIK } };
})();
