# Turbolu Studios

Turbolu Studios'un web sitesi ve masaüstü uygulaması. Site tamamen statiktir;
HTML, CSS ve vanilla JavaScript dosyaları doğrudan sunulur. Derleme adımı,
paket yöneticisi veya build aracı yoktur.

- **Canlı site:** <https://turboluweb.wasmer.app/>
- **Lisans:** [GPL-3.0-only](LICENSE)

## Sayfalar

| Sayfa | Adres |
| --- | --- |
| Portal | <https://turboluweb.wasmer.app/> |
| Java sunucusu | <https://turboluweb.wasmer.app/mc/> |
| Bedrock sunucusu | <https://turboluweb.wasmer.app/bedrock/> |
| Turbolu Tıkla | <https://turboluweb.wasmer.app/tikla/> |

## TurboluApp PC

Turbolu Studios'un Electron tabanlı masaüstü uygulaması. Siteyi gömmez; kendi
arayüzüyle doğrudan Worker API'sini kullanır.

Desteklenen platformlar: Windows (kurulum + portable), Linux (AppImage + deb),
macOS (Intel ve Apple Silicon).

- İndirme ve kurulum: [desktop/README.md](desktop/README.md)
- Derleme ve imzalama: [desktop/SIGNING.md](desktop/SIGNING.md)
- Sürümler: <https://github.com/ereny116011-cloud/turboluweb/releases>

> Windows paketleri proje sahibinin kendi kod imzalama sertifikasıyla imzalanır.
> Sertifika yoksa paketler imzasız yayınlanır ve SmartScreen uyarısı gösterebilir.
> macOS paketleri Apple Developer Program üyeliği gerektirdiği için imzasız ve
> notersizdir.

## Yerel önizleme

```powershell
python -m http.server 8080
```

Ardından <http://localhost:8080/> adresini aç. Sayfaları doğrudan `file://` ile
açma; `fetch`, Clipboard API ve service worker bu şekilde çalışmaz.

## Depo yapısı

| Yol | İçerik |
| --- | --- |
| `index.html`, `style.css`, `script.js` | Ana portal |
| `mc/` | TurboluMC Java Edition SPA'sı |
| `bedrock/` | Turbolu Bedrock SPA'sı |
| `tikla/` | Turbolu Tıkla tanıtım sitesi ve APK |
| `panel/` | İçerik yönetim paneli |
| `desktop/` | TurboluApp PC (Electron) |
| `worker/` | Worker entegrasyon belgeleri |
| `fa/`, `img/` | Yerel Font Awesome ve görseller |

Geliştirme kuralları için [AGENTS.md](AGENTS.md) dosyasına bak.
