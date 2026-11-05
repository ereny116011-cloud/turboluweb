(function () {
  'use strict';

  const API = 'https://shrill-salad-a498.ereny116011.workers.dev';
  const GATEWAY = window.TURBOLU_GATEWAY_URL || API;
  const token = () => localStorage.getItem('token') || '';
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = '/site-account.css?v=1';
  document.head.appendChild(style);

  const widget = document.createElement('aside');
  widget.className = 'site-account';
  widget.setAttribute('aria-label', 'Hesap');
  document.body.appendChild(widget);

  const dialog = document.createElement('dialog');
  dialog.className = 'site-account-dialog';
  dialog.setAttribute('aria-labelledby', 'site-account-title');
  dialog.innerHTML = `
    <form method="dialog" class="site-account-close-form"><button class="site-account-close" aria-label="Kapat">×</button></form>
    <h2 id="site-account-title">Turbolu hesabına giriş yap</h2>
    <p class="site-account-hint">MC, Bedrock ve Turbolu Studios hesabınla devam et.</p>
    <form id="site-account-form">
      <label for="site-account-username">Kullanıcı adı</label>
      <input id="site-account-username" name="username" autocomplete="username" required>
      <label for="site-account-email" class="site-account-email-label" hidden>E-posta</label>
      <input id="site-account-email" name="email" type="email" autocomplete="email" hidden>
      <label for="site-account-password">Parola</label>
      <input id="site-account-password" name="password" type="password" autocomplete="current-password" required>
      <p class="site-account-error" role="status" aria-live="polite"></p>
      <button class="site-account-submit" type="submit">Giriş yap</button>
    </form>
    <button type="button" class="site-account-switch">Hesabın yok mu? Kaydol</button>
    <a class="site-account-forgot" href="/sifremi-unuttum.html">Parolamı unuttum</a>`;
  document.body.appendChild(dialog);

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
      if (!response.ok) return null;
      return await response.json();
    } catch (_) { return null; }
  }

  function renderAccount(profile) {
    const username = profile && profile.username;
    widget.innerHTML = username
      ? `<span class="site-account-name">${esc(username)}</span>${profile.isAdmin ? '<a class="site-account-admin" href="/panel/">Yönetim</a>' : ''}<button class="site-account-logout" type="button">Çıkış</button>`
      : '<button class="site-account-open" type="button">Giriş yap</button>';
    const logout = widget.querySelector('.site-account-logout');
    if (logout) logout.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      location.reload();
    });
    const open = widget.querySelector('.site-account-open');
    if (open) open.addEventListener('click', () => dialog.showModal());
  }

  dialog.querySelector('.site-account-switch').addEventListener('click', event => {
    registerMode = !registerMode;
    dialog.querySelector('#site-account-title').textContent = registerMode ? 'Turbolu hesabı oluştur' : 'Turbolu hesabına giriş yap';
    dialog.querySelector('.site-account-submit').textContent = registerMode ? 'Kaydol' : 'Giriş yap';
    dialog.querySelector('.site-account-switch').textContent = registerMode ? 'Zaten hesabın var mı? Giriş yap' : 'Hesabın yok mu? Kaydol';
    dialog.querySelector('.site-account-email-label').hidden = !registerMode;
    dialog.querySelector('#site-account-email').hidden = !registerMode;
    dialog.querySelector('#site-account-email').required = registerMode;
    dialog.querySelector('#site-account-password').autocomplete = registerMode ? 'new-password' : 'current-password';
    event.currentTarget.blur();
  });

  dialog.querySelector('#site-account-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const error = dialog.querySelector('.site-account-error');
    const submit = dialog.querySelector('.site-account-submit');
    error.textContent = '';
    submit.disabled = true;
    try {
      const mode = registerMode ? 'register' : 'login';
      const response = await fetch(`${API}/api/${mode}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: String(form.get('username') || '').trim(),
          password: String(form.get('password') || ''),
          ...(registerMode ? { email: String(form.get('email') || '').trim(), platform: 'all' } : {})
        })
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'İşlem tamamlanamadı.');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      dialog.close();
      location.reload();
    } catch (err) {
      error.textContent = err.message || 'Sunucuya ulaşılamadı.';
    } finally { submit.disabled = false; }
  });

  async function showReleaseNotes() {
    if (!GATEWAY) return;
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
