# AGENTS.md

Bu dosya, Turbolu Studios deposunda çalışan yapay zekâ kodlama ajanları ve geliştiriciler için proje rehberidir. Buradaki kurallar genel varsayımlardan önce gelir.

## 1. Proje özeti

**Turbolu Studios / turboluweb**, tamamen statik olarak yayınlanan bir web sitesidir. Derleme adımı, paket yöneticisi, lint veya otomatik test altyapısı yoktur. HTML, CSS ve vanilla JavaScript dosyaları doğrudan tarayıcıya sunulur.

- Canlı adres: <https://turboluweb.wasmer.app/>
- Barındırma: Wasmer (statik dosyalar, `fr-roub1` bölgesi)
- Git deposu: <https://github.com/ereny116011-cloud/turboluweb>
- Ana dal: `main`
- Lisans: GNU General Public License v3.0
- Arayüz dili: Türkçe. İngilizce çeviri desteği `mc/app.js` ve `bedrock/app.js` içindeki `translations` nesnelerindedir.
- Arka uç: Cloudflare Worker — `https://shrill-salad-a498.ereny116011.workers.dev`

## 2. Hızlı başlangıç

Derleme yoktur. Yerel önizleme için depo kökünden basit bir statik sunucu çalıştır:

```powershell
python -m http.server 8080
```

Ardından şu adresleri kullan:

| Sayfa | Adres |
| --- | --- |
| Portal | <http://localhost:8080/> |
| Java sunucusu | <http://localhost:8080/mc/> |
| Bedrock sunucusu | <http://localhost:8080/bedrock/> |
| Tıkla | <http://localhost:8080/tikla/> |
| Yönetim paneli | <http://localhost:8080/panel/> |

Sayfaları doğrudan `file://` ile açma; `fetch`, Clipboard API, service worker ve kök-göreli yollar (`/mc/`, `/fa/...`) bu şekilde çalışmaz.

`npm install`, `npm run build`, Vite, Webpack veya benzeri bir araç yoktur. Yeni bir build sistemi ekleme; dosyalar doğrudan servis edilir.

## 3. Dizin yapısı

| Yol | İçerik |
| --- | --- |
| `index.html`, `style.css`, `site-polish.css`, `script.js` | Ana portal: projeler, duyurular, hakkımızda, iletişim. Portal etkileşimleri `index.html` içindeki inline script'tedir; `script.js` yalnızca yer tutucudur. |
| `mc/` | TurboluMC Java Edition SPA'sı (`index.html` + `app.js` + `style.css`). |
| `mc/market/`, `mc/duyurular/`, `mc/haberler/`, `mc/kampanyalar/`, `mc/profil/`, `mc/taleplerim/` | Statik alt sayfalar. |
| `mc/giris.html`, `mc/reset.html`, `mc/profile.html`, `mc/shop.html`, `mc/admin.html` | SPA dışı eski/bağımsız sayfalar. Değiştirmeden önce gerçekten kullanıldığını doğrula. |
| `mc/sw.js`, `mc/manifest.json` | Web push service worker ve PWA manifesti. |
| `bedrock/` | Turbolu Bedrock SPA'sı (`index.html` + `app.js` + `style.css` + `manifest.json`). |
| `tikla/` | Turbolu Tıkla mobil oyun tanıtım sitesi; çok sayfalı yapı. |
| `tikla/apk/` | `turbolutikla.apk` ve virüs tarama görseli. |
| `panel/index.html` | İçerik yönetim paneli: duyuru, haber, kampanya, ürün ve talepler. |
| `fa/` | Font Awesome 6 vendor dosyaları. Mümkünse düzenleme; CDN'e geri dönme. |
| `img/` | Ortak görseller. Big Sur duvar kağıdı `bigsur-wallpaper.webp`; eski SVG dosyaları tarihseldir. |
| `kayit.html`, `sifremi-unuttum.html` | Kayıt ve şifre sıfırlama sayfaları. |
| `sitemap.xml`, `robots.txt` | SEO dosyaları. |
| `WASMER-VOLUME.md` | APK dosyalarının volume ile sunulması notları. Silme. |

## 4. Mimari ve veri akışı

