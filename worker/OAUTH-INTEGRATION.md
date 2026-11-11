# Sosyal giriş (GitHub, Google, Microsoft, Xbox) — Worker entegrasyonu

Bu belge, sitedeki sosyal giriş düğmelerinin çalışması için Cloudflare Worker
tarafındaki uygulamayı anlatır. OAuth işleyicisi `worker/src/oauth.js` içindedir;
mevcut Worker dosyasına küçük bir ekleme yapılır.

## Mevcut durum

- Ön yüz hazır: `oauth.js` + `oauth.css` düğmeleri tüm giriş noktalarına basar
  (site hesap penceresi, `kayit.html`, `mc/giris.html`, MC ve Bedrock modalları).
- Worker tarafı `worker/src/oauth.js` içinde hazır. Mevcut Worker dosyasına
  aşağıdaki "Worker'a ekleme" adımı uygulanmalıdır.
- Sağlayıcı client ID/secret değerleri tanımlanmadan düğmeler kullanıcıya
  "Sosyal giriş şu an kullanılamıyor..." mesajı gösterir; sayfa bozulmaz.

## Uç sözleşmesi

Tüm yollar API köküne görelidir:
`https://shrill-salad-a498.ereny116011.workers.dev`

### 1. `GET /api/auth/oauth/providers`

Hangi sağlayıcıların yapılandırılmış olduğunu döner. Ön yüz yalnızca bu listede
olan sağlayıcıların düğmesini etkin bırakır.

```json
{ "providers": ["github", "google", "microsoft", "xbox"] }
```

- Yapılandırılmamış sağlayıcı listede yer almamalıdır.
- Ön yüz bu yanıtı 5 saniye bekler ve oturum boyunca `sessionStorage` içinde
  tutar. Uç yoksa veya hata dönerse tüm düğmeler tıklanabilir kalır ve
  kullanıcıya "kullanılamıyor" mesajı gösterilir.

### 2. `GET /api/auth/oauth/{provider}/start?redirect_uri=...`

- `provider`: `github` | `google` | `microsoft` | `xbox`
- `redirect_uri`: giriş bittikten sonra dönülecek site adresi (ön yüz
  `location.origin + location.pathname` gönderir).
- Worker bir `state` üretir, `oauth_state:{state}` anahtarında saklar ve
  kullanıcıyı sağlayıcının yetkilendirme ekranına `302` ile yönlendirir.
- `redirect_uri` yalnızca izin listesindeki origin'lerden biri olabilir:
  - `https://turboluweb.wasmer.app`
  - `https://shrill-salad-a498.ereny116011.workers.dev` (test)
  - `http://localhost:8080`, `http://localhost:8765` (yerel geliştirme)
  - `http://127.0.0.1:{rastgele port}` (TurboluApp PC'nin tek kullanımlık
    yerel dinleyicisi; yalnızca geri döngü adresleri kabul edilir)

İzin listesi dışındaki değer `400` ile reddedilmelidir. Açık yönlendirme
(open redirect) güvenlik açığıdır.

### 3. `GET /api/auth/oauth/{provider}/callback`

Sağlayıcıdan gelen `code` ve `state` burada karşılanır:

1. `state` doğrulanır ve tek kullanımlık olarak silinir (10 dakika TTL).
2. `code`, sağlayıcının token ucunda değiştirilir.
3. Sağlayıcı profilinden `provider_user_id`, doğrulanmış e-posta ve görünen ad
   alınır.
4. Depoda hesap bulunur veya oluşturulur (aşağıya bakın).
5. Site oturum token'ı üretilir.
6. Kullanıcı `redirect_uri` adresine şu biçimde döndürülür:

```
{redirect_uri}?oauth=success&code={tek-kullanimlik-kod}
```

Hata durumunda:

```
{redirect_uri}?oauth=error&message={kisa-turkce-mesaj}
```

`message` değeri ön yüzde düz metin olarak gösterilir; HTML basılmaz.

### 4. `POST /api/auth/oauth/exchange`

Ön yüzün `?code=` değerini site token'ı ile değiştirdiği uç.

İstek:

```json
{ "code": "tek-kullanimlik-kod" }
```

Yanıt:

```json
{ "token": "site-oturum-token", "username": "eren", "isAdmin": false }
```

- Kod tek kullanımlıktır, en fazla 60 saniye geçerlidir ve `POST` dışında
  kabul edilmemelidir.
- Kod yalnızca üretildiği sağlayıcı/redirect için kullanılabilir.
- Hatalı veya süresi geçmiş kod `400` / `401` ve `{ "error": "..." }` döner.
- Token'ın URL'de taşınması yalnızca geriye dönük uyumluluk içindir; ön yüz
  `?oauth=success&token=...` biçimini de kabul eder ama yeni akışta
  `code` + `exchange` kullanılmalıdır.

## Depolama (mevcut Worker yapısı)

