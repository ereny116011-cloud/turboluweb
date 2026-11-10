(function () {
  'use strict';

  const API = 'https://shrill-salad-a498.ereny116011.workers.dev';
  const GATEWAY = window.TURBOLU_GATEWAY_URL || API;
  const RELEASES_ENABLED = window.TURBOLU_RELEASES_ENABLED === true;
  const token = () => localStorage.getItem('token') || '';
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = '/site-account.css?v=3';
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
    script.src = '/oauth.js?v=1';
    script.dataset.turboluOauth = '1';
    script.onload = () => { if (window.TurboluOAuth) window.TurboluOAuth.mountAll(dialog); };
    document.head.appendChild(script);
  }
  loadOAuth();

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
    const username = profile && profile.username;
    widget.innerHTML = username
      ? `<span class="site-account-name">${esc(username)}</span>${profile.isAdmin ? '<a class="site-account-admin" href="/panel/">Yönetim</a>' : ''}<button class="site-account-logout" type="button">Çıkış</button>`
      : '<button class="site-account-open" type="button" data-account-mode="login">Giriş yap</button><button class="site-account-open" type="button" data-account-mode="register">Kaydol</button>';
    const logout = widget.querySelector('.site-account-logout');
    if (logout) logout.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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

  getProfile().then(renderAccount);
  showReleaseNotes();
})();