- Portal (`/`) ve Tıkla sayfaları statik HTML'dir; etkileşimler sayfa içi script veya `tikla/script.js` içindedir.
- `mc/` ve `bedrock/` tek sayfalık uygulama gibi davranır. Navigasyon `showContent(section)` ile yapılır ve ilgili `render*()` fonksiyonu `#content` alanına HTML üretir. URL yönlendirmesi yoktur; sayfa durumu JavaScript'tedir.
- `panel/` ayrı bir yönetici arayüzüdür; token ile korunur.
- Ortak backend bu depoda değildir. İçerik ve kullanıcı verileri Cloudflare Worker API'sinden gelir. Tüm istekler `fetch(`${API}/api/...`)` biçimindedir.

### Kimlik doğrulama

- Giriş/kayıt sonrası token `localStorage` içinde `token` anahtarında tutulur.
- Korumalı isteklerde `Authorization: Bearer <token>` başlığı gönderilir.
- Profil bilgisi `GET /api/profile` ile alınır; yönetici işlemleri aynı token ile yetkilendirilir.
- Yönetici kontrolü profil yanıtındaki `isAdmin` alanıyla yapılır.
- Çıkışta `token` ve kullanıcı bilgileri temizlenir.

### Platform ayrımı

İçerikler `platform` alanı ile ayrılır: `java`, `bedrock` veya `all`.

- Java tarafı isteklerde platform parametresi çoğunlukla gönderilmez.
- Bedrock tarafı `?platform=bedrock` kullanır (`bedrock/app.js` içinde `PLATFORM = 'bedrock'`).
- Panelde `all` seçeneği "İkisi de" olarak gösterilir.

### Sık kullanılan API uçları

| Uç | Yöntem | Açıklama |
| --- | --- | --- |
| `/api/login`, `/api/register` | POST | Giriş / kayıt |
| `/api/forgot-password` | POST | Şifre sıfırlama isteği |
| `/api/profile` | GET / PUT | Profil okuma / güncelleme |
| `/api/password` | POST / PUT | Şifre değiştirme |
| `/api/items` | GET | Market ürünleri (`?platform=`) |
| `/api/buy` | POST | Ürün satın alma |
| `/api/inventory` | GET | Kullanıcının talepleri |
| `/api/announcements`, `/api/news`, `/api/campaigns` | GET | İçerik listeleri (`?platform=`) |
| `/api/admin/requests` | GET | Tüm talepler (yönetici) |
| `/api/admin/complete-request`, `/api/admin/reject-request` | POST | Talep sonuçlandırma |
| `/api/admin/announcement`, `/api/admin/news`, `/api/admin/campaign`, `/api/admin/item` | POST / DELETE | İçerik ekleme / silme |
| `/api/notification/subscribe` | POST | Web push aboneliği |
| `/api/country` | GET | Ülke bilgisi |
| `/api/status` | GET | Portal için yedek sunucu durumu |

- API kodu bu depoda olmadığı için backend hatasını frontend'de kalıcı olarak gizleme; kullanıcıya anlaşılır durum mesajı göster.

### Sunucu durumu kaynakları

| Yer | Kaynak | Yenileme |
| --- | --- | --- |
| Portal | `api.mcsrvstat.us/3/turbolumc.aternos.me`, gerekirse `/api/status` | 60 saniye |
| Java SPA | `api.mcsrvstat.us/2/turbolumc.aternos.me` | 15 saniye |
| Bedrock SPA | `api.mcsrvstat.us/bedrock/2/turbolubedrock.mcsh.io` | 30 saniye |

- Bedrock sunucusu `turbolubedrock.mcsh.io` adresindedir ve `57.128.140.147` IP'sine çözülür.
- Alternatif doğrudan adres: `57.128.140.147:19132`.
- Eski `163.5.201.11:13317` adresi ölüdür; geri getirme.
- `mcsrvstat` yanıtları yaklaşık 5 dakika cache'lenir. Test sırasında eski oyuncu sayısı görünmesi normaldir.

## 5. Kod kuralları

