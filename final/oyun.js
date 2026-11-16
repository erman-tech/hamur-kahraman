/* Hamur Kahraman: Kuleyi Yık (final). Yatay, 1280×720.
   Tek oyun: Galata'daki mancınıktan 5 simitle Haliç'in karşısındaki büyük uzaylı kulesi yıkılır.
   Yarışma: kuleyi kaç simitle yıktın (az olan iyi); rekor saklanır.
   Kurgu sapan türü oyunlardaki gibi: simidi geri çek, ipler gerilir, bırak. Görseller ve kule bizim tasarımımız.
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
  var KAH = SERI === "iyi" ? "ka_at" : "sa_at"; // Los Angeles'tan dönen kahraman film yıldızı kostümündedir

  var R = {};
  ["arka.jpg", "mancinik", "tas", "jole", "tahta", "tirtil", "tirtil2", "tirtil3", "zorgo", "simit", KAH].forEach(function (a) {
    var im = new Image(); im.dene = 0; im.onerror = function () { var b = this; if (b.dene++ < 4) setTimeout(function () { b.src = b.src.split("?")[0] + "?d=" + b.dene; }, 600 * b.dene); }; // yavaş ağda yüklenemeyen görsel yeniden denenir
    im.src = "varlik/" + (a.indexOf(".") > 0 ? a : a + ".png"); R[a.replace(".jpg", "")] = im;
  });
  var S = {};
  ["muzik", "e_pop", "e_ah", "e_zafer", "e_simit", "a_fbasla", "a_fkazan", "a_fkayip"].forEach(function (a) { var s = new Audio("ses/" + a + ".mp3"); s.preload = "auto"; S[a] = s; });
  S.muzik.loop = true; S.muzik.volume = 0.22;
  function cal(a, v) { try { var s = S[a].cloneNode(); s.volume = v == null ? 1 : v; var p = s.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
  function muzik(ac) { try { if (ac) { var p = S.muzik.play(); if (p && p.catch) p.catch(function () {}); } else S.muzik.pause(); } catch (e) {} }

  // ---------- sahne ölçüleri (arka plandan ölçüldü) ----------
  var BALKON = 399, BALKON_X = 308, YER = 526, KIYI = 788, CEKIM = 1100;   // Haliç: 308–788 arası su
  var ATIS = { x: 172, y: 309 }, AZAMI_CEKME = 165, GUC = 7.2, GERME = 0.6;   // GERME: simidin parmakla birlikte geri gelme oranı
  var SIMIT = 5, SIMIT_R = 16, SEK = 0.45;
  var B = 40, TH = 16, KAT = B + TH;                                         // blok kenarı, tahta kalınlığı, kat yüksekliği
  var CAN = { tas: 2, jole: 1, tahta: 1, tirtil: 1, tirtil2: 1, tirtil3: 1, zorgo: 3 };
  function uzayliMi(b) { return b.tip.charAt(0) === "t" && b.tip !== "tas" && b.tip !== "tahta" || b.tip === "zorgo"; }

  // Kule aşağıdan yukarı kurulur. Bir "göz": iki sütun + üstünde tahta; arasında uzaylı tırtıl olabilir.
  function goz(l, x, kat, sutun, tirtil) {
    var y = YER - kat * KAT;
    l.push({ tip: sutun, x: x, y: y - B, w: B, h: B }, { tip: sutun, x: x + 2 * B, y: y - B, w: B, h: B });
    if (tirtil) l.push({ tip: "tirtil", x: x + B + 5, y: y - 36, w: 30, h: 36 });
    l.push({ tip: "tahta", x: x, y: y - KAT, w: 3 * B, h: TH });
  }
  function tepe(l, x, kat, tip) {
    var y = YER - kat * KAT;
    if (tip === "zorgo") l.push({ tip: "zorgo", x: x + 34, y: y - 92, w: 52, h: 92 }); else l.push({ tip: tip, x: x + B + 3, y: y - 54, w: 34, h: 54 });
  }
  function kuleKur(l) {
    var A = 806, M = 926, C = 1046;                 // üç bitişik kanat: sol (2 kat), orta (5 kat, tepede Zorgo), sağ (3 kat)
    goz(l, A, 0, "jole", 1); goz(l, A, 1, "tas", 0); tepe(l, A, 2, "tirtil2");
    goz(l, M, 0, "tas", 1); goz(l, M, 1, "tas", 0); goz(l, M, 2, "jole", 1); goz(l, M, 3, "tas", 0); goz(l, M, 4, "jole", 1); tepe(l, M, 5, "zorgo");
    goz(l, C, 0, "tas", 0); goz(l, C, 1, "jole", 1); goz(l, C, 2, "jole", 0); tepe(l, C, 3, "tirtil3");
    // sağda tek başına nöbetçi sütunu
    [0, 1, 2].forEach(function (i) { l.push({ tip: i === 1 ? "jole" : "tas", x: 1206, y: YER - (i + 1) * B, w: B, h: B }); });
    l.push({ tip: "tirtil2", x: 1209, y: YER - 3 * B - 54, w: 34, h: 54 });
  }

  var D = { ekran: "kapak", oyun: null };
  function ekranAc(ad) { D.ekran = ad; ["kapak", "sonuc"].forEach(function (e) { $(e).classList.toggle("acik", e === ad); }); }
  function rekorOku() { try { var r = parseInt(localStorage.getItem("hk_final_rekor"), 10); return r >= 1 && r <= SIMIT ? r : null; } catch (e) { return null; } }
  function rekorYaz(n) { try { var r = rekorOku(); if (!r || n < r) { localStorage.setItem("hk_final_rekor", String(n)); return true; } } catch (e) {} return false; }
  function rekorGoster() { var r = rekorOku(); $("rekor").textContent = r ? "Rekorun: " + r + " simit" : "5 simitin var. Kaç simitle yıkacaksın?"; }
  rekorGoster();

  function yeniOyun() {
    var l = []; kuleKur(l);
    l.forEach(function (b) { b.can = CAN[b.tip]; b.vx = 0; b.vy = 0; b.olu = false; b.sars = 0; });
    return { t: 0, cisim: l, toplar: [], simit: SIMIT, atilan: 0, toplam: l.filter(uzayliMi).length,
      durum: "nisan", bekle: 0, cek: null, parcalar: [], mesaj: "5 simitle kuleyi yık!", mesajSn: 2.6, kol: 0 };
  }
  function mesajVer(o, m, sn) { o.mesaj = m; o.mesajSn = sn; }
  function baslat() { D.oyun = yeniOyun(); ekranAc("oyun"); muzik(true); cal("a_fbasla", 1); }
  function uzayliSay(o) { return o.cisim.filter(function (b) { return !b.olu && uzayliMi(b); }).length; }

  function parca(o, x, y, res, n) {
    for (var i = 0; i < n; i++) o.parcalar.push({ x: x, y: y, vx: (Math.random() - 0.5) * 420, vy: -120 - Math.random() * 320, sn: 0.7 + Math.random() * 0.4, res: res, b: 8 + Math.random() * 10 });
  }
  function hasar(o, b, n) {
    if (b.olu) return; b.can -= n; b.sars = 0.25;
    if (b.can <= 0) {
      b.olu = true; var uz = uzayliMi(b);
      parca(o, b.x + b.w / 2, b.y + b.h / 2, uz ? "jole" : b.tip, uz ? 9 : 6); cal(uz ? "e_ah" : "e_pop", uz ? 0.8 : 0.5);
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
      if (b.olu) continue;
      for (j = 0; j < l.length; j++) {
        var k = l[j]; if (k === b || k.olu) continue;
        if (ortusme(b.x, b.x + b.w, k.x, k.x + k.w) > 5 && k.y >= b.y + b.h - 4) { if (k.y - b.h < taban) { taban = k.y - b.h; altlar = [k]; } else if (k.y - b.h === taban) altlar.push(k); }
      }
      b.vy += CEKIM * dt; var ny = b.y + b.vy * dt, yerde = false;
      if (ny >= taban) {
        var v = b.vy;                                   // bir kat yükseklikten düşen uzaylı ölür; ağır düşen parça altındakini de ezer
        if (v > 330) { hasar(o, b, uzayliMi(b) ? (v > 480 ? 3 : 1) : 1); if (v > 430) altlar.forEach(function (q) { hasar(o, q, uzayliMi(q) ? 3 : 1); }); }
        b.y = taban; b.vy = 0; yerde = true;
      } else b.y = ny;
      if (b.y > 760) { hasar(o, b, 9); continue; }     // suya düştü
      // Ağırlık merkezi hiçbir desteğin üstünde değilse kayar (dönme yok, devrilme yerine)
      if (yerde && altlar.length) {
        var sol = Infinity, sag = -Infinity; altlar.forEach(function (q) { sol = Math.min(sol, q.x); sag = Math.max(sag, q.x + q.w); });
        var ustunde = orta > sol - 2 && orta < sag + 2;      // ağırlık merkezi desteklerin arasındaysa durur (iki sütuna oturan tahta)
        if (!ustunde) { var m = 0; altlar.forEach(function (q) { m += q.x + q.w / 2; }); b.vx += (orta > m / altlar.length ? 1 : -1) * 520 * dt; }
      }
      if (Math.abs(b.vx) > 4) {
        var nx = b.x + b.vx * dt, carpti = null;
        for (j = 0; j < l.length; j++) {
          var q2 = l[j]; if (q2 === b || q2.olu) continue;
          if (ortusme(nx, nx + b.w, q2.x, q2.x + q2.w) > 0 && ortusme(b.y, b.y + b.h, q2.y, q2.y + q2.h) > 5) { carpti = q2; break; }
        }
        if (carpti) { carpti.vx += b.vx * 0.7; if (Math.abs(b.vx) > 240) hasar(o, carpti, 1); b.vx *= -0.1; } else b.x = nx;
        b.vx *= Math.pow(yerde ? 0.02 : 0.6, dt);
      } else b.vx = 0;
      if (b.sars > 0) b.sars -= dt;
    }
  }
  function topAdim(o, t, dt) {
    t.sn += dt; t.vy += CEKIM * dt; t.x += t.vx * dt; t.y += t.vy * dt; t.aci += t.vx * dt * 0.02;
    for (var i = 0; i < o.cisim.length; i++) {
      var b = o.cisim[i]; if (b.olu) continue;
      var px = Math.max(b.x, Math.min(t.x, b.x + b.w)), py = Math.max(b.y, Math.min(t.y, b.y + b.h)), dx = t.x - px, dy = t.y - py, u2 = dx * dx + dy * dy;
      if (u2 >= t.r * t.r) continue;
      var u = Math.sqrt(u2), nx, ny;
      if (u < 0.01) { nx = 0; ny = -1; u = 0; } else { nx = dx / u; ny = dy / u; }
      var vn = t.vx * nx + t.vy * ny;
      if (vn < 0) {
        var darbe = -vn;
        if (darbe > 180) hasar(o, b, darbe > 520 ? 2 : 1);
        if (b.olu) { t.vx *= 0.82; t.vy *= 0.82; continue; }      // kırılan parçanın içinden geçer (jöleyi deler)
        b.vx -= nx * darbe * (b.tip === "tas" ? 0.3 : 0.5);
        t.vx -= (1 + SEK) * vn * nx; t.vy -= (1 + SEK) * vn * ny; t.vx *= 0.92;
        if (darbe > 200) cal("e_simit", 0.35);
      }
      t.x += nx * (t.r - u); t.y += ny * (t.r - u);
    }
    if (t.x > KIYI && t.y + t.r > YER) { t.y = YER - t.r; if (t.vy > 0) { t.vy = -t.vy * SEK; t.vx *= 0.8; } }
    if (t.x < BALKON_X && t.y + t.r > BALKON && t.y < BALKON + 30 && t.vy > 0) { t.y = BALKON - t.r; t.vy = -t.vy * SEK; t.vx *= 0.8; }
    if (t.x <= KIYI && t.y > 640 && !t.bitti) { t.bitti = true; parca(o, t.x, 640, "jole", 5); cal("e_pop", 0.3); }
    var hiz = Math.abs(t.vx) + Math.abs(t.vy);
    if (hiz < 70 && t.y + t.r >= YER - 2) t.dur += dt; else t.dur = 0;
    if (t.x > G + 60 || t.x < -60 || t.y > Y + 60 || t.dur > 0.4 || t.sn > 7) t.bitti = true;
  }
  function firlat(o, vx, vy) {
    o.simit--; o.atilan++;
    o.toplar.push({ x: ATIS.x, y: ATIS.y, vx: vx, vy: vy, r: SIMIT_R, sn: 0, dur: 0, aci: 0, bitti: false });
    o.durum = "ucus"; o.kol = 0.25; cal("e_simit", 0.5);
  }
  function hareketli(o) { return o.cisim.some(function (b) { return !b.olu && (Math.abs(b.vx) > 8 || Math.abs(b.vy) > 8); }); }

  function guncelle(dt) {
    var o = D.oyun; if (!o || D.ekran !== "oyun") return;
    o.t += dt; if (o.mesajSn > 0) o.mesajSn -= dt; if (o.kol > 0) o.kol -= dt;
    cisimAdim(o, dt);
    o.toplar.forEach(function (t) { if (!t.bitti) topAdim(o, t, dt); });
    o.parcalar.forEach(function (p) { p.sn -= dt; p.vy += CEKIM * dt; p.x += p.vx * dt; p.y += p.vy * dt; });
    o.parcalar = o.parcalar.filter(function (p) { return p.sn > 0; });
    if (o.durum === "ucus" && o.toplar.every(function (t) { return t.bitti; }) && !hareketli(o)) { o.durum = "bekle"; o.bekle = 0.6; o.toplar = []; }
    if (o.durum === "bekle") {
      o.bekle -= dt;
      if (o.bekle <= 0) {
        if (hareketli(o)) { o.bekle = 0.3; return; }
        if (uzayliSay(o) === 0) bitir(true);
        else if (o.simit > 0) { o.durum = "nisan"; mesajVer(o, o.simit === 1 ? "Son simit!" : o.simit + " simit kaldı", 1.8); }
        else bitir(false);
      }
    }
  }
  function yildiz(n) { return n <= 3 ? 3 : n === 4 ? 2 : 1; }
  function bitir(kazandi) {
    var o = D.oyun; o.durum = "bitti"; muzik(false);
    if (kazandi) {
      var yeni = rekorYaz(o.atilan), y = yildiz(o.atilan);
      $("sonucBaslik").textContent = "Kuleyi " + o.atilan + " simitle yıktın!";
      $("sonucYazi").textContent = "★".repeat(y) + "☆".repeat(3 - y) + "   Zorgo yenildi, İstanbul kurtuldu. " + (yeni ? "Yeni rekor!" : "Rekorun: " + rekorOku() + " simit.") + " Ama dur! Zorgo'nun dev tırtılı Ateş için geliyor…";
      try { localStorage.setItem("hk_final", "1"); } catch (e) {}
    } else {
      $("sonucBaslik").textContent = "Simitler bitti!";
      $("sonucYazi").textContent = "Kulede hâlâ " + uzayliSay(o) + " uzaylı var (" + o.toplam + " taneydi). Alttaki sütunları dene!";
    }
    $("devam").style.display = kazandi ? "" : "none";   // kule yıkılınca hikâye Uzaylı Tırtıl oyunuyla sürer
    cal(kazandi ? "a_fkazan" : "a_fkayip", 1); if (kazandi) cal("e_zafer", 0.6); rekorGoster();
    setTimeout(function () { if (D.oyun === o && o.durum === "bitti") ekranAc("sonuc"); }, kazandi ? 1400 : 700);
  }

  // ---------- nişan: parmağını geri çek, simit iplerle gerilir ----------
  function nokta(e) { return { x: (e.clientX - kayX) / olcek, y: (e.clientY - kayY) / olcek }; }
  function cekme(o) {
    if (!o.cek) return null; var dx = o.cek.x0 - o.cek.x, dy = o.cek.y0 - o.cek.y, u = Math.sqrt(dx * dx + dy * dy);
    if (u > AZAMI_CEKME) { dx *= AZAMI_CEKME / u; dy *= AZAMI_CEKME / u; u = AZAMI_CEKME; }
    return { dx: dx, dy: dy, u: u };
  }
  tuval.addEventListener("pointerdown", function (e) {
    var o = D.oyun; if (!o || D.ekran !== "oyun" || o.durum !== "nisan") return; var p = nokta(e);
    o.cek = { x0: p.x, y0: p.y, x: p.x, y: p.y }; try { tuval.setPointerCapture(e.pointerId); } catch (h) {}
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
  function ip(x0, y0, x1, y1) {                       // mancınığın sarı hamur ipi
    c.lineCap = "round"; c.strokeStyle = "#8a5a12"; c.lineWidth = 9; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = "#f2c02e"; c.lineWidth = 6; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  }
  function ciz() {
    var o = D.oyun; c.clearRect(0, 0, G, Y); resim("arka", 0, 0, G, Y); if (!o) return;
    var kare = Math.floor(o.t * 12), i;
    // sıradaki simitler balkonda dizili bekler
    var bekleyen = o.simit - (o.durum === "nisan" ? 1 : 0);
    for (i = 0; i < bekleyen; i++) resim("simit", 6 + i * 16, BALKON - 22, 22, 22);
    // Ateş mancınığın arkasında; mancınık karşı kıyıya bakar (kepçe solda, geride)
    resim(KAH, 66, BALKON - 100, 76, 100);
    var k = o.durum === "nisan" ? cekme(o) : null, tx = ATIS.x, ty = ATIS.y;
    if (k && k.u > 12) { tx = ATIS.x - k.dx * GERME; ty = ATIS.y - k.dy * GERME; }
    if (o.durum === "nisan" && o.simit > 0 && k && k.u > 12) ip(242, BALKON - 78, tx, ty);       // arka ip
    c.save(); c.translate(222, BALKON); c.rotate(o.kol > 0 ? 0.16 : 0); c.scale(-1, 1); resim("mancinik", -70, -110, 140, 112); c.restore();
    // bloklar ve uzaylılar
    o.cisim.forEach(function (b) {
      if (b.olu) return; var sx = b.sars > 0 ? (kare % 2 ? 3 : -3) : 0;
      if (uzayliMi(b)) { var zip = (kare + Math.round(b.x)) % 6 < 2 ? -3 : 0; resim(b.tip, b.x - 4 + sx, b.y - 4 + zip, b.w + 8, b.h + 4); }
      else {
        resim(b.tip, b.x + sx, b.y, b.w, b.h);
        var eksik = CAN[b.tip] - b.can; if (eksik > 0) { c.fillStyle = "rgba(20,10,30," + (0.2 * eksik) + ")"; c.fillRect(b.x + sx + 3, b.y + 3, b.w - 6, b.h - 6); }
      }
    });
    // nişan yolu (küçük simitler) ve gerilmiş simit
    if (k && k.u > 12) {
      var vx = k.dx * GUC, vy = k.dy * GUC;
      for (i = 1; i <= 8; i++) { var s = i * 0.08, px = ATIS.x + vx * s, py = ATIS.y + vy * s + 0.5 * CEKIM * s * s; resim("simit", px - 8, py - 8, 16, 16); }
    }
    if (o.durum === "nisan" && o.simit > 0) {
      resim("simit", tx - SIMIT_R, ty - SIMIT_R, SIMIT_R * 2, SIMIT_R * 2);
      if (k && k.u > 12) ip(206, BALKON - 84, tx, ty);                                           // ön ip
    }
    o.toplar.forEach(function (t) {
      if (t.bitti) return; c.save(); c.translate(t.x, t.y); c.rotate(Math.round(t.aci * 4) / 4); resim("simit", -t.r, -t.r, t.r * 2, t.r * 2); c.restore();
    });
    o.parcalar.forEach(function (p) { resim(p.res, p.x - p.b / 2, p.y - p.b / 2, p.b, p.b); });
    // gösterge: kalan simit ve uzaylı
    c.font = "26px 'Arial Rounded MT Bold','Trebuchet MS',sans-serif"; c.textBaseline = "middle";
    c.fillStyle = "rgba(20,16,60,.62)"; yuvarlak(14, 12, 232, 54, 26);
    for (i = 0; i < SIMIT; i++) { c.globalAlpha = i < o.simit ? 1 : 0.25; resim("simit", 28 + i * 40, 22, 34, 34); } c.globalAlpha = 1;
    c.fillStyle = "rgba(20,16,60,.62)"; yuvarlak(G - 234, 12, 220, 54, 26); c.fillStyle = "#ffd23a"; c.textAlign = "right"; c.fillText("Uzaylı " + uzayliSay(o) + " / " + o.toplam, G - 32, 40);
    if (o.mesajSn > 0) {
      c.font = "34px 'Arial Rounded MT Bold','Trebuchet MS',sans-serif"; c.textAlign = "center"; var gn = c.measureText(o.mesaj).width + 60;
      c.fillStyle = "rgba(20,16,60,.72)"; yuvarlak(G / 2 - gn / 2, 84, gn, 60, 30); c.fillStyle = "#fff"; c.fillText(o.mesaj, G / 2, 115);
    }
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
  $("tekrar").addEventListener("click", function () { baslat(); });
  $("devam").addEventListener("click", function () { muzik(false); location.href = "../tirtil/index.html?baglanti=1&final=1&seri=" + SERI; });

  window.__oyun = { D: D, baslat: baslat, ATIS: ATIS, GUC: GUC, uzayliMi: uzayliMi, at: function (dx, dy) { var o = D.oyun; if (o.durum !== "nisan") return false; firlat(o, dx * GUC, dy * GUC); return true; },
    ilerlet: function (sn) { for (var t = 0; t < sn; t += 1 / 120) guncelle(1 / 120); ciz(); var o = D.oyun; return { durum: o.durum, uzayli: uzayliSay(o), simit: o.simit, atilan: o.atilan }; } };
})();