Worker kodu `env.MC_DB` üzerinden anahtar-değer API'si (`get`, `put`, `list`,
`delete`) kullanıyor. `oauth.js` bu yapıya uyar ve şu anahtarları yazar:

| Anahtar | İçerik | Ömür |
| --- | --- | --- |
| `oauth_state:{state}` | `{ provider, redirectUri, expiry }` | 10 dakika |
| `oauth_code:{code}` | `{ username, provider, expiry }` | 2 dakika |
| `oauth:{provider}:{providerUserId}` | Kullanıcı adı | Kalıcı |
| `user:{username}` | Mevcut kullanıcı kaydı | Kalıcı |

- `state` ve tek kullanımlık kod, KV destekliyorsa `expirationTtl` ile yazılır;
  ayrıca `expiry` alanı kod tarafında da kontrol edilir.
- Kod kullanıldığı anda `oauth_code:{code}` silinir; ikinci kez kullanılamaz.
- Sosyal hesap bağlantısı `oauth:{provider}:{providerUserId}` anahtarındadır.
  Aynı sağlayıcıdan gelen tekrar girişlerde kullanıcı bu anahtardan bulunur.

Hesap eşleştirme kuralları:

- Önce `(provider, provider_user_id)` aranır; varsa mevcut kullanıcıya giriş.
- Yoksa **yalnızca sağlayıcı e-postayı doğrulanmış olarak döndürdüyse** aynı
  e-postalı kullanıcı ile ilişkilendirilir. Microsoft/Xbox tarafında yalnızca
  `email` claim'i doğrulanmış sayılır; `preferred_username` ile birleştirme
  yapılmaz.
- E-posta doğrulanmamışsa veya eşleşme yoksa yeni kullanıcı oluşturulur.
- Kullanıcı adı çakışırsa sonuna sayı eklenir (`eren2`, `eren3`).
- Aynı doğrulanmış e-posta ile farklı sağlayıcıdan giriş, aynı Turbolu hesabına
  bağlanır; ancak yalnızca `emailVerified: true` olan hesaplar birleştirilir.
  Parola ile açılmış ve e-postası henüz doğrulanmamış hesaplar otomatik
  birleştirilmez; bu, profil e-postasını değiştirerek hesap ele geçirmeyi önler.

> **Not:** AGENTS.md kalıcı veri için D1 diyor; bu Worker ise `env.MC_DB`
> üzerinden KV tarzı API kullanıyor. OAuth kodu mevcut çalışan yapıya uyar.
> D1'e geçilirse yalnızca `getJSON`, `putJSON`, `deleteKey` ve `list`
> çağrılarının D1 karşılıkları yazılmalı; anahtar mantığı korunabilir.

## Worker'a ekleme

### Aynı dosyada (Cloudflare panel)

1. `worker/src/oauth.js` dosyasının tamamını kopyala.
2. Dosyadaki `export` kelimesini sil; fonksiyonu `export default { ... }`
   bloğunun üstüne yapıştır.
3. `fetch` içindeki `try {` bloğunun en başına şu iki satırı ekle:

```js
const oauthYanit = await oauthIsle(request, env, url,
  { json, getJSON, putJSON, deleteKey, hashPassword });
if (oauthYanit) return oauthYanit;
```

4. Cloudflare panelinde Deploy'a bas.

### Wrangler / modül

`worker/src/index.js` içine:

```js
import { oauthIsle } from './oauth.js';
```

ve yukarıdaki iki satırı yine `try` bloğunun başına ekle.

> `json`, `getJSON`, `putJSON`, `deleteKey` ve `hashPassword` mevcut Worker
> kodunda tanımlıdır. OAuth çağrısı, `/sifirla` ve diğer route'lardan **önce**
> yapılmalıdır; aksi halde istekler eşleşmez.

## Gizli değerler

Cloudflare paneli → Worker → Settings → Variables and Secrets bölümünden
eklenmeli; repoya yazılmamalıdır. `wrangler secret put` de kullanılabilir.

| Değişken | Açıklama |
| --- | --- |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub OAuth App |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth istemcisi |
| `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` | Microsoft Entra uygulaması |
| `XBOX_CLIENT_ID`, `XBOX_CLIENT_SECRET` | Xbox için ayrı Microsoft Entra uygulaması (isteğe bağlı) |
| `OAUTH_ALLOWED_ORIGINS` | Virgülle ayrılmış ek izinli origin listesi (isteğe bağlı) |
| `OAUTH_DEFAULT_REDIRECT` | Hata durumunda dönülecek yedek adres (isteğe bağlı) |

`XBOX_CLIENT_ID` verilmezse Xbox sağlayıcısı Microsoft uygulamasını Xbox
kapsamlarıyla kullanır. İki ayrı uygulama kullanılıyorsa callback yolları da
ayrı olmalıdır.

## Sağlayıcı konsolu ayarları

Tüm sağlayıcılarda callback (redirect) adresi:

```
https://shrill-salad-a498.ereny116011.workers.dev/api/auth/oauth/{provider}/callback
```

Yerel test için ayrıca:

```
http://localhost:8080/api/auth/oauth/{provider}/callback
http://localhost:8765/api/auth/oauth/{provider}/callback
```

### GitHub

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
2. Homepage URL: `https://turboluweb.wasmer.app`
3. Authorization callback URL: yukarıdaki GitHub callback adresi.
4. Client ID/secret değerlerini Worker'a ekle.
5. Kapsam: `read:user user:email`.

### Google

1. Google Cloud Console → APIs & Services → Credentials → OAuth client ID.
2. Tür: Web application.
3. Authorized JavaScript origins: `https://turboluweb.wasmer.app`,
   `https://shrill-salad-a498.ereny116011.workers.dev`.
4. Authorized redirect URI: Google callback adresi.
5. Kapsam: `openid email profile`.
6. OAuth consent screen yayınlanmalı; aksi halde yalnızca test kullanıcıları
   giriş yapabilir.

### Microsoft

1. Microsoft Entra admin center → App registrations → New registration.
2. Desteklenen hesap türleri: kişisel Microsoft hesapları dahil
   ("Accounts in any organizational directory and personal Microsoft accounts").
3. Redirect URI (Web): Microsoft callback adresi.
4. Certificates & secrets → New client secret.
5. API permissions: `openid`, `email`, `profile`.
6. Kapsam: `openid email profile`.

### Xbox

Xbox girişi, Microsoft kimlik platformu üzerinden Xbox Live kapsamlarıyla
yapılır:

- Kapsamlar: `XboxLive.signin`, `XboxLive.offline_access`
- Yetkilendirme ucu Microsoft ile aynıdır; yalnızca `scope` değeri değişir.
- Ayrı uygulama kaydı kullanılıyorsa redirect URI
  `/api/auth/oauth/xbox/callback` olmalıdır.
- Xbox profili (`gamertag`, `xuid`) alınamazsa bile doğrulanmış Microsoft
  e-postası ile hesap açılabilir; `provider` değeri `xbox` kalır.

## Güvenlik kontrol listesi

- [ ] `state` her istekte rastgele üretiliyor ve callback'te tek kullanımlık
      doğrulanıyor.
- [ ] `redirect_uri` yalnızca izin listesindeki origin'lerden biri olabiliyor.
- [ ] Sağlayıcı token'ları hiçbir zaman tarayıcıya gönderilmiyor; yalnızca
      Worker içinde kullanılıyor.
- [ ] Site token'ı URL'de kalıcı olarak taşınmıyor; `exchange` kodu 2 dakika
      içinde tek kullanımda tüketiliyor.
- [ ] Hata mesajları sağlayıcı yanıtını veya gizli değerleri sızdırmıyor.
- [ ] Aynı e-posta ile otomatik birleştirme yalnızca sağlayıcı e-postayı
      doğrulanmış döndürdüyse yapılıyor.
- [ ] Var olan `isAdmin` alanı sosyal girişte kullanıcı girdisinden değil,
      depodaki kullanıcı kaydından okunuyor.
- [ ] R2 bağlantısı eklenmiyor; OAuth verileri mevcut `MC_DB` deposunda
      tutuluyor.

## Ön yüzün beklediği davranış

`oauth.js` şu sırayı izler:

1. Düğmeleri basar, `GET /api/auth/oauth/providers` ile durumu kontrol eder.
2. Sağlayıcıya `GET /api/auth/oauth/{provider}/start?redirect_uri=...` ile
   yönlendirir.
3. Dönüşte `?oauth=success&code=...` varsa `POST /api/auth/oauth/exchange`
   çağırır, dönen token'ı `localStorage.token` içine yazar ve sayfayı yeniler.
4. `?oauth=error&message=...` varsa mesajı alt bildirim olarak gösterir.
5. Adres çubuğundaki `oauth`, `code`, `token`, `message` parametrelerini
   temizler.

Bu sözleşme dışında bir yanıt biçimi kullanılırsa ön yüzde değişiklik gerekir.

## Test

Worker'a eklendikten ve secret'lar tanımlandıktan sonra:

1. `GET /api/auth/oauth/providers` yalnızca yapılandırılmış sağlayıcıları
   döndürüyor mu?
2. Her sağlayıcı için tam giriş turu tamamlanıyor ve kullanıcı aynı sayfaya
   dönüyor mu?
3. Aynı e-posta ile ikinci sağlayıcıdan giriş aynı hesaba bağlanıyor mu?
4. Geçersiz `state`, süresi geçmiş kod ve izinsiz `redirect_uri` reddediliyor mu?
5. Çıkış sonrası `localStorage.token` temizleniyor ve korumalı sayfalar giriş
   istiyor mu?
6. `mc/`, `bedrock/`, `kayit.html` ve site hesap penceresinde düğmeler aynı
   görünüyor mu (320/360/390 px dahil)?
