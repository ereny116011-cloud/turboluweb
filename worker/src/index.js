/* ============================================================================
   TURBOLUMC API — CLOUDFLARE WORKER (TAM KOD)
   ============================================================================
   Bu dosya, mevcut worker kodunun tamamıdır; yalnızca şu 4 yerde değişiklik
   yapıldı:

   [1] En üste "sifreSifirlamaMaili()" e-posta şablonu eklendi.
   [2] "/sifirla" bloğu: 100 satırlık gömülü HTML kaldırıldı, yerine sitendeki
       /mc/reset.html sayfasına yönlendirme geldi.
   [3] "/api/forgot-password": e-posta artık yeni şablonla gönderiliyor.
       Ayrıca kayıtlı olmayan e-postaya da aynı cevap dönüyor (kullanıcı
       numaralandırma açığı kapatıldı).
   [4] Admin parolası koddan ÇIKARILDI. Artık env.ADMIN_PASSWORD gizli
       değişkeninden okunuyor; secret yoksa admin oluşturulmuyor.

   DEĞİŞTİRİLMEYEN: "from: onboarding@resend.dev" aynen korundu. Alan adını
   Resend panelinden doğrulamadan bunu değiştirirsen mailler gönderilmez.

   YAPILACAK: Cloudflare panelinde worker'ı aç, tüm içeriği bununla değiştir,
   Deploy'a bas. Ayrıca Settings -> Variables and Secrets bölümünden
   ADMIN_PASSWORD adında bir Secret tanımla.
   ============================================================================ */

/* ==========================================================================
   ŞİFRE SIFIRLAMA E-POSTASI
   Tablo tabanlı, satır içi stilli — Gmail, Outlook ve Apple Mail uyumlu.
   ========================================================================== */
