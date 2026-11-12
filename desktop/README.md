# TurboluApp PC

Turbolu Studios'un masaüstü uygulaması. Tarayıcıda site açmaz; kendi
arayüzüyle doğrudan Worker API'sini kullanır.

- **T teknoloji:** Rust (Tauri 2) + vanilla HTML/CSS/JS arayüz
- **Platformlar:** Windows (NSIS kurulum), Linux (AppImage + deb),
  macOS (Intel `x64` ve Apple Silicon `arm64` ayrı)
- **API:** `https://shrill-salad-a498.ereny116011.workers.dev`
- **Lisans:** GPL-3.0-only

## Mimari

| Katman | Dil | Konum |
| --- | --- | --- |
| Arayüz | HTML/CSS/JS | `src/renderer/` |
| Köprü | JavaScript | `src/renderer/bridge.js` |
| Uygulama | Rust | `src-tauri/src/` |

Arayüz Electron'dan bu projeye taşındı; tasarım birebir korunmuştur. Ağ
istekleri, oturum saklama, sosyal giriş köprüsü ve pencere işlemleri artık
Rust tarafında yapılır. Renderer'ın ağ erişimi yoktur; tüm istekler
`bridge.js` üzerinden Rust komutlarına gider.

Rust modülleri:

- `main.rs` — Tauri kurulumu, komutlar, pencere yönetimi
- `api.rs` — Worker API istemcisi ve izin listesi
- `session.rs` — oturum token'ının işletim sistemi anahtar deposunda saklanması
- `oauth.rs` — sosyal giriş için yerel HTTP köprüsü

## Özellikler

| Bölüm | İçerik |
| --- | --- |
| Genel Bakış | Java ve Bedrock sunucu durumu, oyuncu sayısı, son duyurular, çocuk hesaplarına özel hediyeler |
| Duyurular / Haberler / Kampanyalar | Platform filtreli içerik akışları |
| Market | Ürün listesi, bakiye kontrolü, onaylı satın alma |
| Hesabım | Giriş/kayıt, GitHub ve Google ile sosyal giriş, profil, bakiye, talepler (envanter) |
| Karşılama | İlk açılışta giriş ekranı; misafir olarak devam etme seçeneği |
| Hesap kurulumu | Kayıt sonrası Minecraft kullanıcı adları (Java/Bedrock) ve doğum tarihi |
| Yönetim | Talepleri sonuçlandırma, hesap yasaklama/silme, içerik ve çocuk hediyesi ekleme (yalnızca yönetici) |
| Ayarlar | Tema (sistem/koyu/açık), platform filtresi, uygulama bilgisi |

### Hesap kurulumu

Kayıt sonrası (veya kurulumu tamamlanmamış bir hesapla giriş sonrası) kurulum
ekranı açılır:

- Java sürümü Minecraft kullanıcı adı (`A-Z`, `0-9`, `_`, 3-16 karakter)
- Bedrock sürümü oyuncu adı (2-20 karakter; harf, rakam, boşluk, `_`, `.`, `-`)
- Doğum tarihi (zorunlu, gelecek tarih kabul edilmez)

En az bir Minecraft kullanıcı adı girilmelidir. Doğum tarihi sunucuda
13 yaş sınırına göre değerlendirilir; 13 yaşından küçük hesaplar "çocuk hesabı"
sayılır ve Genel Bakış'ta çocuklara özel hediyeler gösterilir. Doğum tarihi
başka kullanıcılara gösterilmez ve yalnızca yaş hesabı için saklanır.

## Güvenlik modeli

- Renderer'da Node.js yoktur; ağ erişimi yoktur (`connect-src` yalnızca IPC).
  Tüm istekler Rust tarafında yapılır ve yalnızca izin listesindeki API
  yollarına (`API_ROUTES`) çıkılır.
- API yanıtları 4 MB, istek gövdeleri 3 MB ile sınırlandırılır; bozuk JSON
  sessizce boş nesneye çevrilir.
