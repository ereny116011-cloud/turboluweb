# TurboluApp PC

Turbolu Studios'un masaüstü uygulaması. Tarayıcıda site açmaz; kendi arayüzüyle
doğrudan Worker API'sini kullanır.

- **Teknoloji:** Electron + vanilla HTML/CSS/JS (framework yok)
- **Platformlar:** Windows (NSIS kurulum + portable), Linux (AppImage + deb),
  macOS (Intel `x64` ve Apple Silicon `arm64` ayrı)
- **API:** `https://shrill-salad-a498.ereny116011.workers.dev`
- **Lisans:** GPL-3.0-only

## Özellikler

| Bölüm | İçerik |
| --- | --- |
| Genel Bakış | Java ve Bedrock sunucu durumu, oyuncu sayısı, son duyurular |
| Duyurular / Haberler / Kampanyalar | Platform filtreli içerik akışları |
| Market | Ürün listesi, bakiye kontrolü, onaylı satın alma |
| Hesabım | Giriş/kayıt, GitHub ve Google ile sosyal giriş, profil, bakiye, talepler (envanter) |
| Karşılama | İlk açılışta giriş ekranı; misafir olarak devam etme seçeneği |
| Yönetim | Talepleri sonuçlandırma, hesap yasaklama/silme ve içerik ekleme (yalnızca yönetici) |
| Ayarlar | Tema (sistem/koyu/açık), platform filtresi, uygulama bilgisi |

## Güvenlik modeli

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- Renderer'ın ağ erişimi yoktur (`connect-src 'none'`); tüm istekler ana süreçte
  yapılır ve yalnızca izin listesindeki API yollarına (`API_ROUTES`) çıkılır.
- API yanıtları 4 MB, istek gövdeleri 3 MB ile sınırlandırılır; bozuk JSON sessizce
  boş nesneye çevrilir.
- Dış bağlantılar yalnızca site, GitHub ve Worker origin'lerine açılabilir; kimlik
  bilgisi içeren (`https://site@baska-host`) adresler reddedilir. Pencere içinde
  yalnızca uygulamanın kendi dosyası açılabilir.
- Profil görselleri yalnızca yerel yol, `data:image` veya izinli avatar
  sunucularından yüklenir; CSP `img-src` listesi de aynı sunucularla sınırlıdır.
- Medya, bildirim, konum ve diğer tüm tarayıcı izinleri reddedilir.
- Oturum token'ı `userData/session.json` içinde `safeStorage` ile şifrelenir.
  Şifreleme kullanılamıyorsa (anahtar zinciri olmayan Linux) düz metin saklanır.
- Sosyal girişte sağlayıcı sayfası sistem tarayıcısında açılır. Dönüş yalnızca
  `127.0.0.1` üzerindeki tek kullanımlık, rastgele yollu yerel dinleyiciye yapılır;
  OAuth client secret'ları yalnızca Worker ortamında tutulur.

## Geliştirme

```powershell
cd desktop
npm install
npm start
```

## Derleme

```powershell
# Windows: NSIS kurulum + portable
npm run dist:win

# Linux: AppImage + deb (Linux makine veya CI gerekir)
npm run dist:linux

# macOS: x64 + arm64 dmg/zip (macOS makine veya CI gerekir)
npm run dist:mac
```

Çıktılar `desktop/dist/` altına yazılır:

| Platform | Dosya |
| --- | --- |
| Windows | `TurboluApp-Setup-<sürüm>.exe`, `TurboluApp-Portable-<sürüm>.exe` |
| Linux | `TurboluApp-<sürüm>-x64.AppImage`, `TurboluApp-<sürüm>-amd64.deb` |
| macOS | `TurboluApp-<sürüm>-x64.dmg/.zip`, `TurboluApp-<sürüm>-arm64.dmg/.zip` |

macOS paketleri imzasız üretilir; dağıtımdan önce Apple Developer sertifikasıyla
imzalanmalı ve noter onayından geçirilmelidir (`CSC_LINK`, `CSC_KEY_PASSWORD`).
Windows'ta kod imzalama sertifikası yoksa SmartScreen uyarısı çıkabilir.
Windows paketleri proje sahibinin kendi sertifikasıyla imzalanır; adımlar ve
gereken GitHub sırları: `desktop/SIGNING.md`.

Her derlemeden sonra `dist/SHA256SUMS.txt` üretilir; doğrulama için
`npm run checksums` komutu kullanılabilir.

Linux ve macOS çıktıları bu depodaki GitHub Actions iş akışıyla üretilir:
`.github/workflows/desktop.yml`. İş akışı `desktop-v*` etiketiyle veya
**Actions → TurboluApp PC derleme → Run workflow** ile tetiklenir; çıktılar
çalıştırma sayfasının altındaki **Artifacts** bölümünden indirilir.

> Son başarılı derleme: [TurboluApp PC derleme #1](https://github.com/ereny116011-cloud/turboluweb/actions/runs/42851909453)

## API uçları

Uygulama yalnızca şu uçları kullanır:

- `POST /api/login`, `POST /api/register`
- `GET /api/profile`
- `GET /api/items`, `POST /api/buy`, `GET /api/inventory`
- `GET /api/announcements`, `GET /api/news`, `GET /api/campaigns`

Yönetici hesabında ek olarak:

- `GET /api/admin/requests`, `GET /api/admin/users`
- `POST /api/admin/complete-request`, `POST /api/admin/reject-request`
- `POST /api/admin/ban-user`, `POST /api/admin/unban-user`, `POST /api/admin/delete-user`
- `POST/DELETE /api/admin/announcement`, `/api/admin/news`, `/api/admin/campaign`
- `POST /api/admin/item`

Sunucu durumu doğrudan `api.mcsrvstat.us` üzerinden alınır.