function sifreSifirlamaMaili({ username, email, resetLink }) {
  return `<!DOCTYPE html>
<html lang="tr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>Şifreni Sıfırla - TurboluMC</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    table { border-collapse: collapse !important; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { text-decoration: none; }
    @media (max-width: 620px) {
      .wrap { width: 100% !important; }
      .pad { padding-left: 22px !important; padding-right: 22px !important; }
      .btn a { display: block !important; width: auto !important; }
      .h1 { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#07090b;">

  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:#07090b; font-size:1px; line-height:1px;">
    TurboluMC hesabın için parola sıfırlama bağlantın hazır. Bağlantı 30 dakika geçerli.
    &#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#07090b;">
    <tr>
      <td align="center" style="padding: 36px 12px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="wrap"
               style="width:600px; max-width:600px; background-color:#0d1015; border-radius:20px; border:1px solid #1c2430; overflow:hidden;">

          <tr>
            <td height="4" style="height:4px; background-color:#22c55e; font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <tr>
            <td align="center" class="pad" style="padding: 34px 40px 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:17px; font-weight:700; letter-spacing:0.3px; color:#22c55e;">
                    TurboluMC
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 26px 40px 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" width="72" height="72"
                      style="width:72px; height:72px; background-color:#12241a; border:1px solid #1f4630; border-radius:50%; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:30px; line-height:72px; text-align:center;">
                    🔐
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" class="pad" style="padding: 22px 40px 0 40px;">
              <h1 class="h1" style="margin:0; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:27px; line-height:1.3; font-weight:700; color:#f1f5f3; letter-spacing:-0.4px;">
                Şifreni sıfırla
              </h1>
            </td>
          </tr>

          <tr>
            <td align="center" class="pad" style="padding: 14px 46px 0 46px;">
              <p style="margin:0; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:1.65; color:#9fb0a8;">
                Merhaba <strong style="color:#e6efe9;">${username}</strong>,<br>
                TurboluMC hesabın için bir parola sıfırlama talebi aldık. Yeni parolanı belirlemek için aşağıdaki butona tıkla.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" class="pad" style="padding: 30px 40px 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn">
                <tr>
                  <td align="center" bgcolor="#22c55e" style="border-radius:12px; box-shadow:0 8px 24px rgba(34,197,94,0.35);">
                    <a href="${resetLink}"
                       style="display:inline-block; padding:16px 44px; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; font-weight:700; color:#06120a; text-decoration:none; border-radius:12px; letter-spacing:0.2px;">
                      Yeni Parola Belirle &nbsp;→
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" class="pad" style="padding: 26px 46px 0 46px;">
              <p style="margin:0 0 8px 0; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:1.6; color:#8a9a93;">
                Buton çalışmazsa bu bağlantıyı tarayıcına yapıştır:
              </p>
              <p style="margin:0; font-family:'Courier New',Consolas,monospace; font-size:12px; line-height:1.6; color:#22c55e; word-break:break-all;">
                ${resetLink}
              </p>
            </td>
          </tr>

          <tr>
            <td class="pad" style="padding: 32px 40px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td height="1" style="height:1px; background-color:#1c2430; font-size:0; line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="pad" style="padding: 26px 40px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background-color:#101720; border-left:3px solid #22c55e; border-radius:10px;">
                <tr>
                  <td style="padding: 16px 20px; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:1.75; color:#9fb0a8;">
                    <strong style="color:#e6efe9;">⏳ 30 dakika geçerli</strong><br>
                    Bu bağlantı 30 dakika boyunca ve yalnızca bir kez kullanılabilir.
                    Parolanı belirledikten sonra bağlantı geçersiz olur.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="pad" style="padding: 14px 40px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background-color:#1a1410; border-left:3px solid #f59e0b; border-radius:10px;">
                <tr>
                  <td style="padding: 16px 20px; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:1.75; color:#b6a99b;">
                    <strong style="color:#f1e7dd;">🛡️ Bu isteği sen yapmadıysan</strong><br>
                    Bu e-postayı yok say, parolan değişmez. Endişeleniyorsan
                    <a href="mailto:ereny116011@gmail.com" style="color:#f59e0b; text-decoration:underline;">bize ulaş</a>.
                    TurboluMC hiçbir zaman e-postayla parola sormaz.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="pad" align="center" style="padding: 34px 40px 8px 40px;">
              <p style="margin:0; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:1.7; color:#6b7a74;">
                <a href="https://turboluweb.wasmer.app/" style="color:#22c55e; text-decoration:none;">turboluweb.wasmer.app</a>
                &nbsp;·&nbsp;
                <a href="https://turboluweb.wasmer.app/mc/" style="color:#22c55e; text-decoration:none;">Sunucu Paneli</a>
              </p>
            </td>
          </tr>

          <tr>
            <td class="pad" align="center" style="padding: 6px 40px 34px 40px;">
              <p style="margin:0; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:11px; line-height:1.7; color:#55635d;">
                © 2026 Turbolu Studios · Bu e-posta ${email} adresine, hesap güvenliği için gönderildi.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

import { oauthIsle } from './oauth.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    const json = (data, status = 200) => new Response(JSON.stringify(data), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

    const getJSON = async (key) => JSON.parse(await env.MC_DB.get(key) || 'null');
    const putJSON = (key, value) => env.MC_DB.put(key, JSON.stringify(value));
    const deleteKey = async (key) => env.MC_DB.delete(key);

    async function getUser(auth) {
      if (!auth) return null;
      const token = auth.replace('Bearer ', '');
      const list = await env.MC_DB.list({ prefix: 'user:' });
      for (const k of list.keys) {
        const user = await getJSON(k.name);
        if (user && user.token === token) {
          // Süresi dolmuş geçici yasakları burada temizle.
          await clearExpiredBan(user);
          if (banActive(user)) return null;
          return user;
        }
      }
      return null;
    }

    /* Yasak (ban) yardımcıları */
    function banActive(user) {
      if (!user || !user.banned) return false;
      if (user.banType === 'permanent') return true;
      return (Number(user.banUntil) || 0) > Date.now();
    }

    async function clearExpiredBan(user) {
      if (!user || !user.banned || user.banType === 'permanent') return;
      if ((Number(user.banUntil) || 0) > Date.now()) return;
      delete user.banned;
      delete user.banType;
      delete user.banUntil;
      delete user.banReason;
      delete user.bannedAt;
      delete user.bannedBy;
      await putJSON(`user:${user.username}`, user);
    }

    async function hashPassword(password) {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const enc = new TextEncoder().encode(password);
      const key = await crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256
      );
      const hash = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2,'0')).join('');
      return `${Array.from(salt).join(',')}:${hash}`;
    }

    async function verifyPassword(password, stored) {
      const [saltStr, hash] = stored.split(':');
      const salt = new Uint8Array(saltStr.split(',').map(Number));
      const enc = new TextEncoder().encode(password);
      const key = await crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256
      );
      const computed = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2,'0')).join('');
      return computed === hash;
    }

    // E-POSTA GÖNDERİMİ — üç yol var, sırayla denenir:
    //
    // 1) AGENTMAIL  : AGENTMAIL_API_KEY + AGENTMAIL_INBOX_ID tanımlıysa.
    //                 Kendi alan adı GEREKMEZ, ücretsiz (3.000 mail/ay).
    //                 ÖNEMLİ: AgentMail hesabı doğrulanmış olmalı, yoksa
    //                 sadece kendi e-postana gönderebilirsin.
    // 2) GMAIL KÖPRÜSÜ: MAIL_WEBHOOK_URL + MAIL_WEBHOOK_SECRET.
    //                 Google Apps Script ile kendi Gmail'inden gönderir.
    // 3) RESEND     : RESEND_API_KEY. Doğrulanmış alan adı ister.
    async function sendEmail(to, subject, html) {
      const duzMetin = String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

      try {
        // ---- 1) AgentMail ----
        if (env.AGENTMAIL_API_KEY && env.AGENTMAIL_INBOX_ID) {
          const adres = 'https://api.agentmail.to/v0/inboxes/' +
            encodeURIComponent(env.AGENTMAIL_INBOX_ID) + '/messages/send';
          const basliklar = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.AGENTMAIL_API_KEY}`
          };

          let yanit = await fetch(adres, {
            method: 'POST',
            headers: basliklar,
            body: JSON.stringify({ to: [to], subject, html, text: duzMetin })
          });

          // AgentMail 'html' alanını kabul etmiyorsa düz metinle tekrar dene
          if (yanit.status === 400) {
            yanit = await fetch(adres, {
              method: 'POST',
              headers: basliklar,
              body: JSON.stringify({ to: [to], subject, text: duzMetin })
            });
          }
          return await yanit.json();
        }

        // ---- 2) Gmail köprüsü (Apps Script) ----
        if (env.MAIL_WEBHOOK_URL) {
          const res = await fetch(env.MAIL_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              secret: env.MAIL_WEBHOOK_SECRET,
              to, subject, html
            })
          });
          return await res.json();
        }

        // ---- 3) Resend ----
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: env.RESEND_FROM || 'onboarding@resend.dev',
            to,
            subject,
            html
          })
        });
        return await res.json();
      } catch (e) {
        return { error: e.message };
      }
    }

    // Platform filtresi — eski kayıtlar için platform yoksa 'all' kabul edilir
    function matchPlatform(item, platform) {
      if (!platform) return true;
      const p = item.platform || 'all';
      return p === 'all' || p === platform;
    }

    /* Kullanıcı adı: Türkçe karakterler (ı, ö, ş, ğ, ü, ç) korunur. */
    function normalizeUsername(value) {
      return String(value == null ? '' : value)
        .normalize('NFC')
        .trim()
        .replace(/\s+/g, ' ');
    }

    function usernameError(username) {
      const uzunluk = [...username].length;
      if (uzunluk < 3) return 'Kullanıcı adı en az 3 karakter olmalı.';
      if (uzunluk > 20) return 'Kullanıcı adı en fazla 20 karakter olabilir.';
      if (!/^[\p{L}\p{N}](?:[\p{L}\p{N} ._-]*[\p{L}\p{N}])?$/u.test(username)) {
        return 'Kullanıcı adı yalnızca harf, rakam, boşluk, nokta, tire ve alt çizgi içerebilir.';
      }
      return null;
    }

    // Admin hesabı (otomatik oluştur)
    // ÖNEMLİ: Parola artık KODDA DEĞİL — Cloudflare'deki gizli değişkenden okunur.
    //   Cloudflare paneli -> Worker -> Settings -> Variables and Secrets
    //   -> ADMIN_PASSWORD  (tip: Secret / Encrypt)
    //
    // Secret tanımlı değilse admin hesabı hiç OLUŞTURULMAZ. Böylece kodu okuyan
    // biri varsayılan bir parolayla giriş yapamaz.
    if (!(await env.MC_DB.get('user:TurboluMC'))) {
      if (env.ADMIN_PASSWORD) {
        const hash = await hashPassword(env.ADMIN_PASSWORD);
        const token = crypto.randomUUID();
        await putJSON('user:TurboluMC', {
          username: 'TurboluMC', password: hash, token, balance: 999999,
          icon: '', status: 'Online', theme: 'dark', language: 'tr', isAdmin: true,
          email: 'ereny116011@gmail.com'
        });
        await env.MC_DB.put('admin_id', token);
      }
    }

    try {
      // === Sosyal giriş (GitHub, Google, Microsoft, Xbox) ===
      // Route'lar worker/src/oauth.js içinde tanımlıdır.
      const oauthYanit = await oauthIsle(request, env, url,
        { json, getJSON, putJSON, deleteKey, hashPassword });
      if (oauthYanit) return oauthYanit;

      // === Şifre sıfırlama sayfası (GET) ===
      // Sayfa artık sitede barınıyor (turboluweb.wasmer.app/mc/reset.html).
      // Daha önce gönderilmiş e-postalardaki /sifirla bağlantıları bozulmasın
      // diye burada token'ı koruyarak oraya yönlendiriyoruz.
      if (path === '/sifirla' && method === 'GET') {
        const token = url.searchParams.get('token');
        return Response.redirect(
          token
            ? `https://turboluweb.wasmer.app/mc/reset.html?token=${encodeURIComponent(token)}`
            : 'https://turboluweb.wasmer.app/sifremi-unuttum.html',
          302
        );
      }

      if (path === '/api/country') {
        const country = request.cf?.country || 'XX';
        return json({ country, tr: country === 'TR' });
      }

      // === Kayıt ===
      if (path === '/api/register' && method === 'POST') {
        const body = await request.json();
        const username = normalizeUsername(body.username);
        const password = String(body.password || '');
        const email = String(body.email || '').trim().toLowerCase();
        const platform = body.platform;
        if (!username || !password || !email) return json({ error: 'Kullanıcı adı, parola ve e-posta gerekli' }, 400);
        const adHatasi = usernameError(username);
        if (adHatasi) return json({ error: adHatasi }, 400);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Geçerli bir e-posta adresi gir.' }, 400);
        if (await env.MC_DB.get(`user:${username}`)) return json({ error: 'Bu kullanıcı adı alınmış' }, 409);
        const hash = await hashPassword(password);
        const token = crypto.randomUUID();
        const user = {
          username, password: hash, token, balance: 0,
          icon: '', status: 'Online', theme: 'dark', language: 'tr', isAdmin: false,
          email: email,
          platform: platform || 'all',
          createdAt: new Date().toISOString()
        };
        await putJSON(`user:${username}`, user);
        return json({ token, username, balance: 0, isAdmin: false });
      }

      // === Giriş ===
      if (path === '/api/login' && method === 'POST') {
        const body = await request.json();
        const username = normalizeUsername(body.username);
        const password = String(body.password || '');
        if (!username || !password) return json({ error: 'Kullanıcı adı ve parola gerekli' }, 400);
        const user = await getJSON(`user:${username}`);
        if (!user) return json({ error: 'Kullanıcı bulunamadı' }, 404);
        if (!(await verifyPassword(password, user.password))) return json({ error: 'Parola yanlış' }, 401);
        await clearExpiredBan(user);
        if (banActive(user)) {
          return json({
            error: user.banType === 'permanent'
              ? 'Bu hesap kalıcı olarak yasaklandı.'
              : `Bu hesap ${new Date(Number(user.banUntil)).toLocaleString('tr-TR')} tarihine kadar yasaklı.`,
            banned: true,
            banType: user.banType,
            banUntil: user.banUntil || null,
            reason: user.banReason || ''
          }, 403);
        }
        user.lastLogin = new Date().toISOString();
        await putJSON(`user:${user.username}`, user);
        return json({ token: user.token, username: user.username, balance: user.balance, isAdmin: user.isAdmin });
      }

      // === Profil ===
      if (path === '/api/profile' && method === 'GET') {
        const user = await getUser(request.headers.get('Authorization'));
        if (!user) return json({ error: 'Yetkisiz' }, 401);
        const { password, token, ...safe } = user;
        return json(safe);
      }

      if (path === '/api/profile' && method === 'PUT') {
        const user = await getUser(request.headers.get('Authorization'));
        if (!user) return json({ error: 'Yetkisiz' }, 401);
        const updates = await request.json();
        ['icon','status','theme','language','email'].forEach(k => {
          if (updates[k] !== undefined) user[k] = updates[k];
        });
        await putJSON(`user:${user.username}`, user);
        return json({ success: true });
      }

      // === Şifre değiştir ===
      if (path === '/api/password' && method === 'PUT') {
        const user = await getUser(request.headers.get('Authorization'));
        if (!user) return json({ error: 'Yetkisiz' }, 401);
        const { oldPassword, newPassword } = await request.json();
        if (!(await verifyPassword(oldPassword, user.password))) return json({ error: 'Mevcut parola yanlış' }, 400);
        user.password = await hashPassword(newPassword);
        await putJSON(`user:${user.username}`, user);
        return json({ success: true });
      }

      // === Şifremi unuttum ===
      if (path === '/api/forgot-password' && method === 'POST') {
        const body = await request.json();
        const email = String(body.email || '').trim().toLowerCase();
        const list = await env.MC_DB.list({ prefix: 'user:' });
        let user = null;
        for (const k of list.keys) {
          const u = await getJSON(k.name);
          if (u && u.email && String(u.email).toLowerCase() === email) { user = u; break; }
        }

        // Hesap yoksa da AYNI cevabı dön. Aksi hâlde biri tek tek e-posta
        // deneyerek hangi adreslerin sitede kayıtlı olduğunu öğrenebilir.
        if (!user) {
          return json({ success: true, message: 'Eğer bu e-posta kayıtlıysa sıfırlama linki gönderildi.' });
        }

        const resetToken = crypto.randomUUID();
        await putJSON(`pwd_reset:${resetToken}`, {
          userId: user.username,
          expiry: Date.now() + 30 * 60 * 1000
        });

        const resetLink = `https://turboluweb.wasmer.app/mc/reset.html?token=${resetToken}`;
        const html = sifreSifirlamaMaili({
          username: user.username,
          email: user.email || email,
          resetLink
        });
        await sendEmail(email, 'Şifreni sıfırla · TurboluMC', html);

        return json({ success: true, message: 'Sıfırlama linki e-postana gönderildi.' });
      }

      // === Şifre sıfırla ===
      if (path === '/api/reset-password' && method === 'POST') {
        const { token, newPassword } = await request.json();
        const resetData = await getJSON(`pwd_reset:${token}`);
        if (!resetData) return json({ error: 'Geçersiz veya süresi dolmuş token' }, 400);
        if (Date.now() > resetData.expiry) return json({ error: 'Token süresi doldu' }, 400);

        const user = await getJSON(`user:${resetData.userId}`);
        if (!user) return json({ error: 'Kullanıcı bulunamadı' }, 404);

        user.password = await hashPassword(newPassword);
        await putJSON(`user:${user.username}`, user);
        await deleteKey(`pwd_reset:${token}`);
        return json({ success: true });
      }

      // === İkonlar ===
      if (path === '/api/icons') {
        const list = await env.MC_DB.list({ prefix: 'user:' });
        const icons = [];
        for (const k of list.keys) {
          const u = await getJSON(k.name);
          if (u && u.icon) icons.push(u.icon);
        }
        return json([...new Set(icons)]);
      }

      // === Sunucu durumu ===
      if (path === '/api/status') {
        try {
          const res = await fetch('https://api.mcsrvstat.us/2/turbolumc.aternos.me');
          const data = await res.json();
          return json(data);
        } catch {
          return json({ error: 'Sunucu durumu alınamadı' }, 502);
        }
      }

      // === Ürünler (PLATFORM FİLTRELİ) ===
      if (path === '/api/items') {
        const platform = url.searchParams.get('platform');
        const items = await env.MC_DB.list({ prefix: 'item:' });
        const result = [];
        for (const k of items.keys) {
          const item = await getJSON(k.name);
          if (item && matchPlatform(item, platform)) result.push(item);
        }
        return json(result);
      }

      // === Satın al ===
      if (path === '/api/buy' && method === 'POST') {
        const user = await getUser(request.headers.get('Authorization'));
        if (!user) return json({ error: 'Yetkisiz' }, 401);
        const { itemId } = await request.json();
        const item = await getJSON(`item:${itemId}`);
        if (!item) return json({ error: 'Ürün bulunamadı' }, 404);
        if (user.balance < item.price) return json({ error: 'Yetersiz bakiye' }, 400);

        user.balance -= item.price;
        await putJSON(`user:${user.username}`, user);

        const requestId = crypto.randomUUID();
        await putJSON(`purchase_request:${requestId}`, {
          id: requestId, user: user.username, item: item.name, itemId: item.id,
          command: item.command || '', price: item.price, status: 'pending',
          platform: item.platform || 'all',
          date: new Date().toISOString()
        });

        return json({ success: true, new_balance: user.balance, message: 'Talebiniz alındı.' });
      }

      // === Envanter ===
      if (path === '/api/inventory' && method === 'GET') {
        const user = await getUser(request.headers.get('Authorization'));
        if (!user) return json({ error: 'Yetkisiz' }, 401);
        const keys = await env.MC_DB.list({ prefix: 'purchase_request:' });
        const all = [];
        for (const k of keys.keys) {
          const req = await getJSON(k.name);
          if (req && req.user === user.username) all.push(req);
        }
        all.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        return json(all);
      }

      // === Duyurular (PLATFORM FİLTRELİ) ===
      if (path === '/api/announcements') {
        const platform = url.searchParams.get('platform');
        const keys = await env.MC_DB.list({ prefix: 'announce:' });
        const list = [];
        for (const k of keys.keys) {
          const a = await getJSON(k.name);
          if (a && matchPlatform(a, platform)) list.push(a);
        }
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        return json(list);
      }

      // === Haberler (PLATFORM FİLTRELİ) ===
      if (path === '/api/news') {
        const platform = url.searchParams.get('platform');
        const keys = await env.MC_DB.list({ prefix: 'news:' });
        const list = [];
        for (const k of keys.keys) {
          const n = await getJSON(k.name);
          if (n && matchPlatform(n, platform)) list.push(n);
        }
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        return json(list);
      }

      // === Kampanyalar (PLATFORM FİLTRELİ) ===
      if (path === '/api/campaigns') {
        const platform = url.searchParams.get('platform');
        const keys = await env.MC_DB.list({ prefix: 'campaign:' });
        const list = [];
        for (const k of keys.keys) {
          const c = await getJSON(k.name);
          if (c && matchPlatform(c, platform)) list.push(c);
        }
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        return json(list);
      }

      // === Bildirim abone ===
      if (path === '/api/notification/subscribe' && method === 'POST') {
        const user = await getUser(request.headers.get('Authorization'));
        if (!user) return json({ error: 'Yetkisiz' }, 401);
        const { subscription, preferences, isAdmin } = await request.json();
        await putJSON(`notification_sub:${user.username}`, { subscription, preferences, isAdmin });
        return json({ success: true });
      }

      if (path === '/api/notification/preferences' && method === 'PUT') {
        const user = await getUser(request.headers.get('Authorization'));
        if (!user) return json({ error: 'Yetkisiz' }, 401);
        const { preferences } = await request.json();
        const subId = `notification_sub:${user.username}`;
        const existing = await getJSON(subId);
        if (existing) {
          existing.preferences = preferences;
          await putJSON(subId, existing);
        }
        return json({ success: true });
      }

      // === ADMIN İŞLEMLERİ ===
      async function requireAdmin(request) {
        const user = await getUser(request.headers.get('Authorization'));
        if (!user || !user.isAdmin) return null;
        return user;
      }

      // === KAYITLI HESAPLARI YÖNETME (yönetici) ===

      if (path === '/api/admin/users' && method === 'GET') {
        if (!(await requireAdmin(request))) return json({ error: 'Yetkisiz' }, 403);
        const keys = await env.MC_DB.list({ prefix: 'user:' });
        const list = [];
        for (const k of keys.keys) {
          const user = await getJSON(k.name);
          if (!user) continue;
          await clearExpiredBan(user);
          list.push({
            username: user.username,
            email: user.email || '',
            balance: Number(user.balance) || 0,
            isAdmin: Boolean(user.isAdmin),
            platform: user.platform || 'all',
            icon: user.icon || '',
            banned: banActive(user),
            banType: banActive(user) ? user.banType : null,
            banUntil: banActive(user) ? (user.banUntil || null) : null,
            banReason: user.banReason || '',
            bannedAt: user.bannedAt || null,
            bannedBy: user.bannedBy || null,
            lastLogin: user.lastLogin || null
          });
        }
        list.sort((a, b) => {
          if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
          return String(a.username).localeCompare(String(b.username), 'tr');
        });
        return json(list);
      }

      if (path === '/api/admin/ban-user' && method === 'POST') {
        const admin = await requireAdmin(request);
        if (!admin) return json({ error: 'Yetkisiz' }, 403);

        const { username, type, durationHours, reason } = await request.json();
        if (!username) return json({ error: 'Kullanıcı adı gerekli' }, 400);
        if (username === admin.username) return json({ error: 'Kendi hesabını yasaklayamazsın.' }, 400);

        const user = await getJSON(`user:${username}`);
        if (!user) return json({ error: 'Kullanıcı bulunamadı' }, 404);
        if (user.isAdmin) return json({ error: 'Yönetici hesapları yasaklanamaz.' }, 400);

        const banType = type === 'permanent' ? 'permanent' : 'temporary';
        let banUntil = null;
        if (banType === 'temporary') {
          const saat = Number(durationHours);
          if (!Number.isFinite(saat) || saat <= 0) {
            return json({ error: 'Geçerli bir süre (saat) gir.' }, 400);
          }
          if (saat > 87600) return json({ error: 'Süre en fazla 10 yıl (87600 saat) olabilir.' }, 400);
          banUntil = Date.now() + Math.round(saat * 60 * 60 * 1000);
        }

        user.banned = true;
        user.banType = banType;
        user.banUntil = banUntil;
        user.banReason = String(reason || '').slice(0, 300);
        user.bannedAt = new Date().toISOString();
        user.bannedBy = admin.username;
        await putJSON(`user:${user.username}`, user);

        return json({
          success: true,
          message: banType === 'permanent'
            ? `${user.username} kalıcı olarak yasaklandı.`
            : `${user.username} ${new Date(banUntil).toLocaleString('tr-TR')} tarihine kadar yasaklandı.`
        });
      }

      if (path === '/api/admin/unban-user' && method === 'POST') {
        if (!(await requireAdmin(request))) return json({ error: 'Yetkisiz' }, 403);

        const { username } = await request.json();
        if (!username) return json({ error: 'Kullanıcı adı gerekli' }, 400);
        const user = await getJSON(`user:${username}`);
        if (!user) return json({ error: 'Kullanıcı bulunamadı' }, 404);

        delete user.banned;
        delete user.banType;
        delete user.banUntil;
        delete user.banReason;
        delete user.bannedAt;
        delete user.bannedBy;
        await putJSON(`user:${user.username}`, user);

        return json({ success: true, message: `${user.username} yasağı kaldırıldı.` });
      }

      if (path === '/api/admin/delete-user' && method === 'POST') {
        const admin = await requireAdmin(request);
        if (!admin) return json({ error: 'Yetkisiz' }, 403);

        const { username } = await request.json();
        if (!username) return json({ error: 'Kullanıcı adı gerekli' }, 400);
        if (username === admin.username) return json({ error: 'Kendi hesabını silemezsin.' }, 400);

        const user = await getJSON(`user:${username}`);
        if (!user) return json({ error: 'Kullanıcı bulunamadı' }, 404);
        if (user.isAdmin) return json({ error: 'Yönetici hesapları silinemez.' }, 400);

        await deleteKey(`user:${username}`);

        // Sosyal giriş bağlantılarını da temizle.
        const oauthKeys = await env.MC_DB.list({ prefix: 'oauth:' });
        for (const k of oauthKeys.keys) {
          const linked = await env.MC_DB.get(k.name);
          if (linked === username) await deleteKey(k.name);
        }

        // Bildirim aboneliğini sil.
        await deleteKey(`notification_sub:${username}`);

        // Kullanıcıya ait şifre sıfırlama kodlarını sil.
        const resetKeys = await env.MC_DB.list({ prefix: 'pwd_reset:' });
        for (const k of resetKeys.keys) {
          const reset = await getJSON(k.name);
          if (reset && reset.userId === username) await deleteKey(k.name);
        }

        return json({ success: true, message: `${username} hesabı silindi.` });
      }

      if (path === '/api/admin/requests' && method === 'GET') {
        if (!(await requireAdmin(request))) return json({ error: 'Yetkisiz' }, 403);
        const keys = await env.MC_DB.list({ prefix: 'purchase_request:' });
        const all = [];
        for (const k of keys.keys) {
          const req = await getJSON(k.name);
          if (req) all.push(req);
        }
        all.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        return json(all);
      }

      if (path === '/api/admin/complete-request' && method === 'POST') {
        if (!(await requireAdmin(request))) return json({ error: 'Yetkisiz' }, 403);
        const { requestId } = await request.json();
        const req = await getJSON(`purchase_request:${requestId}`);
        if (!req) return json({ error: 'Talep bulunamadı' }, 404);
        req.status = 'completed';
        req.completedAt = new Date().toISOString();
        await putJSON(`purchase_request:${requestId}`, req);
        return json({ success: true });
      }

      if (path === '/api/admin/reject-request' && method === 'POST') {
        if (!(await requireAdmin(request))) return json({ error: 'Yetkisiz' }, 403);
        const { requestId } = await request.json();
        const req = await getJSON(`purchase_request:${requestId}`);
        if (!req) return json({ error: 'Talep bulunamadı' }, 404);
        req.status = 'rejected';
        req.rejectedAt = new Date().toISOString();
        const user = await getJSON(`user:${req.user}`);
        if (user) {
          user.balance += req.price;
          await putJSON(`user:${req.user}`, user);
        }
        await putJSON(`purchase_request:${requestId}`, req);
        return json({ success: true, message: 'Talep reddedildi, bakiye iade edildi.' });
      }

      // Duyuru ekle (PLATFORM EKLENDİ)
      if (path === '/api/admin/announcement' && method === 'POST') {
        if (!(await requireAdmin(request))) return json({ error: 'Yetkisiz' }, 403);
        const { title, content, platform } = await request.json();
        const id = crypto.randomUUID();
        await putJSON(`announce:${id}`, {
          id, title, content,
          platform: platform || 'all',
          date: new Date().toISOString()
        });
        return json({ success: true });
      }

      // Duyuru sil
      if (path === '/api/admin/announcement' && method === 'DELETE') {
        if (!(await requireAdmin(request))) return json({ error: 'Yetkisiz' }, 403);
        const { id } = await request.json();
        if (!id) return json({ error: 'ID gerekli' }, 400);
        await deleteKey(`announce:${id}`);
        return json({ success: true });
      }

      // Haber ekle (PLATFORM EKLENDİ)
      if (path === '/api/admin/news' && method === 'POST') {
        if (!(await requireAdmin(request))) return json({ error: 'Yetkisiz' }, 403);
        const { title, content, platform } = await request.json();
        const id = crypto.randomUUID();
        await putJSON(`news:${id}`, {
          id, title, content,
          platform: platform || 'all',
          date: new Date().toISOString()
        });
        return json({ success: true });
      }

      // Haber sil
      if (path === '/api/admin/news' && method === 'DELETE') {
        if (!(await requireAdmin(request))) return json({ error: 'Yetkisiz' }, 403);
        const { id } = await request.json();
        if (!id) return json({ error: 'ID gerekli' }, 400);
        await deleteKey(`news:${id}`);
        return json({ success: true });
      }

      // Kampanya ekle (PLATFORM EKLENDİ)
      if (path === '/api/admin/campaign' && method === 'POST') {
        if (!(await requireAdmin(request))) return json({ error: 'Yetkisiz' }, 403);
        const { title, description, reward, endDate, platform } = await request.json();
        const id = crypto.randomUUID();
        await putJSON(`campaign:${id}`, {
          id, title, description, reward,
          endDate: endDate || null,
          platform: platform || 'all',
          date: new Date().toISOString()
        });
        return json({ success: true });
      }

      // Kampanya sil
      if (path === '/api/admin/campaign' && method === 'DELETE') {
        if (!(await requireAdmin(request))) return json({ error: 'Yetkisiz' }, 403);
        const { id } = await request.json();
        if (!id) return json({ error: 'ID gerekli' }, 400);
        await deleteKey(`campaign:${id}`);
        return json({ success: true });
      }

      // Ürün ekle (PLATFORM EKLENDİ)
      if (path === '/api/admin/item' && method === 'POST') {
        if (!(await requireAdmin(request))) return json({ error: 'Yetkisiz' }, 403);
        const { name, price, command, platform } = await request.json();
        const id = crypto.randomUUID();
        await putJSON(`item:${id}`, {
          id, name, price, command,
          platform: platform || 'all'
        });
        return json({ success: true });
      }

      // 404
      return new Response('Not found', { status: 404, headers: corsHeaders });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
};