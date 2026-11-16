# Hamur Kahraman — geliştirme rehberi

Oyun hamurundan, stop motion görünümlü, soldan sağa giden bir platform oyunu. Tasarım: Can Ateş Ünal.

- Oyna: https://erman-tech.github.io/hamur-kahraman/
- Depo: https://github.com/erman-tech/hamur-kahraman
- Durum (15 Kasım 2026): açılış filmleri, seçim ekranı ve tek bölüm (İstanbul) hazır. Diğer dört şehir yok.

## 0. Depo düzeni (16 Kasım 2026'dan beri)

Depo artık bir oyun portalı. Kökteki `index.html` oyunları listeler.

| Yol | Ne |
|---|---|
| `index.html` | Portal: oyun kartları |
| `istanbul/` | 1. oyun (bu belgenin 1–11. bölümleri onu anlatır; `kaynak/` da bu klasörde) |
| `tirtil/` | 2. oyun: Uzaylı Tırtıl (aşağıda 12. bölüm) |
| `sunucu.py`, `baslat.command` | Portalı yerelde açar (port 5095) |

Yeni oyun eklemek: yeni bir klasör aç, içine `index.html` koy, portaldaki `.oyunlar` listesine bir kart ekle.

## 1. Hikâye ve değişmeyecek kararlar

Bunlar Erman ve Ateş'in kararları; yeni iş bunlara uymalı.

- Kahraman Ateş. İlk sahnede normal kıyafetiyle (açık mavi, arabalı pijama) İstanbul'da bir damda.
- Papağan sorar: "Dünyayı kurtarmaya cesaretin var mı?"
  - **Evet** → kırmızı maskeli kahraman **Cesur**, papağan beyaz olur. Gücü: beyaz ağ.
  - **Hayır** → siyah maskeli kahraman **Ürkek**, papağan siyah kalır. Gücü: kırmızı elektrik.
- İkisi de dünyayı kurtarır. Oyun iki yolda aynıdır, yalnızca renk, ad ve atılan şey değişir. İkisi de uçabilir.
- Dönüşümden sonra maske hiç çıkmaz. Kahraman çocuktur, ince yapılıdır.
- Kötüler meteorla beş şehre düşer: İstanbul, Londra, Adana, Paris, Los Angeles. Her şehir bir bölüm olacak.
- Ekrandaki her şey oyun hamurundan yapılmış gibi görünür. Hareket stop motion gibi adım adımdır.
- Her şey Türkçe: yazılar, anlatım, papağanın sesi.
- Giriş ekranında hamurdan Ateş, kucağında kedisi Pufi ve altında "designed by Can Ateş Ünal" yazısı durur.
- Korkutucu hiçbir şey yok; kötüler komik.

## 2. Çalıştırma

Kurulum yok, kütüphane yok. Oyun düz HTML + tek JavaScript dosyası.

- **Bilgisayarda:** `baslat.command` dosyasına çift tıkla. Küçük bir yerel sunucu (`sunucu.py`, port 5095) açar ve oyunu tarayıcıda başlatır.
- **Elle:** `python3 sunucu.py 5095`, sonra `http://localhost:5095/index.html`.
- `index.html` dosyasını doğrudan çift tıklayıp açmak da çalışır, ama sesler daha basit yoldan çalar.
- Safari videoyu parça parça ister; `python3 -m http.server` bunu desteklemez. Bu yüzden `sunucu.py` kullanılır.

## 3. Dosyalar

| Yol | Ne |
|---|---|
| `index.html` | Sayfa iskeleti, ekranlar (kapak, seçim, harita), düğmeler, bütün stil |
| `oyun.js` | Oyunun tamamı: akış, bölüm verisi, fizik, çizim, ses |
| `varlik/` | Kesilmiş saydam görseller ve arka planlar |
| `video/` | `giris.mp4`, `donusum_kirmizi.mp4`, `donusum_siyah.mp4` |
| `ses/` | Efektler (`e_*`), papağan (`p_*`), anlatıcı (`a_*`), `muzik.mp3` |
| `kaynak/` | Ham sprite sayfaları (yeşil zeminli) ve kesme betiği `kes.py` |
| `sunucu.py`, `baslat.command` | Yerel çalıştırma |

`varlik/` içindeki adlar:

- Kahraman: `k_` kırmızı (Cesur), `s_` siyah (Ürkek). Pozlar: `dur`, `kos1`, `kos2`, `uc`, `at`.
- Papağan: `pb1`, `pb2` beyaz; `ps1`, `ps2` siyah (iki kanat pozu).
- Kötüler: `yur1`, `yur2` yürüyen; `uc1`, `uc2` uçan; `kral` Meteor Kralı.
- Eşyalar: `platform`, `simit`, `meteor`, `kalp`, `sandik`, `yildiz`.
- Ekranlar: `kapak.jpg` (giriş), `secim.jpg` (soru), `dunya.jpg` (harita), `arka.jpg` (İstanbul sokağı).

