(function () {
  'use strict';

  const API = 'https://shrill-salad-a498.ereny116011.workers.dev';
  const GATEWAY = window.TURBOLU_GATEWAY_URL || API;
  const RELEASES_ENABLED = window.TURBOLU_RELEASES_ENABLED === true;
  const token = () => localStorage.getItem('token') || '';
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = '/site-account.css?v=5';
  document.head.appendChild(style);

  const widget = document.createElement('aside');
  widget.className = 'site-account';
  widget.setAttribute('aria-label', 'Hesap');
  const accountHost = document.querySelector('.site-header .header-inner') ||
    document.querySelector('.navbar') || document.querySelector('.app-header .header-inner');
  (accountHost || document.body).appendChild(widget);
  if (document.querySelector('#userArea') || location.pathname.startsWith('/panel/')) {
    widget.hidden = true;
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'site-account-dialog';
  dialog.setAttribute('aria-labelledby', 'site-account-title');
  dialog.innerHTML = `
    <form method="dialog" class="site-account-close-form"><button class="site-account-close" aria-label="Kapat">×</button></form>
    <h2 id="site-account-title">Turbolu hesabına giriş yap</h2>
    <p class="site-account-hint">MC, Bedrock ve Turbolu Studios hesabınla devam et.</p>
    <form id="site-account-form">
      <label for="site-account-username">Kullanıcı adı</label>
      <input id="site-account-username" name="username" autocomplete="username"
             maxlength="20" minlength="3" autocapitalize="none" autocorrect="off" spellcheck="false" required>
      <label for="site-account-email" class="site-account-email-label" hidden>E-posta</label>
      <input id="site-account-email" name="email" type="email" autocomplete="email"
             inputmode="email" autocapitalize="none" spellcheck="false" hidden>
      <label for="site-account-password">Parola</label>
      <input id="site-account-password" name="password" type="password" autocomplete="current-password" required>
      <p class="site-account-error" role="status" aria-live="polite"></p>
      <button class="site-account-submit" type="submit">Giriş yap</button>
    </form>
    <button type="button" class="site-account-switch">Hesabın yok mu? Kaydol</button>
    <div data-oauth-mount></div>
    <a class="site-account-forgot" href="/sifremi-unuttum.html">Parolamı unuttum</a>`;
  document.body.appendChild(dialog);

  function loadOAuth() {
    if (window.TurboluOAuth) { window.TurboluOAuth.mountAll(dialog); return; }
    const existing = document.querySelector('script[data-turbolu-oauth]');
    if (existing) return;
    const script = document.createElement('script');
    script.src = '/oauth.js?v=3';
    script.dataset.turboluOauth = '1';
    script.onload = () => { if (window.TurboluOAuth) window.TurboluOAuth.mountAll(dialog); };
    document.head.appendChild(script);
  }
  loadOAuth();

  /* ------------------------------------------------------------------ */
  /* Hesap kurulumu: Minecraft adları + doğum tarihi                    */
  /* ------------------------------------------------------------------ */

  const setupDialog = document.createElement('dialog');
  setupDialog.className = 'site-account-dialog site-setup-dialog';
  setupDialog.setAttribute('aria-labelledby', 'site-setup-title');
  setupDialog.innerHTML = `
    <form method="dialog" class="site-account-close-form"><button class="site-account-close" aria-label="Kapat">×</button></form>
    <h2 id="site-setup-title">Hesabını tamamla</h2>
    <p class="site-account-hint">Minecraft kullanıcı adlarını ve doğum tarihini gir. Doğum tarihin yalnızca yaşına göre hediye göstermek için kullanılır, kimseye gösterilmez.</p>
    <form id="site-setup-form" novalidate>
      <label for="site-setup-java">Java sürümü Minecraft adın</label>
      <input id="site-setup-java" name="minecraftJava" autocomplete="off" spellcheck="false"
             maxlength="16" placeholder="Örn. TurboluMC">
      <label for="site-setup-bedrock">Bedrock sürümü oyuncu adın</label>
      <input id="site-setup-bedrock" name="minecraftBedrock" autocomplete="off" spellcheck="false"
             maxlength="20" placeholder="Örn. TurboluMC">
      <label for="site-setup-birth">Doğum tarihi</label>
      <input id="site-setup-birth" name="birthDate" type="date" required>
      <p class="site-account-error" role="status" aria-live="polite"></p>
      <button type="submit" class="site-account-submit">Kaydet</button>
    </form>
    <button type="button" class="site-account-switch" id="site-setup-skip">Şimdilik geç</button>`;
  document.body.appendChild(setupDialog);

  const JAVA_ADI = /^[A-Za-z0-9_]{3,16}$/;
  const BEDROCK_ADI = /^[\p{L}\p{N} _.-]{2,20}$/u;

  function bugun() {
    const simdi = new Date();
    const ay = String(simdi.getMonth() + 1).padStart(2, '0');
    const gun = String(simdi.getDate()).padStart(2, '0');
    return `${simdi.getFullYear()}-${ay}-${gun}`;
  }

  function setupAc(profil) {
    if (!token()) return;
    if (setupDialog.open) return;
    const form = setupDialog.querySelector('#site-setup-form');
    form.reset();
    setupDialog.querySelector('#site-setup-java').value = (profil && profil.minecraftJava) || '';
    setupDialog.querySelector('#site-setup-bedrock').value = (profil && profil.minecraftBedrock) || '';
    setupDialog.querySelector('#site-setup-birth').value = (profil && profil.birthDate) || '';
    setupDialog.querySelector('#site-setup-birth').max = bugun();
    setupDialog.querySelector('.site-account-error').textContent = '';
    setupDialog.showModal();
    setTimeout(() => setupDialog.querySelector('#site-setup-java').focus(), 60);
  }

  /* Kurulum tamamlanmamış hesaplar için ekranı aç.
     Kullanıcı "şimdilik geç" dediyse aynı hesap için bir daha zorlanmaz;
     profil sayfasından yeniden açılabilir. */
  function setupGerekliMi(profil) {
    if (!profil || profil.error) return;
    if (profil.setupCompleted !== false) return;
    const ad = String(profil.username || '');
    try {
      if (localStorage.getItem('turboluSetupSkipped') === ad) return;
    } catch (_) { /* yoksay */ }
    setupAc(profil);
  }

  setupDialog.querySelector('#site-setup-skip').addEventListener('click', () => {
    try {
      if (currentUser && currentUser.username) {
        localStorage.setItem('turboluSetupSkipped', currentUser.username);
      }
    } catch (_) { /* yoksay */ }
    setupDialog.close();
  });

  setupDialog.querySelector('#site-setup-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const hata = setupDialog.querySelector('.site-account-error');
    const gonder = setupDialog.querySelector('.site-account-submit');
    hata.textContent = '';

    const java = setupDialog.querySelector('#site-setup-java').value.trim();
    const bedrock = setupDialog.querySelector('#site-setup-bedrock').value.trim();
    const dogum = setupDialog.querySelector('#site-setup-birth').value;

    if (!java && !bedrock) { hata.textContent = 'En az bir Minecraft kullanıcı adı gerekli.'; return; }
    if (java && !JAVA_ADI.test(java)) { hata.textContent = 'Java adı 3-16 karakter olmalı (harf, rakam, alt çizgi).'; return; }
    if (bedrock && !BEDROCK_ADI.test(bedrock)) { hata.textContent = 'Bedrock adı 2-20 karakter olabilir.'; return; }
    if (!dogum) { hata.textContent = 'Doğum tarihini seç.'; return; }
    if (dogum > bugun()) { hata.textContent = 'Doğum tarihi gelecekte olamaz.'; return; }

    gonder.disabled = true;
    const eskiMetin = gonder.textContent;
    gonder.textContent = 'Kaydediliyor…';
    try {
      const response = await fetch(`${API}/api/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minecraftJava: java,
          minecraftBedrock: bedrock,
          birthDate: dogum,
          setupCompleted: true
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.error) throw new Error(data.error || 'Kurulum kaydedilemedi.');
      setupDialog.close();
      try { localStorage.removeItem('turboluSetupSkipped'); } catch (_) { /* yoksay */ }
      window.dispatchEvent(new CustomEvent('turbolu:setup-complete', { detail: data }));
    } catch (err) {
      hata.textContent = err.message || 'Kurulum kaydedilemedi.';
      gonder.disabled = false;
      gonder.textContent = eskiMetin;
    }
  });

  const releaseDialog = document.createElement('dialog');
  releaseDialog.className = 'site-release-dialog';
  releaseDialog.setAttribute('aria-labelledby', 'site-release-title');
  releaseDialog.innerHTML = `
    <button class="site-release-close" type="button" aria-label="Sürüm notunu kapat">×</button>
    <p class="site-release-kicker">TURBOLU TIKLA · YENİ SÜRÜM</p>
    <p class="site-release-version"></p>
    <h2 id="site-release-title"></h2>
    <div class="site-release-notes"></div>
    <button class="site-release-confirm" type="button">Anladım</button>`;
  document.body.appendChild(releaseDialog);

  let registerMode = false;
  let currentUser = null;
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);

  async function getProfile() {
    if (!token()) return null;
    try {
      const response = await fetch(`${API}/api/profile`, { headers: { Authorization: `Bearer ${token()}` } });
      if (response.status === 401 || response.status === 403) {
        // Geçersiz/eski oturum: kullanıcıyı temizle ki giriş düğmeleri görünsün.
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return null;
      }
      if (!response.ok) return null;
      return await response.json();
    } catch (_) { return null; }
  }

  function updateDialogMode() {
    dialog.querySelector('#site-account-title').textContent = registerMode ? 'Turbolu hesabı oluştur' : 'Turbolu hesabına giriş yap';
    dialog.querySelector('.site-account-submit').textContent = registerMode ? 'Kaydol' : 'Giriş yap';
    dialog.querySelector('.site-account-switch').textContent = registerMode ? 'Zaten hesabın var mı? Giriş yap' : 'Hesabın yok mu? Kaydol';
    dialog.querySelector('.site-account-email-label').hidden = !registerMode;
    dialog.querySelector('#site-account-email').hidden = !registerMode;
    dialog.querySelector('#site-account-email').required = registerMode;
    dialog.querySelector('#site-account-password').autocomplete = registerMode ? 'new-password' : 'current-password';
  }

  function openDialog(mode) {
    registerMode = mode === 'register';
    const form = dialog.querySelector('#site-account-form');
    form.reset();
    dialog.querySelector('.site-account-error').textContent = '';
    dialog.querySelector('.site-account-submit').disabled = false;
    updateDialogMode();
    if (!dialog.open) dialog.showModal();
    setTimeout(() => dialog.querySelector('#site-account-username').focus(), 60);
  }

  function renderAccount(profile) {
    currentUser = profile || null;
    const username = profile && profile.username;
    widget.innerHTML = username
      ? `<span class="site-account-name">${esc(username)}</span>${profile.isAdmin ? '<a class="site-account-admin" href="/panel/">Yönetim</a>' : ''}<button class="site-account-logout" type="button">Çıkış</button>`
      : '<button class="site-account-open" type="button" data-account-mode="login">Giriş yap</button><button class="site-account-open" type="button" data-account-mode="register">Kaydol</button>';
    const logout = widget.querySelector('.site-account-logout');
    if (logout) logout.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('turboluSetupSkipped');
      location.reload();
    });
    widget.querySelectorAll('.site-account-open').forEach(open => open.addEventListener('click', () => {
      openDialog(open.dataset.accountMode);
    }));
  }

  dialog.querySelector('.site-account-switch').addEventListener('click', event => {
    registerMode = !registerMode;
    dialog.querySelector('.site-account-error').textContent = '';
    dialog.querySelector('#site-account-email').value = '';
    updateDialogMode();
    event.currentTarget.blur();
  });

  dialog.querySelector('#site-account-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const error = dialog.querySelector('.site-account-error');
    const submit = dialog.querySelector('.site-account-submit');
    if (submit.disabled) return;

    const username = String(form.get('username') || '').trim().replace(/\s+/g, ' ');
    const password = String(form.get('password') || '');
    const email = String(form.get('email') || '').trim();

    error.textContent = '';
    if (!username) { error.textContent = 'Kullanıcı adı gerekli.'; return; }
    if ([...username].length < 3) { error.textContent = 'Kullanıcı adı en az 3 karakter olmalı.'; return; }
    if (!password) { error.textContent = 'Parola gerekli.'; return; }

    submit.disabled = true;
    const eskiEtiket = submit.textContent;
    submit.textContent = registerMode ? 'Kaydediliyor…' : 'Giriş yapılıyor…';
    try {
      const mode = registerMode ? 'register' : 'login';
      const response = await fetch(`${API}/api/${mode}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerMode
          ? { username, password, email, platform: 'all' }
          : { username, password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.error) throw new Error(data.error || 'İşlem tamamlanamadı.');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      dialog.close();
      location.reload();
    } catch (err) {
      error.textContent = err.message || 'Sunucuya ulaşılamadı.';
      submit.disabled = false;
      submit.textContent = eskiEtiket;
    }
  });

  async function showReleaseNotes() {
    if (!GATEWAY || !RELEASES_ENABLED) return;
    try {
      const response = await fetch(`${GATEWAY}/api/releases/latest`);
      if (!response.ok) return;
      const release = await response.json();
      if (!release.version || localStorage.getItem('dismissedReleaseVersion') === release.version) return;
      releaseDialog.querySelector('.site-release-version').textContent = `Sürüm ${release.version}`;
      releaseDialog.querySelector('#site-release-title').textContent = release.title || 'Yenilikler';
      releaseDialog.querySelector('.site-release-notes').textContent = release.notes || '';
      const close = () => {
        localStorage.setItem('dismissedReleaseVersion', release.version);
        releaseDialog.close();
      };
      releaseDialog.querySelector('.site-release-close').onclick = close;
      releaseDialog.querySelector('.site-release-confirm').onclick = close;
      releaseDialog.addEventListener('cancel', () => localStorage.setItem('dismissedReleaseVersion', release.version), { once: true });
      releaseDialog.showModal();
    } catch (_) { /* Sürüm notu servisi kullanılamıyorsa sayfa normal çalışır. */ }
  }

  /* Dış sayfalar (MC, Bedrock) da kurulum ekranını tetikleyebilsin. */
  window.TurboluSetup = { open: setupAc, check: setupGerekliMi };

  getProfile().then((profile) => {
    renderAccount(profile);
    setupGerekliMi(profile);
  });
  showReleaseNotes();
})();
