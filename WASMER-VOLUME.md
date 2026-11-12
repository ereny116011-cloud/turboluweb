# Tıkla APK dosyaları — Wasmer volume

APK ve virüs tarama görseli doğrudan siteden sunuluyor:

- `https://turboluweb.wasmer.app/tikla/apk/turbolutikla.apk`
- `https://turboluweb.wasmer.app/tikla/apk/virus_test_sonucu.png`

Aynı şekilde TurboluApp PC kurulum dosyası da siteden sunuluyor:

- `https://turboluweb.wasmer.app/desktop/download/TurboluApp-Setup-1.0.0.exe`
- `https://turboluweb.wasmer.app/desktop/download/SHA256SUMS.txt`

## Durum

| Dosya | Nerede | Durum |
| --- | --- | --- |
| `turbolutikla.apk` (26 MB) | Volume `tikla-apk` → `/opt/static_app/tikla/apk` | Volume'a taşınıyor |
| `virus_test_sonucu.png` | Aynı volume | Volume'a taşınıyor |
| `TurboluApp-Setup-1.0.0.exe` (2,3 MB) | Repoda (`desktop/download/`) | Repoda kalıyor |

Volume tek bir bölgeye sabitlenmiş uygulamalarda çalışır. Canlı site
`fr-roub1` bölgesinden sunulduğu için uygulama bu bölgeye sabitlenmiş olmalı
(`app.yaml` kökte ve `main` dalında).

## Adımlar

### 1. Volume'u oluştur

Wasmer Storage → **Add volume**:

| Alan | Değer |
| --- | --- |
| Ad | `tikla-apk` |
| Mount path | `/opt/static_app/tikla/apk` |
| Boyut | `2 GB` |
| Bölge | `fr-roub1` |

Mount path kesin olarak `/opt/static_app/tikla/apk` olmalıdır — Wasmer
Support, site dosyalarının `/opt/static_app` altında sunulduğunu doğruladı.

### 2. Dosyaları yükle

İki yol var.

**a) Wasmer arayüzünden** — Storage ekranında volume'u açıp dosyaları sürükle-bırak
ile yükle. 26 MB için yeterli.

**b) S3 access ile komut satırından** — Volume oluştururken **S3 access**
seçeneğini açarsan Wasmer bir S3 uyumlu adres ve anahtar verir. Bu bilgilerle
`rclone` kullanarak yüklemek çok daha hızlıdır:

```bash
winget install --id Rclone.Rclone --exact   # Windows'ta bir kez

# Depodaki yardımcı betik (endpoint/anahtar bilgilerini ortamdan okur):
export WASMER_S3_ENDPOINT="https://..."
export WASMER_S3_ACCESS_KEY="..."
export WASMER_S3_SECRET_KEY="..."
export WASMER_BUCKET="tikla-apk"
./tikla/apk/yukle-apk.sh
```

Betiğin yaptıkları:
- `rclone` uzak tanımını oluşturur (`wasmer` adıyla)
- `tikla/apk/` klasörünü volume'a kopyalar (`--checksum` ile)
- Yüklenen dosyaları listeler

Elle kullanmak istersen:

```bash
rclone config create wasmer s3 provider Other \
  endpoint "$WASMER_S3_ENDPOINT" \
  access_key_id "$WASMER_S3_ACCESS_KEY" \
  secret_access_key "$WASMER_S3_SECRET_KEY"

rclone copy tikla/apk wasmer:tikla-apk --checksum --progress
rclone lsf wasmer:tikla-apk
```

### 3. Bağla ve yeniden deploy et

Volume'u uygulamaya bağlayıp yeniden deploy et.

### 4. Doğrula

```bash
curl -sI https://turboluweb.wasmer.app/tikla/apk/turbolutikla.apk
# 200 OK ve Content-Length: 26460341 beklenir
```

### 5. APK'yı repodan çıkar

Volume doğrulandıktan sonra `tikla/apk/turbolutikla.apk` dosyasını
depodan kaldır — 26 MB'lık ikiliyi repoda tutmaya gerek kalmaz.

## Uyarılar

- Volume bağlandığında `tikla/apk` dizinini **gölgeler**. Dosyaları volume'a
  yüklemeden bağlama; aksi halde indirme bağlantıları 404 döner.
- Volume tek bölgede çalışır. Uygulama `fr-roub1` dışına taşınırsa APK'ya
  erişim bozulur.
- Volume'a yüklenen dosyalar depoya yansımaz; `tikla/apk/yukle-apk.sh` betiği
  repodaki dosyaları okur, yani volume'a yüklemeden önce APK'nın depoda
  olduğundan emin ol.
- `tikla/apk/yukle-apk.sh` betiğini depoda tutmak zorunda değilsin; yalnızca
  yükleme anında kullanılır.