## 4. Oyun nasıl akıyor

`oyun.js` içinde `D.ekran` şu sırayla değişir:

1. `kapak` — BAŞLA düğmesi. Tarayıcılar ses için bir dokunuş ister, o yüzden film buradan başlar.
2. `film` (`giris.mp4`) — meteorlar ve şehir adları, Ateş ile papağan, oyun adı. Şehir adları videoya gömülü değil; `SEHIR_SN` dizisindeki saniyelerde HTML etiketi olarak belirir.
3. `secim` — soru ve EVET / HAYIR. `sec("iyi")` ya da `sec("kotu")` çağrılır.
4. `film` (`donusum_kirmizi.mp4` ya da `donusum_siyah.mp4`).
5. `oyun` — İstanbul bölümü.
6. `harita` — beş şehir kartı, "Tekrar oyna" ve "Diğer tarafı dene".

Her filmde "Geç" düğmesi vardır.

## 5. Kodun yapısı (`oyun.js`)

Dosya tek bir kapalı fonksiyon. Bölümler yorum başlıklarıyla ayrılmış:

- **Sabitler:** `G`=1280, `Y`=720 (çizim alanı), `ZEMIN`=672 (ayağın bastığı çizgi), `UZUNLUK`=9000 (bölüm genişliği).
- **Sesler:** `cal(ad, ses)` efekt çalar, `muzikBasla()` / `muzikDur()`. Önce Web Audio dener (tablette şart), olmazsa `<audio>`.
- **`bolumKur()`:** bölümün bütün içeriği burada, düz sayı listeleri halinde: platformlar, simitler, yürüyen ve uçan kötüler, sandıklar, Meteor Kralı.
- **`guncelle(dt)`:** fizik ve kurallar. Kahraman, papağan, toplama, kötüler, kral, gökten düşen meteorlar, atılan ağ/elektrik, görevler, kamera.
- **`cizOyun()`:** çizim. Arka plan aynalı döşenir (dikiş görünmesin diye), sonra nesneler, en son gösterge.
- **Stop motion hissi:** `kare()` saniyede 8 poz verir; sprite'lar ona göre değişir. `titre()` her pozda nesneyi bir iki piksel oynatır.
- **Görevler:** `GOREV_SIMIT`=20, `GOREV_KOTU`=10 ve Meteor Kralı. Bölüm kral yenilince biter; diğer iki görev yıldız sayısını belirler.
- **Kahraman:** 3 can, uçuş gücü çubuğu (yerde dolar), ateş bekleme süresi 0,38 sn.

Tuşlar: ← → ya da A D yürü; ↑, W ya da Boşluk zıpla ve uç; X, F ya da Enter ateş. Dokunmatik ekranda dört düğme çıkar.

### Deneme kancası

Tarayıcı konsolunda:

```js
__oyun.baslat('iyi')        // ya da 'kotu': filmleri atlayıp bölümü başlatır
__oyun.tus('sag', true)     // tuşu basılı tut: sol, sag, yukari, ates
__oyun.ilerlet(2)           // oyunu 2 saniye ilerletir ve durumu döndürür
__oyun.D.oyun               // bölümün canlı durumu
```

## 6. Yeni şehir eklemek

Şu an kodda tek bölüm var ve şehir seçimi yok. İkinci şehir için yapılacaklar:

1. `bolumKur()` fonksiyonuna şehir adı parametresi ekle; içerik listelerini şehre göre seç. En temizi her şehri bir veri nesnesi yapmak (arka plan, platformlar, simit yerine o şehrin toplanacak şeyi, kötü yerleşimi, kral).
2. Arka plan: `cizOyun()` şu an `R.arka` kullanıyor; şehre göre seçilmeli. Yeni arka planı `varlik/arka_<sehir>.jpg` olarak koy ve `resimAdlari` listesine ekle.
3. Harita: `haritaAc()` kartları çiziyor. İstanbul dışındakiler sabit "Yakında". Kurtarılan şehirleri bir yerde tut (`localStorage` yeter) ve sıradaki şehrin kartını tıklanır yap.
4. Papağanın karşılama sesi şehre özel (`p_basla` "İstanbul sokaklarına hoş geldin" diyor). Her şehir için yeni ses gerekir.
5. Zafer anlatımı da şehre özel (`a_kazandin_c`, `a_kazandin_u` "İstanbul'u kurtardı" diyor).

Arka plan görseli için ölçü: 21:9, binaların tabanı düz bir çizgide, altta ince bir kaldırım şeridi. Oyun görseli 720 piksel yüksekliğe ölçekler; kaldırımın üstü yaklaşık 640. piksele, ayak çizgisi 672'ye denk gelmeli.

