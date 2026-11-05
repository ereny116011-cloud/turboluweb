# Tıkla APK dosyaları

APK ve virüs tarama görseli artık GitHub Releases yerine doğrudan siteden sunuluyor:

- `https://turboluweb.wasmer.app/tikla/apk/turbolutikla.apk`
- `https://turboluweb.wasmer.app/tikla/apk/virus_test_sonucu.png`

Dosyalar şu anda `tikla/apk/` klasöründe ve siteyle birlikte yayınlanıyor.

## Wasmer volume kullanmak isterseniz

Wasmer volume'ları tek bir bölgeye sabitlenmiş uygulamalarda çalışır. Canlı site
`fr-roub1` bölgesinden sunulduğu için uygulamayı bu bölgeye sabitleyin:

1. Wasmer panelinde uygulamayı açın.
2. Settings / Regions bölümünde bölgeyi `fr-roub1` olarak seçip kaydedin.
3. Storage → Add volume ekranında:
   - Ad: `tikla-apk`
   - Mount path: `/public/tikla/apk`
   - Boyut: `2 GB`
4. Volume oluştuktan sonra dosya gezgininden `turbolutikla.apk` ve
   `virus_test_sonucu.png` dosyalarını yükleyin. S3 erişimini açarsanız rclone ile
   de yükleyebilirsiniz.
5. Uygulamayı yeniden deploy edin.

Önemli: Volume boşken `/public/tikla/apk` dizinini gölgeler. Bu yüzden dosyaları
volume'a yüklemeden volume'u bağlamayın; aksi halde indirme bağlantıları geçici
olarak 404 döner.

Uygulamanın kök dizini `/public` değil de doğrudan depo kökü ise mount path'i
`/tikla/apk` yapın. Wasmer panelindeki dosya gezgininde site dosyalarının hangi
dizinde göründüğüne bakarak bunu doğrulayabilirsiniz.