- **Türkçe:** Kullanıcıya görünen tüm metinler ve yorumlar Türkçedir. Yeni metin eklerken mevcut üslubu koru.
- **Kodlama:** Tüm dosyalar UTF-8'dir. Türkçe karakterleri bozmadan kaydet. PowerShell konsolunda bozuk görünen karakterlere göre encoding "düzeltmeye" çalışma.
- **Girinti:** HTML dosyalarında 4 boşluk; JS ve CSS dosyalarında 2 boşluk.
- **Bağımlılık yok:** Framework, bundler veya npm paketi ekleme. Vanilla JS ve CSS kullan.
- **İsimlendirme:** `mc/app.js`, `bedrock/app.js` ve `panel/index.html` büyük ölçüde İngilizce fonksiyon adları kullanır (`renderShop`, `buy`, ...); `tikla/script.js`, panel ve ana portal Türkçe adlar kullanır (`temaUygula`, `kopyalaIP`, `paneliAc`). Bulunduğun dosyanın stiline uy.
- **Tema:** Kayıtlı tema yoksa işletim sisteminin `prefers-color-scheme` tercihi kullanılır. Açık tema `<html>` üzerine `.light` sınıfı eklenerek uygulanır ve `localStorage.theme` içinde saklanır. Yeni bileşenlerde CSS değişkenlerini (`var(--surface)`, `var(--text)` vb.) kullan; sabit renk yazma.
- **Önbellek kırma:** CSS/JS bağlantılarında `?v=N` kullanılır. Değiştirdiğin dosyanın ilgili HTML'deki sürüm numarasını artır.
- **Yollar:** Kök-göreli yollar (`/mc/`, `/tikla/`) ve alt dizinlerden göreli yollar (`../fa/css/...`) birlikte kullanılır. Yeni bağlantılarda mevcut dosyanın kullandığı desene uy.
- **SEO:** Yeni herkese açık sayfa eklediğinde `sitemap.xml` ve mümkünse `canonical` / Open Graph etiketlerini güncelle.

### Paylaşılan kodun senkronizasyonu

`mc/app.js` ve `bedrock/app.js` büyük ölçüde kopyalanmıştır. Şu bölümlerdeki bir düzeltme genellikle iki dosyada da yapılmalıdır:

- `esc`, `safeId`, `safeImageSrc`, `translations`, `t`, tema fonksiyonları
- Buhar/parçacık efektleri, bildirim aboneliği, `copyText` / `kopyalaIP`
- `renderUI`, `showContent`, sayfa render fonksiyonları, auth ve profil akışları

Yalnızca platforma özgü kısımlar (sunucu adresi, `PLATFORM`, `DEFAULT_AVATAR`) bilinçli olarak farklıdır.

## 6. Tasarım kuralları

### Big Sur arka planı

- Gerçek arka plan `/img/bigsur-wallpaper.webp` dosyasıdır ve `site-polish.css` içinde tanımlıdır.
- Duvar kağıdı tek parça, sabit ve dikişsiz kalmalıdır.
- `.bigsur::before` yaklaşık 12 saniyede, `body::after` yaklaşık 9 saniyede hareket eder. Yalnızca `transform` ve `opacity` animasyonu kullan; `background-position` veya `filter` ile sürekli yeniden boyama yapma.
- `site-polish.css` sayfa CSS'lerinden sonra yüklendiği için ortak arka planı o belirler. Sayfaya özel bir arka plan eklerken bu sırayı ve özgüllüğü hesaba kat.
- Kök `index.html` içindeki `.bigsur-art` SVG'si tarihseldir ve `display: none` ile gizlenir. Gerçek duvar kağıdını devre dışı bırakıp SVG'yi geri açma; ikinci bir arka plan katmanı da ekleme.
- `prefers-reduced-motion: reduce` desteğini koru.

### Sayfa karakteri

- Portal: macOS/Big Sur esintili, sakin ve ferah.
- Java (`mc/`): koyu yeşil, pixel tipografi, oyun paneli hissi.
- Bedrock: yeşil/teal vurgular, pixel başlık, kart tabanlı canlı durum paneli.
- Tıkla: daha canlı, oyun tanıtımına uygun.
- Big Sur arka planı tüm sayfalarda ortak kalır; sayfa karakteri kartlar, renkler ve tipografiyle kurulur.

### Tema

- Tema `localStorage.theme` anahtarında `dark` veya `light` olarak tutulur.
- Açık tema `<html>` elementine `light` sınıfı ekler.
- Her sayfanın `<head>` kısmında tema yanıp sönmesini önleyen küçük bir boot script'i vardır; bunu kaldırma.
- MC, Bedrock ve Tıkla sayfalarında tema düğmesi sağ altta sabittir; portalda üst çubukta yer alır. Düğme `aria-label` / `title` metinlerini günceller.

