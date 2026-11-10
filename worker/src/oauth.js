/* ============================================================================
   TURBOLUMC — SOSYAL GİRİŞ (OAUTH) İŞLEYİCİSİ
   ============================================================================
   GitHub, Google, Microsoft ve Xbox girişlerini mevcut Worker'a ekler.

   KULLANIM (tek dosya / Cloudflare panel):
   1. Bu dosyadaki `export` kelimesini sil.
   2. Fonksiyonu `export default { ... }` bloğunun ÜSTÜNE yapıştır.
   3. `try {` bloğunun en başına şu iki satırı ekle:

        const oauthYanit = await oauthIsle(request, env, url,
          { json, getJSON, putJSON, deleteKey, hashPassword });
        if (oauthYanit) return oauthYanit;

   KULLANIM (wrangler / modül):
        import { oauthIsle } from './oauth.js';
   ve yukarıdaki iki satırı yine `try` bloğunun başına ekle.

   GEREKLİ ORTAM DEĞİŞKENLERİ (Secret):
     GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
     GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
     MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET
     XBOX_CLIENT_ID / XBOX_CLIENT_SECRET        (boşsa Microsoft ayarları kullanılır)
     OAUTH_ALLOWED_ORIGINS  (isteğe bağlı, virgülle ayrılmış)
     OAUTH_DEFAULT_REDIRECT (isteğe bağlı)

   NOT: Bu kod mevcut `env.MC_DB` anahtar-değer API'sini kullanır. D1'e
   geçilirse yalnızca `getJSON`, `putJSON`, `deleteKey` ve `list` çağrıları
   D1 karşılıklarıyla değiştirilmelidir.
   ========================================================================== */

const OAUTH_PROVIDERS = {
  github: {
    label: 'GitHub',
    authorize: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
    scope: 'read:user user:email'
  },
  google: {
    label: 'Google',
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile'
  },
  microsoft: {
    label: 'Microsoft',
    authorize: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scope: 'openid email profile'
  },
  xbox: {
    label: 'Xbox',
    authorize: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scope: 'openid profile email XboxLive.signin XboxLive.offline_access'
  }
};

const OAUTH_DEFAULT_REDIRECT = 'https://turboluweb.wasmer.app/';
const OAUTH_STATE_TTL = 10 * 60;   // saniye
const OAUTH_CODE_TTL = 120;        // saniye

