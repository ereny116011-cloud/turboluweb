# Tıkla APK dosyaları

APK ve virüs tarama görseli artık GitHub Releases yerine doğrudan siteden sunuluyor:

- `https://turboluweb.wasmer.app/tikla/apk/turbolutikla.apk`
- `https://turboluweb.wasmer.app/tikla/apk/virus_test_sonucu.png`

Dosyalar şu anda `tikla/apk/` klasöründe ve siteyle birlikte yayınlanıyor.

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
   S3 erişimini açarsanız rclone ile de yükleyebilirsiniz.
5. Volume'u uygulamaya bağlayın ve yeniden deploy edin.

Önemli: Volume bağlandığında mevcut `tikla/apk` dizinini gölgeler. Dosyaları
volume'a yüklemeden bağlamayın; aksi halde indirme bağlantıları geçici olarak
404 döner.

Wasmer Support, bu uygulamanın site dosyalarının `/opt/static_app` altında
sunulduğunu doğruladı. Bu uygulamada mount path kesin olarak
`/opt/static_app/tikla/apk` olmalıdır.