### Duyarlı tasarım

- 320, 360, 390, 768 ve 1280 px genişliklerde test et.
- Yatay taşma olmamalıdır.
- Bedrock sunucu adresi kutusu 380 px ve altında alt alta geçer; tam `turbolubedrock.mcsh.io` metni görünmelidir.
- Kullanıcıya sunucu adresini eksiksiz göster; yalnızca `text-overflow: ellipsis` ile kesmeye güvenme.

### Erişilebilirlik

- `focus-visible` çerçevelerini, `aria-live` bölgelerini ve `aria-label` metinlerini koru.
- SSS ve bağlantı yardımı için native `<details>` kullan; gereksiz JavaScript ekleme.
- İkonlar dekoratifse `aria-hidden="true"` ver.
- Kontrastı ve klavye erişimini bozma.

## 7. Güvenlik kuralları

API'den gelen içerik **asla** doğrudan `innerHTML` içine basılmamalıdır. `mc/app.js` ve `bedrock/app.js` içinde tanımlı yardımcıları kullan:

- `esc(value)` — HTML kaçışı (metin ve nitelikler için).
- `safeId(value)` — `onclick="fn('...')"` içine gömülecek kimlikleri yalnızca güvenli karakterlere indirger.
- `safeImageSrc(value)` — yalnızca yerel yol, `http(s)` veya `data:image/...;base64,` kabul eder.
- `mc/sw.js` içindeki `safeUrl()` — bildirim tıklamalarında yalnızca aynı origin'e izin verir.

Diğer notlar:

- `VAPID_PUBLIC_KEY` herkese açıktır; gizli anahtar/parola commit etme.
- Token'ları `console.log` ile yazdırma.
- Yeni bir API alanını ekrana basmadan önce mutlaka `esc()` kullan.
- `target="_blank"` bağlantılarına `rel="noopener"` ekle.
- Clipboard API başarısız olduğunda textarea + `execCommand('copy')` yedeğini koru.

## 8. İçerik ve dosya kuralları

- Kullanıcıya görünen metinler Türkçedir; `lang="tr"` ve UTF-8 kodlamasını koru.
- Tarihleri `tr-TR` biçiminde göster.
- Yeni sayfa eklerken canonical, Open Graph, `sitemap.xml` ve gerekiyorsa `robots.txt` kayıtlarını güncelle.
- Görsellerde WebP tercih et; mevcut `mc/crpr.webp` logosunu kullan.
- Tıkla APK'sı ve virüs raporu siteden sunulur:
  - `/tikla/apk/turbolutikla.apk`
  - `/tikla/apk/virus_test_sonucu.png`
- Bu iki dosyayı GitHub Releases veya başka bir dış bağlantıya taşıma. `.gitattributes` içindeki `*.apk -text` ve `*.png -text` kurallarını koru.
- APK büyük bir ikili dosyadır (yaklaşık 26 MB). Git LFS'e taşıma; mevcut yöntem bilinçli olarak seçildi.
- `mc/sw.js` yalnızca push bildirimlerini işler; önbellek (cache) stratejisi içermez. Buraya yanlışlıkla asset cache ekleme.

## 9. Test ve doğrulama

Otomatik test, lint veya CI yoktur. Değişiklikten sonra en azından:

### Sözdizimi ve diff

```powershell
node --check mc\app.js
node --check bedrock\app.js
node --check tikla\script.js
git diff --check
```

Kök `index.html` ve `panel/index.html` içindeki JavaScript sayfa içindedir; `node --check` uygulanamaz. Bu sayfaları tarayıcıda test et.

### Tarayıcı testi

1. İlgili sayfayı yerel statik sunucuda aç.
2. Koyu ve açık temada görünümü kontrol et.
3. Konsolda hata olmadığını doğrula.
4. Giriş gerektiren akışları (giriş, profil, market, talepler) test et.
5. Mobil genişlikte (320/360/390 px) taşma/bozulma olmadığına bak.
6. `mc` ve `bedrock` için ortak davranışları iki tarafta da dene.

Playwright kullanıyorsan bu makinede bundled Chromium yoktur; Edge kanalını kullan:

