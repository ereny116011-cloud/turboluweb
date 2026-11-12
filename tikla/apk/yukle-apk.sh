#!/usr/bin/env bash
# Turbolu Tıkla APK'sını Wasmer volume'a yükler.
#
# Wasmer Storage ekranında volume'u oluştururken "S3 access" seçeneğini
# açarsanız bir S3 uyumlu adres ve anahtar verir. Bu değişkenler o bilgiler
# yerine geçmelidir.
#
# Kullanım:
#   WASMER_S3_ENDPOINT=https://...  WASMER_S3_ACCESS_KEY=...  \
#   WASMER_S3_SECRET_KEY=...  WASMER_BUCKET=tikla-apk  ./yukle-apk.sh

set -euo pipefail

# --- Ayarlar ---------------------------------------------------------------
BUCKET="${WASMER_BUCKET:-tikla-apk}"
REMOTE="${WASMER_REMOTE:-wasmer:tikla-apk}"
APK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/tikla/apk"

# --- Kontrol ---------------------------------------------------------------
command -v rclone >/dev/null 2>&1 || {
  echo "HATA: rclone kurulu degil." >&2
  echo "  winget install --id Rclone.Rclone --exact" >&2
  exit 1
}

if [[ ! -f "$APK_DIR/turbolutikla.apk" ]]; then
  echo "HATA: $APK_DIR/turbolutikla.apk bulunamadi." >&2
  exit 1
fi

# --- Uzak tanımı -----------------------------------------------------------
if [[ -n "${WASMER_S3_ENDPOINT:-}" ]]; then
  echo "S3 uzak tanimi olusturuluyor..."
  rclone config create wasmer s3 \
    provider "Other" \
    endpoint "$WASMER_S3_ENDPOINT" \
    access_key_id "$WASMER_S3_ACCESS_KEY" \
    secret_access_key "$WASMER_S3_SECRET_KEY" \
    env_auth "false"
fi

# --- Yükleme ---------------------------------------------------------------
echo "Yukleniyor: $APK_DIR -> $REMOTE"
rclone copy "$APK_DIR" "$REMOTE" --progress --checksum

# --- Dogrulama -------------------------------------------------------------
echo ""
echo "Dogrulama:"
rclone lsf "$REMOTE"

echo ""
echo "Tamam. Simdi Wasmer panelinde:"
echo "  1. Storage -> Volume '$BUCKET' dosyalarini kontrol edin"
echo "  2. Mount path: /opt/static_app/tikla/apk"
echo "  3. Volume'u uygulamaya baglayip yeniden deploy edin"
echo "  4. Dogrulama: curl -sI https://turboluweb.wasmer.app/tikla/apk/turbolutikla.apk"