## 7. Görseller nasıl üretildi

Hepsi Higgsfield üzerinden üretildi (görsel: Nano Banana Pro, video: Seedance 2.0).

- **Üslup cümlesi** her istekte aynı: oyun hamurundan / plasticine, parmak izi dokusu, minyatür masa üstü set, yumuşak stüdyo ışığı, çocuklara uygun.
- **Tutarlılık:** yeni görsel istenirken mevcut bir kare referans verilir. Örneğin siyah kahraman sayfası, kırmızı sayfanın "yalnızca rengi değiştir" düzenlemesidir; böylece pozlar birebir aynı kalır ve oyun iki yolda aynı çalışır.
- **Sprite sayfaları:** tek satırda, aralıklı, hepsi sağa bakan pozlar; düz parlak yeşil zemin (#00FF00), gölge yok. Yeşil olan hiçbir nesne istenmez.
- **Kesme:** `kaynak/kes.py` yeşili siler, parçaları ayırır, ölçekler ve `varlik/` içine yazar.

```bash
python3 -m venv venv && venv/bin/pip install pillow numpy scipy
venv/bin/python kaynak/kes.py kaynak varlik
```

Betik dosya adlarını bekler: `kirmizi_sayfa.png`, `siyah_sayfa.png`, `papagan.png`, `kotuler.png`, `esya.png`, `arka.png`. Parça sayısı beklenenle tutmazsa durur ve söyler. Papağan sayfasının alt kısmında artık kalmıştı; betik o sayfayı 1030. satırdan keser.

Kötüler sayfada sağa bakar; oyun yürüdükleri yöne göre çevirir.

## 8. Videolar ve sesler

- Ham sahneler 720p, 24 kare üretildi. Oyuna girerken saniyede 12 kareye düşürülüp yeniden 24'e çıkarılır (`fps=12,...,fps=24`); stop motion görünümü buradan gelir.
- Dönüşüm sahneleri "başlangıç karesi + bitiş karesi" verilerek üretildi: başta pijamalı Ateş, sonda maskeli kahraman.
- Anlatıcı ve papağan sesi ElevenLabs (Türkçe, çok dilli model). Papağan, anlatıcı sesinin inceltilmiş halidir (ffmpeg ile perde yükseltme).
- Müzik ve efektler de ElevenLabs.
- Filmler ffmpeg ile kuruldu: sahneler art arda eklenir, anlatım ve efektler saniyesine göre yerleştirilir, müzik altta kısık çalar.

Anlatım metinleri:

- Açılış: "Bir gün, dünyaya meteorlar düştü. İçlerinden yaramaz kötüler çıktı! İstanbul. Londra. Adana. Paris. Ve Los Angeles!"
- "İstanbul'da Ateş adında cesur bir çocuk yaşardı. Bir gün yanına bir papağan geldi."
- "Hamur Kahraman!"
- Papağan: "Ateş! Dünyayı kurtarmaya cesaretin var mı?"
- Evet: "Evet, dedi Ateş. İçindeki güç uyandı! Kıpkırmızı, maskeli bir kahramana dönüştü. Artık onun adı Cesur'du!"
- Hayır: "Hayır, dedi Ateş, biraz korkuyorum. Ama içindeki güç yine de uyandı! Simsiyah, maskeli bir kahramana dönüştü. Adı Ürkek'ti. Ama dünyayı yine o kurtaracaktı!"
- Oyun içi papağan: "İstanbul sokaklarına hoş geldin! Simitleri topla, kötüleri yakala!" · "Dikkat! Meteor Kralı geldi!" · "Harika! Görev tamamlandı!" · "Üzülme, tekrar deneyelim!"
- Zafer: "Tebrikler! Cesur, İstanbul'u kurtardı!" (Ürkek için de aynısı)

Ham sahne videoları ve ses üretim dosyaları bu depoda değil; Erman'da duruyor.

## 9. Yayınlama

Depo GitHub Pages ile yayınlanıyor (`main` dalının kökü). `main`'e gönderilen her değişiklik bir iki dakikada bağlantıya yansır.

Depoya girmemesi gerekenler: Ateş'in gerçek fotoğrafı ve kişisel dosyalar. Depo herkese açık.

## 10. Bilinen eksikler ve denenmeyenler

- Gerçek bir tablette denenmedi. Dokunmatik düğmelerin yeri ve rahatlığı, seslerin iPad'de çıkıp çıkmadığı bilinmiyor.
- Sesleri geliştiren taraf dinleyemedi: telaffuz, ses dengesi ve efekt zamanlaması kulakla doğrulanmadı.
- Zorluk ayarı yapılmadı. Otomatik deneme bölümü 30 saniyede bitirdi; kolay olabilir.
- Can bitince yeniden başlama yolu denenmedi.
- Ürkek için uçuş sahnesi yok; dönüşümden sonra doğrudan oyuna geçer (Cesur'da var).
- Oyun içinde Ateş'in maskesiz hali yok; oyun dönüşümden sonra başlıyor.
- Kırmızı kahraman kırmızı tramvayın önünde zor seçiliyor.
- İlerleme kaydı yok; sayfa yenilenince her şey baştan başlar.

## 11. Sıradaki işler için öneri

1. Tablette deneme ve dokunmatik düzeltmeleri.
2. Bölümü veri nesnesine çevirip ikinci şehri eklemek (madde 6).
3. Haritada şehir seçimi ve ilerleme kaydı.
4. Her şehre özgü toplanacak şey ve kötü (Londra'da çay fincanı, Adana'da kebap şişi gibi; Ateş karar verir).
5. Zorluk: kötü sayısı, meteor sıklığı, kralın canı.

## 12. İkinci oyun: Uzaylı Tırtıl (`tirtil/`)

Hikâye: uzaylı tırtıl Vıcık bu sefer kahramanın peşinde. Papağan "önce kendini, sonra dünyayı kurtar" der. Oyuncu sekiz kahramandan birini seçer (dört erkek, dört kız kıyafeti).

Oyun (tek bölüm), Royal Match'in "yılanı durdur" reklamı örnek alındı:

- Üstte labirent: Vıcık iki koridordan geçip taş yığınına varır (`YURU`, 14 sn) ve yığını itmeye başlar.
- Taşlar kahramanı sağdaki tuzağa (uzay gemisinin ışığı) doğru sürükler. Dolu yığınla tuzağa varış `ITME` (58 sn); taş azaldıkça itme zayıflar.
- Yığın bir kuyuda durur: 108 çakıl, üstten `YEDEK_TAS` (190) çakıl daha gelir.
- Altta 16×7 şeker tahtası (`SEKER` listesi: jelibonlar ve şekerler). Yan yana duran en az iki aynı şekere dokununca patlarlar. Şekerler düşmez, yeniden dolmaz.
- Taşlar ince bir ızgarada (her şeker hücresi 3×3 çakıl) kum gibi akar: aşağı, olmazsa çapraza (`kumAdimi`). Tahtanın alt satırına varan taş suya dökülür.
- Amaç: kahraman tuzağa varmadan bütün taşları dökmek. Taş kalmayınca Vıcık sersemleyip uçar. Kahraman tuzağa varırsa oyun kaybedilir.
- Gerilim: taş sürtünme sesi, tuzağa yaklaştıkça sıklaşan tik tak, sonda kalp atışı, hızlanan müzik, kızaran kenarlar.
- Dokunacak grup kalmazsa "Karıştır" kalan şekerleri yeniden dizer.
- Hareket saniyede 12 pozla çizilir (`POZ`).

Deneme kancası: `__oyun.baslat('e4')`, `__oyun.dokun(satir, sutun)`, `__oyun.otomatik()` (akıllıca bir hamle yapar), `__oyun.ilerlet(saniye)`, `__oyun.durum()`.

Açılış filmi gerçek video değil: hareketsiz hamur karelerinin yaklaşma ve titremeyle kurulmuş hali (kredi az harcansın diye). Ham kareler ve kurma betikleri Erman'da.

Bilinenler: zorluk bir çocukla denenmedi (otomatik oyuncu iki saniyede bir hamleyle 10 oyunun 7'sini kazandı); sesler dinlenmedi; tablette denenmedi.


### 16 Kasım güncellemesi (2. oyun)

- Oynanış artık şeker kaydırmalı: bir şeker komşusuyla yer değiştirir, en az üç aynı şeker yan yana ya da alt alta gelince patlar (`takas`, `eslesmeler`, `hamleler`). Hamle kalmazsa tahta kendiliğinden karışır.
- Tırtıl tünelin deliğinden çıkar, tünelde yığılı taşlara dayanır ve iterek ilerler (`TUNEL`). Tünel daraltıldı (`KOR`), taşlar irileştirildi.
- Taş akışı yavaşladı ve yana da yayılıyor (`kumAdimi`, adım 0,075 sn). İtme süresi `ITME = 80`.
- Açılış filmi sallantısız: yalnız yavaş yaklaşma ve uzaklaşma (`kaynak/film4.py`, saniyede 24 kare).
- Portalda yalnız iki oyun var; Aslı Beliz sürümü kendi adresinde duruyor, portalda bağlantısı yok.
- Kahramanın odası alçaltıldı (`ODA`), taşlar tavana kadar dolar. Uzay gemisi yerde bekler; kaybedilince kahramanı alıp uçar.