```js
chromium.launch({ channel: 'msedge', headless: true })
```

Şunları özellikle doğrula:

- Tema aç/kapat ve `localStorage.theme`
- Sunucu durumu ve oyuncu sayısı
- IP kopyalama, toast ve alternatif IP
- SSS açılması ve ikon dönüşü
- Mobilde yatay taşma olmaması
- 320/360/390 px'te tam sunucu adresi

Görsel değişikliklerde koyu ve açık temada ekran görüntüsü al.

### Yayın sonrası

- Push sonrası Wasmer deploy'unu bekle (genellikle 30 saniye civarı).
- Canlı HTML'de yeni `?v=` değerlerinin göründüğünü doğrula.
- Ana sayfa, `/mc/`, `/bedrock/`, `/tikla/` ve indirme dosyalarının `200` döndüğünü kontrol et.
- Canlı sayfada konsol hatası, kırık görsel ve yatay taşma olmadığını doğrula.

## 10. Git ve yayın

- Çalışma dalı `main`, uzak depo `origin` (`https://github.com/ereny116011-cloud/turboluweb.git`).
- Commit mesajları İngilizce ve emir kipinde olsun: `Upgrade Bedrock landing page`, `Fix mobile IP layout` gibi.
- Push, Wasmer üzerindeki canlı siteyi otomatik olarak günceller; ayrı bir deploy komutu yoktur.
- Geçici ekran görüntülerini, test scriptlerini ve `node_modules` klasörünü commit etme.
- Git'in `LF will be replaced by CRLF` uyarısı normaldir; satır sonlarını topluca dönüştürme.
- `tikla/apk/` altındaki binary dosyaların bozulmaması için `.gitattributes` kurallarını değiştirme.

### Wasmer volume notu

- Wasmer volume kullanılacaksa bölge `fr-roub1` olmalıdır.
- Kök `app.yaml` uygulamayı `fr-roub1` bölgesine sabitler. Support'ın doğruladığı
  volume mount path `/opt/static_app/tikla/apk` olmalıdır.
- **Volume boşken bağlanmamalıdır**, aksi halde indirme bağlantıları 404 döner.
- Ayrıntılar için `WASMER-VOLUME.md` dosyasına bak.

## 11. Bilinen tuzaklar

- **PowerShell ve Türkçe karakterler:** Konsol çıktısında `Türkiye` gibi metinler bozuk görünebilir. Dosyalar UTF-8'dir; konsol görüntüsüne göre encoding "düzeltmeye" çalışma. `read` veya editörle doğrula.
- **`site-polish.css` sırası:** Sayfa CSS'lerinden sonra yüklenir. Arka plan ve ortak stillerde beklenmeyen bir sonuç alırsan önce bu dosyayı kontrol et.
- **Eski Bedrock IP'si:** `163.5.201.11:13317` artık çalışmıyor. Yeni adres `turbolubedrock.mcsh.io`, alternatif `57.128.140.147:19132`.
- **mcsrvstat cache:** Yaklaşık 5 dakika eski veri dönebilir. Anlık testte `cachehit: true` görülmesi hata değildir.
- **Wasmer edge cache:** Push sonrası birkaç saniye eski HTML görülebilir. `?v=` değerlerini ve asset yanıtlarını kontrol et.
- **Göreli ve kök mutlak yollar:** Paylaşılan görsellerde `/img/...`, `/mc/...` gibi kök mutlak yollar kullanılır. Alt sayfalarda `../` ile karıştırma.
- **Build sistemi ekleme:** Proje bilinçli olarak build'sizdir. Zorunlu olmadıkça araç zinciri ekleme.
- **`WASMER-VOLUME.md`:** İsteğe bağlı volume notlarını silme; APK'yı site üzerinden sunma kararı bu dosyada açıklanır.
- **Eski/bağımsız MC sayfaları:** `mc/giris.html`, `mc/reset.html`, `mc/profile.html`, `mc/shop.html` ve `mc/admin.html` SPA yönlendirmesi tarafından kullanılmaz. Değişiklik yapmadan önce hangi sayfanın gerçekten kullanıldığını doğrula.
- **Font Awesome:** Dosyalar yerel `fa/` klasöründen yüklenir; CDN'e geri dönme.
