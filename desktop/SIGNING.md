# Kod imzalama

TurboluApp PC paketleri varsayılan olarak **imzasız** üretilir. İmza, yalnızca
sertifika ve parola ortam değişkenleri verildiğinde otomatik uygulanır; hiçbir
sır depoya yazılmaz.

## Windows: kendi sertifikan (seçilen yöntem)

Gereken: bir kod imzalama sertifikası (`.pfx` / `.p12`). OV veya EV sertifika
kullanılabilir. Sertifika yoksa SmartScreen "Bilinmeyen yayıncı" uyarısı verir.

```powershell
cd desktop
$env:CSC_LINK = "C:\yol\sertifika.pfx"     # veya base64 metni
$env:CSC_KEY_PASSWORD = "sertifika-parolasi"
npm run dist:win
```

Sertifika parolası komut satırına yazılmak istenmiyorsa `CSC_KEY_PASSWORD`
değerini oturum boyunca ortam değişkeni olarak ver veya build sırasında
PowerShell `Read-Host -AsSecureString` ile al.

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

Ardından yukarıdaki `CSC_LINK` / `CSC_KEY_PASSWORD` değişkenleriyle derle.
Aynı sertifikayla imzalanmış eski sürümlerin güncellemeleri sorunsuz çalışır.

GitHub Actions için depo sırları:

| Sır | Değer |
| --- | --- |
| `WIN_CSC_LINK` | `.pfx` dosyasının base64'ü (`[IO.File]::ReadAllBytes(...)` + `[Convert]::ToBase64String`) |
| `WIN_CSC_KEY_PASSWORD` | Sertifika parolası |

Base64 üretmek için:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\yol\sertifika.pfx")) | Set-Clipboard
```

## macOS

Gerekenler: Apple Developer Program üyeliği ve **Developer ID Application**
sertifikası. İmzalama ve noter onayı yalnızca macOS çalıştırıcısında yapılabilir;
iş akışı bunu otomatik yapar.

| Sır | Değer |
| --- | --- |
| `MAC_CSC_LINK` | Developer ID Application `.p12` dosyasının base64'ü |
| `MAC_CSC_KEY_PASSWORD` | `.p12` parolası |
| `APPLE_ID` | Apple hesabının e-postası |
| `APPLE_APP_SPECIFIC_PASSWORD` | appleid.apple.com üzerinden üretilen uygulamaya özel parola |
| `APPLE_TEAM_ID` | Apple Developer Team ID |

`APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` ve `APPLE_TEAM_ID` birlikte verildiğinde
electron-builder paketi `notarytool` ile noter onayına gönderir. Bu değerler yoksa
noter onayı atlanır ve paket imzasız/onaysız kalır.

Sertifikayı anahtar zincirinden dışa aktarma (macOS):

1. **Keychain Access → Sertifikalar** bölümünde "Developer ID Application" öğesini bul.
2. Sağ tık → **Export** → `.p12` seç, bir parola belirle.
3. Dosyayı base64'e çevirip `MAC_CSC_LINK` sırrına yaz.

## Doğrulama

```powershell
# Windows
Get-AuthenticodeSignature desktop\dist\TurboluApp-Setup-1.0.0.exe | Format-List Status, SignerCertificate

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
