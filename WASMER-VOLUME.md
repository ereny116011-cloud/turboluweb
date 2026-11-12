# Tıkla APK dosyaları

APK ve virüs tarama görseli artık GitHub Releases yerine doğrudan siteden sunuluyor:

- `https://turboluweb.wasmer.app/tikla/apk/turbolutikla.apk`
- `https://turboluweb.wasmer.app/tikla/apk/virus_test_sonucu.png`

Aynı şekilde TurboluApp PC kurulum dosyası da siteden sunuluyor:

- `https://turboluweb.wasmer.app/desktop/download/TurboluApp-Setup-1.0.0.exe`
- `https://turboluweb.wasmer.app/desktop/download/SHA256SUMS.txt`

Dosyalar şu anda `tikla/apk/` ve `desktop/download/` klasörlerinde ve siteyle
birlikte yayınlanıyor. Volume'a **bağlı değil**; aşağıdaki bölüm yalnızca
dosyaları volume üzerinden sunmak isteyenler için bir alternatiftir.

## Wasmer volume kullanmak isterseniz

Wasmer volume'ları tek bir bölgeye sabitlenmiş uygulamalarda çalışır. Canlı site
`fr-roub1` bölgesinden sunulduğu için uygulamayı bu bölgeye sabitleyin:

1. `app.yaml` dosyasını kökte tutup değişikliği `main` dalına gönderin.
2. Wasmer deployment tamamlandığında uygulama `fr-roub1` bölgesine sabitlenir.
3. Storage → Add volume ekranında şu değerlerle volume oluşturun:
   - Ad: `tikla-apk`
   - Mount path: `/opt/static_app/tikla/apk`
   - Boyut: `2 GB`
4. Volume'a `turbolutikla.apk` ve `virus_test_sonucu.png` dosyalarını yükleyin.
   Storage ekranındaki **S3 access** seçeneği, volume'u S3 uyumlu bir
   adresle doldurmanızı sağlar; büyük dosyayı tarayıcıdan yüklemek yerine
   komut satırından yüklemek isterseniz kullanılır:

   ```bash
   rclone copy turbolutikla.apk wasmer:tikla-apk/turbolutikla.apk
   ```

   S3 access yalnızca bu adımı kolaylaştırır; zorunlu değildir ve
   kullanılmadığında dosyalar Wasmer'ın web arayüzünden de yüklenebilir.
5. Volume'u uygulamaya bağlayın ve yeniden deploy edin.

Önemli: Volume bağlandığında mevcut `tikla/apk` dizinini gölgeler. Dosyaları
volume'a yüklemeden bağlamayın; aksi halde indirme bağlantıları geçici olarak
404 döner.

Wasmer Support, bu uygulamanın site dosyalarının `/opt/static_app` altında
sunulduğunu doğruladı. Bu uygulamada mount path kesin olarak
`/opt/static_app/tikla/apk` olmalıdır.
