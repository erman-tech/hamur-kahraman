// Hamur Kahraman: beş oyunda ortak durdurma menüsü (⏸).
// Oyun dosyasından ÖNCE yüklenir: sesleri ve filmleri izleyebilmek için play() ile AudioContext'i sarar.
// Oyun kendini window.__menu ile tanıtır: { ekran: () => "kapak"|"oyun"|..., bolumVar: () => bool, bolumBastan: () => void }
(function () {
  window.__durdu = false;

  // --- ses ve film izleme ---
  var calan = [], bekleyen = [];
  var sesKapali = false; try { sesKapali = localStorage.getItem("hk_ses") === "kapali"; } catch (h) {} // toplu taşımada sessiz oynamak için; seçim hatırlanır
  var orjPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    this.muted = sesKapali;
    if (window.__durdu) { if (bekleyen.indexOf(this) < 0) bekleyen.push(this); return Promise.resolve(); }
    if (calan.indexOf(this) < 0) calan.push(this);
    return orjPlay.apply(this, arguments);
  };
  var baglamlar = [], AC = window.AudioContext || window.webkitAudioContext;
  if (AC) {
    // her bağlamın sesi bir ses düğmesinden (kazanç) geçer; ses kapalıyken kazanç 0
    var Sarili = function (o) {
      var c = o ? new AC(o) : new AC(); baglamlar.push(c);
      try { c.__kazanc = c.createGain(); c.__kazanc.gain.value = sesKapali ? 0 : 1; orjBagla.call(c.__kazanc, c.destination); } catch (h) {}
      return c;
    };
    var orjBagla = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (hedef) {
      var c = this.context;
      if (c && c.__kazanc && hedef === c.destination && this !== c.__kazanc) { arguments[0] = c.__kazanc; }
      return orjBagla.apply(this, arguments);
    };
    Sarili.prototype = AC.prototype;
    window.AudioContext = Sarili; if (window.webkitAudioContext) window.webkitAudioContext = Sarili;
  }

  // --- ilerleme: biten görevler ve açılan kostümler (bu cihazda saklanır) ---
  // Görev sırası: ana yol + iki yan görev. Ana yolda bitenler ve sıradaki açıktır; yan görevler kollarına ulaşınca açılır.
  var ANA = ["istanbul", "londra", "kosu", "tokyo", "paris", "losangeles", "final"];
  var GOREVLER = [
    { ad: "istanbul", baslik: "İstanbul", tur: "sehir" }, { ad: "tirtil", baslik: "Uzaylı Tırtıl", tur: "oyun", kol: "losangeles", sart: "losangeles" },
    { ad: "londra", baslik: "Londra", tur: "sehir" }, { ad: "kacis", baslik: "Gezegenden Kaçış", tur: "oyun", kol: "londra" },
    { ad: "kosu", baslik: "Papağanı Kurtar", tur: "oyun" }, { ad: "tokyo", baslik: "Tokyo", tur: "sehir" },
    { ad: "paris", baslik: "Paris", tur: "sehir" }, { ad: "losangeles", baslik: "Los Angeles", tur: "sehir" },
    { ad: "final", baslik: "Kuleyi Yık", tur: "oyun" }];
  var KOSTUMLER = [ // kod (kırmızı taraf; siyah tarafta k yerine s) ve açıldığı şehir
    { kod: "", sehir: "istanbul", ad: "Klasik" }, { kod: "l", sehir: "londra", ad: "Londra", guc: "⏱ zamanı durdur" },
    { kod: "t", sehir: "tokyo", ad: "Tokyo", guc: "⚡ ninja" }, { kod: "p", sehir: "paris", ad: "Paris", guc: "🎨 renk dalgası" },
    { kod: "a", sehir: "losangeles", ad: "Los Angeles", guc: "🎬 dublör" }];
  function oku(a, v) { try { var x = JSON.parse(localStorage.getItem(a)); return x == null ? v : x; } catch (h) { return v; } }
  function yaz(a, x) { try { localStorage.setItem(a, JSON.stringify(x)); } catch (h) {} }
  function taraf() { try { var t = localStorage.getItem("hk_taraf"); return t === "kotu" ? "kotu" : t === "iyi" ? "iyi" : null; } catch (h) { return null; } }
  function acikKostumler() { // bu tarafın açılmış kostüm kodları (k, kl, kt…)
    var on = taraf() === "kotu" ? "s" : "k", l = oku("hk_kostum", []);
    return KOSTUMLER.map(function (k) { return on + k.kod; }).filter(function (k) { return l.indexOf(k) >= 0; });
  }
  function bitenler() {
    var b = oku("hk_bolum", []); if (!Array.isArray(b)) b = [];
    // kayıt tutulmadan önce oynanmış oyunlar: açılan kostümler hangi şehirlerin bittiğini söyler (şehirler sırayla açılır)
    var kos = acikKostumler(), en = -1;
    KOSTUMLER.forEach(function (k, i) { if (i > 0 && kos.some(function (x) { return x.slice(1) === k.kod; })) en = Math.max(en, i); });
    if (en >= 1) ANA.slice(0, ANA.indexOf(KOSTUMLER[en].sehir) + 1).forEach(function (g) { if (b.indexOf(g) < 0) b.push(g); });
    return b;
  }
  function bitir(ad) { var b = oku("hk_bolum", []); if (!Array.isArray(b)) b = []; if (b.indexOf(ad) < 0) { b.push(ad); yaz("hk_bolum", b); } }
  function gorevDurumu() { // her görev: bitti / sıradaki / açık / kilitli
    var b = bitenler(), sira = null;
    for (var i = 0; i < ANA.length; i++) if (b.indexOf(ANA[i]) < 0) { sira = ANA[i]; break; }
    return GOREVLER.map(function (g) {
      // sart: bu görev o şehir bitmeden seçilemez (tırtıl hikâyede İstanbul'dan ayrılmayanı Londra'ya geri getiren yan yoldur; merkezde şehirler bitince açılır)
      var d = g.sart && b.indexOf(g.sart) < 0 ? "kilit" : b.indexOf(g.ad) >= 0 ? "bitti" : g.ad === sira ? "sira" : g.kol && b.indexOf(g.kol) >= 0 ? "acik" : "kilit";
      return { ad: g.ad, baslik: g.baslik, tur: g.tur, durum: d };
    });
  }
  function seciliKostum() { var a = acikKostumler(), s = oku("hk_secili_kostum", null); return a.indexOf(s) >= 0 ? s : a[a.length - 1] || null; }
  function kostumSec(k) { yaz("hk_secili_kostum", k); }
  // --- puan: her görevin EN İYİ skoru saklanır; toplam puan en iyilerin toplamıdır (aynı bölümü tekrar oynamak üst üste eklemez) ---
  var GOREV_AD = {}; GOREVLER.forEach(function (g) { GOREV_AD[g.ad] = g.baslik; });
  function puanlar() { var p = oku("hk_puan", {}); return p && typeof p === "object" && !Array.isArray(p) ? p : {}; }
  function toplamPuan() { var p = puanlar(), t = 0; Object.keys(p).forEach(function (k) { t += +p[k] || 0; }); return t; }
  function puanKaydet(gorev, puan) {
    puan = Math.max(0, Math.round(puan)); var p = puanlar(), eski = +p[gorev] || 0, rekor = puan > eski;
    if (rekor) { p[gorev] = puan; yaz("hk_puan", p); }
    return { puan: puan, enIyi: Math.max(puan, eski), rekor: rekor && eski > 0, ilk: !eski, toplam: toplamPuan() };
  }
  function isim() { var a = oku("hk_isim", ""); return typeof a === "string" ? a : ""; }
  function isimKaydet(a) { // isim bu cihazda saklanır; girilen bütün isimler ayrıca listede tutulur (ileride seslendirme için)
    a = String(a || "").replace(/\s+/g, " ").trim().slice(0, 20); if (!a) return "";
    yaz("hk_isim", a); var l = oku("hk_isimler", []); if (!Array.isArray(l)) l = [];
    if (!l.some(function (x) { return x && x.ad === a; })) { l.push({ ad: a, tarih: new Date().toISOString() }); yaz("hk_isimler", l); }
    return a;
  }
  // skor tablosu: oyun bitince görünür; satırlar oyunun kendi sayılarından gelir
  var skorKutu = null;
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function skorGoster(gorev, satirlar, kazandi) {
    var toplam = 0; satirlar.forEach(function (x) { toplam += x[2]; });
    var s = puanKaydet(gorev, toplam), p = puanlar();
    if (!skorKutu) {
      skorKutu = document.createElement("div"); skorKutu.id = "hkSkor"; document.body.appendChild(skorKutu);
      skorKutu.addEventListener("click", function (e) { if (e.target.closest("[data-kapat]")) skorKutu.classList.remove("acik"); });
    }
    var deger = function (g) { var v = +p[g] || 0; Object.keys(p).forEach(function (k) { if (k.indexOf(g + "_") === 0) v += +p[k] || 0; }); return v; }; // tırtılın beş bölümü ayrı saklanır
    var tablo = GOREVLER.filter(function (g) { return deger(g.ad); }).map(function (g) {
      return "<span" + (gorev.split("_")[0] === g.ad ? ' class="bu"' : "") + ">" + esc(g.baslik) + " <b>" + deger(g.ad) + "</b></span>";
    }).join("");
    skorKutu.innerHTML = '<div class="kutu"><h2>' + (isim() ? esc(isim()) + " · " : "") + esc(GOREV_AD[gorev] || (GOREV_AD[gorev.split("_")[0]] ? GOREV_AD[gorev.split("_")[0]] + " · Bölüm " + gorev.split("_")[1] : gorev)) + "</h2>" +
      '<table class="satir">' + satirlar.map(function (x) { return "<tr><td>" + esc(x[0]) + "</td><td>" + esc(x[1]) + "</td><td>+" + x[2] + "</td></tr>"; }).join("") + "</table>" +
      '<div class="bu-puan">' + s.puan + " puan" + (s.rekor ? ' <span class="rekor">Yeni rekor!</span>' : "") + "</div>" +
      '<div class="eniyi">Bu görevde en iyin: ' + s.enIyi + "</div>" +
      '<h3>Toplam puan: ' + s.toplam + "</h3>" + (tablo ? '<div class="liste">' + tablo + "</div>" : "") +
      '<button data-kapat>Tamam</button></div>';
    skorKutu.classList.add("acik");
    return s;
  }

  window.HK = { bitir: bitir, puanKaydet: puanKaydet, toplamPuan: toplamPuan, skorGoster: skorGoster, isim: isim, isimKaydet: isimKaydet,
    isimler: function () { return oku("hk_isimler", []); }, bitenler: bitenler, gorevDurumu: gorevDurumu, acikKostumler: acikKostumler, seciliKostum: seciliKostum, kostumSec: kostumSec,
    KOSTUMLER: KOSTUMLER, taraf: taraf, merkezVar: function () { return bitenler().length > 0; },
    merkezeDon: function () { location.href = "../istanbul/index.html?merkez=1"; } };

  function oyun() { return window.__menu || {}; }
  function ekran() { try { return oyun().ekran ? oyun().ekran() : ""; } catch (e) { return ""; } }
  function oyunda() { var e = ekran(); return !!e && ["kapak", "merkez", "isim"].indexOf(e) < 0; } // başla, görevler ve isim ekranlarında durdurma yok

  // --- görünüm ---
  var stil = document.createElement("style");
  stil.textContent =
    // ⏸: oyun alanının sol üst köşesinde, hamur düğmesi gibi kabarık; dokunma alanı görünenden büyük (::before)
    "#hkDur{position:fixed;left:0;top:0;width:56px;height:56px;border-radius:50%;z-index:45;border:0;padding:0;cursor:pointer;touch-action:manipulation;display:none;" +
    "background:radial-gradient(circle at 35% 30%,#3d5bb0,#1f2f6e 70%);box-shadow:0 4px 0 rgba(0,0,0,.4),inset 0 -4px 0 rgba(0,0,0,.25),inset 0 3px 0 rgba(255,255,255,.25);opacity:.88}" +
    "#hkDur::before{content:'';position:absolute;inset:-14px}" +
    "#hkDur i{position:absolute;top:28%;height:44%;width:15%;border-radius:4px;background:#fff;box-shadow:0 2px 0 rgba(0,0,0,.25)}" +
    "#hkDur i:first-child{left:30%}#hkDur i:last-child{right:30%}" +
    "#hkDur:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(0,0,0,.4),inset 0 -2px 0 rgba(0,0,0,.25)}" +
    "#hkMenu{position:fixed;inset:0;z-index:48;background:rgba(10,16,40,.78);display:none;align-items:center;justify-content:center;font-family:inherit}" +
    "#hkMenu.acik{display:flex}" +
    "#hkMenu .kutu{background:#1b2a5e;border:4px solid #ffd23a;border-radius:28px;padding:26px 30px;display:flex;flex-direction:column;gap:14px;min-width:280px;max-width:90vw;text-align:center}" +
    "#hkMenu h2{margin:0 0 6px;color:#ffd23a;font-size:34px}" +
    "#hkMenu button{font:inherit;font-size:24px;font-weight:700;color:#fff;border:0;border-radius:18px;padding:16px 22px;cursor:pointer;box-shadow:0 5px 0 rgba(0,0,0,.35)}" +
    "#hkMenu button:active{transform:translateY(3px);box-shadow:0 2px 0 rgba(0,0,0,.35)}" +
    "#hkMenu .devam{background:#e8452c}#hkMenu .bas{background:#2f7fd8}#hkMenu .cik{background:#5a5f73}#hkMenu .ses{background:#2d9b5a}" +
    "#hkMenu .soru{color:#fff;font-size:22px;margin:4px 0 8px;line-height:1.3}" +
    "#hkSkor{position:fixed;inset:0;z-index:47;background:rgba(10,16,40,.72);display:none;align-items:center;justify-content:center;font-family:inherit;overflow:auto}" +
    "#hkSkor.acik{display:flex}#hkSkor .kutu{background:#1b2a5e;border:4px solid #ffd23a;border-radius:28px;padding:20px 26px;color:#fff;text-align:center;min-width:280px;max-width:92vw;max-height:94vh;overflow:auto;box-sizing:border-box}" +
    "#hkSkor h2{margin:0 0 10px;color:#ffd23a;font-size:26px}#hkSkor h3{margin:12px 0 6px;font-size:22px;color:#ffd23a}" +
    "#hkSkor table{margin:0 auto;border-collapse:collapse;font-size:18px}#hkSkor td{padding:3px 10px}#hkSkor .satir td:last-child{text-align:right;color:#8dff9a;font-weight:700}" +
    "#hkSkor .liste{display:flex;flex-wrap:wrap;gap:6px 10px;justify-content:center;font-size:15px;max-width:520px;margin:0 auto}" +
    "#hkSkor .liste span{background:rgba(255,255,255,.1);border-radius:12px;padding:3px 10px}#hkSkor .liste b{color:#8dff9a}#hkSkor .liste .bu{outline:2px solid #ffd23a}" +
    "#hkSkor .bu-puan{font-size:38px;font-weight:700;margin:10px 0 2px}#hkSkor .rekor{font-size:20px;color:#ffd23a}#hkSkor .eniyi{font-size:17px;opacity:.9}" +
    "#hkSkor button{font:inherit;font-size:22px;font-weight:700;color:#fff;background:#e8452c;border:0;border-radius:18px;padding:12px 40px;margin-top:14px;cursor:pointer;box-shadow:0 5px 0 rgba(0,0,0,.35)}" +
    "@media (max-height:440px){#hkSkor .kutu{padding:10px 18px}#hkSkor h2{font-size:19px;margin-bottom:4px}#hkSkor table{font-size:14px}#hkSkor td{padding:0 8px}" +
    "#hkSkor .bu-puan{font-size:26px;margin:4px 0 0}#hkSkor .eniyi{font-size:13px}#hkSkor h3{font-size:16px;margin:6px 0 4px}#hkSkor .liste{font-size:12px}" +
    "#hkSkor button{font-size:17px;padding:7px 30px;margin-top:8px}" +
    "#hkMenu .kutu{padding:12px 22px;gap:8px}#hkMenu h2{font-size:22px;margin-bottom:0}#hkMenu button{font-size:19px;padding:8px 20px}}" +
    // 22 Kasım 2026 (Erman: "menüler profesyonel oyun gibi"): kapak, sonuç ve durdurma menüsünün ortak görünümü. Yalnız görünüm; düğmeler ve akış aynı.
    "@keyframes hkPop{0%{transform:scale(.85)}70%{transform:scale(1.05)}100%{transform:scale(1)}}@keyframes hkNabiz{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}" +
    ".hamur{background-image:linear-gradient(180deg,rgba(255,255,255,.28),rgba(255,255,255,0) 45%,rgba(0,0,0,.14));border:5px solid rgba(255,255,255,.9) !important;text-shadow:0 3px 0 rgba(0,0,0,.28);letter-spacing:.5px}" +
    ".hamur.sari{text-shadow:0 2px 0 rgba(255,255,255,.4)}#kapak #basla{animation:hkNabiz 1.6s ease-in-out infinite}" +
    "#kapak h1,#sonuc h1,#harita h1{-webkit-text-stroke:3px rgba(40,20,90,.9);paint-order:stroke fill;letter-spacing:1px;animation:hkPop .5s ease-out both}" +
    "#sonuc .dugmeler,#harita .dugmeler{animation:hkPop .5s .15s ease-out both}" +
    "#kapak h2,#sonuc h2{background:rgba(20,14,56,.55);border:3px solid rgba(255,255,255,.18);border-radius:28px;padding:18px 26px;box-sizing:border-box}#sonuc h2:empty{display:none}" +
    "#hkMenu .kutu{background:linear-gradient(180deg,#34479a,#1b2a5e);border:6px solid #fff;border-radius:36px;box-shadow:0 12px 0 rgba(0,0,0,.4);animation:hkPop .3s ease-out both}" +
    "#hkMenu h2{-webkit-text-stroke:2px rgba(20,20,70,.9);paint-order:stroke fill}" +
    "#hkMenu button,#hkSkor button{border:4px solid rgba(255,255,255,.9);border-radius:26px;background-image:linear-gradient(180deg,rgba(255,255,255,.25),rgba(255,255,255,0) 45%,rgba(0,0,0,.14));text-shadow:0 2px 0 rgba(0,0,0,.28)}" +
    "#hkSkor .kutu{border:6px solid #fff;border-radius:36px;box-shadow:0 12px 0 rgba(0,0,0,.4)}";
  document.head.appendChild(stil);

  var dugme = document.createElement("button");
  dugme.id = "hkDur"; dugme.type = "button"; dugme.innerHTML = "<i></i><i></i>"; dugme.setAttribute("aria-label", "Oyunu durdur");
  var menu = document.createElement("div");
  menu.id = "hkMenu";
  menu.innerHTML =
    '<div class="kutu"><h2>Oyun durdu</h2>' +
    '<button class="devam" data-is="devam">▶ Devam et</button>' +
    '<button class="bas" data-is="bolum">↺ Bölümü baştan başla</button>' +
    '<button class="bas" data-is="gorev">☰ Görevlere dön</button>' +
    '<button class="ses" data-is="ses"></button>' +
    '<button class="cik" data-is="cik">✕ Oyundan çık</button>' +
    '<div class="soru" data-sor style="display:none">Oyundan çıkılsın mı?<br>Başla ekranına dönülür.</div>' +
    '<button class="cik" data-is="evet" data-sor style="display:none">Evet, çık</button>' +
    '<button class="devam" data-is="vazgec" data-sor style="display:none">Hayır, oyuna dön</button></div>';

  function kur() {
    document.body.appendChild(dugme); document.body.appendChild(menu);
    var tk = document.getElementById("tekrar");
    if (tk && tk.parentNode) { // görünürlüğü her yoklamada: ilk görev bitince belirir
      var g = document.createElement("button"); g.id = "hkGorevler"; g.className = "hamur mavi"; g.type = "button"; g.textContent = "☰ Görevler";
      g.addEventListener("click", function () { window.HK.merkezeDon(); });
      tk.parentNode.appendChild(g);
    }
    setInterval(gorunurluk, 400); gorunurluk();
  }
  if (document.body) kur(); else document.addEventListener("DOMContentLoaded", kur);

  function gorunurluk() {
    var gor = !window.__durdu && oyunda(), gb = document.getElementById("hkGorevler");
    if (gb) gb.style.display = window.HK.merkezVar() ? "" : "none";
    dugme.style.display = gor ? "block" : "none";
    if (gor) yerlestir();
  }
  // oyun alanı (#sahne) ekrana göre büyüyüp küçülür; düğme onun sol üst köşesine oturur, boyu alana göre
  function yerlestir() {
    var sahne = document.getElementById("sahne"), r = sahne ? sahne.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
    var b = Math.round(Math.max(40, Math.min(70, Math.min(r.width, r.height) * 0.1))), p = Math.round(b * 0.22);
    dugme.style.width = dugme.style.height = b + "px";
    dugme.style.left = Math.round(Math.max(0, r.left) + p) + "px"; dugme.style.top = Math.round(Math.max(0, r.top) + p) + "px";
  }
  addEventListener("resize", function () { if (dugme.style.display === "block") yerlestir(); });

  // --- durdur / devam ---
  var durdurulan = [];
  function dur() {
    if (window.__durdu) return;
    window.__durdu = true; durdurulan = [];
    calan.forEach(function (m) { if (!m.paused && !m.ended) { durdurulan.push(m); try { m.pause(); } catch (h) {} } });
    baglamlar.forEach(function (c) { if (c.state === "running") { try { c.suspend(); } catch (h) {} } });
    bolumGoster = oyun().bolumVar ? !!oyun().bolumVar() : false;
    cikSor(false);
    menu.classList.add("acik"); gorunurluk();
  }
  function baglamAc() { baglamlar.forEach(function (c) { if (c.state === "suspended") { try { c.resume(); } catch (h) {} } }); }
  function devam() {
    if (!window.__durdu) return;
    window.__durdu = false; menu.classList.remove("acik");
    baglamAc();
    durdurulan.concat(bekleyen).forEach(function (m) { var p = m.play(); if (p && p.catch) p.catch(function () {}); });
    durdurulan = []; bekleyen = []; gorunurluk();
  }
  function bolumBastan() {
    window.__durdu = false; menu.classList.remove("acik");
    durdurulan = []; bekleyen = []; // eski film ve müzik devam etmez; bölüm kendi sesini baştan başlatır
    baglamAc();
    try { oyun().bolumBastan(); } catch (h) {}
    gorunurluk();
  }
  function sesYaz() { menu.querySelector('[data-is="ses"]').textContent = sesKapali ? "🔇 Ses kapalı (aç)" : "🔊 Ses açık (kapat)"; }
  function sesDegistir() {
    sesKapali = !sesKapali;
    try { localStorage.setItem("hk_ses", sesKapali ? "kapali" : "acik"); } catch (h) {}
    calan.concat(bekleyen).forEach(function (m) { m.muted = sesKapali; });
    baglamlar.forEach(function (c) { if (c.__kazanc) c.__kazanc.gain.value = sesKapali ? 0 : 1; });
    sesYaz();
  }
  var bolumGoster = false;
  function cikSor(ac) { // çıkmadan önce bir kez sorulur; soru açıkken öteki düğmeler gizlenir
    Array.prototype.forEach.call(menu.querySelectorAll("[data-sor]"), function (el) { el.style.display = ac ? "" : "none"; });
    menu.querySelector('[data-is="devam"]').style.display = ac ? "none" : "";
    menu.querySelector('[data-is="cik"]').style.display = ac ? "none" : "";
    menu.querySelector('[data-is="ses"]').style.display = ac ? "none" : "";
    menu.querySelector('[data-is="gorev"]').style.display = !ac && window.HK.merkezVar() ? "" : "none";
    sesYaz();
    menu.querySelector('[data-is="bolum"]').style.display = !ac && bolumGoster ? "" : "none";
    menu.querySelector("h2").style.display = ac ? "none" : "";
  }
  function cik() { location.href = "../istanbul/index.html"; }

  dugme.addEventListener("click", dur);
  menu.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null; if (!b) return;
    var is = b.dataset.is;
    if (is === "devam") devam(); else if (is === "bolum") bolumBastan(); else if (is === "cik") cikSor(true); else if (is === "evet") cik(); else if (is === "vazgec") devam(); else if (is === "ses") sesDegistir(); else if (is === "gorev") window.HK.merkezeDon();
  });
  addEventListener("keydown", function (e) {
    if (e.code !== "Escape" && e.code !== "KeyP") return;
    if (e.target && e.target.tagName === "INPUT") return; // isim yazarken P harfi oyunu durdurmasın
    if (!oyunda() && !window.__durdu) return;
    if (window.__durdu) devam(); else dur();
    e.preventDefault();
  }, true);
  // uygulamadan çıkılınca (ana ekrana dönüş, telefon kilidi) oyun kendiliğinden durur
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && oyunda()) dur();
  });

  window.__hkMenu = { dur: dur, devam: devam, bolumBastan: bolumBastan };
})();