export async function oauthIsle(request, env, url, yardimcilar) {
  const { json, getJSON, putJSON, deleteKey, hashPassword } = yardimcilar;
  const path = url.pathname;
  const method = request.method;

  const providerConfigs = () => {
    /* Panodan yapıştırılan değerlerde satır sonu/boşluk kalabiliyor.
       Client ID ve secret içinde boşluk olamayacağı için temizliyoruz. */
    const temiz = (deger) => String(deger || '').replace(/\s+/g, '');
    return {
      github: {
        ...OAUTH_PROVIDERS.github,
        clientId: temiz(env.GITHUB_CLIENT_ID),
        clientSecret: temiz(env.GITHUB_CLIENT_SECRET)
      },
      google: {
        ...OAUTH_PROVIDERS.google,
        clientId: temiz(env.GOOGLE_CLIENT_ID),
        clientSecret: temiz(env.GOOGLE_CLIENT_SECRET)
      },
      microsoft: {
        ...OAUTH_PROVIDERS.microsoft,
        clientId: temiz(env.MICROSOFT_CLIENT_ID),
        clientSecret: temiz(env.MICROSOFT_CLIENT_SECRET)
      },
      xbox: {
        ...OAUTH_PROVIDERS.xbox,
        clientId: temiz(env.XBOX_CLIENT_ID || env.MICROSOFT_CLIENT_ID),
        clientSecret: temiz(env.XBOX_CLIENT_SECRET || env.MICROSOFT_CLIENT_SECRET)
      }
    };
  };

  const isConfigured = (provider) => {
    const cfg = providerConfigs()[provider];
    return Boolean(cfg && cfg.clientId && cfg.clientSecret);
  };

  const callbackUrl = (provider) => `${url.origin}/api/auth/oauth/${provider}/callback`;

  /* Yalnızca izin listesindeki site adreslerine geri dönüşe izin ver. */
  const isAllowedRedirect = (value) => {
    try {
      const origin = new URL(value).origin;
      const allowed = String(env.OAUTH_ALLOWED_ORIGINS || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      const defaults = [
        'https://turboluweb.wasmer.app',
        'http://localhost:8080',
        'http://localhost:8765'
      ];
      return [...defaults, ...allowed, url.origin].includes(origin);
    } catch (_) {
      return false;
    }
  };

  const withOAuthParams = (redirectUri, params) => {
    try {
      const target = new URL(redirectUri || env.OAUTH_DEFAULT_REDIRECT || OAUTH_DEFAULT_REDIRECT);
      Object.entries(params).forEach(([key, value]) => target.searchParams.set(key, value));
      return Response.redirect(target.toString(), 302);
    } catch (_) {
      return Response.redirect(OAUTH_DEFAULT_REDIRECT, 302);
    }
  };

  const failRedirect = (redirectUri, message) =>
    withOAuthParams(redirectUri, { oauth: 'error', message });

  /* Süreli kayıt: KV varsa expirationTtl kullan, yoksa normal yaz. */
  const putExpiring = async (key, value, seconds) => {
    try {
      await env.MC_DB.put(key, JSON.stringify(value), { expirationTtl: seconds });
    } catch (_) {
      await putJSON(key, value);
    }
  };

  const sanitizeUsername = (value) => {
    const cleaned = String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9_.-]/g, '')
      .slice(0, 20);
    return cleaned || 'oyuncu';
  };

  const findUserByEmail = async (email) => {
    if (!email) return null;
    const wanted = String(email).toLowerCase();
    const list = await env.MC_DB.list({ prefix: 'user:' });
    for (const key of list.keys) {
      const user = await getJSON(key.name);
      // Yalnızca e-postası doğrulanmış hesaplarla birleştir. Aksi halde
      // profilinden e-postasını değiştiren biri başka hesabı ele geçirebilir.
      if (user && user.emailVerified === true && user.email &&
          String(user.email).toLowerCase() === wanted) {
        return user;
      }
    }
    return null;
  };

  const fetchJson = async (target, options) => {
    const response = await fetch(target, options);
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  };

  const readProfile = async (provider, accessToken) => {
    if (provider === 'github') {
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'TurboluStudios'
      };
      const profile = await fetchJson('https://api.github.com/user', { headers });
      if (!profile.ok) throw new Error('GitHub profili alınamadı.');
      const emails = await fetchJson('https://api.github.com/user/emails', { headers }).catch(() => null);
      let email = profile.data.email || '';
      let verified = false;
      if (emails && emails.ok && Array.isArray(emails.data)) {
        const primary = emails.data.find(item => item.primary && item.verified) ||
          emails.data.find(item => item.verified);
        if (primary) {
          email = primary.email;
          verified = true;
        }
      }
      return {
        id: String(profile.data.id),
        email,
        verified,
        name: profile.data.name || profile.data.login || 'github',
        avatar: profile.data.avatar_url || ''
      };
    }

    if (provider === 'google') {
      const profile = await fetchJson('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!profile.ok) throw new Error('Google profili alınamadı.');
      return {
        id: String(profile.data.sub),
        email: profile.data.email || '',
        verified: profile.data.email_verified === true || profile.data.email_verified === 'true',
        name: profile.data.name || 'google',
        avatar: profile.data.picture || ''
      };
    }

    /* Microsoft ve Xbox aynı OIDC profil ucunu kullanır. */
    const profile = await fetchJson('https://graph.microsoft.com/oidc/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!profile.ok) throw new Error('Microsoft profili alınamadı.');

    const preferred = String(profile.data.preferred_username || '');
    const verifiedEmail = String(profile.data.email || '');
    const fallbackEmail = preferred.includes('@') ? preferred : '';
    return {
      id: String(profile.data.sub || profile.data.oid || ''),
      email: verifiedEmail || fallbackEmail,
      // Yalnızca `email` claim'i doğrulanmış sayılır; UPN/adres ile hesap
      // birleştirme yapılmaz.
      verified: Boolean(verifiedEmail),
      name: profile.data.name || preferred.split('@')[0] || provider,
      avatar: ''
    };
  };

  try {
    /* === Sağlayıcı listesi === */
    if (path === '/api/auth/oauth/providers' && method === 'GET') {
      const providers = Object.keys(OAUTH_PROVIDERS).filter(isConfigured);
      return json({ providers });
    }

    /* === Giriş başlat === */
    const startMatch = path.match(/^\/api\/auth\/oauth\/(github|google|microsoft|xbox)\/start$/);
    if (startMatch && method === 'GET') {
      const provider = startMatch[1];
      if (!isConfigured(provider)) {
        return json({ error: 'Bu giriş yöntemi henüz etkin değil.' }, 404);
      }

      const redirectUri = url.searchParams.get('redirect_uri') || '';
      if (!isAllowedRedirect(redirectUri)) {
        return json({ error: 'Geçersiz yönlendirme adresi.' }, 400);
      }

      const cfg = providerConfigs()[provider];
      const state = `${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`;
      await putExpiring(`oauth_state:${state}`, {
        provider,
        redirectUri,
        expiry: Date.now() + OAUTH_STATE_TTL * 1000
      }, OAUTH_STATE_TTL);

      const authorize = new URL(cfg.authorize);
      authorize.searchParams.set('client_id', cfg.clientId);
      authorize.searchParams.set('redirect_uri', callbackUrl(provider));
      authorize.searchParams.set('response_type', 'code');
      authorize.searchParams.set('scope', cfg.scope);
      authorize.searchParams.set('state', state);
      if (provider === 'google') authorize.searchParams.set('access_type', 'online');
      if (provider === 'microsoft' || provider === 'xbox') {
        authorize.searchParams.set('response_mode', 'query');
      }

      return Response.redirect(authorize.toString(), 302);
    }

    /* === Sağlayıcı geri dönüşü === */
    const callbackMatch = path.match(/^\/api\/auth\/oauth\/(github|google|microsoft|xbox)\/callback$/);
    if (callbackMatch && method === 'GET') {
      const provider = callbackMatch[1];
      const state = url.searchParams.get('state') || '';
      const stateKey = `oauth_state:${state}`;
      const saved = state && /^[A-Za-z0-9]{20,120}$/.test(state)
        ? await getJSON(stateKey)
        : null;

      if (saved) await deleteKey(stateKey);

      if (!saved || saved.provider !== provider || Date.now() > saved.expiry) {
        return failRedirect(saved && saved.redirectUri, 'Giriş oturumu geçersiz veya süresi doldu. Lütfen yeniden dene.');
      }

      if (url.searchParams.get('error')) {
        return failRedirect(saved.redirectUri, 'Giriş iptal edildi veya sağlayıcı hata döndürdü.');
      }

      if (!isConfigured(provider)) {
        return failRedirect(saved.redirectUri, 'Bu giriş yöntemi henüz etkin değil.');
      }

      const code = url.searchParams.get('code');
      if (!code) return failRedirect(saved.redirectUri, 'Sağlayıcıdan giriş kodu alınamadı.');

      try {
        const cfg = providerConfigs()[provider];
        const body = new URLSearchParams();
        body.set('client_id', cfg.clientId);
        body.set('client_secret', cfg.clientSecret);
        body.set('code', code);
        body.set('redirect_uri', callbackUrl(provider));
        if (provider !== 'github') body.set('grant_type', 'authorization_code');

        const tokenResult = await fetchJson(cfg.token, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            'User-Agent': 'TurboluStudios'
          },
          body: body.toString()
        });

        if (!tokenResult.ok || !tokenResult.data.access_token) {
          throw new Error('Sağlayıcıdan oturum alınamadı.');
        }

        const profile = await readProfile(provider, tokenResult.data.access_token);
        if (!profile.id) throw new Error('Sağlayıcı kimliği alınamadı.');

        const linkKey = `oauth:${provider}:${profile.id}`;
        const linkedUsername = await getJSON(linkKey);
        let user = linkedUsername ? await getJSON(`user:${linkedUsername}`) : null;

        if (!user && profile.verified && profile.email) {
          user = await findUserByEmail(profile.email);
        }

        // Yasaklı hesaplar sosyal girişle de giriş yapamaz.
        const banAktif = user && user.banned &&
          (user.banType === 'permanent' || (Number(user.banUntil) || 0) > Date.now());
        if (banAktif) {
          return failRedirect(saved.redirectUri, 'Bu hesap yasaklandı. Ayrıntı için yöneticiye ulaş.');
        }

        if (!user) {
          const base = sanitizeUsername(profile.name || profile.email.split('@')[0] || provider);
          let username = base;
          let suffix = 1;
          while (await env.MC_DB.get(`user:${username}`)) {
            suffix += 1;
            username = `${base}${suffix}`;
          }

          user = {
            username,
            password: await hashPassword(crypto.randomUUID()),
            token: crypto.randomUUID(),
            balance: 0,
            icon: profile.avatar || '',
            status: 'Online',
            theme: 'dark',
            language: 'tr',
            isAdmin: false,
            email: profile.email || '',
            emailVerified: Boolean(profile.verified),
            platform: 'all'
          };
          await putJSON(`user:${user.username}`, user);
        } else {
          let changed = false;
          if (!user.token) {
            user.token = crypto.randomUUID();
            changed = true;
          }
          if (!user.email && profile.email) {
            user.email = profile.email;
            changed = true;
          }
          if (profile.verified && profile.email && user.email &&
              String(user.email).toLowerCase() === String(profile.email).toLowerCase() &&
              user.emailVerified !== true) {
            user.emailVerified = true;
            changed = true;
          }
          if (changed) await putJSON(`user:${user.username}`, user);
        }

        await putJSON(linkKey, user.username);

        const loginCode = `${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`;
        await putExpiring(`oauth_code:${loginCode}`, {
          username: user.username,
          provider,
          expiry: Date.now() + OAUTH_CODE_TTL * 1000
        }, OAUTH_CODE_TTL);

        return withOAuthParams(saved.redirectUri, { oauth: 'success', code: loginCode });
      } catch (error) {
        return failRedirect(saved.redirectUri, 'Giriş tamamlanamadı. Lütfen yeniden dene.');
      }
    }

    /* === Tek kullanımlık kodu site token'ına çevir === */
    if (path === '/api/auth/oauth/exchange' && method === 'POST') {
      const payload = await request.json().catch(() => ({}));
      const code = String(payload.code || '');
      if (!code) return json({ error: 'Giriş kodu gerekli.' }, 400);

      const stored = await getJSON(`oauth_code:${code}`);
      if (!stored) return json({ error: 'Giriş kodu geçersiz veya kullanılmış.' }, 400);

      await deleteKey(`oauth_code:${code}`);
      if (Date.now() > stored.expiry) {
        return json({ error: 'Giriş kodunun süresi doldu.' }, 400);
      }

      const user = await getJSON(`user:${stored.username}`);
      if (!user || !user.token) return json({ error: 'Kullanıcı bulunamadı.' }, 400);

      const banAktif = user.banned &&
        (user.banType === 'permanent' || (Number(user.banUntil) || 0) > Date.now());
      if (banAktif) return json({ error: 'Bu hesap yasaklandı.' }, 403);

      return json({
        token: user.token,
        username: user.username,
        balance: user.balance,
        isAdmin: Boolean(user.isAdmin)
      });
    }

    return null;
  } catch (error) {
    return json({ error: 'Sosyal giriş sırasında beklenmeyen bir hata oluştu.' }, 500);
  }
}
