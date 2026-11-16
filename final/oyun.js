/* Hamur Kahraman: Kuleyi Yık (final). Yatay, 1280×720.
   Galata'daki mancınıkla Haliç'in karşısındaki uzaylı kulesi yıkılır. Üç kat (bölüm), sınırlı atış.
   Fizik bilerek basit: bloklar dönmez; düşer, kayar, üst üste oturur. Bütün görseller oyun hamuru. */
(function () {
  "use strict";
  var G = 1280, Y = 720, $ = function (i) { return document.getElementById(i); };
  var tuval = $("tuval"), c = tuval.getContext("2d"), sahne = $("sahne"), olcek = 1, kayX = 0, kayY = 0;
  function olcekle() {
    olcek = Math.min(innerWidth / G, innerHeight / Y); kayX = Math.round((innerWidth - G * olcek) / 2); kayY = Math.round((innerHeight - Y * olcek) / 2);
    sahne.style.transform = "translate(" + kayX + "px," + kayY + "px) scale(" + olcek + ")";
    $("dondur").style.display = innerHeight > innerWidth * 1.15 && innerWidth < 620 ? "flex" : "none";
  }
  addEventListener("resize", olcekle); olcekle();

  var BAG = new URLSearchParams(location.search), SERI = BAG.get("seri") === "kotu" ? "kotu" : "iyi";
  try { var tf = localStorage.getItem("hk_taraf"); if (!BAG.get("seri") && (tf === "iyi" || tf === "kotu")) SERI = tf; } catch (e) {}
  var KAH = SERI === "iyi" ? "kp_at" : "sp_at"; // Paris'ten dönen kahraman ressam kostümündedir
  var ILK_KAT = Math.max(1, Math.min(3, parseInt(BAG.get("kat") || "1", 10) || 1));

  var R = {};
  ["arka.jpg", "mancinik", "tas", "jole", "tahta", "tirtil", "zorgo", "top", "boyatop", "simit", "shuriken", KAH].forEach(function (a) {
    var im = new Image(); im.src = "varlik/" + (a.indexOf(".") > 0 ? a : a + ".png"); R[a.replace(".jpg", "")] = im;
  });
  var S = {};
  ["muzik", "e_pop", "e_ah", "e_zafer", "e_simit", "e_meteor", "a_fbasla", "p_fkat", "a_fkazan", "a_fkayip"].forEach(function (a) { var s = new Audio("ses/" + a + ".mp3"); s.preload = "auto"; S[a] = s; });
  S.muzik.loop = true; S.muzik.volume = 0.22;
  function cal(a, v) { try { var s = S[a].cloneNode(); s.volume = v == null ? 1 : v; var p = s.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
  function muzik(ac) { try { if (ac) { var p = S.muzik.play(); if (p && p.catch) p.catch(function () {}); } else S.muzik.pause(); } catch (e) {} }

  // ---------- sahne ölçüleri (arka plandan ölçüldü) ----------
  var BALKON = 393, BALKON_X = 455, YER = 520, KIYI = 552, CEKIM = 1100;
  var ATIS = { x: 392, y: 258 }, AZAMI_CEKME = 165, GUC = 7.2;
  var TOPLAR = {
    hamur: { ad: "Hamur top", r: 22, sek: 0.3, res: "top" },
    simit: { ad: "Simit: seker", r: 22, sek: 0.72, res: "simit" },
    yildiz: { ad: "Ninja yıldızı: havada dokun, üçe bölünür", r: 20, sek: 0.3, res: "shuriken" },
    boya: { ad: "Boya topu: çarpınca patlar", r: 23, sek: 0.2, res: "boyatop" }
  };
  var CAN = { tas: 3, jole: 1, tahta: 2, tirtil: 1, zorgo: 3 };

  // Kat tanımları. b(tip, x, kat yüksekliği) yardımcılarıyla aşağıdan yukarı kurulur.
  function kule(liste, x, katlar, ustte) {      // katlar: ["jole","tas"...] her kat iki sütun + tahta; arada tırtıl
    var y = YER, i;
    for (i = 0; i < katlar.length; i++) {
      var k = katlar[i];
      liste.push({ tip: k.s, x: x, y: y - 64, w: 64, h: 64 }, { tip: k.s, x: x + 128, y: y - 64, w: 64, h: 64 });
      if (k.u) liste.push({ tip: "tirtil", x: x + 70, y: y - 70, w: 52, h: 70 });
      liste.push({ tip: "tahta", x: x, y: y - 64 - 26, w: 192, h: 26 });
      y -= 90;
    }
    if (ustte === "zorgo") liste.push({ tip: "zorgo", x: x + 52, y: y - 112, w: 88, h: 112 });
    else if (ustte) liste.push({ tip: "tirtil", x: x + 70, y: y - 70, w: 52, h: 70 });
  }
  function sutun(liste, x, tipler, ustte) {
    var y = YER; tipler.forEach(function (t) { liste.push({ tip: t, x: x, y: y - 64, w: 64, h: 64 }); y -= 64; });
    if (ustte) liste.push({ tip: "tirtil", x: x + 6, y: y - 70, w: 52, h: 70 });
  }
  var KATLAR = [
    { ad: "1. kat", atis: ["hamur", "hamur", "hamur", "simit", "simit", "hamur"], kur: function (l) {
        kule(l, 790, [{ s: "jole", u: 1 }], "tirtil"); sutun(l, 1080, ["tas"], 1); } },
    { ad: "2. kat", atis: ["hamur", "hamur", "simit", "simit", "yildiz", "yildiz", "hamur"], kur: function (l) {
        kule(l, 770, [{ s: "tas", u: 1 }, { s: "jole", u: 1 }], "tirtil"); sutun(l, 1060, ["jole", "tas"], 1); } },
    { ad: "Zorgo'nun kulesi", atis: ["hamur", "simit", "yildiz", "boya", "hamur", "simit", "yildiz", "boya", "hamur"], kur: function (l) {
        kule(l, 760, [{ s: "tas", u: 1 }, { s: "tas", u: 1 }, { s: "jole", u: 0 }], "zorgo");
        sutun(l, 1030, ["tas", "jole"], 1); sutun(l, 1150, ["jole"], 1); } }
  ];

  var D = { ekran: "kapak", oyun: null };
  function ekranAc(ad) { D.ekran = ad; ["kapak", "sonuc"].forEach(function (e) { $(e).classList.toggle("acik", e === ad); }); }

  function katKur(no, puan) {
    var l = []; KATLAR[no].kur(l);
    l.forEach(function (b) { b.can = CAN[b.tip]; b.vx = 0; b.vy = 0; b.olu = false; b.sars = 0; });
    return { kat: no, t: 0, cisim: l, toplar: [], atis: KATLAR[no].atis.slice(), durum: "nisan", bekle: 0, cek: null, puan: puan || 0,
      parcalar: [], mesaj: KATLAR[no].ad, mesajSn: 2.2, kol: 0, yildizHazir: false };
  }
  function mesajVer(o, m, sn) { o.mesaj = m; o.mesajSn = sn; }
  function baslat(no) { D.oyun = katKur(no == null ? ILK_KAT - 1 : no, 0); ekranAc("oyun"); muzik(true); cal("a_fbasla", 1); }
  function uzayliSay(o) { return o.cisim.filter(function (b) { return !b.olu && (b.tip === "tirtil" || b.tip === "zorgo"); }).length; }

  function parca(o, x, y, res, n) {
    for (var i = 0; i < n; i++) o.parcalar.push({ x: x, y: y, vx: (Math.random() - 0.5) * 420, vy: -120 - Math.random() * 320, sn: 0.7 + Math.random() * 0.4, res: res, b: 10 + Math.random() * 12 });
  }
  function hasar(o, b, n) {
    if (b.olu) return; b.can -= n; b.sars = 0.25;
    if (b.can <= 0) {
      b.olu = true; var uz = b.tip === "tirtil" || b.tip === "zorgo";
      parca(o, b.x + b.w / 2, b.y + b.h / 2, b.tip, uz ? 9 : 6); o.puan += b.tip === "zorgo" ? 500 : uz ? 100 : 20;
      cal(uz ? "e_ah" : "e_pop", uz ? 0.8 : 0.5);
      if (b.tip === "zorgo") mesajVer(o, "Zorgo düştü!", 2);
    } else cal("e_pop", 0.3);
  }

  // ---------- fizik ----------
  function ortusme(a0, a1, b0, b1) { return Math.min(a1, b1) - Math.max(a0, b0); }
  function cisimAdim(o, dt) {
    var l = o.cisim.filter(function (b) { return !b.olu; }), i, j;
    l.sort(function (a, b) { return (b.y + b.h) - (a.y + a.h); });
    for (i = 0; i < l.length; i++) {
      var b = l[i], orta = b.x + b.w / 2, taban = orta > KIYI ? YER - b.h : 900, altlar = [];
      for (j = 0; j < l.length; j++) {
        var k = l[j]; if (k === b || k.olu) continue;
        if (ortusme(b.x, b.x + b.w, k.x, k.x + k.w) > 6 && k.y >= b.y + b.h - 4) { if (k.y - b.h < taban) { taban = k.y - b.h; altlar = [k]; } else if (k.y - b.h === taban) altlar.push(k); }
      }
      b.vy += CEKIM * dt; var ny = b.y + b.vy * dt, yerde = false;
      if (ny >= taban) {
        if (b.vy > 380) { hasar(o, b, b.tip === "tirtil" || b.tip === "zorgo" ? (b.vy > 520 ? 3 : 1) : 1); altlar.forEach(function (k) { if (b.vy > 480) hasar(o, k, 1); }); }
        b.y = taban; b.vy = 0; yerde = true;
      } else b.y = ny;
      if (b.y > 760) { hasar(o, b, 9); continue; }               // suya düştü
      // Ağırlık merkezi hiçbir desteğin üstünde değilse kayar (dönme yok, devrilme yerine)
      if (yerde && altlar.length) {
        var ustunde = altlar.some(function (k) { return orta > k.x - 2 && orta < k.x + k.w + 2; });
        if (!ustunde) { var m = 0; altlar.forEach(function (k) { m += k.x + k.w / 2; }); b.vx += (orta > m / altlar.length ? 1 : -1) * 520 * dt; }
      }
      if (Math.abs(b.vx) > 4) {
        var nx = b.x + b.vx * dt, carpti = null;
        for (j = 0; j < l.length; j++) {
          var q = l[j]; if (q === b || q.olu) continue;
          if (ortusme(nx, nx + b.w, q.x, q.x + q.w) > 0 && ortusme(b.y, b.y + b.h, q.y, q.y + q.h) > 6) { carpti = q; break; }
        }
        if (carpti) { carpti.vx += b.vx * 0.7; if (Math.abs(b.vx) > 260) hasar(o, carpti, 1); b.vx *= -0.1; } else b.x = nx;
        if (yerde) b.vx *= Math.pow(0.02, dt); else b.vx *= Math.pow(0.6, dt);
      } else b.vx = 0;
      if (b.sars > 0) b.sars -= dt;
    }
  }
  function patlat(o, t) {
    cal("e_meteor", 0.5); parca(o, t.x, t.y, "boyatop", 14); t.bitti = true;
    o.cisim.forEach(function (b) {
      if (b.olu) return; var dx = b.x + b.w / 2 - t.x, dy = b.y + b.h / 2 - t.y, u = Math.sqrt(dx * dx + dy * dy);
      if (u < 150) { hasar(o, b, u < 85 ? 2 : 1); b.vx += (dx >= 0 ? 1 : -1) * (260 - u); }
    });
  }
  function topAdim(o, t, dt) {
    t.sn += dt; t.vy += CEKIM * dt; t.x += t.vx * dt; t.y += t.vy * dt; t.aci += t.vx * dt * 0.02;
    var tur = TOPLAR[t.tip], i;
    for (i = 0; i < o.cisim.length; i++) {
      var b = o.cisim[i]; if (b.olu) continue;
      var px = Math.max(b.x, Math.min(t.x, b.x + b.w)), py = Math.max(b.y, Math.min(t.y, b.y + b.h)), dx = t.x - px, dy = t.y - py, u2 = dx * dx + dy * dy;
      if (u2 >= t.r * t.r) continue;
      var u = Math.sqrt(u2), nx, ny;
      if (u < 0.01) { nx = 0; ny = -1; u = 0; } else { nx = dx / u; ny = dy / u; }
      var vn = t.vx * nx + t.vy * ny;
      t.x += nx * (t.r - u); t.y += ny * (t.r - u);
      if (vn < 0) {
        var darbe = -vn;
        if (t.tip === "boya") { patlat(o, t); return; }
        if (darbe > 230) hasar(o, b, darbe > 760 ? 2 : 1);
        b.vx -= nx * darbe * (b.tip === "tas" ? 0.3 : 0.5);
        t.vx -= (1 + tur.sek) * vn * nx; t.vy -= (1 + tur.sek) * vn * ny; t.vx *= 0.92; t.sekme++;
        if (t.tip === "simit" && darbe > 200) cal("e_simit", 0.4);
      }
    }
    if (t.x > KIYI && t.y + t.r > YER) {                       // karşı kıyının zemini
      if (t.tip === "boya") { patlat(o, t); return; }
      t.y = YER - t.r; if (t.vy > 0) { t.vy = -t.vy * tur.sek; t.vx *= 0.82; t.sekme++; }
    }
    if (t.x < BALKON_X && t.y + t.r > BALKON && t.y < BALKON + 30 && t.vy > 0) { t.y = BALKON - t.r; t.vy = -t.vy * tur.sek; t.vx *= 0.8; }
    if (t.x <= KIYI && t.y > 640 && !t.bitti) { t.bitti = true; parca(o, t.x, 640, "jole", 5); cal("e_pop", 0.3); }
    var hiz = Math.abs(t.vx) + Math.abs(t.vy);
    if (hiz < 60 && t.y + t.r >= YER - 2) t.dur += dt; else t.dur = 0;
    if (t.x > G + 60 || t.x < -60 || t.y > Y + 60 || t.dur > 0.5 || t.sn > 7) t.bitti = true;
  }
  function firlat(o, vx, vy) {
    var tip = o.atis.shift();
    o.toplar.push({ tip: tip, x: ATIS.x, y: ATIS.y, vx: vx, vy: vy, r: TOPLAR[tip].r, sn: 0, sekme: 0, dur: 0, aci: 0, bitti: false });
    o.durum = "ucus"; o.kol = 0.25; o.yildizHazir = tip === "yildiz"; cal("e_simit", 0.5);
  }
  function bol(o) {
    var t = o.toplar[0]; if (!o.yildizHazir || !t || t.bitti) return;
    o.yildizHazir = false; cal("e_pop", 0.5);
    [-190, 190].forEach(function (ek) { o.toplar.push({ tip: "yildiz", x: t.x, y: t.y, vx: t.vx, vy: t.vy + ek, r: t.r, sn: t.sn, sekme: 0, dur: 0, aci: 0, bitti: false }); });
  }
  function hareketli(o) { return o.cisim.some(function (b) { return !b.olu && (Math.abs(b.vx) > 8 || Math.abs(b.vy) > 8); }); }

  function guncelle(dt) {
    var o = D.oyun; if (!o || D.ekran !== "oyun") return;
    o.t += dt; if (o.mesajSn > 0) o.mesajSn -= dt; if (o.kol > 0) o.kol -= dt;
    cisimAdim(o, dt);
    o.toplar.forEach(function (t) { if (!t.bitti) topAdim(o, t, dt); });
    o.parcalar.forEach(function (p) { p.sn -= dt; p.vy += CEKIM * dt; p.x += p.vx * dt; p.y += p.vy * dt; });
    o.parcalar = o.parcalar.filter(function (p) { return p.sn > 0; });
    if (o.durum === "ucus" && o.toplar.every(function (t) { return t.bitti; }) && !hareketli(o)) { o.durum = "bekle"; o.bekle = 0.7; o.toplar = []; }
    if (o.durum === "bekle") {
      o.bekle -= dt;
      if (o.bekle <= 0) {
        if (hareketli(o)) { o.bekle = 0.3; return; }
        if (uzayliSay(o) === 0) katBitti(o);
        else if (o.atis.length) { o.durum = "nisan"; mesajVer(o, TOPLAR[o.atis[0]].ad, 2.2); }
        else bitir(false);
      }
    }
    if (o.durum === "gecis") { o.bekle -= dt; if (o.bekle <= 0) { var p = o.puan; D.oyun = katKur(o.kat + 1, p); } }
  }
  function katBitti(o) {
    o.puan += o.atis.length * 150;
    if (o.kat + 1 < KATLAR.length) { o.durum = "gecis"; o.bekle = 2.2; mesajVer(o, "Yıkıldı! Sıradaki kat!", 2.2); cal("p_fkat", 1); cal("e_zafer", 0.4); }
    else bitir(true);
  }
  function bitir(kazandi) {
    var o = D.oyun; o.durum = "bitti"; muzik(false);
    $("sonucBaslik").textContent = kazandi ? "İstanbul kurtuldu!" : "Toplar bitti!";
    $("sonucYazi").textContent = kazandi ? "Zorgo yenildi, istila bitti. Bütün dünya senin sayende kurtuldu! Puan: " + o.puan
      : "Kulede hâlâ " + uzayliSay(o) + " uzaylı var. Bir daha dene!";
    $("tekrar").style.display = kazandi ? "none" : ""; $("bastan").style.display = kazandi ? "" : "none";
    cal(kazandi ? "a_fkazan" : "a_fkayip", 1); if (kazandi) cal("e_zafer", 0.6);
    try { if (kazandi) localStorage.setItem("hk_final", "1"); } catch (e) {}
    setTimeout(function () { if (D.oyun === o && o.durum === "bitti") ekranAc("sonuc"); }, kazandi ? 1400 : 700);
  }

  // ---------- nişan ----------
  function nokta(e) { return { x: (e.clientX - kayX) / olcek, y: (e.clientY - kayY) / olcek }; }
  function cekme(o) {
    if (!o.cek) return null; var dx = o.cek.x0 - o.cek.x, dy = o.cek.y0 - o.cek.y, u = Math.sqrt(dx * dx + dy * dy);
    if (u > AZAMI_CEKME) { dx *= AZAMI_CEKME / u; dy *= AZAMI_CEKME / u; u = AZAMI_CEKME; }
    return { dx: dx, dy: dy, u: u };
  }
  tuval.addEventListener("pointerdown", function (e) {
    var o = D.oyun; if (!o || D.ekran !== "oyun") return; var p = nokta(e);
    if (o.durum === "ucus") { bol(o); return; }
    if (o.durum === "nisan") { o.cek = { x0: p.x, y0: p.y, x: p.x, y: p.y }; try { tuval.setPointerCapture(e.pointerId); } catch (h) {} }
  });
  tuval.addEventListener("pointermove", function (e) { var o = D.oyun; if (o && o.cek) { var p = nokta(e); o.cek.x = p.x; o.cek.y = p.y; } });
  function birak() {
    var o = D.oyun; if (!o || !o.cek) return; var k = cekme(o); o.cek = null;
    if (k.u < 28 || k.dx < 10) { mesajVer(o, "Parmağını sola doğru geri çek!", 1.6); return; }
    firlat(o, k.dx * GUC, k.dy * GUC);
  }
  tuval.addEventListener("pointerup", birak); tuval.addEventListener("pointercancel", birak);

  // ---------- çizim ----------
  function resim(ad, x, y, w, h) { var im = R[ad]; if (im && im.complete && im.naturalWidth) c.drawImage(im, x, y, w, h); }
  function ciz() {
    var o = D.oyun; c.clearRect(0, 0, G, Y); resim("arka", 0, 0, G, Y); if (!o) return;
    var kare = Math.floor(o.t * 12), i;
    // kahraman ve mancınık
    resim(KAH, 60, BALKON - 168, 127, 168);
    c.save(); c.translate(320, BALKON); c.rotate(o.kol > 0 ? -0.16 : 0); resim("mancinik", -106, -168, 213, 170); c.restore();
    // bloklar ve uzaylılar
    o.cisim.forEach(function (b) {
      if (b.olu) return; var sx = b.sars > 0 ? (kare % 2 ? 3 : -3) : 0, uz = b.tip === "tirtil" || b.tip === "zorgo";
      if (uz) { var zip = (kare + Math.round(b.x)) % 6 < 2 ? -4 : 0; resim(b.tip, b.x - 6 + sx, b.y - 6 + zip, b.w + 12, b.h + 8); }
      else {
        resim(b.tip, b.x + sx, b.y, b.w, b.h);
        var eksik = CAN[b.tip] - b.can; if (eksik > 0) { c.fillStyle = "rgba(20,10,30," + (0.2 * eksik) + ")"; c.fillRect(b.x + sx + 3, b.y + 3, b.w - 6, b.h - 6); }
      }
    });
    // nişan çizgisi
    var k = o.durum === "nisan" ? cekme(o) : null, tx = ATIS.x, ty = ATIS.y;
    if (k && k.u > 12) {
      tx = ATIS.x - k.dx * 0.35; ty = ATIS.y - k.dy * 0.35;
      var vx = k.dx * GUC, vy = k.dy * GUC;
      for (i = 1; i <= 9; i++) { var s = i * 0.085, px = ATIS.x + vx * s, py = ATIS.y + vy * s + 0.5 * CEKIM * s * s; resim("top", px - 7, py - 7, 14, 14); }
    }
    if (o.durum === "nisan" && o.atis.length) { var tr = TOPLAR[o.atis[0]]; resim(tr.res, tx - tr.r, ty - tr.r, tr.r * 2, tr.r * 2); }
    o.toplar.forEach(function (t) {
      if (t.bitti) return; var r = TOPLAR[t.tip]; c.save(); c.translate(t.x, t.y); c.rotate(Math.round(t.aci * 4) / 4); resim(r.res, -t.r, -t.r, t.r * 2, t.r * 2); c.restore();
    });
    o.parcalar.forEach(function (p) { resim(p.res === "tirtil" || p.res === "zorgo" ? "jole" : p.res, p.x - p.b / 2, p.y - p.b / 2, p.b, p.b); });
    // gösterge
    c.fillStyle = "rgba(20,16,60,.62)"; yuvarlak(14, 12, 300, 54, 26); c.fillStyle = "#fff"; c.font = "26px 'Arial Rounded MT Bold','Trebuchet MS',sans-serif"; c.textBaseline = "middle"; c.textAlign = "left";
    c.fillText(KATLAR[o.kat].ad + "  ·  " + uzayliSay(o) + " uzaylı", 32, 40);
    c.fillStyle = "rgba(20,16,60,.62)"; yuvarlak(G - 214, 12, 200, 54, 26); c.fillStyle = "#ffd23a"; c.textAlign = "right"; c.fillText("Puan " + o.puan, G - 32, 40);
    for (i = 0; i < o.atis.length; i++) { var a = TOPLAR[o.atis[i]], b2 = i === 0 ? 46 : 34; resim(a.res, 22 + i * 44 + (i ? 12 : 0), Y - 20 - b2, b2, b2); }
    if (o.mesajSn > 0) {
      c.font = "34px 'Arial Rounded MT Bold','Trebuchet MS',sans-serif"; c.textAlign = "center"; var gn = c.measureText(o.mesaj).width + 60;
      c.fillStyle = "rgba(20,16,60,.72)"; yuvarlak(G / 2 - gn / 2, 84, gn, 60, 30); c.fillStyle = "#fff"; c.fillText(o.mesaj, G / 2, 115);
    }
    if (o.yildizHazir && o.durum === "ucus") { c.font = "26px 'Arial Rounded MT Bold','Trebuchet MS',sans-serif"; c.textAlign = "center"; c.fillStyle = "#ffd23a"; c.fillText("Dokun: yıldız üçe bölünsün!", G / 2, 170); }
  }
  function yuvarlak(x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.fill(); }

  var son = 0;
  function dongu(z) { var dt = Math.min(0.05, (z - son) / 1000 || 0); son = z; var n = Math.max(1, Math.round(dt * 120)); for (var i = 0; i < n; i++) guncelle(dt / n); ciz(); requestAnimationFrame(dongu); }
  requestAnimationFrame(dongu);

  // ---------- film ve düğmeler ----------
  function filmOynat(sonra) {
    var f = $("film"), g = $("gec"), bitti = false;
    function kapat() { if (bitti) return; bitti = true; f.pause(); f.style.display = "none"; g.style.display = "none"; sonra(); }
    if (BAG.get("film") === "0") { sonra(); return; }
    f.src = "video/giris.mp4"; f.style.display = "block"; g.style.display = "block"; f.onended = kapat; f.onerror = kapat; g.onclick = kapat;
    var p = f.play(); if (p && p.catch) p.catch(kapat);
  }
  $("basla").addEventListener("click", function () { ekranAc("oyun"); filmOynat(function () { baslat(); }); });
  $("tekrar").addEventListener("click", function () { var o = D.oyun; D.oyun = katKur(o.kat, 0); ekranAc("oyun"); muzik(true); });
  $("bastan").addEventListener("click", function () { baslat(0); });

  window.__oyun = { D: D, baslat: baslat, at: function (dx, dy) { var o = D.oyun; if (o.durum !== "nisan") return false; firlat(o, dx * GUC, dy * GUC); return true; }, bol: function () { bol(D.oyun); },
    ilerlet: function (sn) { for (var t = 0; t < sn; t += 1 / 120) guncelle(1 / 120); ciz(); var o = D.oyun; return { kat: o.kat, durum: o.durum, uzayli: uzayliSay(o), atis: o.atis.length, puan: o.puan }; } };
})();
