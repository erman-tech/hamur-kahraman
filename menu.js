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

  function oyun() { return window.__menu || {}; }
  function ekran() { try { return oyun().ekran ? oyun().ekran() : ""; } catch (e) { return ""; } }

  // --- görünüm ---
  var stil = document.createElement("style");
  stil.textContent =
    "#hkDur{position:fixed;top:8px;left:50%;margin-left:-28px;width:56px;height:56px;border-radius:28px;z-index:45;border:3px solid rgba(255,255,255,.7);" +
    "background:rgba(16,26,58,.55);color:#fff;font-size:26px;line-height:50px;text-align:center;padding:0;cursor:pointer;touch-action:manipulation;display:none}" +
    "#hkMenu{position:fixed;inset:0;z-index:48;background:rgba(10,16,40,.78);display:none;align-items:center;justify-content:center;font-family:inherit}" +
    "#hkMenu.acik{display:flex}" +
    "#hkMenu .kutu{background:#1b2a5e;border:4px solid #ffd23a;border-radius:28px;padding:26px 30px;display:flex;flex-direction:column;gap:14px;min-width:280px;max-width:90vw;text-align:center}" +
    "#hkMenu h2{margin:0 0 6px;color:#ffd23a;font-size:34px}" +
    "#hkMenu button{font:inherit;font-size:24px;font-weight:700;color:#fff;border:0;border-radius:18px;padding:16px 22px;cursor:pointer;box-shadow:0 5px 0 rgba(0,0,0,.35)}" +
    "#hkMenu button:active{transform:translateY(3px);box-shadow:0 2px 0 rgba(0,0,0,.35)}" +
    "#hkMenu .devam{background:#e8452c}#hkMenu .bas{background:#2f7fd8}#hkMenu .cik{background:#5a5f73}#hkMenu .ses{background:#2d9b5a}" +
    "#hkMenu .soru{color:#fff;font-size:22px;margin:4px 0 8px;line-height:1.3}" +
    "@media (max-height:440px){#hkMenu .kutu{padding:16px 24px;gap:10px}#hkMenu h2{font-size:26px;margin-bottom:2px}#hkMenu button{font-size:21px;padding:11px 20px}}";
  document.head.appendChild(stil);

  var dugme = document.createElement("button");
  dugme.id = "hkDur"; dugme.type = "button"; dugme.textContent = "⏸"; dugme.setAttribute("aria-label", "Oyunu durdur");
  var menu = document.createElement("div");
  menu.id = "hkMenu";
  menu.innerHTML =
    '<div class="kutu"><h2>Oyun durdu</h2>' +
    '<button class="devam" data-is="devam">▶ Devam et</button>' +
    '<button class="bas" data-is="bolum">↺ Bölümü baştan başla</button>' +
    '<button class="ses" data-is="ses"></button>' +
    '<button class="cik" data-is="cik">✕ Oyundan çık</button>' +
    '<div class="soru" data-sor style="display:none">Oyundan çıkılsın mı?<br>Başla ekranına dönülür.</div>' +
    '<button class="cik" data-is="evet" data-sor style="display:none">Evet, çık</button>' +
    '<button class="devam" data-is="vazgec" data-sor style="display:none">Hayır, oyuna dön</button></div>';

  function kur() {
    document.body.appendChild(dugme); document.body.appendChild(menu);
    setInterval(gorunurluk, 400); gorunurluk();
  }
  if (document.body) kur(); else document.addEventListener("DOMContentLoaded", kur);

  function gorunurluk() {
    var e = ekran();
    dugme.style.display = !window.__durdu && e && e !== "kapak" ? "block" : "none";
  }

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
    sesYaz();
    menu.querySelector('[data-is="bolum"]').style.display = !ac && bolumGoster ? "" : "none";
    menu.querySelector("h2").style.display = ac ? "none" : "";
  }
  function cik() { location.href = "../istanbul/index.html"; }

  dugme.addEventListener("click", dur);
  menu.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null; if (!b) return;
    var is = b.dataset.is;
    if (is === "devam") devam(); else if (is === "bolum") bolumBastan(); else if (is === "cik") cikSor(true); else if (is === "evet") cik(); else if (is === "vazgec") devam(); else if (is === "ses") sesDegistir();
  });
  addEventListener("keydown", function (e) {
    if (e.code !== "Escape" && e.code !== "KeyP") return;
    var en = ekran(); if (!en || en === "kapak") return;
    if (window.__durdu) devam(); else dur();
    e.preventDefault();
  }, true);
  // uygulamadan çıkılınca (ana ekrana dönüş, telefon kilidi) oyun kendiliğinden durur
  document.addEventListener("visibilitychange", function () {
    var en = ekran();
    if (document.hidden && en && en !== "kapak") dur();
  });

  window.__hkMenu = { dur: dur, devam: devam, bolumBastan: bolumBastan };
})();