- Dış bağlantılar yalnızca site, GitHub ve Worker origin'lerine açılabilir;
  kimlik bilgisi içeren (`https://site@baska-host`) adresler reddedilir.
- Profil görselleri yalnızca yerel yol, `data:image` veya izinli avatar
  sunucularından yüklenir; CSP `img-src` listesi de aynı sunucularla sınırlıdır.
- Oturum token'ı işletim sistemi anahtar deposunda saklanır (Windows:
  Credential Manager, macOS: Keychain, Linux: Secret Service). Depo
  kullanılamıyorsa token kullanıcıya özel dosya izinleriyle (`0600`) düz metin
  olarak yazılır.
- Sosyal girişte sağlayıcı sayfası sistem tarayıcısında açılır. Dönüş yalnızca
  `127.0.0.1` üzerindeki tek kullanımlık, rastgele yollu yerel dinleyiciye yapılır;
  OAuth client secret'ları yalnızca Worker ortamında tutulur.

## Geliştirme

Rust araç zinciri (`rustup`) ve WebView2 gerekir.

```powershell
cd desktop
cargo tauri dev
```

## Derleme

```powershell
# Windows: NSIS kurulum
cargo tauri build --bundles nsis

# Linux: AppImage + deb (Linux makine veya CI gerekir)
cargo tauri build --bundles deb,appimage

# macOS: x64 + arm64 dmg (macOS makine veya CI gerekir)
cargo tauri build --bundles dmg
```

Çıktılar `src-tauri/target/release/bundle/` altına yazılır:

| Platform | Dosya |
| --- | --- |
| Windows | `nsis/TurboluApp_<sürüm>_x64-setup.exe` |
| Linux | `appimage/turboluapp_<sürüm>_amd64.AppImage`, `deb/…deb` |
| macOS | `dmg/TurboluApp_<sürüm>_x64.dmg`, `…_arm64.dmg` |

macOS paketleri imzasız üretilir; dağıtımdan önce Apple Developer sertifikasıyla
imzalanmalı ve noter onayından geçirilmelidir (`APPLE_SIGNING_IDENTITY`).
Windows'ta kod imzalama sertifikası yoksa SmartScreen uyarısı çıkabilir.
Windows paketleri proje sahibinin kendi sertifikasıyla imzalanır; adımlar ve
gereken GitHub sırları: `desktop/SIGNING.md`.

Her derlemeden sonra sağlama toplamı üretilir:

```powershell
cargo run --release --bin checksums -- src-tauri/target/release/bundle
```

Linux ve macOS çıktıları bu depodaki GitHub Actions iş akışıyla üretilir:
`.github/workflows/desktop.yml`. İş akışı `desktop-v*` etiketiyle veya
**Actions → TurboluApp PC derleme → Run workflow** ile tetiklenir; çıktılar
çalıştırma sayfasının altındaki **Artifacts** bölümünden indirilir.

## API uçları

Uygulama yalnızca şu uçları kullanır:

- `POST /api/login`, `POST /api/register`
- `GET /api/profile`, `PUT /api/profile`
- `GET /api/items`, `POST /api/buy`, `GET /api/inventory`
- `GET /api/announcements`, `GET /api/news`, `GET /api/campaigns`
- `GET /api/child-gifts`

Yönetici hesabında ek olarak:

- `GET /api/admin/requests`, `GET /api/admin/users`
- `POST /api/admin/complete-request`, `POST /api/admin/reject-request`
- `POST /api/admin/ban-user`, `POST /api/admin/unban-user`, `POST /api/admin/delete-user`
- `POST/DELETE /api/admin/announcement`, `/api/admin/news`, `/api/admin/campaign`
- `POST /api/admin/item`
- `GET /api/admin/child-gifts`, `POST /api/admin/child-gift`,
  `POST /api/admin/child-gift/publish`, `DELETE /api/admin/child-gift`

Sunucu durumu doğrudan `api.mcsrvstat.us` üzerinden alınır.
