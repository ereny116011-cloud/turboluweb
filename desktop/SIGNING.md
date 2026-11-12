# Kod imzalama

TurboluApp PC paketleri varsayılan olarak **imzasız** üretilir. İmza, yalnızca
sertifika ve parola ortam değişkenleri verildiğinde otomatik uygulanır; hiçbir
sır depoya yazılmaz.

## Windows: kendi sertifikan

Gereken: bir kod imzalama sertifikası (`.pfx` / `.p12`). OV veya EV sertifika
kullanılabilir. Sertifika yoksa SmartScreen "Bilinmeyen yayıncı" uyarısı verir.

Tauri, imzayı `signtool.exe` ile yapar. Sertifikayı Windows depo içine
aktarmak ve parolayı ortam değişkeniyle vermek gerekir:

```powershell
cd desktop

# 1) Sertifikayı CurrentUser\My deposuna ekle (parola sorulur)
$pfx = "C:\yol\turbolu-codesign.pfx"
Import-PfxCertificate -FilePath $pfx -CertStoreLocation Cert:\CurrentUser\My

# 2) Başparmak izini (thumbprint) öğren
Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert |
  Select-Object Subject, Thumbprint, NotAfter

# 3) Derle (thumbprint'ı yapıştır)
$env:TAURI_BUNDLE_WINDOWS_CERTIFICATE_THUMBPRINT = "ABCDEF0123456789..."
$env:TAURI_BUNDLE_WINDOWS_CERTIFICATE_TIMESTAMP_SERVER = "http://timestamp.digicert.com"
cargo tauri build --bundles nsis
```

Alternatif: `signCommand` ile doğrudan `signtool` çağrılabilir. Bu durumda
parola ortam değişkeni üzerinden geçirilir.

```powershell
$env:SIGNTOOL_PASSWORD = "sertifika-parolasi"
cargo tauri build --bundles nsis
```

`tauri.conf.json` içindeki `bundle.windows.signCommand` değeri bu durumda
`signtool sign /f "<pfx yolu>" /p %SIGNTOOL_PASSWORD% /fd SHA256 /tr <zaman damgası sunucusu> /td SHA256 %1`
şeklinde ayarlanabilir.

Sertifika parolası komut satırına yazılmak istenmiyorsa ortam değişkeni
kullanılmalı; hiçbir sır depoya yazılmaz.

### Sertifikan yoksa: kendinden imzalı sertifika

Kendinden imzalı sertifika ücretsizdir ve dosyada geçerli bir imza oluşturur.
Ancak işletim sistemi sertifikayı güvenilir kabul etmediği için SmartScreen
uyarısı devam eder; imza yalnızca sertifika o makinede güvenilir listeye
eklendiğinde doğrulanır. Uyarısız dağıtım için satın alınmış bir OV/EV kod
imzalama sertifikası gerekir.

```powershell
# 1) Sertifikayı oluştur (CurrentUser\My deposuna yazılır)
$cert = New-SelfSignedCertificate `
  -Type CodeSigningCert `
  -Subject "CN=Turbolu Studios" `
  -KeyUsage DigitalSignature `
  -FriendlyName "TurboluApp Code Signing" `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -NotAfter (Get-Date).AddYears(5)

# 2) Parolalı .pfx olarak dışa aktar
$pwd = ConvertTo-SecureString -String "PAROLA" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "C:\yol\turbolu-codesign.pfx" -Password $pwd
```

GitHub Actions için depo sırları:

| Sır | Değer |
| --- | --- |
| `WIN_CSC_LINK` | `.pfx` dosyasının base64'ü (`[IO.File]::ReadAllBytes(...)` + `[Convert]::ToBase64String`) |
| `WIN_CSC_KEY_PASSWORD` | Sertifika parolası |

Base64 üretmek için:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\yol\turbolu-codesign.pfx")) | Set-Clipboard
```

## macOS

Gerekenler: Apple Developer Program üyeliği ve **Developer ID Application**
sertifikası. İmzalama ve noter onayı yalnızca macOS çalıştırıcısında yapılabilir;
iş akışı bunu otomatik yapar.

| Sır | Değer |
| --- | --- |
| `APPLE_SIGNING_IDENTITY` | Developer ID Application sertifikasının adı |
| `APPLE_ID` | Apple hesabının e-postası |
| `APPLE_APP_SPECIFIC_PASSWORD` | appleid.apple.com üzerinden üretilen uygulamaya özel parola |
| `APPLE_TEAM_ID` | Apple Developer Team ID |

`APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` ve `APPLE_TEAM_ID` birlikte verildiğinde
Tauri paketi `notarytool` ile noter onayına gönderir. Bu değerler yoksa noter
onayı atlanır ve paket imzasız/onaysız kalır.

Sertifikayı anahtar zincirinden dışa aktarma (macOS):

1. **Keychain Access → Sertifikalar** bölümünde "Developer ID Application" öğesini bul.
2. Sağ tık → **Export** → `.p12` seç, bir parola belirle.
3. Dosyayı base64'e çevirip ilgili sıra yaz.

## Doğrulama

```powershell
# Windows
Get-AuthenticodeSignature desktop\src-tauri\target\release\bundle\nsis\*.exe |
  Format-List Status, SignerCertificate

# macOS (macOS makinede)
codesign --verify --deep --strict --verbose=2 TurboluApp.app
spctl --assess --type execute --verbose TurboluApp.app
```

## Linux

AppImage ve deb için ortak bir kod imzalama standardı yoktur. İş akışı her
derlemede `SHA256SUMS.txt` üretir; indirdikten sonra doğrulayabilirsin:

```bash
sha256sum -c SHA256SUMS.txt
```
