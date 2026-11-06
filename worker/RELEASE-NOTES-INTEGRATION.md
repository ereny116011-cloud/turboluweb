# Sürüm notu API entegrasyonu

APK/volume yükleme kapsam dışı bırakıldı. Sürüm notları, mevcut Worker'ın veri
katmanında saklanır: kalıcı veri **Cloudflare D1** veritabanı (`MC_DB` bağlantısı)
içinde tutulur; **R2 (ya da yeni bir ikili dosya depolaması) kullanma** — projede
R2 bağlantısı yoktur ve eklenmez. Yeni secret veya GitHub Actions gerekmez.

Verdiğiniz mevcut Worker kodunda `requireAdmin(request)` fonksiyonunun hemen
altına ve diğer `/api/admin/...` kontrollerinden önce şu iki route'u ekleyin:

```js
      // === Tıkla sürüm notları ===
      if (path === '/api/releases/latest' && method === 'GET') {
        const release = await getJSON('release:tikla');
        return json(release || { version: '', title: '', notes: '', publishedAt: '' });
      }

      if (path === '/api/admin/releases' && method === 'POST') {
        if (!(await requireAdmin(request))) return json({ error: 'Yetkisiz' }, 403);
        const { version, title, notes } = await request.json();
        const release = {
          version: String(version || '').trim(),
          title: String(title || '').trim(),
          notes: String(notes || '').trim(),
          publishedAt: new Date().toISOString()
        };
        if (!release.version || !release.title || !release.notes) {
          return json({ error: 'Sürüm, başlık ve sürüm notları gerekli' }, 400);
        }
        if (release.version.length > 40 || release.title.length > 120 || release.notes.length > 12000) {
          return json({ error: 'Sürüm notu alanlarından biri çok uzun' }, 400);
        }
        await putJSON('release:tikla', release);
        return json({ success: true, release });
      }
```

`panel/index.html` içindeki Tıkla Sürümü sekmesi bu uçlarla sürüm notunu
yayımlar. Uçları Worker'a ekleyip deploy ettikten sonra `site-account.js`
dosyasındaki `window.TURBOLU_RELEASES_ENABLED` ayarını `true` olarak tanımlayın.
Böylece tüm sayfalar `/api/releases/latest` verisini kontrol eder; yeni sürüm
ortalanmış, kapatılabilir pencerede gösterilir. Kapatılan sürüm `localStorage`
içinde hatırlanır. API aktif edilmeden sayfalar 404 istekleri üretmez.

Mevcut API adresi site kodunda sabittir. Worker'ı aynı adreste güncelledikten
sonra yeni bir API URL tanımlaması gerekmez. Henüz bu snippet'i ana Worker'a
ekleyip deploy etmeden sürüm-notu uçları cevap vermez.
